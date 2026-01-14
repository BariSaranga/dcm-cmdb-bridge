import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Box, Typography, Chip, Paper } from '@mui/material';
import CloudIcon from '@mui/icons-material/Cloud';
import StorageIcon from '@mui/icons-material/Storage';
import type { GraphNode, GraphDriftStatus } from '../../../api/types';

interface InfraNodeProps {
  data: { graphNode: GraphNode };
  selected?: boolean;
}

const driftStatusColors: Record<GraphDriftStatus, string> = {
  mapped: '#4caf50',
  missing_in_cmdb: '#ff9800',
  stale_in_cmdb: '#f44336',
  ownership_mismatch: '#ff5722',
  config_mismatch: '#e91e63',
  lifecycle_conflict: '#9c27b0',
  drift_detected: '#ff9800',
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
  const borderColor = driftStatus ? driftStatusColors[driftStatus] : '#1976d2';

  return (
    <>
      <Handle type="target" position={Position.Top} />
      <Paper
        elevation={selected ? 8 : 2}
        sx={{
          minWidth: 180,
          borderLeft: `4px solid ${borderColor}`,
          borderRadius: 1,
          overflow: 'hidden',
          transition: 'box-shadow 0.2s',
        }}
      >
        <Box
          sx={{
            px: 1.5,
            py: 0.75,
            bgcolor: isRuntime ? 'primary.main' : 'secondary.main',
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
          <Typography variant="body2" fontWeight="medium" noWrap>
            {graphNode.name}
          </Typography>
          {graphNode.namespace && (
            <Typography variant="caption" color="text.secondary" display="block">
              ns: {graphNode.namespace}
            </Typography>
          )}
          {graphNode.owner && (
            <Typography variant="caption" color="text.secondary" display="block">
              owner: {graphNode.owner}
            </Typography>
          )}
        </Box>

        {driftStatus && driftStatus !== 'mapped' && (
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              bgcolor: `${borderColor}20`,
              borderTop: `1px solid ${borderColor}40`,
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
      <Handle type="source" position={Position.Bottom} />
    </>
  );
}

export default memo(InfraNode);
