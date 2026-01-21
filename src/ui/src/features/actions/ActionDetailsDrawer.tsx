import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  Skeleton,
  Paper,
  Stepper,
  Step,
  StepLabel,
  alpha,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { StatusChip } from '../../components/common';
import { useAction, useApproveAction, useRejectAction, useApplyAction } from '../../api/hooks/useActions';
import { colors } from '../../theme/theme';

interface ActionDetailsDrawerProps {
  actionId: number | null;
  onClose: () => void;
}

const WORKFLOW_STEPS = ['Proposed', 'Reviewed', 'Applied'];

function getActiveStep(status: string): number {
  switch (status) {
    case 'proposed':
      return 0;
    case 'approved':
    case 'rejected':
      return 1;
    case 'applied':
    case 'failed':
      return 2;
    default:
      return 0;
  }
}

export function ActionDetailsDrawer({ actionId, onClose }: ActionDetailsDrawerProps) {
  const { data: action, isLoading } = useAction(actionId);
  const approveAction = useApproveAction();
  const rejectAction = useRejectAction();
  const applyAction = useApplyAction();

  const handleApprove = async () => {
    if (actionId) {
      await approveAction.mutateAsync({ id: actionId, reviewed_by: 'admin' });
    }
  };

  const handleReject = async () => {
    if (actionId) {
      await rejectAction.mutateAsync({ id: actionId, reviewed_by: 'admin' });
    }
  };

  const handleApply = async () => {
    if (actionId) {
      await applyAction.mutateAsync(actionId);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const formatActionType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const isStepFailed = (step: number) => {
    if (action?.status === 'rejected' && step === 1) return true;
    if (action?.status === 'failed' && step === 2) return true;
    return false;
  };

  return (
    <Drawer
      anchor="right"
      open={actionId !== null}
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
            Action Details
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
        ) : action ? (
          <>
            {/* Workflow Stepper */}
            <Box sx={{ mb: 3 }}>
              <Stepper
                activeStep={getActiveStep(action.status)}
                alternativeLabel
                sx={{
                  '& .MuiStepLabel-label': {
                    color: colors.text.secondary,
                    '&.Mui-active': {
                      color: colors.primary.light,
                    },
                    '&.Mui-completed': {
                      color: colors.success.main,
                    },
                  },
                  '& .MuiStepIcon-root': {
                    color: alpha(colors.text.secondary, 0.3),
                    '&.Mui-active': {
                      color: colors.primary.main,
                    },
                    '&.Mui-completed': {
                      color: colors.success.main,
                    },
                  },
                }}
              >
                {WORKFLOW_STEPS.map((label, index) => (
                  <Step key={label}>
                    <StepLabel error={isStepFailed(index)}>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>

            {/* ID and Status */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                sx={{ color: colors.text.secondary, mb: 1.5 }}
              >
                ID: #{action.id}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <StatusChip status={action.status} />
              </Box>
            </Box>

            {/* Action Type */}
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
                Action Type
              </Typography>
              <Typography
                variant="body1"
                sx={{ color: colors.text.primary, mt: 0.5 }}
              >
                {formatActionType(action.action_type)}
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
                {action.description}
              </Typography>
            </Box>

            {/* Proposed By */}
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
                Proposed By
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: colors.text.primary, mt: 0.5 }}
              >
                {action.proposed_by} on {formatDate(action.proposed_at)}
              </Typography>
            </Box>

            {action.reviewed_by && (
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
                  Reviewed By
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: colors.text.primary, mt: 0.5 }}
                >
                  {action.reviewed_by} on {formatDate(action.reviewed_at)}
                </Typography>
                {action.review_comment && (
                  <Typography
                    variant="body2"
                    sx={{ color: colors.text.secondary, mt: 0.5 }}
                  >
                    Comment: {action.review_comment}
                  </Typography>
                )}
              </Box>
            )}

            {action.applied_at && (
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
                  Applied
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: colors.text.primary, mt: 0.5 }}
                >
                  {formatDate(action.applied_at)}
                </Typography>
              </Box>
            )}

            {action.payload && Object.keys(action.payload).length > 0 && (
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
                  Payload
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    mt: 1,
                    p: 2,
                    backgroundColor: alpha(colors.background.default, 0.5),
                    border: `1px solid ${colors.divider}`,
                    maxHeight: 150,
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
                    {JSON.stringify(action.payload, null, 2)}
                  </Typography>
                </Paper>
              </Box>
            )}

            {action.result && Object.keys(action.result).length > 0 && (
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
                  Result
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    mt: 1,
                    p: 2,
                    backgroundColor: alpha(colors.background.default, 0.5),
                    border: `1px solid ${colors.divider}`,
                    maxHeight: 150,
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
                    {JSON.stringify(action.result, null, 2)}
                  </Typography>
                </Paper>
              </Box>
            )}

            <Divider sx={{ my: 3, borderColor: colors.divider }} />

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {action.status === 'proposed' && (
                <>
                  <Button
                    variant="contained"
                    onClick={handleApprove}
                    disabled={approveAction.isPending}
                    sx={{
                      flex: 1,
                      backgroundColor: colors.success.main,
                      '&:hover': {
                        backgroundColor: colors.success.dark,
                        boxShadow: `0 0 20px ${alpha(colors.success.main, 0.4)}`,
                      },
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleReject}
                    disabled={rejectAction.isPending}
                    sx={{
                      flex: 1,
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
              )}
              {action.status === 'approved' && (
                <Button
                  variant="contained"
                  onClick={handleApply}
                  disabled={applyAction.isPending}
                  sx={{
                    flex: 1,
                    backgroundColor: colors.primary.main,
                    '&:hover': {
                      backgroundColor: colors.primary.dark,
                      boxShadow: `0 0 20px ${alpha(colors.primary.main, 0.4)}`,
                    },
                  }}
                >
                  Apply
                </Button>
              )}
            </Box>
          </>
        ) : (
          <Typography sx={{ color: colors.text.secondary }}>
            Action not found
          </Typography>
        )}
      </Box>
    </Drawer>
  );
}
