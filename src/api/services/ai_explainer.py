"""
AI Explainer Service - Infrastructure Lie Detector

Generates evidence-based explanations about infrastructure drift
and organizational gaps. Template-based for MVP (no LLM API calls).

Response structure (per ADR-0003):
- Summary
- Evidence
- Inference + confidence
- Why this matters (risk/regulation)
- Suggested actions
"""

from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone

from models import (
    NormalizedEntity,
    CMDBItem,
    DriftRecord,
    AuditLog,
    GraphNode,
    Action,
)


@dataclass
class AIEvidence:
    """A piece of evidence supporting the AI explanation."""
    source: str  # "runtime", "cmdb", "drift", "audit"
    entity_type: str
    entity_name: str
    fact: str
    data: Dict[str, Any]


@dataclass
class AIExplanation:
    """Structured AI explanation per ADR-0003."""
    summary: str
    headline: str  # Short, impactful statement for header overlay
    evidence: List[AIEvidence]
    inference: str
    confidence: float  # 0.0 to 1.0
    why_it_matters: str
    risk_level: str  # "critical", "high", "medium", "low"
    suggested_actions: List[Dict[str, str]]
    highlighted_nodes: List[str]  # Node IDs to highlight in graph

    def to_dict(self) -> Dict[str, Any]:
        return {
            "summary": self.summary,
            "headline": self.headline,
            "evidence": [
                {
                    "source": e.source,
                    "entity_type": e.entity_type,
                    "entity_name": e.entity_name,
                    "fact": e.fact,
                    "data": e.data
                }
                for e in self.evidence
            ],
            "inference": self.inference,
            "confidence": self.confidence,
            "why_it_matters": self.why_it_matters,
            "risk_level": self.risk_level,
            "suggested_actions": self.suggested_actions,
            "highlighted_nodes": self.highlighted_nodes
        }


