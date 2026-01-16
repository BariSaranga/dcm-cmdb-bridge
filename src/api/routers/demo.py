"""
Demo Router - Endpoints for the Infrastructure Lie Detector demo scenario.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from fixtures.demo_scenario import seed_demo_scenario

router = APIRouter(prefix="/api/v1/demo", tags=["demo"])


@router.post("/seed")
def seed_demo(db: Session = Depends(get_db)):
    """
    Reset database and seed with the Infrastructure Lie Detector demo scenario.

    This creates a curated scenario with:
    - payment-service: running 8 months, no owner, publicly exposed, missing from CMDB
    - auth-service: well-managed, mapped to CMDB
    - api-gateway: well-managed, mapped to CMDB
    - legacy-billing: stale CMDB entry (no longer running)
    """
    result = seed_demo_scenario(db)
    return {
        "status": "success",
        "message": "Demo scenario seeded successfully",
        **result
    }


@router.get("/scenario")
def get_demo_scenario():
    """
    Get information about the demo scenario without modifying data.
    """
    return {
        "name": "Infrastructure Lie Detector Demo",
        "description": "A single-service scenario demonstrating the gap between runtime truth and organizational reality",
        "focus_entity": {
            "name": "payment-service",
            "namespace": "production",
            "kind": "Deployment"
        },
        "issues_demonstrated": [
            {
                "type": "missing_in_cmdb",
                "severity": "high",
                "description": "Service running for 8 months with no CMDB record"
            },
            {
                "type": "ownership",
                "severity": "high",
                "description": "No owner assigned - accountability gap"
            },
            {
                "type": "security",
                "severity": "critical",
                "description": "Publicly exposed without TLS encryption"
            }
        ],
        "contrasting_entities": [
            {
                "name": "auth-service",
                "status": "Well-managed",
                "description": "Has owner, mapped to CMDB"
            },
            {
                "name": "api-gateway",
                "status": "Well-managed",
                "description": "Has owner, mapped to CMDB"
            }
        ],
        "headline": "This service has been running in production for 8 months. No owner. No CMDB record. Publicly exposed."
    }
