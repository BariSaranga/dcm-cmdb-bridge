import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SeverityChip } from './SeverityChip';

describe('SeverityChip', () => {
  it('renders critical severity correctly', () => {
    render(<SeverityChip severity="critical" />);
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('renders high severity correctly', () => {
    render(<SeverityChip severity="high" />);
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('renders medium severity correctly', () => {
    render(<SeverityChip severity="medium" />);
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('renders low severity correctly', () => {
    render(<SeverityChip severity="low" />);
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('capitalizes severity label', () => {
    render(<SeverityChip severity="critical" />);
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.queryByText('critical')).not.toBeInTheDocument();
  });

  it('handles unknown severity', () => {
    render(<SeverityChip severity="unknown" />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('respects size prop', () => {
    const { container, rerender } = render(<SeverityChip severity="high" size="small" />);
    expect(container.querySelector('.MuiChip-sizeSmall')).toBeInTheDocument();

    rerender(<SeverityChip severity="high" size="medium" />);
    expect(container.querySelector('.MuiChip-sizeMedium')).toBeInTheDocument();
  });

  it('renders as filled variant', () => {
    const { container } = render(<SeverityChip severity="high" />);
    expect(container.querySelector('.MuiChip-filled')).toBeInTheDocument();
  });
});
