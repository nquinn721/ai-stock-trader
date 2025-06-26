// Trading Assistant Service for AI-powered chat and explanations

const API_BASE_URL = "http://localhost:8000";

export interface ChatMessage {
  id: string;
  userId: string;
  message: string;
  response: string;
  timestamp: Date;
  context?: Record<string, any>;
  conversationId?: string;
}

export interface AssistantResponse {
  response: string;
  confidence: number;
  sources?: string[];
  context?: Record<string, any>;
  actions?: SuggestedAction[];
}

export interface SuggestedAction {
  type: "VIEW_STOCK" | "PLACE_ORDER" | "ADJUST_PORTFOLIO" | "VIEW_ANALYSIS";
  symbol?: string;
  parameters?: Record<string, any>;
  description: string;
}

export interface ConversationSummary {
  conversationId: string;
  userId: string;
  messageCount: number;
  lastInteraction: Date;
  isActive: boolean;
}

export interface TradingRecommendation {
  symbol: string;
  action: "BUY" | "SELL" | "HOLD";
  confidence: number;
  reasoning: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  timeHorizon: "1D" | "1W" | "1M";
  stopLoss?: number;
  takeProfit?: number;
}

class TradingAssistantService {
  private readonly baseUrl = `${API_BASE_URL}/ai`;
  private currentUserId = "user_123"; // In real app, get from auth context
  private currentConversationId: string | null = null;

  async sendMessage(
    message: string,
    conversationId?: string
  ): Promise<AssistantResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          userId: this.currentUserId,
          conversationId: conversationId || this.currentConversationId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      const result = await response.json();

      // Update current conversation ID if we get one back
      if (result.context?.conversationId) {
        this.currentConversationId = result.context.conversationId;
      }

      return result;
    } catch (error) {
      console.error("Error sending message to AI assistant:", error);
      return this.getFallbackResponse(message);
    }
  }

  async explainRecommendation(
    recommendation: TradingRecommendation
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/explain-recommendation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(recommendation),
      });

      if (!response.ok) {
        throw new Error(`Failed to get explanation: ${response.statusText}`);
      }

      const result = await response.json();
      return result.explanation;
    } catch (error) {
      console.error("Error getting recommendation explanation:", error);
      return this.getFallbackExplanation(recommendation);
    }
  }

  async askQuestion(
    question: string,
    context?: Record<string, any>
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          userId: this.currentUserId,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ask question: ${response.statusText}`);
      }

      const result = await response.json();
      return result.answer;
    } catch (error) {
      console.error("Error asking question:", error);
      return "I apologize, but I'm having trouble processing your question right now. Please try again later.";
    }
  }

  async getConversationHistory(
    conversationId: string,
    limit: number = 20
  ): Promise<ChatMessage[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/conversations/${this.currentUserId}/${conversationId}/history?limit=${limit}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to get conversation history: ${response.statusText}`
        );
      }

      return response.json();
    } catch (error) {
      console.error("Error getting conversation history:", error);
      return [];
    }
  }

  async getUserConversations(
    limit: number = 10
  ): Promise<ConversationSummary[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/conversations/${this.currentUserId}?limit=${limit}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get conversations: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error("Error getting user conversations:", error);
      return [];
    }
  }

  async createNewConversation(): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}/conversations/${this.currentUserId}/new`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to create conversation: ${response.statusText}`
        );
      }

      const result = await response.json();
      this.currentConversationId = result.conversationId;
      return result.conversationId;
    } catch (error) {
      console.error("Error creating new conversation:", error);
      // Generate a fallback conversation ID
      const fallbackId = `fallback_${Date.now()}`;
      this.currentConversationId = fallbackId;
      return fallbackId;
    }
  }

  async endConversation(conversationId?: string): Promise<void> {
    const id = conversationId || this.currentConversationId;
    if (!id) return;

    try {
      await fetch(`${this.baseUrl}/conversations/${id}/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (id === this.currentConversationId) {
        this.currentConversationId = null;
      }
    } catch (error) {
      console.error("Error ending conversation:", error);
    }
  }

  getCurrentConversationId(): string | null {
    return this.currentConversationId;
  }

  setCurrentConversationId(conversationId: string): void {
    this.currentConversationId = conversationId;
  }

  private getFallbackResponse(message: string): AssistantResponse {
    return {
      response: `I understand you're asking about "${message}". I'm currently experiencing some technical difficulties, but I'm here to help!

Here are some things you can try:
• Check the latest stock recommendations in the dashboard
• Review your portfolio performance and analytics  
• Explore market trends and technical indicators
• Use the order management system for trading

If you have specific questions about trading strategies or market analysis, feel free to ask again!`,
      confidence: 0.3,
      sources: ["Fallback Response"],
      context: { fallback: true },
      actions: [
        {
          type: "VIEW_ANALYSIS",
          description: "View Dashboard",
          parameters: { view: "dashboard" },
        },
      ],
    };
  }

  private getFallbackExplanation(
    recommendation: TradingRecommendation
  ): string {
    const action = recommendation.action.toLowerCase();
    const confidencePercent = (recommendation.confidence * 100).toFixed(1);
    const riskLevel = recommendation.riskLevel.toLowerCase();

    return `**${recommendation.action} Recommendation for ${
      recommendation.symbol
    }**

Our AI analysis suggests a ${action} position with ${confidencePercent}% confidence. This is considered a ${riskLevel} risk trade.

**Key Factors:**
${recommendation.reasoning
  .map((reason, index) => `${index + 1}. ${reason}`)
  .join("\n")}

**Risk Assessment:** ${recommendation.riskLevel} risk level.
${
  recommendation.stopLoss
    ? `**Stop Loss:** $${recommendation.stopLoss.toFixed(2)}`
    : ""
}
${
  recommendation.takeProfit
    ? `**Target Price:** $${recommendation.takeProfit.toFixed(2)}`
    : ""
}

**Time Horizon:** ${recommendation.timeHorizon}

*This is a simplified explanation. For detailed AI insights, please ensure the AI service is properly configured.*`;
  }
}

export const tradingAssistantService = new TradingAssistantService();
