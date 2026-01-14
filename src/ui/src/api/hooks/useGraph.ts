import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { GraphSnapshot, GraphSnapshotDetail, GraphSummary } from '../types';

interface GraphSnapshotFilters {
  limit?: number;
  snapshot_id?: number;
}

export const graphKeys = {
  all: ['graph'] as const,
  snapshots: () => [...graphKeys.all, 'snapshots'] as const,
  snapshotList: (filters: GraphSnapshotFilters) => [...graphKeys.snapshots(), 'list', filters] as const,
  snapshotDetail: (id: number) => [...graphKeys.snapshots(), 'detail', id] as const,
  latest: (snapshotId?: number) => [...graphKeys.all, 'latest', snapshotId] as const,
  summary: () => [...graphKeys.all, 'summary'] as const,
};

export function useGraphSnapshots(filters: GraphSnapshotFilters = {}) {
  return useQuery({
    queryKey: graphKeys.snapshotList(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) params.append(key, String(value));
      });
      const { data } = await apiClient.get<GraphSnapshot[]>(
        `/api/v1/graph/snapshots?${params}`
      );
      return data;
    },
  });
}

export function useGraphSnapshot(id: number | null) {
  return useQuery({
    queryKey: graphKeys.snapshotDetail(id!),
    queryFn: async () => {
      const { data } = await apiClient.get<GraphSnapshotDetail>(
        `/api/v1/graph/snapshots/${id}`
      );
      return data;
    },
    enabled: id !== null,
  });
}

export function useLatestGraph(snapshotId?: number) {
  return useQuery({
    queryKey: graphKeys.latest(snapshotId),
    queryFn: async () => {
      const params = snapshotId ? `?snapshot_id=${snapshotId}` : '';
      const { data } = await apiClient.get<GraphSnapshotDetail>(
        `/api/v1/graph/latest${params}`
      );
      return data;
    },
  });
}

export function useGraphSummary() {
  return useQuery({
    queryKey: graphKeys.summary(),
    queryFn: async () => {
      const { data } = await apiClient.get<GraphSummary>('/api/v1/graph/summary');
      return data;
    },
  });
}

export function useBuildGraph() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (snapshotId: number) => {
      const { data } = await apiClient.post<GraphSnapshot>('/api/v1/graph/build', {
        snapshot_id: snapshotId,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: graphKeys.all });
    },
  });
}
