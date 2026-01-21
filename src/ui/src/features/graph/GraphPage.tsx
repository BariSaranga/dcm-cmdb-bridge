import { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type NodeTypes,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Box,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Button,
  alpha,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { PageContainer } from '../../components/layout/PageContainer';
import { useLatestGraph, useBuildGraph, useGraphSummary } from '../../api/hooks';
import type { GraphNode as GraphNodeType, GraphDriftStatus } from '../../api/types';
import InfraNode from './components/InfraNode';
import NodeDetailsPanel from './NodeDetailsPanel';
import { colors } from '../../theme/theme';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: NodeTypes = { infraNode: InfraNode as any };

const driftStatusOptions: { value: GraphDriftStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'mapped', label: 'Mapped' },
  { value: 'missing_in_cmdb', label: 'Missing in CMDB' },
  { value: 'stale_in_cmdb', label: 'Stale in CMDB' },
  { value: 'ownership_mismatch', label: 'Owner Mismatch' },
  { value: 'config_mismatch', label: 'Config Mismatch' },
];

const nodeTypeOptions = [
  { value: 'all', label: 'All' },
  { value: 'runtime', label: 'Runtime' },
  { value: 'cmdb', label: 'CMDB' },
];

function layoutNodes(graphNodes: GraphNodeType[]): Node[] {
  const runtimeNodes = graphNodes.filter((n) => n.node_type === 'runtime');
  const cmdbNodes = graphNodes.filter((n) => n.node_type === 'cmdb');

  const nodes: Node[] = [];
  const xSpacing = 250;
  const runtimeY = 50;
  const cmdbY = 300;

  runtimeNodes.forEach((node, idx) => {
    nodes.push({
      id: node.node_id,
      type: 'infraNode',
      position: { x: 50 + idx * xSpacing, y: runtimeY },
      data: { graphNode: node },
    });
  });

  cmdbNodes.forEach((node, idx) => {
    nodes.push({
      id: node.node_id,
      type: 'infraNode',
      position: { x: 50 + idx * xSpacing, y: cmdbY },
      data: { graphNode: node },
    });
  });

  return nodes;
}

function convertEdges(
  graphEdges: { edge_id: string; source_node_id: string; target_node_id: string; style?: string | null }[]
): Edge[] {
  return graphEdges.map((edge) => ({
    id: edge.edge_id,
    source: edge.source_node_id,
    target: edge.target_node_id,
    animated: edge.style === 'warning' || edge.style === 'error',
    style: {
      stroke:
        edge.style === 'error'
          ? colors.error.main
          : edge.style === 'warning'
            ? colors.warning.main
            : colors.primary.main,
      strokeWidth: 2,
    },
  }));
}

