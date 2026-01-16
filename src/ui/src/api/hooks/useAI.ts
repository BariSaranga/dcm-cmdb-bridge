import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';

// Types for AI Explainer
export interface AIEvidence {
  source: string;
  entity_type: string;
  entity_name: string;
  fact: string;
  data: Record<string, unknown>;
}

export interface SuggestedAction {
  action: string;
  priority: string;
  description: string;
  rationale: string;
}

export interface AIExplanation {
  summary: string;
  headline: string;
  evidence: AIEvidence[];
  inference: string;
  confidence: number;
  why_it_matters: string;
  risk_level: string;
  suggested_actions: SuggestedAction[];
  highlighted_nodes: string[];
}

export interface DemoScenario {
  name: string;
  description: string;
  focus_entity: {
    name: string;
    namespace: string;
    kind: string;
  };
  issues_demonstrated: {
    type: string;
    severity: string;
    description: string;
  }[];
  contrasting_entities: {
    name: string;
    status: string;
    description: string;
  }[];
  headline: string;
}

export interface DemoSeedResult {
  status: string;
  message: string;
  snapshot_id: number;
  graph_id: number;
  entities: {
    runtime: number;
    cmdb: number;
    drift_records: number;
    graph_nodes: number;
    graph_edges: number;
  };
  demo_focus: {
    entity: string;
    namespace: string;
    issues: string[];
  };
}

export const aiKeys = {
  all: ['ai'] as const,
  explanation: (entityType: string, namespace: string, entityName: string) =>
    [...aiKeys.all, 'explanation', entityType, namespace, entityName] as const,
  demo: () => [...aiKeys.all, 'demo'] as const,
  demoScenario: () => [...aiKeys.all, 'demo-scenario'] as const,
};

export function useAIExplanation(
  entityType: string,
  namespace: string,
  entityName: string,
  enabled = true
) {
  return useQuery({
    queryKey: aiKeys.explanation(entityType, namespace, entityName),
    queryFn: async () => {
      const { data } = await apiClient.get<AIExplanation>(
        `/api/v1/ai/explain/${entityType}/${namespace}/${entityName}`
      );
      return data;
    },
    enabled: enabled && !!entityType && !!namespace && !!entityName,
  });
}

export function useDemoExplanation() {
  return useQuery({
    queryKey: aiKeys.demo(),
    queryFn: async () => {
      const { data } = await apiClient.get<AIExplanation>('/api/v1/ai/demo');
      return data;
    },
  });
}

export function useDemoScenario() {
  return useQuery({
    queryKey: aiKeys.demoScenario(),
    queryFn: async () => {
      const { data } = await apiClient.get<DemoScenario>('/api/v1/demo/scenario');
      return data;
    },
  });
}

export function useSeedDemo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<DemoSeedResult>('/api/v1/demo/seed');
      return data;
    },
    onSuccess: () => {
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries();
    },
  });
}
