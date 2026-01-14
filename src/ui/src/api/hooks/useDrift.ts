import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { DriftRecord, DriftSummary, PaginatedResponse } from '../types';

interface DriftFilters {
  page?: number;
  page_size?: number;
  snapshot_id?: number;
  drift_type?: string;
  severity?: string;
  status?: string;
}

export const driftKeys = {
  all: ['drifts'] as const,
  lists: () => [...driftKeys.all, 'list'] as const,
  list: (filters: DriftFilters) => [...driftKeys.lists(), filters] as const,
  details: () => [...driftKeys.all, 'detail'] as const,
  detail: (id: number) => [...driftKeys.details(), id] as const,
  summary: (snapshotId?: number) => [...driftKeys.all, 'summary', snapshotId] as const,
};

export function useDriftRecords(filters: DriftFilters = {}) {
  return useQuery({
    queryKey: driftKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') params.append(key, String(value));
      });
      const { data } = await apiClient.get<PaginatedResponse<DriftRecord>>(
        `/api/v1/drift/records?${params}`
      );
      return data;
    },
  });
}

export function useDriftRecord(id: number | null) {
  return useQuery({
    queryKey: driftKeys.detail(id!),
    queryFn: async () => {
      const { data } = await apiClient.get<DriftRecord>(`/api/v1/drift/records/${id}`);
      return data;
    },
    enabled: id !== null,
  });
}

export function useDriftSummary(snapshotId?: number) {
  return useQuery({
    queryKey: driftKeys.summary(snapshotId),
    queryFn: async () => {
      const params = snapshotId ? `?snapshot_id=${snapshotId}` : '';
      const { data } = await apiClient.get<DriftSummary>(`/api/v1/drift/summary${params}`);
      return data;
    },
  });
}

export function useUpdateDriftStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const { data } = await apiClient.patch<DriftRecord>(
        `/api/v1/drift/records/${id}/status`,
        { status }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: driftKeys.all });
    },
  });
}
