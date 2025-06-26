export enum AssetClass {
  STOCKS = 'stocks',
  CRYPTO = 'crypto',
  FOREX = 'forex',
  COMMODITIES = 'commodities',
  BONDS = 'bonds',
  OPTIONS = 'options',
  FUTURES = 'futures',
}

export interface AssetIdentifier {
  class: AssetClass;
  symbol: string;
  exchange?: string;
  currency?: string;
}

export interface UnifiedMarketData {
  asset: AssetIdentifier;
  marketData: BaseMarketData;
  alternativeData?: AlternativeDataPoint[];
  crossAssetSignals?: CrossAssetSignal[];
  correlations?: CorrelationData;
  timestamp: Date;
}

export interface BaseMarketData {
  symbol: string;
  price: number;
  volume: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  timestamp: Date;
}

export interface CryptoMarketData extends BaseMarketData {
  spot: CryptoSpotData;
  futures?: CryptoFuturesData;
  fundingRate?: number;
  onChain: OnChainMetrics;
  defi?: DeFiMetrics;
  technicalIndicators: CryptoTechnicalIndicators;
}

export interface CryptoSpotData {
  symbol: string;
  price: number;
  volume24h: number;
  marketCap: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply?: number;
}

export interface CryptoFuturesData {
  symbol: string;
  price: number;
  fundingRate: number;
  openInterest: number;
  volume24h: number;
  premiumIndex: number;
  nextFundingTime: Date;
}

export interface OnChainMetrics {
  activeAddresses: number;
  transactionVolume: number;
  networkHashRate?: number;
  exchangeInflows: number;
  exchangeOutflows: number;
  whaleActivity: WhaleTransaction[];
  networkFees: number;
  difficulty?: number;
}

export interface WhaleTransaction {
  hash: string;
  amount: number;
  fromAddress: string;
  toAddress: string;
  timestamp: Date;
  type: 'inflow' | 'outflow' | 'internal';
}

export interface DeFiMetrics {
  totalValueLocked: number;
  liquidityPools: LiquidityPool[];
  yieldFarms: YieldFarm[];
  lendingRates: LendingRate[];
  borrowingRates: BorrowingRate[];
}

export interface LiquidityPool {
  protocol: string;
  pair: string;
  liquidity: number;
  volume24h: number;
  apr: number;
  fees24h: number;
}

export interface YieldFarm {
  protocol: string;
  pool: string;
  apr: number;
  tvl: number;
  rewards: string[];
}

export interface LendingRate {
  protocol: string;
  asset: string;
  supplyRate: number;
  borrowRate: number;
  utilization: number;
}

export interface BorrowingRate extends LendingRate {
  collateralFactor: number;
  liquidationThreshold: number;
}

export interface CryptoTechnicalIndicators {
  rsi: number;
  macd: MACDIndicator;
  bollingerBands: BollingerBands;
  support: number[];
  resistance: number[];
  trendDirection: 'bullish' | 'bearish' | 'sideways';
  volatility: number;
}

export interface ForexAnalysis {
  pair: string;
  technical: ForexTechnicalData;
  fundamental: ForexFundamentalData;
  sentiment: CentralBankSentiment;
  carryTrade: CarryTradeAnalysis;
  correlations: CurrencyCorrelationMatrix;
  economicEvents: EconomicEvent[];
}

export interface ForexTechnicalData {
  price: number;
  change: number;
  rsi: number;
  macd: MACDIndicator;
  movingAverages: {
    sma20: number;
    sma50: number;
    ema12: number;
    ema26: number;
  };
  fibonacci: FibonacciLevels;
  pivotPoints: PivotPoints;
}

export interface ForexFundamentalData {
  baseCurrency: string;
  quoteCurrency: string;
  interestRateDifferential: number;
  inflationDifferential: number;
  gdpGrowthDifferential: number;
  tradeBalance: number;
  currentAccountBalance: number;
}

