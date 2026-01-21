// Pagination wrapper
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// Drift types
export type DriftType =
  | 'structural_missing_in_cmdb'
  | 'structural_stale_in_cmdb'
  | 'ownership'
  | 'configuration'
  | 'lifecycle';

export type DriftSeverity = 'low' | 'medium' | 'high' | 'critical';
export type DriftStatus = 'open' | 'acknowledged' | 'resolved';

export interface DriftRecord {
  id: number;
  snapshot_id: number;
  entity_id: number | null;
  cmdb_item_id: number | null;
  drift_type: DriftType;
  severity: DriftSeverity;
  status: DriftStatus;
  description: string;
  details: Record<string, unknown> | null;
  created_at: string;
  resolved_at: string | null;
}

export interface DriftSummary {
  total: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
  by_status: Record<string, number>;
}

export interface DriftDetectionResult {
  snapshot_id: number;
  drift_count: number;
  by_type: Record<string, number>;
  by_severity: Record<string, number>;
}

// Action types
export type ActionType = 'create_cmdb' | 'update_cmdb' | 'decommission_cmdb' | 'acknowledge';
export type ActionStatus = 'proposed' | 'approved' | 'rejected' | 'applied' | 'failed';

export interface Action {
  id: number;
  drift_record_id: number;
  action_type: ActionType;
  status: ActionStatus;
  description: string;
  payload: Record<string, unknown>;
  proposed_by: string;
  proposed_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_comment: string | null;
  applied_at: string | null;
  result: Record<string, unknown> | null;
}

// Audit types
export interface AuditLog {
  id: number;
  event_type: string;
  entity_type: string;
  entity_id: number;
  actor: string;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface AuditSummary {
  period_days: number;
  total_events: number;
  by_event_type: Record<string, number>;
  by_entity_type: Record<string, number>;
  by_actor: Record<string, number>;
}

// Snapshot types
export type SnapshotStatus = 'pending' | 'completed' | 'failed';

export interface Snapshot {
  id: number;
  source: string;
  status: SnapshotStatus;
  entity_count: number | null;
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export interface NormalizedEntity {
  id: number;
  source_type: string;
  kind: string;
  name: string;
  namespace: string | null;
  uid: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  owner: string | null;
  environment: string | null;
  created_at: string;
}

// CMDB types
export type CMDBItemStatus = 'active' | 'decommissioned' | 'planned';

export interface CMDBItem {
  id: number;
  ci_type: string;
  name: string;
  namespace: string | null;
  environment: string | null;
  owner: string | null;
  status: CMDBItemStatus;
  description: string | null;
  extra_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

// Graph types
export type GraphSnapshotStatus = 'building' | 'completed' | 'failed';
export type GraphNodeType = 'runtime' | 'cmdb';
export type GraphDriftStatus =
  | 'mapped'
  | 'missing_in_cmdb'
  | 'stale_in_cmdb'
  | 'ownership_mismatch'
  | 'config_mismatch'
  | 'lifecycle_conflict'
  | 'drift_detected';

export interface GraphNode {
  id: number;
  node_id: string;
  node_type: GraphNodeType;
  entity_id: number | null;
  cmdb_item_id: number | null;
  kind: string;
  name: string;
  namespace: string | null;
  owner: string | null;
  environment: string | null;
  drift_status: GraphDriftStatus | null;
  drift_severity: DriftSeverity | null;
  drift_record_id: number | null;
  position_x: number | null;
  position_y: number | null;
  extra_data: Record<string, unknown> | null;
}

export interface GraphEdge {
  id: number;
  edge_id: string;
  edge_type: string;
  source_node_id: string;
  target_node_id: string;
  label: string | null;
  style: string | null;
  extra_data: Record<string, unknown> | null;
}

export interface GraphSnapshot {
  id: number;
  snapshot_id: number;
  status: GraphSnapshotStatus;
  node_count: number;
  edge_count: number;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface GraphSnapshotDetail extends GraphSnapshot {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphSummary {
  total_snapshots: number;
  latest_snapshot_id: number | null;
  latest_node_count: number;
  latest_edge_count: number;
  nodes_by_type: Record<string, number>;
  nodes_by_drift_status: Record<string, number>;
}

// Architecture types
export type ArchitectureNodeType = 'container' | 'datastore' | 'external';

export interface ArchitectureView {
  id: string;
  title: string;
}

export interface ArchitectureNode {
  id: string;
  name: string;
  type: ArchitectureNodeType;
  tech: string;
  description: string;
}

export interface ArchitectureEdge {
  source: string;
  target: string;
  relation: string;
  protocol: string | null;
}

export interface ArchitectureModel {
  version: number;
  views: ArchitectureView[];
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
}

export interface ArchitectureDiagram {
  view: string;
  format: string;
  diagram: string;
}

export interface ArchitectureConnection {
  node_id?: string;
  from?: string;
  to?: string;
  from_name?: string;
  to_name?: string;
  relation: string;
  protocol: string | null;
}

export interface ArchitectureNodeDetails {
  node: ArchitectureNode;
  incoming_connections: ArchitectureConnection[];
  outgoing_connections: ArchitectureConnection[];
}

export interface ArchitectureValidation {
  valid: boolean;
  issues: string[];
  node_count: number;
  edge_count: number;
  view_count: number;
}
