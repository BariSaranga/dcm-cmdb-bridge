import { memo } from 'react';
import { Chip, alpha, keyframes } from '@mui/material';
import { colors } from '../../theme/theme';

type Severity = 'critical' | 'high' | 'medium' | 'low';

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  50% { box-shadow: 0 0 0 4px rgba(239, 68, 68, 0); }
`;

const severityStyles: Record<Severity, { color: string; bg: string }> = {
  critical: { color: colors.error.main, bg: colors.error.main },
  high: { color: colors.warning.main, bg: colors.warning.main },
  medium: { color: colors.info.main, bg: colors.info.main },
  low: { color: colors.success.main, bg: colors.success.main },
};

interface SeverityChipProps {
  severity: string;
  size?: 'small' | 'medium';
}

export const SeverityChip = memo(function SeverityChip({
  severity,
  size = 'small'
}: SeverityChipProps) {
  const style = severityStyles[severity as Severity] || { color: colors.text.secondary, bg: colors.text.secondary };
  const label = severity.charAt(0).toUpperCase() + severity.slice(1);
  const isCritical = severity === 'critical';

  return (
    <Chip
      label={label}
      size={size}
      sx={{
        backgroundColor: alpha(style.bg, 0.15),
        color: style.color,
        border: `1px solid ${alpha(style.color, 0.3)}`,
        fontWeight: 600,
        fontSize: size === 'small' ? '0.7rem' : '0.8rem',
        letterSpacing: '0.02em',
        ...(isCritical && {
          animation: `${pulse} 2s ease-in-out infinite`,
          boxShadow: `0 0 10px ${alpha(colors.error.main, 0.3)}`,
        }),
        '&:hover': {
          backgroundColor: alpha(style.bg, 0.25),
        },
      }}
    />
  );
});
