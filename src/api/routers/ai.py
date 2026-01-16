"""
AI Router - Infrastructure Lie Detector AI Endpoints

Provides evidence-based explanations about infrastructure drift
and organizational gaps.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from services import AIExplainerService

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


class ExplainRequest(BaseModel):
    """Request body for explain endpoint."""
    entity_type: str
    entity_name: str
    namespace: str = "production"


class EvidenceResponse(BaseModel):
    """Evidence item in explanation."""
    source: str
    entity_type: str
    entity_name: str
    fact: str
    data: dict

    class Config:
        from_attributes = True


class SuggestedActionResponse(BaseModel):
    """Suggested action in explanation."""
    action: str
    priority: str
    description: str
    rationale: str


class ExplanationResponse(BaseModel):
    """AI explanation response per ADR-0003."""
    summary: str
    headline: str
    evidence: list[EvidenceResponse]
    inference: str
    confidence: float
    why_it_matters: str
    risk_level: str
    suggested_actions: list[SuggestedActionResponse]
    highlighted_nodes: list[str]

    class Config:
        from_attributes = True


@router.post("/explain", response_model=ExplanationResponse)
def explain_entity(
    request: ExplainRequest,
    db: Session = Depends(get_db)
):
    """
    Generate an AI explanation for a specific entity.

    Returns evidence-based explanation with:
    - Summary of the situation
    - Headline for visual overlay
    - Evidence gathered from runtime, CMDB, drift, audit
    - Inference with confidence level
    - Risk assessment
    - Suggested actions
    - Node IDs to highlight in graph
    """
    service = AIExplainerService(db)
    explanation = service.explain_entity(
        entity_type=request.entity_type,
        entity_name=request.entity_name,
        namespace=request.namespace
    )
    return explanation.to_dict()


@router.get("/explain/{entity_type}/{namespace}/{entity_name}", response_model=ExplanationResponse)
def explain_entity_by_path(
    entity_type: str,
    namespace: str,
    entity_name: str,
    db: Session = Depends(get_db)
):
    """
    Generate an AI explanation for a specific entity (GET variant).

    Path parameters:
    - entity_type: Kind of entity (Deployment, Service, Ingress, etc.)
    - namespace: Kubernetes namespace
    - entity_name: Name of the entity
    """
    service = AIExplainerService(db)
    explanation = service.explain_entity(
        entity_type=entity_type,
        entity_name=entity_name,
        namespace=namespace
    )
    return explanation.to_dict()


@router.get("/demo", response_model=ExplanationResponse)
def get_demo_explanation(db: Session = Depends(get_db)):
    """
    Get the pre-built explanation for the demo scenario.

    This returns the explanation for the 'payment-service' entity,
    which demonstrates the Infrastructure Lie Detector concept:
    - Running for 8 months
    - No owner assigned
    - Missing from CMDB
    - Publicly exposed without TLS
    """
    service = AIExplainerService(db)
    explanation = service.get_demo_explanation()
    return explanation.to_dict()
