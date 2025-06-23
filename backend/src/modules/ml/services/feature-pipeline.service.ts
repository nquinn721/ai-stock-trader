import { Injectable, Logger } from '@nestjs/common';
import { MarketDataPoint } from './data-ingestion.service';

export interface TechnicalIndicator {
  name: string;
  value: number;
  timestamp: Date;
  timeframe: string;
  confidence?: number;
}

export interface FeatureSet {
  symbol: string;
  timestamp: Date;
  timeframe: string;
  features: Map<string, number>;
  indicators: TechnicalIndicator[];
  metadata: {
    volume: number;
    volatility: number;
    trend: 'up' | 'down' | 'sideways';
    marketRegime: 'bullish' | 'bearish' | 'neutral';
  };
}

export interface FeaturePipelineConfig {
  timeframes: string[];
  indicators: string[];
  lookbackPeriods: number[];
  enableRealTime: boolean;
  batchSize: number;
}

@Injectable()
export class FeaturePipelineService {
  private readonly logger = new Logger(FeaturePipelineService.name);
  private readonly defaultConfig: FeaturePipelineConfig = {
    timeframes: ['1m', '5m', '15m', '1h', '1d'],
    indicators: [
      'sma_10',
      'sma_20',
      'sma_50',
      'sma_200',
      'ema_12',
      'ema_26',
      'ema_50',
      'rsi_14',
      'rsi_21',
      'macd',
      'macd_signal',
      'macd_histogram',
      'bb_upper',
      'bb_middle',
      'bb_lower',
      'bb_width',
      'stoch_k',
      'stoch_d',
      'atr_14',
      'atr_21',
      'obv',
      'ad_line',
      'williams_r',
      'cci',
      'momentum_10',
      'momentum_20',
      'roc_10',
      'roc_20',
      'ppo',
      'ppo_signal',
      'tsi',
      'ultimate_oscillator',
      'vwap',
      'volume_ratio',
      'price_change_1d',
      'price_change_5d',
      'volatility_10d',
      'volatility_20d',
      'support_level',
      'resistance_level',
      'trend_strength',
      'market_cap_rank',
    ],
    lookbackPeriods: [10, 20, 50, 100, 200],
    enableRealTime: true,
    batchSize: 100,
  };

  constructor() {
    this.logger.log('Feature Pipeline Service initialized');
  }

  /**
   * Extract features from market data
   */
  async extractFeatures(
    marketData: MarketDataPoint[],
    symbol: string,
    config: Partial<FeaturePipelineConfig> = {},
  ): Promise<FeatureSet[]> {
    const pipelineConfig = { ...this.defaultConfig, ...config };

    this.logger.debug(
      `Extracting features for ${symbol} with ${marketData.length} data points`,
    );

    if (marketData.length < 200) {
      this.logger.warn(
        `Insufficient data for ${symbol}: ${marketData.length} points (need at least 200)`,
      );
    }

    const featureSets: FeatureSet[] = [];

    // Sort data by timestamp
    const sortedData = marketData.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );

    // Process each timeframe
    for (const timeframe of pipelineConfig.timeframes) {
      const timeframeData = this.aggregateToTimeframe(sortedData, timeframe);
      const timeframeFeatures = await this.extractTimeframeFeatures(
        timeframeData,
        symbol,
        timeframe,
        pipelineConfig,
      );
      featureSets.push(...timeframeFeatures);
    }

