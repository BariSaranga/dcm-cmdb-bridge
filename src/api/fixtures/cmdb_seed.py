"""
CMDB seed data for testing drift detection.

Scenarios covered:
- Matched: CMDB item exists and matches runtime entity
- Missing in CMDB: Runtime entity has no CMDB record
- Stale in CMDB: CMDB item exists but not in runtime
- Ownership drift: CMDB owner differs from runtime owner
- Lifecycle drift: CMDB says decommissioned but still running
"""

from typing import List, Dict, Any

CMDB_SEED_DATA: List[Dict[str, Any]] = [
    # Matched - frontend deployment (exact match)
    {
        "ci_type": "Deployment",
        "name": "frontend",
        "namespace": "production",
        "environment": "production",
        "owner": "platform-team",
        "status": "active",
        "description": "Frontend web application",
        "extra_data": {"tier": "web", "criticality": "high"}
    },
    # Ownership drift - backend-api has different owner in CMDB
    {
        "ci_type": "Deployment",
        "name": "backend-api",
        "namespace": "production",
        "environment": "production",
        "owner": "api-team",  # Runtime says "backend-team"
        "status": "active",
        "description": "Backend API service",
        "extra_data": {"tier": "api", "criticality": "high"}
    },
    # Matched - redis statefulset
    {
        "ci_type": "StatefulSet",
        "name": "redis",
        "namespace": "production",
        "environment": "production",
        "owner": "data-team",
        "status": "active",
        "description": "Redis cache cluster",
        "extra_data": {"tier": "data", "criticality": "high"}
    },
    # Stale in CMDB - exists in CMDB but not in runtime
    {
        "ci_type": "Deployment",
        "name": "legacy-service",
        "namespace": "production",
        "environment": "production",
        "owner": "legacy-team",
        "status": "active",  # Still marked active but doesn't exist
        "description": "Legacy service (should be decommissioned)",
        "extra_data": {"tier": "legacy", "criticality": "low"}
    },
    # Lifecycle drift - marked decommissioned but worker is running in staging
    {
        "ci_type": "Deployment",
        "name": "worker",
        "namespace": "staging",
        "environment": "staging",
        "owner": "batch-team",
        "status": "decommissioned",  # But it's still running!
        "description": "Background worker",
        "extra_data": {"tier": "worker", "criticality": "medium"}
    },
    # Missing in CMDB: frontend-svc, backend-api-svc, app-config, db-credentials
    # (These K8s resources have no CMDB entries - will be detected as structural drift)
]


def seed_cmdb_items(db_session) -> int:
    """
    Seed CMDB items into the database.

    Args:
        db_session: SQLAlchemy session

    Returns:
        Number of items created
    """
    from models.cmdb import CMDBItem

    count = 0
    for item_data in CMDB_SEED_DATA:
        # Check if item already exists
        existing = db_session.query(CMDBItem).filter(
            CMDBItem.ci_type == item_data["ci_type"],
            CMDBItem.name == item_data["name"],
            CMDBItem.namespace == item_data.get("namespace")
        ).first()

        if not existing:
            item = CMDBItem(**item_data)
            db_session.add(item)
            count += 1

    db_session.commit()
    return count
