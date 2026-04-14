from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from app.db.database import get_db
from app.models.triage import TriageItem

router = APIRouter()


class TriageOut(BaseModel):
    id: int
    domain: str
    source: Optional[str] = None
    seen_count: int
    status: str
    reviewed_by: Optional[str] = None
    notes: Optional[str] = None
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None
    model_config = {"from_attributes": True}


class TriageAction(BaseModel):
    status: str             # REVIEWED / DISMISSED
    reviewed_by: Optional[str] = None
    notes: Optional[str] = None


@router.get("/", response_model=list[TriageOut])
async def list_triage(
    status: str = "PENDING",
    db: AsyncSession = Depends(get_db),
):
    q = select(TriageItem).order_by(TriageItem.seen_count.desc(), TriageItem.last_seen.desc())
    if status != "ALL":
        q = q.where(TriageItem.status == status)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/count")
async def triage_count(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import func, select
    count = await db.scalar(
        select(func.count()).select_from(TriageItem).where(TriageItem.status == "PENDING")
    )
    return {"pending": count or 0}


@router.post("/{item_id}/action")
async def action_triage(
    item_id: int,
    action: TriageAction,
    db: AsyncSession = Depends(get_db),
):
    item = await db.get(TriageItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Triage item not found")
    if action.status not in ("REVIEWED", "DISMISSED"):
        raise HTTPException(status_code=400, detail="status must be REVIEWED or DISMISSED")
    item.status = action.status
    item.reviewed_by = action.reviewed_by
    item.notes = action.notes
    await db.commit()
    return {"updated": item_id, "status": action.status}


@router.delete("/{item_id}")
async def delete_triage(item_id: int, db: AsyncSession = Depends(get_db)):
    item = await db.get(TriageItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(item)
    await db.commit()
    return {"deleted": item_id}
