import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
  alpha,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StorageIcon from '@mui/icons-material/Storage';
import CloudIcon from '@mui/icons-material/Cloud';
import ApiIcon from '@mui/icons-material/Api';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useArchitectureNodeDetails } from '../../api/hooks';
import { colors } from '../../theme/theme';
import type { ArchitectureNodeType } from '../../api/types';

interface NodeDetailsPanelProps {
  nodeId: string | null;
  onClose: () => void;
}

const nodeTypeConfig: Record<
  ArchitectureNodeType,
  { icon: React.ReactNode; label: string; color: string }
> = {
  container: {
    icon: <CloudIcon />,
    label: 'Container',
    color: colors.primary.main,
  },
  datastore: {
    icon: <StorageIcon />,
    label: 'Datastore',
    color: colors.success.main,
  },
  external: {
    icon: <ApiIcon />,
    label: 'External System',
    color: colors.secondary.main,
  },
};

export function NodeDetailsPanel({ nodeId, onClose }: NodeDetailsPanelProps) {
  const { data: details, isLoading } = useArchitectureNodeDetails(nodeId);

  const nodeConfig = details?.node ? nodeTypeConfig[details.node.type] : null;

  return (
    <Drawer
      anchor="right"
      open={nodeId !== null}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 400 },
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            {isLoading ? (
              <>
                <Skeleton width={100} height={24} sx={{ mb: 1 }} />
                <Skeleton width={180} height={32} />
              </>
            ) : details?.node ? (
              <>
                <Chip
                  icon={nodeConfig?.icon}
                  label={nodeConfig?.label}
                  size="small"
                  sx={{
                    mb: 1,
                    backgroundColor: alpha(nodeConfig?.color || colors.primary.main, 0.15),
                    color: nodeConfig?.color,
                    border: `1px solid ${alpha(nodeConfig?.color || colors.primary.main, 0.3)}`,
                    '& .MuiChip-icon': {
                      color: nodeConfig?.color,
                    },
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: colors.text.primary }}
                >
                  {details.node.name}
                </Typography>
              </>
            ) : null}
          </Box>
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

      {isLoading ? (
        <Box sx={{ p: 3 }}>
          <Skeleton width="100%" height={60} sx={{ mb: 2 }} />
          <Skeleton width="80%" height={20} sx={{ mb: 1 }} />
          <Skeleton width="60%" height={20} />
        </Box>
      ) : details?.node ? (
        <Box sx={{ p: 3 }}>
          {/* Technology */}
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
              Technology
            </Typography>
            <Typography
              variant="body1"
              sx={{ color: colors.text.primary, mt: 0.5, fontWeight: 500 }}
            >
              {details.node.tech}
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
              variant="body2"
              sx={{ color: colors.text.secondary, mt: 0.5, lineHeight: 1.6 }}
            >
              {details.node.description}
            </Typography>
          </Box>

          <Divider sx={{ my: 2, borderColor: colors.divider }} />

          {/* Incoming Connections */}
          {details.incoming_connections.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="caption"
                sx={{
                  color: colors.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <ArrowBackIcon sx={{ fontSize: 14 }} />
                Incoming Connections ({details.incoming_connections.length})
              </Typography>
              <List dense disablePadding sx={{ mt: 1 }}>
                {details.incoming_connections.map((conn, idx) => (
                  <ListItem
                    key={idx}
                    sx={{
                      px: 1.5,
                      py: 1,
                      backgroundColor: alpha(colors.info.main, 0.08),
                      borderRadius: 1,
                      mb: 1,
                      border: `1px solid ${alpha(colors.info.main, 0.15)}`,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <ArrowForwardIcon sx={{ color: colors.info.main, fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ color: colors.text.primary, fontWeight: 500 }}>
                          {conn.from_name || conn.from}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                          {conn.relation.replace(/_/g, ' ')}
                          {conn.protocol && ` (${conn.protocol})`}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* Outgoing Connections */}
          {details.outgoing_connections.length > 0 && (
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: colors.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <ArrowForwardIcon sx={{ fontSize: 14 }} />
                Outgoing Connections ({details.outgoing_connections.length})
              </Typography>
              <List dense disablePadding sx={{ mt: 1 }}>
                {details.outgoing_connections.map((conn, idx) => (
                  <ListItem
                    key={idx}
                    sx={{
                      px: 1.5,
                      py: 1,
                      backgroundColor: alpha(colors.primary.main, 0.08),
                      borderRadius: 1,
                      mb: 1,
                      border: `1px solid ${alpha(colors.primary.main, 0.15)}`,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <ArrowForwardIcon sx={{ color: colors.primary.main, fontSize: 18 }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ color: colors.text.primary, fontWeight: 500 }}>
                          {conn.to_name || conn.to}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                          {conn.relation.replace(/_/g, ' ')}
                          {conn.protocol && ` (${conn.protocol})`}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {/* No connections */}
          {details.incoming_connections.length === 0 &&
            details.outgoing_connections.length === 0 && (
              <Typography
                variant="body2"
                sx={{ color: colors.text.secondary, fontStyle: 'italic' }}
              >
                No connections defined for this component.
              </Typography>
            )}
        </Box>
      ) : null}
    </Drawer>
  );
}
