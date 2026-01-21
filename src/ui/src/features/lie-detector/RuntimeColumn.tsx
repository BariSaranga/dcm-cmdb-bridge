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
  alpha,
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
import { colors } from '../../theme/theme';

interface RuntimeColumnProps {
  evidence: AIEvidence[];
  highlightedNodes: string[];
}

export function RuntimeColumn({ evidence, highlightedNodes }: RuntimeColumnProps) {
  const runtimeEvidence = evidence.filter((e) => e.source === 'runtime');

  const getStatusIcon = (fact: string) => {
    if (fact.includes('No owner') || fact.includes('without TLS') || fact.includes('Publicly exposed')) {
      return <ErrorIcon sx={{ color: colors.error.main }} />;
    }
    if (fact.includes('exists')) {
      return <CheckIcon sx={{ color: colors.success.main }} />;
    }
    return <WarningIcon sx={{ color: colors.warning.main }} />;
  };

  const getEntityIcon = (entityType: string) => {
    switch (entityType) {
      case 'Deployment':
        return <StorageIcon sx={{ color: colors.info.main }} />;
      case 'Ingress':
        return <PublicIcon sx={{ color: colors.warning.main }} />;
      default:
        return <CloudIcon sx={{ color: colors.text.secondary }} />;
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
          background: `linear-gradient(135deg, ${colors.info.main} 0%, ${colors.info.dark} 100%)`,
          color: 'white',
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
      <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
        {runtimeEvidence.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            No runtime evidence found
          </Typography>
        ) : (
          <List disablePadding>
            {runtimeEvidence.map((item, index) => (
              <Box key={index}>
                {index > 0 && <Divider sx={{ my: 1.5, borderColor: colors.divider }} />}
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    px: 1.5,
                    py: 1,
                    backgroundColor: highlightedNodes.includes(
                      `runtime:${item.entity_type}:production:${item.entity_name}`
                    )
                      ? alpha(colors.primary.main, 0.1)
                      : 'transparent',
                    borderRadius: 1,
                    border: highlightedNodes.includes(
                      `runtime:${item.entity_type}:production:${item.entity_name}`
                    )
                      ? `1px solid ${alpha(colors.primary.main, 0.3)}`
                      : '1px solid transparent',
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {getEntityIcon(item.entity_type)}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: colors.text.primary }}>
                          {item.entity_name}
                        </Typography>
                        <Chip
                          label={item.entity_type}
                          size="small"
                          variant="outlined"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            borderColor: colors.divider,
                            color: colors.text.secondary,
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Box display="flex" alignItems="center" gap={0.5} mb={0.5}>
                          {getStatusIcon(item.fact)}
                          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                            {item.fact}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {item.data.owner === null && (
                            <Chip
                              label="No Owner"
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                backgroundColor: alpha(colors.error.main, 0.15),
                                color: colors.error.main,
                                border: `1px solid ${alpha(colors.error.main, 0.3)}`,
                              }}
                            />
                          )}
                          {item.data.public ? (
                            <Chip
                              label="Public"
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                backgroundColor: alpha(colors.warning.main, 0.15),
                                color: colors.warning.main,
                                border: `1px solid ${alpha(colors.warning.main, 0.3)}`,
                              }}
                            />
                          ) : null}
                          {item.data.tls === false && (
                            <Chip
                              label="No TLS"
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                backgroundColor: alpha(colors.error.main, 0.15),
                                color: colors.error.main,
                                border: `1px solid ${alpha(colors.error.main, 0.3)}`,
                              }}
                            />
                          )}
                        </Box>
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
          borderTop: `1px solid ${colors.divider}`,
          backgroundColor: alpha(colors.background.default, 0.5),
        }}
      >
        <Typography variant="caption" sx={{ color: colors.text.secondary }}>
          {runtimeEvidence.length} runtime fact(s) • {highlightedNodes.filter((n) => n.startsWith('runtime:')).length} highlighted
        </Typography>
      </Box>
    </Paper>
  );
}
