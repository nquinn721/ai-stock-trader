export interface EconomicIndicator {
  indicator: string;
  country: string;
  value: number;
  previousValue: number;
  forecast: number;
  timestamp: Date;
  unit: string;
  frequency: 'monthly' | 'quarterly' | 'annually';
  impact: 'low' | 'medium' | 'high';
}

export interface EconomicAnalysis {
  country: string;
  overallHealth: number; // 0-100 score
  indicators: EconomicIndicator[];
  trends: {
    gdpGrowth: number;
    inflation: number;
    unemployment: number;
    productivity: number;
  };
  risks: string[];
  opportunities: string[];
  outlook: 'positive' | 'neutral' | 'negative';
  confidence: number;
  timestamp: Date;
}

export interface InflationForecast {
  region: string;
  currentInflation: number;
  forecasts: {
    oneMonth: number;
    threeMonth: number;
    sixMonth: number;
    oneYear: number;
  };
  drivers: string[];
  risks: {
    upside: string[];
    downside: string[];
  };
  confidence: number;
  methodology: string[];
  timestamp: Date;
}

export interface GDPForecast {
  country: string;
  currentGDP: number;
  growthRate: number;
  forecasts: {
    nextQuarter: number;
    nextYear: number;
    twoYear: number;
  };
  sectorsContribution: {
    sector: string;
    contribution: number;
  }[];
  risks: string[];
  confidence: number;
  timestamp: Date;
}

export interface LaborMarketAnalysis {
  region: string;
  unemployment: {
    current: number;
    trend: number;
    forecast: number;
  };
  employment: {
    jobsCreated: number;
    participationRate: number;
    productivity: number;
  };
  wages: {
    growth: number;
    pressure: number;
    forecast: number;
  };
  sectors: {
    sector: string;
    employment: number;
    growth: number;
  }[];
  outlook: string;
  timestamp: Date;
}

export interface BusinessCyclePhase {
  economy: string;
  phase: 'expansion' | 'peak' | 'contraction' | 'trough';
  duration: number; // months in current phase
  strength: number; // 0-100
  indicators: {
    leading: number[];
    coincident: number[];
    lagging: number[];
  };
  nextPhase: {
    phase: string;
    probability: number;
    timeframe: string;
  };
  timestamp: Date;
}

export interface RecessionProbability {
  country: string;
  probability: {
    sixMonth: number;
    oneYear: number;
    twoYear: number;
  };
  indicators: {
    indicator: string;
    signal: 'positive' | 'negative' | 'neutral';
    weight: number;
  }[];
  historicalAccuracy: number;
  confidence: number;
  timestamp: Date;
}

export interface YieldCurveAnalysis {
  country: string;
  shape: 'normal' | 'flat' | 'inverted' | 'humped';
  inversion: {
    isInverted: boolean;
    duration: number;
    severity: number;
  };
  signals: {
    recession: number;
    growth: number;
    inflation: number;
  };
  historicalComparison: {
    similar: string[];
    outcomes: string[];
  };
  timestamp: Date;
}
