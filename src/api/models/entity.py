from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class NormalizedEntity(Base):
    __tablename__ = "normalized_entities"

    id: Mapped[int] = mapped_column(primary_key=True)
    snapshot_id: Mapped[int] = mapped_column(ForeignKey("snapshots.id"))
    
    source_type: Mapped[str] = mapped_column(String(50))  # e.g., "kubernetes"
    kind: Mapped[str] = mapped_column(String(100))  # e.g., "Deployment", "Service"
    name: Mapped[str] = mapped_column(String(255))
    namespace: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    uid: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # Source system UID
    labels: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    annotations: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    owner: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    environment: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    raw_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    snapshot: Mapped["Snapshot"] = relationship(back_populates="entities")

    def __repr__(self):
        return f"<NormalizedEntity {self.kind}/{self.namespace}/{self.name}>"
