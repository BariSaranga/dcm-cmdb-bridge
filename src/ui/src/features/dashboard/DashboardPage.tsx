import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Button,
  Skeleton,
  Alert,
  alpha,
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { PageContainer } from '../../components/layout';
import { SummaryCard, SeverityChip } from '../../components/common';
import { useDriftSummary, useDriftRecords } from '../../api/hooks/useDrift';
import { useActions, useApproveAction, useRejectAction } from '../../api/hooks/useActions';
import { colors } from '../../theme/theme';

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: driftSummary, isLoading: driftLoading, error: driftError } = useDriftSummary();
  const { data: recentDrifts, isLoading: driftsLoading } = useDriftRecords({
    page: 1,
    page_size: 5,
    status: 'open',
  });
  const { data: pendingActions, isLoading: actionsLoading } = useActions({
    page: 1,
    page_size: 5,
    status: 'proposed',
  });
  const approveAction = useApproveAction();
  const rejectAction = useRejectAction();

  const handleApprove = async (id: number) => {
    await approveAction.mutateAsync({ id, reviewed_by: 'admin' });
  };

  const handleReject = async (id: number) => {
    await rejectAction.mutateAsync({ id, reviewed_by: 'admin' });
  };

  const openDrifts = driftSummary?.by_status?.open ?? 0;
  const criticalDrifts = driftSummary?.by_severity?.critical ?? 0;
  const resolvedDrifts = driftSummary?.by_status?.resolved ?? 0;
  const pendingCount = pendingActions?.total ?? 0;

  if (driftError) {
    return (
      <PageContainer title="Dashboard">
        <Alert severity="error">
          Failed to load dashboard data. Make sure the backend is running.
        </Alert>
      </PageContainer>
    );
  }

  const tableStyles = {
    background: `linear-gradient(135deg, ${alpha(colors.background.paper, 0.9)} 0%, ${alpha(colors.background.elevated, 0.8)} 100%)`,
    border: `1px solid ${colors.divider}`,
    backdropFilter: 'blur(10px)',
  };

  const tableHeaderStyles = {
    backgroundColor: alpha(colors.background.default, 0.5),
    '& .MuiTableCell-head': {
      color: colors.text.secondary,
      fontWeight: 600,
      fontSize: '0.75rem',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      borderBottom: `1px solid ${colors.divider}`,
    },
  };

  const tableRowStyles = {
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: alpha(colors.primary.main, 0.08),
    },
    '& .MuiTableCell-body': {
      borderBottom: `1px solid ${colors.divider}`,
    },
  };

  return (
    <PageContainer title="Dashboard">
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          {driftLoading ? (
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          ) : (
            <SummaryCard
              title="Open Drifts"
              value={openDrifts}
              icon={<WarningIcon />}
              color={colors.warning.main}
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          {driftLoading ? (
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          ) : (
            <SummaryCard
              title="Critical Issues"
              value={criticalDrifts}
              icon={<ErrorIcon />}
              color={colors.error.main}
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          {actionsLoading ? (
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          ) : (
            <SummaryCard
              title="Pending Approvals"
              value={pendingCount}
              icon={<PlaylistAddCheckIcon />}
              color={colors.info.main}
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          {driftLoading ? (
            <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
          ) : (
            <SummaryCard
              title="Resolved"
              value={resolvedDrifts}
              icon={<CheckCircleIcon />}
              color={colors.success.main}
            />
          )}
        </Grid>

        {/* Recent Open Drifts */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2.5, ...tableStyles }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text.primary }}>
                Recent Open Drifts
              </Typography>
              <Button
                size="small"
                onClick={() => navigate('/drifts')}
                sx={{
                  color: colors.primary.light,
                  '&:hover': {
                    backgroundColor: alpha(colors.primary.main, 0.1),
                  },
                }}
              >
                View All
              </Button>
            </Box>
            {driftsLoading ? (
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
            ) : recentDrifts?.items.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                No open drifts found
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead sx={tableHeaderStyles}>
                    <TableRow>
                      <TableCell>Type</TableCell>
                      <TableCell>Severity</TableCell>
                      <TableCell>Description</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentDrifts?.items.map((drift) => (
                      <TableRow
                        key={drift.id}
                        sx={{ ...tableRowStyles, cursor: 'pointer' }}
                        onClick={() => navigate(`/drifts?selected=${drift.id}`)}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', color: colors.text.primary }}>
                            {drift.drift_type.replace(/_/g, ' ')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <SeverityChip severity={drift.severity} />
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              color: colors.text.secondary,
                            }}
                          >
                            {drift.description}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Pending Actions */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2.5, ...tableStyles }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text.primary }}>
                Pending Approvals
              </Typography>
              <Button
                size="small"
                onClick={() => navigate('/actions')}
                sx={{
                  color: colors.primary.light,
                  '&:hover': {
                    backgroundColor: alpha(colors.primary.main, 0.1),
                  },
                }}
              >
                View All
              </Button>
            </Box>
            {actionsLoading ? (
              <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
            ) : pendingActions?.items.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                No pending approvals
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead sx={tableHeaderStyles}>
                    <TableRow>
                      <TableCell>Action</TableCell>
                      <TableCell>Proposed By</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingActions?.items.map((action) => (
                      <TableRow key={action.id} sx={tableRowStyles}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.8rem', color: colors.text.primary }}>
                            {action.action_type.replace(/_/g, ' ')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                            {action.proposed_by}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleApprove(action.id)}
                              disabled={approveAction.isPending}
                              sx={{
                                color: colors.success.main,
                                borderColor: alpha(colors.success.main, 0.5),
                                '&:hover': {
                                  borderColor: colors.success.main,
                                  backgroundColor: alpha(colors.success.main, 0.1),
                                },
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleReject(action.id)}
                              disabled={rejectAction.isPending}
                              sx={{
                                color: colors.error.main,
                                borderColor: alpha(colors.error.main, 0.5),
                                '&:hover': {
                                  borderColor: colors.error.main,
                                  backgroundColor: alpha(colors.error.main, 0.1),
                                },
                              }}
                            >
                              Reject
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </PageContainer>
  );
}
