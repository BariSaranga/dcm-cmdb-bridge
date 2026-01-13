"""
Action Workflow Service

Manages the lifecycle of remediation actions:
- Propose: Create a new action for a drift record
- Approve/Reject: Review and approve or reject the action
- Apply: Execute the approved action against CMDB
"""

from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from models import CMDBItem, DriftRecord
from models.action import Action


class ActionService:
    """Service for managing action workflow."""

    VALID_ACTION_TYPES = {
        "create_cmdb",      # Create new CMDB item
        "update_cmdb",      # Update existing CMDB item
        "decommission_cmdb", # Mark CMDB item as decommissioned
        "acknowledge",      # Acknowledge drift without CMDB change
    }

    VALID_STATUSES = {
        "proposed",
        "approved",
        "rejected",
        "applied",
        "failed",
    }

    # Valid status transitions
    TRANSITIONS = {
        "proposed": {"approved", "rejected"},
        "approved": {"applied", "failed"},
        "rejected": set(),  # Terminal state
        "applied": set(),   # Terminal state
        "failed": {"proposed"},  # Can retry
    }

    def __init__(self, db: Session):
        self.db = db

    def propose_action(
        self,
        drift_record_id: int,
        action_type: str,
        description: str,
        payload: Dict[str, Any],
        proposed_by: str
    ) -> Action:
        """
        Propose a new action for a drift record.

        Args:
            drift_record_id: ID of the drift record
            action_type: Type of action (create_cmdb, update_cmdb, etc.)
            description: Human-readable description
            payload: Action details/parameters
            proposed_by: User proposing the action

        Returns:
            Created Action instance
        """
        # Validate drift record exists
        drift_record = self.db.query(DriftRecord).filter(
            DriftRecord.id == drift_record_id
        ).first()
        if not drift_record:
            raise ValueError(f"Drift record {drift_record_id} not found")

        # Validate action type
        if action_type not in self.VALID_ACTION_TYPES:
            raise ValueError(f"Invalid action type: {action_type}")

        # Check for existing pending action
        existing = self.db.query(Action).filter(
            Action.drift_record_id == drift_record_id,
            Action.status.in_(["proposed", "approved"])
        ).first()
        if existing:
            raise ValueError(
                f"Drift record already has a pending action (ID: {existing.id})"
            )

        action = Action(
            drift_record_id=drift_record_id,
            action_type=action_type,
            description=description,
            payload=payload,
            proposed_by=proposed_by,
            status="proposed"
        )

        self.db.add(action)
        self.db.commit()
        self.db.refresh(action)

        return action

    def approve_action(
        self,
        action_id: int,
        reviewed_by: str,
        comment: Optional[str] = None
    ) -> Action:
        """Approve an action for application."""
        action = self._get_action(action_id)
        self._validate_transition(action, "approved")

        action.status = "approved"
        action.reviewed_by = reviewed_by
        action.reviewed_at = datetime.utcnow()
        action.review_comment = comment

        self.db.commit()
        self.db.refresh(action)

        return action

    def reject_action(
        self,
        action_id: int,
        reviewed_by: str,
        comment: Optional[str] = None
    ) -> Action:
        """Reject an action."""
        action = self._get_action(action_id)
        self._validate_transition(action, "rejected")

        action.status = "rejected"
        action.reviewed_by = reviewed_by
        action.reviewed_at = datetime.utcnow()
        action.review_comment = comment

        self.db.commit()
        self.db.refresh(action)

        return action

    def apply_action(self, action_id: int) -> Action:
        """
        Apply an approved action to CMDB.

        This executes the actual changes against the mock CMDB.
        """
        action = self._get_action(action_id)
        self._validate_transition(action, "applied")

        try:
            result = self._execute_action(action)
            action.status = "applied"
            action.applied_at = datetime.utcnow()
            action.result = result

            # Mark drift as resolved
            drift_record = self.db.query(DriftRecord).filter(
                DriftRecord.id == action.drift_record_id
            ).first()
            if drift_record:
                drift_record.status = "resolved"
                drift_record.resolved_at = datetime.utcnow()

        except Exception as e:
            action.status = "failed"
            action.result = {"error": str(e)}

        self.db.commit()
        self.db.refresh(action)

        return action

    def _get_action(self, action_id: int) -> Action:
        """Get action by ID or raise error."""
        action = self.db.query(Action).filter(Action.id == action_id).first()
        if not action:
            raise ValueError(f"Action {action_id} not found")
        return action

    def _validate_transition(self, action: Action, new_status: str) -> None:
        """Validate that the status transition is allowed."""
        allowed = self.TRANSITIONS.get(action.status, set())
        if new_status not in allowed:
            raise ValueError(
                f"Cannot transition from '{action.status}' to '{new_status}'"
            )

    def _execute_action(self, action: Action) -> Dict[str, Any]:
        """Execute the action against CMDB."""
        if action.action_type == "create_cmdb":
            return self._execute_create_cmdb(action)
        elif action.action_type == "update_cmdb":
            return self._execute_update_cmdb(action)
        elif action.action_type == "decommission_cmdb":
            return self._execute_decommission_cmdb(action)
        elif action.action_type == "acknowledge":
            return self._execute_acknowledge(action)
        else:
            raise ValueError(f"Unknown action type: {action.action_type}")

    def _execute_create_cmdb(self, action: Action) -> Dict[str, Any]:
        """Create a new CMDB item."""
        payload = action.payload
        item = CMDBItem(
            ci_type=payload.get("ci_type"),
            name=payload.get("name"),
            namespace=payload.get("namespace"),
            environment=payload.get("environment", "unknown"),
            owner=payload.get("owner", "unknown"),
            status="active",
            description=payload.get("description"),
            extra_data=payload.get("extra_data")
        )
        self.db.add(item)
        self.db.flush()

        return {
            "action": "created",
            "cmdb_item_id": item.id,
            "ci_type": item.ci_type,
            "name": item.name
        }

    def _execute_update_cmdb(self, action: Action) -> Dict[str, Any]:
        """Update an existing CMDB item."""
        payload = action.payload
        cmdb_item_id = payload.get("cmdb_item_id")

        item = self.db.query(CMDBItem).filter(CMDBItem.id == cmdb_item_id).first()
        if not item:
            raise ValueError(f"CMDB item {cmdb_item_id} not found")

        updates = payload.get("updates", {})
        for field, value in updates.items():
            if hasattr(item, field):
                setattr(item, field, value)

        return {
            "action": "updated",
            "cmdb_item_id": item.id,
            "updates": updates
        }

    def _execute_decommission_cmdb(self, action: Action) -> Dict[str, Any]:
        """Mark a CMDB item as decommissioned."""
        payload = action.payload
        cmdb_item_id = payload.get("cmdb_item_id")

        item = self.db.query(CMDBItem).filter(CMDBItem.id == cmdb_item_id).first()
        if not item:
            raise ValueError(f"CMDB item {cmdb_item_id} not found")

        item.status = "decommissioned"

        return {
            "action": "decommissioned",
            "cmdb_item_id": item.id,
            "name": item.name
        }

    def _execute_acknowledge(self, action: Action) -> Dict[str, Any]:
        """Acknowledge drift without CMDB changes."""
        return {
            "action": "acknowledged",
            "message": "Drift acknowledged without CMDB modification"
        }
