import axios from "axios";
import { FRONTEND_API_CONFIG } from "../config/api.config";
import {
  BatchRecommendationResponse,
  EnhancedRecommendation,
  RecommendationExplanation,
  RecommendationRequest,
  TradingRecommendation,
} from "../types/recommendation.types";

const API_BASE_URL = FRONTEND_API_CONFIG.backend.baseUrl;

class RecommendationService {
  private baseURL = `${API_BASE_URL}/ml`;

  /**
   * S19: Generate AI-powered trading recommendation for a single symbol
   */
  async generateRecommendation(
    symbol: string,
    request: Omit<RecommendationRequest, "symbol">
  ): Promise<TradingRecommendation> {
    try {
      const response = await axios.post(
        `${this.baseURL}/recommendation/${symbol.toUpperCase()}`,
        request
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to generate recommendation for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * S19: Generate batch AI-powered trading recommendations
   */
  async generateBatchRecommendations(
    requests: RecommendationRequest[]
  ): Promise<BatchRecommendationResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/recommendations/batch`,
        requests
      );
      return response.data;
    } catch (error) {
      console.error("Failed to generate batch recommendations:", error);
      throw error;
    }
  }

  /**
   * S19: Get detailed explanation for a trading recommendation
   */
  async getRecommendationExplanation(
    symbol: string
  ): Promise<RecommendationExplanation> {
    try {
      const response = await axios.get(
        `${this.baseURL}/recommendation/${symbol.toUpperCase()}/explanation`
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to get explanation for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * S19+S29B: Generate enhanced recommendation with ensemble signals
   */
  async generateEnhancedRecommendation(
    symbol: string,
    request: Omit<RecommendationRequest, "symbol"> & {
      ensembleOptions?: {
        timeframes?: string[];
        includeConflictResolution?: boolean;
        ensembleMethod?: "voting" | "averaging" | "stacking" | "meta_learning";
        confidenceThreshold?: number;
        enableRealTimeStream?: boolean;
      };
    }
  ): Promise<EnhancedRecommendation> {
    try {
      const response = await axios.post(
        `${this.baseURL}/recommendation/enhanced/${symbol.toUpperCase()}`,
        request
      );
      return response.data;
    } catch (error) {
      console.error(
        `Failed to generate enhanced recommendation for ${symbol}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Get quick recommendation for a symbol with minimal data
   */
  async getQuickRecommendation(
    symbol: string,
    currentPrice: number,
    riskTolerance: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM"
  ): Promise<TradingRecommendation> {
    const request: Omit<RecommendationRequest, "symbol"> = {
      currentPrice,
      portfolioContext: {
        currentHoldings: 0,
        availableCash: 10000,
        riskTolerance,
      },
      timeHorizon: "1D",
    };

    return this.generateRecommendation(symbol, request);
  }

  /**
   * Get recommendation with portfolio context
   */
  async getPortfolioContextRecommendation(
    symbol: string,
    currentPrice: number,
    portfolioData: {
      currentHoldings: number;
      availableCash: number;
      riskTolerance: "LOW" | "MEDIUM" | "HIGH";
    },
    preferences?: {
      maxRisk: number;
      preferredSectors?: string[];
      excludePatterns?: string[];
    },
    timeHorizon: "1D" | "1W" | "1M" = "1D"
  ): Promise<TradingRecommendation> {
    const request: Omit<RecommendationRequest, "symbol"> = {
      currentPrice,
      portfolioContext: portfolioData,
      timeHorizon,
      preferences,
    };

    return this.generateRecommendation(symbol, request);
  }

  /**
   * Get enhanced recommendation with custom ensemble options
   */
  async getAdvancedRecommendation(
    symbol: string,
    currentPrice: number,
    options: {
      portfolioContext?: {
        currentHoldings: number;
        availableCash: number;
        riskTolerance: "LOW" | "MEDIUM" | "HIGH";
      };
      timeHorizon?: "1D" | "1W" | "1M";
      preferences?: {
        maxRisk: number;
        preferredSectors?: string[];
        excludePatterns?: string[];
      };
      ensembleMethod?: "voting" | "averaging" | "stacking" | "meta_learning";
      includeConflictResolution?: boolean;
      timeframes?: string[];
    } = {}
  ): Promise<EnhancedRecommendation> {
    const request = {
      currentPrice,
      portfolioContext: options.portfolioContext || {
        currentHoldings: 0,
        availableCash: 10000,
        riskTolerance: "MEDIUM" as const,
      },
      timeHorizon: options.timeHorizon || ("1D" as const),
      preferences: options.preferences,
      ensembleOptions: {
        ensembleMethod: options.ensembleMethod || "meta_learning",
        includeConflictResolution: options.includeConflictResolution ?? true,
        timeframes: options.timeframes || ["1D", "1H", "4H"],
        confidenceThreshold: 0.7,
        enableRealTimeStream: true,
      },
    };

    return this.generateEnhancedRecommendation(symbol, request);
  }

  /**
   * Format recommendation for display
   */
  formatRecommendationForDisplay(recommendation: TradingRecommendation): {
    actionText: string;
    actionColor: string;
    confidenceText: string;
    riskText: string;
    summaryText: string;
  } {
    const actionColors = {
      BUY: "#4caf50",
      SELL: "#f44336",
      HOLD: "#ff9800",
    };

    const confidenceText = `${Math.round(recommendation.confidence * 100)}%`;
    const actionText = recommendation.action;
    const actionColor = actionColors[recommendation.action];
    const riskText = recommendation.riskLevel;

    const summaryText =
      recommendation.reasoning.length > 0
        ? recommendation.reasoning[0]
        : `${actionText} recommendation with ${confidenceText} confidence`;

    return {
      actionText,
      actionColor,
      confidenceText,
      riskText,
      summaryText,
    };
  }

  /**
   * Check if recommendation is actionable based on confidence threshold
   */
  isRecommendationActionable(
    recommendation: TradingRecommendation,
    confidenceThreshold: number = 0.7
  ): boolean {
    return (
      recommendation.confidence >= confidenceThreshold &&
      recommendation.action !== "HOLD"
    );
  }

  /**
   * Get risk-adjusted position size suggestion
   */
  getRiskAdjustedPositionSize(
    recommendation: TradingRecommendation,
    availableCash: number,
    riskTolerance: "LOW" | "MEDIUM" | "HIGH"
  ): number {
    const riskMultipliers = {
      LOW: 0.02, // 2% of available cash
      MEDIUM: 0.05, // 5% of available cash
      HIGH: 0.1, // 10% of available cash
    };

    const baseSize = availableCash * riskMultipliers[riskTolerance];
    const confidenceAdjustment = recommendation.confidence;
    const riskAdjustment =
      recommendation.riskLevel === "LOW"
        ? 1.2
        : recommendation.riskLevel === "HIGH"
          ? 0.7
          : 1.0;

    return Math.round(baseSize * confidenceAdjustment * riskAdjustment);
  }
}

export const recommendationService = new RecommendationService();
export default recommendationService;
