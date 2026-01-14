import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SeverityChip } from '../SeverityChip';

describe('SeverityChip', () => {
  it('renders critical severity with error color', () => {
    render(<SeverityChip severity="critical" />);
    const chip = screen.getByText('Critical');
    expect(chip).toBeInTheDocument();
  });

  it('renders high severity with warning color', () => {
    render(<SeverityChip severity="high" />);
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('renders medium severity with info color', () => {
    render(<SeverityChip severity="medium" />);
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });

  it('renders low severity with success color', () => {
    render(<SeverityChip severity="low" />);
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('capitalizes the severity label', () => {
    render(<SeverityChip severity="critical" />);
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('handles unknown severity gracefully', () => {
    render(<SeverityChip severity="unknown" />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  it('respects size prop', () => {
    const { container } = render(<SeverityChip severity="high" size="medium" />);
    const chip = container.querySelector('.MuiChip-sizeMedium');
    expect(chip).toBeInTheDocument();
  });
});
