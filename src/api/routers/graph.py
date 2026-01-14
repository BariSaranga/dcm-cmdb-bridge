from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import GraphSnapshot, GraphNode, GraphEdge, Snapshot
from services import GraphBuilder


router = APIRouter(prefix="/api/v1/graph", tags=["graph"])


# Pydantic schemas
class GraphBuildRequest(BaseModel):
    snapshot_id: int


class GraphNodeResponse(BaseModel):
    id: int
    node_id: str
    node_type: str
    entity_id: Optional[int]
    cmdb_item_id: Optional[int]
    kind: str
    name: str
    namespace: Optional[str]
    owner: Optional[str]
    environment: Optional[str]
    drift_status: Optional[str]
    drift_severity: Optional[str]
    drift_record_id: Optional[int]
    position_x: Optional[float]
    position_y: Optional[float]
    extra_data: Optional[dict]

    class Config:
        from_attributes = True


class GraphEdgeResponse(BaseModel):
    id: int
    edge_id: str
    edge_type: str
    source_node_id: str
    target_node_id: str
    label: Optional[str]
    style: Optional[str]
    extra_data: Optional[dict]

    class Config:
        from_attributes = True


class GraphSnapshotResponse(BaseModel):
    id: int
    snapshot_id: int
    status: str
    node_count: int
    edge_count: int
    error_message: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class GraphSnapshotDetailResponse(GraphSnapshotResponse):
    nodes: List[GraphNodeResponse]
    edges: List[GraphEdgeResponse]


class GraphSummary(BaseModel):
    total_snapshots: int
    latest_snapshot_id: Optional[int]
    latest_node_count: int
    latest_edge_count: int
    nodes_by_type: dict
    nodes_by_drift_status: dict


@router.post("/build", response_model=GraphSnapshotResponse)
def build_graph(request: GraphBuildRequest, db: Session = Depends(get_db)):
    """
    Build a graph snapshot from a runtime snapshot.

    This creates nodes for both runtime entities and CMDB items,
    and edges representing their mapping relationships.
    """
    # Verify snapshot exists
    snapshot = db.query(Snapshot).filter(Snapshot.id == request.snapshot_id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")

    builder = GraphBuilder(db)
    graph_snapshot = builder.build_graph(request.snapshot_id)

    return graph_snapshot


@router.get("/snapshots", response_model=List[GraphSnapshotResponse])
def list_graph_snapshots(
    limit: int = Query(10, ge=1, le=50),
    snapshot_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """List graph snapshots with optional filtering."""
    query = db.query(GraphSnapshot)

    if snapshot_id:
        query = query.filter(GraphSnapshot.snapshot_id == snapshot_id)

    snapshots = query.order_by(GraphSnapshot.created_at.desc()).limit(limit).all()
    return snapshots


@router.get("/latest", response_model=GraphSnapshotDetailResponse)
def get_latest_graph(
    snapshot_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Get the latest completed graph snapshot with all nodes and edges.

    This is the primary endpoint for the UI graph visualization.
    """
    builder = GraphBuilder(db)
    graph_snapshot = builder.get_latest_graph(snapshot_id)

    if not graph_snapshot:
        raise HTTPException(status_code=404, detail="No completed graph snapshot found")

    # Load nodes and edges
    nodes = db.query(GraphNode).filter(
        GraphNode.graph_snapshot_id == graph_snapshot.id
    ).all()

    edges = db.query(GraphEdge).filter(
        GraphEdge.graph_snapshot_id == graph_snapshot.id
    ).all()

    return GraphSnapshotDetailResponse(
        id=graph_snapshot.id,
        snapshot_id=graph_snapshot.snapshot_id,
        status=graph_snapshot.status,
        node_count=graph_snapshot.node_count,
        edge_count=graph_snapshot.edge_count,
        error_message=graph_snapshot.error_message,
        created_at=graph_snapshot.created_at,
        completed_at=graph_snapshot.completed_at,
        nodes=nodes,
        edges=edges
    )


@router.get("/snapshots/{graph_id}", response_model=GraphSnapshotDetailResponse)
def get_graph_snapshot(graph_id: int, db: Session = Depends(get_db)):
    """Get a specific graph snapshot with nodes and edges."""
    graph_snapshot = db.query(GraphSnapshot).filter(
        GraphSnapshot.id == graph_id
    ).first()

    if not graph_snapshot:
        raise HTTPException(status_code=404, detail="Graph snapshot not found")

    nodes = db.query(GraphNode).filter(
        GraphNode.graph_snapshot_id == graph_id
    ).all()

    edges = db.query(GraphEdge).filter(
        GraphEdge.graph_snapshot_id == graph_id
    ).all()

    return GraphSnapshotDetailResponse(
        id=graph_snapshot.id,
        snapshot_id=graph_snapshot.snapshot_id,
        status=graph_snapshot.status,
        node_count=graph_snapshot.node_count,
        edge_count=graph_snapshot.edge_count,
        error_message=graph_snapshot.error_message,
        created_at=graph_snapshot.created_at,
        completed_at=graph_snapshot.completed_at,
        nodes=nodes,
        edges=edges
    )


@router.get("/nodes/{node_id}", response_model=GraphNodeResponse)
def get_graph_node(node_id: int, db: Session = Depends(get_db)):
    """Get details for a specific graph node."""
    node = db.query(GraphNode).filter(GraphNode.id == node_id).first()
    if not node:
        raise HTTPException(status_code=404, detail="Graph node not found")
    return node


@router.get("/summary", response_model=GraphSummary)
def get_graph_summary(db: Session = Depends(get_db)):
    """Get summary statistics for graph snapshots."""
    total = db.query(GraphSnapshot).count()
    latest = db.query(GraphSnapshot).filter(
        GraphSnapshot.status == "completed"
    ).order_by(GraphSnapshot.created_at.desc()).first()

    nodes_by_type: dict = {}
    nodes_by_drift: dict = {}

    if latest:
        nodes = db.query(GraphNode).filter(
            GraphNode.graph_snapshot_id == latest.id
        ).all()

        for node in nodes:
            nodes_by_type[node.node_type] = nodes_by_type.get(node.node_type, 0) + 1
            if node.drift_status:
                nodes_by_drift[node.drift_status] = nodes_by_drift.get(node.drift_status, 0) + 1

    return GraphSummary(
        total_snapshots=total,
        latest_snapshot_id=latest.id if latest else None,
        latest_node_count=latest.node_count if latest else 0,
        latest_edge_count=latest.edge_count if latest else 0,
        nodes_by_type=nodes_by_type,
        nodes_by_drift_status=nodes_by_drift
    )
