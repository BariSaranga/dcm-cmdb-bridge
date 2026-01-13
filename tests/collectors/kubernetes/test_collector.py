import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "src" / "api"))

from collectors.kubernetes.collector import KubernetesCollector, KubernetesCollectorConfig
from collectors.kubernetes.fixtures import FixtureKubernetesClient


class TestKubernetesCollector:
    @pytest.mark.asyncio
    async def test_discover_returns_normalized_entities(self, collector):
        entities = await collector.discover()

        assert len(entities) > 0
        for entity in entities:
            assert entity["source_type"] == "kubernetes"
            assert "kind" in entity
            assert "name" in entity
            assert "namespace" in entity

    @pytest.mark.asyncio
    async def test_discover_extracts_deployments(self, collector):
        entities = await collector.discover()

        deployments = [e for e in entities if e["kind"] == "Deployment"]
        assert len(deployments) >= 1

        # Verify deployment structure
        dep = deployments[0]
        assert dep["source_type"] == "kubernetes"
        assert dep["name"] is not None

    @pytest.mark.asyncio
    async def test_discover_extracts_services(self, collector):
        entities = await collector.discover()

        services = [e for e in entities if e["kind"] == "Service"]
        assert len(services) >= 1

    @pytest.mark.asyncio
    async def test_discover_extracts_statefulsets(self, collector):
        entities = await collector.discover()

        statefulsets = [e for e in entities if e["kind"] == "StatefulSet"]
        assert len(statefulsets) >= 1

    @pytest.mark.asyncio
    async def test_discover_extracts_configmaps(self, collector):
        entities = await collector.discover()

        configmaps = [e for e in entities if e["kind"] == "ConfigMap"]
        assert len(configmaps) >= 1

    @pytest.mark.asyncio
    async def test_discover_extracts_secrets(self, collector):
        entities = await collector.discover()

        secrets = [e for e in entities if e["kind"] == "Secret"]
        assert len(secrets) >= 1

    @pytest.mark.asyncio
    async def test_secrets_exclude_data_by_default(self, collector):
        entities = await collector.discover()

        secrets = [e for e in entities if e["kind"] == "Secret"]
        for secret in secrets:
            raw = secret["raw_data"]
            assert "data" not in raw
            assert "stringData" not in raw

    @pytest.mark.asyncio
    async def test_infers_owner_from_labels(self, collector):
        entities = await collector.discover()

        # At least some entities should have owner inferred
        with_owner = [e for e in entities if e["owner"] is not None]
        assert len(with_owner) > 0

    @pytest.mark.asyncio
    async def test_infers_environment_from_labels(self, collector):
        entities = await collector.discover()

        # At least some entities should have environment inferred
        with_env = [e for e in entities if e["environment"] is not None]
        assert len(with_env) > 0

    def test_source_type(self, collector):
        assert collector.source_type == "kubernetes"

    def test_source_name(self, collector):
        assert collector.source_name == "test-cluster"

    @pytest.mark.asyncio
    async def test_namespace_filtering(self, fixture_client):
        config = KubernetesCollectorConfig(
            cluster_name="test-cluster",
            namespaces=["production"]
        )
        collector = KubernetesCollector(config=config, client=fixture_client)

        entities = await collector.discover()

        # All entities should be from production namespace
        for entity in entities:
            assert entity["namespace"] == "production"

    @pytest.mark.asyncio
    async def test_raises_without_client(self):
        config = KubernetesCollectorConfig(cluster_name="test-cluster")
        collector = KubernetesCollector(config=config, client=None)

        with pytest.raises(RuntimeError, match="No Kubernetes client configured"):
            await collector.discover()


class TestKubernetesCollectorHealthCheck:
    @pytest.mark.asyncio
    async def test_health_check_returns_true_with_working_client(self, collector):
        result = await collector.health_check()
        assert result is True

    @pytest.mark.asyncio
    async def test_health_check_returns_false_without_client(self):
        config = KubernetesCollectorConfig(cluster_name="test-cluster")
        collector = KubernetesCollector(config=config, client=None)

        result = await collector.health_check()
        assert result is False
