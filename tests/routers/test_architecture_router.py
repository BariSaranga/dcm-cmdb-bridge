import pytest
from fastapi.testclient import TestClient


class TestArchitectureRouter:
    """Tests for the Architecture API endpoints."""

    def test_get_model(self, client):
        """Test GET /api/v1/architecture/model returns the system model."""
        response = client.get("/api/v1/architecture/model")

        # May return 404 if model file doesn't exist in test environment
        if response.status_code == 404:
            pytest.skip("System model file not available in test environment")

        assert response.status_code == 200
        data = response.json()

        assert "version" in data
        assert "views" in data
        assert "nodes" in data
        assert "edges" in data
        assert isinstance(data["nodes"], list)
        assert isinstance(data["edges"], list)

    def test_get_diagram(self, client):
        """Test GET /api/v1/architecture/diagram returns Mermaid diagram."""
        response = client.get("/api/v1/architecture/diagram")

        if response.status_code == 404:
            pytest.skip("System model file not available in test environment")

        assert response.status_code == 200
        data = response.json()

        assert "view" in data
        assert "format" in data
        assert "diagram" in data
        assert data["format"] == "mermaid"
        assert "flowchart" in data["diagram"]

    def test_get_diagram_with_view_parameter(self, client):
        """Test GET /api/v1/architecture/diagram with view parameter."""
        response = client.get("/api/v1/architecture/diagram?view=components")

        if response.status_code == 404:
            pytest.skip("System model file not available in test environment")

        assert response.status_code == 200
        data = response.json()
        assert data["view"] == "components"

    def test_list_nodes(self, client):
        """Test GET /api/v1/architecture/nodes lists all nodes."""
        response = client.get("/api/v1/architecture/nodes")

        if response.status_code == 404:
            pytest.skip("System model file not available in test environment")

        assert response.status_code == 200
        data = response.json()

        assert isinstance(data, list)
        if len(data) > 0:
            node = data[0]
            assert "id" in node
            assert "name" in node
            assert "type" in node
            assert "tech" in node
            assert "description" in node

    def test_get_node_details(self, client):
        """Test GET /api/v1/architecture/nodes/{node_id} returns node details."""
        # First get list of nodes
        list_response = client.get("/api/v1/architecture/nodes")

        if list_response.status_code == 404:
            pytest.skip("System model file not available in test environment")

        nodes = list_response.json()
        if len(nodes) == 0:
            pytest.skip("No nodes in model")

        node_id = nodes[0]["id"]
        response = client.get(f"/api/v1/architecture/nodes/{node_id}")

        assert response.status_code == 200
        data = response.json()

        assert "node" in data
        assert "incoming_connections" in data
        assert "outgoing_connections" in data
        assert data["node"]["id"] == node_id

    def test_get_node_details_not_found(self, client):
        """Test GET /api/v1/architecture/nodes/{node_id} with invalid ID."""
        response = client.get("/api/v1/architecture/nodes/nonexistent_node_id")

        # Either 404 for missing model or 404 for missing node
        assert response.status_code == 404

    def test_validate_model(self, client):
        """Test GET /api/v1/architecture/validate returns validation results."""
        response = client.get("/api/v1/architecture/validate")

        assert response.status_code == 200
        data = response.json()

        assert "valid" in data
        assert "issues" in data
        assert "node_count" in data
        assert "edge_count" in data
        assert "view_count" in data
        assert isinstance(data["issues"], list)

    def test_list_views(self, client):
        """Test GET /api/v1/architecture/views lists available views."""
        response = client.get("/api/v1/architecture/views")

        if response.status_code == 404:
            pytest.skip("System model file not available in test environment")

        assert response.status_code == 200
        data = response.json()

        assert isinstance(data, list)
        if len(data) > 0:
            view = data[0]
            assert "id" in view
            assert "title" in view
