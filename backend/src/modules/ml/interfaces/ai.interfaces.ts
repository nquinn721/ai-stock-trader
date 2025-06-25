export interface LLMConfig {
  provider: 'openai' | 'anthropic';
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface UserContext {
  userId: string;
  portfolio?: {
    holdings: PortfolioHolding[];
    totalValue: number;
    performance: {
      daily: number;
      weekly: number;
      monthly: number;
    };
  };
  tradingHistory?: TradingHistory[];
  riskProfile?: 'conservative' | 'moderate' | 'aggressive';
  preferences?: UserPreferences;
}

export interface PortfolioHolding {
  symbol: string;
  quantity: number;
  currentPrice: number;
  purchasePrice: number;
  value: number;
  gainLoss: number;
  gainLossPercent: number;
}

export interface TradingHistory {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  timestamp: Date;
  profit?: number;
}

export interface UserPreferences {
  sectors?: string[];
  riskTolerance?: number;
  investmentGoal?: string;
  timeHorizon?: string;
}

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
  type: 'VIEW_STOCK' | 'PLACE_ORDER' | 'ADJUST_PORTFOLIO' | 'VIEW_ANALYSIS';
  symbol?: string;
  parameters?: Record<string, any>;
  description: string;
}

export interface ExplanationContext {
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  indicators: Record<string, number>;
  marketConditions: MarketConditions;
  riskFactors: string[];
  priceTarget?: number;
  stopLoss?: number;
  timeHorizon?: string;
}

export interface MarketConditions {
  marketTrend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS';
  volatility: number;
  volume: number;
  sector: string;
  marketCap: string;
  news?: NewsItem[];
}

export interface NewsItem {
  headline: string;
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  relevance: number;
  source: string;
  publishedAt: Date;
}

export interface ConversationContext {
  conversationId: string;
  userId: string;
  messages: ChatMessage[];
  lastInteraction: Date;
  context: Record<string, any>;
}
