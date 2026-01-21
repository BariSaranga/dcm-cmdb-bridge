import { memo } from 'react';
import { Paper, Box, Typography, alpha } from '@mui/material';
import type { ReactNode } from 'react';
import { colors } from '../../theme/theme';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  subtitle?: string;
  color?: string;
}

export const SummaryCard = memo(function SummaryCard({
  title,
  value,
  icon,
  subtitle,
  color
}: SummaryCardProps) {
  const accentColor = color || colors.primary.main;

  return (
    <Paper
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(135deg, ${alpha(colors.background.paper, 0.9)} 0%, ${alpha(colors.background.elevated, 0.8)} 100%)`,
        backdropFilter: 'blur(10px)',
        border: `1px solid ${colors.divider}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, ${accentColor}, ${alpha(accentColor, 0.3)})`,
          opacity: 0,
          transition: 'opacity 0.3s ease',
        },
        '&:hover': {
          transform: 'translateY(-4px)',
          border: `1px solid ${alpha(accentColor, 0.3)}`,
          boxShadow: `0 8px 30px ${alpha(accentColor, 0.15)}, 0 0 40px ${alpha(accentColor, 0.1)}`,
          '&::before': {
            opacity: 1,
          },
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography
            variant="body2"
            sx={{
              color: colors.text.secondary,
              fontSize: '0.75rem',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              mb: 1,
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: color || colors.text.primary,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {value}
          </Typography>
          {subtitle && (
            <Typography
              variant="body2"
              sx={{
                color: colors.text.secondary,
                mt: 1.5,
                fontSize: '0.8rem',
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        {icon && (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${alpha(accentColor, 0.15)} 0%, ${alpha(accentColor, 0.05)} 100%)`,
              color: accentColor,
              border: `1px solid ${alpha(accentColor, 0.2)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        )}
      </Box>
    </Paper>
  );
});
