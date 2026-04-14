from fastapi import APIRouter
from pydantic import BaseModel
from app.services.scheduler_service import (
    get_scheduler, start_scheduler, stop_scheduler, _run_rescan
)

router = APIRouter()


class SchedulerConfig(BaseModel):
    interval_hours: int  # 0 = disabled, 24 = daily, 168 = weekly


@router.get("/status")
async def scheduler_status():
    s = get_scheduler()
    job = s.get_job("rescan") if s.running else None
    return {
        "running": s.running,
        "next_run": job.next_run_time.isoformat() if job and job.next_run_time else None,
        "interval_hours": (
            int(job.trigger.interval.total_seconds() / 3600)
            if job else 0
        ),
    }


@router.post("/configure")
async def configure_scheduler(config: SchedulerConfig):
    await start_scheduler(interval_hours=config.interval_hours)
    return {"status": "updated", "interval_hours": config.interval_hours}


@router.post("/run-now")
async def run_now():
    """Trigger an immediate rescan without waiting for the schedule."""
    await _run_rescan()
    return {"status": "rescan complete"}
