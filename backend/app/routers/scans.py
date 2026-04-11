from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
import re, csv, io

from app.db.database import get_db
from app.models.scan import Scan
from app.models.tool import DiscoveredTool
from app.models.override import ToolOverride
from app.models.triage import TriageItem
from app.schemas.scan import ScanOut
from app.services.risk_service import lookup_tool, score_tool
from app.services.classifier import classify_domain, ClassificationResult

router = APIRouter()


# ── Apply org override to a result ───────────────────────────────────────────

async def _apply_override(db: AsyncSession, domain: str, tool_data: dict) -> dict:
    override = await db.scalar(
        select(ToolOverride).where(ToolOverride.domain == domain.lower())
    )
    if not override:
        return tool_data
    if override.decision == "APPROVED":
        tool_data.update(risk_level="LOW", risk_score=2.0)
    elif override.decision == "BLOCKED":
        tool_data.update(risk_level="CRITICAL", risk_score=9.5)
    elif override.decision == "RESCORE" and override.override_score is not None:
        tool_data.update(risk_level=override.override_level, risk_score=override.override_score)
    tool_data["override_active"] = True
    tool_data["override_by"] = override.reviewed_by
    tool_data["override_notes"] = override.notes
    return tool_data


# ── Add unknown domain to triage queue ───────────────────────────────────────

async def _queue_triage(db: AsyncSession, domain: str, source: str):
    existing = await db.scalar(select(TriageItem).where(TriageItem.domain == domain))
    if existing:
        existing.seen_count += 1
        existing.last_seen = datetime.utcnow()
        if source not in (existing.source or ""):
            existing.source = f"{existing.source},{source}" if existing.source else source
    else:
        db.add(TriageItem(domain=domain, source=source, status="PENDING"))


# ── Upsert tool ───────────────────────────────────────────────────────────────

async def _upsert_tool(db: AsyncSession, tool_data: dict):
    domain = tool_data.get("domain")
    skip_keys = {"override_active", "override_by", "override_notes"}
    clean = {k: v for k, v in tool_data.items() if k not in skip_keys}
    if domain:
        existing = await db.scalar(
            select(DiscoveredTool).where(DiscoveredTool.domain == domain)
        )
        if existing:
            for k, v in clean.items():
                if hasattr(existing, k):
                    setattr(existing, k, v)
            return
    db.add(DiscoveredTool(**clean))


# ── Core: classify + persist one domain ──────────────────────────────────────

async def _process_domain(domain: str, source: str, db: AsyncSession) -> Optional[dict]:
    """
    Classify a domain and either:
    - Return a tool dict (known tool → save to inventory)
    - Queue for triage (unknown → analyst review)
    - Return None (already in triage, skip)
    """
    result: ClassificationResult = classify_domain(domain, lookup_tool, score_tool)

    if result.status == "UNCLASSIFIED":
        await _queue_triage(db, domain, source)
        return None

    # Build tool dict from classification
    p = result.profile or {}
    tool_data = {
        "name":              p.get("name", domain),
        "domain":            domain,
        "category":          p.get("category"),
        "risk_score":        result.risk_score,
        "risk_level":        result.risk_level,
        "data_classification": p.get("data_classification"),
        "gdpr_relevant":     p.get("gdpr_relevant"),
        "vendor":            p.get("vendor"),
        "source":            source,
        "raw_profile": {
            **p,
            "classification_status": result.status,
            "confidence": result.confidence,
        },
    }

    # Apply any org-level override
    return await _apply_override(db, domain, tool_data)


# ── List scans ────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[ScanOut])
async def list_scans(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Scan).order_by(Scan.created_at.desc()).limit(50))
    return result.scalars().all()


# ── DNS CSV ───────────────────────────────────────────────────────────────────

