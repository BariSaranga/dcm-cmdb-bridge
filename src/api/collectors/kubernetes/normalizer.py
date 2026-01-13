from typing import Dict, Any
from .label_inference import infer_owner, infer_environment


def normalize_k8s_resource(raw: Dict[str, Any], include_secret_data: bool = False) -> Dict[str, Any]:
    """
    Normalize a Kubernetes resource to NormalizedEntity format.

    Args:
        raw: Raw K8s resource dict (from kubernetes-client or fixture)
        include_secret_data: If False, strip data from Secrets (metadata only)

    Returns:
        Dict matching NormalizedEntity fields:
        - source_type: "kubernetes"
        - kind: Resource kind (Deployment, Service, etc.)
        - name: Resource name
        - namespace: Resource namespace (if applicable)
        - uid: Kubernetes UID
        - labels: Resource labels dict
        - annotations: Resource annotations dict
        - owner: Inferred owner from labels/annotations
        - environment: Inferred environment from labels/annotations
        - raw_data: Complete resource data (sanitized for secrets)
    """
    metadata = raw.get("metadata", {})
    kind = raw.get("kind", "Unknown")

    labels = metadata.get("labels") or {}
    annotations = metadata.get("annotations") or {}

    # For secrets, strip sensitive data by default
    raw_data = raw
    if kind == "Secret" and not include_secret_data:
        raw_data = {
            "api_version": raw.get("api_version"),
            "kind": kind,
            "metadata": metadata,
            "type": raw.get("type"),
            # Intentionally omit "data" and "stringData"
        }

    return {
        "source_type": "kubernetes",
        "kind": kind,
        "name": metadata.get("name", ""),
        "namespace": metadata.get("namespace"),
        "uid": metadata.get("uid"),
        "labels": labels if labels else None,
        "annotations": annotations if annotations else None,
        "owner": infer_owner(labels, annotations),
        "environment": infer_environment(labels, annotations),
        "raw_data": raw_data,
    }
