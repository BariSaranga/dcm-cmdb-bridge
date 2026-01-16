import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  Lightbulb as LightbulbIcon,
  DataObject as DataIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import type { AIExplanation } from '../../api/hooks';

interface AIExplanationPanelProps {
  explanation: AIExplanation;
}

export function AIExplanationPanel({ explanation }: AIExplanationPanelProps) {
  const [expanded, setExpanded] = useState<string | false>('summary');

  const handleChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'success';
    if (confidence >= 0.7) return 'info';
    if (confidence >= 0.5) return 'warning';
    return 'error';
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'runtime':
        return <DataIcon color="info" />;
      case 'cmdb':
        return <DataIcon color="secondary" />;
      case 'drift':
        return <WarningIcon color="warning" />;
      case 'audit':
        return <CheckIcon color="success" />;
      default:
        return <DataIcon />;
    }
  };

  return (
    <Paper elevation={2}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          backgroundColor: 'grey.50',
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <PsychologyIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">
            AI Analysis
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="caption" color="text.secondary">
              Confidence:
            </Typography>
            <Chip
              label={`${Math.round(explanation.confidence * 100)}%`}
              size="small"
              color={getConfidenceColor(explanation.confidence)}
            />
          </Box>
          <Chip
            label={`Risk: ${explanation.risk_level.toUpperCase()}`}
            size="small"
            color={
              explanation.risk_level === 'critical'
                ? 'error'
                : explanation.risk_level === 'high'
                ? 'warning'
                : 'info'
            }
          />
        </Box>
      </Box>

      {/* Summary Accordion */}
      <Accordion expanded={expanded === 'summary'} onChange={handleChange('summary')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <LightbulbIcon color="primary" />
            <Typography fontWeight="bold">Summary</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="body1" paragraph>
            {explanation.summary}
          </Typography>
          <Alert severity="info" icon={<PsychologyIcon />}>
            <Typography variant="body2" fontWeight="bold">
              Inference
            </Typography>
            <Typography variant="body2">{explanation.inference}</Typography>
          </Alert>
        </AccordionDetails>
      </Accordion>

      {/* Evidence Accordion */}
      <Accordion expanded={expanded === 'evidence'} onChange={handleChange('evidence')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <DataIcon color="primary" />
            <Typography fontWeight="bold">Evidence</Typography>
            <Chip label={explanation.evidence.length} size="small" sx={{ ml: 1 }} />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <List disablePadding>
            {explanation.evidence.map((item, index) => (
              <Box key={index}>
                {index > 0 && <Divider />}
                <ListItem alignItems="flex-start">
                  <ListItemIcon>{getSourceIcon(item.source)}</ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2">
                          {item.entity_type}: {item.entity_name}
                        </Typography>
                        <Chip
                          label={item.source.toUpperCase()}
                          size="small"
                          variant="outlined"
                          sx={{ height: 18, fontSize: '0.65rem' }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          {item.fact}
                        </Typography>
                        {Object.keys(item.data).length > 0 && (
                          <Box
                            sx={{
                              mt: 1,
                              p: 1,
                              backgroundColor: 'grey.100',
                              borderRadius: 1,
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                            }}
                          >
                            {Object.entries(item.data)
                              .filter(([_, v]) => v !== null && v !== undefined)
                              .map(([key, value]) => (
                                <Box key={key}>
                                  <Typography
                                    component="span"
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {key}:
                                  </Typography>{' '}
                                  <Typography component="span" variant="caption" fontWeight="bold">
                                    {typeof value === 'object'
                                      ? JSON.stringify(value)
                                      : String(value)}
                                  </Typography>
                                </Box>
                              ))}
                          </Box>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        </AccordionDetails>
      </Accordion>

      {/* Risk Assessment Accordion */}
      <Accordion expanded={expanded === 'risk'} onChange={handleChange('risk')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon
              color={
                explanation.risk_level === 'critical'
                  ? 'error'
                  : explanation.risk_level === 'high'
                  ? 'warning'
                  : 'info'
              }
            />
            <Typography fontWeight="bold">Why This Matters</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Alert
            severity={
              explanation.risk_level === 'critical'
                ? 'error'
                : explanation.risk_level === 'high'
                ? 'warning'
                : 'info'
            }
          >
            <Typography variant="body2">{explanation.why_it_matters}</Typography>
          </Alert>

          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              Confidence Level
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <LinearProgress
                variant="determinate"
                value={explanation.confidence * 100}
                color={getConfidenceColor(explanation.confidence)}
                sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
              />
              <Typography variant="body2" fontWeight="bold">
                {Math.round(explanation.confidence * 100)}%
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              Based on {explanation.evidence.length} evidence points from runtime, CMDB, and drift
              data
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Graph Highlights */}
      {explanation.highlighted_nodes.length > 0 && (
        <Box sx={{ p: 2, backgroundColor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Highlighted in graph:{' '}
            {explanation.highlighted_nodes.map((node, i) => (
              <Chip
                key={i}
                label={node.split(':').slice(-1)[0]}
                size="small"
                variant="outlined"
                sx={{ ml: 0.5, height: 18, fontSize: '0.65rem' }}
              />
            ))}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
