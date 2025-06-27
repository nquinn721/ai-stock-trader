import { ExecutionResult } from './market-making.interface';

export interface LiquidityPool {
  id: string;
  protocol: string;
  tokenA: string;
  tokenB: string;
  fee: number;
  totalLiquidity: number;
  volume24h: number;
  apr: number;
  impermanentLossRisk: number;
}

export interface MeanReversionParams {
  lookbackPeriod: number;
  meanReversionSpeed: number;
  entryThreshold: number;
  exitThreshold: number;
  maxHoldingPeriod: number;
  stopLossThreshold: number;
  positionSizing: number;
}

export interface MomentumSignals {
  symbol: string;
  priceChange: number;
  volumeRatio: number;
  rsi: number;
  macdSignal: number;
  bollingerPosition: number;
  momentumScore: number;
  confidence: number;
}

export interface Strategy {
  id: string;
  name: string;
  type: 'MEAN_REVERSION' | 'MOMENTUM' | 'ARBITRAGE' | 'STATISTICAL';
  status: 'ACTIVE' | 'INACTIVE' | 'PAUSED';
  parameters: any;
  performance: StrategyPerformance;
  riskMetrics: StrategyRiskMetrics;
}

export interface StrategyPerformance {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  averageTrade: number;
  totalTrades: number;
}

export interface StrategyRiskMetrics {
  var95: number;
  var99: number;
  expectedShortfall: number;
  volatility: number;
  beta: number;
  correlationToMarket: number;
}

export interface StrategyResult {
  strategyId: string;
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  expectedReturn: number;
  riskScore: number;
  recommendedSize: number;
  timeframe: number;
}

export interface ArbitrageOpportunity {
  id: string;
  type: 'SPATIAL' | 'TEMPORAL' | 'STATISTICAL' | 'TRIANGULAR';
  instruments: ArbitrageInstrument[];
  profitPotential: number;
  riskScore: number;
  requiredCapital: number;
  executionTimeframe: number;
  confidence: number;
  discovered: Date;
  expires: Date;
}

export interface ArbitrageInstrument {
  symbol: string;
  venue: string;
  price: number;
  quantity: number;
  side: 'BUY' | 'SELL';
  weight: number;
}

export interface ArbitrageResult {
  opportunityId: string;
  executed: boolean;
  actualProfit: number;
  expectedProfit: number;
  slippage: number;
  executionTime: number;
  costs: ArbitrageCosts;
  trades: ExecutionResult[];
}

export interface ArbitrageCosts {
  commissions: number;
  fees: number;
  borrowingCosts: number;
  marketImpact: number;
  total: number;
}

export interface DeFiPosition {
  poolId: string;
  protocol: string;
  tokenA: TokenPosition;
  tokenB: TokenPosition;
  lpTokens: number;
  initialValue: number;
  currentValue: number;
  impermanentLoss: number;
  feesEarned: number;
  apr: number;
}

export interface TokenPosition {
  symbol: string;
  amount: number;
  initialPrice: number;
  currentPrice: number;
  value: number;
}

export interface LiquidityResult {
  transactionHash: string;
  poolId: string;
  lpTokensReceived: number;
  estimatedApr: number;
  impermanentLossRisk: number;
  positionValue: number;
  gas: number;
}

export interface ImpermanentLossStrategy {
  strategy: 'HEDGE' | 'REBALANCE' | 'EXIT' | 'MONITOR';
  currentLoss: number;
  projectedLoss: number;
  hedgingCost: number;
  recommendedAction: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface LiquidityProvisionService {
  // Strategy management
  implementMeanReversionStrategy(
    parameters: MeanReversionParams
  ): Promise<Strategy>;
  
  executeMomentumStrategy(signals: MomentumSignals): Promise<StrategyResult>;

  // Cross-venue operations
  detectArbitrageOpportunities(): Promise<ArbitrageOpportunity[]>;
  
  executeCrossVenueArbitrage(
    opportunity: ArbitrageOpportunity
  ): Promise<ArbitrageResult>;

  // DeFi integration
  provideLiquidityToDEX(
    pool: LiquidityPool,
    amount: number
  ): Promise<LiquidityResult>;
  
  manageImpermanentLoss(
    position: DeFiPosition
  ): Promise<ImpermanentLossStrategy>;
}
