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
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { PageContainer } from '../../components/layout';
import { StatusChip, SeverityChip, EmptyState } from '../../components/common';
import { useDriftRecords } from '../../api/hooks/useDrift';
import { DriftDetailsDrawer } from './DriftDetailsDrawer';
import { colors } from '../../theme/theme';

const DRIFT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'structural_missing_in_cmdb', label: 'Missing in CMDB' },
  { value: 'structural_stale_in_cmdb', label: 'Stale in CMDB' },
  { value: 'ownership', label: 'Ownership Mismatch' },
  { value: 'configuration', label: 'Configuration' },
  { value: 'lifecycle', label: 'Lifecycle' },
];

const SEVERITIES = [
  { value: '', label: 'All Severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'open', label: 'Open' },
  { value: 'acknowledged', label: 'Acknowledged' },
  { value: 'resolved', label: 'Resolved' },
];

export function DriftsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [driftType, setDriftType] = useState('');
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');
  const [selectedDriftId, setSelectedDriftId] = useState<number | null>(null);

  useEffect(() => {
    const selected = searchParams.get('selected');
    if (selected) {
      setSelectedDriftId(parseInt(selected, 10));
    }
  }, [searchParams]);

  const { data, isLoading, error } = useDriftRecords({
    page: page + 1,
    page_size: rowsPerPage,
    drift_type: driftType || undefined,
    severity: severity || undefined,
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
    setSelectedDriftId(id);
    setSearchParams({ selected: id.toString() });
  };

  const handleCloseDrawer = () => {
    setSelectedDriftId(null);
    setSearchParams({});
  };

  const hasFilters = driftType || severity || status;

  const clearFilters = () => {
    setDriftType('');
    setSeverity('');
    setStatus('');
    setPage(0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDriftType = (type: string) => {
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
      <PageContainer title="Drifts">
        <Alert severity="error">
          Failed to load drift records. Make sure the backend is running.
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Drifts">
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
            <InputLabel>Type</InputLabel>
            <Select
              value={driftType}
              label="Type"
              onChange={(e) => {
                setDriftType(e.target.value);
                setPage(0);
              }}
            >
              {DRIFT_TYPES.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150, ...selectStyles }}>
            <InputLabel>Severity</InputLabel>
            <Select
              value={severity}
              label="Severity"
              onChange={(e) => {
                setSeverity(e.target.value);
                setPage(0);
              }}
            >
              {SEVERITIES.map((opt) => (
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
              {STATUSES.map((opt) => (
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
                <TableCell>Severity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Description</TableCell>
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
                    <TableCell><Skeleton width={60} /></TableCell>
                    <TableCell><Skeleton width={80} /></TableCell>
                    <TableCell><Skeleton /></TableCell>
                    <TableCell><Skeleton width={80} /></TableCell>
                    <TableCell><Skeleton width={40} /></TableCell>
                  </TableRow>
                ))
              ) : data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ border: 0 }}>
                    {hasFilters ? (
                      <EmptyState
                        icon={<SearchOffIcon sx={{ fontSize: 40 }} />}
                        title="No matching drift records"
                        description="Try adjusting your filters to find what you're looking for."
                        action={{ label: 'Clear Filters', onClick: clearFilters }}
                      />
                    ) : (
                      <EmptyState
                        icon={<CheckCircleOutlineIcon sx={{ fontSize: 40, color: colors.success.main }} />}
                        title="No drift detected"
                        description="Your infrastructure is in sync with CMDB. Run a new discovery to check for changes."
                      />
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((drift) => (
                  <TableRow
                    key={drift.id}
                    onClick={() => handleViewDetails(drift.id)}
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
                        #{drift.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem', color: colors.text.primary }}>
                        {formatDriftType(drift.drift_type)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <SeverityChip severity={drift.severity} />
                    </TableCell>
                    <TableCell>
                      <StatusChip status={drift.status} />
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: colors.text.secondary,
                        }}
                      >
                        {drift.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                        {formatDate(drift.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{
                          color: colors.primary.light,
                          fontWeight: 500,
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        View →
                      </Typography>
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

      <DriftDetailsDrawer driftId={selectedDriftId} onClose={handleCloseDrawer} />
    </PageContainer>
  );
}
