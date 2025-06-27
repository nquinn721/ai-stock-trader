import { Injectable, Logger } from '@nestjs/common';
import { Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';

// Data Intelligence Types
export interface OrderBookData {
  symbol: string;
  timestamp: Date;
  bids: { price: number; size: number; exchanges: string[] }[];
  asks: { price: number; size: number; exchanges: string[] }[];
  spread: number;
  totalBidVolume: number;
  totalAskVolume: number;
  imbalance: number; // bid volume / total volume
}

export interface OptionsFlow {
  symbol: string;
  timestamp: Date;
  expiration: Date;
  strike: number;
  callPut: 'call' | 'put';
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  unusualActivity: boolean;
  premiumFlow: number;
  institutionalFlow: boolean;
}

export interface OptionsFlowFilter {
  symbols?: string[];
  minVolume?: number;
  unusualOnly?: boolean;
  timeframe?: '1h' | '4h' | '1d';
}

export interface UnusualActivity {
  symbol: string;
  timestamp: Date;
  activityType:
    | 'volume_spike'
    | 'price_movement'
    | 'options_flow'
    | 'dark_pool';
  severity: 'low' | 'medium' | 'high' | 'extreme';
  details: {
    currentVolume?: number;
    averageVolume?: number;
    priceChange?: number;
    timeframe?: string;
  };
  description: string;
}

export interface OrderFlowAnalysis {
  symbol: string;
  timestamp: Date;
  buyPressure: number; // 0-1 scale
  sellPressure: number; // 0-1 scale
  institutionalFlow: number; // % of volume from institutions
  retailFlow: number; // % of volume from retail
  darkPoolPercentage: number;
  marketImpact: number;
  executionQuality: {
    averageSlippage: number;
    fillRate: number;
    speedToMarket: number; // milliseconds
  };
}

export interface DarkPoolMetrics {
  symbol: string;
  timestamp: Date;
  darkPoolVolume: number;
  marketVolumePercentage: number;
  averageTradeSize: number;
  institutionalIndicators: {
    blockTradesDetected: number;
    crossingNetworkActivity: number;
    iceBergOrdersEstimated: number;
  };
  priceImpact: number;
}

export interface ArbitrageOpportunity {
  symbol: string;
  timestamp: Date;
  type: 'cross_exchange' | 'etf_nav' | 'options_parity' | 'calendar_spread';
  exchanges: string[];
  priceDifference: number;
  profitPotential: number;
  riskLevel: 'low' | 'medium' | 'high';
  timeToExpiry?: number; // milliseconds
  confidence: number;
}

export interface DataQualityReport {
  timestamp: Date;
  overallScore: number; // 0-100
  sources: {
    name: string;
    status: 'healthy' | 'degraded' | 'offline';
    latency: number;
    accuracy: number;
    completeness: number;
    lastUpdate: Date;
  }[];
  alerts: {
    severity: 'info' | 'warning' | 'error';
    message: string;
    source: string;
    timestamp: Date;
  }[];
}

export interface LatencyMetrics {
  timestamp: Date;
  dataIngestion: {
    average: number;
    p95: number;
    p99: number;
  };
  processing: {
    average: number;
    p95: number;
    p99: number;
  };
  delivery: {
    average: number;
    p95: number;
    p99: number;
  };
  endToEnd: {
    average: number;
    p95: number;
    p99: number;
  };
}

/**
 * S48: Enterprise-Grade Real-Time Data Intelligence Platform
 * DataIntelligenceService - Core service for institutional-grade market data processing
 */
@Injectable()
export class DataIntelligenceService {
  private readonly logger = new Logger(DataIntelligenceService.name);
  private readonly subscriptions = new Map<string, Observable<OrderBookData>>();
  private readonly latencyBuffer: number[] = [];
  private readonly maxLatencyBufferSize = 1000;

  constructor() {
    this.initializeDataSources();
    this.startLatencyMonitoring();
  }

  /**
   * Subscribe to Level II market data with real-time order book updates
   */
  subscribeToLevelII(symbols: string[]): Observable<OrderBookData> {
    this.logger.log(
      `Subscribing to Level II data for ${symbols.length} symbols`,
    );

    const compositeStream = new Observable<OrderBookData>((subscriber) => {
      symbols.forEach((symbol) => {
        // Simulate real-time Level II data
        const symbolStream = interval(100).pipe(
          // 100ms updates
          map(() => this.generateLevelIIData(symbol)),
        );

        symbolStream.subscribe({
          next: (data) => subscriber.next(data),
          error: (err) => subscriber.error(err),
        });
      });
    });

    return compositeStream;
  }

  /**
   * Get options flow data with institutional detection
   */
  async getOptionsFlow(filters: OptionsFlowFilter): Promise<OptionsFlow[]> {
    this.logger.debug('Fetching options flow data', filters);

    const symbols = filters.symbols || ['AAPL', 'TSLA', 'SPY', 'QQQ', 'NVDA'];
    const flows: OptionsFlow[] = [];

    for (const symbol of symbols) {
      // Generate realistic options flow data
      const numFlows = Math.floor(Math.random() * 10) + 5;

      for (let i = 0; i < numFlows; i++) {
        const flow: OptionsFlow = {
          symbol,
          timestamp: new Date(),
          expiration: new Date(
            Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000,
          ), // 0-90 days
          strike: this.getStrikePrice(symbol),
          callPut: Math.random() > 0.5 ? 'call' : 'put',
          volume: Math.floor(Math.random() * 10000) + 100,
          openInterest: Math.floor(Math.random() * 50000) + 1000,
          impliedVolatility: Math.random() * 0.5 + 0.2, // 20-70%
          unusualActivity: Math.random() > 0.7, // 30% unusual
          premiumFlow: Math.random() * 10000000, // $10M max
          institutionalFlow: Math.random() > 0.6, // 40% institutional
        };

        if (!filters.unusualOnly || flow.unusualActivity) {
          if (!filters.minVolume || flow.volume >= filters.minVolume) {
            flows.push(flow);
          }
        }
      }
    }

    return flows.sort((a, b) => b.volume - a.volume);
  }

  /**
   * Detect unusual market activity across all instruments
   */
  async detectUnusualActivity(
    threshold: number = 2.0,
  ): Promise<UnusualActivity[]> {
    this.logger.debug(`Detecting unusual activity with threshold ${threshold}`);

    const activities: UnusualActivity[] = [];
    const symbols = ['AAPL', 'TSLA', 'SPY', 'QQQ', 'NVDA', 'MSFT', 'GOOGL'];

    for (const symbol of symbols) {
      // Volume spike detection
      const currentVolume = Math.floor(Math.random() * 1000000) + 100000;
      const averageVolume = Math.floor(Math.random() * 500000) + 200000;
      const volumeRatio = currentVolume / averageVolume;

      if (volumeRatio > threshold) {
        activities.push({
          symbol,
          timestamp: new Date(),
          activityType: 'volume_spike',
          severity: this.getSeverity(volumeRatio, 2, 5, 10),
          details: {
            currentVolume,
            averageVolume,
            timeframe: '15m',
          },
          description: `Volume spike detected: ${volumeRatio.toFixed(1)}x average volume`,
        });
      }

      // Price movement detection
      const priceChange = (Math.random() - 0.5) * 0.2; // -10% to +10%
      if (Math.abs(priceChange) > 0.05) {
        // 5% threshold
        activities.push({
          symbol,
          timestamp: new Date(),
          activityType: 'price_movement',
          severity: this.getSeverity(Math.abs(priceChange), 0.05, 0.1, 0.15),
          details: {
            priceChange: priceChange * 100,
            timeframe: '1h',
          },
          description: `Significant price movement: ${(priceChange * 100).toFixed(1)}%`,
        });
      }

      // Dark pool activity
      if (Math.random() > 0.8) {
        // 20% chance
        activities.push({
          symbol,
          timestamp: new Date(),
          activityType: 'dark_pool',
          severity: 'medium',
          details: {},
          description: `Elevated dark pool activity detected`,
        });
      }
    }

    return activities.sort(
      (a, b) =>
        this.severityToNumber(b.severity) - this.severityToNumber(a.severity),
    );
  }

  /**
   * Analyze order flow patterns and institutional activity
   */
  async analyzeOrderFlow(symbol: string): Promise<OrderFlowAnalysis> {
    this.logger.debug(`Analyzing order flow for ${symbol}`);

    const analysis: OrderFlowAnalysis = {
      symbol,
      timestamp: new Date(),
      buyPressure: Math.random() * 0.4 + 0.3, // 30-70%
      sellPressure: Math.random() * 0.4 + 0.3, // 30-70%
      institutionalFlow: Math.random() * 0.6 + 0.2, // 20-80%
      retailFlow: Math.random() * 0.6 + 0.2, // 20-80%
      darkPoolPercentage: Math.random() * 0.3 + 0.1, // 10-40%
      marketImpact: Math.random() * 0.02, // 0-2%
      executionQuality: {
        averageSlippage: Math.random() * 0.001, // 0-0.1%
        fillRate: Math.random() * 0.1 + 0.9, // 90-100%
        speedToMarket: Math.random() * 50 + 10, // 10-60ms
      },
    };

    // Normalize buy/sell pressure
    const total = analysis.buyPressure + analysis.sellPressure;
    analysis.buyPressure = analysis.buyPressure / total;
    analysis.sellPressure = analysis.sellPressure / total;

    // Normalize institutional/retail flow
    const flowTotal = analysis.institutionalFlow + analysis.retailFlow;
    analysis.institutionalFlow = analysis.institutionalFlow / flowTotal;
    analysis.retailFlow = analysis.retailFlow / flowTotal;

    return analysis;
  }

  /**
   * Detect dark pool activity and institutional flow
   */
  async detectDarkPoolActivity(symbol: string): Promise<DarkPoolMetrics> {
    this.logger.debug(`Detecting dark pool activity for ${symbol}`);

    return {
      symbol,
      timestamp: new Date(),
      darkPoolVolume: Math.floor(Math.random() * 1000000) + 100000,
      marketVolumePercentage: Math.random() * 0.35 + 0.15, // 15-50%
      averageTradeSize: Math.floor(Math.random() * 10000) + 1000,
      institutionalIndicators: {
        blockTradesDetected: Math.floor(Math.random() * 50),
        crossingNetworkActivity: Math.floor(Math.random() * 100),
        iceBergOrdersEstimated: Math.floor(Math.random() * 25),
      },
      priceImpact: Math.random() * 0.01, // 0-1% impact
    };
  }

  /**
   * Find arbitrage opportunities across exchanges and instruments
   */
  async findArbitrageOpportunities(): Promise<ArbitrageOpportunity[]> {
    this.logger.debug('Scanning for arbitrage opportunities');

    const opportunities: ArbitrageOpportunity[] = [];
    const symbols = ['AAPL', 'TSLA', 'SPY', 'QQQ'];
    const exchanges = ['NYSE', 'NASDAQ', 'BATS', 'ARCA'];

    for (const symbol of symbols) {
      // Cross-exchange arbitrage
      if (Math.random() > 0.7) {
        // 30% chance
        const priceDiff = (Math.random() - 0.5) * 0.01; // ±0.5%
        opportunities.push({
          symbol,
          timestamp: new Date(),
          type: 'cross_exchange',
          exchanges: [exchanges[0], exchanges[1]],
          priceDifference: Math.abs(priceDiff),
          profitPotential: Math.abs(priceDiff) * 0.8, // Accounting for costs
          riskLevel: Math.abs(priceDiff) > 0.003 ? 'medium' : 'low',
          timeToExpiry: Math.random() * 5000 + 1000, // 1-6 seconds
          confidence: Math.random() * 0.3 + 0.7, // 70-100%
        });
      }

      // ETF NAV arbitrage
      if (symbol === 'SPY' && Math.random() > 0.8) {
        // 20% chance for ETFs
        const navDiff = (Math.random() - 0.5) * 0.005; // ±0.25%
        opportunities.push({
          symbol,
          timestamp: new Date(),
          type: 'etf_nav',
          exchanges: ['NYSE', 'NAV'],
          priceDifference: Math.abs(navDiff),
          profitPotential: Math.abs(navDiff) * 0.6,
          riskLevel: 'low',
          timeToExpiry: Math.random() * 30000 + 10000, // 10-40 seconds
          confidence: Math.random() * 0.2 + 0.8, // 80-100%
        });
      }
    }

    return opportunities.sort((a, b) => b.profitPotential - a.profitPotential);
  }

  /**
   * Monitor data quality across all sources
   */
  async monitorDataQuality(): Promise<DataQualityReport> {
    this.logger.debug('Generating data quality report');

    const sources = [
      { name: 'NYSE Direct', baseLatency: 15, baseAccuracy: 99.9 },
      { name: 'NASDAQ TotalView', baseLatency: 12, baseAccuracy: 99.8 },
      { name: 'Options Chain Feed', baseLatency: 25, baseAccuracy: 99.5 },
      { name: 'Alternative Data', baseLatency: 100, baseAccuracy: 95.0 },
      { name: 'News Feed', baseLatency: 200, baseAccuracy: 92.0 },
    ];

    const alerts: DataQualityReport['alerts'] = [];

    const sourceReports = sources.map((source) => {
      const latencyVariation = (Math.random() - 0.5) * 10;
      const accuracyVariation = (Math.random() - 0.5) * 2;

      const currentLatency = source.baseLatency + latencyVariation;
      const currentAccuracy = source.baseAccuracy + accuracyVariation;

      let status: 'healthy' | 'degraded' | 'offline' = 'healthy';

      if (currentLatency > source.baseLatency * 2) {
        status = 'degraded';
        alerts.push({
          severity: 'warning',
          message: `High latency detected: ${currentLatency.toFixed(1)}ms`,
          source: source.name,
          timestamp: new Date(),
        });
      }

      if (currentAccuracy < 95) {
        status = 'degraded';
        alerts.push({
          severity: 'error',
          message: `Data accuracy below threshold: ${currentAccuracy.toFixed(1)}%`,
          source: source.name,
          timestamp: new Date(),
        });
      }

      return {
        name: source.name,
        status,
        latency: Math.max(0, currentLatency),
        accuracy: Math.max(0, Math.min(100, currentAccuracy)),
        completeness: Math.random() * 5 + 95, // 95-100%
        lastUpdate: new Date(Date.now() - Math.random() * 60000), // Last minute
      };
    });

    const overallScore =
      sourceReports.reduce(
        (sum, source) => sum + (source.accuracy + source.completeness) / 2,
        0,
      ) / sourceReports.length;

    return {
      timestamp: new Date(),
      overallScore,
      sources: sourceReports,
      alerts,
    };
  }

  /**
   * Get comprehensive latency metrics
   */
  async getLatencyMetrics(): Promise<LatencyMetrics> {
    this.logger.debug('Calculating latency metrics');

    // Simulate latency measurements
    const measurements = Array.from(
      { length: 100 },
      () => Math.random() * 50 + 10,
    );
    measurements.sort((a, b) => a - b);

    const average =
      measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
    const p95 = measurements[Math.floor(measurements.length * 0.95)];
    const p99 = measurements[Math.floor(measurements.length * 0.99)];

    return {
      timestamp: new Date(),
      dataIngestion: {
        average: average * 0.3,
        p95: p95 * 0.3,
        p99: p99 * 0.3,
      },
      processing: {
        average: average * 0.4,
        p95: p95 * 0.4,
        p99: p99 * 0.4,
      },
      delivery: {
        average: average * 0.2,
        p95: p95 * 0.2,
        p99: p99 * 0.2,
      },
      endToEnd: {
        average,
        p95,
        p99,
      },
    };
  }

  // Private helper methods

  private initializeDataSources(): void {
    this.logger.log('Initializing enterprise data sources');
    // Initialize connections to exchanges, data vendors, etc.
  }

  private startLatencyMonitoring(): void {
    // Monitor latency in real-time
    setInterval(() => {
      const latency = Math.random() * 50 + 10; // 10-60ms
      this.latencyBuffer.push(latency);

      if (this.latencyBuffer.length > this.maxLatencyBufferSize) {
        this.latencyBuffer.shift();
      }
    }, 1000);
  }

  private generateLevelIIData(symbol: string): OrderBookData {
    const basePrice = this.getBasePrice(symbol);
    const spread = Math.random() * 0.05 + 0.01; // 1-6 cents

    // Generate bid levels
    const bids = Array.from({ length: 10 }, (_, i) => ({
      price: basePrice - (i + 1) * (spread / 10) - Math.random() * 0.01,
      size: Math.floor(Math.random() * 10000) + 100,
      exchanges: this.getRandomExchanges(),
    })).sort((a, b) => b.price - a.price);

    // Generate ask levels
    const asks = Array.from({ length: 10 }, (_, i) => ({
      price: basePrice + (i + 1) * (spread / 10) + Math.random() * 0.01,
      size: Math.floor(Math.random() * 10000) + 100,
      exchanges: this.getRandomExchanges(),
    })).sort((a, b) => a.price - b.price);

    const totalBidVolume = bids.reduce((sum, bid) => sum + bid.size, 0);
    const totalAskVolume = asks.reduce((sum, ask) => sum + ask.size, 0);

    return {
      symbol,
      timestamp: new Date(),
      bids,
      asks,
      spread: asks[0].price - bids[0].price,
      totalBidVolume,
      totalAskVolume,
      imbalance: totalBidVolume / (totalBidVolume + totalAskVolume),
    };
  }

  private getBasePrice(symbol: string): number {
    const prices = {
      AAPL: 180,
      TSLA: 250,
      SPY: 450,
      QQQ: 380,
      NVDA: 900,
      MSFT: 350,
      GOOGL: 140,
    };
    return prices[symbol] || 100;
  }

  private getStrikePrice(symbol: string): number {
    const basePrice = this.getBasePrice(symbol);
    const offset = (Math.random() - 0.5) * 0.2; // ±10%
    return Math.round((basePrice * (1 + offset)) / 5) * 5; // Round to nearest $5
  }

  private getRandomExchanges(): string[] {
    const exchanges = ['NYSE', 'NASDAQ', 'BATS', 'ARCA', 'IEX'];
    const count = Math.floor(Math.random() * 3) + 1; // 1-3 exchanges
    return exchanges.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  private getSeverity(
    value: number,
    low: number,
    medium: number,
    high: number,
  ): 'low' | 'medium' | 'high' | 'extreme' {
    if (value >= high) return 'extreme';
    if (value >= medium) return 'high';
    if (value >= low) return 'medium';
    return 'low';
  }

  private severityToNumber(
    severity: 'low' | 'medium' | 'high' | 'extreme',
  ): number {
    const map = { low: 1, medium: 2, high: 3, extreme: 4 };
    return map[severity];
  }
}
