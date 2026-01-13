from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import DriftRecord, Snapshot
from services import DriftEngine

router = APIRouter(prefix="/api/v1/drift", tags=["drift"])


# Pydantic schemas
class DriftDetectRequest(BaseModel):
    snapshot_id: int


class DriftDetectResponse(BaseModel):
    snapshot_id: int
    drift_count: int
    by_type: dict
    by_severity: dict


class DriftRecordResponse(BaseModel):
    id: int
    snapshot_id: int
    entity_id: Optional[int]
    cmdb_item_id: Optional[int]
    drift_type: str
    severity: str
    status: str
    description: str
    details: Optional[dict]
    created_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True


class PaginatedDriftRecords(BaseModel):
    items: List[DriftRecordResponse]
    total: int
    page: int
    page_size: int


class DriftStatusUpdate(BaseModel):
    status: str  # open, acknowledged, resolved


@router.post("/detect", response_model=DriftDetectResponse)
def detect_drift(request: DriftDetectRequest, db: Session = Depends(get_db)):
    """
    Trigger drift detection for a snapshot.

    Compares the snapshot's entities against CMDB items and creates
    drift records for any discrepancies found.
    """
    # Verify snapshot exists
    snapshot = db.query(Snapshot).filter(Snapshot.id == request.snapshot_id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")

    # Run drift detection
    engine = DriftEngine(db)
    drift_records = engine.detect_drift(request.snapshot_id)

    # Aggregate results
    by_type = {}
    by_severity = {}
    for record in drift_records:
        by_type[record.drift_type] = by_type.get(record.drift_type, 0) + 1
        by_severity[record.severity] = by_severity.get(record.severity, 0) + 1

    return DriftDetectResponse(
        snapshot_id=request.snapshot_id,
        drift_count=len(drift_records),
        by_type=by_type,
        by_severity=by_severity
    )


@router.get("/records", response_model=PaginatedDriftRecords)
def list_drift_records(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    snapshot_id: Optional[int] = None,
    drift_type: Optional[str] = None,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List drift records with optional filtering."""
    query = db.query(DriftRecord)

    if snapshot_id:
        query = query.filter(DriftRecord.snapshot_id == snapshot_id)
    if drift_type:
        query = query.filter(DriftRecord.drift_type == drift_type)
    if severity:
        query = query.filter(DriftRecord.severity == severity)
    if status:
        query = query.filter(DriftRecord.status == status)

    # Order by severity (critical first) then by created_at
    query = query.order_by(
        DriftRecord.severity.desc(),
        DriftRecord.created_at.desc()
    )

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedDriftRecords(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/records/{record_id}", response_model=DriftRecordResponse)
def get_drift_record(record_id: int, db: Session = Depends(get_db)):
    """Get a specific drift record."""
    record = db.query(DriftRecord).filter(DriftRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Drift record not found")
    return record


@router.patch("/records/{record_id}/status", response_model=DriftRecordResponse)
def update_drift_status(
    record_id: int,
    update: DriftStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update the status of a drift record."""
    record = db.query(DriftRecord).filter(DriftRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Drift record not found")

    valid_statuses = {"open", "acknowledged", "resolved"}
    if update.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of: {valid_statuses}"
        )

    record.status = update.status
    if update.status == "resolved":
        record.resolved_at = datetime.utcnow()

    db.commit()
    db.refresh(record)
    return record


@router.get("/summary")
def get_drift_summary(
    snapshot_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Get drift summary statistics."""
    query = db.query(DriftRecord)
    if snapshot_id:
        query = query.filter(DriftRecord.snapshot_id == snapshot_id)

    records = query.all()

    by_type = {}
    by_severity = {}
    by_status = {}

    for record in records:
        by_type[record.drift_type] = by_type.get(record.drift_type, 0) + 1
        by_severity[record.severity] = by_severity.get(record.severity, 0) + 1
        by_status[record.status] = by_status.get(record.status, 0) + 1

    return {
        "total": len(records),
        "by_type": by_type,
        "by_severity": by_severity,
        "by_status": by_status
    }
