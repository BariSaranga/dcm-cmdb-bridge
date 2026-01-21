import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  Skeleton,
  Paper,
  alpha,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { StatusChip, SeverityChip } from '../../components/common';
import { useDriftRecord, useUpdateDriftStatus } from '../../api/hooks/useDrift';
import { colors } from '../../theme/theme';

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
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 480 },
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
            Drift Details
          </Typography>
          <IconButton
            onClick={onClose}
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

      {/* Content */}
      <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
        {isLoading ? (
          <>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="rectangular" height={100} sx={{ mt: 2, borderRadius: 2 }} />
          </>
        ) : drift ? (
          <>
            {/* ID and Status */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                sx={{ color: colors.text.secondary, mb: 1.5 }}
              >
                ID: #{drift.id}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <SeverityChip severity={drift.severity} />
                <StatusChip status={drift.status} />
              </Box>
            </Box>

            {/* Type */}
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
                Type
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: colors.text.primary, mt: 0.5 }}
              >
                {formatDriftType(drift.drift_type)}
              </Typography>
            </Box>

            {/* Description */}
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
                Description
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: colors.text.primary, mt: 0.5, lineHeight: 1.6 }}
              >
                {drift.description}
              </Typography>
            </Box>

            {/* Created */}
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
                Created
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: colors.text.primary, mt: 0.5 }}
              >
                {formatDate(drift.created_at)}
              </Typography>
            </Box>

            {/* Resolved */}
            {drift.resolved_at && (
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
                  Resolved
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: colors.text.primary, mt: 0.5 }}
                >
                  {formatDate(drift.resolved_at)}
                </Typography>
              </Box>
            )}

            {/* Details JSON */}
            {drift.details && Object.keys(drift.details).length > 0 && (
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
                    maxHeight: 200,
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
                    {JSON.stringify(drift.details, null, 2)}
                  </Typography>
                </Paper>
              </Box>
            )}

            <Divider sx={{ my: 3, borderColor: colors.divider }} />

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {drift.status === 'open' && (
                <Button
                  variant="outlined"
                  color="info"
                  onClick={() => handleStatusUpdate('acknowledged')}
                  disabled={updateStatus.isPending}
                  sx={{ flex: 1 }}
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
                  sx={{ flex: 1 }}
                >
                  Resolve
                </Button>
              )}
            </Box>
          </>
        ) : (
          <Typography sx={{ color: colors.text.secondary }}>
            Drift not found
          </Typography>
        )}
      </Box>
    </Drawer>
  );
}
