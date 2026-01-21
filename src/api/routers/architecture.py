"""
Architecture Visualizer Router

Provides endpoints for the platform architecture visualization.
"""

from typing import List, Optional, Dict, Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from services import ArchitectureService


router = APIRouter(prefix="/api/v1/architecture", tags=["architecture"])


# Response schemas
class SystemViewResponse(BaseModel):
    id: str
    title: str


class SystemNodeResponse(BaseModel):
    id: str
    name: str
    type: str
    tech: str
    description: str


class SystemEdgeResponse(BaseModel):
    source: str
    target: str
    relation: str
    protocol: Optional[str] = None


class SystemModelResponse(BaseModel):
    version: int
    views: List[SystemViewResponse]
    nodes: List[SystemNodeResponse]
    edges: List[SystemEdgeResponse]


class DiagramResponse(BaseModel):
    view: str
    format: str
    diagram: str


class ConnectionResponse(BaseModel):
    node_id: str
    node_name: str
    relation: str
    protocol: Optional[str] = None


class NodeDetailsResponse(BaseModel):
    node: SystemNodeResponse
    incoming_connections: List[Dict[str, Any]]
    outgoing_connections: List[Dict[str, Any]]


class ValidationResponse(BaseModel):
    valid: bool
    issues: List[str]
    node_count: int
    edge_count: int
    view_count: int


@router.get("/model", response_model=SystemModelResponse)
def get_system_model():
    """
    Get the complete system architecture model.

    Returns the parsed system-model.yaml with all nodes, edges, and views.
    """
    service = ArchitectureService()
    try:
        model = service.load_model()
        return SystemModelResponse(
            version=model.version,
            views=[SystemViewResponse(id=v.id, title=v.title) for v in model.views],
            nodes=[
                SystemNodeResponse(
                    id=n.id,
                    name=n.name,
                    type=n.type,
                    tech=n.tech,
                    description=n.description,
                )
                for n in model.nodes
            ],
            edges=[
                SystemEdgeResponse(
                    source=e.source,
                    target=e.target,
                    relation=e.relation,
                    protocol=e.protocol,
                )
                for e in model.edges
            ],
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="System model file not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading model: {str(e)}")


@router.get("/diagram", response_model=DiagramResponse)
def get_architecture_diagram(
    view: str = Query("containers", description="View type: 'containers' or 'components'")
):
    """
    Generate a Mermaid diagram for the system architecture.

    The diagram can be rendered in the UI using a Mermaid renderer.
    """
    service = ArchitectureService()
    try:
        diagram = service.generate_mermaid(view=view)
        return DiagramResponse(
            view=view,
            format="mermaid",
            diagram=diagram,
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="System model file not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating diagram: {str(e)}")


@router.get("/nodes", response_model=List[SystemNodeResponse])
def list_nodes():
    """
    List all nodes in the system architecture.
    """
    service = ArchitectureService()
    try:
        model = service.load_model()
        return [
            SystemNodeResponse(
                id=n.id,
                name=n.name,
                type=n.type,
                tech=n.tech,
                description=n.description,
            )
            for n in model.nodes
        ]
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="System model file not found")


@router.get("/nodes/{node_id}", response_model=NodeDetailsResponse)
def get_node_details(node_id: str):
    """
    Get details for a specific architecture node including its connections.
    """
    service = ArchitectureService()
    try:
        details = service.get_node_details(node_id)
        if not details:
            raise HTTPException(status_code=404, detail=f"Node not found: {node_id}")

        return NodeDetailsResponse(
            node=SystemNodeResponse(**details["node"]),
            incoming_connections=details["incoming_connections"],
            outgoing_connections=details["outgoing_connections"],
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="System model file not found")


@router.get("/validate", response_model=ValidationResponse)
def validate_model():
    """
    Validate the system model for completeness and correctness.

    Checks for:
    - Required views
    - Orphan edges (referencing non-existent nodes)
    - Disconnected nodes
    """
    service = ArchitectureService()
    result = service.validate_model()
    return ValidationResponse(**result)


@router.get("/views", response_model=List[SystemViewResponse])
def list_views():
    """
    List available architecture views.
    """
    service = ArchitectureService()
    try:
        model = service.load_model()
        return [SystemViewResponse(id=v.id, title=v.title) for v in model.views]
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="System model file not found")
