from fastapi import APIRouter, Depends, Query
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from io import BytesIO

from app.db.database import get_db
from app.models.tool import DiscoveredTool
from app.models.scan import Scan
from app.services.report_service import build_executive_summary, build_technical_report

router = APIRouter()


async def _get_report_data(db: AsyncSession):
    """Shared data fetch for both report types."""
    total    = await db.scalar(select(func.count()).select_from(DiscoveredTool))
    critical = await db.scalar(select(func.count()).where(DiscoveredTool.risk_level == "CRITICAL"))
    high     = await db.scalar(select(func.count()).where(DiscoveredTool.risk_level == "HIGH"))
    medium   = await db.scalar(select(func.count()).where(DiscoveredTool.risk_level == "MEDIUM"))
    low      = await db.scalar(select(func.count()).where(DiscoveredTool.risk_level == "LOW"))

    tools_r  = await db.execute(select(DiscoveredTool).order_by(DiscoveredTool.risk_score.desc()))
    scans_r  = await db.execute(select(Scan).order_by(Scan.created_at.desc()).limit(20))

    tools = [
        {
            "name":             t.name,
            "domain":           t.domain,
            "category":         t.category,
            "vendor":           t.vendor,
            "risk_level":       t.risk_level,
            "risk_score":       t.risk_score,
            "gdpr_relevant":    t.gdpr_relevant,
            "data_classification": t.data_classification,
            "source":           t.source,
            "raw_profile":      t.raw_profile,
            "first_seen":       t.first_seen.isoformat() if t.first_seen else None,
        }
        for t in tools_r.scalars().all()
    ]
    scans = [
        {
            "id":          s.id,
            "scan_type":   s.scan_type,
            "status":      s.status,
            "tools_found": s.tools_found,
            "summary":     s.summary,
            "created_at":  s.created_at.isoformat() if s.created_at else None,
        }
        for s in scans_r.scalars().all()
    ]
    summary = {
        "total": total or 0,
        "critical": critical or 0,
        "high": high or 0,
        "medium": medium or 0,
        "low": low or 0,
    }
    return summary, tools, scans


@router.get("/preview")
async def report_preview(db: AsyncSession = Depends(get_db)):
    """JSON summary used by the frontend dashboard."""
    summary, tools, _ = await _get_report_data(db)
    return JSONResponse({
        "summary": {
            "total_tools": summary["total"],
            "critical":    summary["critical"],
            "high":        summary["high"],
        },
        "top_risk_tools": tools[:10],
    })


@router.get("/executive.pdf")
async def executive_pdf(
    org: str = Query(default="Your Organisation"),
    db: AsyncSession = Depends(get_db),
):
    """Download the executive summary PDF."""
    summary, tools, scans = await _get_report_data(db)
    pdf_bytes = build_executive_summary(
        org=org,
        summary=summary,
        top_tools=tools[:10],
        scan_count=len(scans),
    )
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="argus-executive-{org.replace(" ","_")}.pdf"'},
    )


@router.get("/technical.pdf")
async def technical_pdf(
    org: str = Query(default="Your Organisation"),
    db: AsyncSession = Depends(get_db),
):
    """Download the full technical report PDF."""
    summary, tools, scans = await _get_report_data(db)
    pdf_bytes = build_technical_report(
        org=org,
        summary=summary,
        tools=tools,
        scans=scans,
    )
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="argus-technical-{org.replace(" ","_")}.pdf"'},
    )
