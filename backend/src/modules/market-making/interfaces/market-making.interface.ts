export interface MarketConditions {
  volatility: number;
  volume: number;
  spread: number;
  liquidity: number;
  trendDirection: 'UP' | 'DOWN' | 'SIDEWAYS';
  momentum: number;
  marketDepth: OrderBookDepth;
}

export interface OrderBookDepth {
  bidLevels: PriceLevel[];
  askLevels: PriceLevel[];
  midPrice: number;
  weightedMidPrice: number;
}

export interface PriceLevel {
  price: number;
  quantity: number;
  orders: number;
}

export interface OptimalSpread {
  bidPrice: number;
  askPrice: number;
  spread: number;
  confidence: number;
  expectedProfit: number;
  riskAdjustedReturn: number;
  optimalBidSize: number;
  optimalAskSize: number;
}

export interface Position {
  symbol: string;
  quantity: number;
  averagePrice: number;
  marketValue: number;
  unrealizedPnl: number;
  realizedPnl: number;
  lastUpdated: Date;
}

export interface RiskLimits {
  maxPositionSize: number;
  maxNotional: number;
  maxLeverage: number;
  stopLossPercent: number;
  maxDrawdown: number;
  varLimit: number;
  concentrationLimit: number;
}

export interface InventoryAction {
  action: 'HOLD' | 'REDUCE' | 'HEDGE' | 'LIQUIDATE';
  quantity: number;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  strategy: string;
  expectedTimeframe: number; // minutes
  riskReduction: number; // percentage
}

export interface FairValueCalculation {
  fairValue: number;
  confidence: number;
  methodology: string;
  dataQuality: number;
  staleness: number; // milliseconds since last update
  adjustments: FairValueAdjustment[];
}

export interface FairValueAdjustment {
  type: 'SPREAD' | 'VOLUME' | 'VOLATILITY' | 'NEWS' | 'CORRELATION';
  adjustment: number;
  reasoning: string;
}

export interface OptimalQuotes {
  bid: Quote;
  ask: Quote;
  confidence: number;
  expectedProfitPerShare: number;
  riskScore: number;
}

export interface Quote {
  price: number;
  size: number;
  venue: string;
  orderType: 'LIMIT' | 'MARKET' | 'STOP';
}

export interface MarketMakingStrategy {
  name: string;
  type: 'CONSERVATIVE' | 'AGGRESSIVE' | 'BALANCED' | 'SCALPING';
  symbols: string[];
  maxSpreadWidth: number;
  inventoryTarget: number;
  riskProfile: RiskProfile;
  parameters: StrategyParameters;
}

export interface RiskProfile {
  tolerance: 'LOW' | 'MEDIUM' | 'HIGH';
  maxVar: number;
  maxDrawdown: number;
  leverageLimit: number;
}

export interface StrategyParameters {
  spreadMultiplier: number;
  inventoryPenalty: number;
  volatilityAdjustment: number;
  momentumFactor: number;
  reverseInventoryThreshold: number;
}

export interface ExecutionResult {
  orderId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  status: 'FILLED' | 'PARTIAL' | 'PENDING' | 'REJECTED';
  venue: string;
  timestamp: Date;
  commission: number;
  slippage: number;
}

export interface RiskExposure {
  symbol: string;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  totalExposure: number;
  marketValue: number;
}

export interface HedgingAction {
  action: 'DELTA_HEDGE' | 'GAMMA_HEDGE' | 'VEGA_HEDGE' | 'CROSS_HEDGE';
  instrument: string;
  quantity: number;
  expectedCost: number;
  riskReduction: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export interface MarketMakingService {
  // Core market making
  calculateOptimalSpread(
    symbol: string,
    market: MarketConditions
  ): Promise<OptimalSpread>;
  
  manageInventory(
    position: Position,
    riskLimits: RiskLimits
  ): Promise<InventoryAction>;

  // Pricing and valuation
  calculateFairValue(
    symbol: string,
    venue: string
  ): Promise<FairValueCalculation>;
  
  optimizePriceQuotes(orderBook: OrderBookDepth): Promise<OptimalQuotes>;

  // Execution and hedging
  executeMarketMakingOrders(
    strategy: MarketMakingStrategy
  ): Promise<ExecutionResult[]>;
  
  hedgePosition(exposure: RiskExposure): Promise<HedgingAction>;
}
