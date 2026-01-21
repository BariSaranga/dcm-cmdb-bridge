import { memo } from 'react';
import { Chip, alpha } from '@mui/material';
import { colors } from '../../theme/theme';

type Status = 'open' | 'acknowledged' | 'resolved' | 'proposed' | 'approved' | 'rejected' | 'applied' | 'failed' | 'pending' | 'completed' | 'active' | 'decommissioned' | 'planned';

const statusStyles: Record<Status, { color: string; bg: string }> = {
  // Drift statuses
  open: { color: colors.warning.main, bg: colors.warning.main },
  acknowledged: { color: colors.info.main, bg: colors.info.main },
  resolved: { color: colors.success.main, bg: colors.success.main },
  // Action statuses
  proposed: { color: colors.info.main, bg: colors.info.main },
  approved: { color: colors.success.main, bg: colors.success.main },
  rejected: { color: colors.error.main, bg: colors.error.main },
  applied: { color: colors.success.main, bg: colors.success.main },
  failed: { color: colors.error.main, bg: colors.error.main },
  // Snapshot statuses
  pending: { color: colors.text.secondary, bg: colors.text.secondary },
  completed: { color: colors.success.main, bg: colors.success.main },
  // CMDB statuses
  active: { color: colors.success.main, bg: colors.success.main },
  decommissioned: { color: colors.text.secondary, bg: colors.text.secondary },
  planned: { color: colors.info.main, bg: colors.info.main },
};

interface StatusChipProps {
  status: string;
  size?: 'small' | 'medium';
}

export const StatusChip = memo(function StatusChip({
  status,
  size = 'small'
}: StatusChipProps) {
  const style = statusStyles[status as Status] || { color: colors.text.secondary, bg: colors.text.secondary };
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

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
        '&:hover': {
          backgroundColor: alpha(style.bg, 0.25),
        },
      }}
    />
  );
});
