import { memo } from 'react';
import { Chip, type ChipProps } from '@mui/material';

type Status = 'open' | 'acknowledged' | 'resolved' | 'proposed' | 'approved' | 'rejected' | 'applied' | 'failed' | 'pending' | 'completed' | 'active' | 'decommissioned' | 'planned';

const statusColors: Record<Status, ChipProps['color']> = {
  // Drift statuses
  open: 'warning',
  acknowledged: 'info',
  resolved: 'success',
  // Action statuses
  proposed: 'info',
  approved: 'success',
  rejected: 'error',
  applied: 'success',
  failed: 'error',
  // Snapshot statuses
  pending: 'default',
  completed: 'success',
  // CMDB statuses
  active: 'success',
  decommissioned: 'default',
  planned: 'info',
};

interface StatusChipProps {
  status: string;
  size?: 'small' | 'medium';
}

export const StatusChip = memo(function StatusChip({
  status,
  size = 'small'
}: StatusChipProps) {
  const color = statusColors[status as Status] || 'default';
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return <Chip label={label} color={color} size={size} />;
});
