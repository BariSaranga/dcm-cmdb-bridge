import pytest


class TestCMDBRouter:
    def test_list_cmdb_items(self, client, sample_cmdb_items):
        """Test GET /api/v1/cmdb/items endpoint."""
        response = client.get("/api/v1/cmdb/items")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert len(data["items"]) == 3  # sample_cmdb_items creates 3

    def test_list_cmdb_items_with_filters(self, client, sample_cmdb_items):
        """Test CMDB items filtering."""
        response = client.get(
            "/api/v1/cmdb/items",
            params={"ci_type": "Deployment", "status": "active"}
        )
        assert response.status_code == 200

    def test_get_cmdb_item(self, client, sample_cmdb_items):
        """Test GET /api/v1/cmdb/items/{id} endpoint."""
        # Get list first
        list_response = client.get("/api/v1/cmdb/items")
        item_id = list_response.json()["items"][0]["id"]

        response = client.get(f"/api/v1/cmdb/items/{item_id}")
        assert response.status_code == 200
        assert response.json()["id"] == item_id

    def test_get_cmdb_item_not_found(self, client):
        """Test getting non-existent CMDB item."""
        response = client.get("/api/v1/cmdb/items/99999")
        assert response.status_code == 404

    def test_create_cmdb_item(self, client):
        """Test POST /api/v1/cmdb/items endpoint."""
        response = client.post(
            "/api/v1/cmdb/items",
            json={
                "ci_type": "Service",
                "name": "new-service",
                "namespace": "default",
                "environment": "staging",
                "owner": "platform-team"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "new-service"
        assert data["status"] == "active"

    def test_update_cmdb_item(self, client, sample_cmdb_items):
        """Test PATCH /api/v1/cmdb/items/{id} endpoint."""
        list_response = client.get("/api/v1/cmdb/items")
        item_id = list_response.json()["items"][0]["id"]

        response = client.patch(
            f"/api/v1/cmdb/items/{item_id}",
            json={"owner": "new-owner", "description": "Updated"}
        )
        assert response.status_code == 200
        assert response.json()["owner"] == "new-owner"

    def test_seed_cmdb(self, client):
        """Test POST /api/v1/cmdb/seed endpoint."""
        response = client.post("/api/v1/cmdb/seed")
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        assert data["count"] > 0
