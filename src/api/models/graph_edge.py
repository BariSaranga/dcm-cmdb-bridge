from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, JSON, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class GraphEdge(Base):
    """Represents an edge/relationship in the infrastructure graph."""
    __tablename__ = "graph_edges"

    id: Mapped[int] = mapped_column(primary_key=True)
    graph_snapshot_id: Mapped[int] = mapped_column(ForeignKey("graph_snapshots.id"))

    # Edge identification
    edge_id: Mapped[str] = mapped_column(String(255))  # Unique within graph
    edge_type: Mapped[str] = mapped_column(String(50))
    # Types: mapped_to_cmdb, missing_in_cmdb, stale_in_cmdb,
    #        ownership_mismatch, config_mismatch

    # Source and target nodes
    source_node_id: Mapped[str] = mapped_column(String(255))
    target_node_id: Mapped[str] = mapped_column(String(255))

    # Styling hints for UI
    label: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    style: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    # Styles: default, dashed, warning, error

    # Additional metadata
    extra_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    graph_snapshot: Mapped["GraphSnapshot"] = relationship(back_populates="edges")

    def __repr__(self):
        return f"<GraphEdge {self.edge_id} {self.source_node_id} -> {self.target_node_id}>"
