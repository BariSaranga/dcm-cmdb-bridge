import pytest
import sys
from pathlib import Path

# Add src/api to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "src" / "api"))

from collectors.kubernetes.fixtures import FixtureKubernetesClient
from collectors.kubernetes.collector import KubernetesCollector, KubernetesCollectorConfig


@pytest.fixture
def fixture_client():
    """Create fixture client with default test data."""
    return FixtureKubernetesClient()


@pytest.fixture
def collector(fixture_client):
    """Create collector with fixture client."""
    config = KubernetesCollectorConfig(cluster_name="test-cluster")
    return KubernetesCollector(config=config, client=fixture_client)


@pytest.fixture
def sample_deployment():
    """Sample Kubernetes Deployment resource."""
    return {
        "api_version": "apps/v1",
        "kind": "Deployment",
        "metadata": {
            "name": "test-app",
            "namespace": "default",
            "uid": "test-uid-123",
            "labels": {
                "app": "test-app",
                "team": "platform",
                "environment": "prod"
            },
            "annotations": {
                "description": "Test deployment"
            }
        },
        "spec": {"replicas": 3}
    }


@pytest.fixture
def sample_secret():
    """Sample Kubernetes Secret resource."""
    return {
        "api_version": "v1",
        "kind": "Secret",
        "metadata": {
            "name": "db-secret",
            "namespace": "default",
            "uid": "secret-uid-456",
            "labels": {},
            "annotations": {}
        },
        "type": "Opaque",
        "data": {
            "password": "c2VjcmV0cGFzc3dvcmQ="
        }
    }
