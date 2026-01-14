import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { driftKeys, useDriftRecords, useDriftSummary } from '../useDrift';

// Mock the API client
vi.mock('../../client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
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

describe('driftKeys', () => {
  it('creates correct query keys', () => {
    expect(driftKeys.all).toEqual(['drifts']);
    expect(driftKeys.lists()).toEqual(['drifts', 'list']);
    expect(driftKeys.list({ page: 1 })).toEqual(['drifts', 'list', { page: 1 }]);
    expect(driftKeys.detail(1)).toEqual(['drifts', 'detail', 1]);
    expect(driftKeys.summary(5)).toEqual(['drifts', 'summary', 5]);
  });
});

describe('useDriftRecords', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches drift records', async () => {
    const mockData = {
      items: [{ id: 1, drift_type: 'ownership', severity: 'high' }],
      total: 1,
      page: 1,
      page_size: 20,
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(() => useDriftRecords(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/drift/records?');
  });

  it('includes filters in request', async () => {
    const mockData = { items: [], total: 0, page: 1, page_size: 20 };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(
      () => useDriftRecords({ severity: 'high', status: 'open' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith(
      expect.stringContaining('severity=high')
    );
    expect(apiClient.get).toHaveBeenCalledWith(
      expect.stringContaining('status=open')
    );
  });
});

describe('useDriftSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches drift summary', async () => {
    const mockData = {
      total: 10,
      by_type: { ownership: 5 },
      by_severity: { high: 3 },
      by_status: { open: 7 },
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(() => useDriftSummary(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
  });
});