    this.logger.debug(
      `Generated ${featureSets.length} feature sets for ${symbol}`,
    );
    return featureSets;
  }

  /**
   * Extract features for a specific timeframe
   */
  private async extractTimeframeFeatures(
    data: MarketDataPoint[],
    symbol: string,
    timeframe: string,
    config: FeaturePipelineConfig,
  ): Promise<FeatureSet[]> {
    const featureSets: FeatureSet[] = [];
    const minLookback = Math.max(...config.lookbackPeriods);

    for (let i = minLookback; i < data.length; i++) {
      const currentData = data.slice(0, i + 1);
      const features = new Map<string, number>();
      const indicators: TechnicalIndicator[] = [];

      // Price-based features
      this.addPriceFeatures(currentData, features, indicators, timeframe);

      // Volume-based features
      this.addVolumeFeatures(currentData, features, indicators, timeframe);

      // Technical indicators
      this.addTechnicalIndicators(currentData, features, indicators, timeframe);

      // Volatility features
      this.addVolatilityFeatures(currentData, features, indicators, timeframe);

      // Momentum features
      this.addMomentumFeatures(currentData, features, indicators, timeframe);

      // Support/Resistance features
      this.addSupportResistanceFeatures(
        currentData,
        features,
        indicators,
        timeframe,
      );

      // Market regime features
      const metadata = this.calculateMetadata(currentData);

      featureSets.push({
        symbol,
        timestamp: data[i].timestamp,
        timeframe,
        features,
        indicators,
        metadata,
      });
    }

    return featureSets;
  }

  /**
   * Add price-based features
   */
  private addPriceFeatures(
    data: MarketDataPoint[],
    features: Map<string, number>,
    indicators: TechnicalIndicator[],
    timeframe: string,
  ): void {
    const closes = data.map((d) => d.close);
    const highs = data.map((d) => d.high);
    const lows = data.map((d) => d.low);
    const currentPrice = closes[closes.length - 1];
    const timestamp = data[data.length - 1].timestamp;

    // Moving averages
    [10, 20, 50, 200].forEach((period) => {
      if (closes.length >= period) {
        const sma = this.calculateSMA(closes, period);
        const ema = this.calculateEMA(closes, period);

        features.set(`sma_${period}`, sma);
        features.set(`ema_${period}`, ema);
        features.set(`price_vs_sma_${period}`, (currentPrice - sma) / sma);
        features.set(`price_vs_ema_${period}`, (currentPrice - ema) / ema);

        indicators.push({
          name: `sma_${period}`,
          value: sma,
          timestamp,
          timeframe,
        });
      }
    });

    // High/Low ratios
    const high20 = Math.max(...highs.slice(-20));
    const low20 = Math.min(...lows.slice(-20));
    features.set(
      'price_position_20d',
      (currentPrice - low20) / (high20 - low20),
    );

    // Price changes
    [1, 5, 10, 20].forEach((period) => {
      if (closes.length > period) {
        const pastPrice = closes[closes.length - 1 - period];
        const change = (currentPrice - pastPrice) / pastPrice;
        features.set(`price_change_${period}d`, change);
      }
    });
  }

  /**
   * Add volume-based features
   */
  private addVolumeFeatures(
    data: MarketDataPoint[],
    features: Map<string, number>,
    indicators: TechnicalIndicator[],
    timeframe: string,
  ): void {
    const volumes = data.map((d) => d.volume);
    const closes = data.map((d) => d.close);
    const currentVolume = volumes[volumes.length - 1];
    const timestamp = data[data.length - 1].timestamp;

    // Volume moving averages
    [10, 20].forEach((period) => {
      if (volumes.length >= period) {
        const avgVolume = this.calculateSMA(volumes, period);
        features.set(`volume_ratio_${period}d`, currentVolume / avgVolume);
      }
    });

    // VWAP
    if (data.length >= 20) {
      const vwap = this.calculateVWAP(data.slice(-20));
      features.set('vwap_20d', vwap);
      features.set('price_vs_vwap', (closes[closes.length - 1] - vwap) / vwap);

      indicators.push({
        name: 'vwap',
        value: vwap,
        timestamp,
        timeframe,
      });
    }

    // On-Balance Volume
    if (data.length >= 10) {
      const obv = this.calculateOBV(data);
      features.set('obv', obv);
    }
  }

  /**
   * Add technical indicators
   */
  private addTechnicalIndicators(
    data: MarketDataPoint[],
    features: Map<string, number>,
    indicators: TechnicalIndicator[],
    timeframe: string,
  ): void {
    const closes = data.map((d) => d.close);
    const highs = data.map((d) => d.high);
    const lows = data.map((d) => d.low);
    const timestamp = data[data.length - 1].timestamp;

    // RSI
    [14, 21].forEach((period) => {
      if (closes.length >= period + 1) {
        const rsi = this.calculateRSI(closes, period);
        features.set(`rsi_${period}`, rsi);

        indicators.push({
          name: `rsi_${period}`,
          value: rsi,
          timestamp,
          timeframe,
        });
      }
    });

    // MACD
    if (closes.length >= 26) {
      const macd = this.calculateMACD(closes);
      features.set('macd', macd.macd);
      features.set('macd_signal', macd.signal);
      features.set('macd_histogram', macd.histogram);

      indicators.push(
        { name: 'macd', value: macd.macd, timestamp, timeframe },
        { name: 'macd_signal', value: macd.signal, timestamp, timeframe },
        { name: 'macd_histogram', value: macd.histogram, timestamp, timeframe },
      );
    }

    // Bollinger Bands
    if (closes.length >= 20) {
      const bb = this.calculateBollingerBands(closes, 20, 2);
      features.set('bb_upper', bb.upper);
      features.set('bb_middle', bb.middle);
      features.set('bb_lower', bb.lower);
      features.set('bb_width', (bb.upper - bb.lower) / bb.middle);
      features.set(
        'bb_position',
        (closes[closes.length - 1] - bb.lower) / (bb.upper - bb.lower),
      );
    }

    // Stochastic
    if (data.length >= 14) {
      const stoch = this.calculateStochastic(highs, lows, closes, 14);
      features.set('stoch_k', stoch.k);
      features.set('stoch_d', stoch.d);
    }

    // ATR
    [14, 21].forEach((period) => {
      if (data.length >= period) {
        const atr = this.calculateATR(data, period);
        features.set(`atr_${period}`, atr);
      }
    });

    // Williams %R
    if (data.length >= 14) {
      const williamsR = this.calculateWilliamsR(highs, lows, closes, 14);
      features.set('williams_r', williamsR);
    }

    // CCI
    if (data.length >= 20) {
      const cci = this.calculateCCI(data, 20);
      features.set('cci', cci);
    }
  }

  /**
   * Add volatility features
   */
  private addVolatilityFeatures(
    data: MarketDataPoint[],
    features: Map<string, number>,
    indicators: TechnicalIndicator[],
    timeframe: string,
  ): void {
    const closes = data.map((d) => d.close);

    [10, 20, 50].forEach((period) => {
      if (closes.length >= period) {
        const volatility = this.calculateVolatility(closes, period);
        features.set(`volatility_${period}d`, volatility);
      }
    });

    // Historical volatility ratios
    if (closes.length >= 50) {
      const vol10 = this.calculateVolatility(closes, 10);
      const vol50 = this.calculateVolatility(closes, 50);
      features.set('volatility_ratio_10_50', vol10 / vol50);
    }
  }

  /**
   * Add momentum features
   */
  private addMomentumFeatures(
    data: MarketDataPoint[],
    features: Map<string, number>,
    indicators: TechnicalIndicator[],
    timeframe: string,
  ): void {
    const closes = data.map((d) => d.close);

    // Momentum
    [10, 20].forEach((period) => {
      if (closes.length >= period) {
        const momentum =
          closes[closes.length - 1] / closes[closes.length - 1 - period] - 1;
        features.set(`momentum_${period}`, momentum);
      }
    });

    // Rate of Change
    [10, 20].forEach((period) => {
      if (closes.length >= period) {
        const roc = this.calculateROC(closes, period);
        features.set(`roc_${period}`, roc);
      }
    });

    // Trend strength
    if (closes.length >= 20) {
      const trendStrength = this.calculateTrendStrength(closes);
      features.set('trend_strength', trendStrength);
    }
  }

  /**
   * Add support/resistance features
   */
  private addSupportResistanceFeatures(
    data: MarketDataPoint[],
    features: Map<string, number>,
    indicators: TechnicalIndicator[],
    timeframe: string,
  ): void {
    if (data.length >= 50) {
      const levels = this.calculateSupportResistanceLevels(data);
      const currentPrice = data[data.length - 1].close;

      features.set('support_level', levels.support);
      features.set('resistance_level', levels.resistance);
      features.set(
        'distance_to_support',
        (currentPrice - levels.support) / currentPrice,
      );
      features.set(
        'distance_to_resistance',
        (levels.resistance - currentPrice) / currentPrice,
      );
    }
  }

  /**
   * Calculate metadata
   */
  private calculateMetadata(data: MarketDataPoint[]): FeatureSet['metadata'] {
    const closes = data.map((d) => d.close);
    const volumes = data.map((d) => d.volume);

    const currentVolume = volumes[volumes.length - 1];
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;

    const volatility = this.calculateVolatility(closes, 20);

    // Determine trend
    const sma20 = this.calculateSMA(closes, 20);
    const sma50 = this.calculateSMA(closes, 50);
    let trend: 'up' | 'down' | 'sideways' = 'sideways';

    if (sma20 > sma50 * 1.02) trend = 'up';
    else if (sma20 < sma50 * 0.98) trend = 'down';

    // Determine market regime
    const price = closes[closes.length - 1];
    const sma200 = this.calculateSMA(closes, 200);
    let marketRegime: 'bullish' | 'bearish' | 'neutral' = 'neutral';

    if (price > sma200 * 1.05 && trend === 'up') marketRegime = 'bullish';
    else if (price < sma200 * 0.95 && trend === 'down')
      marketRegime = 'bearish';

    return {
      volume: currentVolume,
      volatility,
      trend,
      marketRegime,
    };
  }

  /**
   * Aggregate data to specific timeframe
   */
  private aggregateToTimeframe(
    data: MarketDataPoint[],
    timeframe: string,
  ): MarketDataPoint[] {
    // For now, return original data - implement proper aggregation logic
    // This would group data points by timeframe (e.g., 5m, 1h) and create OHLCV bars
    return data;
  }

  // Technical indicator calculation methods
  private calculateSMA(values: number[], period: number): number {
    if (values.length < period) return values[values.length - 1] || 0;
    const sum = values.slice(-period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  private calculateEMA(values: number[], period: number): number {
    if (values.length < period) return values[values.length - 1] || 0;

    const multiplier = 2 / (period + 1);
    let ema = this.calculateSMA(values.slice(0, period), period);

    for (let i = period; i < values.length; i++) {
      ema = (values[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  private calculateRSI(closes: number[], period: number): number {
    if (closes.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = closes.length - period; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  private calculateMACD(closes: number[]): {
    macd: number;
    signal: number;
    histogram: number;
  } {
    const ema12 = this.calculateEMA(closes, 12);
    const ema26 = this.calculateEMA(closes, 26);
    const macd = ema12 - ema26;

    // For signal line, we'd need to calculate EMA of MACD values
    // Simplified version:
    const signal = macd * 0.8; // Approximation
    const histogram = macd - signal;

    return { macd, signal, histogram };
  }

  private calculateBollingerBands(
    closes: number[],
    period: number,
    stdDev: number,
  ): {
    upper: number;
    middle: number;
    lower: number;
  } {
    const middle = this.calculateSMA(closes, period);
    const variance =
      closes.slice(-period).reduce((sum, value) => {
        return sum + Math.pow(value - middle, 2);
      }, 0) / period;
    const standardDeviation = Math.sqrt(variance);

    return {
      upper: middle + standardDeviation * stdDev,
      middle,
      lower: middle - standardDeviation * stdDev,
    };
  }

  private calculateStochastic(
    highs: number[],
    lows: number[],
    closes: number[],
    period: number,
  ): {
    k: number;
    d: number;
  } {
    const recentHighs = highs.slice(-period);
    const recentLows = lows.slice(-period);
    const currentClose = closes[closes.length - 1];

    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);

    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    const d = k * 0.8; // Simplified - should be SMA of %K

    return { k, d };
  }
  private calculateATR(data: MarketDataPoint[], period: number): number {
    if (data.length < period + 1) return 0;

    const trueRanges: number[] = [];
    for (let i = 1; i < data.length; i++) {
      const high = data[i].high;
      const low = data[i].low;
      const prevClose = data[i - 1].close;

      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose),
      );
      trueRanges.push(tr);
    }

    return this.calculateSMA(trueRanges, period);
  }

  private calculateVWAP(data: MarketDataPoint[]): number {
    let volumeSum = 0;
    let priceVolumeSum = 0;

    data.forEach((point) => {
      const typicalPrice = (point.high + point.low + point.close) / 3;
      priceVolumeSum += typicalPrice * point.volume;
      volumeSum += point.volume;
    });

    return volumeSum > 0 ? priceVolumeSum / volumeSum : 0;
  }

  private calculateOBV(data: MarketDataPoint[]): number {
    let obv = 0;

    for (let i = 1; i < data.length; i++) {
      if (data[i].close > data[i - 1].close) {
        obv += data[i].volume;
      } else if (data[i].close < data[i - 1].close) {
        obv -= data[i].volume;
      }
    }

    return obv;
  }

  private calculateWilliamsR(
    highs: number[],
    lows: number[],
    closes: number[],
    period: number,
  ): number {
    const recentHighs = highs.slice(-period);
    const recentLows = lows.slice(-period);
    const currentClose = closes[closes.length - 1];

    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);

    return ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
  }

  private calculateCCI(data: MarketDataPoint[], period: number): number {
    const typicalPrices = data
      .slice(-period)
      .map((d) => (d.high + d.low + d.close) / 3);
    const sma = this.calculateSMA(typicalPrices, period);

    const meanDeviation =
      typicalPrices.reduce((sum, tp) => sum + Math.abs(tp - sma), 0) / period;
    const currentTP = typicalPrices[typicalPrices.length - 1];

    return (currentTP - sma) / (0.015 * meanDeviation);
  }
  private calculateVolatility(closes: number[], period: number): number {
    if (closes.length < period) return 0;

    const returns: number[] = [];
    for (let i = closes.length - period; i < closes.length - 1; i++) {
      returns.push(Math.log(closes[i + 1] / closes[i]));
    }

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) /
      returns.length;

    return Math.sqrt(variance * 252); // Annualized volatility
  }

  private calculateROC(closes: number[], period: number): number {
    if (closes.length < period + 1) return 0;

    const current = closes[closes.length - 1];
    const past = closes[closes.length - 1 - period];

    return ((current - past) / past) * 100;
  }

  private calculateTrendStrength(closes: number[]): number {
    if (closes.length < 20) return 0;

    let upDays = 0;
    for (let i = closes.length - 19; i < closes.length; i++) {
      if (closes[i] > closes[i - 1]) upDays++;
    }

    return (upDays / 19) * 2 - 1; // Range: -1 to 1
  }

  private calculateSupportResistanceLevels(data: MarketDataPoint[]): {
    support: number;
    resistance: number;
  } {
    const closes = data.map((d) => d.close);
    const highs = data.map((d) => d.high);
    const lows = data.map((d) => d.low);

    // Simplified support/resistance calculation
    const support = Math.min(...lows.slice(-50));
    const resistance = Math.max(...highs.slice(-50));

    return { support, resistance };
  }
}
