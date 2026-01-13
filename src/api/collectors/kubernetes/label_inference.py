from typing import Optional, Dict

# Standard Kubernetes recommended labels for owner inference
OWNER_LABELS = [
    "app.kubernetes.io/managed-by",
    "app.kubernetes.io/part-of",
    "team",
    "owner",
    "maintainer",
]

# Labels for environment inference
ENVIRONMENT_LABELS = [
    "environment",
    "env",
    "app.kubernetes.io/environment",
    "stage",
]


def infer_owner(
    labels: Optional[Dict[str, str]],
    annotations: Optional[Dict[str, str]] = None
) -> Optional[str]:
    """
    Infer resource owner from labels and annotations.

    Priority order:
    1. Standard Kubernetes labels (app.kubernetes.io/*)
    2. Common custom labels (team, owner, maintainer)
    3. Annotations as fallback

    Args:
        labels: Resource labels dict
        annotations: Resource annotations dict

    Returns:
        Owner string if found, None otherwise
    """
    if not labels:
        labels = {}
    if not annotations:
        annotations = {}

    # Check labels first
    for label_key in OWNER_LABELS:
        if label_key in labels:
            return labels[label_key]

    # Fallback to annotations
    for label_key in OWNER_LABELS:
        if label_key in annotations:
            return annotations[label_key]

    return None


def infer_environment(
    labels: Optional[Dict[str, str]],
    annotations: Optional[Dict[str, str]] = None
) -> Optional[str]:
    """
    Infer environment (dev/staging/prod) from labels and annotations.

    Args:
        labels: Resource labels dict
        annotations: Resource annotations dict

    Returns:
        Normalized environment string if found, None otherwise
    """
    if not labels:
        labels = {}
    if not annotations:
        annotations = {}

    for label_key in ENVIRONMENT_LABELS:
        if label_key in labels:
            return _normalize_environment(labels[label_key])

    for label_key in ENVIRONMENT_LABELS:
        if label_key in annotations:
            return _normalize_environment(annotations[label_key])

    return None


def _normalize_environment(value: str) -> str:
    """
    Normalize environment values to standard names.

    Maps common variations to canonical names:
    - prod, production, prd -> production
    - stg, staging, stage -> staging
    - dev, development -> development
    - test, testing, qa -> testing
    """
    value_lower = value.lower()

    if value_lower in ("prod", "production", "prd"):
        return "production"
    elif value_lower in ("stg", "staging", "stage"):
        return "staging"
    elif value_lower in ("dev", "development"):
        return "development"
    elif value_lower in ("test", "testing", "qa"):
        return "testing"

    return value
