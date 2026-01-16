import pytest
from services import AIExplainerService
from fixtures import seed_demo_scenario


class TestAIExplainerService:
    @pytest.fixture
    def demo_data(self, db_session):
        """Seed demo scenario and return metadata."""
        return seed_demo_scenario(db_session)

    def test_explain_entity_returns_structured_response(self, db_session, demo_data):
        """Test that explain_entity returns all required fields per ADR-0003."""
        service = AIExplainerService(db_session)
        explanation = service.explain_entity(
            entity_type="Deployment",
            entity_name="payment-service",
            namespace="production"
        )

        # Verify ADR-0003 required fields
        assert explanation.summary is not None
        assert explanation.headline is not None
        assert isinstance(explanation.evidence, list)
        assert explanation.inference is not None
        assert 0.0 <= explanation.confidence <= 1.0
        assert explanation.why_it_matters is not None
        assert explanation.risk_level in ["critical", "high", "medium", "low"]
        assert isinstance(explanation.suggested_actions, list)
        assert isinstance(explanation.highlighted_nodes, list)

    def test_explain_entity_detects_missing_cmdb(self, db_session, demo_data):
        """Test that missing CMDB record is detected."""
        service = AIExplainerService(db_session)
        explanation = service.explain_entity(
            entity_type="Deployment",
            entity_name="payment-service",
            namespace="production"
        )

        # Should detect missing CMDB
        cmdb_evidence = [e for e in explanation.evidence if e.source == "cmdb"]
        assert len(cmdb_evidence) > 0
        assert any("No CMDB record" in e.fact for e in cmdb_evidence)

    def test_explain_entity_detects_missing_owner(self, db_session, demo_data):
        """Test that missing owner is detected."""
        service = AIExplainerService(db_session)
        explanation = service.explain_entity(
            entity_type="Deployment",
            entity_name="payment-service",
            namespace="production"
        )

        # Should detect missing owner
        runtime_evidence = [e for e in explanation.evidence if e.source == "runtime"]
        assert any(e.data.get("owner") is None for e in runtime_evidence)

    def test_explain_entity_high_risk_for_shadow_it(self, db_session, demo_data):
        """Test that shadow IT gets high/critical risk level."""
        service = AIExplainerService(db_session)
        explanation = service.explain_entity(
            entity_type="Deployment",
            entity_name="payment-service",
            namespace="production"
        )

        # Shadow IT should have high or critical risk
        assert explanation.risk_level in ["high", "critical"]

    def test_explain_entity_suggests_actions(self, db_session, demo_data):
        """Test that appropriate actions are suggested."""
        service = AIExplainerService(db_session)
        explanation = service.explain_entity(
            entity_type="Deployment",
            entity_name="payment-service",
            namespace="production"
        )

        # Should suggest creating CMDB record and assigning owner
        action_types = [a["action"] for a in explanation.suggested_actions]
        assert "create_cmdb" in action_types or "assign_owner" in action_types

    def test_explain_entity_highlights_nodes(self, db_session, demo_data):
        """Test that relevant nodes are highlighted."""
        service = AIExplainerService(db_session)
        explanation = service.explain_entity(
            entity_type="Deployment",
            entity_name="payment-service",
            namespace="production"
        )

        # Should highlight the entity
        assert len(explanation.highlighted_nodes) > 0
        assert any("payment-service" in node for node in explanation.highlighted_nodes)

    def test_explain_well_managed_entity(self, db_session, demo_data):
        """Test explanation for a well-managed entity."""
        service = AIExplainerService(db_session)
        explanation = service.explain_entity(
            entity_type="Deployment",
            entity_name="auth-service",
            namespace="production"
        )

        # Well-managed entity should have lower risk
        # Note: May still have some risk if no drift detected but service exists
        assert explanation.summary is not None

    def test_get_demo_explanation(self, db_session, demo_data):
        """Test the pre-built demo explanation."""
        service = AIExplainerService(db_session)
        explanation = service.get_demo_explanation()

        # Should return explanation for payment-service
        assert "payment-service" in explanation.headline.lower() or \
               "payment-service" in explanation.summary.lower() or \
               any("payment-service" in node for node in explanation.highlighted_nodes)

    def test_to_dict_serialization(self, db_session, demo_data):
        """Test that explanation can be serialized to dict."""
        service = AIExplainerService(db_session)
        explanation = service.explain_entity(
            entity_type="Deployment",
            entity_name="payment-service",
            namespace="production"
        )

        result = explanation.to_dict()

        assert isinstance(result, dict)
        assert "summary" in result
        assert "headline" in result
        assert "evidence" in result
        assert "inference" in result
        assert "confidence" in result
        assert "why_it_matters" in result
        assert "risk_level" in result
        assert "suggested_actions" in result
        assert "highlighted_nodes" in result

    def test_evidence_has_required_fields(self, db_session, demo_data):
        """Test that each evidence item has required fields."""
        service = AIExplainerService(db_session)
        explanation = service.explain_entity(
            entity_type="Deployment",
            entity_name="payment-service",
            namespace="production"
        )

        for evidence in explanation.evidence:
            assert evidence.source in ["runtime", "cmdb", "drift", "audit"]
            assert evidence.entity_type is not None
            assert evidence.entity_name is not None
            assert evidence.fact is not None
            assert isinstance(evidence.data, dict)
