import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Box, Typography, Chip, Paper, alpha } from '@mui/material';
import CloudIcon from '@mui/icons-material/Cloud';
import StorageIcon from '@mui/icons-material/Storage';
import type { GraphNode, GraphDriftStatus } from '../../../api/types';
import { colors } from '../../../theme/theme';

interface InfraNodeProps {
  data: { graphNode: GraphNode };
  selected?: boolean;
}

const driftStatusColors: Record<GraphDriftStatus, string> = {
  mapped: colors.success.main,
  missing_in_cmdb: colors.warning.main,
  stale_in_cmdb: colors.error.main,
  ownership_mismatch: '#ff5722',
  config_mismatch: '#e91e63',
  lifecycle_conflict: colors.secondary.main,
  drift_detected: colors.warning.main,
};

const driftStatusLabels: Record<GraphDriftStatus, string> = {
  mapped: 'Mapped',
  missing_in_cmdb: 'Missing in CMDB',
  stale_in_cmdb: 'Stale in CMDB',
  ownership_mismatch: 'Owner Mismatch',
  config_mismatch: 'Config Mismatch',
  lifecycle_conflict: 'Lifecycle Conflict',
  drift_detected: 'Drift Detected',
};

function InfraNode({ data, selected }: InfraNodeProps) {
  const { graphNode } = data;
  const isRuntime = graphNode.node_type === 'runtime';
  const driftStatus = graphNode.drift_status;
  const borderColor = driftStatus ? driftStatusColors[driftStatus] : colors.primary.main;

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        style={{ backgroundColor: colors.text.secondary }}
      />
      <Paper
        elevation={0}
        sx={{
          minWidth: 180,
          borderLeft: `4px solid ${borderColor}`,
          borderRadius: 1,
          overflow: 'hidden',
          transition: 'all 0.2s ease-in-out',
          background: `linear-gradient(135deg, ${alpha(colors.background.paper, 0.95)} 0%, ${alpha(colors.background.elevated, 0.9)} 100%)`,
          border: `1px solid ${colors.divider}`,
          boxShadow: selected
            ? `0 0 20px ${alpha(borderColor, 0.4)}`
            : `0 4px 12px ${alpha('#000', 0.3)}`,
        }}
      >
        <Box
          sx={{
            px: 1.5,
            py: 0.75,
            background: isRuntime
              ? `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.dark} 100%)`
              : `linear-gradient(135deg, ${colors.secondary.main} 0%, ${colors.secondary.dark} 100%)`,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {isRuntime ? (
            <CloudIcon fontSize="small" />
          ) : (
            <StorageIcon fontSize="small" />
          )}
          <Typography variant="caption" fontWeight="bold">
            {isRuntime ? 'Runtime' : 'CMDB'}
          </Typography>
          <Chip
            label={graphNode.kind}
            size="small"
            sx={{
              ml: 'auto',
              height: 18,
              fontSize: '0.65rem',
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
            }}
          />
        </Box>

        <Box sx={{ p: 1.5 }}>
          <Typography variant="body2" fontWeight="medium" noWrap sx={{ color: colors.text.primary }}>
            {graphNode.name}
          </Typography>
          {graphNode.namespace && (
            <Typography variant="caption" sx={{ color: colors.text.secondary }} display="block">
              ns: {graphNode.namespace}
            </Typography>
          )}
          {graphNode.owner && (
            <Typography variant="caption" sx={{ color: colors.text.secondary }} display="block">
              owner: {graphNode.owner}
            </Typography>
          )}
        </Box>

        {driftStatus && driftStatus !== 'mapped' && (
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              bgcolor: alpha(borderColor, 0.15),
              borderTop: `1px solid ${alpha(borderColor, 0.3)}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: borderColor, fontWeight: 'medium' }}
            >
              {driftStatusLabels[driftStatus]}
            </Typography>
          </Box>
        )}
      </Paper>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ backgroundColor: colors.text.secondary }}
      />
    </>
  );
}

export default memo(InfraNode);
