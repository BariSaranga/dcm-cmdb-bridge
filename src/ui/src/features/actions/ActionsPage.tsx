import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Skeleton,
  Alert,
  Typography,
  alpha,
} from '@mui/material';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { PageContainer } from '../../components/layout';
import { StatusChip, EmptyState, ConfirmDialog } from '../../components/common';
import { useActions, useApproveAction, useRejectAction } from '../../api/hooks/useActions';
import { ActionDetailsDrawer } from './ActionDetailsDrawer';
import { useToast } from '../../contexts';
import { colors } from '../../theme/theme';

const ACTION_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'create_cmdb', label: 'Create CMDB' },
  { value: 'update_cmdb', label: 'Update CMDB' },
  { value: 'decommission_cmdb', label: 'Decommission CMDB' },
  { value: 'acknowledge', label: 'Acknowledge' },
];

const ACTION_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'proposed', label: 'Proposed' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'applied', label: 'Applied' },
  { value: 'failed', label: 'Failed' },
];

interface ConfirmState {
  open: boolean;
  type: 'approve' | 'reject' | null;
  actionId: number | null;
}

export function ActionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [actionType, setActionType] = useState('');
  const [status, setStatus] = useState('');
  const [selectedActionId, setSelectedActionId] = useState<number | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    open: false,
    type: null,
    actionId: null,
  });

  const { showSuccess, showError } = useToast();
  const approveAction = useApproveAction();
  const rejectAction = useRejectAction();

  useEffect(() => {
    const selected = searchParams.get('selected');
    if (selected) {
      setSelectedActionId(parseInt(selected, 10));
    }
  }, [searchParams]);

  const { data, isLoading, error } = useActions({
    page: page + 1,
    page_size: rowsPerPage,
    action_type: actionType || undefined,
    status: status || undefined,
  });

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (id: number) => {
    setSelectedActionId(id);
    setSearchParams({ selected: id.toString() });
  };

  const handleCloseDrawer = () => {
    setSelectedActionId(null);
    setSearchParams({});
  };

  const openConfirmDialog = (type: 'approve' | 'reject', actionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmState({ open: true, type, actionId });
  };

  const closeConfirmDialog = () => {
    setConfirmState({ open: false, type: null, actionId: null });
  };

  const handleConfirm = async () => {
    if (!confirmState.actionId || !confirmState.type) return;

    try {
      if (confirmState.type === 'approve') {
        await approveAction.mutateAsync({ id: confirmState.actionId, reviewed_by: 'admin' });
        showSuccess(`Action #${confirmState.actionId} approved successfully`);
      } else {
        await rejectAction.mutateAsync({ id: confirmState.actionId, reviewed_by: 'admin' });
        showSuccess(`Action #${confirmState.actionId} rejected`);
      }
      closeConfirmDialog();
    } catch {
      showError(`Failed to ${confirmState.type} action`);
    }
  };

  const hasFilters = actionType || status;

  const clearFilters = () => {
    setActionType('');
    setStatus('');
    setPage(0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatActionType = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  const selectStyles = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: alpha(colors.background.elevated, 0.5),
      '& fieldset': {
        borderColor: colors.divider,
      },
      '&:hover fieldset': {
        borderColor: alpha(colors.primary.main, 0.5),
      },
      '&.Mui-focused fieldset': {
        borderColor: colors.primary.main,
      },
    },
    '& .MuiInputLabel-root': {
      color: colors.text.secondary,
    },
    '& .MuiSelect-select': {
      color: colors.text.primary,
    },
  };

  if (error) {
    return (
      <PageContainer title="Actions">
        <Alert severity="error">
          Failed to load actions. Make sure the backend is running.
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Actions">
      {/* Filters */}
      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          background: `linear-gradient(135deg, ${alpha(colors.background.paper, 0.9)} 0%, ${alpha(colors.background.elevated, 0.8)} 100%)`,
          border: `1px solid ${colors.divider}`,
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 180, ...selectStyles }}>
            <InputLabel>Action Type</InputLabel>
            <Select
              value={actionType}
              label="Action Type"
              onChange={(e) => {
                setActionType(e.target.value);
                setPage(0);
              }}
            >
              {ACTION_TYPES.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150, ...selectStyles }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              label="Status"
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
            >
              {ACTION_STATUSES.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {hasFilters && (
            <Button
              variant="text"
              size="small"
              startIcon={<FilterListOffIcon />}
              onClick={clearFilters}
              sx={{
                color: colors.text.secondary,
                '&:hover': {
                  color: colors.text.primary,
                  backgroundColor: alpha(colors.primary.main, 0.08),
                },
              }}
            >
              Clear Filters
            </Button>
          )}
        </Box>
      </Paper>

      {/* Table */}
      <Paper
        sx={{
          background: `linear-gradient(135deg, ${alpha(colors.background.paper, 0.9)} 0%, ${alpha(colors.background.elevated, 0.8)} 100%)`,
          border: `1px solid ${colors.divider}`,
          backdropFilter: 'blur(10px)',
          overflow: 'hidden',
        }}
      >
        <TableContainer>
          <Table>
            <TableHead
              sx={{
                backgroundColor: alpha(colors.background.default, 0.5),
                '& .MuiTableCell-head': {
                  color: colors.text.secondary,
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: `1px solid ${colors.divider}`,
                },
              }}
            >
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Proposed By</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton width={80} /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton width={80} /></TableCell>
                    <TableCell><Skeleton width={80} /></TableCell>
                    <TableCell><Skeleton width={100} /></TableCell>
                  </TableRow>
                ))
              ) : data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ border: 0 }}>
                    {hasFilters ? (
                      <EmptyState
                        icon={<SearchOffIcon sx={{ fontSize: 40 }} />}
                        title="No matching actions"
                        description="Try adjusting your filters to find what you're looking for."
                        action={{ label: 'Clear Filters', onClick: clearFilters }}
                      />
                    ) : (
                      <EmptyState
                        icon={<TaskAltIcon sx={{ fontSize: 40, color: colors.success.main }} />}
                        title="No pending actions"
                        description="All caught up! There are no actions requiring your attention."
                      />
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((action) => (
                  <TableRow
                    key={action.id}
                    onClick={() => handleViewDetails(action.id)}
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: alpha(colors.primary.main, 0.08),
                      },
                      '& .MuiTableCell-body': {
                        borderBottom: `1px solid ${colors.divider}`,
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                        #{action.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem', color: colors.text.primary }}>
                        {formatActionType(action.action_type)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={action.status} />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 250,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: colors.text.secondary,
                        }}
                      >
                        {action.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                        {action.proposed_by}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                        {formatDate(action.proposed_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        {action.status === 'proposed' ? (
                          <>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={(e) => openConfirmDialog('approve', action.id, e)}
                              disabled={approveAction.isPending}
                              sx={{
                                minWidth: 'auto',
                                px: 1.5,
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
                              onClick={(e) => openConfirmDialog('reject', action.id, e)}
                              disabled={rejectAction.isPending}
                              sx={{
                                minWidth: 'auto',
                                px: 1.5,
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
                          </>
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{
                              color: colors.primary.light,
                              fontWeight: 500,
                            }}
                          >
                            View →
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={data?.total ?? 0}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50, 100]}
          sx={{
            borderTop: `1px solid ${colors.divider}`,
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              color: colors.text.secondary,
            },
          }}
        />
      </Paper>

      <ActionDetailsDrawer actionId={selectedActionId} onClose={handleCloseDrawer} />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.type === 'approve' ? 'Approve Action?' : 'Reject Action?'}
        message={
          confirmState.type === 'approve'
            ? `Are you sure you want to approve action #${confirmState.actionId}? This will allow the action to be applied.`
            : `Are you sure you want to reject action #${confirmState.actionId}? This cannot be undone.`
        }
        confirmLabel={confirmState.type === 'approve' ? 'Approve' : 'Reject'}
        confirmColor={confirmState.type === 'approve' ? 'success' : 'error'}
        isLoading={approveAction.isPending || rejectAction.isPending}
        onConfirm={handleConfirm}
        onCancel={closeConfirmDialog}
      />
    </PageContainer>
  );
}
