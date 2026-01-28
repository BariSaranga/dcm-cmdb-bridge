import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme/theme';
import { AppShell } from './components/layout';
import { ToastProvider } from './contexts';

import { DashboardPage } from './features/dashboard/DashboardPage';
import GraphPage from './features/graph/GraphPage';
import { ArchitecturePage } from './features/architecture';
import { DriftsPage } from './features/drifts/DriftsPage';
import { ActionsPage } from './features/actions/ActionsPage';
import { AuditPage } from './features/audit/AuditPage';
import { LieDetectorPage } from './features/lie-detector';
import { AIChatPage } from './features/ai-chat';
import { PricingPage } from './features/pricing/PricingPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastProvider>
          <BrowserRouter>
            <AppShell>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/ai-assistant" element={<AIChatPage />} />
                <Route path="/lie-detector" element={<LieDetectorPage />} />
                <Route path="/graph" element={<GraphPage />} />
                <Route path="/architecture" element={<ArchitecturePage />} />
                <Route path="/drifts" element={<DriftsPage />} />
                <Route path="/actions" element={<ActionsPage />} />
                <Route path="/audit" element={<AuditPage />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AppShell>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