class AIExplainerService:
    """
    Service for generating AI explanations about infrastructure state.

    MVP implementation uses templates. Future versions can integrate
    Claude API for more nuanced explanations.
    """

    def __init__(self, db: Session):
        self.db = db

    def explain_entity(
        self,
        entity_type: str,
        entity_name: str,
        namespace: str = "production"
    ) -> AIExplanation:
        """
        Generate an explanation for a specific entity.

        Args:
            entity_type: Kind of entity (Deployment, Service, etc.)
            entity_name: Name of the entity
            namespace: Kubernetes namespace

        Returns:
            Structured AIExplanation
        """
        # Gather evidence
        evidence = []
        highlighted_nodes = []

        # 1. Check runtime entity
        runtime_entity = self.db.query(NormalizedEntity).filter(
            NormalizedEntity.kind == entity_type,
            NormalizedEntity.name == entity_name,
            NormalizedEntity.namespace == namespace
        ).first()

        # 2. Check CMDB
        cmdb_item = self.db.query(CMDBItem).filter(
            CMDBItem.ci_type == entity_type,
            CMDBItem.name == entity_name,
            CMDBItem.namespace == namespace
        ).first()

        # 3. Get drift records (by entity_id if runtime entity exists)
        drifts = []
        if runtime_entity:
            drifts = self.db.query(DriftRecord).filter(
                DriftRecord.entity_id == runtime_entity.id,
                DriftRecord.status == "open"
            ).all()

        # 4. Check for actions on drift records
        actions = []
        if drifts:
            drift_ids = [d.id for d in drifts]
            actions = self.db.query(Action).filter(
                Action.drift_record_id.in_(drift_ids)
            ).all()

        # Build evidence from runtime
        if runtime_entity:
            running_since = None
            if runtime_entity.raw_data and "created" in runtime_entity.raw_data:
                running_since = runtime_entity.raw_data["created"]

            evidence.append(AIEvidence(
                source="runtime",
                entity_type=entity_type,
                entity_name=entity_name,
                fact=f"Entity exists in runtime (namespace: {namespace})",
                data={
                    "uid": runtime_entity.uid,
                    "owner": runtime_entity.owner,
                    "running_since": running_since,
                    "labels": runtime_entity.labels
                }
            ))
            highlighted_nodes.append(f"runtime:{entity_type}:{namespace}:{entity_name}")

            # Check for ownership
            if not runtime_entity.owner:
                evidence.append(AIEvidence(
                    source="runtime",
                    entity_type=entity_type,
                    entity_name=entity_name,
                    fact="No owner label or annotation found",
                    data={"owner": None, "expected": "team or owner label"}
                ))

        # Build evidence from CMDB
        if cmdb_item:
            evidence.append(AIEvidence(
                source="cmdb",
                entity_type=entity_type,
                entity_name=entity_name,
                fact=f"CMDB record exists (status: {cmdb_item.status})",
                data={
                    "cmdb_id": cmdb_item.id,
                    "owner": cmdb_item.owner,
                    "status": cmdb_item.status
                }
            ))
            highlighted_nodes.append(f"cmdb:{entity_type}:{namespace}:{entity_name}")
        else:
            evidence.append(AIEvidence(
                source="cmdb",
                entity_type=entity_type,
                entity_name=entity_name,
                fact="No CMDB record found",
                data={"status": "missing"}
            ))

        # Build evidence from drifts
        drift_types = []
        max_severity = "low"
        severity_order = {"low": 0, "medium": 1, "high": 2, "critical": 3}

        for drift in drifts:
            drift_types.append(drift.drift_type)
            if severity_order.get(drift.severity, 0) > severity_order.get(max_severity, 0):
                max_severity = drift.severity

            evidence.append(AIEvidence(
                source="drift",
                entity_type=entity_type,
                entity_name=entity_name,
                fact=f"Drift detected: {drift.drift_type} ({drift.severity})",
                data={
                    "drift_id": drift.id,
                    "drift_type": drift.drift_type,
                    "severity": drift.severity,
                    "details": drift.details
                }
            ))

        # Check for related ingress/security issues
        related_ingress = self.db.query(NormalizedEntity).filter(
            NormalizedEntity.kind == "Ingress",
            NormalizedEntity.namespace == namespace,
            NormalizedEntity.name.contains(entity_name.split("-")[0])
        ).first()

        if related_ingress and related_ingress.raw_data:
            is_public = related_ingress.raw_data.get("public", False)
            has_tls = related_ingress.raw_data.get("tls", True)

            if is_public and not has_tls:
                evidence.append(AIEvidence(
                    source="runtime",
                    entity_type="Ingress",
                    entity_name=related_ingress.name,
                    fact="Publicly exposed without TLS encryption",
                    data={
                        "host": related_ingress.raw_data.get("host"),
                        "public": True,
                        "tls": False
                    }
                ))
                highlighted_nodes.append(f"runtime:Ingress:{namespace}:{related_ingress.name}")

        # Generate explanation
        return self._generate_explanation(
            entity_type=entity_type,
            entity_name=entity_name,
            namespace=namespace,
            runtime_entity=runtime_entity,
            cmdb_item=cmdb_item,
            drifts=drifts,
            evidence=evidence,
            highlighted_nodes=highlighted_nodes,
            max_severity=max_severity
        )

    def _generate_explanation(
        self,
        entity_type: str,
        entity_name: str,
        namespace: str,
        runtime_entity: Optional[NormalizedEntity],
        cmdb_item: Optional[CMDBItem],
        drifts: List[DriftRecord],
        evidence: List[AIEvidence],
        highlighted_nodes: List[str],
        max_severity: str
    ) -> AIExplanation:
        """Generate the structured explanation from gathered evidence."""

        drift_types = [d.drift_type for d in drifts]

        # Calculate running duration
        running_duration = "unknown duration"
        if runtime_entity and runtime_entity.raw_data:
            created_str = runtime_entity.raw_data.get("created")
            if created_str:
                try:
                    created = datetime.fromisoformat(created_str.replace("Z", "+00:00"))
                    days = (datetime.now(timezone.utc) - created.replace(tzinfo=None)).days
                    if days > 30:
                        running_duration = f"{days // 30} months"
                    else:
                        running_duration = f"{days} days"
                except (ValueError, TypeError):
                    pass

        # Build headline
        issues = []
        if not runtime_entity or not runtime_entity.owner:
            issues.append("No owner")
        if not cmdb_item:
            issues.append("No CMDB record")
        if "security" in drift_types:
            issues.append("Publicly exposed")

        if issues:
            headline = f"This service has been running in production for {running_duration}. {'. '.join(issues)}."
        else:
            headline = f"{entity_name} is properly managed and tracked."

        # Build summary
        if not cmdb_item and runtime_entity:
            summary = (
                f"The {entity_type} '{entity_name}' exists in runtime but has no corresponding "
                f"CMDB record. It has been running for {running_duration} without proper tracking. "
            )
            if not runtime_entity.owner:
                summary += "No owner is assigned, creating an accountability gap. "
            if "security" in drift_types:
                summary += "Additionally, it is publicly exposed without TLS encryption, posing a security risk."
        elif cmdb_item and runtime_entity:
            if drifts:
                summary = (
                    f"The {entity_type} '{entity_name}' exists in both runtime and CMDB, "
                    f"but has {len(drifts)} open drift issue(s) that need attention."
                )
            else:
                summary = f"The {entity_type} '{entity_name}' is properly tracked and managed."
        else:
            summary = f"Unable to find {entity_type} '{entity_name}' in runtime."

        # Build inference
        if "missing_in_cmdb" in drift_types or "ownership" in drift_types:
            inference = (
                "This entity represents shadow IT - infrastructure that exists outside "
                "organizational visibility. Without CMDB tracking and ownership, there is no "
                "clear accountability for security patches, compliance, or incident response."
            )
            confidence = 0.95
        elif "security" in drift_types:
            inference = (
                "The security configuration of this entity does not meet organizational standards. "
                "Public exposure without encryption could lead to data breaches."
            )
            confidence = 0.90
        elif drifts:
            inference = (
                f"Configuration drift has been detected. The runtime state differs from "
                f"organizational expectations in {len(drifts)} area(s)."
            )
            confidence = 0.85
        else:
            inference = "This entity appears to be properly managed according to organizational standards."
            confidence = 0.80

        # Build risk assessment
        if "security" in drift_types or max_severity == "critical":
            why_it_matters = (
                "CRITICAL RISK: This configuration could lead to data breaches, regulatory violations "
                "(GDPR, SOC2, PCI-DSS), and reputational damage. Unencrypted public endpoints are "
                "a common attack vector. The lack of ownership means no one is accountable for remediation."
            )
            risk_level = "critical"
        elif "missing_in_cmdb" in drift_types or max_severity == "high":
            why_it_matters = (
                "HIGH RISK: Shadow IT creates blind spots in security posture, compliance reporting, "
                "and cost management. Audit failures often trace back to untracked infrastructure. "
                "Without an owner, security vulnerabilities may go unpatched."
            )
            risk_level = "high"
        elif drifts:
            why_it_matters = (
                "MODERATE RISK: Configuration drift can lead to unexpected behavior, security gaps, "
                "or compliance issues. Regular reconciliation is recommended."
            )
            risk_level = "medium"
        else:
            why_it_matters = "This entity is properly tracked and poses no immediate risk."
            risk_level = "low"

        # Build suggested actions
        suggested_actions = []

        if not cmdb_item:
            suggested_actions.append({
                "action": "create_cmdb",
                "priority": "high",
                "description": f"Create CMDB record for {entity_name}",
                "rationale": "Establish organizational visibility and tracking"
            })

        if not runtime_entity or not runtime_entity.owner:
            suggested_actions.append({
                "action": "assign_owner",
                "priority": "high",
                "description": "Assign an owner team or individual",
                "rationale": "Establish accountability for maintenance and security"
            })

        if "security" in drift_types:
            suggested_actions.append({
                "action": "enable_tls",
                "priority": "critical",
                "description": "Enable TLS encryption for public endpoint",
                "rationale": "Protect data in transit and meet compliance requirements"
            })

        if not suggested_actions:
            suggested_actions.append({
                "action": "acknowledge",
                "priority": "low",
                "description": "Acknowledge current state as acceptable",
                "rationale": "No immediate action required"
            })

        return AIExplanation(
            summary=summary,
            headline=headline,
            evidence=evidence,
            inference=inference,
            confidence=confidence,
            why_it_matters=why_it_matters,
            risk_level=risk_level,
            suggested_actions=suggested_actions,
            highlighted_nodes=highlighted_nodes
        )

    def get_demo_explanation(self) -> AIExplanation:
        """
        Get the pre-built explanation for the demo scenario (payment-service).
        """
        return self.explain_entity(
            entity_type="Deployment",
            entity_name="payment-service",
            namespace="production"
        )
