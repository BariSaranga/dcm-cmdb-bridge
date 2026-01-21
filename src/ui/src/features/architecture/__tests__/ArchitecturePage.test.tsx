import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Mock mermaid since it requires browser APIs
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: '<svg>Mock Diagram</svg>' }),
  },
}));

// Mock the API hooks
vi.mock('../../../api/hooks', () => ({
  useArchitectureDiagram: vi.fn(),
  useArchitectureModel: vi.fn(),
  useArchitectureValidation: vi.fn(),
  useArchitectureNodeDetails: vi.fn(),
}));

import ArchitecturePage from '../ArchitecturePage';
import {
  useArchitectureDiagram,
  useArchitectureModel,
  useArchitectureValidation,
  useArchitectureNodeDetails,
} from '../../../api/hooks';

const mockDiagram = {
  view: 'containers',
  format: 'mermaid',
  diagram: 'flowchart TB\n  A --> B',
};

const mockModel = {
  version: 1,
  views: [{ id: 'containers', title: 'Containers' }],
  nodes: [
    { id: 'ui', name: 'Web UI', type: 'container', tech: 'React', description: 'User interface' },
    { id: 'api', name: 'API', type: 'container', tech: 'FastAPI', description: 'REST API' },
  ],
  edges: [{ source: 'ui', target: 'api', relation: 'calls', protocol: 'https' }],
};

const mockValidation = {
  valid: true,
  issues: [],
  node_count: 2,
  edge_count: 1,
  view_count: 1,
};

function createTestWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

describe('ArchitecturePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for useArchitectureNodeDetails
    vi.mocked(useArchitectureNodeDetails).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any);
  });

  it('renders loading state', () => {
    vi.mocked(useArchitectureDiagram).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.mocked(useArchitectureModel).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);
    vi.mocked(useArchitectureValidation).mockReturnValue({
      data: undefined,
    } as any);

    render(<ArchitecturePage />, { wrapper: createTestWrapper() });

    expect(screen.getByText('Loading architecture diagram...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    vi.mocked(useArchitectureDiagram).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
      refetch: vi.fn(),
    } as any);
    vi.mocked(useArchitectureModel).mockReturnValue({
      data: undefined,
      isLoading: false,
    } as any);
    vi.mocked(useArchitectureValidation).mockReturnValue({
      data: undefined,
    } as any);

    render(<ArchitecturePage />, { wrapper: createTestWrapper() });

    expect(
      screen.getByText(/Failed to load architecture diagram/i)
    ).toBeInTheDocument();
  });

  it('renders page title', () => {
    vi.mocked(useArchitectureDiagram).mockReturnValue({
      data: mockDiagram,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.mocked(useArchitectureModel).mockReturnValue({
      data: mockModel,
      isLoading: false,
    } as any);
    vi.mocked(useArchitectureValidation).mockReturnValue({
      data: mockValidation,
    } as any);

    render(<ArchitecturePage />, { wrapper: createTestWrapper() });

    expect(screen.getByText('Architecture')).toBeInTheDocument();
  });

  it('renders view toggle buttons', () => {
    vi.mocked(useArchitectureDiagram).mockReturnValue({
      data: mockDiagram,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.mocked(useArchitectureModel).mockReturnValue({
      data: mockModel,
      isLoading: false,
    } as any);
    vi.mocked(useArchitectureValidation).mockReturnValue({
      data: mockValidation,
    } as any);

    render(<ArchitecturePage />, { wrapper: createTestWrapper() });

    expect(screen.getByRole('button', { name: /containers/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /components/i })).toBeInTheDocument();
  });

  it('renders node and edge counts', () => {
    vi.mocked(useArchitectureDiagram).mockReturnValue({
      data: mockDiagram,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.mocked(useArchitectureModel).mockReturnValue({
      data: mockModel,
      isLoading: false,
    } as any);
    vi.mocked(useArchitectureValidation).mockReturnValue({
      data: mockValidation,
    } as any);

    render(<ArchitecturePage />, { wrapper: createTestWrapper() });

    expect(screen.getByText('2 nodes')).toBeInTheDocument();
    expect(screen.getByText('1 edges')).toBeInTheDocument();
  });

  it('renders validation status', () => {
    vi.mocked(useArchitectureDiagram).mockReturnValue({
      data: mockDiagram,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.mocked(useArchitectureModel).mockReturnValue({
      data: mockModel,
      isLoading: false,
    } as any);
    vi.mocked(useArchitectureValidation).mockReturnValue({
      data: mockValidation,
    } as any);

    render(<ArchitecturePage />, { wrapper: createTestWrapper() });

    expect(screen.getByText('Valid')).toBeInTheDocument();
  });

  it('renders legend section', () => {
    vi.mocked(useArchitectureDiagram).mockReturnValue({
      data: mockDiagram,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);
    vi.mocked(useArchitectureModel).mockReturnValue({
      data: mockModel,
      isLoading: false,
    } as any);
    vi.mocked(useArchitectureValidation).mockReturnValue({
      data: mockValidation,
    } as any);

    render(<ArchitecturePage />, { wrapper: createTestWrapper() });

    expect(screen.getByText('Legend')).toBeInTheDocument();
    expect(screen.getByText('Container (Application)')).toBeInTheDocument();
    expect(screen.getByText('Datastore')).toBeInTheDocument();
    expect(screen.getByText('External System')).toBeInTheDocument();
  });
});
