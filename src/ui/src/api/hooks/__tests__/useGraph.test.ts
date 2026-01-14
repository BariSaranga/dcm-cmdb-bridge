import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { graphKeys, useLatestGraph, useGraphSummary } from '../useGraph';

// Mock the API client
vi.mock('../../client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import { apiClient } from '../../client';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('graphKeys', () => {
  it('creates correct query keys', () => {
    expect(graphKeys.all).toEqual(['graph']);
    expect(graphKeys.snapshots()).toEqual(['graph', 'snapshots']);
    expect(graphKeys.snapshotDetail(1)).toEqual(['graph', 'snapshots', 'detail', 1]);
    expect(graphKeys.latest(5)).toEqual(['graph', 'latest', 5]);
    expect(graphKeys.summary()).toEqual(['graph', 'summary']);
  });
});

describe('useLatestGraph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches latest graph', async () => {
    const mockData = {
      id: 1,
      snapshot_id: 1,
      status: 'completed',
      nodes: [{ id: 1, node_id: 'runtime:Deployment:ns:name' }],
      edges: [],
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(() => useLatestGraph(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/graph/latest');
  });

  it('includes snapshot_id filter when provided', async () => {
    const mockData = { id: 1, nodes: [], edges: [] };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(() => useLatestGraph(5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/graph/latest?snapshot_id=5');
  });
});

describe('useGraphSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches graph summary', async () => {
    const mockData = {
      total_snapshots: 5,
      latest_snapshot_id: 3,
      latest_node_count: 10,
      latest_edge_count: 8,
      nodes_by_type: { runtime: 5, cmdb: 5 },
      nodes_by_drift_status: { mapped: 3, missing_in_cmdb: 2 },
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(() => useGraphSummary(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/graph/summary');
  });
});
