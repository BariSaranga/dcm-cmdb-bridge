import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';

export interface PlanLimits {
  max_entities: number;
  max_users: number;
  max_clusters: number;
  retention_days: number;
  ai_explanations_daily: number;
  drift_types: string;
  graph_export: boolean;
  api_access: boolean;
  sso_enabled: boolean;
  multi_cluster: boolean;
  custom_integrations: boolean;
  audit_export: boolean;
  sla_guarantee: boolean;
  dedicated_support: boolean;
}

export interface PricingTier {
  tier: string;
  name: string;
  description: string;
  price_monthly: number | null;
  price_annual: number | null;
  limits: PlanLimits;
  features: string[];
  cta: string;
  popular?: boolean;
}

export interface Subscription {
  id: number;
  organization_id: number;
  plan_tier: string;
  status: string;
  billing_interval: string;
  price_cents: number;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  canceled_at: string | null;
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  billing_email: string | null;
  created_at: string;
}

export interface UsageRecord {
  organization_id: number;
  period_start: string;
  period_end: string;
  entities_count: number;
  users_count: number;
  clusters_count: number;
  ai_explanations_count: number;
  drift_records_count: number;
  actions_count: number;
  api_calls_count: number;
}

export const billingKeys = {
  all: ['billing'] as const,
  pricing: () => [...billingKeys.all, 'pricing'] as const,
  organization: (id: number) => [...billingKeys.all, 'organization', id] as const,
  subscription: (orgId: number) => [...billingKeys.all, 'subscription', orgId] as const,
  usage: (orgId: number) => [...billingKeys.all, 'usage', orgId] as const,
  planLimits: (tier: string) => [...billingKeys.all, 'limits', tier] as const,
};

export function usePricingTiers() {
  return useQuery({
    queryKey: billingKeys.pricing(),
    queryFn: async () => {
      const { data } = await apiClient.get<PricingTier[]>('/api/v1/billing/pricing');
      return data;
    },
  });
}

export function useOrganization(orgId: number) {
  return useQuery({
    queryKey: billingKeys.organization(orgId),
    queryFn: async () => {
      const { data } = await apiClient.get<Organization>(
        `/api/v1/billing/organizations/${orgId}`
      );
      return data;
    },
    enabled: orgId > 0,
  });
}

export function useSubscription(orgId: number) {
  return useQuery({
    queryKey: billingKeys.subscription(orgId),
    queryFn: async () => {
      const { data } = await apiClient.get<Subscription>(
        `/api/v1/billing/organizations/${orgId}/subscription`
      );
      return data;
    },
    enabled: orgId > 0,
  });
}

export function useUsage(orgId: number) {
  return useQuery({
    queryKey: billingKeys.usage(orgId),
    queryFn: async () => {
      const { data } = await apiClient.get<UsageRecord>(
        `/api/v1/billing/organizations/${orgId}/usage`
      );
      return data;
    },
    enabled: orgId > 0,
  });
}

export function usePlanLimits(tier: string) {
  return useQuery({
    queryKey: billingKeys.planLimits(tier),
    queryFn: async () => {
      const { data } = await apiClient.get<PlanLimits>(
        `/api/v1/billing/plans/${tier}/limits`
      );
      return data;
    },
    enabled: !!tier,
  });
}
