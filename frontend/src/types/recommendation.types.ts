// S19 AI-Powered Trading Recommendation Types

export interface RecommendationRequest {
  symbol: string;
  currentPrice: number;
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
}

export interface RecommendationMetrics {
  marketPrediction: {
    direction: "BUY" | "SELL" | "HOLD";
    confidence: number;
    timeHorizon: "1D" | "1W" | "1M";
    priceTarget?: number;
  };

  technicalSignals: {
    strength: number;
    signals: Array<{
      type: string;
      value: number;
      weight: number;
    }>;
  };

  sentimentAnalysis: {
    score: number;
    sources: string[];
    confidence: number;
  };

  riskAssessment: {
    level: "LOW" | "MEDIUM" | "HIGH";
    factors: string[];
    maxDrawdown: number;
    volatility: number;
  };

  patternRecognition: {
    patterns: Array<{
      type: string;
      confidence: number;
      implications: string;
    }>;
  };

  ensembleScore: number;
  finalConfidence: number;
}

export interface TradingRecommendation {
  symbol: string;
  action: "BUY" | "SELL" | "HOLD";
  confidence: number;
  reasoning: string[];
  metrics: RecommendationMetrics;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  positionSize?: number;
  stopLoss?: number;
  takeProfit?: number;
  timeHorizon: "1D" | "1W" | "1M";
  timestamp: Date;
}

export interface EnhancedRecommendation extends TradingRecommendation {
  ensembleSignals: {
    overallConfidence: number;
    signalStrength: number;
    conflictAnalysis: string;
    timeframes: string[];
    ensembleMethod: string;
  };
  enhancedMetrics: RecommendationMetrics & {
    ensembleConfidence: number;
    signalStrength: number;
    conflictResolution: string;
  };
  compositeScore: number;
  integrationMetadata: {
    s19Used: boolean;
    s29bUsed: boolean;
    integrationTimestamp: Date;
    integrationMethod: string;
  };
}

export interface RecommendationExplanation {
  symbol: string;
  explanation: {
    summary: string;
    keyFactors: Array<{
      factor: string;
      impact: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
      weight: number;
      explanation: string;
    }>;
    riskFactors: Array<{
      risk: string;
      severity: "LOW" | "MEDIUM" | "HIGH";
      mitigation: string;
    }>;
    technicalAnalysis: {
      supportLevels: number[];
      resistanceLevels: number[];
      trends: Array<{
        timeframe: string;
        direction: "UP" | "DOWN" | "SIDEWAYS";
        strength: number;
      }>;
    };
    marketContext: {
      marketCondition: string;
      volatility: number;
      correlation: {
        sector: number;
        market: number;
      };
    };
  };
  confidence: number;
  timestamp: Date;
}

export interface BatchRecommendationRequest {
  requests: RecommendationRequest[];
}

export interface BatchRecommendationResponse {
  recommendations: TradingRecommendation[];
  batchId: string;
  timestamp: Date;
  totalProcessed: number;
  errors?: Array<{
    symbol: string;
    error: string;
  }>;
}
