from sqlalchemy import Column, String, Integer, Float, DateTime, JSON
from sqlalchemy.sql import func
from app.db.database import Base


class DiscoveredTool(Base):
    __tablename__ = "discovered_tools"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    domain = Column(String, nullable=True)
    category = Column(String, nullable=True)          # e.g. "LLM", "Code Assistant"
    risk_score = Column(Float, nullable=True)         # 0-10
    risk_level = Column(String, nullable=True)        # LOW / MEDIUM / HIGH / CRITICAL
    data_classification = Column(String, nullable=True)
    gdpr_relevant = Column(String, nullable=True)     # YES / NO / UNKNOWN
    vendor = Column(String, nullable=True)
    source = Column(String, nullable=True)            # how it was found: DNS, M365, etc.
    raw_profile = Column(JSON, nullable=True)         # full profile from YAML DB
    first_seen = Column(DateTime(timezone=True), server_default=func.now())
    last_seen = Column(DateTime(timezone=True), onupdate=func.now())
