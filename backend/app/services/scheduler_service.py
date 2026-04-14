"""
Lightweight scheduler using APScheduler inside the FastAPI process.
No Redis, no Celery, no extra containers.

Jobs:
  rescan    — re-scores all discovered tools against latest risk DB
  retention — cleans up old scan history and dismissed triage items
"""
import logging
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy import select

from app.db.database import SessionLocal
from app.models.scan import Scan
from app.models.tool import DiscoveredTool
from app.services.risk_service import lookup_tool, score_tool

logger = logging.getLogger("argus.scheduler")
scheduler = AsyncIOScheduler()


def get_scheduler() -> AsyncIOScheduler:
    return scheduler


async def _run_rescan():
    """Re-score all existing tools against the current risk DB."""
    logger.info("Scheduler: starting rescan...")
    async with SessionLocal() as db:
        result = await db.execute(select(DiscoveredTool))
        tools = result.scalars().all()
        updated = 0
        for tool in tools:
            if not tool.domain:
                continue
            profile = lookup_tool(tool.domain)
            if profile:
                risk_score, risk_level = score_tool(profile)
                tool.risk_score = risk_score
                tool.risk_level = risk_level
                tool.raw_profile = profile
                updated += 1

        scan = Scan(
            scan_type="SCHEDULED_RESCAN",
            status="complete",
            tools_found=updated,
            completed_at=datetime.utcnow(),
            summary={"rescanned": updated},
        )
        db.add(scan)
        await db.commit()
    logger.info(f"Scheduler: rescan complete — {updated} tools updated")


async def _run_retention():
    """Run data retention cleanup."""
    from app.services.retention_service import run_retention
    logger.info("Scheduler: starting retention job...")
    summary = await run_retention()
    logger.info(f"Scheduler: retention complete — {summary}")


async def start_scheduler(interval_hours: int = 24):
    if scheduler.running:
        scheduler.shutdown(wait=False)

    if interval_hours > 0:
        # Rescan job — runs at configured interval
        scheduler.add_job(
            _run_rescan,
            trigger=IntervalTrigger(hours=interval_hours),
            id="rescan",
            replace_existing=True,
            next_run_time=None,
        )
        # Retention job — runs daily regardless of rescan interval
        scheduler.add_job(
            _run_retention,
            trigger=IntervalTrigger(hours=24),
            id="retention",
            replace_existing=True,
            next_run_time=None,
        )
        scheduler.start()
        logger.info(f"Scheduler started — rescan every {interval_hours}h, retention daily")
    else:
        logger.info("Scheduler disabled (interval=0)")


async def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
