import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "src" / "api"))

from collectors.kubernetes.normalizer import normalize_k8s_resource


class TestNormalizeK8sResource:
    def test_normalizes_deployment(self, sample_deployment):
        result = normalize_k8s_resource(sample_deployment)

        assert result["source_type"] == "kubernetes"
        assert result["kind"] == "Deployment"
        assert result["name"] == "test-app"
        assert result["namespace"] == "default"
        assert result["uid"] == "test-uid-123"
        assert result["labels"] == {
            "app": "test-app",
            "team": "platform",
            "environment": "prod"
        }
        assert result["annotations"] == {"description": "Test deployment"}
        assert result["owner"] == "platform"
        assert result["environment"] == "production"
        assert result["raw_data"] == sample_deployment

    def test_secret_strips_data_by_default(self, sample_secret):
        result = normalize_k8s_resource(sample_secret)

        assert result["kind"] == "Secret"
        assert result["name"] == "db-secret"
        # Verify sensitive data is stripped
        assert "data" not in result["raw_data"]
        assert "stringData" not in result["raw_data"]
        # Verify metadata is preserved
        assert result["raw_data"]["metadata"]["name"] == "db-secret"
        assert result["raw_data"]["type"] == "Opaque"

    def test_secret_includes_data_when_requested(self, sample_secret):
        result = normalize_k8s_resource(sample_secret, include_secret_data=True)

        assert result["kind"] == "Secret"
        # Verify sensitive data is preserved
        assert "data" in result["raw_data"]
        assert result["raw_data"]["data"]["password"] == "c2VjcmV0cGFzc3dvcmQ="

    def test_handles_missing_labels(self):
        resource = {
            "kind": "ConfigMap",
            "metadata": {
                "name": "test-cm",
                "namespace": "default",
                "uid": "cm-123"
            }
        }
        result = normalize_k8s_resource(resource)

        assert result["labels"] is None
        assert result["annotations"] is None
        assert result["owner"] is None
        assert result["environment"] is None

    def test_handles_empty_labels(self):
        resource = {
            "kind": "Service",
            "metadata": {
                "name": "test-svc",
                "namespace": "default",
                "uid": "svc-123",
                "labels": {},
                "annotations": {}
            }
        }
        result = normalize_k8s_resource(resource)

        assert result["labels"] is None
        assert result["annotations"] is None

    def test_handles_missing_metadata(self):
        resource = {"kind": "Unknown"}
        result = normalize_k8s_resource(resource)

        assert result["name"] == ""
        assert result["namespace"] is None
        assert result["uid"] is None

    def test_preserves_unknown_kind(self):
        resource = {
            "kind": "CustomResource",
            "metadata": {"name": "test", "namespace": "default"}
        }
        result = normalize_k8s_resource(resource)

        assert result["kind"] == "CustomResource"
