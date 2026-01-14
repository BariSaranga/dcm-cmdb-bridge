import pytest


class TestActionsRouter:
    @pytest.fixture
    def drift_record(self, client, sample_snapshot, sample_entities, sample_cmdb_items):
        """Create a drift record for action testing."""
        client.post("/api/v1/drift/detect", json={"snapshot_id": sample_snapshot.id})
        response = client.get("/api/v1/drift/records")
        return response.json()["items"][0]

    def test_propose_action(self, client, drift_record):
        """Test POST /api/v1/actions endpoint."""
        response = client.post(
            "/api/v1/actions",
            json={
                "drift_record_id": drift_record["id"],
                "action_type": "acknowledge",
                "description": "Acknowledging this drift",
                "payload": {},
                "proposed_by": "test-user"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "proposed"
        assert data["action_type"] == "acknowledge"

    def test_propose_action_invalid_drift(self, client):
        """Test proposing action for non-existent drift."""
        response = client.post(
            "/api/v1/actions",
            json={
                "drift_record_id": 99999,
                "action_type": "acknowledge",
                "description": "Test",
                "payload": {},
                "proposed_by": "test-user"
            }
        )
        # API returns 400 Bad Request for invalid drift_record_id
        assert response.status_code == 400

    def test_list_actions(self, client, drift_record):
        """Test GET /api/v1/actions endpoint."""
        # Create an action first
        client.post(
            "/api/v1/actions",
            json={
                "drift_record_id": drift_record["id"],
                "action_type": "acknowledge",
                "description": "Test action",
                "payload": {},
                "proposed_by": "test-user"
            }
        )

        response = client.get("/api/v1/actions")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) > 0

    def test_list_actions_with_filters(self, client, drift_record):
        """Test actions filtering."""
        client.post(
            "/api/v1/actions",
            json={
                "drift_record_id": drift_record["id"],
                "action_type": "acknowledge",
                "description": "Test",
                "payload": {},
                "proposed_by": "test-user"
            }
        )

        response = client.get(
            "/api/v1/actions",
            params={"status": "proposed", "action_type": "acknowledge"}
        )
        assert response.status_code == 200

    def test_get_action(self, client, drift_record):
        """Test GET /api/v1/actions/{id} endpoint."""
        create_response = client.post(
            "/api/v1/actions",
            json={
                "drift_record_id": drift_record["id"],
                "action_type": "acknowledge",
                "description": "Test",
                "payload": {},
                "proposed_by": "test-user"
            }
        )
        action_id = create_response.json()["id"]

        response = client.get(f"/api/v1/actions/{action_id}")
        assert response.status_code == 200
        assert response.json()["id"] == action_id

    def test_approve_action(self, client, drift_record):
        """Test POST /api/v1/actions/{id}/approve endpoint."""
        create_response = client.post(
            "/api/v1/actions",
            json={
                "drift_record_id": drift_record["id"],
                "action_type": "acknowledge",
                "description": "Test",
                "payload": {},
                "proposed_by": "test-user"
            }
        )
        action_id = create_response.json()["id"]

        response = client.post(
            f"/api/v1/actions/{action_id}/approve",
            json={"reviewed_by": "reviewer", "comment": "Approved"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "approved"

    def test_reject_action(self, client, drift_record):
        """Test POST /api/v1/actions/{id}/reject endpoint."""
        create_response = client.post(
            "/api/v1/actions",
            json={
                "drift_record_id": drift_record["id"],
                "action_type": "acknowledge",
                "description": "Test",
                "payload": {},
                "proposed_by": "test-user"
            }
        )
        action_id = create_response.json()["id"]

        response = client.post(
            f"/api/v1/actions/{action_id}/reject",
            json={"reviewed_by": "reviewer", "comment": "Rejected"}
        )
        assert response.status_code == 200
        assert response.json()["status"] == "rejected"

    def test_apply_action(self, client, drift_record):
        """Test POST /api/v1/actions/{id}/apply endpoint."""
        # Create and approve action first
        create_response = client.post(
            "/api/v1/actions",
            json={
                "drift_record_id": drift_record["id"],
                "action_type": "acknowledge",
                "description": "Test",
                "payload": {},
                "proposed_by": "test-user"
            }
        )
        action_id = create_response.json()["id"]

        client.post(
            f"/api/v1/actions/{action_id}/approve",
            json={"reviewed_by": "reviewer", "comment": "OK"}
        )

        response = client.post(f"/api/v1/actions/{action_id}/apply")
        assert response.status_code == 200
        assert response.json()["status"] == "applied"

    def test_apply_unapproved_action_fails(self, client, drift_record):
        """Test that applying an unapproved action fails."""
        create_response = client.post(
            "/api/v1/actions",
            json={
                "drift_record_id": drift_record["id"],
                "action_type": "acknowledge",
                "description": "Test",
                "payload": {},
                "proposed_by": "test-user"
            }
        )
        action_id = create_response.json()["id"]

        response = client.post(f"/api/v1/actions/{action_id}/apply")
        assert response.status_code == 400
