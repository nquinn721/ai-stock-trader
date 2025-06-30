import { makeAutoObservable, runInAction } from "mobx";
import { ApiStore } from "./ApiStore";

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

export interface TradeExplanation {
  symbol: string;
  action: string;
  reasoning: string[];
  confidence: number;
  keyFactors: string[];
  risks: string[];
  alternatives?: string[];
  marketContext: string;
}

export interface MarketInsight {
  type: "TREND" | "VOLATILITY" | "NEWS" | "ECONOMIC" | "TECHNICAL";
  title: string;
  description: string;
  impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  confidence: number;
  relevantSymbols?: string[];
  timestamp: Date;
}

export interface PortfolioAnalysisRequest {
  portfolioId: string;
  analysisType: "DIVERSIFICATION" | "RISK" | "PERFORMANCE" | "OPTIMIZATION";
  timeframe?: string;
  benchmark?: string;
}

export interface PortfolioAnalysisResponse {
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  riskAssessment: {
    overallRisk: number;
    diversificationScore: number;
    concentrationRisks: string[];
  };
  suggestedActions: SuggestedAction[];
  performance: {
    totalReturn: number;
    sharpeRatio: number;
    maxDrawdown: number;
    volatility: number;
  };
}

export class TradingAssistantStore {
  // Chat and conversation state
  currentConversation: ChatMessage[] = [];
  conversationHistory: ConversationSummary[] = [];
  currentConversationId: string | null = null;

  // Recommendations and insights
  tradingRecommendations: TradingRecommendation[] = [];
  marketInsights: MarketInsight[] = [];

  // Analysis
  portfolioAnalyses: Map<string, PortfolioAnalysisResponse> = new Map();

  // UI state
  isLoading: boolean = false;
  isTyping: boolean = false;
  error: string | null = null;

  constructor(private apiStore: ApiStore) {
    makeAutoObservable(this);
  }

