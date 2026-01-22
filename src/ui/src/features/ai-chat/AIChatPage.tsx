import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  alpha,
  Chip,
  Avatar,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { PageContainer } from '../../components/layout';
import { colors } from '../../theme/theme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  'What services are missing from CMDB?',
  'Show me critical drift issues',
  'Which services have no owner?',
  'Summarize infrastructure health',
];

export function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm your Infrastructure AI Assistant. I can help you understand your infrastructure drift, analyze CMDB gaps, and provide insights about your services.

Try asking me questions like:
- "What services are running but not in CMDB?"
- "Which services have the highest risk?"
- "Tell me about payment-service"

How can I help you today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const responses: Record<string, string> = {
        'missing': `Based on my analysis of your infrastructure:

**Services Missing from CMDB:**
1. **payment-service** (production) - Running for 240 days without CMDB entry
   - Risk: High - No ownership tracking
   - Publicly exposed via ingress

2. **monitoring-agent** (production) - Recently discovered
   - Risk: Medium - Automated deployment

**Recommendation:** Create CMDB entries for these services to ensure proper governance and ownership tracking.`,
        'critical': `**Critical Drift Issues Found:**

1. **payment-service-public** (Ingress)
   - Severity: CRITICAL
   - Issue: Publicly exposed without TLS encryption
   - Risk: Data in transit is unencrypted

2. **payment-service** (Deployment)
   - Severity: HIGH
   - Issue: No owner assigned, missing from CMDB
   - Running in production for 8 months untracked

**Immediate Actions Required:**
- Enable TLS on the payment-service ingress
- Assign ownership and create CMDB entry`,
        'owner': `**Services Without Ownership:**

| Service | Namespace | Days Running | Risk |
|---------|-----------|--------------|------|
| payment-service | production | 240 | High |
| payment-service-public | production | 240 | Critical |

These services lack the standard \`team\` or \`owner\` labels. This makes incident response difficult and creates compliance gaps.

**Recommendation:** Add ownership labels using:
\`\`\`yaml
metadata:
  labels:
    team: <team-name>
    owner: <owner-email>
\`\`\``,
        'health': `**Infrastructure Health Summary:**

📊 **Overall Status:** ⚠️ Needs Attention

**Drift Overview:**
- Open Drifts: 3
- Critical Issues: 1
- High Severity: 2
- Pending Actions: 2

**Key Concerns:**
1. Shadow IT detected (payment-service)
2. Security vulnerability (missing TLS)
3. Ownership gaps in production

**Positive Notes:**
- auth-service and api-gateway are well-managed
- CMDB coverage for core services is good

**Next Steps:**
1. Address critical security drift
2. Create CMDB entries for shadow IT
3. Assign owners to orphaned services`,
      };

      let response = `I understand you're asking about "${userMessage.content}".

Based on the current infrastructure data, I can help you explore:
- Drift records and their severity
- CMDB coverage gaps
- Service ownership
- Infrastructure graph relationships

Could you be more specific about what you'd like to know?`;

      // Simple keyword matching for demo
      const lowerContent = userMessage.content.toLowerCase();
      if (lowerContent.includes('missing') || lowerContent.includes('cmdb')) {
        response = responses['missing'];
      } else if (lowerContent.includes('critical') || lowerContent.includes('drift')) {
        response = responses['critical'];
      } else if (lowerContent.includes('owner') || lowerContent.includes('ownership')) {
        response = responses['owner'];
      } else if (lowerContent.includes('health') || lowerContent.includes('summary') || lowerContent.includes('status')) {
        response = responses['health'];
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (question: string) => {
    setInput(question);
  };

  return (
    <PageContainer
      title="AI Assistant"
      actions={
        <Chip
          icon={<AutoAwesomeIcon />}
          label="Powered by AI"
          size="small"
          sx={{
            background: `linear-gradient(135deg, ${alpha(colors.primary.main, 0.2)} 0%, ${alpha(colors.secondary.main, 0.2)} 100%)`,
            border: `1px solid ${alpha(colors.primary.main, 0.3)}`,
            color: colors.primary.light,
          }}
        />
      }
    >
      <Paper
        sx={{
          height: 'calc(100vh - 180px)',
          display: 'flex',
          flexDirection: 'column',
          background: `linear-gradient(135deg, ${alpha(colors.background.paper, 0.9)} 0%, ${alpha(colors.background.elevated, 0.8)} 100%)`,
          border: `1px solid ${colors.divider}`,
          overflow: 'hidden',
        }}
      >
        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'flex-start',
                flexDirection: message.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor:
                    message.role === 'assistant'
                      ? alpha(colors.primary.main, 0.2)
                      : alpha(colors.secondary.main, 0.2),
                  border: `1px solid ${
                    message.role === 'assistant'
                      ? alpha(colors.primary.main, 0.3)
                      : alpha(colors.secondary.main, 0.3)
                  }`,
                }}
              >
                {message.role === 'assistant' ? (
                  <SmartToyIcon sx={{ fontSize: 20, color: colors.primary.light }} />
                ) : (
                  <PersonIcon sx={{ fontSize: 20, color: colors.secondary.light }} />
                )}
              </Avatar>
              <Box
                sx={{
                  maxWidth: '70%',
                  p: 2,
                  borderRadius: 2,
                  backgroundColor:
                    message.role === 'assistant'
                      ? alpha(colors.background.elevated, 0.8)
                      : alpha(colors.primary.main, 0.15),
                  border: `1px solid ${
                    message.role === 'assistant'
                      ? colors.divider
                      : alpha(colors.primary.main, 0.3)
                  }`,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: colors.text.primary,
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.7,
                    '& strong': {
                      color: colors.primary.light,
                    },
                    '& code': {
                      backgroundColor: alpha(colors.background.default, 0.5),
                      padding: '2px 6px',
                      borderRadius: 1,
                      fontFamily: '"Fira Code", monospace',
                      fontSize: '0.85em',
                    },
                  }}
                  dangerouslySetInnerHTML={{
                    __html: message.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/`([^`]+)`/g, '<code>$1</code>')
                      .replace(/\n/g, '<br/>'),
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: colors.text.disabled,
                    display: 'block',
                    mt: 1,
                  }}
                >
                  {message.timestamp.toLocaleTimeString()}
                </Typography>
              </Box>
            </Box>
          ))}

          {isLoading && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: alpha(colors.primary.main, 0.2),
                  border: `1px solid ${alpha(colors.primary.main, 0.3)}`,
                }}
              >
                <SmartToyIcon sx={{ fontSize: 20, color: colors.primary.light }} />
              </Avatar>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  backgroundColor: alpha(colors.background.elevated, 0.8),
                  border: `1px solid ${colors.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <CircularProgress size={16} sx={{ color: colors.primary.main }} />
                <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                  Analyzing...
                </Typography>
              </Box>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Box>

        {/* Suggestions */}
        {messages.length === 1 && (
          <Box
            sx={{
              px: 3,
              pb: 2,
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
            }}
          >
            {SUGGESTED_QUESTIONS.map((question) => (
              <Chip
                key={question}
                label={question}
                size="small"
                onClick={() => handleSuggestionClick(question)}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: alpha(colors.primary.main, 0.1),
                  border: `1px solid ${alpha(colors.primary.main, 0.2)}`,
                  color: colors.text.secondary,
                  '&:hover': {
                    backgroundColor: alpha(colors.primary.main, 0.2),
                    color: colors.text.primary,
                  },
                }}
              />
            ))}
          </Box>
        )}

        {/* Input Area */}
        <Box
          sx={{
            p: 2,
            borderTop: `1px solid ${colors.divider}`,
            backgroundColor: alpha(colors.background.default, 0.5),
          }}
        >
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Ask about your infrastructure..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: colors.background.paper,
                },
              }}
            />
            <IconButton
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              sx={{
                p: 1.5,
                backgroundColor: colors.primary.main,
                color: '#fff',
                '&:hover': {
                  backgroundColor: colors.primary.dark,
                  boxShadow: `0 0 20px ${alpha(colors.primary.main, 0.4)}`,
                },
                '&:disabled': {
                  backgroundColor: alpha(colors.primary.main, 0.3),
                  color: alpha('#fff', 0.5),
                },
              }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>
    </PageContainer>
  );
}
