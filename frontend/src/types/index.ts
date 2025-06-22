export interface SentimentData {
  score: number;
  label: string;
  confidence: number;
  articlesAnalyzed: number;
  lastUpdated?: string;
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
  significance: 'high' | 'medium' | 'low';
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
  };
  volumeAnalysis?: {
    currentVolume: number;
    avgVolume: number;
    volumeRatio: number;
    vwap: number;
    volumeSpikes: VolumeSpike[];
    volumeTrend: 'increasing' | 'decreasing' | 'stable';
    volumeStrength: 'high' | 'medium' | 'low';
  };
  modelPredictions: {
    neuralNetwork: number;
    svmLike: number;
    ensemble: number;
    momentum: number;
    meanReversion: number;
  };
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
