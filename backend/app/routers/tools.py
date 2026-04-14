from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.database import get_db
from app.models.tool import DiscoveredTool
from app.schemas.tool import ToolOut, ToolSummary

router = APIRouter()


@router.get("/", response_model=list[ToolOut])
async def list_tools(
    skip: int = 0,
    limit: int = 100,
    risk_level: str | None = Query(None),
    source: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    q = select(DiscoveredTool).offset(skip).limit(limit)
    if risk_level:
        q = q.where(DiscoveredTool.risk_level == risk_level.upper())
    if source:
        q = q.where(DiscoveredTool.source == source.upper())
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/summary", response_model=ToolSummary)
async def tool_summary(db: AsyncSession = Depends(get_db)):
    total = await db.scalar(select(func.count()).select_from(DiscoveredTool))

    async def count_level(level):
        return await db.scalar(
            select(func.count()).where(DiscoveredTool.risk_level == level)
        )

    return ToolSummary(
        total=total or 0,
        critical=await count_level("CRITICAL"),
        high=await count_level("HIGH"),
        medium=await count_level("MEDIUM"),
        low=await count_level("LOW"),
        unknown=await count_level(None),
    )


@router.get("/{tool_id}", response_model=ToolOut)
async def get_tool(tool_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.get(DiscoveredTool, tool_id)
    if not result:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Tool not found")
    return result
