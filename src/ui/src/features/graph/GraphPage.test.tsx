import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test/utils';
import GraphPage from './GraphPage';
import * as hooks from '../../api/hooks';

vi.mock('../../api/hooks');
vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react');
  return {
    ...actual,
    ReactFlow: ({ onNodeClick, nodes }: any) => (
      <div data-testid="react-flow">
        {nodes?.map((node: any) => (
          <div
            key={node.id}
            data-testid={`node-${node.id}`}
            onClick={(e) => onNodeClick?.(e, node)}
          >
            {node.data.graphNode.name}
          </div>
        ))}
      </div>
    ),
    Controls: () => <div>Controls</div>,
    MiniMap: () => <div>MiniMap</div>,
    Background: () => <div>Background</div>,
    useNodesState: (initialNodes: any) => [initialNodes, vi.fn(), vi.fn()],
    useEdgesState: (initialEdges: any) => [initialEdges, vi.fn(), vi.fn()],
    BackgroundVariant: { Dots: 'dots' },
  };
});

describe('GraphPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    vi.spyOn(hooks, 'useLatestGraph').mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.spyOn(hooks, 'useGraphSummary').mockReturnValue({
      data: undefined,
    } as any);
    vi.spyOn(hooks, 'useBuildGraph').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderWithProviders(<GraphPage />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders no data state with build button', () => {
    vi.spyOn(hooks, 'useLatestGraph').mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('No data'),
      refetch: vi.fn(),
    } as any);
    vi.spyOn(hooks, 'useGraphSummary').mockReturnValue({
      data: { latest_snapshot_id: 1 },
    } as any);
    vi.spyOn(hooks, 'useBuildGraph').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderWithProviders(<GraphPage />);
    expect(
      screen.getByText(/No graph data available/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Build Graph/i })).toBeInTheDocument();
  });

  it('renders graph with nodes and edges', async () => {
    const mockGraphData = {
      id: 1,
      nodes: [
        {
          id: 1,
          node_id: 'node-1',
          node_type: 'runtime' as const,
          name: 'my-service',
          kind: 'Service',
          namespace: 'default',
          owner: 'team-a',
          environment: 'prod',
          drift_status: 'mapped' as const,
          drift_severity: null,
          entity_id: 1,
          cmdb_item_id: null,
          drift_record_id: null,
          position_x: null,
          position_y: null,
          extra_data: null,
        },
        {
          id: 2,
          node_id: 'node-2',
          node_type: 'cmdb' as const,
          name: 'cmdb-service',
          kind: 'CI',
          namespace: null,
          owner: 'team-a',
          environment: 'prod',
          drift_status: null,
          drift_severity: null,
          entity_id: null,
          cmdb_item_id: 1,
          drift_record_id: null,
          position_x: null,
          position_y: null,
          extra_data: null,
        },
      ],
      edges: [
        {
          id: 1,
          edge_id: 'edge-1',
          edge_type: 'mapped_to',
          source_node_id: 'node-1',
          target_node_id: 'node-2',
          label: 'mapped',
          style: null,
          extra_data: null,
        },
      ],
      node_count: 2,
      edge_count: 1,
      snapshot_id: 1,
      status: 'completed' as const,
      error_message: null,
      created_at: '2026-01-01T00:00:00Z',
      completed_at: '2026-01-01T00:01:00Z',
    };

    const mockSummary = {
      total_snapshots: 1,
      latest_snapshot_id: 1,
      latest_node_count: 2,
      latest_edge_count: 1,
      nodes_by_type: { runtime: 1, cmdb: 1 },
      nodes_by_drift_status: { mapped: 1 },
    };

    vi.spyOn(hooks, 'useLatestGraph').mockReturnValue({
      data: mockGraphData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.spyOn(hooks, 'useGraphSummary').mockReturnValue({
      data: mockSummary,
    } as any);
    vi.spyOn(hooks, 'useBuildGraph').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderWithProviders(<GraphPage />);

    await waitFor(() => {
      expect(screen.getByText('Infrastructure Graph')).toBeInTheDocument();
      expect(screen.getByText('2 nodes')).toBeInTheDocument();
      expect(screen.getByText('1 edges')).toBeInTheDocument();
      expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    });
  });

  it('filters nodes by search term', async () => {
    const mockGraphData = {
      id: 1,
      nodes: [
        {
          id: 1,
          node_id: 'node-1',
          node_type: 'runtime' as const,
          name: 'my-service',
          kind: 'Service',
          namespace: 'default',
          owner: null,
          environment: null,
          drift_status: null,
          drift_severity: null,
          entity_id: 1,
          cmdb_item_id: null,
          drift_record_id: null,
          position_x: null,
          position_y: null,
          extra_data: null,
        },
        {
          id: 2,
          node_id: 'node-2',
          node_type: 'runtime' as const,
          name: 'other-service',
          kind: 'Service',
          namespace: 'default',
          owner: null,
          environment: null,
          drift_status: null,
          drift_severity: null,
          entity_id: 2,
          cmdb_item_id: null,
          drift_record_id: null,
          position_x: null,
          position_y: null,
          extra_data: null,
        },
      ],
      edges: [],
      node_count: 2,
      edge_count: 0,
      snapshot_id: 1,
      status: 'completed' as const,
      error_message: null,
      created_at: '2026-01-01T00:00:00Z',
      completed_at: '2026-01-01T00:01:00Z',
    };

    vi.spyOn(hooks, 'useLatestGraph').mockReturnValue({
      data: mockGraphData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.spyOn(hooks, 'useGraphSummary').mockReturnValue({
      data: undefined,
    } as any);
    vi.spyOn(hooks, 'useBuildGraph').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    const user = userEvent.setup();
    renderWithProviders(<GraphPage />);

    const searchInput = screen.getByPlaceholderText('Search nodes...');
    await user.type(searchInput, 'my-service');

    await waitFor(() => {
      expect(screen.getByTestId('node-node-1')).toBeInTheDocument();
      expect(screen.queryByTestId('node-node-2')).not.toBeInTheDocument();
    });
  });

  it('has node type filter', () => {
    const mockGraphData = {
      id: 1,
      nodes: [],
      edges: [],
      node_count: 0,
      edge_count: 0,
      snapshot_id: 1,
      status: 'completed' as const,
      error_message: null,
      created_at: '2026-01-01T00:00:00Z',
      completed_at: '2026-01-01T00:01:00Z',
    };

    vi.spyOn(hooks, 'useLatestGraph').mockReturnValue({
      data: mockGraphData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.spyOn(hooks, 'useGraphSummary').mockReturnValue({
      data: undefined,
    } as any);
    vi.spyOn(hooks, 'useBuildGraph').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderWithProviders(<GraphPage />);

    // Verify node type filter label exists
    expect(screen.getByText('Node Type')).toBeInTheDocument();
  });

  it('has drift status filter', () => {
    const mockGraphData = {
      id: 1,
      nodes: [],
      edges: [],
      node_count: 0,
      edge_count: 0,
      snapshot_id: 1,
      status: 'completed' as const,
      error_message: null,
      created_at: '2026-01-01T00:00:00Z',
      completed_at: '2026-01-01T00:01:00Z',
    };

    vi.spyOn(hooks, 'useLatestGraph').mockReturnValue({
      data: mockGraphData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.spyOn(hooks, 'useGraphSummary').mockReturnValue({
      data: undefined,
    } as any);
    vi.spyOn(hooks, 'useBuildGraph').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderWithProviders(<GraphPage />);

    // Verify drift status filter label exists (getAllByText since it may appear multiple times)
    expect(screen.getAllByText('Drift Status')[0]).toBeInTheDocument();
  });

  it('displays summary with node counts by type and drift status', async () => {
    const mockSummary = {
      total_snapshots: 1,
      latest_snapshot_id: 1,
      latest_node_count: 5,
      latest_edge_count: 3,
      nodes_by_type: { runtime: 3, cmdb: 2 },
      nodes_by_drift_status: { mapped: 2, missing_in_cmdb: 1 },
    };

    vi.spyOn(hooks, 'useLatestGraph').mockReturnValue({
      data: {
        id: 1,
        nodes: [],
        edges: [],
        node_count: 5,
        edge_count: 3,
        snapshot_id: 1,
        status: 'completed',
        error_message: null,
        created_at: '2026-01-01T00:00:00Z',
        completed_at: '2026-01-01T00:01:00Z',
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.spyOn(hooks, 'useGraphSummary').mockReturnValue({
      data: mockSummary,
    } as any);
    vi.spyOn(hooks, 'useBuildGraph').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderWithProviders(<GraphPage />);

    await waitFor(() => {
      expect(screen.getByText('Summary')).toBeInTheDocument();
      expect(screen.getByText('runtime: 3')).toBeInTheDocument();
      expect(screen.getByText('cmdb: 2')).toBeInTheDocument();
      expect(screen.getByText('mapped: 2')).toBeInTheDocument();
      expect(screen.getByText('missing_in_cmdb: 1')).toBeInTheDocument();
    });
  });

  it('has rebuild button', () => {
    vi.spyOn(hooks, 'useLatestGraph').mockReturnValue({
      data: {
        id: 1,
        nodes: [],
        edges: [],
        node_count: 0,
        edge_count: 0,
        snapshot_id: 1,
        status: 'completed',
        error_message: null,
        created_at: '2026-01-01T00:00:00Z',
        completed_at: '2026-01-01T00:01:00Z',
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.spyOn(hooks, 'useGraphSummary').mockReturnValue({
      data: {
        latest_snapshot_id: 1,
        total_snapshots: 1,
        latest_node_count: 0,
        latest_edge_count: 0,
        nodes_by_type: {},
        nodes_by_drift_status: {},
      },
    } as any);
    vi.spyOn(hooks, 'useBuildGraph').mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderWithProviders(<GraphPage />);

    expect(screen.getByRole('button', { name: /Rebuild/i })).toBeInTheDocument();
  });
});
