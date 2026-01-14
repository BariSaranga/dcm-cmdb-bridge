import { useState } from 'react';
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
  Chip,
  Drawer,
  IconButton,
  Divider,
} from '@mui/material';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import { PageContainer } from '../../components/layout';
import { useAuditLogs } from '../../api/hooks/useAudit';
import type { AuditLog } from '../../api/types';

const EVENT_TYPES = [
  { value: '', label: 'All Events' },
  { value: 'snapshot_created', label: 'Snapshot Created' },
  { value: 'snapshot_completed', label: 'Snapshot Completed' },
  { value: 'snapshot_failed', label: 'Snapshot Failed' },
  { value: 'drift_detected', label: 'Drift Detected' },
  { value: 'drift_acknowledged', label: 'Drift Acknowledged' },
  { value: 'drift_resolved', label: 'Drift Resolved' },
  { value: 'action_proposed', label: 'Action Proposed' },
  { value: 'action_approved', label: 'Action Approved' },
  { value: 'action_rejected', label: 'Action Rejected' },
  { value: 'action_applied', label: 'Action Applied' },
  { value: 'action_failed', label: 'Action Failed' },
  { value: 'cmdb_item_created', label: 'CMDB Item Created' },
  { value: 'cmdb_item_updated', label: 'CMDB Item Updated' },
];

const ENTITY_TYPES = [
  { value: '', label: 'All Entities' },
  { value: 'Snapshot', label: 'Snapshot' },
  { value: 'DriftRecord', label: 'Drift Record' },
  { value: 'Action', label: 'Action' },
  { value: 'CMDBItem', label: 'CMDB Item' },
];

function getEventColor(eventType: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  if (eventType.includes('failed') || eventType.includes('rejected')) return 'error';
  if (eventType.includes('created') || eventType.includes('proposed')) return 'info';
  if (eventType.includes('completed') || eventType.includes('approved') || eventType.includes('applied') || eventType.includes('resolved')) return 'success';
  if (eventType.includes('detected') || eventType.includes('acknowledged')) return 'warning';
  return 'default';
}

export function AuditPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [eventType, setEventType] = useState('');
  const [entityType, setEntityType] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data, isLoading, error } = useAuditLogs({
    page: page + 1,
    page_size: rowsPerPage,
    event_type: eventType || undefined,
    entity_type: entityType || undefined,
  });

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const hasFilters = eventType || entityType;

  const clearFilters = () => {
    setEventType('');
    setEntityType('');
    setPage(0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatEventType = (type: string) => {
    return type.replace(/_/g, ' ');
  };

  if (error) {
    return (
      <PageContainer title="Audit Log">
        <Alert severity="error">
          Failed to load audit logs. Make sure the backend is running.
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Audit Log">
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Event Type</InputLabel>
            <Select
              value={eventType}
              label="Event Type"
              onChange={(e) => {
                setEventType(e.target.value);
                setPage(0);
              }}
            >
              {EVENT_TYPES.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Entity Type</InputLabel>
            <Select
              value={entityType}
              label="Entity Type"
              onChange={(e) => {
                setEntityType(e.target.value);
                setPage(0);
              }}
            >
              {ENTITY_TYPES.map((opt) => (
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
                <TableCell>Event</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell>Actor</TableCell>
                <TableCell>Timestamp</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton width={120} /></TableCell>
                    <TableCell><Skeleton width={100} /></TableCell>
                    <TableCell><Skeleton width={80} /></TableCell>
                    <TableCell><Skeleton width={150} /></TableCell>
                    <TableCell><Skeleton width={40} /></TableCell>
                  </TableRow>
                ))
              ) : data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                      No audit logs found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>#{log.id}</TableCell>
                    <TableCell>
                      <Chip
                        label={formatEventType(log.event_type)}
                        color={getEventColor(log.event_type)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {log.entity_type} #{log.entity_id}
                      </Typography>
                    </TableCell>
                    <TableCell>{log.actor}</TableCell>
                    <TableCell>{formatDate(log.created_at)}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => setSelectedLog(log)}
                        title="View Details"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
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

      {/* Details Drawer */}
      <Drawer
        anchor="right"
        open={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        PaperProps={{ sx: { width: 400 } }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Audit Log Details</Typography>
            <IconButton onClick={() => setSelectedLog(null)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
        <Divider />
        {selectedLog && (
          <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                ID: #{selectedLog.id}
              </Typography>
              <Chip
                label={formatEventType(selectedLog.event_type)}
                color={getEventColor(selectedLog.event_type)}
                size="small"
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Entity
              </Typography>
              <Typography variant="body1">
                {selectedLog.entity_type} #{selectedLog.entity_id}
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Actor
              </Typography>
              <Typography variant="body1">{selectedLog.actor}</Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Timestamp
              </Typography>
              <Typography variant="body2">{formatDate(selectedLog.created_at)}</Typography>
            </Box>

            {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Details
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    backgroundColor: 'grey.50',
                    maxHeight: 300,
                    overflow: 'auto',
                  }}
                >
                  <Typography
                    component="pre"
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      m: 0,
                    }}
                  >
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Box>
        )}
      </Drawer>
    </PageContainer>
  );
}
