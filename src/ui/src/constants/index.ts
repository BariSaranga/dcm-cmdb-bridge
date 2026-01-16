/**
 * Application constants
 */

// Drift types
export const DRIFT_TYPES = {
  STRUCTURAL_MISSING_IN_CMDB: 'structural_missing_in_cmdb',
  STRUCTURAL_STALE_IN_CMDB: 'structural_stale_in_cmdb',
  OWNERSHIP: 'ownership',
  CONFIGURATION: 'configuration',
  LIFECYCLE: 'lifecycle',
  MISSING_IN_CMDB: 'missing_in_cmdb',
  SECURITY: 'security',
} as const;

export const DRIFT_TYPE_LABELS: Record<string, string> = {
  structural_missing_in_cmdb: 'Missing in CMDB',
  structural_stale_in_cmdb: 'Stale in CMDB',
  ownership: 'Ownership Mismatch',
  configuration: 'Configuration Drift',
  lifecycle: 'Lifecycle Conflict',
  missing_in_cmdb: 'Missing in CMDB',
  security: 'Security Risk',
};

// Severity levels
export const SEVERITIES = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export type Severity = typeof SEVERITIES[keyof typeof SEVERITIES];

// Drift statuses
export const DRIFT_STATUSES = {
  OPEN: 'open',
  ACKNOWLEDGED: 'acknowledged',
  RESOLVED: 'resolved',
} as const;

export type DriftStatus = typeof DRIFT_STATUSES[keyof typeof DRIFT_STATUSES];

// Action types
export const ACTION_TYPES = {
  CREATE_CMDB: 'create_cmdb',
  UPDATE_CMDB: 'update_cmdb',
  DECOMMISSION_CMDB: 'decommission_cmdb',
  ACKNOWLEDGE: 'acknowledge',
} as const;

export const ACTION_TYPE_LABELS: Record<string, string> = {
  create_cmdb: 'Create CMDB',
  update_cmdb: 'Update CMDB',
  decommission_cmdb: 'Decommission CMDB',
  acknowledge: 'Acknowledge',
};

// Action statuses
export const ACTION_STATUSES = {
  PROPOSED: 'proposed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  APPLIED: 'applied',
  FAILED: 'failed',
} as const;

export type ActionStatus = typeof ACTION_STATUSES[keyof typeof ACTION_STATUSES];

// CMDB statuses
export const CMDB_STATUSES = {
  ACTIVE: 'active',
  DECOMMISSIONED: 'decommissioned',
  PLANNED: 'planned',
} as const;

// Entity kinds
export const ENTITY_KINDS = {
  DEPLOYMENT: 'Deployment',
  SERVICE: 'Service',
  STATEFULSET: 'StatefulSet',
  INGRESS: 'Ingress',
  CONFIGMAP: 'ConfigMap',
  SECRET: 'Secret',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  DRIFTS: '/api/v1/drift',
  ACTIONS: '/api/v1/actions',
  AUDIT: '/api/v1/audit',
  GRAPH: '/api/v1/graph',
  CMDB: '/api/v1/cmdb',
  DISCOVERY: '/api/v1/discovery',
  DEMO: '/api/v1/demo',
  AI: '/api/v1/ai',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;
