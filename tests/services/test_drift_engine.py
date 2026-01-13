import pytest
from services import DriftEngine


class TestDriftEngine:
    def test_detect_drift_finds_missing_in_cmdb(
        self, db_session, sample_snapshot, sample_entities, sample_cmdb_items
    ):
        """Test that entities without CMDB records are detected as missing."""
        engine = DriftEngine(db_session)
        drifts = engine.detect_drift(sample_snapshot.id)

        missing_drifts = [d for d in drifts if d.drift_type == "structural_missing_in_cmdb"]

        # frontend-svc Service has no CMDB entry
        assert len(missing_drifts) == 1
        assert missing_drifts[0].description.find("frontend-svc") != -1

    def test_detect_drift_finds_stale_in_cmdb(
        self, db_session, sample_snapshot, sample_entities, sample_cmdb_items
    ):
        """Test that CMDB items without runtime entities are detected as stale."""
        engine = DriftEngine(db_session)
        drifts = engine.detect_drift(sample_snapshot.id)

        stale_drifts = [d for d in drifts if d.drift_type == "structural_stale_in_cmdb"]

        # legacy-service is in CMDB but not in runtime
        assert len(stale_drifts) == 1
        assert stale_drifts[0].description.find("legacy-service") != -1

    def test_detect_drift_finds_ownership_mismatch(
        self, db_session, sample_snapshot, sample_entities, sample_cmdb_items
    ):
        """Test that ownership mismatches are detected."""
        engine = DriftEngine(db_session)
        drifts = engine.detect_drift(sample_snapshot.id)

        ownership_drifts = [d for d in drifts if d.drift_type == "ownership"]

        # backend-api has different owner in CMDB vs runtime
        assert len(ownership_drifts) == 1
        assert ownership_drifts[0].details["runtime_owner"] == "backend-team"
        assert ownership_drifts[0].details["cmdb_owner"] == "api-team"

    def test_detect_drift_matched_entity_no_drift(
        self, db_session, sample_snapshot, sample_entities, sample_cmdb_items
    ):
        """Test that perfectly matched entities don't create drift."""
        engine = DriftEngine(db_session)
        drifts = engine.detect_drift(sample_snapshot.id)

        # frontend Deployment matches exactly - should not appear in any drift
        frontend_drifts = [
            d for d in drifts
            if d.entity_id is not None
            and d.entity.name == "frontend"
            and d.entity.kind == "Deployment"
        ]
        assert len(frontend_drifts) == 0

    def test_detect_drift_lifecycle_mismatch(self, db_session, sample_snapshot):
        """Test that lifecycle mismatches are detected."""
        from models import NormalizedEntity, CMDBItem

        # Add entity that's running
        entity = NormalizedEntity(
            snapshot_id=sample_snapshot.id,
            source_type="kubernetes",
            kind="Deployment",
            name="worker",
            namespace="staging",
            uid="dep-003",
            owner="batch-team",
            environment="staging"
        )
        db_session.add(entity)

        # Add CMDB item marked as decommissioned
        cmdb_item = CMDBItem(
            ci_type="Deployment",
            name="worker",
            namespace="staging",
            environment="staging",
            owner="batch-team",
            status="decommissioned"
        )
        db_session.add(cmdb_item)
        db_session.commit()

        engine = DriftEngine(db_session)
        drifts = engine.detect_drift(sample_snapshot.id)

        lifecycle_drifts = [d for d in drifts if d.drift_type == "lifecycle"]
        assert len(lifecycle_drifts) == 1
        assert lifecycle_drifts[0].severity == "critical"

    def test_detect_drift_invalid_snapshot(self, db_session):
        """Test that invalid snapshot ID raises error."""
        engine = DriftEngine(db_session)

        with pytest.raises(ValueError, match="not found"):
            engine.detect_drift(99999)

    def test_detect_drift_empty_snapshot(self, db_session, sample_snapshot):
        """Test drift detection with no entities."""
        engine = DriftEngine(db_session)
        drifts = engine.detect_drift(sample_snapshot.id)

        # No entities, no drifts
        assert len(drifts) == 0
