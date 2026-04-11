from sqlalchemy import Column, String, Integer, DateTime, Text
from sqlalchemy.sql import func
from app.db.database import Base


class TriageItem(Base):
    __tablename__ = "triage_queue"

    id         = Column(Integer, primary_key=True, index=True)
    domain     = Column(String, nullable=False, unique=True, index=True)
    source     = Column(String, nullable=True)   # DNS_CSV / PASTE / MANUAL
    seen_count = Column(Integer, default=1)       # how many times seen across scans
    status     = Column(String, default="PENDING")  # PENDING / REVIEWED / DISMISSED
    reviewed_by= Column(String, nullable=True)
    notes      = Column(Text, nullable=True)
    first_seen = Column(DateTime(timezone=True), server_default=func.now())
    last_seen  = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
