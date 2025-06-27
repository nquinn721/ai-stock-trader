export interface MarketDataProvider {
  symbol: string;
  exchange: string;
  dataType: 'REAL_TIME' | 'DELAYED' | 'HISTORICAL';
  connectionStatus: 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';
}

export interface MarketDataSubscription {
  id: string;
  symbol: string;
  exchanges: string[];
  dataTypes: string[];
  callback: (data: MarketDataUpdate) => void;
  isActive: boolean;
  createdAt: Date;
  lastUpdate: Date;
}

export interface MarketDataUpdate {
  symbol: string;
  exchange: string;
  timestamp: Date;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  volatility?: number;
  vwap?: number;
  orderBook?: OrderBookSnapshot;
}

export interface OrderBookSnapshot {
  symbol: string;
  exchange: string;
  timestamp: Date;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  sequence: number;
}

export interface OrderBookLevel {
  price: number;
  size: number;
  orders: number;
  venue?: string;
}

export interface MarketDataAggregation {
  symbol: string;
  consolidatedBid: number;
  consolidatedAsk: number;
  consolidatedLast: number;
  totalVolume: number;
  weightedPrice: number;
  bestBidExchange: string;
  bestAskExchange: string;
  exchanges: string[];
  timestamp: Date;
  spread: number;
  liquidityScore: number;
}

export interface MarketDataService {
  // Data subscription management
  subscribe(subscription: Omit<MarketDataSubscription, 'id' | 'createdAt' | 'lastUpdate'>): Promise<string>;
  unsubscribe(subscriptionId: string): Promise<boolean>;
  getActiveSubscriptions(): Promise<MarketDataSubscription[]>;
  
  // Real-time data access
  getCurrentMarketData(symbol: string, exchange?: string): Promise<MarketDataUpdate>;
  getOrderBook(symbol: string, exchange?: string, depth?: number): Promise<OrderBookSnapshot>;
  getAggregatedMarketData(symbol: string): Promise<MarketDataAggregation>;
  
  // Historical data access
  getHistoricalData(symbol: string, fromDate: Date, toDate: Date, interval: string): Promise<MarketDataUpdate[]>;
  getHistoricalOrderBook(symbol: string, timestamp: Date, exchange?: string): Promise<OrderBookSnapshot>;
  
  // Market analytics
  calculateVWAP(symbol: string, timeWindow: number): Promise<number>;
  calculateVolatility(symbol: string, periods: number): Promise<number>;
  getMarketDepthAnalytics(symbol: string): Promise<MarketDepthAnalytics>;
  
  // Provider management
  addDataProvider(provider: MarketDataProvider): Promise<boolean>;
  removeDataProvider(providerId: string): Promise<boolean>;
  getDataProviders(): Promise<MarketDataProvider[]>;
  getProviderStatus(providerId: string): Promise<string>;
}

export interface MarketDepthAnalytics {
  symbol: string;
  timestamp: Date;
  totalBidVolume: number;
  totalAskVolume: number;
  imbalanceRatio: number;
  supportLevels: PriceLevel[];
  resistanceLevels: PriceLevel[];
  liquidityGaps: LiquidityGap[];
  marketImpact: MarketImpact;
}

export interface PriceLevel {
  price: number;
  volume: number;
  strength: number;
}

export interface LiquidityGap {
  startPrice: number;
  endPrice: number;
  gapSize: number;
  direction: 'BID' | 'ASK';
}

export interface MarketImpact {
  symbol: string;
  buyImpact: ImpactCurve[];
  sellImpact: ImpactCurve[];
  averageSpread: number;
  liquidityScore: number;
}

export interface ImpactCurve {
  quantity: number;
  priceImpact: number;
  cost: number;
}