export interface CentralBankSentiment {
  baseCurrencyPolicy: CentralBankPolicy;
  quoteCurrencyPolicy: CentralBankPolicy;
  overallSentiment: 'hawkish' | 'dovish' | 'neutral';
  confidenceLevel: number;
}

export interface CentralBankPolicy {
  currency: string;
  centralBank: string;
  currentRate: number;
  lastChange: number;
  nextMeeting: Date;
  stance: 'HAWKISH' | 'DOVISH' | 'NEUTRAL';
  expectedChange: number;
  policyStatement: string;
  votingRecord: {
    hawks: number;
    doves: number;
    neutral: number;
  };
}

export interface PolicyStatement {
  date: Date;
  content: string;
  sentiment: number; // -1 to 1, -1 being very dovish, 1 being very hawkish
  keywords: string[];
}

export interface CarryTradeAnalysis {
  differential: number;
  volatilityAdjusted: number;
  recommendation: 'long' | 'short' | 'neutral';
  confidence: number;
  riskAdjustedReturn: number;
  maxDrawdown: number;
}

export interface CurrencyCorrelationMatrix {
  baseCurrency: string;
  correlations: { [currency: string]: number };
  timeframe: string;
  updatedAt: Date;
}

export interface EconomicEvent {
  currency: string;
  event: string;
  importance: 'low' | 'medium' | 'high';
  forecast?: number;
  previous?: number;
  actual?: number;
  scheduledTime: Date;
  impact: 'bullish' | 'bearish' | 'neutral';
}

export interface SatelliteData {
  type: SatelliteDataType;
  location: GeographicCoordinate;
  data: any;
  timestamp: Date;
  confidence: number;
  source: string;
}

export enum SatelliteDataType {
  OIL_STORAGE = 'oil_storage',
  CROP_YIELD = 'crop_yield',
  MINING_ACTIVITY = 'mining_activity',
  SHIPPING_TRAFFIC = 'shipping_traffic',
  WEATHER_PATTERNS = 'weather_patterns',
}

export interface GeographicCoordinate {
  latitude: number;
  longitude: number;
  region?: string;
  country?: string;
}

export interface SocialSentimentData {
  twitter: SentimentMetric;
  reddit: SentimentMetric;
  newsVolume: NewsVolumeData;
  aggregatedScore: number;
  momentum: SentimentMomentum;
}

export interface SentimentMetric {
  score: number; // -1 to 1
  volume: number;
  mentions: number;
  engagement: number;
  influencerSentiment: number;
  timestamp: Date;
}

export interface NewsVolumeData {
  totalArticles: number;
  sentimentScore: number;
  keyTopics: string[];
  sourceCredibility: number;
  timestamp: Date;
}

export interface SentimentMomentum {
  direction: 'increasing' | 'decreasing' | 'stable';
  velocity: number;
  acceleration: number;
  turning_points: Date[];
}

export interface CrossAssetSignal {
  type: CrossAssetSignalType;
  source: AssetIdentifier;
  target: AssetIdentifier;
  strength: number;
  confidence: number;
  timeframe: string;
  description: string;
  actionable: boolean;
}

export enum CrossAssetSignalType {
  CORRELATION_BREAKDOWN = 'correlation_breakdown',
  ARBITRAGE_OPPORTUNITY = 'arbitrage_opportunity',
  MOMENTUM_DIVERGENCE = 'momentum_divergence',
  MEAN_REVERSION = 'mean_reversion',
  RISK_ON_OFF = 'risk_on_off',
  SECTOR_ROTATION = 'sector_rotation',
  CURRENCY_HEDGE = 'currency_hedge',
}

export interface CorrelationData {
  matrix: { [assetId: string]: { [assetId: string]: number } };
  assets: string[];
  timeframe: string;
  calculatedAt: Date;
  confidence: number;
}

export interface ArbitrageOpportunityData {
  id: string;
  type: ArbitrageType;
  assets: AssetIdentifier[];
  expectedReturn: number;
  requiredCapital: number;
  timeToExecution: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  expirationTime: Date;
  executionSteps: ArbitrageStep[];
}