export default function GraphPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [nodeTypeFilter, setNodeTypeFilter] = useState<string>('all');
  const [driftFilter, setDriftFilter] = useState<string>('all');
  const [selectedNode, setSelectedNode] = useState<GraphNodeType | null>(null);

  const { data: graphData, isLoading, error, refetch } = useLatestGraph();
  const { data: summary } = useGraphSummary();
  const buildGraph = useBuildGraph();

  const filteredNodes = useMemo(() => {
    if (!graphData?.nodes) return [];

    return graphData.nodes.filter((node) => {
      const matchesSearch =
        !searchTerm ||
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.namespace?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType =
        nodeTypeFilter === 'all' || node.node_type === nodeTypeFilter;

      const matchesDrift =
        driftFilter === 'all' || node.drift_status === driftFilter;

      return matchesSearch && matchesType && matchesDrift;
    });
  }, [graphData?.nodes, searchTerm, nodeTypeFilter, driftFilter]);

  const filteredEdges = useMemo(() => {
    if (!graphData?.edges) return [];
    const nodeIds = new Set(filteredNodes.map((n) => n.node_id));
    return graphData.edges.filter(
      (e) => nodeIds.has(e.source_node_id) && nodeIds.has(e.target_node_id)
    );
  }, [graphData?.edges, filteredNodes]);

  const [nodes, setNodes, onNodesChange] = useNodesState(
    layoutNodes(filteredNodes)
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    convertEdges(filteredEdges)
  );

  // Update nodes when filtered data changes
  useMemo(() => {
    setNodes(layoutNodes(filteredNodes));
    setEdges(convertEdges(filteredEdges));
  }, [filteredNodes, filteredEdges, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const graphNode = graphData?.nodes.find((n) => n.node_id === node.id);
      if (graphNode) {
        setSelectedNode(graphNode);
      }
    },
    [graphData?.nodes]
  );

  const handleBuildGraph = async () => {
    if (summary?.latest_snapshot_id) {
      await buildGraph.mutateAsync(summary.latest_snapshot_id);
      refetch();
    }
  };

  const selectStyles = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: alpha(colors.background.elevated, 0.5),
      '& fieldset': {
        borderColor: colors.divider,
      },
      '&:hover fieldset': {
        borderColor: alpha(colors.primary.main, 0.5),
      },
      '&.Mui-focused fieldset': {
        borderColor: colors.primary.main,
      },
    },
    '& .MuiInputLabel-root': {
      color: colors.text.secondary,
    },
    '& .MuiSelect-select': {
      color: colors.text.primary,
    },
  };

  if (isLoading) {
    return (
      <PageContainer title="Infrastructure Graph">
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 400,
          }}
        >
          <CircularProgress sx={{ color: colors.primary.main }} />
        </Box>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Infrastructure Graph">
        <Alert
          severity="warning"
          sx={{
            mb: 2,
            backgroundColor: alpha(colors.warning.main, 0.1),
            border: `1px solid ${alpha(colors.warning.main, 0.2)}`,
            '& .MuiAlert-icon': { color: colors.warning.main },
          }}
        >
          No graph data available. Build a graph from a snapshot to visualize your infrastructure.
        </Alert>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={handleBuildGraph}
          disabled={buildGraph.isPending || !summary?.latest_snapshot_id}
          sx={{
            backgroundColor: colors.primary.main,
            '&:hover': {
              backgroundColor: colors.primary.dark,
              boxShadow: `0 0 20px ${alpha(colors.primary.main, 0.4)}`,
            },
          }}
        >
          {buildGraph.isPending ? 'Building...' : 'Build Graph'}
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Infrastructure Graph">
      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          background: `linear-gradient(135deg, ${alpha(colors.background.paper, 0.9)} 0%, ${alpha(colors.background.elevated, 0.8)} 100%)`,
          border: `1px solid ${colors.divider}`,
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                backgroundColor: alpha(colors.background.elevated, 0.5),
                '& fieldset': {
                  borderColor: colors.divider,
                },
                '&:hover fieldset': {
                  borderColor: alpha(colors.primary.main, 0.5),
                },
                '&.Mui-focused fieldset': {
                  borderColor: colors.primary.main,
                },
              },
              '& .MuiInputBase-input': {
                color: colors.text.primary,
              },
            }}
          />
          <FormControl size="small" sx={{ minWidth: 120, ...selectStyles }}>
            <InputLabel>Node Type</InputLabel>
            <Select
              value={nodeTypeFilter}
              label="Node Type"
              onChange={(e) => setNodeTypeFilter(e.target.value)}
            >
              {nodeTypeOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 150, ...selectStyles }}>
            <InputLabel>Drift Status</InputLabel>
            <Select
              value={driftFilter}
              label="Drift Status"
              onChange={(e) => setDriftFilter(e.target.value)}
            >
              {driftStatusOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={`${graphData?.node_count || 0} nodes`}
              size="small"
              variant="outlined"
              sx={{
                borderColor: colors.divider,
                color: colors.text.secondary,
              }}
            />
            <Chip
              label={`${graphData?.edge_count || 0} edges`}
              size="small"
              variant="outlined"
              sx={{
                borderColor: colors.divider,
                color: colors.text.secondary,
              }}
            />
          </Box>

          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={handleBuildGraph}
            disabled={buildGraph.isPending}
            sx={{
              color: colors.primary.light,
              '&:hover': {
                backgroundColor: alpha(colors.primary.main, 0.1),
              },
            }}
          >
            Rebuild
          </Button>
        </Box>
      </Paper>

      <Paper
        sx={{
          height: 600,
          background: `linear-gradient(135deg, ${alpha(colors.background.paper, 0.9)} 0%, ${alpha(colors.background.elevated, 0.8)} 100%)`,
          border: `1px solid ${colors.divider}`,
          overflow: 'hidden',
        }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange as OnNodesChange<Node>}
          onEdgesChange={onEdgesChange as OnEdgesChange<Edge>}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.1}
          maxZoom={2}
          style={{ background: colors.background.default }}
        >
          <Controls
            style={{
              backgroundColor: colors.background.elevated,
              borderColor: colors.divider,
            }}
          />
          <MiniMap
            nodeColor={(node) => {
              const data = node.data as { graphNode?: GraphNodeType };
              if (data.graphNode?.node_type === 'runtime') return colors.primary.main;
              return colors.secondary.main;
            }}
            style={{
              backgroundColor: alpha(colors.background.elevated, 0.9),
              border: `1px solid ${colors.divider}`,
            }}
          />
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color={alpha(colors.text.disabled, 0.3)}
          />
        </ReactFlow>
      </Paper>

      {summary && (
        <Paper
          sx={{
            p: 2.5,
            mt: 3,
            background: `linear-gradient(135deg, ${alpha(colors.background.paper, 0.9)} 0%, ${alpha(colors.background.elevated, 0.8)} 100%)`,
            border: `1px solid ${colors.divider}`,
            backdropFilter: 'blur(10px)',
          }}
        >
          <Typography variant="subtitle2" gutterBottom sx={{ color: colors.text.primary, fontWeight: 600 }}>
            Summary
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            {Object.entries(summary.nodes_by_type).map(([type, count]) => (
              <Chip
                key={type}
                label={`${type}: ${count}`}
                size="small"
                sx={{
                  backgroundColor: alpha(type === 'runtime' ? colors.primary.main : colors.secondary.main, 0.15),
                  color: type === 'runtime' ? colors.primary.light : colors.secondary.light,
                  border: `1px solid ${alpha(type === 'runtime' ? colors.primary.main : colors.secondary.main, 0.3)}`,
                }}
              />
            ))}
            {Object.entries(summary.nodes_by_drift_status).map(([status, count]) => {
              const isGood = status === 'mapped';
              const isBad = status.includes('missing') || status.includes('stale');
              const statusColor = isGood ? colors.success.main : isBad ? colors.error.main : colors.warning.main;
              return (
                <Chip
                  key={status}
                  label={`${status}: ${count}`}
                  size="small"
                  sx={{
                    backgroundColor: alpha(statusColor, 0.15),
                    color: statusColor,
                    border: `1px solid ${alpha(statusColor, 0.3)}`,
                  }}
                />
              );
            })}
          </Box>
        </Paper>
      )}

      <NodeDetailsPanel
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
      />
    </PageContainer>
  );
}
