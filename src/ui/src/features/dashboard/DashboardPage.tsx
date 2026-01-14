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
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { PageContainer } from '../../components/layout';
import { SummaryCard, SeverityChip } from '../../components/common';
import { useDriftSummary, useDriftRecords } from '../../api/hooks/useDrift';
import { useActions, useApproveAction, useRejectAction } from '../../api/hooks/useActions';

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

  return (
    <PageContainer title="Dashboard">
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          {driftLoading ? (
            <Skeleton variant="rectangular" height={120} />
          ) : (
            <SummaryCard
              title="Open Drifts"
              value={openDrifts}
              icon={<WarningIcon />}
              color="#ed6c02"
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          {driftLoading ? (
            <Skeleton variant="rectangular" height={120} />
          ) : (
            <SummaryCard
              title="Critical Issues"
              value={criticalDrifts}
              icon={<ErrorIcon />}
              color="#d32f2f"
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          {actionsLoading ? (
            <Skeleton variant="rectangular" height={120} />
          ) : (
            <SummaryCard
              title="Pending Approvals"
              value={pendingCount}
              icon={<PlaylistAddCheckIcon />}
              color="#0288d1"
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          {driftLoading ? (
            <Skeleton variant="rectangular" height={120} />
          ) : (
            <SummaryCard
              title="Resolved"
              value={resolvedDrifts}
              icon={<CheckCircleIcon />}
              color="#2e7d32"
            />
          )}
        </Grid>

        {/* Recent Open Drifts */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Recent Open Drifts</Typography>
              <Button size="small" onClick={() => navigate('/drifts')}>
                View All
              </Button>
            </Box>
            {driftsLoading ? (
              <Skeleton variant="rectangular" height={200} />
            ) : recentDrifts?.items.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                No open drifts found
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
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
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/drifts?selected=${drift.id}`)}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
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
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Pending Approvals</Typography>
              <Button size="small" onClick={() => navigate('/actions')}>
                View All
              </Button>
            </Box>
            {actionsLoading ? (
              <Skeleton variant="rectangular" height={200} />
            ) : pendingActions?.items.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                No pending approvals
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Action</TableCell>
                      <TableCell>Proposed By</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingActions?.items.map((action) => (
                      <TableRow key={action.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                            {action.action_type.replace(/_/g, ' ')}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{action.proposed_by}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button
                              size="small"
                              color="success"
                              variant="outlined"
                              onClick={() => handleApprove(action.id)}
                              disabled={approveAction.isPending}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              onClick={() => handleReject(action.id)}
                              disabled={rejectAction.isPending}
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
