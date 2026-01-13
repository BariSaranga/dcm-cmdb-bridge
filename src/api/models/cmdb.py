from datetime import datetime
from typing import Optional
from sqlalchemy import String, DateTime, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class CMDBItem(Base):
    """Mock CMDB Configuration Item for drift comparison."""
    __tablename__ = "cmdb_items"

    id: Mapped[int] = mapped_column(primary_key=True)

    ci_type: Mapped[str] = mapped_column(String(100))  # Deployment, Service, StatefulSet, etc.
    name: Mapped[str] = mapped_column(String(255))
    namespace: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    environment: Mapped[str] = mapped_column(String(100))  # production, staging, development

    owner: Mapped[str] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(50), default="active")  # active, decommissioned, planned

    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    extra_data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __repr__(self):
        return f"<CMDBItem {self.ci_type}/{self.namespace}/{self.name}>"
