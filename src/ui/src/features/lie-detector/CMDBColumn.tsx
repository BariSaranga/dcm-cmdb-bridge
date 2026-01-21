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
  Alert,
  alpha,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import type { AIEvidence } from '../../api/hooks';
import { colors } from '../../theme/theme';

interface CMDBColumnProps {
  evidence: AIEvidence[];
}

export function CMDBColumn({ evidence }: CMDBColumnProps) {
  const cmdbEvidence = evidence.filter((e) => e.source === 'cmdb');
  const driftEvidence = evidence.filter(
    (e) => e.source === 'drift' && e.data.drift_type === 'missing_in_cmdb'
  );

  const hasMissingRecord = cmdbEvidence.some(
    (e) => e.fact.includes('No CMDB record') || e.data.status === 'missing'
  );

  const getStatusIcon = (item: AIEvidence) => {
    if (item.fact.includes('No CMDB record') || item.data.status === 'missing') {
      return <CancelIcon sx={{ color: colors.error.main }} />;
    }
    if (item.data.status === 'active') {
      return <CheckIcon sx={{ color: colors.success.main }} />;
    }
    return <HelpIcon sx={{ color: colors.warning.main }} />;
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
          background: `linear-gradient(135deg, ${colors.secondary.main} 0%, ${colors.secondary.dark} 100%)`,
          color: 'white',
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <InventoryIcon />
          <Typography variant="h6" fontWeight="bold">
            CMDB Reality
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
          What the organization thinks exists
        </Typography>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
        {hasMissingRecord && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              backgroundColor: alpha(colors.error.main, 0.1),
              border: `1px solid ${alpha(colors.error.main, 0.2)}`,
              '& .MuiAlert-icon': { color: colors.error.main },
            }}
          >
            <Typography variant="body2" fontWeight="bold" sx={{ color: colors.text.primary }}>
              Missing CMDB Record
            </Typography>
            <Typography variant="caption" sx={{ color: colors.text.secondary }}>
              This entity is not tracked in the Configuration Management Database
            </Typography>
          </Alert>
        )}

        {cmdbEvidence.length === 0 && driftEvidence.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            No CMDB evidence found
          </Typography>
        ) : (
          <List disablePadding>
            {cmdbEvidence.map((item, index) => (
              <Box key={`cmdb-${index}`}>
                {index > 0 && <Divider sx={{ my: 1.5, borderColor: colors.divider }} />}
                <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getStatusIcon(item)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: colors.text.primary }}>
                          {item.entity_name}
                        </Typography>
                        <Chip
                          label={item.data.status === 'missing' ? 'MISSING' : 'TRACKED'}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            backgroundColor: item.data.status === 'missing'
                              ? alpha(colors.error.main, 0.15)
                              : alpha(colors.success.main, 0.15),
                            color: item.data.status === 'missing'
                              ? colors.error.main
                              : colors.success.main,
                            border: `1px solid ${item.data.status === 'missing'
                              ? alpha(colors.error.main, 0.3)
                              : alpha(colors.success.main, 0.3)}`,
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                          {item.fact}
                        </Typography>
                        {item.data.owner ? (
                          <Box mt={0.5}>
                            <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                              Owner: <strong style={{ color: colors.primary.light }}>{String(item.data.owner)}</strong>
                            </Typography>
                          </Box>
                        ) : null}
                      </Box>
                    }
                  />
                </ListItem>
              </Box>
            ))}

            {driftEvidence.map((item, index) => (
              <Box key={`drift-${index}`}>
                <Divider sx={{ my: 1.5, borderColor: colors.divider }} />
                <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <CancelIcon sx={{ color: colors.error.main }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: colors.text.primary }}>
                          {item.entity_name}
                        </Typography>
                        <Chip
                          label="DRIFT"
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            backgroundColor: alpha(colors.error.main, 0.15),
                            color: colors.error.main,
                            border: `1px solid ${alpha(colors.error.main, 0.3)}`,
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" sx={{ mt: 1, color: colors.text.secondary }}>
                        {item.fact}
                      </Typography>
                    }
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </Box>

      {/* Summary Footer */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${colors.divider}`,
          backgroundColor: hasMissingRecord
            ? alpha(colors.error.main, 0.1)
            : alpha(colors.background.default, 0.5),
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: hasMissingRecord ? colors.error.main : colors.text.secondary }}
        >
          {hasMissingRecord
            ? 'Action required: Create CMDB record'
            : `${cmdbEvidence.length} CMDB fact(s)`}
        </Typography>
      </Box>
    </Paper>
  );
}
