import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  Skeleton,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { StatusChip, SeverityChip } from '../../components/common';
import { useDriftRecord, useUpdateDriftStatus } from '../../api/hooks/useDrift';

interface DriftDetailsDrawerProps {
  driftId: number | null;
  onClose: () => void;
}

export function DriftDetailsDrawer({ driftId, onClose }: DriftDetailsDrawerProps) {
  const { data: drift, isLoading } = useDriftRecord(driftId);
  const updateStatus = useUpdateDriftStatus();

  const handleStatusUpdate = async (status: string) => {
    if (driftId) {
      await updateStatus.mutateAsync({ id: driftId, status });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const formatDriftType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <Drawer
      anchor="right"
      open={driftId !== null}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: '100%', sm: 450 } } }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Drift Details</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </Box>
      <Divider />
      <Box sx={{ p: 2 }}>
        {isLoading ? (
          <>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="rectangular" height={100} sx={{ mt: 2 }} />
          </>
        ) : drift ? (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                ID: #{drift.id}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <SeverityChip severity={drift.severity} />
                <StatusChip status={drift.status} />
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Type
              </Typography>
              <Typography variant="body1">{formatDriftType(drift.drift_type)}</Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1">{drift.description}</Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Created
              </Typography>
              <Typography variant="body2">{formatDate(drift.created_at)}</Typography>
            </Box>

            {drift.resolved_at && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Resolved
                </Typography>
                <Typography variant="body2">{formatDate(drift.resolved_at)}</Typography>
              </Box>
            )}

            {drift.details && Object.keys(drift.details).length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Details
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    backgroundColor: 'grey.50',
                    maxHeight: 200,
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
                    {JSON.stringify(drift.details, null, 2)}
                  </Typography>
                </Paper>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', gap: 1 }}>
              {drift.status === 'open' && (
                <Button
                  variant="outlined"
                  color="info"
                  onClick={() => handleStatusUpdate('acknowledged')}
                  disabled={updateStatus.isPending}
                >
                  Acknowledge
                </Button>
              )}
              {(drift.status === 'open' || drift.status === 'acknowledged') && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleStatusUpdate('resolved')}
                  disabled={updateStatus.isPending}
                >
                  Resolve
                </Button>
              )}
            </Box>
          </>
        ) : (
          <Typography color="text.secondary">Drift not found</Typography>
        )}
      </Box>
    </Drawer>
  );
}
