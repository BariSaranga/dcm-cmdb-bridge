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
  IconButton,
  Skeleton,
  Alert,
  Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import { PageContainer } from '../../components/layout';
import { StatusChip } from '../../components/common';
import { useActions, useApproveAction, useRejectAction } from '../../api/hooks/useActions';
import { ActionDetailsDrawer } from './ActionDetailsDrawer';

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

export function ActionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [actionType, setActionType] = useState('');
  const [status, setStatus] = useState('');
  const [selectedActionId, setSelectedActionId] = useState<number | null>(null);

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

  const handleQuickApprove = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await approveAction.mutateAsync({ id, reviewed_by: 'admin' });
  };

  const handleQuickReject = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await rejectAction.mutateAsync({ id, reviewed_by: 'admin' });
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
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
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

          <FormControl size="small" sx={{ minWidth: 150 }}>
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
            >
              Clear Filters
            </Button>
          )}
        </Box>
      </Paper>

      {/* Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
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
                  <TableCell colSpan={7}>
                    <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                      No actions found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((action) => (
                  <TableRow key={action.id} hover>
                    <TableCell>#{action.id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
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
                        }}
                      >
                        {action.description}
                      </Typography>
                    </TableCell>
                    <TableCell>{action.proposed_by}</TableCell>
                    <TableCell>{formatDate(action.proposed_at)}</TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        {action.status === 'proposed' && (
                          <>
                            <Button
                              size="small"
                              color="success"
                              variant="outlined"
                              onClick={(e) => handleQuickApprove(action.id, e)}
                              disabled={approveAction.isPending}
                              sx={{ minWidth: 'auto', px: 1 }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              onClick={(e) => handleQuickReject(action.id, e)}
                              disabled={rejectAction.isPending}
                              sx={{ minWidth: 'auto', px: 1 }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(action.id)}
                          title="View Details"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
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
        />
      </Paper>

      <ActionDetailsDrawer actionId={selectedActionId} onClose={handleCloseDrawer} />
    </PageContainer>
  );
}
