import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';
import type { Action, PaginatedResponse } from '../types';

interface ActionFilters {
  page?: number;
  page_size?: number;
  drift_record_id?: number;
  action_type?: string;
  status?: string;
}

export const actionKeys = {
  all: ['actions'] as const,
  lists: () => [...actionKeys.all, 'list'] as const,
  list: (filters: ActionFilters) => [...actionKeys.lists(), filters] as const,
  details: () => [...actionKeys.all, 'detail'] as const,
  detail: (id: number) => [...actionKeys.details(), id] as const,
};

export function useActions(filters: ActionFilters = {}) {
  return useQuery({
    queryKey: actionKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') params.append(key, String(value));
      });
      const { data } = await apiClient.get<PaginatedResponse<Action>>(
        `/api/v1/actions?${params}`
      );
      return data;
    },
  });
}

export function useAction(id: number | null) {
  return useQuery({
    queryKey: actionKeys.detail(id!),
    queryFn: async () => {
      const { data } = await apiClient.get<Action>(`/api/v1/actions/${id}`);
      return data;
    },
    enabled: id !== null,
  });
}

export function useProposeAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      drift_record_id: number;
      action_type: string;
      description: string;
      payload: Record<string, unknown>;
      proposed_by: string;
    }) => {
      const { data } = await apiClient.post<Action>('/api/v1/actions', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actionKeys.all });
    },
  });
}

export function useApproveAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      reviewed_by,
      comment,
    }: {
      id: number;
      reviewed_by: string;
      comment?: string;
    }) => {
      const { data } = await apiClient.post<Action>(`/api/v1/actions/${id}/approve`, {
        reviewed_by,
        comment,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actionKeys.all });
    },
  });
}

export function useRejectAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      reviewed_by,
      comment,
    }: {
      id: number;
      reviewed_by: string;
      comment?: string;
    }) => {
      const { data } = await apiClient.post<Action>(`/api/v1/actions/${id}/reject`, {
        reviewed_by,
        comment,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actionKeys.all });
    },
  });
}

export function useApplyAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.post<Action>(`/api/v1/actions/${id}/apply`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: actionKeys.all });
    },
  });
}
