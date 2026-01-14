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
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import { PageContainer } from '../../components/layout/PageContainer';
import { useLatestGraph, useBuildGraph, useGraphSummary } from '../../api/hooks';
import type { GraphNode as GraphNodeType, GraphDriftStatus } from '../../api/types';
import InfraNode from './components/InfraNode';
import NodeDetailsPanel from './NodeDetailsPanel';

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
          ? '#f44336'
          : edge.style === 'warning'
            ? '#ff9800'
            : '#1976d2',
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
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="Infrastructure Graph">
        <Alert severity="warning" sx={{ mb: 2 }}>
          No graph data available. Build a graph from a snapshot to visualize your infrastructure.
        </Alert>
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={handleBuildGraph}
          disabled={buildGraph.isPending || !summary?.latest_snapshot_id}
        >
          {buildGraph.isPending ? 'Building...' : 'Build Graph'}
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Infrastructure Graph">
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search nodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
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
          <FormControl size="small" sx={{ minWidth: 150 }}>
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
            />
            <Chip
              label={`${graphData?.edge_count || 0} edges`}
              size="small"
              variant="outlined"
            />
          </Box>

          <Button
            size="small"
            startIcon={<RefreshIcon />}
            onClick={handleBuildGraph}
            disabled={buildGraph.isPending}
          >
            Rebuild
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ height: 600 }}>
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
        >
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const data = node.data as { graphNode?: GraphNodeType };
              if (data.graphNode?.node_type === 'runtime') return '#1976d2';
              return '#9c27b0';
            }}
          />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        </ReactFlow>
      </Paper>

      {summary && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Summary
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {Object.entries(summary.nodes_by_type).map(([type, count]) => (
              <Chip
                key={type}
                label={`${type}: ${count}`}
                size="small"
                color={type === 'runtime' ? 'primary' : 'secondary'}
                variant="outlined"
              />
            ))}
            {Object.entries(summary.nodes_by_drift_status).map(([status, count]) => (
              <Chip
                key={status}
                label={`${status}: ${count}`}
                size="small"
                color={
                  status === 'mapped'
                    ? 'success'
                    : status.includes('missing') || status.includes('stale')
                      ? 'error'
                      : 'warning'
                }
                variant="outlined"
              />
            ))}
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
