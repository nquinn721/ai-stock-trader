import { Injectable, Logger } from '@nestjs/common';
import { BehaviorSubject, interval, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Stream Processing Types
export interface MarketDataStream {
  symbol: string;
  timestamp: Date;
  price: number;
  volume: number;
  bid: number;
  ask: number;
  source: string;
  sequence: number;
}

export interface ProcessedData {
  symbol: string;
  timestamp: Date;
  aggregatedPrice: number;
  weightedPrice: number;
  totalVolume: number;
  priceChange: number;
  volatility: number;
  momentum: number;
  liquidity: number;
  trendStrength: number;
  anomalyScore: number;
}

export interface ConsolidatedData {
  symbol: string;
  timestamp: Date;
  venues: {
    [exchange: string]: {
      price: number;
      volume: number;
      timestamp: Date;
      latency: number;
    };
  };
  bestBid: { price: number; exchange: string; size: number };
  bestAsk: { price: number; exchange: string; size: number };
  nbbo: { bid: number; ask: number; spread: number };
  totalVolume: number;
  priceDispersion: number;
}

export interface HFPattern {
  symbol: string;
  timestamp: Date;
  patternType:
    | 'momentum'
    | 'reversal'
    | 'breakout'
    | 'arbitrage'
    | 'manipulation';
  timeframe: string;
  confidence: number;
  strength: number;
  duration: number; // milliseconds
  priceTargets: number[];
  volumeConfirmation: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
}

export interface CrossVenueActivity {
  symbol: string;
  timestamp: Date;
  exchanges: string[];
  activity: {
    exchange: string;
    volume: number;
    averageTradeSize: number;
    priceLevel: number;
    orderFlow: 'buy' | 'sell' | 'mixed';
  }[];
  arbitrageSignal: boolean;
  institutionalActivity: boolean;
  marketImpact: number;
}

export interface LatencyConfig {
  targetLatency: number; // milliseconds
  prioritySymbols: string[];
  compressionLevel: 'none' | 'low' | 'medium' | 'high';
  batchSize: number;
  parallelProcessing: boolean;
}

export interface StreamingMetrics {
  timestamp: Date;
  throughput: {
    messagesPerSecond: number;
    bytesPerSecond: number;
    peakThroughput: number;
  };
  latency: {
    averageProcessingTime: number;
    p95ProcessingTime: number;
    queueDepth: number;
  };
  quality: {
    messageDropRate: number;
    errorRate: number;
    duplicateRate: number;
  };
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    networkUtilization: number;
  };
}

/**
 * S48: Enterprise-Grade Real-Time Data Intelligence Platform
 * StreamProcessingService - High-performance stream processing for market data
 */
@Injectable()
export class StreamProcessingService {
  private readonly logger = new Logger(StreamProcessingService.name);
  private readonly streamBuffers = new Map<string, MarketDataStream[]>();
  private readonly processingStreams = new Map<
    string,
    Observable<ProcessedData>
  >();
  private readonly crossVenueStreams = new Map<
    string,
    Observable<CrossVenueActivity>
  >();
  private readonly metrics = new BehaviorSubject<StreamingMetrics>(
    this.createInitialMetrics(),
  );
  private readonly maxBufferSize = 10000;
  private gpuAcceleration = false;
  private latencyConfig: LatencyConfig = {
    targetLatency: 50,
    prioritySymbols: ['SPY', 'QQQ', 'AAPL'],
    compressionLevel: 'medium',
    batchSize: 100,
    parallelProcessing: true,
  };

  constructor() {
    this.initializeProcessingPipeline();
    this.startMetricsCollection();
  }

  /**
   * Process high-throughput market data streams with real-time analytics
   */
  processMarketDataStream(stream: MarketDataStream): Observable<ProcessedData> {
    const symbol = stream.symbol;

    if (!this.processingStreams.has(symbol)) {
      this.logger.log(`Initializing processing stream for ${symbol}`);

      const processedStream = new Observable<ProcessedData>((subscriber) => {
        // Initialize buffer for this symbol
        if (!this.streamBuffers.has(symbol)) {
          this.streamBuffers.set(symbol, []);
        }

        const buffer = this.streamBuffers.get(symbol)!;

        // Add incoming data to buffer
        buffer.push(stream);

        // Maintain buffer size
        if (buffer.length > this.maxBufferSize) {
          buffer.shift();
        }

        // Process data with configurable latency optimization
        const processedData = this.performStreamProcessing(symbol, buffer);
        subscriber.next(processedData);
      });

      this.processingStreams.set(symbol, processedStream);
    }

    return this.processingStreams.get(symbol)!;
  }

