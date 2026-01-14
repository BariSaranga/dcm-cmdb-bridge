import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { actionKeys, useActions, useAction } from '../useActions';

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

describe('actionKeys', () => {
  it('creates correct query keys', () => {
    expect(actionKeys.all).toEqual(['actions']);
    expect(actionKeys.lists()).toEqual(['actions', 'list']);
    expect(actionKeys.list({ status: 'proposed' })).toEqual([
      'actions',
      'list',
      { status: 'proposed' },
    ]);
    expect(actionKeys.detail(1)).toEqual(['actions', 'detail', 1]);
  });
});

describe('useActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches actions list', async () => {
    const mockData = {
      items: [
        { id: 1, action_type: 'acknowledge', status: 'proposed' },
      ],
      total: 1,
      page: 1,
      page_size: 20,
    };

    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(() => useActions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
  });

  it('includes filters in request', async () => {
    const mockData = { items: [], total: 0, page: 1, page_size: 20 };
    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(
      () => useActions({ status: 'approved', action_type: 'create_cmdb' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(apiClient.get).toHaveBeenCalledWith(
      expect.stringContaining('status=approved')
    );
  });
});

describe('useAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches single action', async () => {
    const mockData = { id: 1, action_type: 'acknowledge', status: 'proposed' };

    vi.mocked(apiClient.get).mockResolvedValueOnce({ data: mockData });

    const { result } = renderHook(() => useAction(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockData);
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/actions/1');
  });

  it('does not fetch when id is null', () => {
    const { result } = renderHook(() => useAction(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(apiClient.get).not.toHaveBeenCalled();
  });
});
