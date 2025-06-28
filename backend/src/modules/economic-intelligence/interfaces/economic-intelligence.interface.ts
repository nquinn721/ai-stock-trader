// Economic Analysis Types
export interface EconomicIndicator {
  name: string;
  value: number;
  previousValue: number;
  change: number;
  changePercent: number;
  releaseDate: Date;
  nextReleaseDate?: Date;
  importance: 'low' | 'medium' | 'high' | 'critical';
  unit: string;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annual';
}

export interface EconomicAnalysis {
  country: string;
  region: string;
  analysisDate: Date;
  indicators: EconomicIndicator[];
  gdpGrowth: {
    current: number;
    forecast: number;
    trend: 'accelerating' | 'stable' | 'decelerating';
  };
  inflation: {
    current: number;
    forecast: number;
    trend: 'rising' | 'stable' | 'falling';
  };
  employment: {
    unemploymentRate: number;
    jobGrowth: number;
    trend: 'improving' | 'stable' | 'deteriorating';
  };
  overallAssessment: 'bullish' | 'neutral' | 'bearish';
  riskScore: number; // 0-100
  marketImpact: 'positive' | 'neutral' | 'negative';
}

export interface InflationForecast {
  region: string;
  timeframe: string;
  currentInflation: number;
  forecastInflation: number;
  confidence: number; // 0-1
  factors: string[];
  marketImpact: {
    bonds: 'positive' | 'negative' | 'neutral';
    stocks: 'positive' | 'negative' | 'neutral';
    currency: 'strengthening' | 'weakening' | 'neutral';
  };
  pressures: {
    wage: number;
    energy: number;
    housing: number;
    supply: number;
  };
}

export interface GDPForecast {
  country: string;
  quarter: string;
  currentGDP: number;
  forecastGDP: number;
  growthRate: number;
  confidence: number;
  contributingFactors: {
    consumption: number;
    investment: number;
    government: number;
    netExports: number;
  };
  risks: string[];
  marketImplications: string[];
}

export interface LaborMarketAnalysis {
  region: string;
  unemployment: {
    current: number;
    trend: 'improving' | 'stable' | 'deteriorating';
    forecast: number;
  };
  jobGrowth: {
    monthly: number;
    annual: number;
    sectors: { [sector: string]: number };
  };
  wages: {
    growth: number;
    inflationAdjusted: number;
    pressures: 'high' | 'medium' | 'low';
  };
  participation: {
    rate: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  };
  marketImpact: 'hawkish' | 'dovish' | 'neutral';
}

export interface BusinessCyclePhase {
  economy: string;
  phase: 'expansion' | 'peak' | 'contraction' | 'trough';
  confidence: number;
  duration: number; // months in current phase
  indicators: {
    leading: EconomicIndicator[];
    coincident: EconomicIndicator[];
    lagging: EconomicIndicator[];
  };
  nextPhase: {
    predicted: 'expansion' | 'peak' | 'contraction' | 'trough';
    timeframe: string;
    probability: number;
  };
}

export interface RecessionProbability {
  country: string;
  timeframe: '6m' | '12m' | '24m';
  probability: number; // 0-1
  indicators: {
    yieldCurve: number;
    employment: number;
    leading: number;
    sentiment: number;
  };
  triggers: string[];
  severity: 'mild' | 'moderate' | 'severe';
}

// Monetary Policy Types
export interface PolicyStanceAnalysis {
  centralBank: string;
  stance: 'dovish' | 'neutral' | 'hawkish';
  confidence: number;
  keyPhrases: string[];
  sentiment: number; // -1 to 1
  policySignals: {
    rates: 'cut' | 'hold' | 'hike';
    qe: 'expand' | 'maintain' | 'taper';
    guidance: 'accommodative' | 'neutral' | 'restrictive';
  };
  marketReaction: {
    expected: 'bullish' | 'neutral' | 'bearish';
    currency: 'strengthen' | 'neutral' | 'weaken';
    bonds: 'rally' | 'neutral' | 'sell-off';
  };
}

export interface RateDecisionPrediction {
  centralBank: string;
  meetingDate: Date;
  currentRate: number;
  predictedAction: 'cut' | 'hold' | 'hike';
  magnitude: number; // basis points
  probability: number; // 0-1
  factors: {
    inflation: number;
    employment: number;
    growth: number;
    markets: number;
  };
  marketPricing: number; // what markets expect
  surpriseRisk: 'low' | 'medium' | 'high';
}

export interface QEProbabilityAssessment {
  centralBank: string;
  timeframe: string;
  probability: number;
  triggers: string[];
  scale: 'small' | 'medium' | 'large';
  marketImpact: {
    bonds: string;
    currency: string;
    equities: string;
  };
}

// Geopolitical Types
export interface StabilityScore {
  country: string;
  score: number; // 0-100
  factors: {
    political: number;
    economic: number;
    social: number;
    external: number;
  };
  trend: 'improving' | 'stable' | 'deteriorating';
  risks: string[];
  marketImpact: 'positive' | 'neutral' | 'negative';
}

export interface ElectionPrediction {
  country: string;
  electionDate: Date;
  candidates: {
    name: string;
    party: string;
    probability: number;
    marketFriendly: boolean;
  }[];
  keyIssues: string[];
  marketImplications: {
    currency: string;
    stocks: string;
    sectors: { [sector: string]: string };
  };
  uncertaintyLevel: 'low' | 'medium' | 'high';
}

export interface ConflictRiskAssessment {
  regions: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  timeframe: string;
  triggers: string[];
  economicImpact: {
    global: string;
    regional: string;
    sectors: { [sector: string]: string };
  };
  safeHavenAssets: string[];
}

export interface GeopoliticalEvent {
  id: string;
  type:
    | 'conflict'
    | 'election'
    | 'treaty'
    | 'sanction'
    | 'trade_dispute'
    | 'diplomatic_crisis';
  country: string;
  region: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: number; // 0-1
  timeframe: string;
  description: string;
  marketImpact: {
    currencies: { [currency: string]: 'positive' | 'negative' | 'neutral' };
    commodities: { [commodity: string]: 'positive' | 'negative' | 'neutral' };
    sectors: { [sector: string]: 'positive' | 'negative' | 'neutral' };
  };
}

export interface GeopoliticalRiskAssessment {
  region: string;
  assessmentDate: Date;
  overallRisk: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  keyEvents: GeopoliticalEvent[];
  conflictRisk: number;
  politicalStability: number;
  economicSanctions: {
    active: boolean;
    severity: number;
    impactedSectors: string[];
  };
  tradeRelations: {
    [country: string]: 'improving' | 'stable' | 'deteriorating';
  };
  marketImplications: string[];
}

// Market Intelligence Types
export interface MacroTradingSignal {
  signal: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  timeframe: '1w' | '1m' | '3m' | '6m' | '1y';
  reasoning: string[];
  assets: {
    stocks: 'overweight' | 'neutral' | 'underweight';
    bonds: 'overweight' | 'neutral' | 'underweight';
    currencies: { [currency: string]: 'strong' | 'neutral' | 'weak' };
    commodities: 'overweight' | 'neutral' | 'underweight';
  };
  sectors: { [sector: string]: 'overweight' | 'neutral' | 'underweight' };
}

export interface SectorRotationRecommendation {
  fromSectors: string[];
  toSectors: string[];
  reasoning: string;
  confidence: number;
  timeframe: string;
  economicDrivers: string[];
  expectedReturn: number;
  riskLevel: 'low' | 'medium' | 'high';
}
