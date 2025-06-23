// ML Core Interfaces for Stock Trading App
// Defines the data structures for machine learning predictions and features

export interface MLPrediction {
  id: string;
  modelName: string;
  modelVersion: string;
  input: Record<string, any>;
  output: Record<string, any>;
  confidence: number;
  timestamp: Date;
  executionTime: number;
}

export interface TechnicalFeatures {
  symbol: string;
  timestamp: Date;
  price: number;
  volume: number;
  rsi: number;
  macd: number;
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  movingAverages: {
    sma20: number;
    sma50: number;
    ema12: number;
    ema26: number;
  };
  support: number;
  resistance: number;
  volatility: number;
  momentum: number;
}

export interface BreakoutPrediction {
  symbol: string;
  probability: number;
  direction: 'UP' | 'DOWN';
  confidence: number;
  targetPrice: number;
  timeHorizon: number; // hours
  riskScore: number;
  features: TechnicalFeatures;
  modelVersion: string;
  timestamp: Date;
}

export interface RiskParameters {
  portfolioId: number;
  symbol: string;
  recommendedPosition: number; // percentage of portfolio
  stopLoss: number;
  takeProfit: number;
  maxDrawdown: number;
  volatilityAdjustment: number;
  correlationRisk: number;
  timestamp: Date;
}

export interface SentimentScore {
  symbol: string;
  overallSentiment: number; // -1 to 1
  newsCount: number;
  confidence: number;
  topics: {
    earnings: number;
    analyst: number;
    product: number;
    regulatory: number;
    market: number;
  };
  impactScore: number; // 0 to 1
  timeDecay: number;
  sources?: {
    news: number;
    social: number;
    analyst: number;
  };
  volatilityPrediction?: number;
  timestamp: Date;
}

export interface MarketState {
  vixLevel: number;
  marketTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  sectorRotation: Record<string, number>;
  liquidity: number;
  timestamp: Date;
}

export interface ModelMetrics {
  modelName: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  sharpeRatio?: number;
  maxDrawdown?: number;
  totalReturn?: number;
  sampleSize: number;
  evaluationPeriod: {
    start: Date;
    end: Date;
  };
  timestamp: Date;
}

export interface MLModelConfig {
  name: string;
  version: string;
  type: 'breakout' | 'risk' | 'sentiment' | 'portfolio';
  endpoint: string;
  timeout: number;
  retries: number;
  features: string[];
  outputFormat: Record<string, string>;
  metadata: Record<string, any>;
}

export interface PortfolioOptimization {
  portfolioId: number;
  recommendations: {
    symbol: string;
    currentWeight: number;
    recommendedWeight: number;
    confidence: number;
    reasoning: string;
  }[];
  expectedReturn: number;
  expectedRisk: number;
  sharpeRatio: number;
  diversificationScore: number;
  timestamp: Date;
}

export interface PatternRecognition {
  symbol: string;
  patterns: {
    type: string;
    confidence: number;
    timeframe: string;
    startDate: Date;
    endDate: Date;
    prediction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    targetPrice?: number;
  }[];
  timestamp: Date;
}

export interface MLServiceConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  apiKey?: string;
  models: {
    breakout: MLModelConfig;
    risk: MLModelConfig;
    sentiment: MLModelConfig;
    portfolio: MLModelConfig;
  };
}

export interface ABTestResult {
  testName: string;
  controlModel: string;
  variantModel: string;
  metrics: {
    accuracy: { control: number; variant: number; improvement: number };
    precision: { control: number; variant: number; improvement: number };
    recall: { control: number; variant: number; improvement: number };
    roi: { control: number; variant: number; improvement: number };
  };
  sampleSize: number;
  significance: number;
  confidence: number;
  recommendation: 'DEPLOY' | 'CONTINUE_TESTING' | 'REJECT';
  timestamp: Date;
}

// ==================== PHASE 3 (S29) INTERFACES ====================

export interface MarketPrediction {
  symbol: string;
  timestamp: Date;
  horizonPredictions: HorizonPrediction[];
  ensemblePrediction: EnsemblePrediction;
  uncertaintyBounds: UncertaintyBounds;
  signals: TradingSignals;
  confidence: number;
  modelVersions: any;
  executionTime: number;
}

export interface HorizonPrediction {
  horizon: string;
  predictions: ModelPrediction[];
  ensemble: EnsemblePrediction;
  confidence: number;
  timestamp: Date;
}

export interface ModelPrediction {
  modelId: string;
  modelType: 'timeseries' | 'technical' | 'fundamental' | 'regime';
  prediction: any;
  weight: number;
}

export interface EnsemblePrediction {
  returnPrediction: number;
  priceTarget: number;
  confidence: number;
  horizonWeights?: number[];
  ensembleMethod?: string;
}

export interface UncertaintyBounds {
  prediction: number;
  standardError: number;
  confidenceIntervals: {
    '68%': [number, number];
    '95%': [number, number];
    '99%': [number, number];
  };
  predictionInterval: [number, number];
}

export interface TradingSignals {
  signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  strength: number;
  reasoning: string;
  thresholds: {
    buyThreshold: number;
    sellThreshold: number;
    confidenceThreshold: number;
    uncertaintyThreshold: number;
  };
  riskMetrics: {
    maxDrawdown: number;
    volatility: number;
    sharpeRatio: number;
  };
  // Extended properties for Phase 3 advanced signals
  factors?: any;
  riskAssessment?: any;
  timingAnalysis?: any;
  positionSizing?: any;
  levels?: any;
  confidence?: number;
  executionPriority?: 'LOW' | 'MEDIUM' | 'HIGH';
  validUntil?: Date;
  metadata?: {
    generatedAt: Date;
    version: string;
    modelInputs: string[];
    executionTime: number;
  };
}

export interface AdvancedPatternRecognition {
  symbol: string;
  timeframes: string[];
  patterns: DetectedPattern[];
  confidence: number;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  explanation: string;
  timestamp: Date;
}

export interface DetectedPattern {
  type: string;
  confidence: number;
  timeframe: string;
  description: string;
  bullishness: number; // -1 to 1
  reliability: number; // 0 to 1
}
