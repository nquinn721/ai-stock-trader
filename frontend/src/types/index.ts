export interface SentimentData {
  score: number;
  label: string;
  confidence: number;
  articlesAnalyzed: number;
  lastUpdated?: string;
}

// Pattern Recognition Interfaces
export interface CandlestickPattern {
  type:
    | "doji"
    | "hammer"
    | "hanging_man"
    | "shooting_star"
    | "inverted_hammer"
    | "bullish_engulfing"
    | "bearish_engulfing"
    | "morning_star"
    | "evening_star"
    | "three_white_soldiers"
    | "three_black_crows"
    | "piercing_pattern"
    | "dark_cloud_cover"
    | "harami"
    | "harami_cross"
    | "none";
  confidence: number;
  direction: "bullish" | "bearish" | "neutral";
  significance: "strong" | "moderate" | "weak";
  timeframe: string;
  date: string;
  description: string;
  reliability: number; // 0-1 historical reliability score
}

export interface ChartPattern {
  type:
    | "head_and_shoulders"
    | "inverse_head_and_shoulders"
    | "double_top"
    | "double_bottom"
    | "triple_top"
    | "triple_bottom"
    | "ascending_triangle"
    | "descending_triangle"
    | "symmetrical_triangle"
    | "rising_wedge"
    | "falling_wedge"
    | "bull_flag"
    | "bear_flag"
    | "bull_pennant"
    | "bear_pennant"
    | "cup_and_handle"
    | "rectangle"
    | "channel_up"
    | "channel_down"
    | "none";
  confidence: number;
  direction: "bullish" | "bearish" | "neutral";
  breakoutTarget: number;
  stopLoss: number;
  timeframe: string;
  patternStart: string;
  patternEnd: string;
  description: string;
  volume_confirmation: boolean;
}

export interface PatternRecognitionAnalysis {
  candlestickPatterns: CandlestickPattern[];
  chartPatterns: ChartPattern[];
  patternSummary: {
    bullishSignals: number;
    bearishSignals: number;
    neutralSignals: number;
    overallSentiment: "bullish" | "bearish" | "neutral";
    confidence: number;
  };
  aiPatternScore: number; // 0-1 ML confidence in pattern detection
  recommendedAction: "buy" | "sell" | "hold" | "watch";
}

export interface DayTradingPattern {
  type:
    | "flag"
    | "pennant"
    | "double_top"
    | "double_bottom"
    | "head_shoulders"
    | "inverse_head_shoulders"
    | "triangle"
    | "rectangle"
    | "wedge"
    | "none";
  confidence: number;
  direction: "bullish" | "bearish" | "neutral";
  entryPoint: number;
  targetPrice: number;
  stopLoss: number;
  timeframe: string;
  description: string;
}

export interface VolumeSpike {
  date: string;
  volume: number;
  ratio: number; // Ratio compared to average volume
  significance: "high" | "medium" | "low";
}

export interface SupportResistanceLevel {
  price: number;
  strength: "strong" | "moderate" | "weak";
  type: "support" | "resistance";
  touches: number; // Number of times price has tested this level
  confidence: number; // 0-1 confidence score
  zone: {
    upper: number;
    lower: number;
  };
  timeframe: string;
  lastTested: string;
}

export interface SupportResistanceAnalysis {
  currentSupport: number;
  currentResistance: number;
  supportLevels: SupportResistanceLevel[];
  resistanceLevels: SupportResistanceLevel[];
  pivotPoints: {
    pivot: number;
    s1: number;
    s2: number;
    s3: number;
    r1: number;
    r2: number;
    r3: number;
  };  keyZones: {
    price: number;
    type: "support" | "resistance";
    strength: number;
  }[];
}

// Risk Management Interfaces
export interface RiskManagementRecommendation {
  positionSizing: {
    recommendedShares: number;
    positionSize: number; // dollar amount
    portfolioAllocation: number; // percentage
    maxRiskAmount: number; // maximum loss if stopped out
    riskPercentage: number; // risk as % of portfolio
  };
  riskReward: {
    riskAmount: number;
    rewardAmount: number;
    riskRewardRatio: number; // reward/risk ratio
    breakEvenProbability: number; // minimum win rate needed
    expectedValue: number; // mathematical expectation
  };
  stopLoss: {
    price: number;
    percentage: number; // distance from entry
    atrBasedStop: number; // ATR-based stop loss
    technicalStop: number; // based on support/resistance
    recommendedStop: number; // final recommendation
    stopType: "technical" | "atr" | "percentage" | "volatility";
  };
  takeProfit: {
    targets: Array<{
      price: number;
      percentage: number;
      probability: number;
      reasoning: string;
    }>;
    primaryTarget: number;
    conservativeTarget: number;
    aggressiveTarget: number;
  };
  portfolioRisk: {
    currentExposure: number; // current portfolio risk %
    afterTradeExposure: number; // risk % after this trade
    correlationRisk: number; // risk from correlated positions
    sectorConcentration: number; // concentration in this sector
    recommendation: "low_risk" | "moderate_risk" | "high_risk" | "excessive_risk";
  };
  riskScore: number; // 0-100 overall risk score
  recommendation: "PROCEED" | "REDUCE_SIZE" | "WAIT" | "AVOID";
  reasoning: string[];
}

