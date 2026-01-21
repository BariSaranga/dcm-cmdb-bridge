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
  alpha,
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
import { colors } from '../../theme/theme';

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
    <Paper
      elevation={0}
      sx={{
        background: `linear-gradient(135deg, ${alpha(colors.background.paper, 0.9)} 0%, ${alpha(colors.background.elevated, 0.8)} 100%)`,
        border: `1px solid ${colors.divider}`,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${colors.divider}`,
          background: `linear-gradient(135deg, ${alpha(colors.primary.main, 0.1)} 0%, ${alpha(colors.secondary.main, 0.05)} 100%)`,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.secondary.main} 100%)`,
              display: 'flex',
              boxShadow: `0 0 20px ${alpha(colors.primary.main, 0.3)}`,
            }}
          >
            <PsychologyIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: colors.text.primary }}>
            AI Analysis
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="caption" sx={{ color: colors.text.secondary }}>
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
      <Accordion
        expanded={expanded === 'summary'}
        onChange={handleChange('summary')}
        sx={{
          backgroundColor: 'transparent',
          '&:before': { display: 'none' },
          boxShadow: 'none',
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: colors.text.secondary }} />}
          sx={{
            borderBottom: `1px solid ${colors.divider}`,
            '&:hover': { backgroundColor: alpha(colors.primary.main, 0.04) },
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <LightbulbIcon sx={{ color: colors.primary.main }} />
            <Typography sx={{ fontWeight: 600, color: colors.text.primary }}>Summary</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 2.5 }}>
          <Typography variant="body1" sx={{ color: colors.text.primary, mb: 2, lineHeight: 1.7 }}>
            {explanation.summary}
          </Typography>
          <Alert
            severity="info"
            icon={<PsychologyIcon />}
            sx={{
              backgroundColor: alpha(colors.info.main, 0.1),
              border: `1px solid ${alpha(colors.info.main, 0.2)}`,
              '& .MuiAlert-icon': { color: colors.info.main },
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: colors.text.primary }}>
              Inference
            </Typography>
            <Typography variant="body2" sx={{ color: colors.text.secondary }}>
              {explanation.inference}
            </Typography>
          </Alert>
        </AccordionDetails>
      </Accordion>

      {/* Evidence Accordion */}
      <Accordion
        expanded={expanded === 'evidence'}
        onChange={handleChange('evidence')}
        sx={{
          backgroundColor: 'transparent',
          '&:before': { display: 'none' },
          boxShadow: 'none',
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: colors.text.secondary }} />}
          sx={{
            borderBottom: `1px solid ${colors.divider}`,
            '&:hover': { backgroundColor: alpha(colors.primary.main, 0.04) },
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <DataIcon sx={{ color: colors.primary.main }} />
            <Typography sx={{ fontWeight: 600, color: colors.text.primary }}>Evidence</Typography>
            <Chip
              label={explanation.evidence.length}
              size="small"
              sx={{
                ml: 1,
                backgroundColor: alpha(colors.primary.main, 0.15),
                color: colors.primary.light,
              }}
            />
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <List disablePadding>
            {explanation.evidence.map((item, index) => (
              <Box key={index}>
                {index > 0 && <Divider sx={{ borderColor: colors.divider }} />}
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    px: 2.5,
                    py: 2,
                    '&:hover': { backgroundColor: alpha(colors.primary.main, 0.04) },
                  }}
                >
                  <ListItemIcon sx={{ mt: 0.5 }}>{getSourceIcon(item.source)}</ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2" sx={{ color: colors.text.primary }}>
                          {item.entity_type}: {item.entity_name}
                        </Typography>
                        <Chip
                          label={item.source.toUpperCase()}
                          size="small"
                          variant="outlined"
                          sx={{
                            height: 18,
                            fontSize: '0.65rem',
                            borderColor: colors.divider,
                            color: colors.text.secondary,
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                          {item.fact}
                        </Typography>
                        {Object.keys(item.data).length > 0 && (
                          <Box
                            sx={{
                              mt: 1.5,
                              p: 1.5,
                              backgroundColor: alpha(colors.background.default, 0.5),
                              border: `1px solid ${colors.divider}`,
                              borderRadius: 1,
                              fontFamily: '"Fira Code", monospace',
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
                                    sx={{ color: colors.text.secondary }}
                                  >
                                    {key}:
                                  </Typography>{' '}
                                  <Typography
                                    component="span"
                                    variant="caption"
                                    sx={{ fontWeight: 600, color: colors.primary.light }}
                                  >
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
      <Accordion
        expanded={expanded === 'risk'}
        onChange={handleChange('risk')}
        sx={{
          backgroundColor: 'transparent',
          '&:before': { display: 'none' },
          boxShadow: 'none',
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: colors.text.secondary }} />}
          sx={{
            borderBottom: `1px solid ${colors.divider}`,
            '&:hover': { backgroundColor: alpha(colors.primary.main, 0.04) },
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon
              sx={{
                color:
                  explanation.risk_level === 'critical'
                    ? colors.error.main
                    : explanation.risk_level === 'high'
                    ? colors.warning.main
                    : colors.info.main,
              }}
            />
            <Typography sx={{ fontWeight: 600, color: colors.text.primary }}>
              Why This Matters
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 2.5 }}>
          <Alert
            severity={
              explanation.risk_level === 'critical'
                ? 'error'
                : explanation.risk_level === 'high'
                ? 'warning'
                : 'info'
            }
            sx={{
              backgroundColor:
                explanation.risk_level === 'critical'
                  ? alpha(colors.error.main, 0.1)
                  : explanation.risk_level === 'high'
                  ? alpha(colors.warning.main, 0.1)
                  : alpha(colors.info.main, 0.1),
              border: `1px solid ${
                explanation.risk_level === 'critical'
                  ? alpha(colors.error.main, 0.2)
                  : explanation.risk_level === 'high'
                  ? alpha(colors.warning.main, 0.2)
                  : alpha(colors.info.main, 0.2)
              }`,
            }}
          >
            <Typography variant="body2" sx={{ color: colors.text.primary }}>
              {explanation.why_it_matters}
            </Typography>
          </Alert>

          <Box mt={3}>
            <Typography variant="subtitle2" sx={{ color: colors.text.primary, mb: 1.5 }}>
              Confidence Level
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <LinearProgress
                variant="determinate"
                value={explanation.confidence * 100}
                color={getConfidenceColor(explanation.confidence)}
                sx={{
                  flexGrow: 1,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: alpha(colors.text.primary, 0.1),
                }}
              />
              <Typography variant="body2" sx={{ fontWeight: 600, color: colors.text.primary }}>
                {Math.round(explanation.confidence * 100)}%
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: colors.text.secondary, mt: 1, display: 'block' }}>
              Based on {explanation.evidence.length} evidence points from runtime, CMDB, and drift data
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Graph Highlights */}
      {explanation.highlighted_nodes.length > 0 && (
        <Box
          sx={{
            p: 2,
            backgroundColor: alpha(colors.background.default, 0.5),
            borderTop: `1px solid ${colors.divider}`,
          }}
        >
          <Typography variant="caption" sx={{ color: colors.text.secondary }}>
            Highlighted in graph:{' '}
            {explanation.highlighted_nodes.map((node, i) => (
              <Chip
                key={i}
                label={node.split(':').slice(-1)[0]}
                size="small"
                variant="outlined"
                sx={{
                  ml: 0.5,
                  height: 18,
                  fontSize: '0.65rem',
                  borderColor: colors.divider,
                  color: colors.text.secondary,
                }}
              />
            ))}
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
