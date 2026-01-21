"""
Architecture Visualizer Service

Parses the system-model.yaml and generates Mermaid diagrams
for platform architecture visualization.
"""

import os
from pathlib import Path
from typing import Dict, List, Optional, Any
import yaml
from pydantic import BaseModel


class SystemNode(BaseModel):
    """A node in the system architecture."""
    id: str
    name: str
    type: str
    tech: str
    description: str


class SystemEdge(BaseModel):
    """An edge representing a relationship between nodes."""
    source: str  # 'from' in YAML
    target: str  # 'to' in YAML
    relation: str
    protocol: Optional[str] = None


class SystemView(BaseModel):
    """A view definition for the architecture diagram."""
    id: str
    title: str


class SystemModel(BaseModel):
    """The complete system architecture model."""
    version: int
    views: List[SystemView]
    nodes: List[SystemNode]
    edges: List[SystemEdge]


class ArchitectureService:
    """
    Service for parsing system-model.yaml and generating Mermaid diagrams.
    """

    # Default path relative to project root
    DEFAULT_MODEL_PATH = "docs/architecture/system-model.yaml"

    # Node type to Mermaid shape mapping
    NODE_SHAPES = {
        "container": ("([", "])"),       # Stadium shape for containers
        "datastore": ("[(", ")]"),       # Cylinder shape for datastores
        "external": ("{{", "}}"),        # Hexagon shape for external systems
    }

    # Node type to CSS class mapping for styling
    NODE_CLASSES = {
        "container": "container",
        "datastore": "datastore",
        "external": "external",
    }

    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize the architecture service.

        Args:
            model_path: Optional path to the system-model.yaml file.
                       If not provided, uses the default path.
        """
        if model_path:
            self.model_path = Path(model_path)
        else:
            # Navigate from src/api to project root
            project_root = Path(__file__).parent.parent.parent.parent
            self.model_path = project_root / self.DEFAULT_MODEL_PATH

    def load_model(self) -> SystemModel:
        """
        Load and parse the system-model.yaml file.

        Returns:
            SystemModel instance

        Raises:
            FileNotFoundError: If the model file doesn't exist
            ValueError: If the YAML is invalid
        """
        if not self.model_path.exists():
            raise FileNotFoundError(f"System model not found: {self.model_path}")

        with open(self.model_path, "r") as f:
            data = yaml.safe_load(f)

        if not data:
            raise ValueError("System model is empty")

        # Parse views
        views = [
            SystemView(id=v["id"], title=v["title"])
            for v in data.get("views", [])
        ]

        # Parse nodes
        nodes = [
            SystemNode(
                id=n["id"],
                name=n["name"],
                type=n["type"],
                tech=n["tech"],
                description=n["description"],
            )
            for n in data.get("nodes", [])
        ]

        # Parse edges
        edges = [
            SystemEdge(
                source=e["from"],
                target=e["to"],
                relation=e["relation"],
                protocol=e.get("protocol"),
            )
            for e in data.get("edges", [])
        ]

        return SystemModel(
            version=data.get("version", 1),
            views=views,
            nodes=nodes,
            edges=edges,
        )

    def get_model_dict(self) -> Dict[str, Any]:
        """
        Get the system model as a dictionary.

        Returns:
            Dictionary representation of the system model
        """
        model = self.load_model()
        return model.model_dump()

    def generate_mermaid(self, view: str = "containers") -> str:
        """
        Generate a Mermaid diagram from the system model.

        Args:
            view: The view type to generate ('containers' or 'components')

        Returns:
            Mermaid diagram as a string
        """
        model = self.load_model()
        lines = []

        # Diagram header
        lines.append("flowchart TB")
        lines.append("")

        # Add class definitions for styling
        lines.append("    %% Styling")
        lines.append("    classDef container fill:#6366f1,stroke:#4f46e5,color:#fff")
        lines.append("    classDef datastore fill:#10b981,stroke:#059669,color:#fff")
        lines.append("    classDef external fill:#8b5cf6,stroke:#7c3aed,color:#fff")
        lines.append("")

        # Add subgraph for internal components
        internal_nodes = [n for n in model.nodes if n.type != "external"]
        external_nodes = [n for n in model.nodes if n.type == "external"]

        if internal_nodes:
            lines.append("    subgraph platform[DCM-CMDB Bridge Platform]")
            lines.append("        direction TB")
            for node in internal_nodes:
                node_def = self._format_node(node)
                lines.append(f"        {node_def}")
            lines.append("    end")
            lines.append("")

        # Add external systems
        if external_nodes:
            lines.append("    subgraph external_systems[External Systems]")
            lines.append("        direction TB")
            for node in external_nodes:
                node_def = self._format_node(node)
                lines.append(f"        {node_def}")
            lines.append("    end")
            lines.append("")

        # Add edges
        lines.append("    %% Relationships")
        for edge in model.edges:
            edge_def = self._format_edge(edge)
            lines.append(f"    {edge_def}")
        lines.append("")

        # Apply classes
        lines.append("    %% Apply styles")
        for node in model.nodes:
            css_class = self.NODE_CLASSES.get(node.type, "container")
            lines.append(f"    class {node.id} {css_class}")

        return "\n".join(lines)

    def _format_node(self, node: SystemNode) -> str:
        """Format a node for Mermaid syntax."""
        left, right = self.NODE_SHAPES.get(node.type, ("([", "])"))
        label = f"{node.name}<br/><small>{node.tech}</small>"
        return f'{node.id}{left}"{label}"{right}'

    def _format_edge(self, edge: SystemEdge) -> str:
        """Format an edge for Mermaid syntax."""
        # Create label from relation and optional protocol
        label = edge.relation.replace("_", " ")
        if edge.protocol:
            label += f" ({edge.protocol})"

        # Use different arrow styles based on relation type
        if "reads" in edge.relation or "writes" in edge.relation:
            arrow = "<-->"  # Bidirectional for read/write
        elif "optional" in edge.relation:
            arrow = "-.->"  # Dotted for optional
        else:
            arrow = "-->"  # Standard arrow

        return f'{edge.source} {arrow}|"{label}"| {edge.target}'

    def get_node_details(self, node_id: str) -> Optional[Dict[str, Any]]:
        """
        Get details for a specific node including its connections.

        Args:
            node_id: The ID of the node

        Returns:
            Dictionary with node details and connections, or None if not found
        """
        model = self.load_model()

        # Find the node
        node = next((n for n in model.nodes if n.id == node_id), None)
        if not node:
            return None

        # Find connections
        incoming = [e for e in model.edges if e.target == node_id]
        outgoing = [e for e in model.edges if e.source == node_id]

        return {
            "node": node.model_dump(),
            "incoming_connections": [
                {
                    "from": e.source,
                    "from_name": next((n.name for n in model.nodes if n.id == e.source), e.source),
                    "relation": e.relation,
                    "protocol": e.protocol,
                }
                for e in incoming
            ],
            "outgoing_connections": [
                {
                    "to": e.target,
                    "to_name": next((n.name for n in model.nodes if n.id == e.target), e.target),
                    "relation": e.relation,
                    "protocol": e.protocol,
                }
                for e in outgoing
            ],
        }

    def validate_model(self) -> Dict[str, Any]:
        """
        Validate the system model for completeness and correctness.

        Returns:
            Dictionary with validation results
        """
        issues = []

        try:
            model = self.load_model()
        except FileNotFoundError as e:
            return {"valid": False, "issues": [str(e)]}
        except Exception as e:
            return {"valid": False, "issues": [f"Parse error: {str(e)}"]}

        # Check for required views
        view_ids = {v.id for v in model.views}
        if "containers" not in view_ids:
            issues.append("Missing required view: 'containers'")

        # Check for orphan edges (edges referencing non-existent nodes)
        node_ids = {n.id for n in model.nodes}
        for edge in model.edges:
            if edge.source not in node_ids:
                issues.append(f"Edge references unknown source node: {edge.source}")
            if edge.target not in node_ids:
                issues.append(f"Edge references unknown target node: {edge.target}")

        # Check for nodes without any connections
        connected_nodes = set()
        for edge in model.edges:
            connected_nodes.add(edge.source)
            connected_nodes.add(edge.target)

        for node in model.nodes:
            if node.id not in connected_nodes:
                issues.append(f"Node has no connections: {node.id}")

        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "node_count": len(model.nodes),
            "edge_count": len(model.edges),
            "view_count": len(model.views),
        }