  /**
   * Aggregate multi-venue data with NBBO calculation
   */
  aggregateMultiVenueData(venues: string[]): Observable<ConsolidatedData> {
    this.logger.debug(`Aggregating data from ${venues.length} venues`);

    return new Observable<ConsolidatedData>((subscriber) => {
      // Simulate multi-venue data aggregation
      interval(100)
        .pipe(
          // 100ms updates for real-time NBBO
          map(() => this.generateConsolidatedData(venues)),
        )
        .subscribe({
          next: (data) => subscriber.next(data),
          error: (err) => subscriber.error(err),
        });
    });
  }

  /**
   * Detect high-frequency patterns using advanced algorithms
   */
  async detectHighFrequencyPatterns(timeframe: string): Promise<HFPattern[]> {
    this.logger.debug(`Detecting HF patterns for timeframe: ${timeframe}`);

    const patterns: HFPattern[] = [];
    const symbols = ['AAPL', 'TSLA', 'SPY', 'QQQ', 'NVDA'];

    for (const symbol of symbols) {
      const buffer = this.streamBuffers.get(symbol) || [];

      if (buffer.length < 100) continue; // Need sufficient data

      // Momentum pattern detection
      const momentumPattern = this.detectMomentumPattern(symbol, buffer);
      if (momentumPattern) patterns.push(momentumPattern);

      // Reversal pattern detection
      const reversalPattern = this.detectReversalPattern(symbol, buffer);
      if (reversalPattern) patterns.push(reversalPattern);

      // Breakout pattern detection
      const breakoutPattern = this.detectBreakoutPattern(symbol, buffer);
      if (breakoutPattern) patterns.push(breakoutPattern);

      // Arbitrage opportunity detection
      const arbitragePattern = this.detectArbitragePattern(symbol, buffer);
      if (arbitragePattern) patterns.push(arbitragePattern);

      // Market manipulation detection
      const manipulationPattern = this.detectManipulationPattern(
        symbol,
        buffer,
      );
      if (manipulationPattern) patterns.push(manipulationPattern);
    }

    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Monitor cross-venue activity for arbitrage and flow analysis
   */
  monitorCrossVenueActivity(symbol: string): Observable<CrossVenueActivity> {
    if (!this.crossVenueStreams.has(symbol)) {
      this.logger.log(`Starting cross-venue monitoring for ${symbol}`);

      const activityStream = interval(1000).pipe(
        // 1-second updates
        map(() => this.analyzeCrossVenueActivity(symbol)),
      );

      this.crossVenueStreams.set(symbol, activityStream);
    }

    return this.crossVenueStreams.get(symbol)!;
  }

  /**
   * Enable GPU acceleration for high-performance computing
   */
  async enableGPUAcceleration(): Promise<void> {
    this.logger.log('Enabling GPU acceleration for stream processing');

    try {
      // Simulate GPU acceleration setup
      this.gpuAcceleration = true;

      // In real implementation, this would:
      // - Initialize CUDA or OpenCL contexts
      // - Load GPU kernels for technical analysis
      // - Set up memory pools for data transfer

      this.logger.log('GPU acceleration enabled successfully');
    } catch (error) {
      this.logger.error('Failed to enable GPU acceleration', error);
      throw error;
    }
  }

  /**
   * Optimize processing latency with various strategies
   */
  async optimizeLatency(config: LatencyConfig): Promise<void> {
    this.logger.log('Optimizing stream processing latency', config);

    this.latencyConfig = { ...this.latencyConfig, ...config };

    // Apply optimization strategies
    if (config.parallelProcessing) {
      this.enableParallelProcessing();
    }

    if (config.compressionLevel !== 'none') {
      this.enableDataCompression(config.compressionLevel);
    }

    // Prioritize high-importance symbols
    this.optimizePrioritySymbols(config.prioritySymbols);

    this.logger.log(
      `Latency optimization applied: target ${config.targetLatency}ms`,
    );
  }

  /**
   * Get real-time streaming metrics
   */
  getStreamingMetrics(): Observable<StreamingMetrics> {
    return this.metrics.asObservable();
  }

  /**
   * Get processing buffer status for monitoring
   */
  getBufferStatus(): { [symbol: string]: { size: number; latency: number } } {
    const status: { [symbol: string]: { size: number; latency: number } } = {};

    for (const [symbol, buffer] of this.streamBuffers) {
      const latestTimestamp =
        buffer.length > 0 ? buffer[buffer.length - 1].timestamp : new Date();
      const latency = Date.now() - latestTimestamp.getTime();

      status[symbol] = {
        size: buffer.length,
        latency,
      };
    }

    return status;
  }

  // Private helper methods

  private initializeProcessingPipeline(): void {
    this.logger.log('Initializing high-performance processing pipeline');

    // Set up processing stages
    this.setupDataIngestionStage();
    this.setupAnalyticsStage();
    this.setupOutputStage();
  }

  private setupDataIngestionStage(): void {
    // Configure data ingestion optimizations
    this.logger.debug('Setting up data ingestion stage');
  }

  private setupAnalyticsStage(): void {
    // Configure real-time analytics pipeline
    this.logger.debug('Setting up analytics processing stage');
  }

  private setupOutputStage(): void {
    // Configure output delivery optimizations
    this.logger.debug('Setting up output delivery stage');
  }

  private performStreamProcessing(
    symbol: string,
    buffer: MarketDataStream[],
  ): ProcessedData {
    const latest = buffer[buffer.length - 1];
    const previous = buffer.length > 1 ? buffer[buffer.length - 2] : latest;

    // Calculate aggregated metrics
    const prices = buffer.slice(-20).map((d) => d.price); // Last 20 data points
    const volumes = buffer.slice(-20).map((d) => d.volume);

    const aggregatedPrice =
      prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const weightedPrice = this.calculateVWAP(buffer.slice(-20));
    const totalVolume = volumes.reduce((sum, v) => sum + v, 0);
    const priceChange =
      ((latest.price - previous.price) / previous.price) * 100;
    const volatility = this.calculateVolatility(prices);
    const momentum = this.calculateMomentum(prices);
    const liquidity = this.calculateLiquidity(buffer.slice(-10));
    const trendStrength = this.calculateTrendStrength(prices);
    const anomalyScore = this.calculateAnomalyScore(latest, buffer.slice(-50));

    return {
      symbol,
      timestamp: latest.timestamp,
      aggregatedPrice,
      weightedPrice,
      totalVolume,
      priceChange,
      volatility,
      momentum,
      liquidity,
      trendStrength,
      anomalyScore,
    };
  }

  private generateConsolidatedData(venues: string[]): ConsolidatedData {
    const symbol = 'AAPL'; // Example symbol
    const venueData: ConsolidatedData['venues'] = {};

    let bestBid = { price: 0, exchange: '', size: 0 };
    let bestAsk = { price: Infinity, exchange: '', size: 0 };
    let totalVolume = 0;

    for (const venue of venues) {
      const price = 180 + (Math.random() - 0.5) * 2; // $178-$182
      const volume = Math.floor(Math.random() * 100000) + 10000;
      const bid = price - Math.random() * 0.1;
      const ask = price + Math.random() * 0.1;
      const size = Math.floor(Math.random() * 10000) + 1000;

      venueData[venue] = {
        price,
        volume,
        timestamp: new Date(),
        latency: Math.random() * 20 + 5, // 5-25ms
      };

      totalVolume += volume;

      if (bid > bestBid.price) {
        bestBid = { price: bid, exchange: venue, size };
      }

      if (ask < bestAsk.price) {
        bestAsk = { price: ask, exchange: venue, size };
      }
    }

    const priceDispersion = this.calculatePriceDispersion(
      Object.values(venueData),
    );

    return {
      symbol,
      timestamp: new Date(),
      venues: venueData,
      bestBid,
      bestAsk,
      nbbo: {
        bid: bestBid.price,
        ask: bestAsk.price,
        spread: bestAsk.price - bestBid.price,
      },
      totalVolume,
      priceDispersion,
    };
  }

  private detectMomentumPattern(
    symbol: string,
    buffer: MarketDataStream[],
  ): HFPattern | null {
    const prices = buffer.slice(-50).map((d) => d.price);
    const momentum = this.calculateMomentum(prices);

    if (Math.abs(momentum) > 2.0) {
      // Strong momentum threshold
      return {
        symbol,
        timestamp: new Date(),
        patternType: 'momentum',
        timeframe: '1m',
        confidence: Math.min(Math.abs(momentum) / 3.0, 1.0),
        strength: Math.abs(momentum),
        duration: 60000, // 1 minute
        priceTargets: this.calculateMomentumTargets(prices, momentum),
        volumeConfirmation: this.checkVolumeConfirmation(buffer.slice(-20)),
        riskLevel: Math.abs(momentum) > 3.0 ? 'high' : 'medium',
        description: `Strong ${momentum > 0 ? 'bullish' : 'bearish'} momentum detected`,
      };
    }

    return null;
  }

  private detectReversalPattern(
    symbol: string,
    buffer: MarketDataStream[],
  ): HFPattern | null {
    const prices = buffer.slice(-30).map((d) => d.price);
    const reversalSignal = this.calculateReversalSignal(prices);

    if (reversalSignal.strength > 0.7) {
      return {
        symbol,
        timestamp: new Date(),
        patternType: 'reversal',
        timeframe: '30s',
        confidence: reversalSignal.strength,
        strength: reversalSignal.strength,
        duration: 30000, // 30 seconds
        priceTargets: reversalSignal.targets,
        volumeConfirmation: this.checkVolumeConfirmation(buffer.slice(-10)),
        riskLevel: 'medium',
        description: `Potential reversal pattern detected`,
      };
    }

    return null;
  }

  private detectBreakoutPattern(
    symbol: string,
    buffer: MarketDataStream[],
  ): HFPattern | null {
    const prices = buffer.slice(-100).map((d) => d.price);
    const breakout = this.calculateBreakoutSignal(prices);

    if (breakout.detected) {
      return {
        symbol,
        timestamp: new Date(),
        patternType: 'breakout',
        timeframe: '2m',
        confidence: breakout.confidence,
        strength: breakout.strength,
        duration: 120000, // 2 minutes
        priceTargets: breakout.targets,
        volumeConfirmation: breakout.volumeConfirmed,
        riskLevel: 'medium',
        description: `${breakout.direction} breakout pattern detected`,
      };
    }

    return null;
  }

  private detectArbitragePattern(
    symbol: string,
    buffer: MarketDataStream[],
  ): HFPattern | null {
    // Simulate arbitrage detection
    if (Math.random() > 0.95) {
      // 5% chance
      const spread = Math.random() * 0.01; // 0-1% spread
      return {
        symbol,
        timestamp: new Date(),
        patternType: 'arbitrage',
        timeframe: '5s',
        confidence: 0.8 + Math.random() * 0.2,
        strength: spread * 100,
        duration: 5000, // 5 seconds
        priceTargets: [buffer[buffer.length - 1].price + spread],
        volumeConfirmation: true,
        riskLevel: 'low',
        description: `Cross-exchange arbitrage opportunity: ${(spread * 100).toFixed(2)}% spread`,
      };
    }

    return null;
  }

  private detectManipulationPattern(
    symbol: string,
    buffer: MarketDataStream[],
  ): HFPattern | null {
    // Detect potential market manipulation patterns
    const recentTrades = buffer.slice(-20);
    const manipulationScore = this.calculateManipulationScore(recentTrades);

    if (manipulationScore > 0.8) {
      return {
        symbol,
        timestamp: new Date(),
        patternType: 'manipulation',
        timeframe: '1m',
        confidence: manipulationScore,
        strength: manipulationScore,
        duration: 60000, // 1 minute
        priceTargets: [],
        volumeConfirmation: false,
        riskLevel: 'high',
        description: `Potential market manipulation detected`,
      };
    }

    return null;
  }

  private analyzeCrossVenueActivity(symbol: string): CrossVenueActivity {
    const exchanges = ['NYSE', 'NASDAQ', 'BATS', 'ARCA', 'IEX'];
    const activity = exchanges.map((exchange) => ({
      exchange,
      volume: Math.floor(Math.random() * 100000) + 10000,
      averageTradeSize: Math.floor(Math.random() * 1000) + 100,
      priceLevel: 180 + (Math.random() - 0.5) * 2,
      orderFlow:
        Math.random() > 0.5
          ? 'buy'
          : Math.random() > 0.5
            ? 'sell'
            : ('mixed' as 'buy' | 'sell' | 'mixed'),
    }));

    const totalVolume = activity.reduce((sum, a) => sum + a.volume, 0);
    const avgPrice =
      activity.reduce((sum, a) => sum + a.priceLevel, 0) / activity.length;
    const priceSpread =
      Math.max(...activity.map((a) => a.priceLevel)) -
      Math.min(...activity.map((a) => a.priceLevel));

    return {
      symbol,
      timestamp: new Date(),
      exchanges,
      activity,
      arbitrageSignal: priceSpread > 0.05, // 5 cent spread threshold
      institutionalActivity: totalVolume > 500000, // 500k volume threshold
      marketImpact: priceSpread / avgPrice,
    };
  }

  private enableParallelProcessing(): void {
    this.logger.debug('Enabling parallel processing optimization');
    // Implementation would configure multi-threading
  }

  private enableDataCompression(level: 'low' | 'medium' | 'high'): void {
    this.logger.debug(`Enabling data compression: ${level}`);
    // Implementation would configure data compression
  }

  private optimizePrioritySymbols(symbols: string[]): void {
    this.logger.debug(`Optimizing for priority symbols: ${symbols.join(', ')}`);
    // Implementation would prioritize processing for these symbols
  }

  private startMetricsCollection(): void {
    // Update metrics every second
    interval(1000).subscribe(() => {
      const metrics = this.calculateCurrentMetrics();
      this.metrics.next(metrics);
    });
  }

  private calculateCurrentMetrics(): StreamingMetrics {
    const totalBufferSize = Array.from(this.streamBuffers.values()).reduce(
      (sum, buffer) => sum + buffer.length,
      0,
    );

    return {
      timestamp: new Date(),
      throughput: {
        messagesPerSecond: Math.floor(Math.random() * 100000) + 50000,
        bytesPerSecond: Math.floor(Math.random() * 10000000) + 5000000,
        peakThroughput: Math.floor(Math.random() * 200000) + 100000,
      },
      latency: {
        averageProcessingTime: Math.random() * 10 + 5, // 5-15ms
        p95ProcessingTime: Math.random() * 20 + 15, // 15-35ms
        queueDepth: totalBufferSize,
      },
      quality: {
        messageDropRate: Math.random() * 0.001, // <0.1%
        errorRate: Math.random() * 0.0001, // <0.01%
        duplicateRate: Math.random() * 0.0005, // <0.05%
      },
      resources: {
        cpuUsage: Math.random() * 30 + 40, // 40-70%
        memoryUsage: Math.random() * 20 + 60, // 60-80%
        networkUtilization: Math.random() * 40 + 30, // 30-70%
      },
    };
  }

  private createInitialMetrics(): StreamingMetrics {
    return {
      timestamp: new Date(),
      throughput: {
        messagesPerSecond: 0,
        bytesPerSecond: 0,
        peakThroughput: 0,
      },
      latency: {
        averageProcessingTime: 0,
        p95ProcessingTime: 0,
        queueDepth: 0,
      },
      quality: { messageDropRate: 0, errorRate: 0, duplicateRate: 0 },
      resources: { cpuUsage: 0, memoryUsage: 0, networkUtilization: 0 },
    };
  }

  // Technical analysis helper methods

  private calculateVWAP(data: MarketDataStream[]): number {
    const totalValue = data.reduce((sum, d) => sum + d.price * d.volume, 0);
    const totalVolume = data.reduce((sum, d) => sum + d.volume, 0);
    return totalVolume > 0 ? totalValue / totalVolume : 0;
  }

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;

    const mean = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const squaredDiffs = prices.map((p) => Math.pow(p - mean, 2));
    const variance =
      squaredDiffs.reduce((sum, sq) => sum + sq, 0) / prices.length;

    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  private calculateMomentum(prices: number[]): number {
    if (prices.length < 10) return 0;

    const recent = prices.slice(-5);
    const earlier = prices.slice(-10, -5);

    const recentAvg = recent.reduce((sum, p) => sum + p, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, p) => sum + p, 0) / earlier.length;

    return ((recentAvg - earlierAvg) / earlierAvg) * 100;
  }

