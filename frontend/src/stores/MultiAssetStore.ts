import { makeAutoObservable, runInAction } from "mobx";
import { ApiStore } from "./ApiStore";

// Forex Types
export interface ForexPair {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  bid: number;
  ask: number;
  spread: number;
  timestamp: Date;
}

export interface ForexMetrics {
  volatility: number;
  liquidity: number;
  trend: "bullish" | "bearish" | "neutral";
  support: number;
  resistance: number;
  momentum: number;
}

// Crypto Types
export interface CryptoCurrency {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  rank: number;
  dominance?: number;
  timestamp: Date;
}

export interface CryptoMetrics {
  fearAndGreedIndex: number;
  totalMarketCap: number;
  btcDominance: number;
  altcoinSeason: boolean;
  defiTvl: number;
  activeAddresses: number;
}

// Multi-Asset Types
export interface AssetCorrelation {
  asset1: string;
  asset2: string;
  correlation: number;
  timeframe: string;
  significance: number;
}

export interface CrossAssetPerformance {
  asset: string;
  assetClass: "stocks" | "forex" | "crypto" | "commodities" | "bonds";
  return1d: number;
  return1w: number;
  return1m: number;
  return3m: number;
  return1y: number;
  volatility: number;
  sharpeRatio: number;
}

export interface MultiAssetOverview {
  totalValue: number;
  allocation: {
    stocks: number;
    forex: number;
    crypto: number;
    commodities: number;
    bonds: number;
    cash: number;
  };
  performance: {
    totalReturn: number;
    dailyReturn: number;
    weeklyReturn: number;
    monthlyReturn: number;
  };
  risk: {
    var95: number;
    maxDrawdown: number;
    volatility: number;
    beta: number;
  };
  diversificationScore: number;
}

export interface MultiAssetAnalytics {
  correlationMatrix: AssetCorrelation[];
  riskMetrics: {
    portfolioVar: number;
    componentVar: Record<string, number>;
    marginalVar: Record<string, number>;
    conditionalVar: Record<string, number>;
  };
  optimizationSuggestions: {
    currentWeights: Record<string, number>;
    suggestedWeights: Record<string, number>;
    expectedReturn: number;
    expectedRisk: number;
    improvementScore: number;
  };
}

export class MultiAssetStore {
  // Forex data
  forexPairs: ForexPair[] = [];
  forexMetrics: ForexMetrics | null = null;

  // Crypto data
  cryptoCurrencies: CryptoCurrency[] = [];
  cryptoMetrics: CryptoMetrics | null = null;

  // Multi-asset data
  multiAssetOverview: MultiAssetOverview | null = null;
  correlations: AssetCorrelation[] = [];
  crossAssetPerformance: CrossAssetPerformance[] = [];
  multiAssetAnalytics: MultiAssetAnalytics | null = null;

  // UI state
  isLoading: boolean = false;
  error: string | null = null;
  selectedAssetClass: string | null = null;

  constructor(private apiStore: ApiStore) {
    makeAutoObservable(this);
  }

  // Forex methods
  async fetchForexMarketData(): Promise<ForexPair[]> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const data = await this.apiStore.get<ForexPair[]>("/forex/market-data");

      runInAction(() => {
        this.forexPairs = data;
        this.isLoading = false;
      });

      return data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch forex market data";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async fetchForexMetrics(): Promise<ForexMetrics> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const data = await this.apiStore.get<ForexMetrics>("/forex/metrics");

      runInAction(() => {
        this.forexMetrics = data;
        this.isLoading = false;
      });

      return data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch forex metrics";
        this.isLoading = false;
      });
      throw error;
    }
  }

  // Crypto methods
  async fetchCryptoMarketData(): Promise<CryptoCurrency[]> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const data = await this.apiStore.get<CryptoCurrency[]>(
        "/crypto/market-data"
      );

      runInAction(() => {
        this.cryptoCurrencies = data;
        this.isLoading = false;
      });

      return data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch crypto market data";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async fetchCryptoMetrics(): Promise<CryptoMetrics> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const data = await this.apiStore.get<CryptoMetrics>("/crypto/metrics");

      runInAction(() => {
        this.cryptoMetrics = data;
        this.isLoading = false;
      });

      return data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch crypto metrics";
        this.isLoading = false;
      });
      throw error;
    }
  }

  // Multi-asset methods
  async fetchMultiAssetOverview(): Promise<MultiAssetOverview> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const data = await this.apiStore.get<MultiAssetOverview>(
        "/multi-asset/overview"
      );

      runInAction(() => {
        this.multiAssetOverview = data;
        this.isLoading = false;
      });

      return data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch multi-asset overview";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async fetchCorrelations(): Promise<AssetCorrelation[]> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const data = await this.apiStore.get<AssetCorrelation[]>(
        "/multi-asset/correlations"
      );

      runInAction(() => {
        this.correlations = data;
        this.isLoading = false;
      });

      return data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch correlations";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async fetchCrossAssetPerformance(): Promise<CrossAssetPerformance[]> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const data = await this.apiStore.get<CrossAssetPerformance[]>(
        "/multi-asset/performance"
      );

      runInAction(() => {
        this.crossAssetPerformance = data;
        this.isLoading = false;
      });

      return data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch cross-asset performance";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async fetchMultiAssetAnalytics(): Promise<MultiAssetAnalytics> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const data = await this.apiStore.get<MultiAssetAnalytics>(
        "/multi-asset/analytics"
      );

      runInAction(() => {
        this.multiAssetAnalytics = data;
        this.isLoading = false;
      });

      return data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch multi-asset analytics";
        this.isLoading = false;
      });
      throw error;
    }
  }

  // Utility methods
  selectAssetClass(assetClass: string): void {
    runInAction(() => {
      this.selectedAssetClass = assetClass;
    });
  }

  clearError(): void {
    runInAction(() => {
      this.error = null;
    });
  }

  clearAllData(): void {
    runInAction(() => {
      this.forexPairs = [];
      this.forexMetrics = null;
      this.cryptoCurrencies = [];
      this.cryptoMetrics = null;
      this.multiAssetOverview = null;
      this.correlations = [];
      this.crossAssetPerformance = [];
      this.multiAssetAnalytics = null;
      this.selectedAssetClass = null;
      this.error = null;
    });
  }

  // Computed getters
  get hasForexData(): boolean {
    return this.forexPairs.length > 0;
  }

  get hasCryptoData(): boolean {
    return this.cryptoCurrencies.length > 0;
  }

  get hasMultiAssetData(): boolean {
    return this.multiAssetOverview !== null;
  }

  get hasCorrelationData(): boolean {
    return this.correlations.length > 0;
  }

  get hasPerformanceData(): boolean {
    return this.crossAssetPerformance.length > 0;
  }

  get hasAnalyticsData(): boolean {
    return this.multiAssetAnalytics !== null;
  }

  // Get specific forex pair
  getForexPair(symbol: string): ForexPair | undefined {
    return this.forexPairs.find((pair) => pair.symbol === symbol);
  }

  // Get specific crypto currency
  getCryptoCurrency(symbol: string): CryptoCurrency | undefined {
    return this.cryptoCurrencies.find((crypto) => crypto.symbol === symbol);
  }

  // Get correlations for a specific asset
  getCorrelationsFor(asset: string): AssetCorrelation[] {
    return this.correlations.filter(
      (corr) => corr.asset1 === asset || corr.asset2 === asset
    );
  }

  // Get performance for a specific asset
  getPerformanceFor(asset: string): CrossAssetPerformance | undefined {
    return this.crossAssetPerformance.find((perf) => perf.asset === asset);
  }
}
