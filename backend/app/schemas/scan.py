from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime


class ScanCreate(BaseModel):
    scan_type: str


class ScanOut(BaseModel):
    id: int
    scan_type: str
    status: str
    tools_found: int
    summary: Optional[Any] = None
    error: Optional[str] = None
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
