import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryCard } from './SummaryCard';
import WarningIcon from '@mui/icons-material/Warning';

describe('SummaryCard', () => {
  it('renders title and value', () => {
    render(<SummaryCard title="Open Drifts" value={42} />);
    expect(screen.getByText('Open Drifts')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders string values', () => {
    render(<SummaryCard title="Status" value="Active" />);
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders numeric values', () => {
    render(<SummaryCard title="Count" value={100} />);
    expect(screen.getByText('Count')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(
      <SummaryCard
        title="Open Drifts"
        value={42}
        subtitle="Last 7 days"
      />
    );
    expect(screen.getByText('Last 7 days')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(<SummaryCard title="Open Drifts" value={42} />);
    expect(screen.queryByText('Last 7 days')).not.toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    const { container } = render(
      <SummaryCard
        title="Open Drifts"
        value={42}
        icon={<WarningIcon data-testid="warning-icon" />}
      />
    );
    expect(container.querySelector('[data-testid="warning-icon"]')).toBeInTheDocument();
  });

  it('does not render icon when not provided', () => {
    const { container } = render(<SummaryCard title="Open Drifts" value={42} />);
    expect(container.querySelector('[data-testid="warning-icon"]')).not.toBeInTheDocument();
  });

  it('applies custom color when provided', () => {
    const { container } = render(
      <SummaryCard title="Open Drifts" value={42} color="#ed6c02" />
    );
    const valueElement = screen.getByText('42');
    expect(valueElement).toHaveStyle({ color: '#ed6c02' });
  });
});
