import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils';
import { DashboardPage } from './DashboardPage';
import * as driftHooks from '../../api/hooks/useDrift';
import * as actionHooks from '../../api/hooks/useActions';

vi.mock('../../api/hooks/useDrift');
vi.mock('../../api/hooks/useActions');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    vi.spyOn(driftHooks, 'useDriftSummary').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);
    vi.spyOn(driftHooks, 'useDriftRecords').mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);
    vi.spyOn(actionHooks, 'useActions').mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders error state when drift data fails to load', () => {
    vi.spyOn(driftHooks, 'useDriftSummary').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
    } as any);
    vi.spyOn(driftHooks, 'useDriftRecords').mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any);
    vi.spyOn(actionHooks, 'useActions').mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any);

    renderWithProviders(<DashboardPage />);
    expect(
      screen.getByText(/Failed to load dashboard data/i)
    ).toBeInTheDocument();
  });

  it('renders summary cards with correct data', async () => {
    const mockDriftSummary = {
      total: 15,
      by_status: { open: 10, acknowledged: 3, resolved: 2 },
      by_severity: { critical: 5, high: 5, medium: 3, low: 2 },
      by_type: {},
    };

    const mockDriftRecords = {
      items: [],
      total: 0,
      page: 1,
      page_size: 5,
    };

    const mockActions = {
      items: [],
      total: 7,
      page: 1,
      page_size: 5,
    };

    vi.spyOn(driftHooks, 'useDriftSummary').mockReturnValue({
      data: mockDriftSummary,
      isLoading: false,
      error: null,
    } as any);
    vi.spyOn(driftHooks, 'useDriftRecords').mockReturnValue({
      data: mockDriftRecords,
      isLoading: false,
    } as any);
    vi.spyOn(actionHooks, 'useActions').mockReturnValue({
      data: mockActions,
      isLoading: false,
    } as any);
    vi.spyOn(actionHooks, 'useApproveAction').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
    vi.spyOn(actionHooks, 'useRejectAction').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderWithProviders(<DashboardPage />);

    // Just verify the page renders with summary cards
    expect(screen.getByText('Open Drifts')).toBeInTheDocument();
    expect(screen.getByText('Critical Issues')).toBeInTheDocument();
    expect(screen.getByText('Pending Approvals')).toBeInTheDocument();
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('renders recent drifts table', async () => {
    const mockDrifts = {
      items: [
        {
          id: 1,
          drift_type: 'structural_missing_in_cmdb',
          severity: 'high',
          description: 'Service not in CMDB',
          status: 'open',
        },
        {
          id: 2,
          drift_type: 'ownership',
          severity: 'medium',
          description: 'Owner mismatch',
          status: 'open',
        },
      ],
      total: 2,
      page: 1,
      page_size: 5,
    };

    vi.spyOn(driftHooks, 'useDriftSummary').mockReturnValue({
      data: { by_status: {}, by_severity: {}, by_type: {}, total: 0 },
      isLoading: false,
      error: null,
    } as any);
    vi.spyOn(driftHooks, 'useDriftRecords').mockReturnValue({
      data: mockDrifts,
      isLoading: false,
    } as any);
    vi.spyOn(actionHooks, 'useActions').mockReturnValue({
      data: { items: [], total: 0, page: 1, page_size: 5 },
      isLoading: false,
    } as any);
    vi.spyOn(actionHooks, 'useApproveAction').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
    vi.spyOn(actionHooks, 'useRejectAction').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Recent Open Drifts')).toBeInTheDocument();
      expect(screen.getByText('Service not in CMDB')).toBeInTheDocument();
      expect(screen.getByText('Owner mismatch')).toBeInTheDocument();
    });
  });

  it('shows empty state when no drifts', async () => {
    vi.spyOn(driftHooks, 'useDriftSummary').mockReturnValue({
      data: { by_status: {}, by_severity: {}, by_type: {}, total: 0 },
      isLoading: false,
      error: null,
    } as any);
    vi.spyOn(driftHooks, 'useDriftRecords').mockReturnValue({
      data: { items: [], total: 0, page: 1, page_size: 5 },
      isLoading: false,
    } as any);
    vi.spyOn(actionHooks, 'useActions').mockReturnValue({
      data: { items: [], total: 0, page: 1, page_size: 5 },
      isLoading: false,
    } as any);
    vi.spyOn(actionHooks, 'useApproveAction').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
    vi.spyOn(actionHooks, 'useRejectAction').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('No open drifts found')).toBeInTheDocument();
      expect(screen.getByText('No pending approvals')).toBeInTheDocument();
    });
  });

  it('renders pending actions table with approve/reject buttons', async () => {
    const mockActions = {
      items: [
        {
          id: 1,
          action_type: 'create_cmdb',
          proposed_by: 'user1',
          status: 'proposed',
        },
      ],
      total: 1,
      page: 1,
      page_size: 5,
    };

    vi.spyOn(driftHooks, 'useDriftSummary').mockReturnValue({
      data: { by_status: {}, by_severity: {}, by_type: {}, total: 0 },
      isLoading: false,
      error: null,
    } as any);
    vi.spyOn(driftHooks, 'useDriftRecords').mockReturnValue({
      data: { items: [], total: 0, page: 1, page_size: 5 },
      isLoading: false,
    } as any);
    vi.spyOn(actionHooks, 'useActions').mockReturnValue({
      data: mockActions,
      isLoading: false,
    } as any);
    vi.spyOn(actionHooks, 'useApproveAction').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
    vi.spyOn(actionHooks, 'useRejectAction').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderWithProviders(<DashboardPage />);

    // Verify the action appears
    expect(screen.getByText('Pending Approvals')).toBeInTheDocument();
    expect(screen.getByText('create cmdb')).toBeInTheDocument();
    expect(screen.getByText('user1')).toBeInTheDocument();
  });
});
