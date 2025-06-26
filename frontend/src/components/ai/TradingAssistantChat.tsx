import {
  SmartToy as AIIcon,
  Assessment as AssessmentIcon,
  Person as PersonIcon,
  Send as SendIcon,
  ShowChart as ShowChartIcon,
  TrendingUp as TrendingUpIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import "./TradingAssistantChat.css";

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
  type: "VIEW_STOCK" | "PLACE_ORDER" | "ADJUST_PORTFOLIO" | "VIEW_ANALYSIS";
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

export const TradingAssistantChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
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
      id: "welcome",
      message: "",
      response:
        "👋 Hi! I'm your AI Trading Assistant. I can help you understand market recommendations, explain trading strategies, and answer questions about your portfolio. How can I assist you today?",
      timestamp: new Date(),
      confidence: 1.0,
      actions: [
        { type: "VIEW_ANALYSIS", description: "Show market analysis" },
        {
          type: "ADJUST_PORTFOLIO",
          description: "Portfolio optimization tips",
        },
      ],
    };
    setMessages([welcomeMessage]);
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || isTyping) return;

    const userMessage = currentMessage;
    setCurrentMessage("");
    setIsTyping(true);

    // Add user message to chat
    const userChatMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      message: userMessage,
      response: "",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userChatMessage]);

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

      setMessages((prev) => [...prev.slice(0, -1), aiChatMessage]);
    } catch (error) {
      console.error("Failed to get AI response:", error);

      // Add error message
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        message: userMessage,
        response:
          "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment.",
        timestamp: new Date(),
        confidence: 0.0,
      };

      setMessages((prev) => [...prev.slice(0, -1), errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const sendMessageToAI = async (
    message: string
  ): Promise<AssistantResponse> => {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        userId: "demo-user", // TODO: Get from auth context
        conversationId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send message to AI");
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
      case "VIEW_STOCK":
        if (action.symbol) {
          // Navigate to stock detail page
          window.location.href = `/stocks/${action.symbol}`;
        }
        break;
      case "VIEW_ANALYSIS":
        // Navigate to analysis page
        window.location.href = "/analysis";
        break;
      case "ADJUST_PORTFOLIO":
        // Navigate to portfolio page
        window.location.href = "/portfolio";
        break;
      case "PLACE_ORDER":
        // Open order dialog
        // TODO: Implement order placement
        break;
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case "VIEW_STOCK":
      case "VIEW_ANALYSIS":
        return <AssessmentIcon fontSize="small" />;
      case "PLACE_ORDER":
        return <TrendingUpIcon fontSize="small" />;
      case "ADJUST_PORTFOLIO":
        return <ShowChartIcon fontSize="small" />;
      default:
        return <AIIcon fontSize="small" />;
    }
  };

  return (
    <div className="trading-assistant-chat">
      <Card elevation={3} className="chat-main-card">
        <CardContent>
          <div className="chat-container">
            {/* Chat Header */}
            <Box
              sx={{
                p: 2,
                bgcolor: "transparent",
                color: "white",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                borderRadius: "24px 24px 0 0",
              }}
            >
              <Typography
                variant="h6"
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <AIIcon className="ai-icon" />
                AI Trading Assistant
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Get instant explanations and trading insights
              </Typography>
            </Box>

            {/* Chat History */}
            <div className="chat-history" ref={chatHistoryRef}>
              {messages.map((message) => (
                <Box key={message.id} sx={{ mb: 2 }}>
                  {/* User Message */}
                  {message.message && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        mb: 1,
                      }}
                    >
                      <div className="message-bubble message-bubble-user">
                        <div className="message-header">
                          <PersonIcon className="user-icon" fontSize="small" />
                          <Typography
                            className="message-author message-author-user"
                            variant="body2"
                          >
                            You
                          </Typography>
                        </div>
                        <Typography
                          className="message-content message-content-user"
                          variant="body1"
                        >
                          {message.message}
                        </Typography>
                      </div>
                    </Box>
                  )}

                  {/* AI Response */}
                  <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                    <div className="message-bubble message-bubble-ai">
                      <div className="message-header">
                        <AIIcon className="ai-icon" fontSize="small" />
                        <Typography className="message-author" variant="body2">
                          AI Assistant
                        </Typography>
                        {message.confidence !== undefined && (
                          <Chip
                            label={`${(message.confidence * 100).toFixed(0)}%`}
                            size="small"
                            className={`confidence-chip ${
                              message.confidence > 0.8
                                ? "confidence-high"
                                : message.confidence > 0.6
                                ? "confidence-medium"
                                : "confidence-low"
                            }`}
                          />
                        )}
                      </div>
                      <Typography className="message-content" variant="body1">
                        {message.response}
                      </Typography>

                      {message.sources && message.sources.length > 0 && (
                        <div className="message-sources">
                          Sources: {message.sources.join(", ")}
                        </div>
                      )}

                      {message.actions && message.actions.length > 0 && (
                        <div className="action-chips-container">
                          {message.actions.map((action, index) => (
                            <Button
                              key={index}
                              variant="outlined"
                              size="small"
                              startIcon={getActionIcon(action.type)}
                              onClick={() => handleActionClick(action)}
                              className="action-chip"
                            >
                              {action.description}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </Box>
                </Box>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <Box
                  sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}
                >
                  <div className="typing-indicator">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <AIIcon className="ai-icon" fontSize="small" />
                      <Typography className="typing-text" variant="body2">
                        AI Assistant is thinking
                      </Typography>
                      <CircularProgress className="typing-spinner" size={16} />
                    </Box>
                  </div>
                </Box>
              )}
            </div>

            <Divider className="chat-divider" />

            {/* Chat Input */}
            <div className="chat-input-container">
              <div className="chat-input-wrapper">
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
                  className="chat-input"
                />
                <IconButton
                  color="primary"
                  onClick={sendMessage}
                  disabled={!currentMessage.trim() || isTyping}
                  className="send-button"
                >
                  <SendIcon />
                </IconButton>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TradingAssistantChat;
