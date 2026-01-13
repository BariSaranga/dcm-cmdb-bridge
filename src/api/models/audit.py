from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class AuditLog(Base):
    """
    Audit log for tracking all significant events in the system.

    Used for compliance, debugging, and historical analysis.
    """
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)

    event_type: Mapped[str] = mapped_column(String(100))
    # Event types:
    # - snapshot_created, snapshot_completed
    # - drift_detected, drift_acknowledged, drift_resolved
    # - action_proposed, action_approved, action_rejected, action_applied
    # - cmdb_item_created, cmdb_item_updated, cmdb_item_decommissioned

    entity_type: Mapped[str] = mapped_column(String(50))
    # Entity types: Snapshot, DriftRecord, Action, CMDBItem

    entity_id: Mapped[int] = mapped_column(Integer)

    actor: Mapped[str] = mapped_column(String(255))
    # User or system that triggered the event

    details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # Event-specific details

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<AuditLog {self.id} {self.event_type} on {self.entity_type}:{self.entity_id}>"
