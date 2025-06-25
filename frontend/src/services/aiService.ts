import { makeAutoObservable } from 'mobx';

export interface AssistantResponse {
  response: string;
  confidence: number;
  sources?: string[];
  context?: Record<string, any>;
  actions?: SuggestedAction[];
  conversationId?: string;
}

export interface SuggestedAction {
  type: 'VIEW_STOCK' | 'PLACE_ORDER' | 'ADJUST_PORTFOLIO' | 'VIEW_ANALYSIS';
  symbol?: string;
  parameters?: Record<string, any>;
  description: string;
}

export interface ChatMessage {
  id: string;
  message: string;
  response: string;
  timestamp: Date;
  confidence?: number;
  sources?: string[];
  actions?: SuggestedAction[];
}

export interface TradingRecommendation {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  positionSize?: number;
  stopLoss?: number;
  takeProfit?: number;
  timeHorizon: '1D' | '1W' | '1M';
  timestamp: Date;
}

class AIService {
  private baseUrl = '/api';
  
  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Send a chat message to the AI trading assistant
   */
  async sendChatMessage(
    message: string, 
    userId: string, 
    conversationId?: string
  ): Promise<AssistantResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          userId,
          conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI chat failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('AI chat error:', error);
      throw error;
    }
  }

  /**
   * Get an explanation for a trading recommendation
   */
  async explainRecommendation(recommendation: TradingRecommendation): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/explain-recommendation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: recommendation.symbol,
          action: recommendation.action,
          confidence: recommendation.confidence,
          reasoning: recommendation.reasoning,
          riskLevel: recommendation.riskLevel,
          timeHorizon: recommendation.timeHorizon,
          stopLoss: recommendation.stopLoss,
          takeProfit: recommendation.takeProfit,
        }),
      });

      if (!response.ok) {
        throw new Error(`Explanation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.explanation;
    } catch (error) {
      console.error('Explanation error:', error);
      throw error;
    }
  }

  /**
   * Ask a trading question to the AI assistant
   */
  async askTradingQuestion(
    question: string, 
    userId: string, 
    context?: Record<string, any>
  ): Promise<AssistantResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          userId,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error(`Question failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Question error:', error);
      throw error;
    }
  }

  /**
   * Get conversation history for a user
   */
  async getConversationHistory(
    userId: string, 
    conversationId?: string,
    limit: number = 50
  ): Promise<ChatMessage[]> {
    try {
      const params = new URLSearchParams({
        userId,
        limit: limit.toString(),
      });

      if (conversationId) {
        params.append('conversationId', conversationId);
      }

      const response = await fetch(`${this.baseUrl}/ai/conversations?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get conversation history: ${response.statusText}`);
      }

      const data = await response.json();
      return data.messages;
    } catch (error) {
      console.error('Conversation history error:', error);
      throw error;
    }
  }

  /**
   * Get market commentary from AI
   */
  async getMarketCommentary(symbols?: string[]): Promise<AssistantResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/market-commentary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbols: symbols || [],
        }),
      });

      if (!response.ok) {
        throw new Error(`Market commentary failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Market commentary error:', error);
      throw error;
    }
  }

  /**
   * Get AI-powered portfolio insights
   */
  async getPortfolioInsights(
    userId: string, 
    portfolioId?: string
  ): Promise<AssistantResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/portfolio-insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          portfolioId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Portfolio insights failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Portfolio insights error:', error);
      throw error;
    }
  }

  /**
   * Get AI explanation for a specific stock's current situation
   */
  async explainStockSituation(
    symbol: string, 
    context?: Record<string, any>
  ): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/explain-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          context,
        }),
      });

      if (!response.ok) {
        throw new Error(`Stock explanation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.explanation;
    } catch (error) {
      console.error('Stock explanation error:', error);
      throw error;
    }
  }

  /**
   * Get AI-powered trading strategy suggestions
   */
  async getTradingStrategySuggestions(
    userProfile: {
      riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
      timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
      capital: number;
      experience: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    }
  ): Promise<AssistantResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/ai/strategy-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userProfile),
      });

      if (!response.ok) {
        throw new Error(`Strategy suggestions failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Strategy suggestions error:', error);
      throw error;
    }
  }
}

// Create singleton instance
const aiService = new AIService();
export default aiService;
