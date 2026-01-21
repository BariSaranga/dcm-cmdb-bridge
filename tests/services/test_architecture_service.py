import pytest
import tempfile
import os
from pathlib import Path

from services import ArchitectureService


class TestArchitectureService:
    """Tests for the Architecture Visualizer service."""

    @pytest.fixture
    def temp_model_file(self):
        """Create a temporary system-model.yaml for testing."""
        content = """
version: 1
views:
  - id: containers
    title: Platform Containers View
  - id: components
    title: Platform Components View

nodes:
  - id: ui
    name: Web UI
    type: container
    tech: React
    description: User interface
  - id: api
    name: API
    type: container
    tech: FastAPI
    description: REST API
  - id: db
    name: Database
    type: datastore
    tech: Postgres
    description: Data persistence
  - id: external
    name: External Service
    type: external
    tech: REST
    description: Third party service

edges:
  - from: ui
    to: api
    relation: calls
    protocol: https
  - from: api
    to: db
    relation: reads_writes
  - from: api
    to: external
    relation: calls_optional
"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            f.write(content)
            f.flush()
            yield f.name
        os.unlink(f.name)

    def test_load_model(self, temp_model_file):
        """Test loading and parsing system model."""
        service = ArchitectureService(model_path=temp_model_file)
        model = service.load_model()

        assert model.version == 1
        assert len(model.views) == 2
        assert len(model.nodes) == 4
        assert len(model.edges) == 3

    def test_load_model_views(self, temp_model_file):
        """Test that views are correctly parsed."""
        service = ArchitectureService(model_path=temp_model_file)
        model = service.load_model()

        view_ids = [v.id for v in model.views]
        assert "containers" in view_ids
        assert "components" in view_ids

    def test_load_model_nodes(self, temp_model_file):
        """Test that nodes are correctly parsed with all fields."""
        service = ArchitectureService(model_path=temp_model_file)
        model = service.load_model()

        node_map = {n.id: n for n in model.nodes}

        assert "ui" in node_map
        assert node_map["ui"].name == "Web UI"
        assert node_map["ui"].type == "container"
        assert node_map["ui"].tech == "React"

        assert "db" in node_map
        assert node_map["db"].type == "datastore"

        assert "external" in node_map
        assert node_map["external"].type == "external"

    def test_load_model_edges(self, temp_model_file):
        """Test that edges are correctly parsed."""
        service = ArchitectureService(model_path=temp_model_file)
        model = service.load_model()

        edge_map = {(e.source, e.target): e for e in model.edges}

        assert ("ui", "api") in edge_map
        assert edge_map[("ui", "api")].relation == "calls"
        assert edge_map[("ui", "api")].protocol == "https"

        assert ("api", "db") in edge_map
        assert edge_map[("api", "db")].relation == "reads_writes"
        assert edge_map[("api", "db")].protocol is None

    def test_load_model_file_not_found(self):
        """Test that missing model file raises FileNotFoundError."""
        service = ArchitectureService(model_path="/nonexistent/path.yaml")

        with pytest.raises(FileNotFoundError):
            service.load_model()

    def test_get_model_dict(self, temp_model_file):
        """Test getting model as dictionary."""
        service = ArchitectureService(model_path=temp_model_file)
        model_dict = service.get_model_dict()

        assert "version" in model_dict
        assert "views" in model_dict
        assert "nodes" in model_dict
        assert "edges" in model_dict
        assert model_dict["version"] == 1

    def test_generate_mermaid(self, temp_model_file):
        """Test Mermaid diagram generation."""
        service = ArchitectureService(model_path=temp_model_file)
        diagram = service.generate_mermaid()

        # Check diagram header
        assert "flowchart TB" in diagram

        # Check node definitions are present
        assert "ui" in diagram
        assert "api" in diagram
        assert "db" in diagram
        assert "external" in diagram

        # Check styling classes
        assert "classDef container" in diagram
        assert "classDef datastore" in diagram
        assert "classDef external" in diagram

        # Check edge relationships
        assert "calls" in diagram
        assert "reads writes" in diagram

    def test_generate_mermaid_subgraphs(self, temp_model_file):
        """Test that Mermaid diagram has proper subgraphs."""
        service = ArchitectureService(model_path=temp_model_file)
        diagram = service.generate_mermaid()

        # Internal components should be in platform subgraph
        assert "subgraph platform" in diagram

        # External systems should be in external_systems subgraph
        assert "subgraph external_systems" in diagram

    def test_generate_mermaid_arrows(self, temp_model_file):
        """Test that Mermaid diagram uses correct arrow types."""
        service = ArchitectureService(model_path=temp_model_file)
        diagram = service.generate_mermaid()

        # Standard arrow for calls
        assert "-->" in diagram

        # Bidirectional for reads_writes
        assert "<-->" in diagram

        # Dotted for optional
        assert "-.->" in diagram

    def test_get_node_details(self, temp_model_file):
        """Test getting details for a specific node."""
        service = ArchitectureService(model_path=temp_model_file)
        details = service.get_node_details("api")

        assert details is not None
        assert details["node"]["id"] == "api"
        assert details["node"]["name"] == "API"

        # API has incoming from UI
        assert len(details["incoming_connections"]) == 1
        assert details["incoming_connections"][0]["from"] == "ui"

        # API has outgoing to db and external
        assert len(details["outgoing_connections"]) == 2

    def test_get_node_details_not_found(self, temp_model_file):
        """Test that non-existent node returns None."""
        service = ArchitectureService(model_path=temp_model_file)
        details = service.get_node_details("nonexistent")

        assert details is None

    def test_validate_model_valid(self, temp_model_file):
        """Test validation of a valid model."""
        service = ArchitectureService(model_path=temp_model_file)
        result = service.validate_model()

        assert result["valid"] is True
        assert len(result["issues"]) == 0
        assert result["node_count"] == 4
        assert result["edge_count"] == 3
        assert result["view_count"] == 2

    def test_validate_model_missing_file(self):
        """Test validation when model file is missing."""
        service = ArchitectureService(model_path="/nonexistent/path.yaml")
        result = service.validate_model()

        assert result["valid"] is False
        assert len(result["issues"]) > 0

    @pytest.fixture
    def invalid_model_file(self):
        """Create a model with validation issues."""
        content = """
