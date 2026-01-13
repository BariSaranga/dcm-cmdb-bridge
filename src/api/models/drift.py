from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, JSON, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class DriftRecord(Base):
    """Records detected drift between runtime entities and CMDB."""
    __tablename__ = "drift_records"

    id: Mapped[int] = mapped_column(primary_key=True)

    snapshot_id: Mapped[int] = mapped_column(ForeignKey("snapshots.id"))
    entity_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("normalized_entities.id"), nullable=True
    )
    cmdb_item_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("cmdb_items.id"), nullable=True
    )

    drift_type: Mapped[str] = mapped_column(String(50))
    # Types: structural_missing_in_cmdb, structural_stale_in_cmdb,
    #        ownership, configuration, lifecycle

    severity: Mapped[str] = mapped_column(String(20), default="medium")
    # Severity: low, medium, high, critical

    status: Mapped[str] = mapped_column(String(20), default="open")
    # Status: open, acknowledged, resolved

    description: Mapped[str] = mapped_column(String(500))
    details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    # Details contains diff information, expected vs actual values, etc.

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    snapshot: Mapped["Snapshot"] = relationship()
    entity: Mapped[Optional["NormalizedEntity"]] = relationship()
    cmdb_item: Mapped[Optional["CMDBItem"]] = relationship()

    def __repr__(self):
        return f"<DriftRecord {self.id} type={self.drift_type} status={self.status}>"
