import { makeAutoObservable, runInAction } from "mobx";
import { apiStore } from "./ApiStore";

export interface AssistantResponse {
  id: string;
  message: string;
  suggestions?: string[];
  chartData?: any;
  tradingSignals?: any[];
  timestamp: Date;
  context?: any;
}

export interface TradingRecommendation {
  symbol: string;
  action: "buy" | "sell" | "hold";
  confidence: number;
  reasoning: string;
  targetPrice?: number;
  stopLoss?: number;
  positionSize?: number;
  takeProfit?: number;
  timeHorizon: "1D" | "1W" | "1M";
  timestamp: Date;
}

export class AIStore {
  isLoading = false;
  error: string | null = null;
  chatHistory: AssistantResponse[] = [];
  currentConversationId: string | null = null;

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
      this.setLoading(true);
      const response = await apiStore.post<AssistantResponse>("/api/ai/chat", {
        message,
        userId,
        conversationId,
      });

      runInAction(() => {
        this.chatHistory.push(response);
        if (response.context?.conversationId) {
          this.currentConversationId = response.context.conversationId;
        }
      });

      return response;
    } catch (error) {
      this.handleError("Failed to send chat message", error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Get AI analysis for a specific stock
   */
  async getStockAnalysis(
    symbol: string,
    analysisType: "technical" | "fundamental" | "sentiment" = "technical",
    timeframe: string = "1D",
    userId: string = "demo-user"
  ): Promise<AssistantResponse> {
    try {
      this.setLoading(true);
      const response = await apiStore.post<AssistantResponse>(
        "/api/ai/stock-analysis",
        {
          symbol,
          analysisType,
          timeframe,
          userId,
        }
      );

      runInAction(() => {
        this.chatHistory.push(response);
      });

      return response;
    } catch (error) {
      this.handleError("Failed to get stock analysis", error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Ask a specific trading question
   */
  async askTradingQuestion(
    question: string,
    context?: any,
    userId: string = "demo-user"
  ): Promise<AssistantResponse> {
    try {
      this.setLoading(true);
      const response = await apiStore.post<AssistantResponse>(
        "/api/ai/question",
        {
          question,
          context,
          userId,
        }
      );

      runInAction(() => {
        this.chatHistory.push(response);
      });

      return response;
    } catch (error) {
      this.handleError("Failed to get answer to trading question", error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Get trading recommendations for a portfolio
   */
  async getTradingRecommendations(
    portfolioId: string,
    riskLevel: "conservative" | "moderate" | "aggressive" = "moderate",
    userId: string = "demo-user"
  ): Promise<TradingRecommendation[]> {
    try {
      this.setLoading(true);
      const response = await apiStore.post<TradingRecommendation[]>(
        "/api/ai/recommendations",
        {
          portfolioId,
          riskLevel,
          userId,
        }
      );

      return response;
    } catch (error) {
      this.handleError("Failed to get trading recommendations", error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Get market commentary from AI
   */
  async getMarketCommentary(
    timeframe: "daily" | "weekly" | "monthly" = "daily",
    userId: string = "demo-user"
  ): Promise<AssistantResponse> {
    try {
      this.setLoading(true);
      const response = await apiStore.post<AssistantResponse>(
        "/api/ai/market-commentary",
        {
          timeframe,
          userId,
        }
      );

      runInAction(() => {
        this.chatHistory.push(response);
      });

      return response;
    } catch (error) {
      this.handleError("Failed to get market commentary", error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Get portfolio insights from AI
   */
  async getPortfolioInsights(
    portfolioId: string,
    userId: string = "demo-user"
  ): Promise<AssistantResponse> {
    try {
      this.setLoading(true);
      const response = await apiStore.post<AssistantResponse>(
        "/api/ai/portfolio-insights",
        {
          portfolioId,
          userId,
        }
      );

      runInAction(() => {
        this.chatHistory.push(response);
      });

      return response;
    } catch (error) {
      this.handleError("Failed to get portfolio insights", error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Get AI explanation for a stock or trading concept
   */
  async explainStock(
    symbol: string,
    userId: string = "demo-user"
  ): Promise<AssistantResponse> {
    try {
      this.setLoading(true);
      const response = await apiStore.post<AssistantResponse>(
        "/api/ai/explain-stock",
        {
          symbol,
          userId,
        }
      );

      runInAction(() => {
        this.chatHistory.push(response);
      });

      return response;
    } catch (error) {
      this.handleError("Failed to get stock explanation", error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Get strategy suggestions from AI
   */
  async getStrategySuggestions(
    portfolioData: any,
    marketConditions: any,
    userId: string = "demo-user"
  ): Promise<AssistantResponse> {
    try {
      this.setLoading(true);
      const response = await apiStore.post<AssistantResponse>(
        "/api/ai/strategy-suggestions",
        {
          portfolioData,
          marketConditions,
          userId,
        }
      );

      runInAction(() => {
        this.chatHistory.push(response);
      });

      return response;
    } catch (error) {
      this.handleError("Failed to get strategy suggestions", error);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Clear chat history
   */
  clearChatHistory(): void {
    runInAction(() => {
      this.chatHistory = [];
      this.currentConversationId = null;
    });
  }

  private setLoading(loading: boolean) {
    this.isLoading = loading;
  }

  private handleError(message: string, error: any) {
    console.error(message, error);
    this.error = error.response?.data?.message || error.message || message;
  }

  clearError() {
    this.error = null;
  }
}

export const aiStore = new AIStore();