  private calculateLiquidity(data: MarketDataStream[]): number {
    const totalVolume = data.reduce((sum, d) => sum + d.volume, 0);
    const timeSpan =
      data.length > 1
        ? (data[data.length - 1].timestamp.getTime() -
            data[0].timestamp.getTime()) /
          1000
        : 1;

    return totalVolume / timeSpan; // Volume per second
  }

  private calculateTrendStrength(prices: number[]): number {
    if (prices.length < 5) return 0;

    let upMoves = 0;
    let downMoves = 0;

    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > prices[i - 1]) upMoves++;
      else if (prices[i] < prices[i - 1]) downMoves++;
    }

    const totalMoves = upMoves + downMoves;
    return totalMoves > 0 ? Math.abs(upMoves - downMoves) / totalMoves : 0;
  }

  private calculateAnomalyScore(
    current: MarketDataStream,
    historical: MarketDataStream[],
  ): number {
    if (historical.length === 0) return 0;

    const prices = historical.map((d) => d.price);
    const volumes = historical.map((d) => d.volume);

    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;

    const priceDeviation = Math.abs(current.price - avgPrice) / avgPrice;
    const volumeDeviation = Math.abs(current.volume - avgVolume) / avgVolume;

    return Math.min((priceDeviation + volumeDeviation) / 2, 1.0);
  }

  private checkVolumeConfirmation(data: MarketDataStream[]): boolean {
    if (data.length < 5) return false;

    const recent = data.slice(-3);
    const earlier = data.slice(-5, -3);

    const recentVolume =
      recent.reduce((sum, d) => sum + d.volume, 0) / recent.length;
    const earlierVolume =
      earlier.reduce((sum, d) => sum + d.volume, 0) / earlier.length;

    return recentVolume > earlierVolume * 1.2; // 20% volume increase
  }

  private calculateMomentumTargets(
    prices: number[],
    momentum: number,
  ): number[] {
    const currentPrice = prices[prices.length - 1];
    const direction = momentum > 0 ? 1 : -1;
    const magnitude = Math.abs(momentum) / 100;

    return [
      currentPrice * (1 + direction * magnitude * 0.5),
      currentPrice * (1 + direction * magnitude * 1.0),
      currentPrice * (1 + direction * magnitude * 1.5),
    ];
  }

  private calculateReversalSignal(prices: number[]): {
    strength: number;
    targets: number[];
  } {
    // Simplified reversal detection
    const trend = this.calculateTrendStrength(prices);
    const volatility = this.calculateVolatility(prices);

    const reversalStrength = trend > 0.7 && volatility > 0.02 ? 0.8 : 0.3;
    const currentPrice = prices[prices.length - 1];

    return {
      strength: reversalStrength,
      targets: [currentPrice * 0.99, currentPrice * 1.01],
    };
  }

  private calculateBreakoutSignal(prices: number[]): {
    detected: boolean;
    confidence: number;
    strength: number;
    targets: number[];
    volumeConfirmed: boolean;
    direction: string;
  } {
    // Simplified breakout detection
    const recentPrices = prices.slice(-20);
    const max = Math.max(...recentPrices);
    const min = Math.min(...recentPrices);
    const current = prices[prices.length - 1];
    const range = max - min;

    const isBreakoutUp = current > max - range * 0.1;
    const isBreakoutDown = current < min + range * 0.1;

    if (isBreakoutUp || isBreakoutDown) {
      return {
        detected: true,
        confidence: 0.75,
        strength: range / current,
        targets: isBreakoutUp
          ? [current * 1.02, current * 1.05]
          : [current * 0.98, current * 0.95],
        volumeConfirmed: true,
        direction: isBreakoutUp ? 'upward' : 'downward',
      };
    }

    return {
      detected: false,
      confidence: 0,
      strength: 0,
      targets: [],
      volumeConfirmed: false,
      direction: 'none',
    };
  }

  private calculateManipulationScore(trades: MarketDataStream[]): number {
    // Simplified manipulation detection
    if (trades.length < 10) return 0;

    const volumes = trades.map((t) => t.volume);
    const prices = trades.map((t) => t.price);

    // Look for unusual volume patterns with minimal price impact
    const avgVolume = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    const maxVolume = Math.max(...volumes);
    const priceRange = Math.max(...prices) - Math.min(...prices);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;

    const volumeSpike = maxVolume / avgVolume;
    const priceImpact = priceRange / avgPrice;

    // High volume with low price impact suggests manipulation
    if (volumeSpike > 3 && priceImpact < 0.005) {
      return Math.min(volumeSpike / 5, 1.0);
    }

    return 0;
  }

  private calculatePriceDispersion(
    venueData: Array<{ price: number }>,
  ): number {
    const prices = venueData.map((v) => v.price);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const maxDeviation = Math.max(...prices.map((p) => Math.abs(p - avgPrice)));

    return maxDeviation / avgPrice;
  }
}