@router.post("/dns-csv", response_model=ScanOut)
async def upload_dns_csv(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a .csv")

    scan = Scan(scan_type="DNS_CSV", status="running")
    db.add(scan); await db.commit(); await db.refresh(scan)

    try:
        content = await file.read()
        text = content.decode("utf-8", errors="replace")
        reader = csv.DictReader(io.StringIO(text))
        col_candidates = ["domain", "hostname", "query", "fqdn", "name", "destination"]
        domains, seen = [], set()
        for row in reader:
            hl = {k.lower(): k for k in row.keys()}
            for c in col_candidates:
                if c in hl:
                    d = row[hl[c]].strip().lower()
                    if d and d not in seen:
                        seen.add(d); domains.append(d)
                    break

        tools, triage_count = [], 0
        for domain in domains:
            t = await _process_domain(domain, "DNS_CSV", db)
            if t:
                tools.append(t)
                await _upsert_tool(db, t)
            else:
                triage_count += 1

        await db.commit()
        scan.status = "complete"
        scan.tools_found = len(tools)
        scan.completed_at = datetime.utcnow()
        scan.summary = {
            "critical": sum(1 for t in tools if t.get("risk_level") == "CRITICAL"),
            "high":     sum(1 for t in tools if t.get("risk_level") == "HIGH"),
            "medium":   sum(1 for t in tools if t.get("risk_level") == "MEDIUM"),
            "low":      sum(1 for t in tools if t.get("risk_level") == "LOW"),
            "triage":   triage_count,
        }
        await db.commit(); await db.refresh(scan)
    except Exception as e:
        scan.status = "failed"; scan.error = str(e)
        await db.commit(); await db.refresh(scan)
    return scan


# ── Paste ─────────────────────────────────────────────────────────────────────

class PastePayload(BaseModel):
    domains: str

@router.post("/paste", response_model=ScanOut)
async def paste_domains(payload: PastePayload, db: AsyncSession = Depends(get_db)):
    raw = re.split(r"[\n,;\s]+", payload.domains.strip())
    domains = [d.strip().lower() for d in raw if d.strip()]

    scan = Scan(scan_type="PASTE", status="running")
    db.add(scan); await db.commit(); await db.refresh(scan)

    tools, triage_count = [], 0
    for domain in domains:
        t = await _process_domain(domain, "PASTE", db)
        if t:
            tools.append(t); await _upsert_tool(db, t)
        else:
            triage_count += 1
    await db.commit()

    scan.status = "complete"
    scan.tools_found = len(tools)
    scan.completed_at = datetime.utcnow()
    scan.summary = {
        "critical": sum(1 for t in tools if t.get("risk_level") == "CRITICAL"),
        "high":     sum(1 for t in tools if t.get("risk_level") == "HIGH"),
        "medium":   sum(1 for t in tools if t.get("risk_level") == "MEDIUM"),
        "low":      sum(1 for t in tools if t.get("risk_level") == "LOW"),
        "submitted": len(domains), "matched": len(tools), "triage": triage_count,
    }
    await db.commit(); await db.refresh(scan)
    return scan


# ── Manual lookup ─────────────────────────────────────────────────────────────

class ManualPayload(BaseModel):
    query: str
    notes: Optional[str] = None

@router.post("/manual-lookup")
async def manual_lookup(payload: ManualPayload, db: AsyncSession = Depends(get_db)):
    domain = payload.query.strip().lower()
    result = classify_domain(domain, lookup_tool, score_tool)

    if result.status == "UNCLASSIFIED":
        return {
            "found": False,
            "triage_required": True,
            "domain": domain,
            "message": f"'{domain}' is not in the AI tool database. It has been added to the triage queue for analyst review.",
        }

    p = result.profile or {}
    override = await db.scalar(select(ToolOverride).where(ToolOverride.domain == domain))

    return {
        "found":          True,
        "status":         result.status,
        "confidence":     result.confidence,
        "name":           p.get("name", domain),
        "domain":         domain,
        "risk_level":     result.risk_level,
        "risk_score":     result.risk_score,
        "category":       p.get("category"),
        "vendor":         p.get("vendor"),
        "gdpr_relevant":  p.get("gdpr_relevant"),
        "data_leaves_org": p.get("data_leaves_org"),
        "trains_on_data":  p.get("trains_on_data"),
        "sso_available":   p.get("sso_available"),
        "db_notes":        p.get("notes"),
        "override": {
            "active":   True,
            "decision": override.decision,
            "by":       override.reviewed_by,
            "notes":    override.notes,
        } if override else None,
    }

@router.post("/manual-save")
async def manual_save(payload: ManualPayload, db: AsyncSession = Depends(get_db)):
    domain = payload.query.strip().lower()
    result = classify_domain(domain, lookup_tool, score_tool)

    if result.status == "UNCLASSIFIED":
        await _queue_triage(db, domain, "MANUAL")
        await db.commit()
        raise HTTPException(status_code=404, detail=f"'{domain}' not in database — added to triage queue")

    p = result.profile or {}
    tool_data = {
        "name": p.get("name", domain), "domain": domain,
        "category": p.get("category"), "risk_score": result.risk_score,
        "risk_level": result.risk_level,
        "data_classification": p.get("data_classification"),
        "gdpr_relevant": p.get("gdpr_relevant"), "vendor": p.get("vendor"),
        "source": "MANUAL",
        "raw_profile": {**p, "user_notes": payload.notes} if payload.notes else p,
    }
    tool_data = await _apply_override(db, domain, tool_data)
    await _upsert_tool(db, tool_data)
    scan = Scan(scan_type="MANUAL", status="complete", tools_found=1,
                completed_at=datetime.utcnow(),
                summary={"risk_level": result.risk_level, "tool": p.get("name")})
    db.add(scan); await db.commit()
    return {"saved": True, "name": p.get("name"), "risk_level": result.risk_level, "risk_score": result.risk_score}
