import pytest
from services import AuditService


class TestAuditService:
    def test_log_creates_entry(self, db_session):
        """Test that log() creates an audit entry."""
        service = AuditService(db_session)
        entry = service.log(
            event_type="test_event",
            entity_type="test",
            entity_id=1,
            actor="test-user",
            details={"key": "value"}
        )

        assert entry is not None
        assert entry.event_type == "test_event"
        assert entry.actor == "test-user"

    def test_log_snapshot_created(self, db_session, sample_snapshot):
        """Test log_snapshot_created convenience method."""
        service = AuditService(db_session)
        entry = service.log_snapshot_created(
            snapshot_id=sample_snapshot.id,
            actor="test-user",
            source=sample_snapshot.source
        )

        assert entry.event_type == "snapshot_created"
        assert entry.entity_type == "Snapshot"
        assert entry.entity_id == sample_snapshot.id

    def test_log_drift_detected(self, db_session, sample_snapshot, sample_entities, sample_cmdb_items):
        """Test log_drift_detected convenience method."""
        from services import DriftEngine
        engine = DriftEngine(db_session)
        drifts = engine.detect_drift(sample_snapshot.id)

        if drifts:
            drift = drifts[0]
            service = AuditService(db_session)
            entry = service.log_drift_detected(
                drift_id=drift.id,
                drift_type=drift.drift_type,
                severity=drift.severity,
                description="Test drift detected"
            )

            assert entry.event_type == "drift_detected"
            assert entry.entity_type == "DriftRecord"

    def test_log_action_proposed(self, db_session, sample_snapshot, sample_entities, sample_cmdb_items):
        """Test log_action_proposed convenience method."""
        from services import DriftEngine, ActionService
        engine = DriftEngine(db_session)
        drifts = engine.detect_drift(sample_snapshot.id)

        if drifts:
            action_service = ActionService(db_session)
            action = action_service.propose_action(
                drift_record_id=drifts[0].id,
                action_type="acknowledge",
                description="Test",
                payload={},
                proposed_by="test-user"
            )

            audit_service = AuditService(db_session)
            entry = audit_service.log_action_proposed(
                action_id=action.id,
                action_type=action.action_type,
                actor=action.proposed_by,
                drift_id=drifts[0].id
            )

            assert entry.event_type == "action_proposed"
            assert entry.entity_type == "Action"

    def test_log_action_approved(self, db_session):
        """Test log_action_approved convenience method."""
        service = AuditService(db_session)
        entry = service.log_action_approved(
            action_id=1,
            actor="reviewer"
        )

        assert entry.event_type == "action_approved"
        assert entry.entity_type == "Action"

    def test_log_action_approved_with_comment(self, db_session):
        """Test log_action_approved with comment."""
        service = AuditService(db_session)
        entry = service.log_action_approved(
            action_id=1,
            actor="reviewer",
            comment="Looks good"
        )

        assert entry.event_type == "action_approved"
        assert entry.details["comment"] == "Looks good"

    def test_log_action_rejected(self, db_session):
        """Test log_action_rejected convenience method."""
        service = AuditService(db_session)
        entry = service.log_action_rejected(
            action_id=1,
            actor="reviewer",
            comment="Not needed"
        )

        assert entry.event_type == "action_rejected"
        assert entry.entity_type == "Action"

    def test_log_action_applied(self, db_session):
        """Test log_action_applied convenience method."""
        service = AuditService(db_session)
        entry = service.log_action_applied(
            action_id=1,
            result={"success": True}
        )

        assert entry.event_type == "action_applied"
        assert entry.entity_type == "Action"

    def test_log_persists_to_database(self, db_session):
        """Test that log entries are persisted."""
        from models import AuditLog

        service = AuditService(db_session)
        service.log(
            event_type="persist_test",
            entity_type="test",
            entity_id=1,
            actor="test-user"
        )

        # Query directly
        entries = db_session.query(AuditLog).filter(
            AuditLog.event_type == "persist_test"
        ).all()

        assert len(entries) == 1
