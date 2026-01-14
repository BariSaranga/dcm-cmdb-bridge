import pytest


class TestAuditRouter:
    @pytest.fixture
    def with_audit_logs(self, client, sample_snapshot, sample_entities, sample_cmdb_items):
        """Create some audit logs via drift detection and actions."""
        # Detect drift - creates audit logs
        client.post("/api/v1/drift/detect", json={"snapshot_id": sample_snapshot.id})

        # Get a drift record
        drift_response = client.get("/api/v1/drift/records")
        drift_id = drift_response.json()["items"][0]["id"]

        # Create and approve an action - creates more audit logs
        action_response = client.post(
            "/api/v1/actions",
            json={
                "drift_record_id": drift_id,
                "action_type": "acknowledge",
                "description": "Test",
                "payload": {},
                "proposed_by": "test-user"
            }
        )
        action_id = action_response.json()["id"]

        client.post(
            f"/api/v1/actions/{action_id}/approve",
            json={"reviewed_by": "reviewer", "comment": "OK"}
        )

        return {"drift_id": drift_id, "action_id": action_id}

    def test_list_audit_logs(self, client, with_audit_logs):
        """Test GET /api/v1/audit endpoint."""
        response = client.get("/api/v1/audit")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert len(data["items"]) > 0

    def test_list_audit_logs_with_filters(self, client, with_audit_logs):
        """Test audit logs filtering."""
        response = client.get(
            "/api/v1/audit",
            params={"event_type": "action_proposed"}
        )
        assert response.status_code == 200

    def test_get_entity_audit_trail(self, client, with_audit_logs):
        """Test GET /api/v1/audit/entity/{type}/{id} endpoint."""
        action_id = with_audit_logs["action_id"]

        response = client.get(f"/api/v1/audit/entity/action/{action_id}")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    def test_get_audit_summary(self, client, with_audit_logs):
        """Test GET /api/v1/audit/summary endpoint."""
        response = client.get("/api/v1/audit/summary")
        assert response.status_code == 200
        data = response.json()
        assert "total_events" in data
        assert "by_event_type" in data
        assert "by_entity_type" in data

    def test_get_audit_summary_with_period(self, client, with_audit_logs):
        """Test audit summary with custom period."""
        response = client.get("/api/v1/audit/summary", params={"days": 7})
        assert response.status_code == 200
