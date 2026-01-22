from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import AuditLog

router = APIRouter(prefix="/api/v1/audit", tags=["audit"])


# Pydantic schemas
class AuditLogResponse(BaseModel):
    id: int
    event_type: str
    entity_type: str
    entity_id: int
    actor: str
    details: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedAuditLogs(BaseModel):
    items: List[AuditLogResponse]
    total: int
    page: int
    page_size: int


@router.get("", response_model=PaginatedAuditLogs)
def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    event_type: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    actor: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List audit logs with optional filtering.

    Filters:
    - event_type: Filter by event type (e.g., action_approved)
    - entity_type: Filter by entity type (e.g., Action, DriftRecord)
    - entity_id: Filter by specific entity ID
    - actor: Filter by actor (user or system)
    """
    query = db.query(AuditLog)

    if event_type:
        query = query.filter(AuditLog.event_type == event_type)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if entity_id:
        query = query.filter(AuditLog.entity_id == entity_id)
    if actor:
        query = query.filter(AuditLog.actor == actor)

    query = query.order_by(AuditLog.created_at.desc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedAuditLogs(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/entity/{entity_type}/{entity_id}", response_model=List[AuditLogResponse])
def get_entity_audit_trail(
    entity_type: str,
    entity_id: int,
    db: Session = Depends(get_db)
):
    """
    Get the complete audit trail for a specific entity.

    Useful for investigating the history of a particular drift record,
    action, or CMDB item.
    """
    logs = db.query(AuditLog).filter(
        AuditLog.entity_type == entity_type,
        AuditLog.entity_id == entity_id
    ).order_by(AuditLog.created_at.asc()).all()

    return logs


@router.get("/summary")
def get_audit_summary(
    days: int = Query(7, ge=1, le=90),
    db: Session = Depends(get_db)
):
    """
    Get audit summary statistics for the last N days.

    Returns counts of events grouped by event_type and entity_type.
    """
    from datetime import timedelta

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    logs = db.query(AuditLog).filter(AuditLog.created_at >= cutoff).all()

    by_event_type = {}
    by_entity_type = {}
    by_actor = {}

    for log in logs:
        by_event_type[log.event_type] = by_event_type.get(log.event_type, 0) + 1
        by_entity_type[log.entity_type] = by_entity_type.get(log.entity_type, 0) + 1
        by_actor[log.actor] = by_actor.get(log.actor, 0) + 1

    return {
        "period_days": days,
        "total_events": len(logs),
        "by_event_type": by_event_type,
        "by_entity_type": by_entity_type,
        "by_actor": by_actor
    }
