from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Action
from services import ActionService, AuditService

router = APIRouter(prefix="/api/v1/actions", tags=["actions"])


# Pydantic schemas
class ActionProposeRequest(BaseModel):
    drift_record_id: int
    action_type: str  # create_cmdb, update_cmdb, decommission_cmdb, acknowledge
    description: str
    payload: dict
    proposed_by: str


class ActionReviewRequest(BaseModel):
    reviewed_by: str
    comment: Optional[str] = None


class ActionResponse(BaseModel):
    id: int
    drift_record_id: int
    action_type: str
    status: str
    description: str
    payload: dict
    proposed_by: str
    proposed_at: datetime
    reviewed_by: Optional[str]
    reviewed_at: Optional[datetime]
    review_comment: Optional[str]
    applied_at: Optional[datetime]
    result: Optional[dict]

    class Config:
        from_attributes = True


class PaginatedActions(BaseModel):
    items: List[ActionResponse]
    total: int
    page: int
    page_size: int


@router.post("", response_model=ActionResponse)
def propose_action(request: ActionProposeRequest, db: Session = Depends(get_db)):
    """
    Propose a new action to remediate drift.

    Action types:
    - create_cmdb: Create a new CMDB item
    - update_cmdb: Update an existing CMDB item
    - decommission_cmdb: Mark CMDB item as decommissioned
    - acknowledge: Acknowledge drift without CMDB change
    """
    service = ActionService(db)
    audit = AuditService(db)

    try:
        action = service.propose_action(
            drift_record_id=request.drift_record_id,
            action_type=request.action_type,
            description=request.description,
            payload=request.payload,
            proposed_by=request.proposed_by
        )

        # Log to audit
        audit.log_action_proposed(
            action_id=action.id,
            action_type=action.action_type,
            actor=request.proposed_by,
            drift_id=request.drift_record_id
        )

        return action
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=PaginatedActions)
def list_actions(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    drift_record_id: Optional[int] = None,
    action_type: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List actions with optional filtering."""
    query = db.query(Action)

    if drift_record_id:
        query = query.filter(Action.drift_record_id == drift_record_id)
    if action_type:
        query = query.filter(Action.action_type == action_type)
    if status:
        query = query.filter(Action.status == status)

    query = query.order_by(Action.proposed_at.desc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedActions(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{action_id}", response_model=ActionResponse)
def get_action(action_id: int, db: Session = Depends(get_db)):
    """Get a specific action."""
    action = db.query(Action).filter(Action.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    return action


@router.post("/{action_id}/approve", response_model=ActionResponse)
def approve_action(
    action_id: int,
    request: ActionReviewRequest,
    db: Session = Depends(get_db)
):
    """Approve an action for application."""
    service = ActionService(db)
    audit = AuditService(db)

    try:
        action = service.approve_action(
            action_id=action_id,
            reviewed_by=request.reviewed_by,
            comment=request.comment
        )

        audit.log_action_approved(
            action_id=action.id,
            actor=request.reviewed_by,
            comment=request.comment
        )

        return action
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{action_id}/reject", response_model=ActionResponse)
def reject_action(
    action_id: int,
    request: ActionReviewRequest,
    db: Session = Depends(get_db)
):
    """Reject an action."""
    service = ActionService(db)
    audit = AuditService(db)

    try:
        action = service.reject_action(
            action_id=action_id,
            reviewed_by=request.reviewed_by,
            comment=request.comment
        )

        audit.log_action_rejected(
            action_id=action.id,
            actor=request.reviewed_by,
            comment=request.comment
        )

        return action
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{action_id}/apply", response_model=ActionResponse)
def apply_action(action_id: int, db: Session = Depends(get_db)):
    """
    Apply an approved action to CMDB.

    This executes the actual changes against the mock CMDB.
    Only approved actions can be applied.
    """
    service = ActionService(db)
    audit = AuditService(db)

    try:
        action = service.apply_action(action_id)

        if action.status == "applied":
            audit.log_action_applied(
                action_id=action.id,
                result=action.result or {}
            )

        return action
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
