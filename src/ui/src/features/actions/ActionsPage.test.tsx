import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils';
import { ActionsPage } from './ActionsPage';
import * as actionHooks from '../../api/hooks/useActions';

vi.mock('../../api/hooks/useActions');
vi.mock('./ActionDetailsDrawer', () => ({
  ActionDetailsDrawer: () => <div>Action Details Drawer</div>,
}));

describe('ActionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders error state', () => {
    vi.spyOn(actionHooks, 'useActions').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
    } as any);
    vi.spyOn(actionHooks, 'useApproveAction').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
    vi.spyOn(actionHooks, 'useRejectAction').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderWithProviders(<ActionsPage />);
    expect(screen.getByText(/Failed to load actions/i)).toBeInTheDocument();
  });

  it('renders actions table', async () => {
    const mockData = {
      items: [
        {
          id: 1,
          action_type: 'create_cmdb',
          status: 'proposed',
          description: 'Create CMDB item',
          proposed_by: 'user1',
          proposed_at: '2026-01-01T00:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      page_size: 25,
    };

    vi.spyOn(actionHooks, 'useActions').mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as any);
    vi.spyOn(actionHooks, 'useApproveAction').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
    vi.spyOn(actionHooks, 'useRejectAction').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderWithProviders(<ActionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Create CMDB item')).toBeInTheDocument();
      expect(screen.getByText('user1')).toBeInTheDocument();
    });
  });

  it('shows approve and reject buttons for proposed actions', async () => {
    const mockData = {
      items: [
        {
          id: 1,
          action_type: 'create_cmdb',
          status: 'proposed',
          description: 'Create CMDB item',
          proposed_by: 'user1',
          proposed_at: '2026-01-01T00:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      page_size: 25,
    };

    const mockApprove = vi.fn();
    const mockReject = vi.fn();

    vi.spyOn(actionHooks, 'useActions').mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as any);
    vi.spyOn(actionHooks, 'useApproveAction').mockReturnValue({
      mutateAsync: mockApprove,
      isPending: false,
    } as any);
    vi.spyOn(actionHooks, 'useRejectAction').mockReturnValue({
      mutateAsync: mockReject,
      isPending: false,
    } as any);

    const user = userEvent.setup();
    renderWithProviders(<ActionsPage />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reject/i })).toBeInTheDocument();
    });

    const approveButton = screen.getByRole('button', { name: /Approve/i });
    await user.click(approveButton);
    expect(mockApprove).toHaveBeenCalledWith({ id: 1, reviewed_by: 'admin' });
  });

  it('shows empty state when no actions', async () => {
    vi.spyOn(actionHooks, 'useActions').mockReturnValue({
      data: { items: [], total: 0, page: 1, page_size: 25 },
      isLoading: false,
      error: null,
    } as any);
    vi.spyOn(actionHooks, 'useApproveAction').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
    vi.spyOn(actionHooks, 'useRejectAction').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderWithProviders(<ActionsPage />);

    await waitFor(() => {
      expect(screen.getByText('No actions found')).toBeInTheDocument();
    });
  });
});
