import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MLMetric, MLModel, MLPrediction } from '../entities/ml.entities';
import { TechnicalFeatures } from '../interfaces/ml.interfaces';

@Injectable()
export class FeatureEngineeringService {
  private readonly logger = new Logger(FeatureEngineeringService.name);

  constructor(
    @InjectRepository(MLModel)
    private mlModelRepository: Repository<MLModel>,
    @InjectRepository(MLPrediction)
    private mlPredictionRepository: Repository<MLPrediction>,
    @InjectRepository(MLMetric)
    private mlMetricRepository: Repository<MLMetric>,
  ) {}

  /**
   * Extract comprehensive technical features for breakout prediction
   * Enhanced feature engineering for Phase 1 ML models
   */
  async extractBreakoutFeatures(
    symbol: string,
    historicalData: any[],
    technicalIndicators: any,
  ): Promise<TechnicalFeatures> {
    this.logger.log(`Extracting breakout features for ${symbol}`);

    const latestData = historicalData[historicalData.length - 1];
    const previousData = historicalData[historicalData.length - 2];

    // Enhanced technical features with advanced calculations
    const features: TechnicalFeatures = {
      symbol,
      timestamp: new Date(),
      price: latestData.close,
      volume: latestData.volume,

      // Core technical indicators
      rsi: technicalIndicators.rsi || this.calculateRSI(historicalData),
      macd: technicalIndicators.macd || this.calculateMACD(historicalData),

      // Bollinger Bands
      bollingerBands:
        technicalIndicators.bollingerBands ||
        this.calculateBollingerBands(historicalData),

      // Moving averages
      movingAverages: {
        sma20: this.calculateSMA(historicalData, 20),
        sma50: this.calculateSMA(historicalData, 50),
        ema12: this.calculateEMA(historicalData, 12),
        ema26: this.calculateEMA(historicalData, 26),
      },

      // Support and resistance levels
      support: this.calculateSupport(historicalData),
      resistance: this.calculateResistance(historicalData),

      // Volatility and momentum
      volatility: this.calculateVolatility(historicalData),
      momentum: this.calculateMomentum(historicalData),
    };

    // Log feature extraction for monitoring
    await this.logFeatureExtraction(symbol, features);

    return features;
  }

  /**
   * Extract sentiment features from news data
   */
  async extractSentimentFeatures(symbol: string): Promise<any> {
    this.logger.log(`Extracting sentiment features for ${symbol}`);

    // This would integrate with news service in real implementation
    return {
      overallSentiment: Math.random() * 2 - 1, // -1 to 1
      newsCount: Math.floor(Math.random() * 20) + 5,
      confidence: Math.random() * 0.3 + 0.6,
      impactScore: Math.random() * 0.4 + 0.3,
    };
  }

  /**
   * Extract market state features
   */
  async extractMarketFeatures(): Promise<any> {
    this.logger.log('Extracting market state features');

    return {
      vixLevel: Math.random() * 30 + 15, // 15-45 VIX range
      marketTrend: ['BULLISH', 'BEARISH', 'NEUTRAL'][
        Math.floor(Math.random() * 3)
      ],
      liquidity: Math.random() * 0.5 + 0.5,
    };
  }

  // Technical Indicator Calculations
  private calculateRSI(data: any[], period: number = 14): number {
    if (data.length < period + 1) return 50; // Default neutral RSI

    let gains = 0;
    let losses = 0;

    for (let i = data.length - period; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  private calculateMACD(data: any[]): number {
    const ema12 = this.calculateEMA(data, 12);
    const ema26 = this.calculateEMA(data, 26);
    return ema12 - ema26;
  }

  private calculateEMA(data: any[], period: number): number {
    if (data.length < period) return data[data.length - 1].close;

    const multiplier = 2 / (period + 1);
    let ema = data[data.length - period].close;

    for (let i = data.length - period + 1; i < data.length; i++) {
      ema = (data[i].close - ema) * multiplier + ema;
    }

    return ema;
  }

  private calculateSMA(data: any[], period: number): number {
    if (data.length < period) return data[data.length - 1].close;

    const slice = data.slice(-period);
    const sum = slice.reduce((acc, item) => acc + item.close, 0);
    return sum / period;
  }

  private calculateBollingerBands(
    data: any[],
    period: number = 20,
    stdDev: number = 2,
  ): any {
    const sma = this.calculateSMA(data, period);

    if (data.length < period) {
      return { upper: sma * 1.02, middle: sma, lower: sma * 0.98 };
    }

    const slice = data.slice(-period);
    const variance =
      slice.reduce((acc, item) => acc + Math.pow(item.close - sma, 2), 0) /
      period;
    const standardDeviation = Math.sqrt(variance);

    return {
      upper: sma + standardDeviation * stdDev,
      middle: sma,
      lower: sma - standardDeviation * stdDev,
    };
  }

  private calculateSupport(data: any[]): number {
    const prices = data.slice(-20).map((d) => d.low);
    return Math.min(...prices);
  }

  private calculateResistance(data: any[]): number {
    const prices = data.slice(-20).map((d) => d.high);
    return Math.max(...prices);
  }
  private calculateVolatility(data: any[]): number {
    if (data.length < 2) return 0;

    const returns: number[] = [];
    for (let i = 1; i < data.length; i++) {
      returns.push(Math.log(data[i].close / data[i - 1].close));
    }

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
      returns.length;

    return Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
  }

  private calculateMomentum(data: any[]): number {
    if (data.length < 10) return 0;

    const current = data[data.length - 1].close;
    const previous = data[data.length - 10].close;

    return (current - previous) / previous;
  }
  private async logFeatureExtraction(
    symbol: string,
    features: TechnicalFeatures,
  ): Promise<void> {
    try {
      const metric = this.mlMetricRepository.create({
        modelId: 'feature-engineering',
        metricName: 'feature_extraction',
        metricValue: 1,
        calculationDate: new Date(),
        periodStart: new Date(),
        periodEnd: new Date(),
        metadata: {
          symbol,
          features: Object.keys(features).length,
          timestamp: new Date().toISOString(),
        },
      });

      await this.mlMetricRepository.save(metric);
    } catch (error) {
      this.logger.error('Error logging feature extraction:', error);
    }
  }
}
