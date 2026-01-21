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
  alpha,
} from '@mui/material';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import { PageContainer } from '../../components/layout';
import { useAuditLogs } from '../../api/hooks/useAudit';
import type { AuditLog } from '../../api/types';
import { colors } from '../../theme/theme';

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

function getEventStyles(eventType: string) {
  if (eventType.includes('failed') || eventType.includes('rejected')) {
    return { bg: alpha(colors.error.main, 0.15), color: colors.error.main, border: alpha(colors.error.main, 0.3) };
  }
  if (eventType.includes('created') || eventType.includes('proposed')) {
    return { bg: alpha(colors.info.main, 0.15), color: colors.info.main, border: alpha(colors.info.main, 0.3) };
  }
  if (eventType.includes('completed') || eventType.includes('approved') || eventType.includes('applied') || eventType.includes('resolved')) {
    return { bg: alpha(colors.success.main, 0.15), color: colors.success.main, border: alpha(colors.success.main, 0.3) };
  }
  if (eventType.includes('detected') || eventType.includes('acknowledged')) {
    return { bg: alpha(colors.warning.main, 0.15), color: colors.warning.main, border: alpha(colors.warning.main, 0.3) };
  }
  return { bg: alpha(colors.text.secondary, 0.15), color: colors.text.secondary, border: alpha(colors.text.secondary, 0.3) };
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
      <PageContainer title="Audit Log">
        <Alert
          severity="error"
          sx={{
            backgroundColor: alpha(colors.error.main, 0.1),
            border: `1px solid ${alpha(colors.error.main, 0.2)}`,
            '& .MuiAlert-icon': { color: colors.error.main },
          }}
        >
          Failed to load audit logs. Make sure the backend is running.
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Audit Log">
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

          <FormControl size="small" sx={{ minWidth: 150, ...selectStyles }}>
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
                  <TableCell colSpan={6} sx={{ border: 0 }}>
                    <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                      No audit logs found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((log) => {
                  const eventStyles = getEventStyles(log.event_type);
                  return (
                    <TableRow
                      key={log.id}
                      sx={{
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
                          #{log.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={formatEventType(log.event_type)}
                          size="small"
                          sx={{
                            backgroundColor: eventStyles.bg,
                            color: eventStyles.color,
                            border: `1px solid ${eventStyles.border}`,
                            fontWeight: 600,
                            fontSize: '0.7rem',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: colors.text.primary }}>
                          {log.entity_type} #{log.entity_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                          {log.actor}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                          {formatDate(log.created_at)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => setSelectedLog(log)}
                          title="View Details"
                          sx={{
                            color: colors.primary.light,
                            '&:hover': {
                              backgroundColor: alpha(colors.primary.main, 0.1),
                            },
                          }}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
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

      {/* Details Drawer */}
      <Drawer
        anchor="right"
        open={selectedLog !== null}
        onClose={() => setSelectedLog(null)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 450 },
            background: `linear-gradient(180deg, ${colors.background.elevated} 0%, ${colors.background.paper} 100%)`,
            borderLeft: `1px solid ${colors.divider}`,
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            p: 3,
            borderBottom: `1px solid ${colors.divider}`,
            background: alpha(colors.background.default, 0.5),
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: colors.text.primary }}
            >
              Audit Log Details
            </Typography>
            <IconButton
              onClick={() => setSelectedLog(null)}
              size="small"
              sx={{
                color: colors.text.secondary,
                '&:hover': {
                  backgroundColor: alpha(colors.text.primary, 0.08),
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {selectedLog && (
          <Box sx={{ p: 3 }}>
            {/* ID and Event */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                sx={{ color: colors.text.secondary, mb: 1.5 }}
              >
                ID: #{selectedLog.id}
              </Typography>
              <Chip
                label={formatEventType(selectedLog.event_type)}
                size="small"
                sx={{
                  backgroundColor: getEventStyles(selectedLog.event_type).bg,
                  color: getEventStyles(selectedLog.event_type).color,
                  border: `1px solid ${getEventStyles(selectedLog.event_type).border}`,
                  fontWeight: 600,
                }}
              />
            </Box>

            {/* Entity */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="caption"
                sx={{
                  color: colors.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 500,
                }}
              >
                Entity
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: colors.text.primary, mt: 0.5 }}
              >
                {selectedLog.entity_type} #{selectedLog.entity_id}
              </Typography>
            </Box>

            {/* Actor */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="caption"
                sx={{
                  color: colors.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 500,
                }}
              >
                Actor
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: colors.text.primary, mt: 0.5 }}
              >
                {selectedLog.actor}
              </Typography>
            </Box>

            {/* Timestamp */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="caption"
                sx={{
                  color: colors.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 500,
                }}
              >
                Timestamp
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: colors.text.primary, mt: 0.5 }}
              >
                {formatDate(selectedLog.created_at)}
              </Typography>
            </Box>

            {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: colors.text.secondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 500,
                  }}
                >
                  Details
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    mt: 1,
                    p: 2,
                    backgroundColor: alpha(colors.background.default, 0.5),
                    border: `1px solid ${colors.divider}`,
                    maxHeight: 300,
                    overflow: 'auto',
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    component="pre"
                    variant="body2"
                    sx={{
                      fontFamily: '"Fira Code", "Monaco", monospace',
                      fontSize: '0.75rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      m: 0,
                      color: colors.text.secondary,
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
