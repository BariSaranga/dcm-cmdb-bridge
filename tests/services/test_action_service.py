import pytest
from services import ActionService
from models import DriftRecord, CMDBItem


@pytest.fixture
def sample_drift_record(db_session, sample_snapshot, sample_entities):
    """Create a sample drift record for testing."""
    drift = DriftRecord(
        snapshot_id=sample_snapshot.id,
        entity_id=sample_entities[0].id,
        drift_type="structural_missing_in_cmdb",
        severity="high",
        status="open",
        description="Test drift record",
        details={"test": True}
    )
    db_session.add(drift)
    db_session.commit()
    db_session.refresh(drift)
    return drift


class TestActionService:
    def test_propose_action_success(self, db_session, sample_drift_record):
        """Test proposing a new action."""
        service = ActionService(db_session)

        action = service.propose_action(
            drift_record_id=sample_drift_record.id,
            action_type="create_cmdb",
            description="Create CMDB entry for frontend-svc",
            payload={"ci_type": "Service", "name": "frontend-svc"},
            proposed_by="test-user"
        )

        assert action.id is not None
        assert action.status == "proposed"
        assert action.action_type == "create_cmdb"
        assert action.proposed_by == "test-user"

    def test_propose_action_invalid_drift(self, db_session):
        """Test that proposing action for invalid drift raises error."""
        service = ActionService(db_session)

        with pytest.raises(ValueError, match="not found"):
            service.propose_action(
                drift_record_id=99999,
                action_type="create_cmdb",
                description="Test",
                payload={},
                proposed_by="test-user"
            )

    def test_propose_action_invalid_type(self, db_session, sample_drift_record):
        """Test that invalid action type raises error."""
        service = ActionService(db_session)

        with pytest.raises(ValueError, match="Invalid action type"):
            service.propose_action(
                drift_record_id=sample_drift_record.id,
                action_type="invalid_type",
                description="Test",
                payload={},
                proposed_by="test-user"
            )

    def test_propose_action_duplicate_pending(self, db_session, sample_drift_record):
        """Test that duplicate pending action raises error."""
        service = ActionService(db_session)

        # First action
        service.propose_action(
            drift_record_id=sample_drift_record.id,
            action_type="create_cmdb",
            description="First action",
            payload={},
            proposed_by="test-user"
        )

        # Second action should fail
        with pytest.raises(ValueError, match="already has a pending action"):
            service.propose_action(
                drift_record_id=sample_drift_record.id,
                action_type="create_cmdb",
                description="Second action",
                payload={},
                proposed_by="test-user"
            )

    def test_approve_action_success(self, db_session, sample_drift_record):
        """Test approving an action."""
        service = ActionService(db_session)

        action = service.propose_action(
            drift_record_id=sample_drift_record.id,
            action_type="acknowledge",
            description="Acknowledge drift",
            payload={},
            proposed_by="proposer"
        )

        approved = service.approve_action(
            action_id=action.id,
            reviewed_by="approver",
            comment="Approved for deployment"
        )

        assert approved.status == "approved"
        assert approved.reviewed_by == "approver"
        assert approved.review_comment == "Approved for deployment"

    def test_reject_action_success(self, db_session, sample_drift_record):
        """Test rejecting an action."""
        service = ActionService(db_session)

        action = service.propose_action(
            drift_record_id=sample_drift_record.id,
            action_type="acknowledge",
            description="Acknowledge drift",
            payload={},
            proposed_by="proposer"
        )

        rejected = service.reject_action(
            action_id=action.id,
            reviewed_by="reviewer",
            comment="Not approved"
        )

        assert rejected.status == "rejected"
        assert rejected.reviewed_by == "reviewer"

    def test_apply_action_acknowledge(self, db_session, sample_drift_record):
        """Test applying an acknowledge action."""
        service = ActionService(db_session)

        action = service.propose_action(
            drift_record_id=sample_drift_record.id,
            action_type="acknowledge",
            description="Acknowledge drift",
            payload={},
            proposed_by="proposer"
        )

        service.approve_action(action.id, reviewed_by="approver")
        applied = service.apply_action(action.id)

        assert applied.status == "applied"
        assert applied.result["action"] == "acknowledged"

        # Drift should be resolved
        db_session.refresh(sample_drift_record)
        assert sample_drift_record.status == "resolved"

    def test_apply_action_create_cmdb(self, db_session, sample_drift_record):
        """Test applying a create_cmdb action."""
        service = ActionService(db_session)

        action = service.propose_action(
            drift_record_id=sample_drift_record.id,
            action_type="create_cmdb",
            description="Create CMDB entry",
            payload={
                "ci_type": "Service",
                "name": "new-service",
                "namespace": "production",
                "environment": "production",
                "owner": "platform-team"
            },
            proposed_by="proposer"
        )

        service.approve_action(action.id, reviewed_by="approver")
        applied = service.apply_action(action.id)

        assert applied.status == "applied"
        assert applied.result["action"] == "created"

        # Verify CMDB item was created
        cmdb_item = db_session.query(CMDBItem).filter(
            CMDBItem.name == "new-service"
        ).first()
        assert cmdb_item is not None
        assert cmdb_item.ci_type == "Service"

    def test_apply_action_update_cmdb(self, db_session, sample_drift_record, sample_cmdb_items):
        """Test applying an update_cmdb action."""
        service = ActionService(db_session)
        cmdb_item = sample_cmdb_items[0]

        action = service.propose_action(
            drift_record_id=sample_drift_record.id,
            action_type="update_cmdb",
            description="Update CMDB owner",
            payload={
                "cmdb_item_id": cmdb_item.id,
                "updates": {"owner": "new-owner"}
            },
            proposed_by="proposer"
        )

        service.approve_action(action.id, reviewed_by="approver")
        applied = service.apply_action(action.id)

        assert applied.status == "applied"
        assert applied.result["action"] == "updated"

        db_session.refresh(cmdb_item)
        assert cmdb_item.owner == "new-owner"

    def test_invalid_transition_apply_before_approve(self, db_session, sample_drift_record):
        """Test that applying before approval fails."""
        service = ActionService(db_session)

        action = service.propose_action(
            drift_record_id=sample_drift_record.id,
            action_type="acknowledge",
            description="Test",
            payload={},
            proposed_by="proposer"
        )

        with pytest.raises(ValueError, match="Cannot transition"):
            service.apply_action(action.id)

    def test_invalid_transition_approve_rejected(self, db_session, sample_drift_record):
        """Test that approving rejected action fails."""
        service = ActionService(db_session)

        action = service.propose_action(
            drift_record_id=sample_drift_record.id,
            action_type="acknowledge",
            description="Test",
            payload={},
            proposed_by="proposer"
        )

        service.reject_action(action.id, reviewed_by="reviewer")

        with pytest.raises(ValueError, match="Cannot transition"):
            service.approve_action(action.id, reviewed_by="another")
