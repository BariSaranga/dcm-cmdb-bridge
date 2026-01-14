import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { AuditLog, AuditSummary, PaginatedResponse } from '../types';

interface AuditFilters {
  page?: number;
  page_size?: number;
  event_type?: string;
  entity_type?: string;
  entity_id?: number;
  actor?: string;
}

export const auditKeys = {
  all: ['audit'] as const,
  lists: () => [...auditKeys.all, 'list'] as const,
  list: (filters: AuditFilters) => [...auditKeys.lists(), filters] as const,
  entityTrail: (entityType: string, entityId: number) =>
    [...auditKeys.all, 'trail', entityType, entityId] as const,
  summary: (days: number) => [...auditKeys.all, 'summary', days] as const,
};

export function useAuditLogs(filters: AuditFilters = {}) {
  return useQuery({
    queryKey: auditKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') params.append(key, String(value));
      });
      const { data } = await apiClient.get<PaginatedResponse<AuditLog>>(
        `/api/v1/audit?${params}`
      );
      return data;
    },
  });
}

export function useAuditEntityTrail(entityType: string, entityId: number) {
  return useQuery({
    queryKey: auditKeys.entityTrail(entityType, entityId),
    queryFn: async () => {
      const { data } = await apiClient.get<AuditLog[]>(
        `/api/v1/audit/entity/${entityType}/${entityId}`
      );
      return data;
    },
    enabled: !!entityType && !!entityId,
  });
}

export function useAuditSummary(days: number = 7) {
  return useQuery({
    queryKey: auditKeys.summary(days),
    queryFn: async () => {
      const { data } = await apiClient.get<AuditSummary>(`/api/v1/audit/summary?days=${days}`);
      return data;
    },
  });
}
