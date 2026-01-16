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
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import type { AIEvidence } from '../../api/hooks';

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
      return <CancelIcon color="error" />;
    }
    if (item.data.status === 'active') {
      return <CheckIcon color="success" />;
    }
    return <HelpIcon color="warning" />;
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
            `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
          color: 'white',
          borderRadius: '4px 4px 0 0',
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
      <Box sx={{ p: 2, flexGrow: 1 }}>
        {hasMissingRecord && (
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              Missing CMDB Record
            </Typography>
            <Typography variant="caption">
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
                {index > 0 && <Divider sx={{ my: 1 }} />}
                <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getStatusIcon(item)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {item.entity_name}
                        </Typography>
                        <Chip
                          label={item.data.status === 'missing' ? 'MISSING' : 'TRACKED'}
                          size="small"
                          color={item.data.status === 'missing' ? 'error' : 'success'}
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {item.fact}
                        </Typography>
                        {item.data.owner ? (
                          <Box mt={0.5}>
                            <Typography variant="caption" color="text.secondary">
                              Owner: <strong>{String(item.data.owner)}</strong>
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
                <Divider sx={{ my: 1 }} />
                <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <CancelIcon color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {item.entity_name}
                        </Typography>
                        <Chip
                          label="DRIFT"
                          size="small"
                          color="error"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
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
          borderTop: 1,
          borderColor: 'divider',
          backgroundColor: hasMissingRecord ? 'error.50' : 'grey.50',
        }}
      >
        <Typography variant="caption" color={hasMissingRecord ? 'error.main' : 'text.secondary'}>
          {hasMissingRecord
            ? 'Action required: Create CMDB record'
            : `${cmdbEvidence.length} CMDB fact(s)`}
        </Typography>
      </Box>
    </Paper>
  );
}
