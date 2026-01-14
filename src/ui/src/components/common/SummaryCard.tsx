import { Paper, Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: string;
  color?: string;
}

export function SummaryCard({ title, value, icon, subtitle, color }: SummaryCardProps) {
  return (
    <Paper
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {title}
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, color: color || 'text.primary' }}
          >
            {value}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {icon && (
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              backgroundColor: color ? `${color}15` : 'action.hover',
              color: color || 'text.secondary',
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
    </Paper>
  );
}
