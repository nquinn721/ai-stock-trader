export interface ElectionData {
  country: string;
  type: 'presidential' | 'parliamentary' | 'local';
  date: Date;
  candidates: {
    name: string;
    party: string;
    platform: string[];
    marketFriendly: number; // -1 to 1
  }[];
  polls: {
    candidate: string;
    percentage: number;
    margin: number;
  }[];
  issues: string[];
}

export interface SanctionData {
  target: string;
  imposer: string[];
  type: string[];
  sectors: string[];
  startDate: Date;
  severity: number; // 0-1 scale
  compliance: number; // 0-1 scale
}

export interface ConflictData {
  regions: string[];
  type: 'trade' | 'military' | 'diplomatic' | 'cyber';
  severity: number; // 0-1 scale
  duration: number;
  parties: string[];
  issues: string[];
}

export interface StabilityScore {
  country: string;
  overall: number; // 0-100
  components: {
    political: number;
    economic: number;
    social: number;
    security: number;
  };
  trends: {
    shortTerm: number; // 3 months
    mediumTerm: number; // 1 year
    longTerm: number; // 3 years
  };
  risks: {
    type: string;
    probability: number;
    impact: number;
  }[];
  stabilizers: string[];
  timestamp: Date;
}

export interface ElectionPrediction {
  election: ElectionData;
  predictions: {
    candidate: string;
    winProbability: number;
    voteShare: number;
    confidence: number;
  }[];
  scenarios: {
    scenario: string;
    probability: number;
    marketImpact: {
      stocks: number;
      bonds: number;
      currency: number;
    };
  }[];
  keyFactors: string[];
  uncertainty: number;
  timestamp: Date;
}

export interface RegimeChangeRisk {
  country: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  probability: {
    sixMonth: number;
    oneYear: number;
    twoYear: number;
  };
  triggers: {
    economic: string[];
    political: string[];
    social: string[];
  };
  earlyWarnings: {
    indicator: string;
    status: 'green' | 'yellow' | 'red';
    trend: number;
  }[];
  marketImpact: {
    equities: number;
    bonds: number;
    currency: number;
    commodities: number;
  };
  timestamp: Date;
}

export interface TradeWarAnalysis {
  countries: string[];
  escalation: {
    current: number; // 0-1 scale
    trend: number;
    forecast: number;
  };
  measures: {
    type: string;
    sectors: string[];
    impact: number;
  }[];
  economicImpact: {
    country: string;
    gdpImpact: number;
    inflationImpact: number;
    sectorsAffected: string[];
  }[];
  marketImpact: {
    global: number;
    regional: { region: string; impact: number }[];
    sectors: { sector: string; impact: number }[];
  };
  resolution: {
    probability: number;
    timeframe: string;
    conditions: string[];
  };
  timestamp: Date;
}

export interface SanctionsImpact {
  sanctions: SanctionData;
  effectiveness: {
    economic: number; // 0-1 scale
    political: number;
    overall: number;
  };
  economicImpact: {
    target: {
      gdpImpact: number;
      tradeImpact: number;
      financialImpact: number;
    };
    imposers: {
      country: string;
      impact: number;
    }[];
    global: number;
  };
  marketEffects: {
    commodities: { commodity: string; impact: number }[];
    currencies: { currency: string; impact: number }[];
    sectors: { sector: string; impact: number }[];
  };
  adaptation: {
    workarounds: string[];
    newPartnerships: string[];
    effectiveness: number;
  };
  duration: {
    expected: number;
    factors: string[];
  };
  timestamp: Date;
}

export interface TensionAnalysis {
  region: string;
  tensionLevel: number; // 0-1 scale
  sources: {
    type: string;
    description: string;
    severity: number;
  }[];
  escalationRisk: {
    probability: number;
    timeframe: string;
    triggers: string[];
  };
  economicImpact: {
    trade: number;
    investment: number;
    growth: number;
  };
  marketImpact: {
    volatility: number;
    safeHaven: number;
    sectors: { sector: string; impact: number }[];
  };
  resolution: {
    paths: string[];
    probability: { path: string; chance: number }[];
  };
  timestamp: Date;
}

export interface ConflictRiskAssessment {
  regions: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  conflictTypes: {
    type: string;
    probability: number;
    severity: number;
  }[];
  drivers: {
    category: string;
    factors: string[];
    intensity: number;
  }[];
  timeframe: {
    immediate: number; // next 3 months
    shortTerm: number; // next year
    mediumTerm: number; // next 3 years
  };
  spilloverRisk: {
    regions: string[];
    probability: number;
    impact: number;
  }[];
  preventionMeasures: string[];
  timestamp: Date;
}

export interface SafeHavenAnalysis {
  eventType: string;
  safeHavens: {
    asset: string;
    strength: number; // 0-1 scale
    duration: string;
    capacity: number;
  }[];
  flows: {
    from: string[];
    to: string[];
    magnitude: number;
  };
  priceImpact: {
    asset: string;
    impact: number;
    timeframe: string;
  }[];
  conditions: {
    optimal: string[];
    deteriorating: string[];
  };
  historicalComparison: {
    event: string;
    similarity: number;
    outcome: string;
  }[];
  timestamp: Date;
}

export interface RefugeeFlowPrediction {
  conflict: ConflictData;
  projections: {
    timeframe: string;
    numbers: number;
    destinations: { country: string; percentage: number }[];
  }[];
  economicImpact: {
    origin: {
      laborMarket: number;
      consumption: number;
      investment: number;
    };
    destination: {
      country: string;
      fiscalImpact: number;
      laborImpact: number;
      socialImpact: number;
    }[];
  };
  marketEffects: {
    currencies: { currency: string; impact: number }[];
    bonds: { country: string; impact: number }[];
    sectors: { sector: string; impact: number }[];
  };
  policyResponse: {
    country: string;
    measures: string[];
    effectiveness: number;
  }[];
  timestamp: Date;
}
