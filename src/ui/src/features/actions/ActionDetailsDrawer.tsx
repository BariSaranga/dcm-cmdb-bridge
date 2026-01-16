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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { StatusChip } from '../../components/common';
import { useAction, useApproveAction, useRejectAction, useApplyAction } from '../../api/hooks/useActions';

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
      PaperProps={{ sx: { width: { xs: '100%', sm: 450 } } }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Action Details</Typography>
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
        ) : action ? (
          <>
            {/* Workflow Stepper */}
            <Box sx={{ mb: 3 }}>
              <Stepper activeStep={getActiveStep(action.status)} alternativeLabel>
                {WORKFLOW_STEPS.map((label, index) => (
                  <Step key={label}>
                    <StepLabel error={isStepFailed(index)}>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                ID: #{action.id}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <StatusChip status={action.status} />
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Action Type
              </Typography>
              <Typography variant="body1">{formatActionType(action.action_type)}</Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Description
              </Typography>
              <Typography variant="body1">{action.description}</Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Proposed By
              </Typography>
              <Typography variant="body2">
                {action.proposed_by} on {formatDate(action.proposed_at)}
              </Typography>
            </Box>

            {action.reviewed_by && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Reviewed By
                </Typography>
                <Typography variant="body2">
                  {action.reviewed_by} on {formatDate(action.reviewed_at)}
                </Typography>
                {action.review_comment && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Comment: {action.review_comment}
                  </Typography>
                )}
              </Box>
            )}

            {action.applied_at && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Applied
                </Typography>
                <Typography variant="body2">{formatDate(action.applied_at)}</Typography>
              </Box>
            )}

            {action.payload && Object.keys(action.payload).length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Payload
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    backgroundColor: 'grey.50',
                    maxHeight: 150,
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
                    {JSON.stringify(action.payload, null, 2)}
                  </Typography>
                </Paper>
              </Box>
            )}

            {action.result && Object.keys(action.result).length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Result
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    backgroundColor: 'grey.50',
                    maxHeight: 150,
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
                    {JSON.stringify(action.result, null, 2)}
                  </Typography>
                </Paper>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', gap: 1 }}>
              {action.status === 'proposed' && (
                <>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleApprove}
                    disabled={approveAction.isPending}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={handleReject}
                    disabled={rejectAction.isPending}
                  >
                    Reject
                  </Button>
                </>
              )}
              {action.status === 'approved' && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleApply}
                  disabled={applyAction.isPending}
                >
                  Apply
                </Button>
              )}
            </Box>
          </>
        ) : (
          <Typography color="text.secondary">Action not found</Typography>
        )}
      </Box>
    </Drawer>
  );
}
