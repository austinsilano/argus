from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from app.db.database import create_tables
from app.routers import tools, scans, reports, health, scheduler, overrides, triage
from app.services.scheduler_service import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    interval = int(os.getenv("RESCAN_INTERVAL_HOURS", "24"))
    await start_scheduler(interval_hours=interval)
    yield
    await stop_scheduler()


app = FastAPI(
    title="AI Shadow IT Scanner",
    description="Discover and risk-score AI tools in your organisation",
    version="0.3.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router,     tags=["health"])
app.include_router(tools.router,      prefix="/api/tools",     tags=["tools"])
app.include_router(scans.router,      prefix="/api/scans",     tags=["scans"])
app.include_router(reports.router,    prefix="/api/reports",   tags=["reports"])
app.include_router(scheduler.router,  prefix="/api/scheduler", tags=["scheduler"])
app.include_router(overrides.router,  prefix="/api/overrides", tags=["overrides"])
app.include_router(triage.router,     prefix="/api/triage",    tags=["triage"])
