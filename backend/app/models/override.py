from sqlalchemy import Column, String, Integer, Float, DateTime, Text
from sqlalchemy.sql import func
from app.db.database import Base


class ToolOverride(Base):
    __tablename__ = "tool_overrides"

    id             = Column(Integer, primary_key=True, index=True)
    domain         = Column(String, nullable=False, unique=True, index=True)
    tool_name      = Column(String, nullable=True)
    decision       = Column(String, nullable=False)       # APPROVED / BLOCKED / RESCORE
    override_score = Column(Float, nullable=True)          # set when decision=RESCORE
    override_level = Column(String, nullable=True)         # CRITICAL/HIGH/MEDIUM/LOW
    reviewed_by    = Column(String, nullable=True)         # analyst name/email
    notes          = Column(Text, nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())
    updated_at     = Column(DateTime(timezone=True), onupdate=func.now())