export enum ArbitrageType {
  SPATIAL = 'spatial', // Same asset, different exchanges
  TEMPORAL = 'temporal', // Same asset, different time contracts
  TRIANGULAR = 'triangular', // Currency triangular arbitrage
  STATISTICAL = 'statistical', // Statistical arbitrage between correlated assets
  MERGER = 'merger', // Merger arbitrage
  CONVERTIBLE = 'convertible', // Convertible bond arbitrage
}

export interface ArbitrageStep {
  order: number;
  action: 'buy' | 'sell' | 'hedge';
  asset: AssetIdentifier;
  quantity: number;
  expectedPrice: number;
  exchange: string;
  timing: 'immediate' | 'conditional';
}

export interface MACDIndicator {
  value: number;
  signal: number;
  histogram: number;
  trend: 'bullish' | 'bearish' | 'neutral';
}

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  position: 'upper' | 'middle' | 'lower';
}

export interface FibonacciLevels {
  levels: { [level: string]: number };
  trend: 'uptrend' | 'downtrend';
  currentLevel: string;
}

export interface PivotPoints {
  pivot: number;
  resistance1: number;
  resistance2: number;
  resistance3: number;
  support1: number;
  support2: number;
  support3: number;
}

export interface AlternativeDataPoint {
  type: AlternativeDataType;
  value: any;
  timestamp: Date;
  source: string;
  reliability: number;
  impact: 'bullish' | 'bearish' | 'neutral';
}

export enum AlternativeDataType {
  SATELLITE_IMAGERY = 'satellite_imagery',
  SOCIAL_SENTIMENT = 'social_sentiment',
  ECONOMIC_INDICATOR = 'economic_indicator',
  WEATHER_DATA = 'weather_data',
  PATENT_FILING = 'patent_filing',
  EARNINGS_CALL_SENTIMENT = 'earnings_call_sentiment',
  SUPPLY_CHAIN = 'supply_chain',
  ESG_SCORES = 'esg_scores',
}

export type ForexPair = string; // e.g., 'EUR/USD', 'GBP/USD'

export interface ForexTick {
  symbol: ForexPair;
  assetClass: AssetClass;
  bid: number;
  ask: number;
  spread: number;
  timestamp: Date;
  volume: number;
  change24h: number;
  metadata: {
    sessionHigh: number;
    sessionLow: number;
    previousClose: number;
    interestRates: {
      base: number;
      quote: number;
    };
  };
}

export interface ForexOrderBook {
  symbol: ForexPair;
  assetClass: AssetClass;
  bids: OrderLevel[];
  asks: OrderLevel[];
  timestamp: Date;
  spread: number;
}

export interface OrderLevel {
  price: number;
  volume: number;
  orders: number;
}

export interface CarryTradeOpportunity {
  baseCurrency: string;
  quoteCurrency: string;
  pair: ForexPair;
  interestRateDifferential: number;
  expectedAnnualReturn: number;
  riskScore: number;
  currentPrice: number;
  recommendedAction: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  timeHorizon: string;
}

export interface CurrencyCorrelation {
  pair1: ForexPair;
  pair2: ForexPair;
  correlation: number;
  timeframe: string;
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
  direction: 'POSITIVE' | 'NEGATIVE';
}

export interface EconomicIndicator {
  currency: string;
  indicator: string;
  current: number;
  previous: number;
  forecast: number;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  releaseDate: Date;
  nextRelease: Date;
}

export interface ForexTechnicalIndicators {
  symbol: ForexPair;
  timeframe: string;
  sma20: number;
  sma50: number;
  sma200: number;
  ema12: number;
  ema26: number;
  rsi: number;
  macd: MACDIndicator;
  bollinger: BollingerBands;
  stochastic: {
    k: number;
    d: number;
  };
  atr: number;
  adx: number;
  williamsr: number;
  momentum: number;
  timestamp: Date;
}

