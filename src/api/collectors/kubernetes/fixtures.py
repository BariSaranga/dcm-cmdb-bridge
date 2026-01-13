from typing import List, Dict, Any, Optional
from pathlib import Path

# Default fixture data for testing
DEFAULT_DEPLOYMENTS = [
    {
        "api_version": "apps/v1",
        "kind": "Deployment",
        "metadata": {
            "name": "frontend",
            "namespace": "production",
            "uid": "dep-frontend-001",
            "labels": {
                "app.kubernetes.io/name": "frontend",
                "app.kubernetes.io/part-of": "ecommerce",
                "team": "platform-team",
                "environment": "prod"
            },
            "annotations": {
                "deployment.kubernetes.io/revision": "3"
            }
        },
        "spec": {"replicas": 3}
    },
    {
        "api_version": "apps/v1",
        "kind": "Deployment",
        "metadata": {
            "name": "backend-api",
            "namespace": "production",
            "uid": "dep-backend-002",
            "labels": {
                "app": "backend-api",
                "owner": "backend-team",
                "env": "production"
            },
            "annotations": {}
        },
        "spec": {"replicas": 5}
    },
    {
        "api_version": "apps/v1",
        "kind": "Deployment",
        "metadata": {
            "name": "worker",
            "namespace": "staging",
            "uid": "dep-worker-003",
            "labels": {
                "app": "worker",
                "environment": "stg"
            },
            "annotations": {}
        },
        "spec": {"replicas": 2}
    }
]

DEFAULT_SERVICES = [
    {
        "api_version": "v1",
        "kind": "Service",
        "metadata": {
            "name": "frontend-svc",
            "namespace": "production",
            "uid": "svc-frontend-001",
            "labels": {
                "app.kubernetes.io/name": "frontend",
                "team": "platform-team"
            },
            "annotations": {}
        },
        "spec": {"type": "ClusterIP", "ports": [{"port": 80}]}
    },
    {
        "api_version": "v1",
        "kind": "Service",
        "metadata": {
            "name": "backend-api-svc",
            "namespace": "production",
            "uid": "svc-backend-002",
            "labels": {
                "app": "backend-api"
            },
            "annotations": {}
        },
        "spec": {"type": "ClusterIP", "ports": [{"port": 8080}]}
    }
]

DEFAULT_STATEFULSETS = [
    {
        "api_version": "apps/v1",
        "kind": "StatefulSet",
        "metadata": {
            "name": "redis",
            "namespace": "production",
            "uid": "sts-redis-001",
            "labels": {
                "app": "redis",
                "team": "data-team",
                "environment": "prod"
            },
            "annotations": {}
        },
        "spec": {"replicas": 3}
    }
]

DEFAULT_CONFIGMAPS = [
    {
        "api_version": "v1",
        "kind": "ConfigMap",
        "metadata": {
            "name": "app-config",
            "namespace": "production",
            "uid": "cm-config-001",
            "labels": {
                "app": "frontend"
            },
            "annotations": {}
        },
        "data": {"LOG_LEVEL": "info", "API_URL": "http://backend-api:8080"}
    }
]

DEFAULT_SECRETS = [
    {
        "api_version": "v1",
        "kind": "Secret",
        "metadata": {
            "name": "db-credentials",
            "namespace": "production",
            "uid": "secret-db-001",
            "labels": {
                "app": "backend-api"
            },
            "annotations": {}
        },
        "type": "Opaque",
        "data": {"username": "YWRtaW4=", "password": "c2VjcmV0"}
    }
]


class FixtureKubernetesClient:
    """Kubernetes client that returns deterministic fixture data for testing."""

    def __init__(
        self,
        deployments: Optional[List[Dict[str, Any]]] = None,
        services: Optional[List[Dict[str, Any]]] = None,
        statefulsets: Optional[List[Dict[str, Any]]] = None,
        configmaps: Optional[List[Dict[str, Any]]] = None,
        secrets: Optional[List[Dict[str, Any]]] = None,
    ):
        self._deployments = deployments if deployments is not None else DEFAULT_DEPLOYMENTS
        self._services = services if services is not None else DEFAULT_SERVICES
        self._statefulsets = statefulsets if statefulsets is not None else DEFAULT_STATEFULSETS
        self._configmaps = configmaps if configmaps is not None else DEFAULT_CONFIGMAPS
        self._secrets = secrets if secrets is not None else DEFAULT_SECRETS

    def _filter_by_namespace(
        self, items: List[Dict[str, Any]], namespace: Optional[str]
    ) -> List[Dict[str, Any]]:
        if namespace is None:
            return items
        return [i for i in items if i.get("metadata", {}).get("namespace") == namespace]

    async def list_deployments(self, namespace: Optional[str] = None) -> List[Dict[str, Any]]:
        return self._filter_by_namespace(self._deployments, namespace)

    async def list_services(self, namespace: Optional[str] = None) -> List[Dict[str, Any]]:
        return self._filter_by_namespace(self._services, namespace)

    async def list_statefulsets(self, namespace: Optional[str] = None) -> List[Dict[str, Any]]:
        return self._filter_by_namespace(self._statefulsets, namespace)

    async def list_configmaps(self, namespace: Optional[str] = None) -> List[Dict[str, Any]]:
        return self._filter_by_namespace(self._configmaps, namespace)

    async def list_secrets(self, namespace: Optional[str] = None) -> List[Dict[str, Any]]:
        return self._filter_by_namespace(self._secrets, namespace)
