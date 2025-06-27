export interface ExchangeConfig {
  name: string;
  apiKey: string;
  secretKey: string;
  passphrase?: string;
  sandbox?: boolean;
  baseUrl?: string;
  wsUrl?: string;
  rateLimits: {
    requests: number;
    interval: number; // milliseconds
    weight?: number;
  };
}

export interface ExchangeOrderBook {
  symbol: string;
  exchange: string;
  timestamp: Date;
  bids: [number, number][];  // [price, quantity]
  asks: [number, number][];  // [price, quantity]
  sequence?: number;
  checksum?: string;
}

export interface ExchangeTicker {
  symbol: string;
  exchange: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume?: number;
  change: number;
  changePercent: number;
  vwap?: number;
}

export interface ExchangeTrade {
  id: string;
  symbol: string;
  exchange: string;
  timestamp: Date;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  maker?: boolean;
}

export interface ExchangeOrder {
  id: string;
  clientOrderId?: string;
  symbol: string;
  exchange: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce: 'GTC' | 'IOC' | 'FOK' | 'GTT';
  status: 'pending' | 'open' | 'filled' | 'cancelled' | 'rejected';
  filledQuantity: number;
  remainingQuantity: number;
  averagePrice?: number;
  fees?: ExchangeFee[];
  timestamp: Date;
  updatedAt: Date;
}

export interface ExchangeFee {
  currency: string;
  amount: number;
  rate: number;
}

export interface ExchangeBalance {
  currency: string;
  exchange: string;
  available: number;
  locked: number;
  total: number;
  timestamp: Date;
}

export interface ExchangePosition {
  symbol: string;
  exchange: string;
  side: 'long' | 'short';
  size: number;
  notionalValue: number;
  entryPrice: number;
  markPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  margin: number;
  percentage: number;
  timestamp: Date;
}

export interface ExchangeCandle {
  symbol: string;
  exchange: string;
  interval: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume?: number;
  trades?: number;
}

export interface ExchangeConnector {
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getExchangeInfo(): Promise<ExchangeInfo>;

  // Market data
  getTicker(symbol: string): Promise<ExchangeTicker>;
  getTickers(symbols?: string[]): Promise<ExchangeTicker[]>;
  getOrderBook(symbol: string, limit?: number): Promise<ExchangeOrderBook>;
  getTrades(symbol: string, limit?: number): Promise<ExchangeTrade[]>;
  getCandles(symbol: string, interval: string, limit?: number): Promise<ExchangeCandle[]>;

  // Trading
  createOrder(order: CreateOrderRequest): Promise<ExchangeOrder>;
  cancelOrder(orderId: string, symbol: string): Promise<boolean>;
  getOrder(orderId: string, symbol: string): Promise<ExchangeOrder>;
  getOrders(symbol?: string, status?: string): Promise<ExchangeOrder[]>;
  getOrderHistory(symbol?: string, limit?: number): Promise<ExchangeOrder[]>;

  // Account
  getBalances(): Promise<ExchangeBalance[]>;
  getPositions(): Promise<ExchangePosition[]>;
  getTradingFees(symbol?: string): Promise<TradingFees>;

  // WebSocket streams
  subscribeOrderBook(symbol: string, callback: (data: ExchangeOrderBook) => void): Promise<void>;
  subscribeTicker(symbol: string, callback: (data: ExchangeTicker) => void): Promise<void>;
  subscribeTrades(symbol: string, callback: (data: ExchangeTrade) => void): Promise<void>;
  subscribeOrders(callback: (data: ExchangeOrder) => void): Promise<void>;
  subscribeBalances(callback: (data: ExchangeBalance[]) => void): Promise<void>;

  // Unsubscribe
  unsubscribeOrderBook(symbol: string): Promise<void>;
  unsubscribeTicker(symbol: string): Promise<void>;
  unsubscribeTrades(symbol: string): Promise<void>;
  unsubscribeOrders(): Promise<void>;
  unsubscribeBalances(): Promise<void>;
  unsubscribeAll(): Promise<void>;
}

export interface CreateOrderRequest {
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit';
  quantity: number;
  price?: number;
  stopPrice?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK' | 'GTT';
  clientOrderId?: string;
  reduceOnly?: boolean;
  postOnly?: boolean;
}

export interface ExchangeInfo {
  name: string;
  status: 'online' | 'maintenance' | 'offline';
  serverTime: Date;
  rateLimits: RateLimit[];
  symbols: SymbolInfo[];
  filters: ExchangeFilter[];
}

export interface SymbolInfo {
  symbol: string;
  status: 'trading' | 'halt' | 'break';
  baseAsset: string;
  quoteAsset: string;
  baseAssetPrecision: number;
  quoteAssetPrecision: number;
  minQuantity: number;
  maxQuantity: number;
  stepSize: number;
  minPrice: number;
  maxPrice: number;
  tickSize: number;
  minNotional: number;
  maxNotional?: number;
  filters: SymbolFilter[];
}

export interface RateLimit {
  rateLimitType: 'REQUEST_WEIGHT' | 'ORDERS' | 'RAW_REQUESTS';
  interval: 'SECOND' | 'MINUTE' | 'DAY';
  intervalNum: number;
  limit: number;
  count?: number;
}

export interface ExchangeFilter {
  filterType: string;
  [key: string]: any;
}

export interface SymbolFilter {
  filterType: 'PRICE_FILTER' | 'LOT_SIZE' | 'MIN_NOTIONAL' | 'ICEBERG_PARTS' | 'MARKET_LOT_SIZE';
  minPrice?: number;
  maxPrice?: number;
  tickSize?: number;
  minQty?: number;
  maxQty?: number;
  stepSize?: number;
  minNotional?: number;
  applyToMarket?: boolean;
  avgPriceMins?: number;
  limit?: number;
}

export interface TradingFees {
  symbol?: string;
  makerFee: number;
  takerFee: number;
  buyerIsBroker?: boolean;
  sellerIsBroker?: boolean;
  timestamp: Date;
}

export interface ExchangeError {
  code: number;
  message: string;
  exchange: string;
  timestamp: Date;
  data?: any;
}

export interface ExchangeApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ExchangeError;
  rateLimitInfo?: {
    remaining: number;
    resetTime: Date;
    weight: number;
  };
}
