import {
  SmartToy as AIIcon,
  Analytics as AnalyticsIcon,
  ShoppingCart as OrderIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Fade,
  IconButton,
  List,
  ListItem,
  Paper,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import {
  AssistantResponse,
  SuggestedAction,
  tradingAssistantService,
} from "../services/tradingAssistantService";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  confidence?: number;
  actions?: SuggestedAction[];
}

interface TradingAssistantChatProps {
  onStockSelect?: (symbol: string) => void;
  onOrderAction?: (action: "BUY" | "SELL", symbol?: string) => void;
  onViewAnalysis?: (type: string) => void;
}

const TradingAssistantChat: React.FC<TradingAssistantChatProps> = ({
  onStockSelect,
  onOrderAction,
  onViewAnalysis,
}) => {
  const theme = useTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize with welcome message
    initializeChat();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    scrollToBottom();
  }, [messages]);

  const initializeChat = () => {
    const welcomeMessage: ChatMessage = {
      id: "welcome",
      type: "assistant",
      content: `👋 **Welcome to your AI Trading Assistant!**

I'm here to help you with:
• **Stock Analysis** - Ask about any stock's performance or outlook
• **Trading Strategies** - Get personalized recommendations
• **Market Insights** - Understand market trends and opportunities
• **Portfolio Guidance** - Optimize your holdings and risk management

Try asking me something like:
- "Explain the latest AAPL recommendation"
- "What's happening in the tech sector?"
- "Should I buy more TSLA?"
- "How's my portfolio performing?"

What would you like to know about the markets today?`,
      timestamp: new Date(),
      actions: [
        {
          type: "VIEW_ANALYSIS",
          description: "View Dashboard",
          parameters: { view: "dashboard" },
        },
      ],
    };

    setMessages([welcomeMessage]);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response: AssistantResponse =
        await tradingAssistantService.sendMessage(
          inputValue,
          conversationId || undefined
        );

      // Update conversation ID if we get one
      if (response.context?.conversationId && !conversationId) {
        setConversationId(response.context.conversationId);
      }

      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        type: "assistant",
        content: response.response,
        timestamp: new Date(),
        confidence: response.confidence,
        actions: response.actions,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);

      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: "assistant",
        content:
          "⚠️ I apologize, but I'm having trouble connecting to the AI service right now. Please try again in a moment, or check the dashboard for the latest market data.",
        timestamp: new Date(),
        confidence: 0,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleActionClick = (action: SuggestedAction) => {
    switch (action.type) {
      case "VIEW_STOCK":
        if (action.symbol && onStockSelect) {
          onStockSelect(action.symbol);
        }
        break;
      case "PLACE_ORDER":
        if (onOrderAction) {
          onOrderAction(
            action.parameters?.action as "BUY" | "SELL",
            action.symbol
          );
        }
        break;
      case "VIEW_ANALYSIS":
        if (onViewAnalysis) {
          onViewAnalysis(action.parameters?.view || "dashboard");
        }
        break;
      default:
        console.log("Action not implemented:", action);
    }
  };

  const handleNewConversation = async () => {
    try {
      const newId = await tradingAssistantService.createNewConversation();
      setConversationId(newId);
      setMessages([]);
      initializeChat();
    } catch (error) {
      console.error("Failed to create new conversation:", error);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case "VIEW_STOCK":
        return <TrendingUpIcon fontSize="small" />;
      case "PLACE_ORDER":
        return <OrderIcon fontSize="small" />;
      case "VIEW_ANALYSIS":
        return <AnalyticsIcon fontSize="small" />;
      default:
        return <TrendingUpIcon fontSize="small" />;
    }
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.type === "user";

    return (
      <ListItem
        key={message.id}
        sx={{
          flexDirection: "column",
          alignItems: isUser ? "flex-end" : "flex-start",
          mb: 1, // Reduced margin between messages
          py: 0.5, // Reduced vertical padding
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 0.5, // Reduced gap between avatar and message
            width: "100%",
            flexDirection: isUser ? "row-reverse" : "row",
          }}
        >
          <Avatar
            sx={{
              bgcolor: isUser
                ? theme.palette.primary.main
                : theme.palette.secondary.main,
              width: 28, // Smaller avatar
              height: 28, // Smaller avatar
            }}
          >
            {isUser ? (
              <PersonIcon fontSize="small" />
            ) : (
              <AIIcon fontSize="small" />
            )}
          </Avatar>

          <Paper
            elevation={1}
            sx={{
              p: 1.5, // Reduced padding inside message bubbles
              maxWidth: "80%", // Increased max width for wider messages
              bgcolor: isUser
                ? theme.palette.primary.main
                : theme.palette.background.paper,
              color: isUser
                ? theme.palette.primary.contrastText
                : theme.palette.text.primary,
              borderRadius: 2,
              position: "relative",
            }}
          >
            <Typography
              variant="body2" // Smaller text size
              sx={{
                whiteSpace: "pre-line",
                "& strong": { fontWeight: 600 },
                "& em": { fontStyle: "italic" },
                lineHeight: 1.4, // Tighter line height
              }}
            >
              {message.content}
            </Typography>

            {message.confidence !== undefined && (
              <Chip
                label={`${(message.confidence * 100).toFixed(0)}% confidence`}
                size="small"
                color={
                  message.confidence > 0.7
                    ? "success"
                    : message.confidence > 0.5
                      ? "warning"
                      : "error"
                }
                sx={{ mt: 1 }}
              />
            )}

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                mt: 0.5, // Reduced margin for timestamp
                opacity: 0.7,
                textAlign: isUser ? "right" : "left",
              }}
            >
              {message.timestamp.toLocaleTimeString()}
            </Typography>
          </Paper>
        </Box>

        {message.actions && message.actions.length > 0 && (
          <Box sx={{ mt: 0.5, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {" "}
            {/* Reduced spacing for action buttons */}
            {message.actions.map((action, index) => (
              <Button
                key={index}
                variant="outlined"
                size="small"
                startIcon={getActionIcon(action.type)}
                onClick={() => handleActionClick(action)}
                sx={{
                  fontSize: "0.7rem", // Smaller button text
                  textTransform: "none",
                  py: 0.25, // Reduced button padding
                }}
              >
                {action.description}
              </Button>
            ))}
          </Box>
        )}
      </ListItem>
    );
  };

  return (
    <Paper
      elevation={3}
      sx={{
        height: "450px", // Fixed shorter height
        display: "flex",
        flexDirection: "column",
        bgcolor: theme.palette.background.default,
        width: "100%",
        maxWidth: "800px", // Wider maximum width
        minWidth: "600px", // Ensure minimum width
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 1.5, // Reduced padding for more compact header
          bgcolor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AIIcon />
          <Typography variant="subtitle1" fontWeight="bold">
            {" "}
            {/* Smaller header text */}
            AI Trading Assistant
          </Typography>
        </Box>

        <Tooltip title="Start New Conversation">
          <IconButton
            color="inherit"
            onClick={handleNewConversation}
            size="small"
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider />

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 0.5, // Reduced padding for more message space
          maxHeight: "300px", // Constrain message area height
        }}
      >
        <List sx={{ pb: 0, pt: 0 }}>
          {" "}
          {/* Reduced top padding */}
          {messages.map(renderMessage)}
          {isLoading && (
            <ListItem sx={{ justifyContent: "center", py: 1 }}>
              {" "}
              {/* Reduced loading item padding */}
              <Fade in={isLoading}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={16} /> {/* Smaller loading spinner */}
                  <Typography variant="body2" color="text.secondary">
                    AI is thinking...
                  </Typography>
                </Box>
              </Fade>
            </ListItem>
          )}
        </List>
        <div ref={messagesEndRef} />
      </Box>

      <Divider />

      {/* Input */}
      <Box sx={{ p: 1.5, width: "100%" }}>
        {" "}
        {/* Reduced padding for more compact input area */}
        <Box sx={{ display: "flex", gap: 1, width: "100%" }}>
          <TextField
            fullWidth
            multiline
            maxRows={2} // Reduced max rows for more compact input
            placeholder="Ask me about stocks, trading strategies, or market insights..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            variant="outlined"
            size="small"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            sx={{
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              "&:hover": {
                bgcolor: theme.palette.primary.dark,
              },
              "&:disabled": {
                bgcolor: theme.palette.grey[300],
              },
            }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default TradingAssistantChat;