export interface ForexTradeSignal {
  symbol: ForexPair;
  assetClass: AssetClass;
  type: 'TECHNICAL' | 'FUNDAMENTAL' | 'SENTIMENT';
  signal: 'BUY' | 'SELL' | 'HOLD';
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
  confidence: number;
  reason: string;
  timestamp: Date;
  metadata: any;
}

export interface CryptoTradeSignal {
  symbol: string;
  assetClass: AssetClass;
  type: 'TECHNICAL' | 'FUNDAMENTAL' | 'ONCHAIN' | 'DEFI';
  signal: 'BUY' | 'SELL' | 'HOLD';
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
  confidence: number;
  reason: string;
  timestamp: Date;
  metadata: any;
}

export enum CommodityType {
  ENERGY = 'energy',
  METALS = 'metals',
  AGRICULTURE = 'agriculture',
  LIVESTOCK = 'livestock',
}

export interface CommodityMarketData {
  symbol: string;
  assetClass: AssetClass;
  type: CommodityType;
  price: number;
  volume: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  timestamp: Date;
  spotPrice: number;
  futuresContracts: FuturesContract[];
  seasonalTrend: SeasonalPattern;
  supplyDemand: SupplyDemandData;
  inventory: InventoryLevel;
  technicalIndicators: CommodityTechnicalIndicators;
}

export interface FuturesContract {
  symbol: string;
  underlying: string;
  expirationDate: Date;
  price: number;
  volume: number;
  openInterest: number;
  change: number;
  impliedVolatility: number;
  timeToExpiration: number;
  contango: 'CONTANGO' | 'BACKWARDATION';
}

export interface SeasonalPattern {
  symbol: string;
  pattern: 'SEASONAL' | 'CYCLICAL' | 'NO_CLEAR_PATTERN';
  strongMonths: number[];
  weakMonths: number[];
  peakMonth: number;
  troughMonth: number;
  confidence: number;
  historicalAccuracy: number;
  factors: string[];
  currentPosition: 'PEAK_SEASON' | 'OFF_SEASON' | 'NEUTRAL';
}

export interface SupplyDemandData {
  symbol: string;
  supply: {
    current: number;
    projected: number;
    change: number;
    factors: string[];
  };
  demand: {
    current: number;
    projected: number;
    change: number;
    factors: string[];
  };
  deficit: number;
  priceElasticity: number;
  lastUpdated: Date;
}

export interface InventoryLevel {
  symbol: string;
  currentLevel: number;
  previousWeek: number;
  fiveYearAverage: number;
  percentOfAverage: number;
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  daysOfSupply: number;
  criticalLevel: number;
  surplusLevel: number;
  lastUpdated: Date;
}

export interface WeatherImpact {
  symbol: string;
  region: string;
  currentConditions: {
    temperature: number;
    precipitation: number;
    humidity: number;
    soilMoisture: number;
  };
  forecast: {
    temperature: number;
    precipitation: number;
    outlook: 'FAVORABLE' | 'CONCERNING' | 'NEUTRAL';
  };
  impact: {
    priceImpact: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    affectedRegions: string[];
    timeframe: string;
  };
  historicalComparison: {
    vsLastYear: number;
    vs10YearAverage: number;
    extremeWeatherProbability: number;
  };
}

export interface CommodityTechnicalIndicators {
  symbol: string;
  timeframe: string;
  price: number;
  sma20: number;
  sma50: number;
  sma200: number;
  ema12: number;
  ema26: number;
  rsi: number;
  macd: MACDIndicator;
  bollinger: BollingerBands;
  stochastic: {
    k: number;
    d: number;
  };
  atr: number;
  adx: number;
  seasonalStrength: number;
  momentum: number;
  volatility: number;
  trendDirection: 'bullish' | 'bearish' | 'sideways';
  timestamp: Date;
}

