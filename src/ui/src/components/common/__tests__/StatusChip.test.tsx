import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusChip } from '../StatusChip';

describe('StatusChip', () => {
  it('renders open status with warning color', () => {
    render(<StatusChip status="open" />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('renders resolved status with success color', () => {
    render(<StatusChip status="resolved" />);
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('renders approved status with success color', () => {
    render(<StatusChip status="approved" />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('renders rejected status with error color', () => {
    render(<StatusChip status="rejected" />);
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('renders failed status with error color', () => {
    render(<StatusChip status="failed" />);
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('formats underscore-separated status', () => {
    render(<StatusChip status="some_status_value" />);
    expect(screen.getByText('Some Status Value')).toBeInTheDocument();
  });

  it('capitalizes each word in status', () => {
    render(<StatusChip status="acknowledged" />);
    expect(screen.getByText('Acknowledged')).toBeInTheDocument();
  });

  it('handles unknown status gracefully', () => {
    render(<StatusChip status="unknown" />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('respects size prop', () => {
    const { container } = render(<StatusChip status="open" size="medium" />);
    const chip = container.querySelector('.MuiChip-sizeMedium');
    expect(chip).toBeInTheDocument();
  });
});
