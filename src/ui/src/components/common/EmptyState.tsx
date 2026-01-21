import { memo } from 'react';
import { Box, Typography, Button, alpha } from '@mui/material';
import type { ReactNode } from 'react';
import InboxIcon from '@mui/icons-material/Inbox';
import { colors } from '../../theme/theme';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = memo(function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 3,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${alpha(colors.primary.main, 0.1)} 0%, ${alpha(colors.primary.main, 0.05)} 100%)`,
          border: `1px solid ${alpha(colors.primary.main, 0.2)}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
          color: colors.text.secondary,
        }}
      >
        {icon || <InboxIcon sx={{ fontSize: 40 }} />}
      </Box>
      <Typography
        variant="h6"
        sx={{
          color: colors.text.primary,
          fontWeight: 600,
          mb: 1,
        }}
      >
        {title}
      </Typography>
      {description && (
        <Typography
          variant="body2"
          sx={{
            color: colors.text.secondary,
            maxWidth: 400,
            mb: action ? 3 : 0,
            lineHeight: 1.6,
          }}
        >
          {description}
        </Typography>
      )}
      {action && (
        <Button
          variant="contained"
          onClick={action.onClick}
          sx={{
            mt: 1,
          }}
        >
          {action.label}
        </Button>
      )}
    </Box>
  );
});
