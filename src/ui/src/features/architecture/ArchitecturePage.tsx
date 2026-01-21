import { useState, useEffect, useRef, useCallback } from 'react';
import mermaid from 'mermaid';
import {
  Box,
  Paper,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  alpha,
} from '@mui/material';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { PageContainer } from '../../components/layout/PageContainer';
import { useArchitectureDiagram, useArchitectureModel, useArchitectureValidation } from '../../api/hooks';
import { NodeDetailsPanel } from './NodeDetailsPanel';
import { colors } from '../../theme/theme';

// Initialize mermaid with dark theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: colors.primary.main,
    primaryTextColor: colors.text.primary,
    primaryBorderColor: colors.primary.dark,
    lineColor: colors.text.secondary,
    secondaryColor: colors.secondary.main,
    tertiaryColor: colors.background.elevated,
    background: colors.background.paper,
    mainBkg: colors.background.paper,
    nodeBkg: colors.background.elevated,
    clusterBkg: alpha(colors.background.elevated, 0.5),
    clusterBorder: colors.divider,
    defaultLinkColor: colors.text.secondary,
    titleColor: colors.text.primary,
    edgeLabelBackground: colors.background.paper,
  },
  flowchart: {
    curve: 'basis',
    padding: 20,
  },
});

export default function ArchitecturePage() {
  const [view, setView] = useState<string>('containers');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const diagramRef = useRef<HTMLDivElement>(null);

  const { data: diagram, isLoading, error, refetch } = useArchitectureDiagram(view);
  const { data: model } = useArchitectureModel();
  const { data: validation } = useArchitectureValidation();

  const handleViewChange = (_: React.MouseEvent<HTMLElement>, newView: string | null) => {
    if (newView !== null) {
      setView(newView);
    }
  };

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  // Render Mermaid diagram
  useEffect(() => {
    const renderDiagram = async () => {
      if (diagram?.diagram && diagramRef.current) {
        diagramRef.current.innerHTML = '';

        try {
          const { svg } = await mermaid.render('architecture-diagram', diagram.diagram);
          diagramRef.current.innerHTML = svg;

          // Add click handlers to nodes
          const svgElement = diagramRef.current.querySelector('svg');
          if (svgElement && model?.nodes) {
            // Make SVG responsive
            svgElement.style.maxWidth = '100%';
            svgElement.style.height = 'auto';

            // Add click handlers to node elements
            model.nodes.forEach((node) => {
              const nodeElement = svgElement.querySelector(`[id*="${node.id}"]`);
              if (nodeElement) {
                (nodeElement as SVGElement).style.cursor = 'pointer';
                nodeElement.addEventListener('click', () => handleNodeClick(node.id));
              }
            });
          }
        } catch (err) {
          console.error('Failed to render Mermaid diagram:', err);
          if (diagramRef.current) {
            diagramRef.current.innerHTML = `<div style="color: ${colors.error.main}; padding: 20px;">Failed to render diagram</div>`;
          }
        }
      }
    };

    renderDiagram();
  }, [diagram, model, handleNodeClick]);

  if (error) {
    return (
      <PageContainer title="Architecture">
        <Alert
          severity="error"
          sx={{
            backgroundColor: alpha(colors.error.main, 0.1),
            border: `1px solid ${alpha(colors.error.main, 0.2)}`,
            '& .MuiAlert-icon': { color: colors.error.main },
          }}
        >
          Failed to load architecture diagram. Make sure the backend is running.
        </Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Architecture">
      {/* Header Controls */}
      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          background: `linear-gradient(135deg, ${alpha(colors.background.paper, 0.9)} 0%, ${alpha(colors.background.elevated, 0.8)} 100%)`,
          border: `1px solid ${colors.divider}`,
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={handleViewChange}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                color: colors.text.secondary,
                borderColor: colors.divider,
                '&.Mui-selected': {
                  color: colors.primary.light,
                  backgroundColor: alpha(colors.primary.main, 0.15),
                  borderColor: colors.primary.main,
                  '&:hover': {
                    backgroundColor: alpha(colors.primary.main, 0.25),
                  },
                },
                '&:hover': {
                  backgroundColor: alpha(colors.primary.main, 0.08),
                },
              },
            }}
          >
            <ToggleButton value="containers">
              <ViewModuleIcon sx={{ mr: 0.5, fontSize: 18 }} />
              Containers
            </ToggleButton>
            <ToggleButton value="components">
              <AccountTreeIcon sx={{ mr: 0.5, fontSize: 18 }} />
              Components
            </ToggleButton>
          </ToggleButtonGroup>

          <Box sx={{ flexGrow: 1 }} />

          {/* Stats */}
          {model && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={`${model.nodes.length} nodes`}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: colors.divider,
                  color: colors.text.secondary,
                }}
              />
              <Chip
                label={`${model.edges.length} edges`}
                size="small"
                variant="outlined"
                sx={{
                  borderColor: colors.divider,
                  color: colors.text.secondary,
                }}
              />
            </Box>
          )}

          {/* Validation Status */}
          {validation && (
            <Tooltip title={validation.valid ? 'Model is valid' : `Issues: ${validation.issues.join(', ')}`}>
              <Chip
                icon={validation.valid ? <CheckCircleIcon /> : <ErrorIcon />}
                label={validation.valid ? 'Valid' : 'Issues'}
                size="small"
                sx={{
                  backgroundColor: alpha(validation.valid ? colors.success.main : colors.warning.main, 0.15),
                  color: validation.valid ? colors.success.main : colors.warning.main,
                  border: `1px solid ${alpha(validation.valid ? colors.success.main : colors.warning.main, 0.3)}`,
                  '& .MuiChip-icon': {
                    color: validation.valid ? colors.success.main : colors.warning.main,
                  },
                }}
              />
            </Tooltip>
          )}

          <Tooltip title="Refresh diagram">
            <IconButton
              onClick={() => refetch()}
              size="small"
              sx={{
                color: colors.text.secondary,
                '&:hover': {
                  backgroundColor: alpha(colors.primary.main, 0.1),
                  color: colors.primary.light,
                },
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Diagram */}
      <Paper
        sx={{
          p: 3,
          minHeight: 500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${alpha(colors.background.paper, 0.9)} 0%, ${alpha(colors.background.elevated, 0.8)} 100%)`,
          border: `1px solid ${colors.divider}`,
          backdropFilter: 'blur(10px)',
          overflow: 'auto',
        }}
      >
        {isLoading ? (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress sx={{ color: colors.primary.main, mb: 2 }} />
            <Typography variant="body2" sx={{ color: colors.text.secondary }}>
              Loading architecture diagram...
            </Typography>
          </Box>
        ) : (
          <Box
            ref={diagramRef}
            sx={{
              width: '100%',
              '& svg': {
                maxWidth: '100%',
                height: 'auto',
              },
              '& .node rect, & .node polygon, & .node circle': {
                transition: 'all 0.2s ease-in-out',
              },
              '& .node:hover rect, & .node:hover polygon, & .node:hover circle': {
                filter: `drop-shadow(0 0 8px ${alpha(colors.primary.main, 0.5)})`,
              },
            }}
          />
        )}
      </Paper>

      {/* Legend */}
      <Paper
        sx={{
          p: 2,
          mt: 3,
          background: `linear-gradient(135deg, ${alpha(colors.background.paper, 0.9)} 0%, ${alpha(colors.background.elevated, 0.8)} 100%)`,
          border: `1px solid ${colors.divider}`,
          backdropFilter: 'blur(10px)',
        }}
      >
        <Typography variant="subtitle2" sx={{ color: colors.text.primary, fontWeight: 600, mb: 1.5 }}>
          Legend
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 24,
                height: 16,
                borderRadius: '8px',
                backgroundColor: colors.primary.main,
              }}
            />
            <Typography variant="caption" sx={{ color: colors.text.secondary }}>
              Container (Application)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 24,
                height: 16,
                borderRadius: '4px',
                backgroundColor: colors.success.main,
              }}
            />
            <Typography variant="caption" sx={{ color: colors.text.secondary }}>
              Datastore
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 24,
                height: 16,
                clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                backgroundColor: colors.secondary.main,
              }}
            />
            <Typography variant="caption" sx={{ color: colors.text.secondary }}>
              External System
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Node Details Panel */}
      <NodeDetailsPanel
        nodeId={selectedNodeId}
        onClose={() => setSelectedNodeId(null)}
      />
    </PageContainer>
  );
}