  // Chat functionality
  async sendMessage(
    message: string,
    context?: Record<string, any>
  ): Promise<AssistantResponse> {
    runInAction(() => {
      this.isLoading = true;
      this.isTyping = true;
      this.error = null;
    });

    try {
      const requestData = {
        message,
        context,
        conversationId: this.currentConversationId,
      };

      const response = await this.apiStore.post<AssistantResponse>(
        "/trading-assistant/chat",
        requestData
      );

      // Add message to current conversation
      const chatMessage: ChatMessage = {
        id: Date.now().toString(),
        userId: "current-user", // Should come from user store
        message,
        response: response.response,
        timestamp: new Date(),
        context,
        conversationId: this.currentConversationId || undefined,
      };

      runInAction(() => {
        this.currentConversation.push(chatMessage);
        this.isLoading = false;
        this.isTyping = false;
      });

      return response;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to send message";
        this.isLoading = false;
        this.isTyping = false;
      });
      throw error;
    }
  }

  async startNewConversation(): Promise<string> {
    try {
      const response = await this.apiStore.post<{ conversationId: string }>(
        "/trading-assistant/conversation/start",
        {}
      );

      runInAction(() => {
        this.currentConversationId = response.conversationId;
        this.currentConversation = [];
      });

      return response.conversationId;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to start new conversation";
      });
      throw error;
    }
  }

  async loadConversation(conversationId: string): Promise<ChatMessage[]> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const messages = await this.apiStore.get<ChatMessage[]>(
        `/trading-assistant/conversation/${conversationId}`
      );

      runInAction(() => {
        this.currentConversationId = conversationId;
        this.currentConversation = messages;
        this.isLoading = false;
      });

      return messages;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to load conversation";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async fetchConversationHistory(): Promise<ConversationSummary[]> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const history = await this.apiStore.get<ConversationSummary[]>(
        "/trading-assistant/conversations"
      );

      runInAction(() => {
        this.conversationHistory = history;
        this.isLoading = false;
      });

      return history;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch conversation history";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async deleteConversation(conversationId: string): Promise<void> {
    try {
      await this.apiStore.delete(
        `/trading-assistant/conversation/${conversationId}`
      );

      runInAction(() => {
        this.conversationHistory = this.conversationHistory.filter(
          (conv) => conv.conversationId !== conversationId
        );

        if (this.currentConversationId === conversationId) {
          this.currentConversationId = null;
          this.currentConversation = [];
        }
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to delete conversation";
      });
      throw error;
    }
  }

  // Trading recommendations
  async getTradingRecommendations(
    symbols?: string[]
  ): Promise<TradingRecommendation[]> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const endpoint = symbols
        ? `/trading-assistant/recommendations?symbols=${symbols.join(",")}`
        : "/trading-assistant/recommendations";
      const recommendations =
        await this.apiStore.get<TradingRecommendation[]>(endpoint);

      runInAction(() => {
        this.tradingRecommendations = recommendations;
        this.isLoading = false;
      });

      return recommendations;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch trading recommendations";
        this.isLoading = false;
      });
      throw error;
    }
  }

  // Trade explanations
  async explainTrade(
    symbol: string,
    action: string
  ): Promise<TradeExplanation> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const explanation = await this.apiStore.post<TradeExplanation>(
        "/trading-assistant/explain-trade",
        { symbol, action }
      );

      runInAction(() => {
        this.isLoading = false;
      });

      return explanation;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to explain trade";
        this.isLoading = false;
      });
      throw error;
    }
  }

  // Market insights
  async fetchMarketInsights(): Promise<MarketInsight[]> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const insights = await this.apiStore.get<MarketInsight[]>(
        "/trading-assistant/market-insights"
      );

      runInAction(() => {
        this.marketInsights = insights;
        this.isLoading = false;
      });

      return insights;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch market insights";
        this.isLoading = false;
      });
      throw error;
    }
  }

  // Portfolio analysis
  async analyzePortfolio(
    request: PortfolioAnalysisRequest
  ): Promise<PortfolioAnalysisResponse> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const analysis = await this.apiStore.post<PortfolioAnalysisResponse>(
        "/trading-assistant/analyze-portfolio",
        request
      );

      runInAction(() => {
        this.portfolioAnalyses.set(request.portfolioId, analysis);
        this.isLoading = false;
      });

      return analysis;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to analyze portfolio";
        this.isLoading = false;
      });
      throw error;
    }
  }

  // General Q&A
  async askQuestion(
    question: string,
    context?: Record<string, any>
  ): Promise<AssistantResponse> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const response = await this.apiStore.post<AssistantResponse>(
        "/trading-assistant/ask",
        { question, context }
      );

      runInAction(() => {
        this.isLoading = false;
      });

      return response;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to get answer";
        this.isLoading = false;
      });
      throw error;
    }
  }

  // Utility methods
  clearError(): void {
    runInAction(() => {
      this.error = null;
    });
  }

  clearCurrentConversation(): void {
    runInAction(() => {
      this.currentConversation = [];
      this.currentConversationId = null;
    });
  }

  clearAllData(): void {
    runInAction(() => {
      this.currentConversation = [];
      this.conversationHistory = [];
      this.currentConversationId = null;
      this.tradingRecommendations = [];
      this.marketInsights = [];
      this.portfolioAnalyses.clear();
      this.error = null;
    });
  }

  // Computed getters
  get hasActiveConversation(): boolean {
    return this.currentConversationId !== null;
  }

  get hasConversationHistory(): boolean {
    return this.conversationHistory.length > 0;
  }

  get hasRecommendations(): boolean {
    return this.tradingRecommendations.length > 0;
  }

  get hasInsights(): boolean {
    return this.marketInsights.length > 0;
  }

  get messageCount(): number {
    return this.currentConversation.length;
  }

  getPortfolioAnalysis(
    portfolioId: string
  ): PortfolioAnalysisResponse | undefined {
    return this.portfolioAnalyses.get(portfolioId);
  }
}
