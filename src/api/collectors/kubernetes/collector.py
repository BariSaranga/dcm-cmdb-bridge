from typing import List, Dict, Any, Optional
from dataclasses import dataclass

from ..registry import register_collector
from .client import KubernetesClient, KubernetesClientConfig, RealKubernetesClient
from .normalizer import normalize_k8s_resource


@dataclass
class KubernetesCollectorConfig:
    """Configuration for Kubernetes collector."""
    cluster_name: str
    client_config: Optional[KubernetesClientConfig] = None
    namespaces: Optional[List[str]] = None  # None = all namespaces
    include_secret_data: bool = False


class KubernetesCollector:
    """Collector for Kubernetes cluster resources."""

    def __init__(
        self,
        config: KubernetesCollectorConfig,
        client: Optional[KubernetesClient] = None
    ):
        """
        Initialize Kubernetes collector.

        Args:
            config: Collector configuration
            client: Optional client (for testing with fixtures)
        """
        self.config = config
        self._client = client
        if self._client is None and config.client_config is not None:
            self._client = RealKubernetesClient(config.client_config)

    @property
    def source_type(self) -> str:
        return "kubernetes"

    @property
    def source_name(self) -> str:
        return self.config.cluster_name

    async def health_check(self) -> bool:
        """Check if we can connect to the cluster."""
        if self._client is None:
            return False
        try:
            await self._client.list_deployments(namespace="default")
            return True
        except Exception:
            return False

    async def discover(self) -> List[Dict[str, Any]]:
        """
        Discover all supported resources from Kubernetes.

        Returns:
            List of normalized entity dicts ready for database insertion.
        """
        if self._client is None:
            raise RuntimeError("No Kubernetes client configured")

        entities = []
        namespaces = self.config.namespaces

        # Helper to filter by namespace if configured
        def should_include(item: Dict[str, Any]) -> bool:
            if namespaces is None:
                return True
            item_ns = item.get("metadata", {}).get("namespace")
            return item_ns in namespaces

        # Collect Deployments
        deployments = await self._client.list_deployments()
        for dep in deployments:
            if "kind" not in dep:
                dep["kind"] = "Deployment"
            if should_include(dep):
                entities.append(normalize_k8s_resource(dep))

        # Collect Services
        services = await self._client.list_services()
        for svc in services:
            if "kind" not in svc:
                svc["kind"] = "Service"
            if should_include(svc):
                entities.append(normalize_k8s_resource(svc))

        # Collect StatefulSets
        statefulsets = await self._client.list_statefulsets()
        for sts in statefulsets:
            if "kind" not in sts:
                sts["kind"] = "StatefulSet"
            if should_include(sts):
                entities.append(normalize_k8s_resource(sts))

        # Collect ConfigMaps
        configmaps = await self._client.list_configmaps()
        for cm in configmaps:
            if "kind" not in cm:
                cm["kind"] = "ConfigMap"
            if should_include(cm):
                entities.append(normalize_k8s_resource(cm))

        # Collect Secrets (metadata only by default)
        secrets = await self._client.list_secrets()
        for secret in secrets:
            if "kind" not in secret:
                secret["kind"] = "Secret"
            if should_include(secret):
                entities.append(
                    normalize_k8s_resource(
                        secret,
                        include_secret_data=self.config.include_secret_data
                    )
                )

        return entities


@register_collector("kubernetes")
def create_kubernetes_collector(
    cluster_name: str,
    client_config: Optional[KubernetesClientConfig] = None,
    namespaces: Optional[List[str]] = None,
    include_secret_data: bool = False,
    client: Optional[KubernetesClient] = None,
) -> KubernetesCollector:
    """Factory function for Kubernetes collector."""
    config = KubernetesCollectorConfig(
        cluster_name=cluster_name,
        client_config=client_config,
        namespaces=namespaces,
        include_secret_data=include_secret_data,
    )
    return KubernetesCollector(config=config, client=client)
