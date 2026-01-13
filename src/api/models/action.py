from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Action(Base):
    """
    Represents a proposed action to remediate drift.

    Workflow: proposed -> approved/rejected -> applied/failed
    """
    __tablename__ = "actions"

    id: Mapped[int] = mapped_column(primary_key=True)

    drift_record_id: Mapped[int] = mapped_column(ForeignKey("drift_records.id"))

    action_type: Mapped[str] = mapped_column(String(50))
    # Types: create_cmdb, update_cmdb, decommission_cmdb, acknowledge

    status: Mapped[str] = mapped_column(String(20), default="proposed")
    # Status: proposed, approved, rejected, applied, failed

    description: Mapped[str] = mapped_column(Text)
    payload: Mapped[dict] = mapped_column(JSON)
    # Payload contains the action details (what changes to make)

    proposed_by: Mapped[str] = mapped_column(String(255))
    proposed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    reviewed_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    review_comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    applied_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    result: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # Result contains the outcome of applying the action

    # Relationships
    drift_record: Mapped["DriftRecord"] = relationship()

    def __repr__(self):
        return f"<Action {self.id} type={self.action_type} status={self.status}>"
