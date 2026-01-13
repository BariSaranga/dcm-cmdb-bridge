"""
Drift Detection Engine

Compares runtime snapshot entities against CMDB items to detect drift.

Drift Types:
- structural_missing_in_cmdb: Runtime entity has no CMDB record
- structural_stale_in_cmdb: CMDB item has no runtime entity
- ownership: Owner mismatch between runtime and CMDB
- configuration: Environment or other attribute mismatch
- lifecycle: CMDB status conflicts with runtime state
"""

from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session

from models import Snapshot, NormalizedEntity, CMDBItem
from models.drift import DriftRecord


class DriftEngine:
    """Engine for detecting drift between runtime and CMDB."""

    # Mappable entity kinds (K8s types that should have CMDB entries)
    MAPPABLE_KINDS = {"Deployment", "StatefulSet", "Service"}

    def __init__(self, db: Session):
        self.db = db

    def detect_drift(self, snapshot_id: int) -> List[DriftRecord]:
        """
        Run drift detection for a snapshot.

        Args:
            snapshot_id: ID of the snapshot to analyze

        Returns:
            List of created DriftRecord instances
        """
        snapshot = self.db.query(Snapshot).filter(Snapshot.id == snapshot_id).first()
        if not snapshot:
            raise ValueError(f"Snapshot {snapshot_id} not found")

        # Get all entities from snapshot
        entities = self.db.query(NormalizedEntity).filter(
            NormalizedEntity.snapshot_id == snapshot_id
        ).all()

        # Get all active CMDB items
        cmdb_items = self.db.query(CMDBItem).all()

        drift_records = []

        # Build lookup maps
        entity_map = self._build_entity_map(entities)
        cmdb_map = self._build_cmdb_map(cmdb_items)

        # Detect drift for each entity
        for entity in entities:
            if entity.kind not in self.MAPPABLE_KINDS:
                continue

            key = self._make_key(entity.kind, entity.namespace, entity.name)
            cmdb_item = cmdb_map.get(key)

            if cmdb_item is None:
                # Structural drift: missing in CMDB
                drift = self._create_missing_in_cmdb_drift(snapshot_id, entity)
                drift_records.append(drift)
            else:
                # Check for other drift types
                drifts = self._compare_entity_to_cmdb(snapshot_id, entity, cmdb_item)
                drift_records.extend(drifts)

        # Check for stale CMDB items (exist in CMDB but not in runtime)
        for key, cmdb_item in cmdb_map.items():
            if cmdb_item.status == "decommissioned":
                continue  # Skip already decommissioned items

            if key not in entity_map and cmdb_item.ci_type in self.MAPPABLE_KINDS:
                drift = self._create_stale_in_cmdb_drift(snapshot_id, cmdb_item)
                drift_records.append(drift)

        # Save all drift records
        for drift in drift_records:
            self.db.add(drift)
        self.db.commit()

        return drift_records

    def _build_entity_map(self, entities: List[NormalizedEntity]) -> Dict[str, NormalizedEntity]:
        """Build lookup map for entities by type/namespace/name."""
        return {
            self._make_key(e.kind, e.namespace, e.name): e
            for e in entities
            if e.kind in self.MAPPABLE_KINDS
        }

    def _build_cmdb_map(self, items: List[CMDBItem]) -> Dict[str, CMDBItem]:
        """Build lookup map for CMDB items by type/namespace/name."""
        return {
            self._make_key(i.ci_type, i.namespace, i.name): i
            for i in items
        }

    def _make_key(self, kind: str, namespace: Optional[str], name: str) -> str:
        """Create a unique key for entity/CMDB item lookup."""
        return f"{kind}:{namespace or 'default'}:{name}"

    def _create_missing_in_cmdb_drift(
        self, snapshot_id: int, entity: NormalizedEntity
    ) -> DriftRecord:
        """Create drift record for entity missing in CMDB."""
        return DriftRecord(
            snapshot_id=snapshot_id,
            entity_id=entity.id,
            cmdb_item_id=None,
            drift_type="structural_missing_in_cmdb",
            severity="high",
            status="open",
            description=f"{entity.kind} '{entity.namespace}/{entity.name}' exists in runtime but not in CMDB",
            details={
                "entity_kind": entity.kind,
                "entity_name": entity.name,
                "entity_namespace": entity.namespace,
                "entity_owner": entity.owner,
                "entity_environment": entity.environment,
            }
        )

    def _create_stale_in_cmdb_drift(
        self, snapshot_id: int, cmdb_item: CMDBItem
    ) -> DriftRecord:
        """Create drift record for CMDB item not found in runtime."""
        return DriftRecord(
            snapshot_id=snapshot_id,
            entity_id=None,
            cmdb_item_id=cmdb_item.id,
            drift_type="structural_stale_in_cmdb",
            severity="medium",
            status="open",
            description=f"{cmdb_item.ci_type} '{cmdb_item.namespace}/{cmdb_item.name}' in CMDB but not in runtime",
            details={
                "cmdb_type": cmdb_item.ci_type,
                "cmdb_name": cmdb_item.name,
                "cmdb_namespace": cmdb_item.namespace,
                "cmdb_owner": cmdb_item.owner,
                "cmdb_status": cmdb_item.status,
            }
        )

    def _compare_entity_to_cmdb(
        self, snapshot_id: int, entity: NormalizedEntity, cmdb_item: CMDBItem
    ) -> List[DriftRecord]:
        """Compare matched entity and CMDB item for drift."""
        drifts = []

        # Check ownership drift
        if entity.owner and cmdb_item.owner:
            if entity.owner.lower() != cmdb_item.owner.lower():
                drifts.append(DriftRecord(
                    snapshot_id=snapshot_id,
                    entity_id=entity.id,
                    cmdb_item_id=cmdb_item.id,
                    drift_type="ownership",
                    severity="medium",
                    status="open",
                    description=f"Owner mismatch for {entity.kind} '{entity.name}'",
                    details={
                        "runtime_owner": entity.owner,
                        "cmdb_owner": cmdb_item.owner,
                        "entity_name": entity.name,
                        "entity_namespace": entity.namespace,
                    }
                ))

        # Check environment drift
        if entity.environment and cmdb_item.environment:
            if entity.environment.lower() != cmdb_item.environment.lower():
                drifts.append(DriftRecord(
                    snapshot_id=snapshot_id,
                    entity_id=entity.id,
                    cmdb_item_id=cmdb_item.id,
                    drift_type="configuration",
                    severity="low",
                    status="open",
                    description=f"Environment mismatch for {entity.kind} '{entity.name}'",
                    details={
                        "runtime_environment": entity.environment,
                        "cmdb_environment": cmdb_item.environment,
                        "entity_name": entity.name,
                        "entity_namespace": entity.namespace,
                    }
                ))

        # Check lifecycle drift (CMDB says decommissioned but still running)
        if cmdb_item.status == "decommissioned":
            drifts.append(DriftRecord(
                snapshot_id=snapshot_id,
                entity_id=entity.id,
                cmdb_item_id=cmdb_item.id,
                drift_type="lifecycle",
                severity="critical",
                status="open",
                description=f"{entity.kind} '{entity.name}' is running but marked decommissioned in CMDB",
                details={
                    "runtime_status": "running",
                    "cmdb_status": cmdb_item.status,
                    "entity_name": entity.name,
                    "entity_namespace": entity.namespace,
                }
            ))

        return drifts
