import { Chip, type ChipProps } from '@mui/material';

type Severity = 'critical' | 'high' | 'medium' | 'low';

const severityColors: Record<Severity, ChipProps['color']> = {
  critical: 'error',
  high: 'warning',
  medium: 'info',
  low: 'success',
};

interface SeverityChipProps {
  severity: string;
  size?: 'small' | 'medium';
}

export function SeverityChip({ severity, size = 'small' }: SeverityChipProps) {
  const color = severityColors[severity as Severity] || 'default';
  const label = severity.charAt(0).toUpperCase() + severity.slice(1);

  return <Chip label={label} color={color} size={size} variant="filled" />;
}
