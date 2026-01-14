import pytest
import sys
from pathlib import Path

# Add src/api to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / "src" / "api"))

from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from database import Base, get_db
from main import app

# Import all models to ensure they are registered with Base
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


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    # Use in-memory SQLite for testing with settings for multi-threading
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session):
    """Create a FastAPI TestClient with database override."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def sample_snapshot(db_session):
    """Create a sample snapshot for testing."""
    from models import Snapshot

    snapshot = Snapshot(
        source="kubernetes:test-cluster",
        status="completed",
        entity_count=3
    )
    db_session.add(snapshot)
    db_session.commit()
    db_session.refresh(snapshot)
    return snapshot


@pytest.fixture
def sample_entities(db_session, sample_snapshot):
    """Create sample normalized entities for testing."""
    from models import NormalizedEntity

    entities = [
        NormalizedEntity(
            snapshot_id=sample_snapshot.id,
            source_type="kubernetes",
            kind="Deployment",
            name="frontend",
            namespace="production",
            uid="dep-001",
            owner="platform-team",
            environment="production"
        ),
        NormalizedEntity(
            snapshot_id=sample_snapshot.id,
            source_type="kubernetes",
            kind="Deployment",
            name="backend-api",
            namespace="production",
            uid="dep-002",
            owner="backend-team",
            environment="production"
        ),
        NormalizedEntity(
            snapshot_id=sample_snapshot.id,
            source_type="kubernetes",
            kind="Service",
            name="frontend-svc",
            namespace="production",
            uid="svc-001",
            owner="platform-team",
            environment="production"
        ),
    ]

    for entity in entities:
        db_session.add(entity)
    db_session.commit()

    return entities


@pytest.fixture
def sample_cmdb_items(db_session):
    """Create sample CMDB items for testing."""
    from models import CMDBItem

    items = [
        # Exact match for frontend
        CMDBItem(
            ci_type="Deployment",
            name="frontend",
            namespace="production",
            environment="production",
            owner="platform-team",
            status="active"
        ),
        # Ownership mismatch for backend-api
        CMDBItem(
            ci_type="Deployment",
            name="backend-api",
            namespace="production",
            environment="production",
            owner="api-team",  # Different from runtime
            status="active"
        ),
        # Stale item - not in runtime
        CMDBItem(
            ci_type="Deployment",
            name="legacy-service",
            namespace="production",
            environment="production",
            owner="legacy-team",
            status="active"
        ),
    ]

    for item in items:
        db_session.add(item)
    db_session.commit()

    return items
