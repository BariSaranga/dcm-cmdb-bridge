import pytest


class TestDriftRouter:
    def test_detect_drift(self, client, sample_snapshot, sample_entities, sample_cmdb_items):
        """Test POST /api/v1/drift/detect endpoint."""
        response = client.post(
            "/api/v1/drift/detect",
            json={"snapshot_id": sample_snapshot.id}
        )
        assert response.status_code == 200
        data = response.json()
        assert "snapshot_id" in data
        assert "drift_count" in data
        assert data["drift_count"] > 0

    def test_detect_drift_invalid_snapshot(self, client):
        """Test drift detection with invalid snapshot ID."""
        response = client.post(
            "/api/v1/drift/detect",
            json={"snapshot_id": 99999}
        )
        assert response.status_code == 404

    def test_list_drift_records(self, client, sample_snapshot, sample_entities, sample_cmdb_items):
        """Test GET /api/v1/drift/records endpoint."""
        # First detect drift to create records
        client.post("/api/v1/drift/detect", json={"snapshot_id": sample_snapshot.id})

        response = client.get("/api/v1/drift/records")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert len(data["items"]) > 0

    def test_list_drift_records_with_filters(self, client, sample_snapshot, sample_entities, sample_cmdb_items):
        """Test drift records filtering."""
        client.post("/api/v1/drift/detect", json={"snapshot_id": sample_snapshot.id})

        response = client.get(
            "/api/v1/drift/records",
            params={"severity": "high", "status": "open"}
        )
        assert response.status_code == 200

    def test_get_drift_record(self, client, sample_snapshot, sample_entities, sample_cmdb_items):
        """Test GET /api/v1/drift/records/{id} endpoint."""
        client.post("/api/v1/drift/detect", json={"snapshot_id": sample_snapshot.id})

        # Get list first to get an ID
        list_response = client.get("/api/v1/drift/records")
        records = list_response.json()["items"]
        assert len(records) > 0

        record_id = records[0]["id"]
        response = client.get(f"/api/v1/drift/records/{record_id}")
        assert response.status_code == 200
        assert response.json()["id"] == record_id

    def test_get_drift_record_not_found(self, client):
        """Test getting non-existent drift record."""
        response = client.get("/api/v1/drift/records/99999")
        assert response.status_code == 404

    def test_update_drift_status(self, client, sample_snapshot, sample_entities, sample_cmdb_items):
        """Test PATCH /api/v1/drift/records/{id}/status endpoint."""
        client.post("/api/v1/drift/detect", json={"snapshot_id": sample_snapshot.id})

        list_response = client.get("/api/v1/drift/records")
        record_id = list_response.json()["items"][0]["id"]

        response = client.patch(
            f"/api/v1/drift/records/{record_id}/status",
            json={"status": "acknowledged"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "acknowledged"

    def test_get_drift_summary(self, client, sample_snapshot, sample_entities, sample_cmdb_items):
        """Test GET /api/v1/drift/summary endpoint."""
        client.post("/api/v1/drift/detect", json={"snapshot_id": sample_snapshot.id})

        response = client.get("/api/v1/drift/summary")
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "by_type" in data
        assert "by_severity" in data
        assert "by_status" in data
