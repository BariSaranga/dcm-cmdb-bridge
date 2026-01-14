import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface PageContainerProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function PageContainer({ title, children, actions }: PageContainerProps) {
  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
        {actions && <Box>{actions}</Box>}
      </Box>
      {children}
    </Box>
  );
}
