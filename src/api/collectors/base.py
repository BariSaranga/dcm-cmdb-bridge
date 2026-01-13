from typing import Protocol, List, Dict, Any, runtime_checkable


@runtime_checkable
class Collector(Protocol):
    """Protocol defining the interface for all discovery collectors."""

    @property
    def source_type(self) -> str:
        """Return collector type identifier (e.g., 'kubernetes')."""
        ...

    @property
    def source_name(self) -> str:
        """Return specific source name (e.g., cluster name)."""
        ...

    async def discover(self) -> List[Dict[str, Any]]:
        """
        Perform discovery and return normalized entity dicts.

        Returns:
            List of dicts matching NormalizedEntity fields.
        """
        ...

    async def health_check(self) -> bool:
        """
        Verify connectivity to the source system.

        Returns:
            True if connection is healthy, False otherwise.
        """
        ...