export interface BreakoutStrategy {
  signal: "bullish" | "bearish" | "neutral";
  probability: number;
  supportLevel: number;
  resistanceLevel: number;
  currentTrend: "upward" | "downward" | "sideways";
  volatility: number;
  rsi: number;
  bollingerPosition: "upper" | "middle" | "lower";
  recommendation: string;
  confidence: number;
  lastCalculated: string;
  dayTradingPatterns: DayTradingPattern[];
  patternRecognition?: PatternRecognitionAnalysis;
  technicalIndicators?: {
    sma20?: number;
    sma50?: number;
    sma200?: number;
    ema12?: number;
    ema26?: number;
    ema9?: number;
    macd?: {
      macd: number;
      signal: number;
      histogram: number;
    };
    bollingerBands?: {
      upper: number;
      middle: number;
      lower: number;
    };
    stochastic?: {
      k: number;
      d: number;
      signal: "overbought" | "oversold" | "neutral";
    };
    williamsR?: {
      value: number;
      signal: "overbought" | "oversold" | "neutral";
    };
    atr?: {
      value: number;
      normalized: number; // ATR as percentage of price
    };
    volatilityIndicators?: {
      historicalVolatility: number;
      averageVolatility: number;
      volatilityRank: number; // 0-100 percentile rank
      regime: "low" | "normal" | "high";
    };
  };
  volumeAnalysis?: {
    currentVolume: number;
    avgVolume: number;
    volumeRatio: number;
    vwap: number;
    volumeSpikes: VolumeSpike[];
    volumeTrend: "increasing" | "decreasing" | "stable";
    volumeStrength: "high" | "medium" | "low";
  };
  supportResistanceAnalysis?: SupportResistanceAnalysis;
  modelPredictions: {
    neuralNetwork: number;
    svmLike: number;
    ensemble: number;
    momentum: number;
    meanReversion: number;
  };
  riskManagement?: RiskManagementRecommendation;
}

export interface NewsArticle {
  title: string;
  sentiment: string;
  score: number;
  confidence: number;
  source: string;
  publishedAt: string;
}

export interface Stock {
  id: number;
  symbol: string;
  name: string;
  sector: string;
  description: string;
  currentPrice: number;
  previousClose: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  createdAt: string;
  updatedAt: string;
  sentiment?: SentimentData;
  recentNews?: NewsArticle[];
  breakoutStrategy?: BreakoutStrategy;
}

export interface StockPrice {
  id: number;
  stockId: number;
  open: number;
  high: number;
  low: number;
  close: number;
  adjustedClose: number;
  volume: number;
  date: string;
  createdAt: string;
}

export interface News {
  id: number;
  stockId: number;
  title: string;
  content: string;
  url: string;
  source: string;
  publishedAt: string;
  sentimentScore: number;
  sentimentLabel: string;
  createdAt: string;
}

export interface TradingSignal {
  id: number;
  stockId: number;
  signal: "buy" | "sell" | "hold";
  confidence: number;
  targetPrice: number;
  currentPrice: number;
  reason: string;
  isActive: boolean;
  createdAt: string;
  stock?: Stock;
}

export interface Portfolio {
  id: number;
  name: string;
  initialCash: number;
  currentCash: number;
  totalValue: number;
  totalPnL: number;
  totalReturn: number;
  isActive: boolean;
  positions?: Position[];
  trades?: Trade[];
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: number;
  portfolioId: number;
  stockId: number;
  symbol: string;
  quantity: number;
  averagePrice: number;
  totalCost: number;
  currentValue: number;
  unrealizedPnL: number;
  unrealizedReturn: number;
  stock?: Stock;
  createdAt: string;
  updatedAt: string;
}

export interface Trade {
  id: number;
  portfolioId: number;
  stockId: number;
  symbol: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  totalValue: number;
  commission: number;
  status: "pending" | "executed" | "cancelled" | "failed";
  notes?: string;
  stock?: Stock;
  executedAt: string;
}

export interface CreateTradeRequest {
  portfolioId: number;
  symbol: string;
  type: "buy" | "sell";
  quantity: number;
}

export interface CreatePortfolioRequest {
  name: string;
  initialCash?: number;
}
export interface PortfolioUpdate {
  portfolioId: number;
  totalValue: number;
  totalPnL: number;
  totalReturn: number;
  currentCash: number;
  dayGain: number;
  dayGainPercent: number;
  timestamp: string;
  positions: Position[];
}

export interface SocketEvents {
  stock_updates: Stock[];
  stock_update: { symbol: string; data: Stock };
  trading_signal: TradingSignal;
  news_update: News;
  portfolio_update: PortfolioUpdate;
  portfolio_error: { portfolioId: number; message: string; timestamp: string };
}
