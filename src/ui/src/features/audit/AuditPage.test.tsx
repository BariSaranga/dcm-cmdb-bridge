import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils';
import { AuditPage } from './AuditPage';
import * as auditHooks from '../../api/hooks/useAudit';

vi.mock('../../api/hooks/useAudit');

describe('AuditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders error state', () => {
    vi.spyOn(auditHooks, 'useAuditLogs').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
    } as any);

    renderWithProviders(<AuditPage />);
    expect(screen.getByText(/Failed to load audit logs/i)).toBeInTheDocument();
  });

  it('renders audit logs table', async () => {
    const mockData = {
      items: [
        {
          id: 1,
          event_type: 'action_proposed',
          entity_type: 'Action',
          entity_id: 10,
          actor: 'admin',
          created_at: '2026-01-01T00:00:00Z',
          details: {},
        },
      ],
      total: 1,
      page: 1,
      page_size: 25,
    };

    vi.spyOn(auditHooks, 'useAuditLogs').mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<AuditPage />);

    await waitFor(() => {
      expect(screen.getByText('action proposed')).toBeInTheDocument();
      expect(screen.getByText('Action #10')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();
    });
  });

  it('shows empty state when no logs', async () => {
    vi.spyOn(auditHooks, 'useAuditLogs').mockReturnValue({
      data: { items: [], total: 0, page: 1, page_size: 25 },
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<AuditPage />);

    await waitFor(() => {
      expect(screen.getByText('No audit logs found')).toBeInTheDocument();
    });
  });

  it('has filter controls', () => {
    vi.spyOn(auditHooks, 'useAuditLogs').mockReturnValue({
      data: { items: [], total: 0, page: 1, page_size: 25 },
      isLoading: false,
      error: null,
    } as any);

    renderWithProviders(<AuditPage />);

    // Verify filter labels exist (comboboxes may not have accessible names in MUI)
    expect(screen.getByText('Event Type')).toBeInTheDocument();
    expect(screen.getByText('Entity Type')).toBeInTheDocument();
  });

  it('opens details drawer when view button clicked', async () => {
    const mockData = {
      items: [
        {
          id: 1,
          event_type: 'action_proposed',
          entity_type: 'Action',
          entity_id: 10,
          actor: 'admin',
          created_at: '2026-01-01T00:00:00Z',
          details: { key: 'value' },
        },
      ],
      total: 1,
      page: 1,
      page_size: 25,
    };

    vi.spyOn(auditHooks, 'useAuditLogs').mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    } as any);

    const user = userEvent.setup();
    renderWithProviders(<AuditPage />);

    await waitFor(() => {
      expect(screen.getByTitle('View Details')).toBeInTheDocument();
    });

    const viewButton = screen.getByTitle('View Details');
    await user.click(viewButton);

    expect(screen.getByText('Audit Log Details')).toBeInTheDocument();
  });
});
