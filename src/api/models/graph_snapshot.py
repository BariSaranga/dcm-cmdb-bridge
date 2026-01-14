from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class GraphSnapshot(Base):
    """Stores a point-in-time graph of runtime + CMDB infrastructure."""
    __tablename__ = "graph_snapshots"

    id: Mapped[int] = mapped_column(primary_key=True)
    snapshot_id: Mapped[int] = mapped_column(ForeignKey("snapshots.id"))

    status: Mapped[str] = mapped_column(String(50), default="building")
    # Statuses: building, completed, failed

    node_count: Mapped[int] = mapped_column(default=0)
    edge_count: Mapped[int] = mapped_column(default=0)

    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    source_snapshot: Mapped["Snapshot"] = relationship()
    nodes: Mapped[List["GraphNode"]] = relationship(
        back_populates="graph_snapshot", cascade="all, delete-orphan"
    )
    edges: Mapped[List["GraphEdge"]] = relationship(
        back_populates="graph_snapshot", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<GraphSnapshot {self.id} nodes={self.node_count} edges={self.edge_count}>"
