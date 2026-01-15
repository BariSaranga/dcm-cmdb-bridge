import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryCard } from '../SummaryCard';

describe('SummaryCard', () => {
  it('renders title and value', () => {
    render(<SummaryCard title="Test Title" value={42} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders string value', () => {
    render(<SummaryCard title="Title" value="String Value" />);
    expect(screen.getByText('String Value')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<SummaryCard title="Title" value={10} subtitle="Additional info" />);
    expect(screen.getByText('Additional info')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    render(<SummaryCard title="Title" value={10} />);
    expect(screen.queryByText('Additional info')).not.toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <SummaryCard
        title="Title"
        value={10}
        icon={<span data-testid="test-icon">Icon</span>}
      />
    );
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('does not render icon container when not provided', () => {
    render(<SummaryCard title="Title" value={10} />);
    expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
  });

  it('renders with zero value', () => {
    render(<SummaryCard title="Title" value={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
