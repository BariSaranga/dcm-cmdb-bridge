from typing import Dict, Callable, List, Any
from .base import Collector

_collectors: Dict[str, Callable[..., Collector]] = {}


def register_collector(source_type: str):
    """
    Decorator to register a collector factory function.

    Usage:
        @register_collector("kubernetes")
        def create_kubernetes_collector(**kwargs) -> KubernetesCollector:
            return KubernetesCollector(**kwargs)
    """
    def decorator(factory: Callable[..., Collector]) -> Callable[..., Collector]:
        _collectors[source_type] = factory
        return factory
    return decorator


def get_collector(source_type: str, **kwargs: Any) -> Collector:
    """
    Get a collector instance by type.

    Args:
        source_type: The collector type identifier (e.g., 'kubernetes')
        **kwargs: Arguments passed to the collector factory

    Returns:
        Collector instance

    Raises:
        ValueError: If source_type is not registered
    """
    if source_type not in _collectors:
        raise ValueError(f"Unknown collector type: {source_type}")
    return _collectors[source_type](**kwargs)


def list_collectors() -> List[str]:
    """List all registered collector types."""
    return list(_collectors.keys())
