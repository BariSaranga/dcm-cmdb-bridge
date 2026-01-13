from datetime import datetime
from typing import List, Optional
from sqlalchemy import String, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Snapshot(Base):
    __tablename__ = "snapshots"

    id: Mapped[int] = mapped_column(primary_key=True)
    source: Mapped[str] = mapped_column(String(100))  # e.g., "kubernetes:dev-cluster"
    status: Mapped[str] = mapped_column(String(50), default="completed")  # pending, completed, failed
    
    entity_count: Mapped[int] = mapped_column(default=0)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    entities: Mapped[List["NormalizedEntity"]] = relationship(
        back_populates="snapshot", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Snapshot {self.id} source={self.source} entities={self.entity_count}>"
