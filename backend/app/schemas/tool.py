from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class ToolBase(BaseModel):
    name: str
    domain: Optional[str] = None
    category: Optional[str] = None
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    data_classification: Optional[str] = None
    gdpr_relevant: Optional[str] = None
    vendor: Optional[str] = None
    source: Optional[str] = None


class ToolCreate(ToolBase):
    raw_profile: Optional[Any] = None


class ToolOut(ToolBase):
    id: int
    first_seen: Optional[datetime] = None
    last_seen: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ToolSummary(BaseModel):
    total: int
    critical: int
    high: int
    medium: int
    low: int
    unknown: int
