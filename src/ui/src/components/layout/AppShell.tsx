import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import { Sidebar, DRAWER_WIDTH } from './Sidebar';
import { colors } from '../../theme/theme';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: colors.background.default,
          marginLeft: 0,
          width: `calc(100% - ${DRAWER_WIDTH}px)`,
          minHeight: '100vh',
          // Subtle gradient overlay for depth
          backgroundImage: `radial-gradient(ellipse at top right, rgba(99, 102, 241, 0.03) 0%, transparent 50%)`,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
