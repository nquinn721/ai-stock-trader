export interface Portfolio {
  id: string;
  name: string;
  totalValue: number;
  positions: PortfolioPosition[];
  cash: number;
  marginUsed: number;
  marginAvailable: number;
  dayPnl: number;
  totalPnl: number;
  lastUpdated: Date;
}

export interface PortfolioPosition {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  realizedPnl: number;
  weight: number;
  sector: string;
  assetClass: string;
}

export interface VaRCalculation {
  var95: number;
  var99: number;
  expectedShortfall95: number;
  expectedShortfall99: number;
  confidenceLevel: number;
  timeHorizon: number; // days
  methodology: 'HISTORICAL' | 'PARAMETRIC' | 'MONTE_CARLO';
  lastCalculated: Date;
}

export interface ConcentrationAnalysis {
  herfindahlIndex: number;
  topPositionsWeight: number;
  sectorConcentration: SectorExposure[];
  assetClassConcentration: AssetClassExposure[];
  riskScore: number;
  recommendations: ConcentrationRecommendation[];
}

export interface SectorExposure {
  sector: string;
  weight: number;
  risk: number;
  positions: number;
}

export interface AssetClassExposure {
  assetClass: string;
  weight: number;
  risk: number;
  positions: number;
}

export interface ConcentrationRecommendation {
  type: 'REDUCE' | 'DIVERSIFY' | 'HEDGE' | 'MONITOR';
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  impactScore: number;
}

export interface OptionsPosition {
  symbol: string;
  optionType: 'CALL' | 'PUT';
  strike: number;
  expiration: Date;
  quantity: number;
  premium: number;
  underlyingPrice: number;
  impliedVolatility: number;
  timeToExpiry: number;
}

export interface GreeksCalculation {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  deltaDollar: number;
  gammaDollar: number;
  thetaDollar: number;
  vegaDollar: number;
  rhoDollar: number;
  lastUpdated: Date;
}

export interface HedgingExecution {
  hedgeId: string;
  strategy: string;
  instruments: HedgeInstrument[];
  totalCost: number;
  expectedRiskReduction: number;
  executionTime: Date;
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'PENDING';
  slippage: number;
}

export interface HedgeInstrument {
  symbol: string;
  type: 'STOCK' | 'OPTION' | 'FUTURES' | 'ETF';
  quantity: number;
  price: number;
  side: 'BUY' | 'SELL';
  hedgeRatio: number;
}

export interface StressScenario {
  id: string;
  name: string;
  description: string;
  type: 'HISTORICAL' | 'HYPOTHETICAL' | 'REGULATORY';
  marketShocks: MarketShock[];
  probability: number;
}

export interface MarketShock {
  assetClass: string;
  shockType: 'PRICE' | 'VOLATILITY' | 'CORRELATION' | 'LIQUIDITY';
  magnitude: number;
  direction: 'UP' | 'DOWN' | 'BOTH';
  duration: number; // days
}

export interface StressTestResults {
  scenarioId: string;
  portfolioImpact: number;
  worstCaseValue: number;
  bestCaseValue: number;
  probabilityDistribution: PnLDistribution[];
  riskMetrics: StressTestRiskMetrics;
  recommendations: StressTestRecommendation[];
}

export interface PnLDistribution {
  percentile: number;
  value: number;
  probability: number;
}

export interface StressTestRiskMetrics {
  maxDrawdown: number;
  timeToRecovery: number;
  varIncrease: number;
  liquidityRisk: number;
  correlationBreakdown: number;
}

export interface StressTestRecommendation {
  type: 'HEDGE' | 'REDUCE_EXPOSURE' | 'INCREASE_CASH' | 'DIVERSIFY';
  description: string;
  costEstimate: number;
  riskReduction: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ShockImpactAnalysis {
  shockId: string;
  immediateImpact: number;
  recoveryTime: number;
  liquidityImpact: number;
  correlationEffects: CorrelationEffect[];
  cascadingRisks: CascadingRisk[];
  mitigationStrategies: MitigationStrategy[];
}

export interface CorrelationEffect {
  asset1: string;
  asset2: string;
  normalCorrelation: number;
  stressCorrelation: number;
  impact: number;
}

export interface CascadingRisk {
  trigger: string;
  affected: string[];
  probability: number;
  magnitude: number;
  timeframe: number;
}

export interface MitigationStrategy {
  strategy: string;
  effectiveness: number;
  cost: number;
  implementationTime: number;
  feasibility: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface RiskManagementService {
  // Portfolio risk assessment
  calculatePortfolioVaR(
    portfolio: Portfolio,
    timeframe: string
  ): Promise<VaRCalculation>;
  
  assessConcentrationRisk(
    positions: PortfolioPosition[]
  ): Promise<ConcentrationAnalysis>;

  // Dynamic hedging
  calculateGreeks(optionsPosition: OptionsPosition): Promise<GreeksCalculation>;
  
  executeDynamicHedge(exposure: RiskExposure): Promise<HedgingExecution>;

  // Stress testing
  performStressTesting(scenarios: StressScenario[]): Promise<StressTestResults>;
  
  simulateMarketShock(shockParams: MarketShock): Promise<ShockImpactAnalysis>;
}

// Re-export from market-making interface to avoid circular dependencies
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
