from datetime import datetime
from typing import List, Optional
import asyncio

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Snapshot, NormalizedEntity
from collectors import list_collectors
from collectors.kubernetes import (
    KubernetesCollector,
    KubernetesCollectorConfig,
    KubernetesClientConfig,
)
from collectors.kubernetes.fixtures import FixtureKubernetesClient

router = APIRouter(prefix="/api/v1/discovery", tags=["discovery"])


# Pydantic request/response schemas
class KubernetesConfig(BaseModel):
    cluster_name: str
    kubeconfig_path: Optional[str] = None
    context: Optional[str] = None
    in_cluster: bool = False
    namespaces: Optional[List[str]] = None
    use_fixtures: bool = False  # For testing without real cluster


class DiscoveryRequest(BaseModel):
    source_type: str  # "kubernetes"
    config: KubernetesConfig


class SnapshotResponse(BaseModel):
    id: int
    source: str
    status: str
    entity_count: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class EntityResponse(BaseModel):
    id: int
    source_type: str
    kind: str
    name: str
    namespace: Optional[str]
    uid: Optional[str]
    labels: Optional[dict]
    annotations: Optional[dict]
    owner: Optional[str]
    environment: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedEntities(BaseModel):
    items: List[EntityResponse]
    total: int
    page: int
    page_size: int


# Background task for collection
async def run_collection(
    snapshot_id: int,
    collector: KubernetesCollector,
    db_url: str
):
    """Run collection in background and update snapshot."""
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker

    engine = create_engine(db_url)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    try:
        snapshot = db.query(Snapshot).filter(Snapshot.id == snapshot_id).first()
        if not snapshot:
            return

        try:
            # Run discovery
            entities_data = await collector.discover()

            # Create entity records
            for entity_data in entities_data:
                entity = NormalizedEntity(
                    snapshot_id=snapshot_id,
                    **entity_data
                )
                db.add(entity)

            # Update snapshot
            snapshot.status = "completed"
            snapshot.entity_count = len(entities_data)
            snapshot.completed_at = datetime.utcnow()

        except Exception as e:
            snapshot.status = "failed"
            snapshot.error_message = str(e)
            snapshot.completed_at = datetime.utcnow()

        db.commit()
    finally:
        db.close()


def _run_async_collection(snapshot_id: int, collector: KubernetesCollector, db_url: str):
    """Wrapper to run async collection in background task."""
    asyncio.run(run_collection(snapshot_id, collector, db_url))


@router.get("/collectors")
def get_available_collectors():
    """List all available collector types."""
    return {"collectors": list_collectors()}


@router.post("/snapshots", response_model=SnapshotResponse)
def create_snapshot(
    request: DiscoveryRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Trigger a new discovery snapshot.

    Creates a snapshot record and schedules collection in the background.
    """
    if request.source_type != "kubernetes":
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported source type: {request.source_type}"
        )

    # Build source identifier
    source = f"kubernetes:{request.config.cluster_name}"

    # Create snapshot with pending status
    snapshot = Snapshot(source=source, status="pending")
    db.add(snapshot)
    db.commit()
    db.refresh(snapshot)

    # Build collector configuration
    client_config = KubernetesClientConfig(
        kubeconfig_path=request.config.kubeconfig_path,
        context=request.config.context,
        in_cluster=request.config.in_cluster,
    )

    collector_config = KubernetesCollectorConfig(
        cluster_name=request.config.cluster_name,
        client_config=client_config,
        namespaces=request.config.namespaces,
    )

    # Use fixture client for testing
    if request.config.use_fixtures:
        client = FixtureKubernetesClient()
    else:
        client = None  # Will use real client

    collector = KubernetesCollector(config=collector_config, client=client)

    # Schedule background collection
    from config import settings
    background_tasks.add_task(
        _run_async_collection,
        snapshot_id=snapshot.id,
        collector=collector,
        db_url=settings.database_url
    )

    return snapshot


@router.get("/snapshots/{snapshot_id}", response_model=SnapshotResponse)
def get_snapshot(snapshot_id: int, db: Session = Depends(get_db)):
    """Get snapshot status and details."""
    snapshot = db.query(Snapshot).filter(Snapshot.id == snapshot_id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    return snapshot


@router.get("/snapshots/{snapshot_id}/entities", response_model=PaginatedEntities)
def get_snapshot_entities(
    snapshot_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    kind: Optional[str] = None,
    namespace: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get entities for a snapshot with pagination and filtering."""
    snapshot = db.query(Snapshot).filter(Snapshot.id == snapshot_id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")

    query = db.query(NormalizedEntity).filter(
        NormalizedEntity.snapshot_id == snapshot_id
    )

    if kind:
        query = query.filter(NormalizedEntity.kind == kind)
    if namespace:
        query = query.filter(NormalizedEntity.namespace == namespace)

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedEntities(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )
