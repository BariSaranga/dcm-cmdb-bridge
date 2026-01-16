import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Alert,
  AlertTitle,
  Button,
  CircularProgress,
  Chip,
  Grid,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useDemoExplanation, useSeedDemo } from '../../api/hooks';
import { RuntimeColumn } from './RuntimeColumn';
import { CMDBColumn } from './CMDBColumn';
import { BureaucracyColumn } from './BureaucracyColumn';
import { AIExplanationPanel } from './AIExplanationPanel';
import { useToast } from '../../contexts';

export function LieDetectorPage() {
  const { data: explanation, isLoading, error, refetch } = useDemoExplanation();
  const seedDemo = useSeedDemo();
  const [seeding, setSeeding] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      await seedDemo.mutateAsync();
      await refetch();
      showSuccess('Demo scenario loaded successfully');
    } catch {
      showError('Failed to load demo scenario');
    } finally {
      setSeeding(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      default:
        return 'success';
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !explanation) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert
          severity="info"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleSeedDemo}
              disabled={seeding}
              startIcon={seeding ? <CircularProgress size={16} /> : <RefreshIcon />}
            >
              {seeding ? 'Seeding...' : 'Load Demo'}
            </Button>
          }
        >
          <AlertTitle>Demo Not Loaded</AlertTitle>
          Click "Load Demo" to seed the Infrastructure Lie Detector scenario.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          background: (theme) =>
            explanation.risk_level === 'critical'
              ? `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.error.main} 100%)`
              : explanation.risk_level === 'high'
              ? `linear-gradient(135deg, ${theme.palette.warning.dark} 0%, ${theme.palette.warning.main} 100%)`
              : `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: 'white',
          borderRadius: 2,
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <WarningIcon sx={{ fontSize: 40 }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Infrastructure Lie Detector
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mt: 0.5 }}>
                {explanation.headline}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              label={explanation.risk_level.toUpperCase()}
              color={getRiskColor(explanation.risk_level) as 'error' | 'warning' | 'info' | 'success'}
              sx={{ fontWeight: 'bold', color: 'white' }}
            />
            <Button
              variant="outlined"
              size="small"
              onClick={handleSeedDemo}
              disabled={seeding}
              startIcon={seeding ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
              sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)' }}
            >
              Reset Demo
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Three-Column View */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <RuntimeColumn evidence={explanation.evidence} highlightedNodes={explanation.highlighted_nodes} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <CMDBColumn evidence={explanation.evidence} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <BureaucracyColumn
            evidence={explanation.evidence}
            suggestedActions={explanation.suggested_actions}
          />
        </Grid>
      </Grid>

      {/* AI Explanation Panel */}
      <AIExplanationPanel explanation={explanation} />
    </Container>
  );
}
