import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent / "src" / "api"))

from collectors.kubernetes.label_inference import (
    infer_owner,
    infer_environment,
    _normalize_environment,
)


class TestInferOwner:
    def test_standard_kubernetes_managed_by_label(self):
        labels = {"app.kubernetes.io/managed-by": "helm"}
        assert infer_owner(labels) == "helm"

    def test_standard_kubernetes_part_of_label(self):
        labels = {"app.kubernetes.io/part-of": "ecommerce-platform"}
        assert infer_owner(labels) == "ecommerce-platform"

    def test_team_label(self):
        labels = {"team": "platform-team"}
        assert infer_owner(labels) == "platform-team"

    def test_owner_label(self):
        labels = {"owner": "devops"}
        assert infer_owner(labels) == "devops"

    def test_maintainer_label(self):
        labels = {"maintainer": "sre-team"}
        assert infer_owner(labels) == "sre-team"

    def test_fallback_to_annotations(self):
        labels = {}
        annotations = {"owner": "platform-team"}
        assert infer_owner(labels, annotations) == "platform-team"

    def test_labels_take_precedence_over_annotations(self):
        labels = {"team": "team-from-labels"}
        annotations = {"team": "team-from-annotations"}
        assert infer_owner(labels, annotations) == "team-from-labels"

    def test_none_when_no_labels(self):
        assert infer_owner(None) is None
        assert infer_owner({}) is None

    def test_none_when_no_matching_labels(self):
        labels = {"app": "my-app", "version": "v1"}
        assert infer_owner(labels) is None


class TestInferEnvironment:
    def test_environment_label(self):
        labels = {"environment": "production"}
        assert infer_environment(labels) == "production"

    def test_env_label(self):
        labels = {"env": "staging"}
        assert infer_environment(labels) == "staging"

    def test_stage_label(self):
        labels = {"stage": "dev"}
        assert infer_environment(labels) == "development"

    def test_kubernetes_environment_label(self):
        labels = {"app.kubernetes.io/environment": "test"}
        assert infer_environment(labels) == "testing"

    def test_fallback_to_annotations(self):
        labels = {}
        annotations = {"environment": "prod"}
        assert infer_environment(labels, annotations) == "production"

    def test_none_when_no_labels(self):
        assert infer_environment(None) is None
        assert infer_environment({}) is None


class TestNormalizeEnvironment:
    def test_normalizes_prod_variations(self):
        assert _normalize_environment("prod") == "production"
        assert _normalize_environment("production") == "production"
        assert _normalize_environment("prd") == "production"
        assert _normalize_environment("PROD") == "production"

    def test_normalizes_staging_variations(self):
        assert _normalize_environment("stg") == "staging"
        assert _normalize_environment("staging") == "staging"
        assert _normalize_environment("stage") == "staging"

    def test_normalizes_dev_variations(self):
        assert _normalize_environment("dev") == "development"
        assert _normalize_environment("development") == "development"

    def test_normalizes_test_variations(self):
        assert _normalize_environment("test") == "testing"
        assert _normalize_environment("testing") == "testing"
        assert _normalize_environment("qa") == "testing"

    def test_preserves_unknown_values(self):
        assert _normalize_environment("custom-env") == "custom-env"
        assert _normalize_environment("sandbox") == "sandbox"