version: 1
views:
  - id: components
    title: Components Only

nodes:
  - id: ui
    name: Web UI
    type: container
    tech: React
    description: User interface
  - id: orphan
    name: Orphan Node
    type: container
    tech: Unknown
    description: No connections

edges:
  - from: ui
    to: missing_node
    relation: calls
"""
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False) as f:
            f.write(content)
            f.flush()
            yield f.name
        os.unlink(f.name)

    def test_validate_model_issues(self, invalid_model_file):
        """Test validation detects issues."""
        service = ArchitectureService(model_path=invalid_model_file)
        result = service.validate_model()

        assert result["valid"] is False
        issues = result["issues"]

        # Should detect missing required 'containers' view
        assert any("containers" in issue for issue in issues)

        # Should detect orphan edge to missing_node
        assert any("missing_node" in issue for issue in issues)

        # Should detect orphan node with no connections
        assert any("orphan" in issue for issue in issues)


class TestArchitectureServiceWithRealModel:
    """Tests using the actual system-model.yaml file."""

    def test_load_real_model(self):
        """Test loading the actual system-model.yaml."""
        service = ArchitectureService()

        # This test only runs if the real file exists
        try:
            model = service.load_model()
            assert model.version >= 1
            assert len(model.nodes) > 0
            assert len(model.edges) > 0
        except FileNotFoundError:
            pytest.skip("Real system-model.yaml not found")

    def test_validate_real_model(self):
        """Test that the real system-model.yaml is valid."""
        service = ArchitectureService()

        try:
            result = service.validate_model()
            assert result["valid"] is True, f"Validation issues: {result['issues']}"
        except FileNotFoundError:
            pytest.skip("Real system-model.yaml not found")

    def test_generate_mermaid_for_real_model(self):
        """Test Mermaid generation for the real model."""
        service = ArchitectureService()

        try:
            diagram = service.generate_mermaid()
            assert "flowchart TB" in diagram
            assert len(diagram) > 100  # Should be a substantial diagram
        except FileNotFoundError:
            pytest.skip("Real system-model.yaml not found")
