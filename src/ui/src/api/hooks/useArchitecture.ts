import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import type {
  ArchitectureModel,
  ArchitectureDiagram,
  ArchitectureNode,
  ArchitectureNodeDetails,
  ArchitectureValidation,
  ArchitectureView,
} from '../types';

export const architectureKeys = {
  all: ['architecture'] as const,
  model: () => [...architectureKeys.all, 'model'] as const,
  diagram: (view: string) => [...architectureKeys.all, 'diagram', view] as const,
  nodes: () => [...architectureKeys.all, 'nodes'] as const,
  nodeDetail: (id: string) => [...architectureKeys.all, 'nodes', id] as const,
  views: () => [...architectureKeys.all, 'views'] as const,
  validation: () => [...architectureKeys.all, 'validation'] as const,
};

export function useArchitectureModel() {
  return useQuery({
    queryKey: architectureKeys.model(),
    queryFn: async () => {
      const { data } = await apiClient.get<ArchitectureModel>(
        '/api/v1/architecture/model'
      );
      return data;
    },
  });
}

export function useArchitectureDiagram(view: string = 'containers') {
  return useQuery({
    queryKey: architectureKeys.diagram(view),
    queryFn: async () => {
      const { data } = await apiClient.get<ArchitectureDiagram>(
        `/api/v1/architecture/diagram?view=${view}`
      );
      return data;
    },
  });
}

export function useArchitectureNodes() {
  return useQuery({
    queryKey: architectureKeys.nodes(),
    queryFn: async () => {
      const { data } = await apiClient.get<ArchitectureNode[]>(
        '/api/v1/architecture/nodes'
      );
      return data;
    },
  });
}

export function useArchitectureNodeDetails(nodeId: string | null) {
  return useQuery({
    queryKey: architectureKeys.nodeDetail(nodeId!),
    queryFn: async () => {
      const { data } = await apiClient.get<ArchitectureNodeDetails>(
        `/api/v1/architecture/nodes/${nodeId}`
      );
      return data;
    },
    enabled: nodeId !== null,
  });
}

export function useArchitectureViews() {
  return useQuery({
    queryKey: architectureKeys.views(),
    queryFn: async () => {
      const { data } = await apiClient.get<ArchitectureView[]>(
        '/api/v1/architecture/views'
      );
      return data;
    },
  });
}

export function useArchitectureValidation() {
  return useQuery({
    queryKey: architectureKeys.validation(),
    queryFn: async () => {
      const { data } = await apiClient.get<ArchitectureValidation>(
        '/api/v1/architecture/validate'
      );
      return data;
    },
  });
}
