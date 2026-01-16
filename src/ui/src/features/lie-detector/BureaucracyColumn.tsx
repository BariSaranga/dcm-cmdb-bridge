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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      default:
        return 'success';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'assign_owner':
        return <PersonIcon />;
      case 'enable_tls':
        return <SecurityIcon />;
      case 'create_cmdb':
        return <AssignmentIcon />;
      default:
        return <ArrowIcon />;
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
          color: 'white',
          borderRadius: '4px 4px 0 0',
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
      <Box sx={{ p: 2, flexGrow: 1 }}>
        {/* Blockers Section */}
        {hasBlockers && (
          <Box mb={2}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              Blockers Identified
            </Typography>

            {ownershipIssues.length > 0 && (
              <Alert severity="warning" icon={<PersonIcon />} sx={{ mb: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                  Ownership Gap
                </Typography>
                <Typography variant="caption">
                  No owner assigned - no one is accountable for this service
                </Typography>
              </Alert>
            )}

            {securityIssues.length > 0 && (
              <Alert severity="error" icon={<SecurityIcon />} sx={{ mb: 1 }}>
                <Typography variant="body2" fontWeight="bold">
                  Security Blocker
                </Typography>
                <Typography variant="caption">
                  Public exposure without encryption requires immediate remediation
                </Typography>
              </Alert>
            )}
          </Box>
        )}

        {/* Suggested Actions */}
        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
          Suggested Actions
        </Typography>

        <List disablePadding>
          {suggestedActions.map((action, index) => (
            <Box key={index}>
              {index > 0 && <Divider sx={{ my: 1 }} />}
              <ListItem
                alignItems="flex-start"
                sx={{
                  px: 0,
                  backgroundColor:
                    action.priority === 'critical' ? 'error.50' : 'transparent',
                  borderRadius: 1,
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {getActionIcon(action.action)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {action.description}
                      </Typography>
                      <Chip
                        icon={<PriorityIcon sx={{ fontSize: 14 }} />}
                        label={action.priority.toUpperCase()}
                        size="small"
                        color={getPriorityColor(action.priority) as 'error' | 'warning' | 'info' | 'success'}
                        sx={{ height: 20, fontSize: '0.65rem' }}
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {action.rationale}
                    </Typography>
                  }
                />
              </ListItem>
            </Box>
          ))}
        </List>

        {/* Action Button */}
        {suggestedActions.length > 0 && (
          <Box mt={2}>
            <Button
              variant="contained"
              color={
                suggestedActions[0].priority === 'critical'
                  ? 'error'
                  : suggestedActions[0].priority === 'high'
                  ? 'warning'
                  : 'primary'
              }
              fullWidth
              startIcon={getActionIcon(suggestedActions[0].action)}
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
          borderTop: 1,
          borderColor: 'divider',
          backgroundColor: hasBlockers ? 'warning.50' : 'grey.50',
        }}
      >
        <Typography variant="caption" color={hasBlockers ? 'warning.main' : 'text.secondary'}>
          {hasBlockers
            ? `${ownershipIssues.length + securityIssues.length} blocker(s) • ${suggestedActions.length} action(s)`
            : `${suggestedActions.length} suggested action(s)`}
        </Typography>
      </Box>
    </Paper>
  );
}
