"""
Data retention service for Argus.

Runs on a schedule to keep the DB lean.
All retention periods are configurable via env vars.

Default policy:
  Scan history       → keep 90 days
  Dismissed triage   → keep 30 days
  Pending triage     → keep forever (analyst must action)
  Tool inventory     → keep forever (it's small)
  Enrichment cache   → keep 90 days (re-enrich when stale)
"""
import logging
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, select, func
import os

from app.db.database import SessionLocal
from app.models.scan import Scan
from app.models.triage import TriageItem

logger = logging.getLogger("argus.retention")

# Retention periods in days — override via env vars
SCAN_RETENTION_DAYS     = int(os.getenv("RETENTION_SCANS_DAYS",   "90"))
TRIAGE_DISMISSED_DAYS   = int(os.getenv("RETENTION_TRIAGE_DAYS",  "30"))


async def run_retention():
    """
    Run all retention jobs. Called by the scheduler.
    Returns a summary dict of what was cleaned up.
    """
    summary = {}
    async with SessionLocal() as db:
        summary["scans_deleted"]   = await _purge_old_scans(db)
        summary["triage_deleted"]  = await _purge_dismissed_triage(db)
        summary["ran_at"]          = datetime.utcnow().isoformat()
        await db.commit()

    logger.info(
        f"Retention complete — "
        f"scans: {summary['scans_deleted']} deleted, "
        f"triage: {summary['triage_deleted']} deleted"
    )
    return summary


async def _purge_old_scans(db: AsyncSession) -> int:
    """Delete scan history older than SCAN_RETENTION_DAYS."""
    cutoff = datetime.utcnow() - timedelta(days=SCAN_RETENTION_DAYS)
    result = await db.execute(
        delete(Scan).where(Scan.created_at < cutoff)
    )
    return result.rowcount


async def _purge_dismissed_triage(db: AsyncSession) -> int:
    """Delete dismissed triage items older than TRIAGE_DISMISSED_DAYS."""
    cutoff = datetime.utcnow() - timedelta(days=TRIAGE_DISMISSED_DAYS)
    result = await db.execute(
        delete(TriageItem).where(
            TriageItem.status == "DISMISSED",
            TriageItem.last_seen < cutoff,
        )
    )
    return result.rowcount


async def get_retention_stats() -> dict:
    """Return current DB row counts — used by the scheduler status endpoint."""
    async with SessionLocal() as db:
        scan_count = await db.scalar(select(func.count()).select_from(Scan))

        oldest_scan = await db.scalar(
            select(func.min(Scan.created_at))
        )

        triage_pending = await db.scalar(
            select(func.count()).select_from(TriageItem)
            .where(TriageItem.status == "PENDING")
        )
        triage_dismissed = await db.scalar(
            select(func.count()).select_from(TriageItem)
            .where(TriageItem.status == "DISMISSED")
        )

        return {
            "scans":             scan_count or 0,
            "oldest_scan":       oldest_scan.isoformat() if oldest_scan else None,
            "triage_pending":    triage_pending or 0,
            "triage_dismissed":  triage_dismissed or 0,
            "retention_policy": {
                "scans_days":   SCAN_RETENTION_DAYS,
                "triage_days":  TRIAGE_DISMISSED_DAYS,
            }
        }
