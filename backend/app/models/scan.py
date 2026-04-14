from sqlalchemy import Column, String, Integer, DateTime, JSON
from sqlalchemy.sql import func
from app.db.database import Base


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True)
    scan_type = Column(String, nullable=False)         # DNS_CSV, M365, GOOGLE, MANUAL
    status = Column(String, default="pending")         # pending / running / complete / failed
    tools_found = Column(Integer, default=0)
    summary = Column(JSON, nullable=True)              # risk breakdown counts
    error = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
