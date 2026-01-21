import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  Button,
  Alert,
  alpha,
} from '@mui/material';
import {
  AccountTree as AccountTreeIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  ArrowForward as ArrowIcon,
  PriorityHigh as PriorityIcon,
} from '@mui/icons-material';
import type { AIEvidence, SuggestedAction } from '../../api/hooks';
import { colors } from '../../theme/theme';

interface BureaucracyColumnProps {
  evidence: AIEvidence[];
  suggestedActions: SuggestedAction[];
}

export function BureaucracyColumn({ evidence, suggestedActions }: BureaucracyColumnProps) {
  // Extract bureaucracy-related issues
  const ownershipIssues = evidence.filter(
    (e) =>
      e.data.owner === null ||
      e.fact.includes('No owner') ||
      (e.source === 'drift' && e.data.drift_type === 'ownership')
  );

  const securityIssues = evidence.filter(
    (e) => e.source === 'drift' && e.data.drift_type === 'security'
  );

  const hasBlockers = ownershipIssues.length > 0 || securityIssues.length > 0;

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'critical':
        return {
          bg: alpha(colors.error.main, 0.15),
          color: colors.error.main,
          border: alpha(colors.error.main, 0.3),
        };
      case 'high':
        return {
          bg: alpha(colors.warning.main, 0.15),
          color: colors.warning.main,
          border: alpha(colors.warning.main, 0.3),
        };
      case 'medium':
        return {
          bg: alpha(colors.info.main, 0.15),
          color: colors.info.main,
          border: alpha(colors.info.main, 0.3),
        };
      default:
        return {
          bg: alpha(colors.success.main, 0.15),
          color: colors.success.main,
          border: alpha(colors.success.main, 0.3),
        };
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'assign_owner':
        return <PersonIcon sx={{ color: colors.warning.main }} />;
      case 'enable_tls':
        return <SecurityIcon sx={{ color: colors.error.main }} />;
      case 'create_cmdb':
        return <AssignmentIcon sx={{ color: colors.info.main }} />;
      default:
        return <ArrowIcon sx={{ color: colors.text.secondary }} />;
    }
  };

  const getButtonColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return colors.error.main;
      case 'high':
        return colors.warning.main;
      default:
        return colors.primary.main;
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(135deg, ${alpha(colors.background.paper, 0.9)} 0%, ${alpha(colors.background.elevated, 0.8)} 100%)`,
        border: `1px solid ${colors.divider}`,
        backdropFilter: 'blur(10px)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          background: `linear-gradient(135deg, ${colors.warning.main} 0%, ${colors.warning.dark} 100%)`,
          color: 'white',
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <AccountTreeIcon />
          <Typography variant="h6" fontWeight="bold">
            Bureaucracy
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
          Ownership, approvals & blockers
        </Typography>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
        {/* Blockers Section */}
        {hasBlockers && (
          <Box mb={2}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: colors.text.primary }}>
              Blockers Identified
            </Typography>

            {ownershipIssues.length > 0 && (
              <Alert
                severity="warning"
                icon={<PersonIcon />}
                sx={{
                  mb: 1,
                  backgroundColor: alpha(colors.warning.main, 0.1),
                  border: `1px solid ${alpha(colors.warning.main, 0.2)}`,
                  '& .MuiAlert-icon': { color: colors.warning.main },
                }}
              >
                <Typography variant="body2" fontWeight="bold" sx={{ color: colors.text.primary }}>
                  Ownership Gap
                </Typography>
                <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                  No owner assigned - no one is accountable for this service
                </Typography>
              </Alert>
            )}

            {securityIssues.length > 0 && (
              <Alert
                severity="error"
                icon={<SecurityIcon />}
                sx={{
                  mb: 1,
                  backgroundColor: alpha(colors.error.main, 0.1),
                  border: `1px solid ${alpha(colors.error.main, 0.2)}`,
                  '& .MuiAlert-icon': { color: colors.error.main },
                }}
              >
                <Typography variant="body2" fontWeight="bold" sx={{ color: colors.text.primary }}>
                  Security Blocker
                </Typography>
                <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                  Public exposure without encryption requires immediate remediation
                </Typography>
              </Alert>
            )}
          </Box>
        )}

        {/* Suggested Actions */}
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: colors.text.primary }}>
          Suggested Actions
        </Typography>

        <List disablePadding>
          {suggestedActions.map((action, index) => {
            const priorityStyles = getPriorityStyles(action.priority);
            return (
              <Box key={index}>
                {index > 0 && <Divider sx={{ my: 1.5, borderColor: colors.divider }} />}
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    px: 1.5,
                    py: 1,
                    backgroundColor:
                      action.priority === 'critical' ? alpha(colors.error.main, 0.08) : 'transparent',
                    borderRadius: 1,
                    border:
                      action.priority === 'critical'
                        ? `1px solid ${alpha(colors.error.main, 0.2)}`
                        : '1px solid transparent',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getActionIcon(action.action)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: colors.text.primary }}>
                          {action.description}
                        </Typography>
                        <Chip
                          icon={<PriorityIcon sx={{ fontSize: 14 }} />}
                          label={action.priority.toUpperCase()}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            backgroundColor: priorityStyles.bg,
                            color: priorityStyles.color,
                            border: `1px solid ${priorityStyles.border}`,
                            '& .MuiChip-icon': { color: priorityStyles.color },
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" sx={{ mt: 0.5, color: colors.text.secondary }}>
                        {action.rationale}
                      </Typography>
                    }
                  />
                </ListItem>
              </Box>
            );
          })}
        </List>

        {/* Action Button */}
        {suggestedActions.length > 0 && (
          <Box mt={2}>
            <Button
              variant="contained"
              fullWidth
              startIcon={getActionIcon(suggestedActions[0].action)}
              sx={{
                backgroundColor: getButtonColor(suggestedActions[0].priority),
                '&:hover': {
                  backgroundColor: getButtonColor(suggestedActions[0].priority),
                  boxShadow: `0 0 20px ${alpha(getButtonColor(suggestedActions[0].priority), 0.4)}`,
                },
              }}
            >
              {suggestedActions[0].description}
            </Button>
          </Box>
        )}
      </Box>

      {/* Summary Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${colors.divider}`,
          backgroundColor: hasBlockers
            ? alpha(colors.warning.main, 0.1)
            : alpha(colors.background.default, 0.5),
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: hasBlockers ? colors.warning.main : colors.text.secondary }}
        >
          {hasBlockers
            ? `${ownershipIssues.length + securityIssues.length} blocker(s) • ${suggestedActions.length} action(s)`
            : `${suggestedActions.length} suggested action(s)`}
        </Typography>
      </Box>
    </Paper>
  );
}
