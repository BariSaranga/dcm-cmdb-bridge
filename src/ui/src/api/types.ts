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
