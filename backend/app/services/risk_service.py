import os
import yaml
from pathlib import Path
from typing import Optional

_TOOL_DB: dict = {}
_DB_PATH = Path(__file__).parent.parent.parent.parent / "data" / "tools"


def load_tool_db() -> dict:
    global _TOOL_DB
    if _TOOL_DB:
        return _TOOL_DB
    db = {}
    if not _DB_PATH.exists():
        return db
    for f in _DB_PATH.glob("*.yaml"):
        with open(f) as fh:
            data = yaml.safe_load(fh)
            if isinstance(data, list):
                for tool in data:
                    key = tool.get("domain") or tool.get("name", "").lower()
                    db[key.lower()] = tool
            elif isinstance(data, dict):
                key = data.get("domain") or data.get("name", "").lower()
                db[key.lower()] = data
    _TOOL_DB = db
    return db


def lookup_tool(name_or_domain: str) -> Optional[dict]:
    db = load_tool_db()
    needle = name_or_domain.lower().strip()
    if needle in db:
        return db[needle]
    # partial match — domain suffix check
    for key, profile in db.items():
        if key in needle or needle in key:
            return profile
    return None


def score_tool(profile: dict) -> tuple[float, str]:
    """Return (risk_score 0-10, risk_level)."""
    score = profile.get("risk_score")
    if score is not None:
        score = float(score)
    else:
        # Derive score from flags if not explicitly set
        score = 5.0
        if profile.get("data_leaves_org") is True:
            score += 2.0
        if profile.get("trains_on_data") is True:
            score += 1.5
        if profile.get("gdpr_relevant") == "YES":
            score += 0.5
        if profile.get("sso_available") is True:
            score -= 1.0
        score = min(10.0, max(0.0, score))

    if score >= 9:
        level = "CRITICAL"
    elif score >= 7:
        level = "HIGH"
    elif score >= 4:
        level = "MEDIUM"
    else:
        level = "LOW"

    return round(score, 1), level
