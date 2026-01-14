"""
Graph Builder Service

Builds infrastructure graph snapshots combining:
- Runtime entities from discovery snapshots
- CMDB items
- Drift records for mapping status
"""

from datetime import datetime
from typing import List, Dict, Optional
from sqlalchemy.orm import Session

from models import (
    Snapshot,
    NormalizedEntity,
    CMDBItem,
    DriftRecord,
    GraphSnapshot,
    GraphNode,
    GraphEdge,
)


class GraphBuilder:
    """Builds infrastructure graphs from runtime snapshots and CMDB."""

    MAPPABLE_KINDS = {"Deployment", "StatefulSet", "Service"}

    def __init__(self, db: Session):
        self.db = db

    def build_graph(self, snapshot_id: int) -> GraphSnapshot:
        """
        Build a graph snapshot from a runtime snapshot.

        Args:
            snapshot_id: ID of the source runtime snapshot

        Returns:
            Created GraphSnapshot instance
        """
        # Verify source snapshot exists
        snapshot = self.db.query(Snapshot).filter(Snapshot.id == snapshot_id).first()
        if not snapshot:
            raise ValueError(f"Snapshot {snapshot_id} not found")

        # Create graph snapshot
        graph_snapshot = GraphSnapshot(
            snapshot_id=snapshot_id,
            status="building"
        )
        self.db.add(graph_snapshot)
        self.db.flush()  # Get ID

        try:
            # Build graph components
            nodes = self._build_nodes(graph_snapshot.id, snapshot_id)
            edges = self._build_edges(graph_snapshot.id, nodes)

            # Update counts
            graph_snapshot.node_count = len(nodes)
            graph_snapshot.edge_count = len(edges)
            graph_snapshot.status = "completed"
            graph_snapshot.completed_at = datetime.utcnow()

        except Exception as e:
            graph_snapshot.status = "failed"
            graph_snapshot.error_message = str(e)

        self.db.commit()
        return graph_snapshot

    def _build_nodes(
        self, graph_snapshot_id: int, snapshot_id: int
    ) -> Dict[str, GraphNode]:
        """Build all nodes for the graph."""
        nodes: Dict[str, GraphNode] = {}

        # Get runtime entities
        entities = self.db.query(NormalizedEntity).filter(
            NormalizedEntity.snapshot_id == snapshot_id
        ).all()

        # Get CMDB items
        cmdb_items = self.db.query(CMDBItem).filter(
            CMDBItem.status != "decommissioned"
        ).all()

        # Get drift records for this snapshot
        drift_records = self.db.query(DriftRecord).filter(
            DriftRecord.snapshot_id == snapshot_id
        ).all()

        # Build lookup maps
        entity_map = self._build_entity_key_map(entities)
        cmdb_map = self._build_cmdb_key_map(cmdb_items)
        drift_by_entity = {d.entity_id: d for d in drift_records if d.entity_id}
        drift_by_cmdb = {d.cmdb_item_id: d for d in drift_records if d.cmdb_item_id}

        # Create runtime nodes
        for entity in entities:
            if entity.kind not in self.MAPPABLE_KINDS:
                continue

            node_id = f"runtime:{entity.kind}:{entity.namespace}:{entity.name}"
            key = self._make_key(entity.kind, entity.namespace, entity.name)

            # Determine drift status
            drift_record = drift_by_entity.get(entity.id)
            cmdb_item = cmdb_map.get(key)

            drift_status = self._determine_runtime_drift_status(
                entity, cmdb_item, drift_record
            )

            node = GraphNode(
                graph_snapshot_id=graph_snapshot_id,
                node_id=node_id,
                node_type="runtime",
                entity_id=entity.id,
                kind=entity.kind,
                name=entity.name,
                namespace=entity.namespace,
                owner=entity.owner,
                environment=entity.environment,
                drift_status=drift_status,
                drift_severity=drift_record.severity if drift_record else None,
                drift_record_id=drift_record.id if drift_record else None,
                extra_data={
                    "labels": entity.labels,
                    "uid": entity.uid,
                }
            )
            self.db.add(node)
            nodes[node_id] = node

        # Create CMDB nodes
        for cmdb_item in cmdb_items:
            if cmdb_item.ci_type not in self.MAPPABLE_KINDS:
                continue

            node_id = f"cmdb:{cmdb_item.ci_type}:{cmdb_item.namespace}:{cmdb_item.name}"
            key = self._make_key(cmdb_item.ci_type, cmdb_item.namespace, cmdb_item.name)

            # Check if this CMDB item has a runtime counterpart
            entity = entity_map.get(key)
            drift_record = drift_by_cmdb.get(cmdb_item.id)

            drift_status = self._determine_cmdb_drift_status(
                cmdb_item, entity, drift_record
            )

            node = GraphNode(
                graph_snapshot_id=graph_snapshot_id,
                node_id=node_id,
                node_type="cmdb",
                cmdb_item_id=cmdb_item.id,
                kind=cmdb_item.ci_type,
                name=cmdb_item.name,
                namespace=cmdb_item.namespace,
                owner=cmdb_item.owner,
                environment=cmdb_item.environment,
                drift_status=drift_status,
                drift_severity=drift_record.severity if drift_record else None,
                drift_record_id=drift_record.id if drift_record else None,
                extra_data={
                    "cmdb_status": cmdb_item.status,
                    "description": cmdb_item.description,
                }
            )
            self.db.add(node)
            nodes[node_id] = node

        self.db.flush()
        return nodes

    def _build_edges(
        self, graph_snapshot_id: int, nodes: Dict[str, GraphNode]
    ) -> List[GraphEdge]:
        """Build edges representing relationships."""
        edges: List[GraphEdge] = []

        # Group nodes by key for matching
        runtime_by_key: Dict[str, GraphNode] = {}
        cmdb_by_key: Dict[str, GraphNode] = {}

        for node in nodes.values():
            key = self._make_key(node.kind, node.namespace, node.name)
            if node.node_type == "runtime":
                runtime_by_key[key] = node
            else:
                cmdb_by_key[key] = node

        # Create mapping edges
        for key, runtime_node in runtime_by_key.items():
            cmdb_node = cmdb_by_key.get(key)

            if cmdb_node:
                # Mapped - create edge from runtime to CMDB
                edge_type = "mapped_to_cmdb"
                style = "default"
                label = "mapped"

                # Check for drift
                if runtime_node.drift_status in ["ownership_mismatch", "config_mismatch"]:
                    edge_type = runtime_node.drift_status
                    style = "warning"
                    label = runtime_node.drift_status.replace("_", " ")

                edge = GraphEdge(
                    graph_snapshot_id=graph_snapshot_id,
                    edge_id=f"map:{runtime_node.node_id}:{cmdb_node.node_id}",
                    edge_type=edge_type,
                    source_node_id=runtime_node.node_id,
                    target_node_id=cmdb_node.node_id,
                    label=label,
                    style=style,
                )
                self.db.add(edge)
                edges.append(edge)

        # Mark CMDB nodes without runtime counterpart
        for key, cmdb_node in cmdb_by_key.items():
            if key not in runtime_by_key:
                # Stale in CMDB - create a self-referencing indicator edge
                edge = GraphEdge(
                    graph_snapshot_id=graph_snapshot_id,
                    edge_id=f"stale:{cmdb_node.node_id}",
                    edge_type="stale_in_cmdb",
                    source_node_id=cmdb_node.node_id,
                    target_node_id=cmdb_node.node_id,
                    label="stale",
                    style="error",
                )
                self.db.add(edge)
                edges.append(edge)

        self.db.flush()
        return edges

    def _determine_runtime_drift_status(
        self,
        entity: NormalizedEntity,
        cmdb_item: Optional[CMDBItem],
        drift_record: Optional[DriftRecord]
    ) -> str:
        """Determine drift status for a runtime entity."""
        if not cmdb_item:
            return "missing_in_cmdb"

        if drift_record:
            if drift_record.drift_type == "ownership":
                return "ownership_mismatch"
            elif drift_record.drift_type == "configuration":
                return "config_mismatch"
            elif drift_record.drift_type == "lifecycle":
                return "lifecycle_conflict"

        return "mapped"

    def _determine_cmdb_drift_status(
        self,
        cmdb_item: CMDBItem,
        entity: Optional[NormalizedEntity],
        drift_record: Optional[DriftRecord]
    ) -> str:
        """Determine drift status for a CMDB item."""
        if not entity:
            return "stale_in_cmdb"

        if drift_record:
            return "drift_detected"

        return "mapped"

    def _build_entity_key_map(
        self, entities: List[NormalizedEntity]
    ) -> Dict[str, NormalizedEntity]:
        """Build lookup map for entities."""
        return {
            self._make_key(e.kind, e.namespace, e.name): e
            for e in entities
            if e.kind in self.MAPPABLE_KINDS
        }

    def _build_cmdb_key_map(self, items: List[CMDBItem]) -> Dict[str, CMDBItem]:
        """Build lookup map for CMDB items."""
        return {
            self._make_key(i.ci_type, i.namespace, i.name): i
            for i in items
        }

    def _make_key(self, kind: str, namespace: Optional[str], name: str) -> str:
        """Create a unique key for matching."""
        return f"{kind}:{namespace or 'default'}:{name}"

    def get_latest_graph(self, snapshot_id: Optional[int] = None) -> Optional[GraphSnapshot]:
        """
        Get the latest completed graph snapshot.

        Args:
            snapshot_id: Optional filter by source snapshot ID

        Returns:
            Latest GraphSnapshot or None
        """
        query = self.db.query(GraphSnapshot).filter(
            GraphSnapshot.status == "completed"
        )

        if snapshot_id:
            query = query.filter(GraphSnapshot.snapshot_id == snapshot_id)

        return query.order_by(GraphSnapshot.created_at.desc()).first()
