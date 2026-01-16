/**
 * Formatting utilities for consistent display across the application
 */

/**
 * Format a date string for display
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString();
}

/**
 * Format a date string with time
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString();
}

/**
 * Format a relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return '-';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  return formatDate(dateString);
}

/**
 * Format an action type for display (e.g., "create_cmdb" -> "Create CMDB")
 */
export function formatActionType(type: string): string {
  return type
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format a drift type for display
 */
export function formatDriftType(type: string): string {
  const labels: Record<string, string> = {
    structural_missing_in_cmdb: 'Missing in CMDB',
    structural_stale_in_cmdb: 'Stale in CMDB',
    ownership: 'Ownership Mismatch',
    configuration: 'Configuration Drift',
    lifecycle: 'Lifecycle Conflict',
    missing_in_cmdb: 'Missing in CMDB',
    security: 'Security Risk',
  };
  return labels[type] || formatActionType(type);
}

/**
 * Format a status string for display (capitalize first letter)
 */
export function formatStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Format a number with commas for thousands
 */
export function formatNumber(num: number): string {
  return num.toLocaleString();
}

/**
 * Format a percentage
 */
export function formatPercentage(value: number, decimals = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Truncate a string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength - 3)}...`;
}

/**
 * Format entity kind for display
 */
export function formatEntityKind(kind: string): string {
  // Handle camelCase kinds like "StatefulSet"
  return kind.replace(/([a-z])([A-Z])/g, '$1 $2');
}

/**
 * Format a namespace/name combination
 */
export function formatEntityPath(namespace: string | null, name: string): string {
  if (!namespace || namespace === 'default') return name;
  return `${namespace}/${name}`;
}
