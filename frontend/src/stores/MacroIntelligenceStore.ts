import { makeAutoObservable, runInAction } from "mobx";
import { ApiStore } from "./ApiStore";

export interface EconomicIndicator {
  indicator: string;
  value: number;
  previousValue: number;
  forecast: number;
  impact: "low" | "medium" | "high";
  trend: "rising" | "falling" | "stable";
}

export interface EconomicAnalysis {
  country: string;
  overallHealth: number;
  indicators: EconomicIndicator[];
  trends: {
    gdpGrowth: number;
    inflation: number;
    unemployment: number;
    productivity: number;
  };
  risks: string[];
  opportunities: string[];
  outlook: "positive" | "neutral" | "negative";
  confidence: number;
  timestamp: Date;
}

export interface MonetaryPolicyAnalysis {
  centralBank: string;
  currentStance: "dovish" | "neutral" | "hawkish";
  rateExpectations: {
    nextMeeting: number;
    sixMonth: number;
    oneYear: number;
  };
  qeProbability: number;
  policyConsistency: number;
  marketImpact: {
    equities: "positive" | "neutral" | "negative";
    bonds: "positive" | "neutral" | "negative";
    currency: "positive" | "neutral" | "negative";
  };
}

export interface GeopoliticalRisk {
  eventType: string;
  severity: number;
  probability: number;
  timeframe: "immediate" | "short_term" | "medium_term" | "long_term";
  affectedRegions: string[];
  marketImpact: {
    riskAssets: number;
    safehaven: number;
    commodities: number;
    currencies: string[];
  };
  description: string;
}

export interface SectorHealthAnalysis {
  sector: string;
  healthScore: number;
  sentiment: number;
  fundamentalScore: number;
  momentum: number;
  valuation: number;
  earnings: {
    growthExpected: number;
    revisionTrend: "positive" | "neutral" | "negative";
    beatRate: number;
  };
  technicals: {
    trend: "bullish" | "neutral" | "bearish";
    support: number;
    resistance: number;
    rsi: number;
  };
  risks: string[];
  opportunities: string[];
}

export interface MarketTheme {
  theme: string;
  strength: number;
  duration: "short_term" | "medium_term" | "long_term";
  beneficiaries: string[];
  risks: string[];
  keyMetrics: string[];
  description: string;
}

export interface RegionalAnalysis {
  region: string;
  overallScore: number;
  economicScore: number;
  politicalStability: number;
  marketSentiment: number;
  currencyOutlook: "strengthening" | "stable" | "weakening";
  keyRisks: string[];
  opportunities: string[];
  topSectors: string[];
}

export interface CommodityOutlook {
  commodity: string;
  category: "energy" | "metals" | "agriculture" | "precious_metals";
  outlook: "bullish" | "neutral" | "bearish";
  priceTarget: {
    oneMonth: number;
    threeMonth: number;
    sixMonth: number;
    oneYear: number;
  };
  supplyDemandBalance: number;
  inventoryLevel: "low" | "normal" | "high";
  keyDrivers: string[];
  risks: string[];
}

export interface MacroEnvironment {
  globalGrowth: number;
  inflationTrend: "rising" | "stable" | "falling";
  liquidityConditions: "tight" | "neutral" | "loose";
  riskAppetite: number;
  volatilityRegime: "low" | "medium" | "high";
  dominantThemes: string[];
  keyEvents: string[];
  marketRegime: "bull" | "bear" | "sideways";
}

export class MacroIntelligenceStore {
  // Economic data
  economicAnalyses: Map<string, EconomicAnalysis> = new Map();
  monetaryPolicyAnalyses: Map<string, MonetaryPolicyAnalysis> = new Map();
  geopoliticalRisks: GeopoliticalRisk[] = [];

  // Market data
  sectorHealthAnalyses: SectorHealthAnalysis[] = [];
  marketThemes: MarketTheme[] = [];
  regionalAnalyses: RegionalAnalysis[] = [];
  commodityOutlooks: CommodityOutlook[] = [];

  // Environment
  macroEnvironment: MacroEnvironment | null = null;

  // UI state
  isLoading: boolean = false;
  error: string | null = null;

  constructor(private apiStore: ApiStore) {
    makeAutoObservable(this);
  }

  // Economic Analysis
  async fetchEconomicAnalysis(country: string): Promise<EconomicAnalysis> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const data = await this.apiStore.get<EconomicAnalysis>(
        `/macro-intelligence/economic/${country}`
      );

      runInAction(() => {
        this.economicAnalyses.set(country, data);
        this.isLoading = false;
      });

