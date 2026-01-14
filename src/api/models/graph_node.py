from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, JSON, ForeignKey, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class GraphNode(Base):
    """Represents a node in the infrastructure graph."""
    __tablename__ = "graph_nodes"

    id: Mapped[int] = mapped_column(primary_key=True)
    graph_snapshot_id: Mapped[int] = mapped_column(ForeignKey("graph_snapshots.id"))

    # Node identification
    node_id: Mapped[str] = mapped_column(String(255))  # Unique within graph
    node_type: Mapped[str] = mapped_column(String(50))  # runtime, cmdb

    # Reference to source entity
    entity_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("normalized_entities.id"), nullable=True
    )
    cmdb_item_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("cmdb_items.id"), nullable=True
    )

    # Node metadata for display
    kind: Mapped[str] = mapped_column(String(100))  # Deployment, Service, etc.
    name: Mapped[str] = mapped_column(String(255))
    namespace: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Ownership and mapping
    owner: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    environment: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Drift information
    drift_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    # Values: mapped, missing_in_cmdb, stale_in_cmdb, ownership_mismatch, config_mismatch, lifecycle_conflict
    drift_severity: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    drift_record_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("drift_records.id"), nullable=True
    )

    # Position for React Flow (optional, can be computed client-side)
    position_x: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    position_y: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Additional metadata
    extra_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    graph_snapshot: Mapped["GraphSnapshot"] = relationship(back_populates="nodes")
    entity: Mapped[Optional["NormalizedEntity"]] = relationship()
    cmdb_item: Mapped[Optional["CMDBItem"]] = relationship()
    drift_record: Mapped[Optional["DriftRecord"]] = relationship()

    def __repr__(self):
        return f"<GraphNode {self.node_id} type={self.node_type} kind={self.kind}>"
