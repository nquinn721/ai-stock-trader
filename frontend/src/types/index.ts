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
  signal: 'buy' | 'sell' | 'hold';
  confidence: number;
  targetPrice: number;
  currentPrice: number;
  reason: string;
  isActive: boolean;
  createdAt: string;
  stock?: Stock;
}

export interface SocketEvents {
  stock_updates: Stock[];
  stock_update: { symbol: string; data: Stock };
  trading_signal: TradingSignal;
  news_update: News;
}
