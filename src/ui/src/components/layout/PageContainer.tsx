import { Box, Typography, alpha } from '@mui/material';
import type { ReactNode } from 'react';
import { colors } from '../../theme/theme';

interface PageContainerProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function PageContainer({ title, children, actions }: PageContainerProps) {
  return (
    <Box sx={{ p: 3, minHeight: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          pb: 2,
          borderBottom: `1px solid ${colors.divider}`,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 700,
            color: colors.text.primary,
            letterSpacing: '-0.02em',
            background: `linear-gradient(135deg, ${colors.text.primary} 0%, ${alpha(colors.primary.light, 0.8)} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {title}
        </Typography>
        {actions && <Box sx={{ display: 'flex', gap: 1 }}>{actions}</Box>}
      </Box>
      {children}
    </Box>
  );
}
