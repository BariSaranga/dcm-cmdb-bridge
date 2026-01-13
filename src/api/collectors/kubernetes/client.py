from typing import Protocol, List, Dict, Any, Optional
from dataclasses import dataclass, field


class KubernetesClient(Protocol):
    """Protocol for Kubernetes API interactions."""

    async def list_deployments(self, namespace: Optional[str] = None) -> List[Dict[str, Any]]:
        """List Deployment resources."""
        ...

    async def list_services(self, namespace: Optional[str] = None) -> List[Dict[str, Any]]:
        """List Service resources."""
        ...

    async def list_statefulsets(self, namespace: Optional[str] = None) -> List[Dict[str, Any]]:
        """List StatefulSet resources."""
        ...

    async def list_configmaps(self, namespace: Optional[str] = None) -> List[Dict[str, Any]]:
        """List ConfigMap resources."""
        ...

    async def list_secrets(self, namespace: Optional[str] = None) -> List[Dict[str, Any]]:
        """List Secret resources."""
        ...


@dataclass
class KubernetesClientConfig:
    """Configuration for Kubernetes client."""
    kubeconfig_path: Optional[str] = None
    context: Optional[str] = None
    in_cluster: bool = False


class RealKubernetesClient:
    """Real Kubernetes client using kubernetes-client library."""

    def __init__(self, config: KubernetesClientConfig):
        self.config = config
        self._core_v1 = None
        self._apps_v1 = None

    def _init_client(self):
        """Initialize Kubernetes client (lazy loading)."""
        if self._core_v1 is None:
            from kubernetes import client, config as k8s_config

            if self.config.in_cluster:
                k8s_config.load_incluster_config()
            else:
                k8s_config.load_kube_config(
                    config_file=self.config.kubeconfig_path,
                    context=self.config.context
                )
            self._core_v1 = client.CoreV1Api()
            self._apps_v1 = client.AppsV1Api()

    async def list_deployments(self, namespace: Optional[str] = None) -> List[Dict[str, Any]]:
        self._init_client()
        if namespace:
            result = self._apps_v1.list_namespaced_deployment(namespace)
        else:
            result = self._apps_v1.list_deployment_for_all_namespaces()
        return [item.to_dict() for item in result.items]

    async def list_services(self, namespace: Optional[str] = None) -> List[Dict[str, Any]]:
        self._init_client()
        if namespace:
            result = self._core_v1.list_namespaced_service(namespace)
        else:
            result = self._core_v1.list_service_for_all_namespaces()
        return [item.to_dict() for item in result.items]

    async def list_statefulsets(self, namespace: Optional[str] = None) -> List[Dict[str, Any]]:
        self._init_client()
        if namespace:
            result = self._apps_v1.list_namespaced_stateful_set(namespace)
        else:
            result = self._apps_v1.list_stateful_set_for_all_namespaces()
        return [item.to_dict() for item in result.items]

    async def list_configmaps(self, namespace: Optional[str] = None) -> List[Dict[str, Any]]:
        self._init_client()
        if namespace:
            result = self._core_v1.list_namespaced_config_map(namespace)
        else:
            result = self._core_v1.list_config_map_for_all_namespaces()
        return [item.to_dict() for item in result.items]

    async def list_secrets(self, namespace: Optional[str] = None) -> List[Dict[str, Any]]:
        self._init_client()
        if namespace:
            result = self._core_v1.list_namespaced_secret(namespace)
        else:
            result = self._core_v1.list_secret_for_all_namespaces()
        return [item.to_dict() for item in result.items]
