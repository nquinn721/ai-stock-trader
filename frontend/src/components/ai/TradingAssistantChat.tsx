import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  IconButton,
  Typography,
  List,
  ListItem,
  Paper,
  Avatar,
  Chip,
  CircularProgress,
  Divider,
  Button,
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as AIIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  ShowChart as ShowChartIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: Date;
  confidence?: number;
  sources?: string[];
  actions?: SuggestedAction[];
}

interface SuggestedAction {
  type: 'VIEW_STOCK' | 'PLACE_ORDER' | 'ADJUST_PORTFOLIO' | 'VIEW_ANALYSIS';
  symbol?: string;
  parameters?: Record<string, any>;
  description: string;
}

interface AssistantResponse {
  response: string;
  confidence: number;
  sources?: string[];
  context?: Record<string, any>;
  actions?: SuggestedAction[];
}

const ChatContainer = styled(Box)(({ theme }) => ({
  height: '600px',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
}));

const ChatHistory = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.default,
}));

const MessageBubble = styled(Paper)<{ isUser: boolean }>(({ theme, isUser }) => ({
  padding: theme.spacing(1, 2),
  margin: theme.spacing(0.5, 0),
  maxWidth: '80%',
  alignSelf: isUser ? 'flex-end' : 'flex-start',
  backgroundColor: isUser ? theme.palette.primary.main : theme.palette.grey[100],
  color: isUser ? theme.palette.primary.contrastText : theme.palette.text.primary,
  borderRadius: isUser 
    ? '18px 18px 4px 18px' 
    : '18px 18px 18px 4px',
}));

const ChatInputContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

const ActionChips = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
}));

export const TradingAssistantChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string>('');
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize conversation with welcome message
    initializeChat();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const initializeChat = () => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      message: '',
      response: "👋 Hi! I'm your AI Trading Assistant. I can help you understand market recommendations, explain trading strategies, and answer questions about your portfolio. How can I assist you today?",
      timestamp: new Date(),
      confidence: 1.0,
      actions: [
        { type: 'VIEW_ANALYSIS', description: 'Show market analysis' },
        { type: 'ADJUST_PORTFOLIO', description: 'Portfolio optimization tips' },
      ]
    };
    setMessages([welcomeMessage]);
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || isTyping) return;

    const userMessage = currentMessage;
    setCurrentMessage('');
    setIsTyping(true);

    // Add user message to chat
    const userChatMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      message: userMessage,
      response: '',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userChatMessage]);

    try {
      // Call AI service
      const response = await sendMessageToAI(userMessage);
      
      // Add AI response to chat
      const aiChatMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        message: userMessage,
        response: response.response,
        timestamp: new Date(),
        confidence: response.confidence,
        sources: response.sources,
        actions: response.actions,
      };

      setMessages(prev => [...prev.slice(0, -1), aiChatMessage]);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        message: userMessage,
        response: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date(),
        confidence: 0.0,
      };

      setMessages(prev => [...prev.slice(0, -1), errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessageToAI = async (message: string): Promise<AssistantResponse> => {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        userId: 'demo-user', // TODO: Get from auth context
        conversationId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message to AI');
    }

    const data = await response.json();
    
    // Set conversation ID from response if not already set
    if (!conversationId && data.conversationId) {
      setConversationId(data.conversationId);
    }

    return data;
  };

  const handleActionClick = (action: SuggestedAction) => {
    switch (action.type) {
      case 'VIEW_STOCK':
        if (action.symbol) {
          // Navigate to stock detail page
          window.location.href = `/stocks/${action.symbol}`;
        }
        break;
      case 'VIEW_ANALYSIS':
        // Navigate to analysis page
        window.location.href = '/analysis';
        break;
      case 'ADJUST_PORTFOLIO':
        // Navigate to portfolio page
        window.location.href = '/portfolio';
        break;
      case 'PLACE_ORDER':
        // Open order dialog
        // TODO: Implement order placement
        break;
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'VIEW_STOCK':
      case 'VIEW_ANALYSIS':
        return <AssessmentIcon fontSize="small" />;
      case 'PLACE_ORDER':
        return <TrendingUpIcon fontSize="small" />;
      case 'ADJUST_PORTFOLIO':
        return <ShowChartIcon fontSize="small" />;
      default:
        return <AIIcon fontSize="small" />;
    }
  };

  return (
    <Card elevation={3}>
      <CardContent sx={{ p: 0 }}>
        <ChatContainer>
          {/* Chat Header */}
          <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AIIcon />
              AI Trading Assistant
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Get instant explanations and trading insights
            </Typography>
          </Box>

          {/* Chat History */}
          <ChatHistory ref={chatHistoryRef}>
            {messages.map((message) => (
              <Box key={message.id} sx={{ mb: 2 }}>
                {/* User Message */}
                {message.message && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                    <MessageBubble isUser elevation={1}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <PersonIcon fontSize="small" />
                        <Typography variant="body2" fontWeight="bold">
                          You
                        </Typography>
                      </Box>
                      <Typography variant="body1">{message.message}</Typography>
                    </MessageBubble>
                  </Box>
                )}

                {/* AI Response */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <MessageBubble isUser={false} elevation={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <AIIcon fontSize="small" color="primary" />
                      <Typography variant="body2" fontWeight="bold">
                        AI Assistant
                      </Typography>
                      {message.confidence !== undefined && (
                        <Chip 
                          label={`${(message.confidence * 100).toFixed(0)}%`}
                          size="small"
                          color={message.confidence > 0.8 ? 'success' : message.confidence > 0.6 ? 'warning' : 'error'}
                        />
                      )}
                    </Box>
                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.response}
                    </Typography>
                    
                    {message.sources && message.sources.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Sources: {message.sources.join(', ')}
                        </Typography>
                      </Box>
                    )}

                    {message.actions && message.actions.length > 0 && (
                      <ActionChips>
                        {message.actions.map((action, index) => (
                          <Button
                            key={index}
                            variant="outlined"
                            size="small"
                            startIcon={getActionIcon(action.type)}
                            onClick={() => handleActionClick(action)}
                            sx={{ borderRadius: '16px' }}
                          >
                            {action.description}
                          </Button>
                        ))}
                      </ActionChips>
                    )}
                  </MessageBubble>
                </Box>
              </Box>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                <MessageBubble isUser={false} elevation={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AIIcon fontSize="small" color="primary" />
                    <Typography variant="body2">AI Assistant is thinking</Typography>
                    <CircularProgress size={16} />
                  </Box>
                </MessageBubble>
              </Box>
            )}
          </ChatHistory>

          <Divider />

          {/* Chat Input */}
          <ChatInputContainer>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder="Ask me about trading strategies, market analysis, or your portfolio..."
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isTyping}
                variant="outlined"
                size="small"
              />
              <IconButton
                color="primary"
                onClick={sendMessage}
                disabled={!currentMessage.trim() || isTyping}
                sx={{ alignSelf: 'flex-end' }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </ChatInputContainer>
        </ChatContainer>
      </CardContent>
    </Card>
  );
};

export default TradingAssistantChat;
