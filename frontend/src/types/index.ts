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

export interface SocketEvents {
  stock_updates: Stock[];
  stock_update: { symbol: string; data: Stock };
  trading_signal: TradingSignal;
  news_update: News;
}
