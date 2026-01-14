import pytest


class TestGraphRouter:
    def test_build_graph(self, client, sample_snapshot, sample_entities, sample_cmdb_items):
        """Test POST /api/v1/graph/build endpoint."""
        response = client.post(
            "/api/v1/graph/build",
            json={"snapshot_id": sample_snapshot.id}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["node_count"] > 0

    def test_build_graph_invalid_snapshot(self, client):
        """Test building graph with invalid snapshot."""
        response = client.post(
            "/api/v1/graph/build",
            json={"snapshot_id": 99999}
        )
        assert response.status_code == 404

    def test_get_latest_graph(self, client, sample_snapshot, sample_entities, sample_cmdb_items):
        """Test GET /api/v1/graph/latest endpoint."""
        # Build graph first
        client.post("/api/v1/graph/build", json={"snapshot_id": sample_snapshot.id})

        response = client.get("/api/v1/graph/latest")
        assert response.status_code == 200
        data = response.json()
        assert "nodes" in data
        assert "edges" in data
        assert len(data["nodes"]) > 0

    def test_get_latest_graph_no_graph_exists(self, client):
        """Test getting latest graph when none exists."""
        response = client.get("/api/v1/graph/latest")
        assert response.status_code == 404

    def test_list_graph_snapshots(self, client, sample_snapshot, sample_entities, sample_cmdb_items):
        """Test GET /api/v1/graph/snapshots endpoint."""
        client.post("/api/v1/graph/build", json={"snapshot_id": sample_snapshot.id})

        response = client.get("/api/v1/graph/snapshots")
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        assert len(response.json()) > 0

    def test_get_graph_snapshot(self, client, sample_snapshot, sample_entities, sample_cmdb_items):
        """Test GET /api/v1/graph/snapshots/{id} endpoint."""
        build_response = client.post(
            "/api/v1/graph/build",
            json={"snapshot_id": sample_snapshot.id}
        )
        graph_id = build_response.json()["id"]

        response = client.get(f"/api/v1/graph/snapshots/{graph_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == graph_id
        assert "nodes" in data
        assert "edges" in data

    def test_get_graph_snapshot_not_found(self, client):
        """Test getting non-existent graph snapshot."""
        response = client.get("/api/v1/graph/snapshots/99999")
        assert response.status_code == 404

    def test_get_graph_summary(self, client, sample_snapshot, sample_entities, sample_cmdb_items):
        """Test GET /api/v1/graph/summary endpoint."""
        client.post("/api/v1/graph/build", json={"snapshot_id": sample_snapshot.id})

        response = client.get("/api/v1/graph/summary")
        assert response.status_code == 200
        data = response.json()
        assert "total_snapshots" in data
        assert "nodes_by_type" in data
        assert "nodes_by_drift_status" in data
