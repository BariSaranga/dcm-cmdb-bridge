"""
Deterministic Demo Scenario: The Infrastructure Lie Detector

This creates a single, curated scenario demonstrating the gap between
runtime truth, CMDB reality, and organizational bureaucracy.

Scenario: "payment-service"
- Running in production for 8 months
- Publicly exposed via ingress (security risk)
- No owner labels (ownership unknown)
- Missing from CMDB
- No one has taken action
"""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from models import (
    Snapshot,
    NormalizedEntity,
    CMDBItem,
    DriftRecord,
    Action,
    AuditLog,
    GraphSnapshot,
    GraphNode,
    GraphEdge,
)


def clear_demo_data(db: Session) -> None:
    """Clear existing demo data to ensure clean state."""
    # Delete in reverse dependency order
    # Use try/except to handle cases where tables may not exist yet
    try:
        db.query(GraphEdge).delete()
        db.query(GraphNode).delete()
        db.query(GraphSnapshot).delete()
        db.query(AuditLog).delete()
        db.query(Action).delete()
        db.query(DriftRecord).delete()
        db.query(NormalizedEntity).delete()
        db.query(Snapshot).delete()
        db.query(CMDBItem).delete()
        db.commit()
    except Exception:
        db.rollback()


def seed_demo_scenario(db: Session) -> dict:
    """
    Seed the database with the Infrastructure Lie Detector demo scenario.

    Returns metadata about the created entities.
    """
    clear_demo_data(db)

    # Timeline: payment-service deployed 8 months ago
    eight_months_ago = datetime.utcnow() - timedelta(days=240)
    three_months_ago = datetime.utcnow() - timedelta(days=90)

    # ===================
    # 1. RUNTIME SNAPSHOT
    # ===================
    snapshot = Snapshot(
        source="kubernetes:prod-cluster",
        status="completed",
        entity_count=5
    )
    db.add(snapshot)
    db.flush()

    # The problematic payment-service (no owner, publicly exposed)
    payment_service_deployment = NormalizedEntity(
        snapshot_id=snapshot.id,
        source_type="kubernetes",
        kind="Deployment",
        name="payment-service",
        namespace="production",
        uid="deploy-payment-001",
        owner=None,  # NO OWNER - this is the problem
        environment="production",
        labels={"app": "payment-service", "tier": "backend"},
        annotations={"deployed-at": eight_months_ago.isoformat()},
        raw_data={
            "replicas": 3,
            "image": "payment-service:v1.2.3",
            "created": eight_months_ago.isoformat(),
            "last_updated": three_months_ago.isoformat()
        }
    )
    db.add(payment_service_deployment)

    # Publicly exposed ingress (security risk)
    payment_ingress = NormalizedEntity(
        snapshot_id=snapshot.id,
        source_type="kubernetes",
        kind="Ingress",
        name="payment-service-public",
        namespace="production",
        uid="ingress-payment-001",
        owner=None,
        environment="production",
        labels={"app": "payment-service"},
        raw_data={
            "host": "payments.example.com",
            "tls": False,  # No TLS!
            "public": True,
            "created": eight_months_ago.isoformat()
        }
    )
    db.add(payment_ingress)

    # Service for payment-service
    payment_svc = NormalizedEntity(
        snapshot_id=snapshot.id,
        source_type="kubernetes",
        kind="Service",
        name="payment-service",
        namespace="production",
        uid="svc-payment-001",
        owner=None,
        environment="production",
        labels={"app": "payment-service"},
        raw_data={"type": "ClusterIP", "port": 8080}
    )
    db.add(payment_svc)

    # A well-managed service for contrast
    auth_service = NormalizedEntity(
        snapshot_id=snapshot.id,
        source_type="kubernetes",
        kind="Deployment",
        name="auth-service",
        namespace="production",
        uid="deploy-auth-001",
        owner="platform-team",
        environment="production",
        labels={"app": "auth-service", "team": "platform-team"},
        raw_data={"replicas": 2, "image": "auth-service:v2.0.0"}
    )
    db.add(auth_service)

    # Another service with known owner
    api_gateway = NormalizedEntity(
        snapshot_id=snapshot.id,
        source_type="kubernetes",
        kind="Deployment",
        name="api-gateway",
        namespace="production",
        uid="deploy-gateway-001",
        owner="platform-team",
        environment="production",
        labels={"app": "api-gateway", "team": "platform-team"},
        raw_data={"replicas": 2, "image": "api-gateway:v3.1.0"}
    )
    db.add(api_gateway)
    db.flush()

    # ==============
    # 2. CMDB ITEMS
    # ==============
    # CMDB has auth-service and api-gateway, but NOT payment-service
    cmdb_auth = CMDBItem(
        ci_type="Deployment",
        name="auth-service",
        namespace="production",
        environment="production",
        owner="platform-team",
        status="active",
        description="Authentication service",
        metadata={"cost_center": "CC-1001", "criticality": "high"}
    )
    db.add(cmdb_auth)

    cmdb_gateway = CMDBItem(
        ci_type="Deployment",
        name="api-gateway",
        namespace="production",
        environment="production",
        owner="platform-team",
        status="active",
        description="API Gateway service",
        metadata={"cost_center": "CC-1001", "criticality": "high"}
    )
    db.add(cmdb_gateway)

    # Stale CMDB entry - legacy service no longer running
    cmdb_legacy = CMDBItem(
        ci_type="Deployment",
        name="legacy-billing",
        namespace="production",
        environment="production",
        owner="finance-team",
        status="active",  # Still marked active but doesn't exist!
        description="Legacy billing system",
        metadata={"cost_center": "CC-2001", "decommission_date": "2024-01-01"}
    )
    db.add(cmdb_legacy)
    db.flush()

    # ================
    # 3. DRIFT RECORDS
    # ================
    # payment-service: missing from CMDB
    drift_missing = DriftRecord(
        snapshot_id=snapshot.id,
        entity_id=payment_service_deployment.id,
        drift_type="missing_in_cmdb",
        severity="high",
        status="open",
        description="Runtime entity has no corresponding CMDB record",
        details={
            "entity_type": "Deployment",
            "entity_name": "payment-service",
            "entity_namespace": "production",
            "entity_uid": "deploy-payment-001",
            "running_since": eight_months_ago.isoformat(),
            "days_untracked": 240
        }
    )
    db.add(drift_missing)

    # payment-service: ownership unknown
    drift_ownership = DriftRecord(
        snapshot_id=snapshot.id,
        entity_id=payment_service_deployment.id,
        drift_type="ownership",
        severity="high",
        status="open",
        description="No owner label or annotation found",
        details={
            "entity_type": "Deployment",
            "entity_name": "payment-service",
            "entity_namespace": "production",
            "entity_uid": "deploy-payment-001",
            "expected": "team label or owner annotation",
            "actual": None
        }
    )
    db.add(drift_ownership)

    # payment-service: security risk (public exposure without TLS)
    drift_security = DriftRecord(
        snapshot_id=snapshot.id,
        entity_id=payment_ingress.id,
        drift_type="security",
        severity="critical",
        status="open",
        description="Publicly exposed service without TLS",
        details={
            "entity_type": "Ingress",
            "entity_name": "payment-service-public",
            "entity_namespace": "production",
            "entity_uid": "ingress-payment-001",
            "host": "payments.example.com",
            "tls_enabled": False,
            "public": True,
            "risk": "Data in transit is unencrypted"
        }
    )
    db.add(drift_security)

    # legacy-billing: stale in CMDB
    drift_stale = DriftRecord(
        snapshot_id=snapshot.id,
        cmdb_item_id=cmdb_legacy.id,
        drift_type="stale_in_cmdb",
        severity="medium",
        status="open",
        description="CMDB record exists but no runtime entity found",
        details={
            "entity_type": "Deployment",
            "entity_name": "legacy-billing",
            "entity_namespace": "production",
            "cmdb_status": "active",
            "last_seen": None
        }
    )
    db.add(drift_stale)
    db.flush()

    # ===============
    # 4. GRAPH BUILD
    # ===============
    graph = GraphSnapshot(
        snapshot_id=snapshot.id,
        status="completed",
        node_count=0,
        edge_count=0,
        created_at=datetime.utcnow(),
        completed_at=datetime.utcnow()
    )
    db.add(graph)
    db.flush()

    # Runtime nodes
    nodes = []

    # payment-service nodes (the problematic ones)
    node_payment_deploy = GraphNode(
        graph_snapshot_id=graph.id,
        node_id="runtime:Deployment:production:payment-service",
        node_type="runtime",
        kind="Deployment",
        name="payment-service",
        namespace="production",
        environment="production",
        owner=None,
        drift_status="missing_in_cmdb",
        metadata={
            "uid": "deploy-payment-001",
            "running_since": eight_months_ago.isoformat(),
            "replicas": 3,
            "has_drift": True,
            "drift_types": ["missing_in_cmdb", "ownership"]
        }
    )
    nodes.append(node_payment_deploy)

    node_payment_ingress = GraphNode(
        graph_snapshot_id=graph.id,
        node_id="runtime:Ingress:production:payment-service-public",
        node_type="runtime",
        kind="Ingress",
        name="payment-service-public",
        namespace="production",
        environment="production",
        owner=None,
        drift_status="security_risk",
        metadata={
            "uid": "ingress-payment-001",
            "host": "payments.example.com",
            "public": True,
            "tls": False,
            "has_drift": True,
            "drift_types": ["security"]
        }
    )
    nodes.append(node_payment_ingress)

    node_payment_svc = GraphNode(
        graph_snapshot_id=graph.id,
        node_id="runtime:Service:production:payment-service",
        node_type="runtime",
        kind="Service",
        name="payment-service",
        namespace="production",
        environment="production",
        owner=None,
        drift_status="missing_in_cmdb",
        metadata={"uid": "svc-payment-001"}
    )
    nodes.append(node_payment_svc)

    # Well-managed services
    node_auth = GraphNode(
        graph_snapshot_id=graph.id,
        node_id="runtime:Deployment:production:auth-service",
        node_type="runtime",
        kind="Deployment",
        name="auth-service",
        namespace="production",
        environment="production",
        owner="platform-team",
        drift_status="mapped",
        metadata={"uid": "deploy-auth-001", "has_drift": False}
    )
    nodes.append(node_auth)

    node_gateway = GraphNode(
        graph_snapshot_id=graph.id,
        node_id="runtime:Deployment:production:api-gateway",
        node_type="runtime",
        kind="Deployment",
        name="api-gateway",
        namespace="production",
        environment="production",
        owner="platform-team",
        drift_status="mapped",
        metadata={"uid": "deploy-gateway-001", "has_drift": False}
    )
    nodes.append(node_gateway)

    # CMDB nodes
    node_cmdb_auth = GraphNode(
        graph_snapshot_id=graph.id,
        node_id="cmdb:Deployment:production:auth-service",
        node_type="cmdb",
        kind="Deployment",
        name="auth-service",
        namespace="production",
        environment="production",
        owner="platform-team",
        drift_status="mapped",
        metadata={"cmdb_id": cmdb_auth.id, "status": "active"}
    )
    nodes.append(node_cmdb_auth)

    node_cmdb_gateway = GraphNode(
        graph_snapshot_id=graph.id,
        node_id="cmdb:Deployment:production:api-gateway",
        node_type="cmdb",
        kind="Deployment",
        name="api-gateway",
        namespace="production",
        environment="production",
        owner="platform-team",
        drift_status="mapped",
        metadata={"cmdb_id": cmdb_gateway.id, "status": "active"}
    )
    nodes.append(node_cmdb_gateway)

    node_cmdb_legacy = GraphNode(
        graph_snapshot_id=graph.id,
        node_id="cmdb:Deployment:production:legacy-billing",
        node_type="cmdb",
        kind="Deployment",
        name="legacy-billing",
        namespace="production",
        environment="production",
        owner="finance-team",
        drift_status="stale",
        metadata={"cmdb_id": cmdb_legacy.id, "status": "active", "stale": True}
    )
    nodes.append(node_cmdb_legacy)

    for node in nodes:
        db.add(node)
    db.flush()

    # Edges
    edges = []

    # Runtime relations
    edges.append(GraphEdge(
        graph_snapshot_id=graph.id,
        edge_id="edge-ingress-to-svc-payment",
        edge_type="routes_to",
        source_node_id="runtime:Ingress:production:payment-service-public",
        target_node_id="runtime:Service:production:payment-service",
        label="routes_to",
        extra_data={"host": "payments.example.com"}
    ))

    edges.append(GraphEdge(
        graph_snapshot_id=graph.id,
        edge_id="edge-svc-to-deploy-payment",
        edge_type="selects",
        source_node_id="runtime:Service:production:payment-service",
        target_node_id="runtime:Deployment:production:payment-service",
        label="selects",
        extra_data={}
    ))

    # CMDB mappings (for well-managed services)
    edges.append(GraphEdge(
        graph_snapshot_id=graph.id,
        edge_id="edge-auth-to-cmdb",
        edge_type="mapped_to_cmdb",
        source_node_id="runtime:Deployment:production:auth-service",
        target_node_id="cmdb:Deployment:production:auth-service",
        label="mapped",
        extra_data={"match_confidence": 1.0}
    ))

    edges.append(GraphEdge(
        graph_snapshot_id=graph.id,
        edge_id="edge-gateway-to-cmdb",
        edge_type="mapped_to_cmdb",
        source_node_id="runtime:Deployment:production:api-gateway",
        target_node_id="cmdb:Deployment:production:api-gateway",
        label="mapped",
        extra_data={"match_confidence": 1.0}
    ))

    for edge in edges:
        db.add(edge)

    # Update graph counts
    graph.node_count = len(nodes)
    graph.edge_count = len(edges)

    db.commit()

    return {
        "snapshot_id": snapshot.id,
        "graph_id": graph.id,
        "entities": {
            "runtime": 5,
            "cmdb": 3,
            "drift_records": 4,
            "graph_nodes": len(nodes),
            "graph_edges": len(edges)
        },
        "demo_focus": {
            "entity": "payment-service",
            "namespace": "production",
            "issues": [
                "Missing from CMDB (240 days)",
                "No owner assigned",
                "Publicly exposed without TLS"
            ]
        }
    }
