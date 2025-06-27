export interface FedSpeech {
  speaker: string;
  title: string;
  content: string;
  date: Date;
  venue: string;
  hawkishScore: number; // -1 to 1
  topics: string[];
}

export interface PolicyStatement {
  centralBank: string;
  date: Date;
  statement: string;
  rateDecision: number;
  guidance: string;
  votingSummary: {
    member: string;
    vote: 'raise' | 'hold' | 'cut';
  }[];
}

export interface PolicyStanceAnalysis {
  centralBank: string;
  stance: 'dovish' | 'neutral' | 'hawkish';
  confidence: number;
  change: number; // change from previous stance
  keyThemes: string[];
  concerns: string[];
  priorities: string[];
  marketImpact: {
    currencies: { currency: string; impact: number }[];
    bonds: { maturity: string; impact: number }[];
    stocks: { sector: string; impact: number }[];
  };
  timestamp: Date;
}

export interface RateDecisionPrediction {
  centralBank: string;
  meetingDate: Date;
  currentRate: number;
  predictions: {
    cut50: number;   // probability of 50bp cut
    cut25: number;   // probability of 25bp cut
    hold: number;    // probability of no change
    raise25: number; // probability of 25bp raise
    raise50: number; // probability of 50bp raise
  };
  consensusView: number; // expected rate change
  marketPricing: number; // what markets are pricing in
  factors: {
    factor: string;
    impact: 'dovish' | 'hawkish' | 'neutral';
    weight: number;
  }[];
  confidence: number;
  timestamp: Date;
}

export interface QEProbabilityAssessment {
  centralBank: string;
  probability: {
    threeMonth: number;
    sixMonth: number;
    oneYear: number;
  };
  factors: {
    economic: string[];
    financial: string[];
    political: string[];
  };
  expectedScale: {
    size: number;
    duration: number;
    assetTypes: string[];
  };
  marketImpact: {
    bonds: number;
    currencies: number;
    stocks: number;
  };
  historicalComparison: string[];
  timestamp: Date;
}

export interface ImpactAnalysis {
  rateChange: number;
  sectors: {
    sector: string;
    impact: number; // -1 to 1
    reasoning: string;
  }[];
  currencies: {
    currency: string;
    impact: number;
    timeframe: string;
  }[];
  bonds: {
    maturity: string;
    priceImpact: number;
    yieldImpact: number;
  }[];
  commodities: {
    commodity: string;
    impact: number;
    mechanism: string;
  }[];
  confidence: number;
  timestamp: Date;
}

export interface InterventionRisk {
  currency: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: number;
  triggers: {
    level: number;
    volatility: number;
    timeframe: string;
  };
  historicalInterventions: {
    date: Date;
    level: number;
    effectiveness: number;
  }[];
  marketImpact: {
    immediate: number;
    sustained: number;
  };
  timestamp: Date;
}

export interface PolicyDivergenceAnalysis {
  countries: string[];
  divergence: {
    current: number; // 0-1 scale
    trend: number;
    forecast: number;
  };
  drivers: string[];
  implications: {
    currencies: { pair: string; impact: number }[];
    bonds: { spread: string; impact: number }[];
    flows: { direction: string; magnitude: number }[];
  };
  opportunities: string[];
  risks: string[];
  timestamp: Date;
}

export interface GuidanceAnalysis {
  centralBank: string;
  guidance: string;
  clarity: number; // 0-1 scale
  commitment: number; // 0-1 scale
  timeframe: string;
  conditions: string[];
  marketReaction: {
    immediate: number;
    sustained: number;
  };
  credibility: number;
  timestamp: Date;
}

export interface ConsistencyMetrics {
  centralBank: string;
  consistency: {
    overall: number; // 0-1 scale
    communications: number;
    actions: number;
  };
  deviations: {
    date: Date;
    type: string;
    impact: number;
  }[];
  credibilityTrend: number[];
  marketTrust: number;
  timestamp: Date;
}
