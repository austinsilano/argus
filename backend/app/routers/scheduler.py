from fastapi import APIRouter
from pydantic import BaseModel
from app.services.scheduler_service import (
    get_scheduler, start_scheduler, stop_scheduler, _run_rescan, _run_retention
)

router = APIRouter()


class SchedulerConfig(BaseModel):
    interval_hours: int


@router.get("/status")
async def scheduler_status():
    from app.services.retention_service import get_retention_stats
    s = get_scheduler()
    rescan_job    = s.get_job("rescan")    if s.running else None
    retention_job = s.get_job("retention") if s.running else None

    stats = await get_retention_stats()

    return {
        "running": s.running,
        "rescan": {
            "next_run": rescan_job.next_run_time.isoformat() if rescan_job and rescan_job.next_run_time else None,
            "interval_hours": (
                int(rescan_job.trigger.interval.total_seconds() / 3600)
                if rescan_job else 0
            ),
        },
        "retention": {
            "next_run": retention_job.next_run_time.isoformat() if retention_job and retention_job.next_run_time else None,
            "interval_hours": 24,
        },
        "db_stats": stats,
    }


@router.post("/configure")
async def configure_scheduler(config: SchedulerConfig):
    await start_scheduler(interval_hours=config.interval_hours)
    return {"status": "updated", "interval_hours": config.interval_hours}


@router.post("/run-now")
async def run_now():
    await _run_rescan()
    return {"status": "rescan complete"}


@router.post("/run-retention")
async def run_retention_now():
    from app.services.retention_service import run_retention
    summary = await run_retention()
    return {"status": "retention complete", "summary": summary}
