"""
Audit Logging Service

Provides centralized audit logging for compliance and traceability.
All significant system events should be logged through this service.
"""

from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from models.audit import AuditLog


class AuditService:
    """Service for creating audit log entries."""

    # Standard event types
    EVENT_TYPES = {
        # Snapshot events
        "snapshot_created",
        "snapshot_completed",
        "snapshot_failed",
        # Drift events
        "drift_detected",
        "drift_acknowledged",
        "drift_resolved",
        # Action events
        "action_proposed",
        "action_approved",
        "action_rejected",
        "action_applied",
        "action_failed",
        # CMDB events
        "cmdb_item_created",
        "cmdb_item_updated",
        "cmdb_item_decommissioned",
    }

    def __init__(self, db: Session):
        self.db = db

    def log(
        self,
        event_type: str,
        entity_type: str,
        entity_id: int,
        actor: str,
        details: Optional[Dict[str, Any]] = None
    ) -> AuditLog:
        """
        Create an audit log entry.

        Args:
            event_type: Type of event (see EVENT_TYPES)
            entity_type: Type of entity affected
            entity_id: ID of the entity affected
            actor: User or system that triggered the event
            details: Additional event details

        Returns:
            Created AuditLog instance
        """
        entry = AuditLog(
            event_type=event_type,
            entity_type=entity_type,
            entity_id=entity_id,
            actor=actor,
            details=details
        )
        self.db.add(entry)
        self.db.commit()
        self.db.refresh(entry)
        return entry

    # Convenience methods for common events

    def log_snapshot_created(self, snapshot_id: int, actor: str, source: str) -> AuditLog:
        return self.log(
            event_type="snapshot_created",
            entity_type="Snapshot",
            entity_id=snapshot_id,
            actor=actor,
            details={"source": source}
        )

    def log_drift_detected(
        self,
        drift_id: int,
        drift_type: str,
        severity: str,
        description: str
    ) -> AuditLog:
        return self.log(
            event_type="drift_detected",
            entity_type="DriftRecord",
            entity_id=drift_id,
            actor="system",
            details={
                "drift_type": drift_type,
                "severity": severity,
                "description": description
            }
        )

    def log_action_proposed(
        self,
        action_id: int,
        action_type: str,
        actor: str,
        drift_id: int
    ) -> AuditLog:
        return self.log(
            event_type="action_proposed",
            entity_type="Action",
            entity_id=action_id,
            actor=actor,
            details={
                "action_type": action_type,
                "drift_record_id": drift_id
            }
        )

    def log_action_approved(
        self,
        action_id: int,
        actor: str,
        comment: Optional[str] = None
    ) -> AuditLog:
        return self.log(
            event_type="action_approved",
            entity_type="Action",
            entity_id=action_id,
            actor=actor,
            details={"comment": comment} if comment else None
        )

    def log_action_rejected(
        self,
        action_id: int,
        actor: str,
        comment: Optional[str] = None
    ) -> AuditLog:
        return self.log(
            event_type="action_rejected",
            entity_type="Action",
            entity_id=action_id,
            actor=actor,
            details={"comment": comment} if comment else None
        )

    def log_action_applied(
        self,
        action_id: int,
        result: Dict[str, Any]
    ) -> AuditLog:
        return self.log(
            event_type="action_applied",
            entity_type="Action",
            entity_id=action_id,
            actor="system",
            details={"result": result}
        )

    def log_cmdb_created(
        self,
        cmdb_id: int,
        ci_type: str,
        name: str,
        actor: str
    ) -> AuditLog:
        return self.log(
            event_type="cmdb_item_created",
            entity_type="CMDBItem",
            entity_id=cmdb_id,
            actor=actor,
            details={"ci_type": ci_type, "name": name}
        )

    def log_cmdb_updated(
        self,
        cmdb_id: int,
        updates: Dict[str, Any],
        actor: str
    ) -> AuditLog:
        return self.log(
            event_type="cmdb_item_updated",
            entity_type="CMDBItem",
            entity_id=cmdb_id,
            actor=actor,
            details={"updates": updates}
        )
