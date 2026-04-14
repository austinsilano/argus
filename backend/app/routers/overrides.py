from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.db.database import get_db
from app.models.override import ToolOverride
from app.models.tool import DiscoveredTool

router = APIRouter()


class OverridePayload(BaseModel):
    domain: str
    decision: str           # APPROVED / BLOCKED / RESCORE
    override_score: Optional[float] = None
    reviewed_by: Optional[str] = None
    notes: Optional[str] = None


class OverrideOut(BaseModel):
    id: int
    domain: str
    tool_name: Optional[str] = None
    decision: str
    override_score: Optional[float] = None
    override_level: Optional[str] = None
    reviewed_by: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


def _score_to_level(score: float) -> str:
    if score >= 9:   return "CRITICAL"
    if score >= 7:   return "HIGH"
    if score >= 4:   return "MEDIUM"
    return "LOW"


@router.get("/", response_model=list[OverrideOut])
async def list_overrides(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ToolOverride).order_by(ToolOverride.created_at.desc()))
    return result.scalars().all()


@router.post("/", response_model=OverrideOut)
async def create_override(
    payload: OverridePayload,
    db: AsyncSession = Depends(get_db),
):
    if payload.decision not in ("APPROVED", "BLOCKED", "RESCORE"):
        raise HTTPException(status_code=400, detail="decision must be APPROVED, BLOCKED, or RESCORE")
    if payload.decision == "RESCORE" and payload.override_score is None:
        raise HTTPException(status_code=400, detail="override_score required when decision=RESCORE")

    # Upsert — one override per domain
    existing = await db.scalar(select(ToolOverride).where(ToolOverride.domain == payload.domain.lower()))

    override_level = None
    if payload.override_score is not None:
        override_level = _score_to_level(payload.override_score)

    # Get tool name from inventory if available
    tool = await db.scalar(select(DiscoveredTool).where(DiscoveredTool.domain == payload.domain.lower()))
    tool_name = tool.name if tool else None

    if existing:
        existing.decision       = payload.decision
        existing.override_score = payload.override_score
        existing.override_level = override_level
        existing.reviewed_by    = payload.reviewed_by
        existing.notes          = payload.notes
        existing.tool_name      = tool_name
        existing.updated_at     = datetime.utcnow()
        override = existing
    else:
        override = ToolOverride(
            domain         = payload.domain.lower(),
            tool_name      = tool_name,
            decision       = payload.decision,
            override_score = payload.override_score,
            override_level = override_level,
            reviewed_by    = payload.reviewed_by,
            notes          = payload.notes,
        )
        db.add(override)

    # Apply override to the discovered tool immediately
    if tool:
        if payload.decision == "APPROVED":
            tool.risk_level = "LOW"
            tool.risk_score = 2.0
        elif payload.decision == "BLOCKED":
            tool.risk_level = "CRITICAL"
            tool.risk_score = 9.5
        elif payload.decision == "RESCORE" and payload.override_score is not None:
            tool.risk_score = payload.override_score
            tool.risk_level = override_level

    await db.commit()
    await db.refresh(override)
    return override


@router.delete("/{domain:path}")
async def delete_override(domain: str, db: AsyncSession = Depends(get_db)):
    override = await db.scalar(select(ToolOverride).where(ToolOverride.domain == domain.lower()))
    if not override:
        raise HTTPException(status_code=404, detail="Override not found")
    await db.delete(override)
    await db.commit()
    return {"deleted": domain}
