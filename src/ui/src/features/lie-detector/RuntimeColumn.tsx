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
} from '@mui/material';
import {
  Cloud as CloudIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Storage as StorageIcon,
  Public as PublicIcon,
} from '@mui/icons-material';
import type { AIEvidence } from '../../api/hooks';

interface RuntimeColumnProps {
  evidence: AIEvidence[];
  highlightedNodes: string[];
}

export function RuntimeColumn({ evidence, highlightedNodes }: RuntimeColumnProps) {
  const runtimeEvidence = evidence.filter((e) => e.source === 'runtime');

  const getStatusIcon = (fact: string) => {
    if (fact.includes('No owner') || fact.includes('without TLS') || fact.includes('Publicly exposed')) {
      return <ErrorIcon color="error" />;
    }
    if (fact.includes('exists')) {
      return <CheckIcon color="success" />;
    }
    return <WarningIcon color="warning" />;
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'Deployment':
        return <StorageIcon />;
      case 'Ingress':
        return <PublicIcon />;
      default:
        return <CloudIcon />;
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
            `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
          color: 'white',
          borderRadius: '4px 4px 0 0',
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <CloudIcon />
          <Typography variant="h6" fontWeight="bold">
            Runtime Truth
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
          What actually runs in production
        </Typography>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2, flexGrow: 1 }}>
        {runtimeEvidence.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            No runtime evidence found
          </Typography>
        ) : (
          <List disablePadding>
            {runtimeEvidence.map((item, index) => (
              <Box key={index}>
                {index > 0 && <Divider sx={{ my: 1 }} />}
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    px: 0,
                    backgroundColor: highlightedNodes.includes(
                      `runtime:${item.entity_type}:production:${item.entity_name}`
                    )
                      ? 'action.hover'
                      : 'transparent',
                    borderRadius: 1,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getEntityIcon(item.entity_type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {item.entity_name}
                        </Typography>
                        <Chip
                          label={item.entity_type}
                          size="small"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                          {getStatusIcon(item.fact)}
                          <Typography variant="body2" color="text.secondary">
                            {item.fact}
                          </Typography>
                        </Box>
                        {item.data.owner === null && (
                          <Chip
                            label="No Owner"
                            size="small"
                            color="error"
                            sx={{ mr: 0.5, height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                        {item.data.public ? (
                          <Chip
                            label="Public"
                            size="small"
                            color="warning"
                            sx={{ mr: 0.5, height: 20, fontSize: '0.7rem' }}
                          />
                        ) : null}
                        {item.data.tls === false && (
                          <Chip
                            label="No TLS"
                            size="small"
                            color="error"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
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
          backgroundColor: 'grey.50',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          {runtimeEvidence.length} runtime fact(s) • {highlightedNodes.filter((n) => n.startsWith('runtime:')).length} highlighted
        </Typography>
      </Box>
    </Paper>
  );
}
