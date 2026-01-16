from .discovery import router as discovery_router
from .cmdb import router as cmdb_router
from .drift import router as drift_router
from .actions import router as actions_router
from .audit import router as audit_router
from .graph import router as graph_router
from .demo import router as demo_router
from .ai import router as ai_router

__all__ = [
    "discovery_router",
    "cmdb_router",
    "drift_router",
    "actions_router",
    "audit_router",
    "graph_router",
    "demo_router",
    "ai_router",
]
