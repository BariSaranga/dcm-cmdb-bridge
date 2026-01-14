import { useState, type ReactNode } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  Button,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudIcon from '@mui/icons-material/Cloud';
import StorageIcon from '@mui/icons-material/Storage';
import type { GraphNode, GraphDriftStatus } from '../../api/types';

interface NodeDetailsPanelProps {
  node: GraphNode | null;
  onClose: () => void;
}

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index} style={{ padding: '16px 0' }}>
      {value === index && children}
    </div>
  );
}

const driftStatusColors: Record<GraphDriftStatus, 'success' | 'warning' | 'error' | 'info'> = {
  mapped: 'success',
  missing_in_cmdb: 'warning',
  stale_in_cmdb: 'error',
  ownership_mismatch: 'warning',
  config_mismatch: 'warning',
  lifecycle_conflict: 'error',
  drift_detected: 'warning',
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

export default function NodeDetailsPanel({ node, onClose }: NodeDetailsPanelProps) {
  const [tabValue, setTabValue] = useState(0);

  if (!node) return null;

  const isRuntime = node.node_type === 'runtime';
  const driftStatus = node.drift_status;

  return (
    <Drawer
      anchor="right"
      open={!!node}
      onClose={onClose}
      PaperProps={{ sx: { width: 400 } }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {isRuntime ? (
            <CloudIcon color="primary" sx={{ mr: 1 }} />
          ) : (
            <StorageIcon color="secondary" sx={{ mr: 1 }} />
          )}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {node.name}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            label={isRuntime ? 'Runtime' : 'CMDB'}
            color={isRuntime ? 'primary' : 'secondary'}
            size="small"
          />
          <Chip label={node.kind} variant="outlined" size="small" />
          {driftStatus && (
            <Chip
              label={driftStatusLabels[driftStatus]}
              color={driftStatusColors[driftStatus]}
              size="small"
            />
          )}
        </Box>

        <Divider />

        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" />
          <Tab label="Ownership" />
          <Tab label="CMDB Mapping" />
          <Tab label="Drift" />
          <Tab label="Actions" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <List dense>
            <ListItem>
              <ListItemText primary="Node ID" secondary={node.node_id} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Kind" secondary={node.kind} />
            </ListItem>
            <ListItem>
              <ListItemText primary="Name" secondary={node.name} />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Namespace"
                secondary={node.namespace || 'default'}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Environment"
                secondary={node.environment || 'Not set'}
              />
            </ListItem>
            {node.extra_data && (
              <ListItem>
                <ListItemText
                  primary="Extra Data"
                  secondary={
                    <Box
                      component="pre"
                      sx={{
                        fontSize: '0.75rem',
                        bgcolor: 'grey.100',
                        p: 1,
                        borderRadius: 1,
                        overflow: 'auto',
                        maxHeight: 150,
                      }}
                    >
                      {JSON.stringify(node.extra_data, null, 2)}
                    </Box>
                  }
                />
              </ListItem>
            )}
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <List dense>
            <ListItem>
              <ListItemText
                primary="Owner"
                secondary={node.owner || 'Not assigned'}
              />
            </ListItem>
            {(() => {
              if (!isRuntime || !node.extra_data?.labels) return null;
              const labels = node.extra_data.labels as Record<string, string>;
              return (
                <ListItem>
                  <ListItemText
                    primary="Source Labels"
                    slotProps={{ secondary: { component: 'div' } }}
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        {Object.entries(labels).map(([k, v]) => (
                          <Chip
                            key={k}
                            label={`${k}: ${v}`}
                            size="small"
                            variant="outlined"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    }
                  />
                </ListItem>
              );
            })()}
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {isRuntime ? (
            <>
              {node.drift_status === 'missing_in_cmdb' ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  This runtime entity has no matching CMDB item.
                </Alert>
              ) : (
                <Alert severity="success" sx={{ mb: 2 }}>
                  This entity is mapped to a CMDB item.
                </Alert>
              )}
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Entity ID"
                    secondary={node.entity_id || 'N/A'}
                  />
                </ListItem>
              </List>
            </>
          ) : (
            <>
              {node.drift_status === 'stale_in_cmdb' ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  This CMDB item has no matching runtime entity.
                </Alert>
              ) : (
                <Alert severity="success" sx={{ mb: 2 }}>
                  This CMDB item is mapped to a runtime entity.
                </Alert>
              )}
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="CMDB Item ID"
                    secondary={node.cmdb_item_id || 'N/A'}
                  />
                </ListItem>
              </List>
            </>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {node.drift_record_id ? (
            <>
              <Alert
                severity={driftStatus ? driftStatusColors[driftStatus] : 'info'}
                sx={{ mb: 2 }}
              >
                Drift detected: {driftStatus && driftStatusLabels[driftStatus]}
              </Alert>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Drift Record ID"
                    secondary={node.drift_record_id}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Severity"
                    secondary={node.drift_severity || 'Unknown'}
                  />
                </ListItem>
              </List>
            </>
          ) : (
            <Alert severity="success">No drift detected for this node.</Alert>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {node.drift_status === 'missing_in_cmdb' && (
              <Button variant="contained" color="primary">
                Create CMDB Entry
              </Button>
            )}
            {node.drift_status === 'stale_in_cmdb' && (
              <Button variant="contained" color="error">
                Decommission CMDB Entry
              </Button>
            )}
            {node.drift_status === 'ownership_mismatch' && (
              <Button variant="contained" color="warning">
                Update CMDB Owner
              </Button>
            )}
            {node.drift_record_id && (
              <Button variant="outlined">View Drift Record</Button>
            )}
            <Button variant="outlined" color="secondary">
              View Audit Trail
            </Button>
          </Box>
        </TabPanel>
      </Box>
    </Drawer>
  );
}