      return data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch economic analysis";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async fetchMultipleEconomicAnalyses(
    countries: string[]
  ): Promise<EconomicAnalysis[]> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const data = await this.apiStore.post<EconomicAnalysis[]>(
        "/macro-intelligence/economic/batch",
        { countries }
      );

      runInAction(() => {
        data.forEach((analysis) => {
          this.economicAnalyses.set(analysis.country, analysis);
        });
        this.isLoading = false;
      });

      return data;
    } catch (error: any) {
      runInAction(() => {
        this.error =
          error.message || "Failed to fetch multiple economic analyses";
        this.isLoading = false;
      });
      throw error;
    }
  }

  // Monetary Policy Analysis
  async fetchMonetaryPolicyAnalysis(
    centralBank: string
  ): Promise<MonetaryPolicyAnalysis> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const data = await this.apiStore.get<MonetaryPolicyAnalysis>(
        `/macro-intelligence/monetary-policy/${centralBank}`
      );

      runInAction(() => {
        this.monetaryPolicyAnalyses.set(centralBank, data);
        this.isLoading = false;
      });

      return data;
    } catch (error: any) {
      runInAction(() => {
        this.error =
          error.message || "Failed to fetch monetary policy analysis";
        this.isLoading = false;
      });
      throw error;
    }
  }

  // Geopolitical Risks
  async fetchGeopoliticalRisks(): Promise<GeopoliticalRisk[]> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const data = await this.apiStore.get<GeopoliticalRisk[]>(
        "/macro-intelligence/geopolitical-risks"
      );

      runInAction(() => {
        this.geopoliticalRisks = data;
        this.isLoading = false;
      });

      return data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch geopolitical risks";
        this.isLoading = false;
      });
      throw error;
    }
  }

  // Sector Health Analysis
  async fetchSectorHealthAnalysis(): Promise<SectorHealthAnalysis[]> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const data = await this.apiStore.get<SectorHealthAnalysis[]>(
        "/macro-intelligence/sector-health"
      );

      runInAction(() => {
        this.sectorHealthAnalyses = data;
        this.isLoading = false;
      });

      return data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch sector health analysis";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async fetchSectorHealthAnalysisFor(
    sector: string
  ): Promise<SectorHealthAnalysis> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const data = await this.apiStore.get<SectorHealthAnalysis>(
        `/macro-intelligence/sector-health/${sector}`
      );

      runInAction(() => {
        const existingIndex = this.sectorHealthAnalyses.findIndex(
          (s) => s.sector === sector
        );
        if (existingIndex >= 0) {
          this.sectorHealthAnalyses[existingIndex] = data;
        } else {
          this.sectorHealthAnalyses.push(data);
        }
        this.isLoading = false;
      });

      return data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch sector health analysis";
        this.isLoading = false;
      });
      throw error;
    }
  }

  // Market Themes
  async fetchMarketThemes(): Promise<MarketTheme[]> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const data = await this.apiStore.get<MarketTheme[]>(
        "/macro-intelligence/market-themes"
      );

      runInAction(() => {
        this.marketThemes = data;
        this.isLoading = false;
      });

      return data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch market themes";
        this.isLoading = false;
      });
      throw error;
    }
  }

  // Regional Analysis
  async fetchRegionalAnalysis(): Promise<RegionalAnalysis[]> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const data = await this.apiStore.get<RegionalAnalysis[]>(
        "/macro-intelligence/regional-analysis"
      );

      runInAction(() => {
        this.regionalAnalyses = data;
        this.isLoading = false;
      });

      return data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch regional analysis";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async fetchRegionalAnalysisFor(region: string): Promise<RegionalAnalysis> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const data = await this.apiStore.get<RegionalAnalysis>(
        `/macro-intelligence/regional-analysis/${region}`
      );

      runInAction(() => {
        const existingIndex = this.regionalAnalyses.findIndex(
          (r) => r.region === region
        );
        if (existingIndex >= 0) {
          this.regionalAnalyses[existingIndex] = data;
        } else {
          this.regionalAnalyses.push(data);
        }
        this.isLoading = false;
      });

      return data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch regional analysis";
        this.isLoading = false;
      });
      throw error;
    }
  }

  // Commodity Outlook
  async fetchCommodityOutlook(): Promise<CommodityOutlook[]> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const data = await this.apiStore.get<CommodityOutlook[]>(
        "/macro-intelligence/commodity-outlook"
      );

      runInAction(() => {
        this.commodityOutlooks = data;
        this.isLoading = false;
      });

      return data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch commodity outlook";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async fetchCommodityOutlookFor(commodity: string): Promise<CommodityOutlook> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const data = await this.apiStore.get<CommodityOutlook>(
        `/macro-intelligence/commodity-outlook/${commodity}`
      );

      runInAction(() => {
        const existingIndex = this.commodityOutlooks.findIndex(
          (c) => c.commodity === commodity
        );
        if (existingIndex >= 0) {
          this.commodityOutlooks[existingIndex] = data;
        } else {
          this.commodityOutlooks.push(data);
        }
        this.isLoading = false;
      });

      return data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch commodity outlook";
        this.isLoading = false;
      });
      throw error;
    }
  }

  // Macro Environment
  async fetchMacroEnvironment(): Promise<MacroEnvironment> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const data = await this.apiStore.get<MacroEnvironment>(
        "/macro-intelligence/macro-environment"
      );

      runInAction(() => {
        this.macroEnvironment = data;
        this.isLoading = false;
      });

      return data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch macro environment";
        this.isLoading = false;
      });
      throw error;
    }
  }

  // Utility methods
  clearError(): void {
    runInAction(() => {
      this.error = null;
    });
  }

  clearAllData(): void {
    runInAction(() => {
      this.economicAnalyses.clear();
      this.monetaryPolicyAnalyses.clear();
      this.geopoliticalRisks = [];
      this.sectorHealthAnalyses = [];
      this.marketThemes = [];
      this.regionalAnalyses = [];
      this.commodityOutlooks = [];
      this.macroEnvironment = null;
      this.error = null;
    });
  }

  // Computed getters
  get hasEconomicData(): boolean {
    return this.economicAnalyses.size > 0;
  }

  get hasMonetaryData(): boolean {
    return this.monetaryPolicyAnalyses.size > 0;
  }

  get hasGeopoliticalData(): boolean {
    return this.geopoliticalRisks.length > 0;
  }

  get hasSectorData(): boolean {
    return this.sectorHealthAnalyses.length > 0;
  }

  get hasThemeData(): boolean {
    return this.marketThemes.length > 0;
  }

  get hasRegionalData(): boolean {
    return this.regionalAnalyses.length > 0;
  }

  get hasCommodityData(): boolean {
    return this.commodityOutlooks.length > 0;
  }

  get hasEnvironmentData(): boolean {
    return this.macroEnvironment !== null;
  }
}