export interface CommodityTradeSignal {
  symbol: string;
  assetClass: AssetClass;
  type: 'TECHNICAL' | 'FUNDAMENTAL' | 'SEASONAL';
  signal: 'BUY' | 'SELL' | 'HOLD';
  strength: 'WEAK' | 'MODERATE' | 'STRONG';
  confidence: number;
  reason: string;
  timestamp: Date;
  metadata: any;
}

export interface PatentData {
  company: string;
  recentFilings: number;
  technologyAreas: string[];
  innovationScore: number;
  patentQuality: number;
  competitivePosition: 'leading' | 'competitive' | 'lagging';
  filingTrend: 'increasing' | 'decreasing' | 'stable';
  citationIndex: number;
}

export interface SupplyChainData {
  company: string;
  supplierDiversity: number;
  geographicRisk: number;
  disruptionScore: number;
  resilience: number;
  sustainability: number;
  keyRisks: string[];
  mitigationStrategies: string[];
}

export interface ESGScore {
  company: string;
  overallScore: number;
  environmental: number;
  social: number;
  governance: number;
  trend: 'improving' | 'declining' | 'stable';
  controversies: number;
  industryRank: number;
  lastUpdated: Date;
}

export interface MacroIndicator {
  name: string;
  value: number;
  change: number;
  impact: string;
  significance: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface CrossAssetPortfolioAllocation {
  allocations: { [assetId: string]: number };
  expectedReturn: number;
  expectedVolatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  correlationScore: number;
  riskScore: number;
  rebalanceFrequency: string;
  lastUpdated: Date;
}

export interface CrossAssetMomentum {
  asset: AssetIdentifier;
  momentum: number;
  strength: number;
  timeframe: string;
  direction: 'bullish' | 'bearish' | 'neutral';
}

export interface SectorRotationSignal {
  fromSector: string;
  toSector: string;
  strength: number;
  confidence: number;
  timeframe: string;
  reason: string;
}

export interface RiskOnOffSignal {
  regime: 'RISK_ON' | 'RISK_OFF';
  strength: number;
  confidence: number;
  indicators: string[];
  affectedAssets: AssetIdentifier[];
}

export interface MeanReversionSignal {
  asset: AssetIdentifier;
  currentLevel: number;
  meanLevel: number;
  deviation: number;
  probability: number;
  timeframe: string;
}

export interface CurrencyHedgingSignal {
  baseAsset: AssetIdentifier;
  hedgingInstrument: AssetIdentifier;
  hedgeRatio: number;
  effectiveness: number;
  cost: number;
  timeframe: string;
}

export interface SpatialArbitrage {
  asset: AssetIdentifier;
  exchanges: {
    exchange: string;
    price: number;
    volume: number;
    fees: number;
  }[];
  priceDifference: number;
  expectedReturn: number;
  executionTime: number;
}

export interface TemporalArbitrage {
  spotAsset: AssetIdentifier;
  futuresAsset: AssetIdentifier;
  spotPrice: number;
  futuresPrice: number;
  theoreticalPrice: number;
  mispricing: number;
  timeToExpiry: number;
  riskFreeRate: number;
}

export interface TriangularArbitrage {
  currencies: string[];
  exchangeRates: number[];
  impliedRate: number;
  actualRate: number;
  arbitrageSpread: number;
  executionPath: string[];
}

export interface StatisticalArbitrage {
  asset1: AssetIdentifier;
  asset2: AssetIdentifier;
  historicalCorrelation: number;
  currentSpread: number;
  spreadMean: number;
  spreadStdDev: number;
  zScore: number;
  confidence: number;
}

export interface PairsTradingOpportunity {
  pair: [AssetIdentifier, AssetIdentifier];
  correlation: number;
  cointegration: number;
  currentRatio: number;
  meanRatio: number;
  zScore: number;
  confidence: number;
  expectedReturn: number;
  recommendedAction: 'LONG_FIRST_SHORT_SECOND' | 'SHORT_FIRST_LONG_SECOND';
  entryPrice1: number;
  entryPrice2: number;
  stopLoss: number;
  takeProfit: number;
  timeframe: string;
}
