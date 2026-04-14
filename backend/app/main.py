from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os, sys

sys.path.insert(0, "/app")

from app.db.database import create_tables
from app.routers import tools, scans, reports, health, scheduler, overrides, triage
from app.routers.setup import router as setup_router
from auth.auth_router import router as auth_router
from auth.auth_deps import require_auth
from app.services.scheduler_service import start_scheduler, stop_scheduler

limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])


def _is_setup_complete() -> bool:
    required = ["AZURE_CLIENT_ID", "AZURE_CLIENT_SECRET", "AZURE_TENANT_ID"]
    return all(os.getenv(v, "").strip() for v in required)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    if _is_setup_complete():
        interval = int(os.getenv("RESCAN_INTERVAL_HOURS", "24"))
        await start_scheduler(interval_hours=interval)
    yield
    await stop_scheduler()


app = FastAPI(
    title="AI Shadow IT Scanner — Argus",
    version="0.5.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Always public ─────────────────────────────────────────────────────────────
app.include_router(health.router,  tags=["health"])
app.include_router(setup_router,   prefix="/api/setup",  tags=["setup"])
app.include_router(auth_router,    prefix="/api/auth",   tags=["auth"])

# ── Protected routes ──────────────────────────────────────────────────────────
_protected = {"dependencies": [Depends(require_auth)]}

app.include_router(tools.router,     prefix="/api/tools",     tags=["tools"],     **_protected)
app.include_router(scans.router,     prefix="/api/scans",     tags=["scans"],     **_protected)
app.include_router(reports.router,   prefix="/api/reports",   tags=["reports"],   **_protected)
app.include_router(scheduler.router, prefix="/api/scheduler", tags=["scheduler"], **_protected)
app.include_router(overrides.router, prefix="/api/overrides", tags=["overrides"], **_protected)
app.include_router(triage.router,    prefix="/api/triage",    tags=["triage"],    **_protected)
