import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusChip } from './StatusChip';

describe('StatusChip', () => {
  it('renders status with correct label', () => {
    render(<StatusChip status="open" />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('capitalizes multi-word status with underscores', () => {
    render(<StatusChip status="pending_approval" />);
    expect(screen.getByText('Pending Approval')).toBeInTheDocument();
  });

  it('renders drift statuses correctly', () => {
    const { rerender } = render(<StatusChip status="open" />);
    expect(screen.getByText('Open')).toBeInTheDocument();

    rerender(<StatusChip status="acknowledged" />);
    expect(screen.getByText('Acknowledged')).toBeInTheDocument();

    rerender(<StatusChip status="resolved" />);
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('renders action statuses correctly', () => {
    const { rerender } = render(<StatusChip status="proposed" />);
    expect(screen.getByText('Proposed')).toBeInTheDocument();

    rerender(<StatusChip status="approved" />);
    expect(screen.getByText('Approved')).toBeInTheDocument();

    rerender(<StatusChip status="rejected" />);
    expect(screen.getByText('Rejected')).toBeInTheDocument();

    rerender(<StatusChip status="applied" />);
    expect(screen.getByText('Applied')).toBeInTheDocument();

    rerender(<StatusChip status="failed" />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('renders CMDB statuses correctly', () => {
    const { rerender } = render(<StatusChip status="active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();

    rerender(<StatusChip status="decommissioned" />);
    expect(screen.getByText('Decommissioned')).toBeInTheDocument();

    rerender(<StatusChip status="planned" />);
    expect(screen.getByText('Planned')).toBeInTheDocument();
  });

  it('handles unknown status', () => {
    render(<StatusChip status="unknown_status" />);
    expect(screen.getByText('Unknown Status')).toBeInTheDocument();
  });

  it('respects size prop', () => {
    const { container, rerender } = render(<StatusChip status="open" size="small" />);
    expect(container.querySelector('.MuiChip-sizeSmall')).toBeInTheDocument();

    rerender(<StatusChip status="open" size="medium" />);
    expect(container.querySelector('.MuiChip-sizeMedium')).toBeInTheDocument();
  });
});
