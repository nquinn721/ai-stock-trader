/**
 * S39: Predictive Analytics Interfaces
 * Types and interfaces for real-time predictive analytics dashboard
 */

export interface PredictionData {
  symbol: string;
  timestamp: Date;
  predictions: MultiTimeframePrediction;
  sentiment: SentimentData;
  regime: MarketRegime;
  riskMetrics: RiskMetrics;
  confidence: number;
}

export interface MultiTimeframePrediction {
  oneHour: TimeframePrediction;
  fourHour: TimeframePrediction;
  oneDay: TimeframePrediction;
}

export interface TimeframePrediction {
  direction: 'bullish' | 'bearish' | 'neutral';
  targetPrice: number;
  confidence: number;
  probability: number;
  timeHorizon: Date;
  changePercent: number;
}

export interface SentimentData {
  score: number; // -1 to 1
  confidence: number;
  sources: {
    news: number;
    social: number;
    analyst: number;
  };
  recentEvents: SentimentEvent[];
  trending: 'rising' | 'falling' | 'stable';
  lastUpdated: Date;
}

export interface SentimentEvent {
  id: string;
  timestamp: Date;
  impact: 'positive' | 'negative' | 'neutral';
  text: string;
  source: 'news' | 'social' | 'analyst';
  strength: number;
}

export interface MarketRegime {
  current: 'bull' | 'bear' | 'sideways';
  confidence: number;
  duration: number; // days in current regime
  strength: number; // 0-1
  nextTransition: Date | null;
  historicalRegimes: RegimeHistory[];
}

export interface RegimeHistory {
  regime: 'bull' | 'bear' | 'sideways';
  startDate: Date;
  endDate: Date;
  duration: number;
  performance: number;
}

export interface RiskMetrics {
  volatilityPrediction: number;
  confidenceBands: {
    upper: number;
    lower: number;
  };
  maxDrawdown: number;
  sharpeRatio: number;
  varPercentile: {
    p95: number;
    p99: number;
  };
  correlationRisk: number;
  liquidityRisk: number;
  concentration: number;
  drawdownProbability: number;
  supportResistance: {
    support: number;
    resistance: number;
    confidence: number;
  };
  positionSizing: number;
  riskScore: number; // 0-1
}

export interface PredictionUpdate {
  type: 'prediction-update';
  symbol: string;
  timestamp: Date;
  data: PredictionData;
  changeDetected: PredictionChange[];
}

export interface PredictionChange {
  type:
    | 'direction_change'
    | 'regime_change'
    | 'sentiment_change'
    | 'risk_change';
  timeframe?: string;
  from: any;
  to: any;
  confidence?: number;
  magnitude?: number;
  significance: 'low' | 'medium' | 'high';
}

// Chart overlay interfaces
export interface PredictionOverlay {
  type:
    | 'prediction_line'
    | 'confidence_band'
    | 'sentiment_overlay'
    | 'regime_indicator';
  timeframe: string;
  data: any[];
  color: string;
  opacity: number;
  visible: boolean;
}

export interface ChartPrediction {
  timestamp: Date;
  price: number;
  confidence: number;
  type: 'bullish' | 'bearish' | 'neutral';
}

export interface ConfidenceBand {
  timestamp: Date;
  upper: number;
  lower: number;
  confidence: number;
}

// WebSocket event types
export interface PredictionSubscription {
  symbol: string;
  timeframes: string[];
  includeRisk: boolean;
  includeSentiment: boolean;
  updateInterval: number; // seconds
}

export interface PredictionAlert {
  id: string;
  symbol: string;
  type:
    | 'direction_change'
    | 'regime_shift'
    | 'sentiment_spike'
    | 'risk_threshold';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: Date;
  actionRequired: boolean;
  suggestedActions?: string[];
}

// Analytics configuration
export interface PredictiveAnalyticsConfig {
  updateInterval: number; // seconds
  confidenceThreshold: number;
  sentimentWeight: number;
  regimeWeight: number;
  riskWeight: number;
  alertThresholds: {
    directionChange: number;
    sentimentChange: number;
    riskIncrease: number;
  };
}
