import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils';
import { DriftsPage } from './DriftsPage';
import * as driftHooks from '../../api/hooks/useDrift';

vi.mock('../../api/hooks/useDrift');
vi.mock('./DriftDetailsDrawer', () => ({
  DriftDetailsDrawer: () => <div>Drift Details Drawer</div>,
}));

describe('DriftsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders error state', () => {
    vi.spyOn(driftHooks, 'useDriftRecords').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
    } as any);

    renderWithProviders(<DriftsPage />);
    expect(screen.getByText(/Failed to load drift records/i)).toBeInTheDocument();
  });

  it('renders drift records table', async () => {
    const mockData = {
      items: [
        {
          id: 1,
          drift_type: 'structural_missing_in_cmdb',
          severity: 'high',
          status: 'open',
          description: 'Service not in CMDB',
          created_at: '2026-01-01T00:00:00Z',
        },
      ],
      total: 1,
      page: 1,
      page_size: 25,
    };

    vi.spyOn(driftHooks, 'useDriftRecords').mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<DriftsPage />);

    await waitFor(() => {
      expect(screen.getByText('Service not in CMDB')).toBeInTheDocument();
      expect(screen.getByText('#1')).toBeInTheDocument();
    });
  });

  it('shows empty state when no drifts', async () => {
    vi.spyOn(driftHooks, 'useDriftRecords').mockReturnValue({
      data: { items: [], total: 0, page: 1, page_size: 25 },
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<DriftsPage />);

    await waitFor(() => {
      expect(screen.getByText('No drift records found')).toBeInTheDocument();
    });
  });

  it('has drift type filter', () => {
    vi.spyOn(driftHooks, 'useDriftRecords').mockReturnValue({
      data: { items: [], total: 0, page: 1, page_size: 25 },
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<DriftsPage />);

    // Just verify the filter label exists
    expect(screen.getByText('Type')).toBeInTheDocument();
  });

  it('has all filter controls', () => {
    vi.spyOn(driftHooks, 'useDriftRecords').mockReturnValue({
      data: { items: [], total: 0, page: 1, page_size: 25 },
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<DriftsPage />);

    // Verify filter labels exist
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Severity')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });
});
