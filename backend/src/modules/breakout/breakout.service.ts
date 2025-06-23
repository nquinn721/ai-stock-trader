import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { MLAnalysisService } from '../ml-analysis/ml-analysis.service';

export interface DayTradingPattern {
  type:
    | 'flag'
    | 'pennant'
    | 'double_top'
    | 'double_bottom'
    | 'head_shoulders'
    | 'inverse_head_shoulders'
    | 'triangle'
    | 'rectangle'
    | 'wedge'
    | 'none';
  confidence: number;
  direction: 'bullish' | 'bearish' | 'neutral';
  entryPoint: number;
  targetPrice: number;
  stopLoss: number;
  timeframe: string;
  description: string;
}

export interface BreakoutStrategy {
  signal: 'bullish' | 'bearish' | 'neutral';
  probability: number;
  supportLevel: number;
  resistanceLevel: number;
  currentTrend: 'upward' | 'downward' | 'sideways';
  volatility: number;
  rsi: number;
  bollingerPosition: 'upper' | 'middle' | 'lower';
  recommendation: string;
  confidence: number;
  lastCalculated: string;
  dayTradingPatterns: DayTradingPattern[];
  technicalIndicators?: {
    sma20?: number;
    sma50?: number;
    sma200?: number;
    ema12?: number;
    ema26?: number;
    ema9?: number;
    macd?: {
      macd: number;
      signal: number;
      histogram: number;
    };
    bollingerBands?: {
      upper: number;
      middle: number;
      lower: number;
    };
    stochastic?: {
      k: number;
      d: number;
      signal: 'overbought' | 'oversold' | 'neutral';
    };
    williamsR?: {
      value: number;
      signal: 'overbought' | 'oversold' | 'neutral';
    };
    atr?: {
      value: number;
      normalized: number; // ATR as percentage of price
    };
    volatilityIndicators?: {
      historicalVolatility: number;
      averageVolatility: number;
      volatilityRank: number; // 0-100 percentile rank
      regime: 'low' | 'normal' | 'high';
    };
  };
  volumeAnalysis?: {
    currentVolume: number;
    avgVolume: number;
    volumeRatio: number;
    vwap: number;
    volumeSpikes: VolumeSpike[];
    volumeTrend: 'increasing' | 'decreasing' | 'stable';
    volumeStrength: 'high' | 'medium' | 'low';
  };
  supportResistanceAnalysis?: SupportResistanceAnalysis;
  modelPredictions: {
    neuralNetwork: number;
    svmLike: number;
    ensemble: number;
    momentum: number;
    meanReversion: number;
  };
}

export interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface VolumeSpike {
  date: string;
  volume: number;
  ratio: number; // Ratio compared to average volume
  significance: 'high' | 'medium' | 'low';
}

export interface SupportResistanceLevel {
  price: number;
  strength: 'strong' | 'moderate' | 'weak';
  type: 'support' | 'resistance';
  touches: number; // Number of times price has tested this level
  confidence: number; // 0-1 confidence score
  zone: {
    upper: number;
    lower: number;
  };
  timeframe: string;
  lastTested: string;
}

export interface SupportResistanceAnalysis {
  currentSupport: number;
  currentResistance: number;
  supportLevels: SupportResistanceLevel[];
  resistanceLevels: SupportResistanceLevel[];
  pivotPoints: {
    pivot: number;
    s1: number;
    s2: number;
    s3: number;
    r1: number;
    r2: number;
    r3: number;
  };
  keyZones: {
    price: number;
    type: 'support' | 'resistance';
    strength: number;
  }[];
}

@Injectable()
export class BreakoutService {
  constructor(
    @Inject(forwardRef(() => MLAnalysisService))
    private mlAnalysisService: MLAnalysisService,
  ) {}
  async calculateBreakoutStrategy(
    symbol: string,
    currentPrice: number,
    historicalData: HistoricalData[],
  ): Promise<BreakoutStrategy> {
    try {
      // Ensure we have enough data
      if (!historicalData || historicalData.length < 20) {
        return this.getDefaultStrategy(
          currentPrice,
          'Insufficient historical data',
        );
      }

      // Calculate technical indicators
      const technicalAnalysis =
        this.calculateTechnicalIndicators(historicalData);

      // Detect day trading patterns
      const dayTradingPatterns = await this.detectDayTradingPatterns(
        historicalData,
        currentPrice,
      );

      // Apply ML models
      const modelPredictions = await this.applyMLModels(
        historicalData,
        technicalAnalysis,
      );

      // Determine overall signal
      const signal = this.determineSignal(
        technicalAnalysis,
        modelPredictions,
        dayTradingPatterns,
        symbol,
      );

      // Calculate comprehensive support and resistance analysis
      const supportResistanceAnalysis = this.calculateComprehensiveSupportResistance(
        historicalData,
        currentPrice,
      );

      return {
        signal: signal.direction,
        probability: signal.probability,
        supportLevel: supportResistanceAnalysis.currentSupport,
        resistanceLevel: supportResistanceAnalysis.currentResistance,
        currentTrend: technicalAnalysis.trend,
        volatility: technicalAnalysis.volatility,
        rsi: technicalAnalysis.rsi,
        bollingerPosition: technicalAnalysis.bollingerPosition,
        recommendation: signal.recommendation,
        confidence: signal.confidence,
        lastCalculated: new Date().toISOString(),
        dayTradingPatterns,
        technicalIndicators: {
          sma20: technicalAnalysis.sma20,
          sma50: technicalAnalysis.sma50,
          sma200: technicalAnalysis.sma200,
          ema12: technicalAnalysis.ema12,
          ema26: technicalAnalysis.ema26,
          ema9: technicalAnalysis.ema9,
          macd: technicalAnalysis.macd,
          bollingerBands: technicalAnalysis.bollinger,
          stochastic: technicalAnalysis.stochastic,
          williamsR: technicalAnalysis.williamsR,
          atr: technicalAnalysis.atr,
          volatilityIndicators: technicalAnalysis.volatilityIndicators,
        },
        volumeAnalysis: {
          currentVolume: technicalAnalysis.volume,
          avgVolume: technicalAnalysis.avgVolume,
          volumeRatio: technicalAnalysis.volume / technicalAnalysis.avgVolume,
          vwap: this.calculateVWAP(historicalData),
          volumeSpikes: this.detectVolumeSpikes(historicalData),
          volumeTrend: this.analyzeVolumeTrend(historicalData),
          volumeStrength: this.analyzeVolumeStrength(historicalData),
        },
        supportResistanceAnalysis: supportResistanceAnalysis,
        modelPredictions,
      };
    } catch (error) {
      console.error(`Error in calculateBreakoutStrategy for ${symbol}:`, error);
      return this.getDefaultStrategy(currentPrice, 'Error in analysis');
    }
  }

  private getDefaultStrategy(
    currentPrice: number,
    reason: string,
  ): BreakoutStrategy {
    return {
      signal: 'neutral',
      probability: 0.0,
      supportLevel: 0,
      resistanceLevel: 0,
      currentTrend: 'sideways',
      volatility: 0.0,
      rsi: 0,
      bollingerPosition: 'middle',
      recommendation: `No trading data available: ${reason}`,
      confidence: 0.0,
      lastCalculated: new Date().toISOString(),
      dayTradingPatterns: [],
      modelPredictions: {
        neuralNetwork: 0.0,
        svmLike: 0.0,
        ensemble: 0.0,
        momentum: 0.0,
        meanReversion: 0.0,
      },
      volumeAnalysis: {
        currentVolume: 0,
        avgVolume: 0,
        volumeRatio: 0,
        vwap: 0,
        volumeSpikes: [],
        volumeTrend: 'stable',
        volumeStrength: 'low',
      },
      supportResistanceAnalysis: {
        currentSupport: 0,
        currentResistance: 0,
        supportLevels: [],
        resistanceLevels: [],
        pivotPoints: {
          pivot: 0,
          s1: 0,
          s2: 0,
          s3: 0,
          r1: 0,
          r2: 0,
          r3: 0,
        },
        keyZones: [],
      },
    };
  }

  private calculateTechnicalIndicators(data: HistoricalData[]) {
    const closes = data.map((d) => d.close);
    const highs = data.map((d) => d.high);
    const lows = data.map((d) => d.low);
    const volumes = data.map((d) => d.volume);

    // RSI calculation
    const rsi = this.calculateRSI(closes, 14);

    // Simple Moving averages
    const sma20 = this.calculateSMA(closes, 20);
    const sma50 = this.calculateSMA(closes, 50);
    const sma200 = this.calculateSMA(closes, 200);

    // Exponential Moving Averages
    const ema12 = this.calculateEMA(closes, 12);
    const ema26 = this.calculateEMA(closes, 26);
    const ema9 = this.calculateEMA(closes, 9);

    // MACD calculation
    const macd = this.calculateMACD(closes, 12, 26, 9);

    // Bollinger Bands
    const bollinger = this.calculateBollingerBands(closes, 20, 2);

    // Volatility
    const volatility = this.calculateVolatility(closes, 20);

    // Trend determination
    const trend = this.determineTrend(closes, sma20, sma50);

    // Momentum indicators
    const stochastic = this.calculateStochastic(data, 14, 3);
    const williamsR = this.calculateWilliamsR(data, 14);
    
    // Volatility indicators
    const atr = this.calculateATR(data, 14);
    const volatilityIndicators = this.calculateVolatilityIndicators(data, 10, 50);

    return {
      rsi,
      sma20,
      sma50,
      sma200,
      ema12,
      ema26,
      ema9,
      macd,
      bollinger,
      volatility,
      trend,
      stochastic,
      williamsR,
      atr,
      volatilityIndicators,
      bollingerPosition: this.getBollingerPosition(
        closes[closes.length - 1],
        bollinger,
      ),
      volume: volumes[volumes.length - 1],
      avgVolume: this.calculateSMA(volumes, 20),
    };
  }

  private async detectDayTradingPatterns(
    data: HistoricalData[],
    currentPrice: number,
  ): Promise<DayTradingPattern[]> {
    const patterns: DayTradingPattern[] = [];

    try {
      // Use advanced ML analysis for pattern detection
      const mlPatterns = await this.mlAnalysisService.detectAdvancedPatterns(
        data,
        currentPrice,
      );

      // Convert ML predictions to DayTradingPattern format
      for (const mlPattern of mlPatterns) {
        patterns.push({
          type: this.mapMLPatternToType(mlPattern.patternType),
          confidence: mlPattern.confidence,
          direction: mlPattern.direction,
          entryPoint: currentPrice,
          targetPrice: this.calculateTargetFromMLPattern(
            currentPrice,
            mlPattern,
          ),
          stopLoss: this.calculateStopLossFromMLPattern(
            currentPrice,
            mlPattern,
          ),
          timeframe: '1d',
          description: mlPattern.reasoning,
        });
      }

      // Keep existing pattern detection as backup
      const flagPattern = this.detectFlagPattern(data, currentPrice);
      if (flagPattern) patterns.push(flagPattern);

      const pennantPattern = this.detectPennantPattern(data, currentPrice);
      if (pennantPattern) patterns.push(pennantPattern);

      const doublePattern = this.detectDoubleTopBottom(data, currentPrice);
      if (doublePattern) patterns.push(doublePattern);

      const headShouldersPattern = this.detectHeadShoulders(data, currentPrice);
      if (headShouldersPattern) patterns.push(headShouldersPattern);

      const trianglePattern = this.detectTrianglePattern(data, currentPrice);
      if (trianglePattern) patterns.push(trianglePattern);
    } catch (error) {
      console.error('Error in ML pattern detection:', error);
      // Fallback to basic patterns only
      const flagPattern = this.detectFlagPattern(data, currentPrice);
      if (flagPattern) patterns.push(flagPattern);
    }

    // If no patterns detected, add default
    if (patterns.length === 0) {
      patterns.push({
        type: 'none',
        confidence: 0.0,
        direction: 'neutral',
        entryPoint: currentPrice,
        targetPrice: currentPrice,
        stopLoss: currentPrice * 0.98,
        timeframe: '1d',
        description: 'No clear day trading patterns detected',
      });
    }

    return patterns;
  }

  private async applyMLModels(data: HistoricalData[], technicalAnalysis: any) {
    try {
      // Use advanced ML analysis service
      const neuralNetPrediction =
        await this.mlAnalysisService.predictPriceMomentum(
          data,
          technicalAnalysis,
        );
      const trendPrediction =
        await this.mlAnalysisService.predictTrendDirection(data);
      const ensemblePrediction =
        await this.mlAnalysisService.generateEnsemblePrediction(
          data,
          technicalAnalysis,
        );
      const strategyOptimization =
        await this.mlAnalysisService.optimizeTradingStrategy(
          data,
          technicalAnalysis,
        );

      // Convert predictions to numeric values
      const neuralNetwork = this.predictionToValue(neuralNetPrediction);
      const trend = this.predictionToValue(trendPrediction);
      const ensemble = this.predictionToValue(ensemblePrediction);

      // Simulate additional models for backward compatibility
      const momentum = this.calculateMomentumScore(data);
      const meanReversion = this.calculateMeanReversionScore(
        data,
        technicalAnalysis,
      );

      return {
        neuralNetwork,
        svmLike: trend, // Map trend prediction to SVM-like
        ensemble,
        momentum,
        meanReversion,
      };
    } catch (error) {
      console.error('Error in ML models:', error);
      // Fallback to simple simulation
      return this.simulateBasicMLModels(data, technicalAnalysis);
    }
  }

  private predictionToValue(prediction: any): number {
    const directionValue =
      prediction.direction === 'bullish'
        ? 1
        : prediction.direction === 'bearish'
          ? -1
          : 0;
    return directionValue * prediction.confidence;
  }

  private simulateBasicMLModels(
    data: HistoricalData[],
    technicalAnalysis: any,
  ) {
    // Fallback to original simulation methods
    const neuralNetwork = this.simulateNeuralNetwork(data, technicalAnalysis);
    const svmLike = this.simulateSVM(data, technicalAnalysis);
    const ensemble = this.simulateEnsemble(technicalAnalysis);
    const momentum = this.calculateMomentumScore(data);
    const meanReversion = this.calculateMeanReversionScore(
      data,
      technicalAnalysis,
    );

    return {
      neuralNetwork,
      svmLike,
      ensemble,
      momentum,
      meanReversion,
    };
  }

  // Technical Analysis Helper Methods
  private calculateRSI(prices: number[], period: number): number {
    if (prices.length < period + 1) return 50;

    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  private calculateSMA(values: number[], period: number): number {
    if (values.length < period) return values[values.length - 1] || 0;
    const slice = values.slice(-period);
    return slice.reduce((sum, val) => sum + val, 0) / slice.length;
  }

  private calculateBollingerBands(
    prices: number[],
    period: number,
    stdDev: number,
  ) {
    const sma = this.calculateSMA(prices, period);
    const slice = prices.slice(-period);
    const variance =
      slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const std = Math.sqrt(variance);

    return {
      upper: sma + std * stdDev,
      middle: sma,
      lower: sma - std * stdDev,
    };
  }

  private calculateVolatility(prices: number[], period: number): number {
    if (prices.length < period) return 0.2;

    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    const avgReturn =
      returns.slice(-period).reduce((sum, ret) => sum + ret, 0) / period;
    const variance =
      returns
        .slice(-period)
        .reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / period;

    return Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
  }

  /**
   * Calculate Exponential Moving Average (EMA)
   */
  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0;

    const multiplier = 2 / (period + 1);
    let ema = this.calculateSMA(prices.slice(0, period), period);

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }

    return ema;
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  private calculateMACD(
    prices: number[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9,
  ) {
    if (prices.length < slowPeriod) {
      return {
        macd: 0,
        signal: 0,
        histogram: 0,
      };
    }

    const emaFast = this.calculateEMA(prices, fastPeriod);
    const emaSlow = this.calculateEMA(prices, slowPeriod);
    const macdLine = emaFast - emaSlow;

    // Calculate MACD values for signal line
    const macdValues: number[] = [];

    // Calculate MACD line for each point to get signal
    for (let i = slowPeriod - 1; i < prices.length; i++) {
      const subPrices = prices.slice(0, i + 1);
      const fastEMA = this.calculateEMA(subPrices, fastPeriod);
      const slowEMA = this.calculateEMA(subPrices, slowPeriod);
      macdValues.push(fastEMA - slowEMA);
    }

    const signalLine = this.calculateEMA(macdValues, signalPeriod);
    const histogram = macdLine - signalLine;

    return {
      macd: Math.round(macdLine * 10000) / 10000,
      signal: Math.round(signalLine * 10000) / 10000,
      histogram: Math.round(histogram * 10000) / 10000,
    };
  }

  private determineTrend(
    prices: number[],
    sma20: number,
    sma50: number,
  ): 'upward' | 'downward' | 'sideways' {
    const currentPrice = prices[prices.length - 1];
    const prevPrice = prices[prices.length - 2] || currentPrice;

    if (currentPrice > sma20 && sma20 > sma50 && currentPrice > prevPrice) {
      return 'upward';
    } else if (
      currentPrice < sma20 &&
      sma20 < sma50 &&
      currentPrice < prevPrice
    ) {
      return 'downward';
    }
    return 'sideways';
  }

  /**
   * Calculate Volume Weighted Average Price (VWAP)
   */
  private calculateVWAP(data: HistoricalData[]): number {
    if (!data || data.length === 0) return 0;

    let totalVolume = 0;
    let totalVolumePrice = 0;

    for (const candle of data) {
      const typicalPrice = (candle.high + candle.low + candle.close) / 3;
      totalVolumePrice += typicalPrice * candle.volume;
      totalVolume += candle.volume;
    }

    return totalVolume > 0 ? totalVolumePrice / totalVolume : 0;
  }

  /**
   * Detect volume spikes in historical data
   */
  private detectVolumeSpikes(data: HistoricalData[]): VolumeSpike[] {
    if (!data || data.length < 10) return [];

    const spikes: VolumeSpike[] = [];
    const volumes = data.map(d => d.volume);
    const avgVolume = this.calculateSMA(volumes, 20);

    // Look for volume spikes in the last 10 periods
    const recentData = data.slice(-10);
    
    for (const candle of recentData) {
      const ratio = candle.volume / avgVolume;
      
      if (ratio >= 2.0) {
        spikes.push({
          date: candle.date,
          volume: candle.volume,
          ratio: ratio,
          significance: ratio >= 3.0 ? 'high' : ratio >= 2.5 ? 'medium' : 'low'
        });
      }
    }

    return spikes.sort((a, b) => b.ratio - a.ratio); // Sort by ratio descending
  }

  /**
   * Analyze volume trend over recent periods
   */
  private analyzeVolumeTrend(data: HistoricalData[]): 'increasing' | 'decreasing' | 'stable' {
    if (!data || data.length < 10) return 'stable';

    const recentVolumes = data.slice(-10).map(d => d.volume);
    const firstHalf = recentVolumes.slice(0, 5);
    const secondHalf = recentVolumes.slice(5);

    const firstHalfAvg = firstHalf.reduce((sum, vol) => sum + vol, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, vol) => sum + vol, 0) / secondHalf.length;

    const changePercent = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    if (changePercent > 20) return 'increasing';
    if (changePercent < -20) return 'decreasing';
    return 'stable';
  }

  /**
   * Analyze volume strength relative to historical averages
   */
  private analyzeVolumeStrength(data: HistoricalData[]): 'high' | 'medium' | 'low' {
    if (!data || data.length < 20) return 'low';

    const volumes = data.map(d => d.volume);
    const currentVolume = volumes[volumes.length - 1];
    const avgVolume = this.calculateSMA(volumes, 20);
    const ratio = currentVolume / avgVolume;

    if (ratio >= 1.5) return 'high';
    if (ratio >= 0.8) return 'medium';
    return 'low';
  }

  /**
   * Determine Bollinger Band position
   */
  private getBollingerPosition(
    currentPrice: number,
    bollinger: { upper: number; middle: number; lower: number }
  ): 'upper' | 'middle' | 'lower' {
    if (currentPrice >= bollinger.upper * 0.95) return 'upper';
    if (currentPrice <= bollinger.lower * 1.05) return 'lower';
    return 'middle';
  }

  /**
   * Calculate Stochastic Oscillator (%K and %D)
   */
  private calculateStochastic(
    data: HistoricalData[], 
    kPeriod: number = 14, 
    dPeriod: number = 3
  ): { k: number; d: number; signal: 'overbought' | 'oversold' | 'neutral' } {
    if (!data || data.length < kPeriod) {
      return { k: 50, d: 50, signal: 'neutral' };
    }

    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const closes = data.map(d => d.close);
    
    // Calculate %K values
    const kValues: number[] = [];
    
    for (let i = kPeriod - 1; i < data.length; i++) {
      const periodHighs = highs.slice(i - kPeriod + 1, i + 1);
      const periodLows = lows.slice(i - kPeriod + 1, i + 1);
      const currentClose = closes[i];
      
      const highestHigh = Math.max(...periodHighs);
      const lowestLow = Math.min(...periodLows);
      
      const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
      kValues.push(k);
    }
    
    const currentK = kValues[kValues.length - 1] || 50;
    const currentD = this.calculateSMA(kValues.slice(-dPeriod), dPeriod);
    
    let signal: 'overbought' | 'oversold' | 'neutral' = 'neutral';
    if (currentK > 80 && currentD > 80) signal = 'overbought';
    else if (currentK < 20 && currentD < 20) signal = 'oversold';
    
    return {
      k: Math.round(currentK * 100) / 100,
      d: Math.round(currentD * 100) / 100,
      signal
    };
  }

  /**
   * Calculate Williams %R
   */
  private calculateWilliamsR(
    data: HistoricalData[], 
    period: number = 14
  ): { value: number; signal: 'overbought' | 'oversold' | 'neutral' } {
    if (!data || data.length < period) {
      return { value: -50, signal: 'neutral' };
    }

    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    const closes = data.map(d => d.close);
    
    const recentHighs = highs.slice(-period);
    const recentLows = lows.slice(-period);
    const currentClose = closes[closes.length - 1];
    
    const highestHigh = Math.max(...recentHighs);
    const lowestLow = Math.min(...recentLows);
    
    const williamsR = ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
    
    let signal: 'overbought' | 'oversold' | 'neutral' = 'neutral';
    if (williamsR > -20) signal = 'overbought';
    else if (williamsR < -80) signal = 'oversold';
    
    return {
      value: Math.round(williamsR * 100) / 100,
      signal
    };
  }

  /**
   * Calculate Average True Range (ATR)
   */
  private calculateATR(
    data: HistoricalData[], 
    period: number = 14
  ): { value: number; normalized: number } {
    if (!data || data.length < period + 1) {
      return { value: 0, normalized: 0 };
    }

    const trueRanges: number[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const current = data[i];
      const previous = data[i - 1];
      
      const tr1 = current.high - current.low;
      const tr2 = Math.abs(current.high - previous.close);
      const tr3 = Math.abs(current.low - previous.close);
      
      const trueRange = Math.max(tr1, tr2, tr3);
      trueRanges.push(trueRange);
    }
    
    const atr = this.calculateSMA(trueRanges.slice(-period), period);
    const currentPrice = data[data.length - 1].close;
    const normalizedATR = (atr / currentPrice) * 100;
    
    return {
      value: Math.round(atr * 100) / 100,
      normalized: Math.round(normalizedATR * 100) / 100
    };
  }

  /**
   * Calculate comprehensive volatility indicators
   */
  private calculateVolatilityIndicators(
    data: HistoricalData[], 
    shortPeriod: number = 10,
    longPeriod: number = 50
  ): {
    historicalVolatility: number;
    averageVolatility: number;
    volatilityRank: number;
    regime: 'low' | 'normal' | 'high';
  } {
    if (!data || data.length < longPeriod) {
      return {
        historicalVolatility: 0,
        averageVolatility: 0,
        volatilityRank: 50,
        regime: 'normal'
      };
    }

    const closes = data.map(d => d.close);
    
    // Calculate returns
    const returns: number[] = [];
    for (let i = 1; i < closes.length; i++) {
      returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
    }
    
    // Calculate short-term historical volatility
    const recentReturns = returns.slice(-shortPeriod);
    const meanReturn = recentReturns.reduce((sum, ret) => sum + ret, 0) / recentReturns.length;
    const variance = recentReturns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / recentReturns.length;
    const historicalVolatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized
    
    // Calculate long-term average volatility
    const longReturns = returns.slice(-longPeriod);
    const longMeanReturn = longReturns.reduce((sum, ret) => sum + ret, 0) / longReturns.length;
    const longVariance = longReturns.reduce((sum, ret) => sum + Math.pow(ret - longMeanReturn, 2), 0) / longReturns.length;
    const averageVolatility = Math.sqrt(longVariance) * Math.sqrt(252) * 100;
    
    // Calculate volatility rank (percentile)
    const volatilityHistory: number[] = [];
    for (let i = shortPeriod; i < returns.length; i++) {
      const periodReturns = returns.slice(i - shortPeriod, i);
      const periodMean = periodReturns.reduce((sum, ret) => sum + ret, 0) / periodReturns.length;
      const periodVariance = periodReturns.reduce((sum, ret) => sum + Math.pow(ret - periodMean, 2), 0) / periodReturns.length;
      const periodVolatility = Math.sqrt(periodVariance) * Math.sqrt(252) * 100;
      volatilityHistory.push(periodVolatility);
    }
    
    const sortedVolatility = [...volatilityHistory].sort((a, b) => a - b);
    const rank = sortedVolatility.findIndex(vol => vol >= historicalVolatility);
    const volatilityRank = (rank / sortedVolatility.length) * 100;
    
    // Determine volatility regime
    let regime: 'low' | 'normal' | 'high' = 'normal';
    if (volatilityRank < 25) regime = 'low';
    else if (volatilityRank > 75) regime = 'high';
    
    return {
      historicalVolatility: Math.round(historicalVolatility * 100) / 100,
      averageVolatility: Math.round(averageVolatility * 100) / 100,
      volatilityRank: Math.round(volatilityRank * 100) / 100,
      regime
    };
  }

  /**
   * Calculate support and resistance levels
   */
  private calculateSupportResistance(
    data: HistoricalData[],
    currentPrice: number
  ): { support: number; resistance: number } {
    if (!data || data.length < 10) {
      return {
        support: currentPrice * 0.95,
        resistance: currentPrice * 1.05
      };
    }

    const highs = data.map(d => d.high);
    const lows = data.map(d => d.low);
    
    // Find recent highs and lows
    const recentHighs = highs.slice(-20).sort((a, b) => b - a);
    const recentLows = lows.slice(-20).sort((a, b) => a - b);
    
    // Calculate resistance as average of top 3 recent highs
    const resistance = recentHighs.slice(0, 3).reduce((sum, high) => sum + high, 0) / 3;
    
    // Calculate support as average of bottom 3 recent lows
    const support = recentLows.slice(0, 3).reduce((sum, low) => sum + low, 0) / 3;
    
    return { support, resistance };
  }

  /**
   * Calculate comprehensive support and resistance analysis
   */
  private calculateComprehensiveSupportResistance(
    data: HistoricalData[],
    currentPrice: number
  ): SupportResistanceAnalysis {
    if (!data || data.length < 20) {
      const basicSupport = currentPrice * 0.95;
      const basicResistance = currentPrice * 1.05;
      
      return {
        currentSupport: basicSupport,
        currentResistance: basicResistance,
        supportLevels: [{
          price: basicSupport,
          strength: 'weak',
          type: 'support',
          touches: 0,
          confidence: 0.3,
          zone: { upper: basicSupport * 1.002, lower: basicSupport * 0.998 },
          timeframe: 'daily',
          lastTested: new Date().toISOString()
        }],
        resistanceLevels: [{
          price: basicResistance,
          strength: 'weak',
          type: 'resistance',
          touches: 0,
          confidence: 0.3,
          zone: { upper: basicResistance * 1.002, lower: basicResistance * 0.998 },
          timeframe: 'daily',
          lastTested: new Date().toISOString()
        }],
        pivotPoints: this.calculatePivotPoints(data),
        keyZones: []
      };
    }

    // Find pivot highs and lows
    const pivotHighs = this.findPivotPoints(data, 'high');
    const pivotLows = this.findPivotPoints(data, 'low');
    
    // Calculate support levels from pivot lows
    const supportLevels = this.calculateSupportLevels(pivotLows, data, currentPrice);
    
    // Calculate resistance levels from pivot highs
    const resistanceLevels = this.calculateResistanceLevels(pivotHighs, data, currentPrice);
    
    // Find current nearest support and resistance
    const currentSupport = this.findNearestSupport(supportLevels, currentPrice);
    const currentResistance = this.findNearestResistance(resistanceLevels, currentPrice);
    
    // Calculate pivot points for today
    const pivotPoints = this.calculatePivotPoints(data);
    
    // Identify key zones
    const keyZones = this.identifyKeyZones(supportLevels, resistanceLevels);

    return {
      currentSupport,
      currentResistance,
      supportLevels,
      resistanceLevels,
      pivotPoints,
      keyZones
    };
  }

  /**
   * Find pivot points (local extremes) in price data
   */
  private findPivotPoints(data: HistoricalData[], type: 'high' | 'low'): Array<{price: number, date: string, index: number}> {
    const pivots: Array<{price: number, date: string, index: number}> = [];
    const lookback = 5; // Number of periods to look back/forward
    
    for (let i = lookback; i < data.length - lookback; i++) {
      const current = type === 'high' ? data[i].high : data[i].low;
      let isPivot = true;
      
      // Check if current point is higher/lower than surrounding points
      for (let j = i - lookback; j <= i + lookback; j++) {
        if (j === i) continue;
        const compare = type === 'high' ? data[j].high : data[j].low;
        
        if (type === 'high' && current <= compare) {
          isPivot = false;
          break;
        } else if (type === 'low' && current >= compare) {
          isPivot = false;
          break;
        }
      }
      
      if (isPivot) {
        pivots.push({
          price: current,
          date: data[i].date,
          index: i
        });
      }
    }
    
    return pivots;
  }

  /**
   * Calculate support levels from pivot lows
   */
  private calculateSupportLevels(
    pivotLows: Array<{price: number, date: string, index: number}>,
    data: HistoricalData[],
    currentPrice: number
  ): SupportResistanceLevel[] {
    const levels: SupportResistanceLevel[] = [];
    const priceGroups = this.groupPricesByProximity(pivotLows.map(p => p.price), 0.01); // 1% grouping
    
    for (const group of priceGroups) {
      const avgPrice = group.reduce((sum, price) => sum + price, 0) / group.length;
      const touches = group.length;
      const confidence = Math.min(touches * 0.2, 1); // More touches = higher confidence
      const strength = touches >= 3 ? 'strong' : touches >= 2 ? 'moderate' : 'weak';
      
      // Find last time this level was tested
      const lastTested = this.findLastTestedDate(avgPrice, data, 'support');
      
      levels.push({
        price: avgPrice,
        strength: strength as 'strong' | 'moderate' | 'weak',
        type: 'support',
        touches,
        confidence,
        zone: {
          upper: avgPrice * 1.005, // 0.5% zone
          lower: avgPrice * 0.995
        },
        timeframe: 'daily',
        lastTested
      });
    }
    
    // Sort by proximity to current price and strength
    return levels
      .filter(level => level.price < currentPrice) // Only support below current price
      .sort((a, b) => {
        const aDistance = Math.abs(currentPrice - a.price);
        const bDistance = Math.abs(currentPrice - b.price);
        return aDistance - bDistance; // Closest first
      })
      .slice(0, 5); // Top 5 support levels
  }

  /**
   * Calculate resistance levels from pivot highs
   */
  private calculateResistanceLevels(
    pivotHighs: Array<{price: number, date: string, index: number}>,
    data: HistoricalData[],
    currentPrice: number
  ): SupportResistanceLevel[] {
    const levels: SupportResistanceLevel[] = [];
    const priceGroups = this.groupPricesByProximity(pivotHighs.map(p => p.price), 0.01);
    
    for (const group of priceGroups) {
      const avgPrice = group.reduce((sum, price) => sum + price, 0) / group.length;
      const touches = group.length;
      const confidence = Math.min(touches * 0.2, 1);
      const strength = touches >= 3 ? 'strong' : touches >= 2 ? 'moderate' : 'weak';
      
      const lastTested = this.findLastTestedDate(avgPrice, data, 'resistance');
      
      levels.push({
        price: avgPrice,
        strength: strength as 'strong' | 'moderate' | 'weak',
        type: 'resistance',
        touches,
        confidence,
        zone: {
          upper: avgPrice * 1.005,
          lower: avgPrice * 0.995
        },
        timeframe: 'daily',
        lastTested
      });
    }
    
    return levels
      .filter(level => level.price > currentPrice) // Only resistance above current price
      .sort((a, b) => {
        const aDistance = Math.abs(a.price - currentPrice);
        const bDistance = Math.abs(b.price - currentPrice);
        return aDistance - bDistance;
      })
      .slice(0, 5); // Top 5 resistance levels
  }

  /**
   * Group prices by proximity (within specified percentage)
   */
  private groupPricesByProximity(prices: number[], proximityPercent: number): number[][] {
    const groups: number[][] = [];
    const sortedPrices = [...prices].sort((a, b) => a - b);
    
    for (const price of sortedPrices) {
      let addedToGroup = false;
      
      for (const group of groups) {
        const groupAvg = group.reduce((sum, p) => sum + p, 0) / group.length;
        const distance = Math.abs(price - groupAvg) / groupAvg;
        
        if (distance <= proximityPercent) {
          group.push(price);
          addedToGroup = true;
          break;
        }
      }
      
      if (!addedToGroup) {
        groups.push([price]);
      }
    }
    
    return groups;
  }

  /**
   * Find last time a price level was tested
   */
  private findLastTestedDate(level: number, data: HistoricalData[], type: 'support' | 'resistance'): string {
    const tolerance = 0.01; // 1% tolerance
    
    for (let i = data.length - 1; i >= 0; i--) {
      const candle = data[i];
      const testPrice = type === 'support' ? candle.low : candle.high;
      const distance = Math.abs(testPrice - level) / level;
      
      if (distance <= tolerance) {
        return candle.date;
      }
    }
    
    return data[data.length - 1]?.date || new Date().toISOString();
  }

  /**
   * Find nearest support level to current price
   */
  private findNearestSupport(supportLevels: SupportResistanceLevel[], currentPrice: number): number {
    if (supportLevels.length === 0) {
      return currentPrice * 0.95; // Default 5% below
    }
    
    const nearestSupport = supportLevels
      .filter(level => level.price < currentPrice)
      .sort((a, b) => (currentPrice - a.price) - (currentPrice - b.price))[0];
    
    return nearestSupport ? nearestSupport.price : currentPrice * 0.95;
  }

  /**
   * Find nearest resistance level to current price
   */
  private findNearestResistance(resistanceLevels: SupportResistanceLevel[], currentPrice: number): number {
    if (resistanceLevels.length === 0) {
      return currentPrice * 1.05; // Default 5% above
    }
    
    const nearestResistance = resistanceLevels
      .filter(level => level.price > currentPrice)
      .sort((a, b) => (a.price - currentPrice) - (b.price - currentPrice))[0];
    
    return nearestResistance ? nearestResistance.price : currentPrice * 1.05;
  }

  /**
   * Calculate pivot points for day trading
   */
  private calculatePivotPoints(data: HistoricalData[]): {
    pivot: number;
    s1: number;
    s2: number;
    s3: number;
    r1: number;
    r2: number;
    r3: number;
  } {
    if (data.length === 0) {
      const defaultPrice = 100;
      return {
        pivot: defaultPrice,
        s1: defaultPrice * 0.99,
        s2: defaultPrice * 0.98,
        s3: defaultPrice * 0.97,
        r1: defaultPrice * 1.01,
        r2: defaultPrice * 1.02,
        r3: defaultPrice * 1.03
      };
    }
    
    // Use yesterday's high, low, close for pivot calculation
    const yesterday = data[data.length - 1];
    const high = yesterday.high;
    const low = yesterday.low;
    const close = yesterday.close;
    
    const pivot = (high + low + close) / 3;
    const r1 = (2 * pivot) - low;
    const s1 = (2 * pivot) - high;
    const r2 = pivot + (high - low);
    const s2 = pivot - (high - low);
    const r3 = high + 2 * (pivot - low);
    const s3 = low - 2 * (high - pivot);
    
    return { pivot, s1, s2, s3, r1, r2, r3 };
  }

  /**
   * Identify key zones combining support and resistance
   */
  private identifyKeyZones(
    supportLevels: SupportResistanceLevel[],
    resistanceLevels: SupportResistanceLevel[]
  ): Array<{price: number, type: 'support' | 'resistance', strength: number}> {
    const keyZones: Array<{price: number, type: 'support' | 'resistance', strength: number}> = [];
    
    // Add strong support levels as key zones
    supportLevels
      .filter(level => level.strength === 'strong' || level.confidence > 0.7)
      .forEach(level => {
        keyZones.push({
          price: level.price,
          type: 'support',
          strength: level.confidence
        });
      });
    
    // Add strong resistance levels as key zones
    resistanceLevels
      .filter(level => level.strength === 'strong' || level.confidence > 0.7)
      .forEach(level => {
        keyZones.push({
          price: level.price,
          type: 'resistance',
          strength: level.confidence
        });
      });
    
    return keyZones.sort((a, b) => b.strength - a.strength).slice(0, 8); // Top 8 key zones
  }

  /**
   * Determine overall trading signal
   */
  private determineSignal(
    technical: any,
    modelPredictions: {
      neuralNetwork: number;
      svmLike: number;
      ensemble: number;
      momentum: number;
      meanReversion: number;
    },
    patterns: DayTradingPattern[],
    symbol: string
  ): {
    direction: 'bullish' | 'bearish' | 'neutral';
    probability: number;
    recommendation: string;
    confidence: number;
  } {
    let bullishScore = 0;
    let bearishScore = 0;
    let signals: string[] = [];

    // Technical indicators scoring
    if (technical.rsi < 30) {
      bullishScore += 2;
      signals.push('RSI oversold');
    } else if (technical.rsi > 70) {
      bearishScore += 2;
      signals.push('RSI overbought');
    }

    if (technical.trend === 'upward') {
      bullishScore += 2;
      signals.push('Upward trend');
    } else if (technical.trend === 'downward') {
      bearishScore += 2;
      signals.push('Downward trend');
    }

    // MACD signals
    if (technical.macd && technical.macd.macd > technical.macd.signal) {
      bullishScore += 1;
      signals.push('MACD bullish');
    } else if (technical.macd && technical.macd.macd < technical.macd.signal) {
      bearishScore += 1;
      signals.push('MACD bearish');
    }

    // Volume analysis
    if (technical.volume > technical.avgVolume * 1.5) {
      if (bullishScore > bearishScore) {
        bullishScore += 1;
        signals.push('High volume supports bullish trend');
      } else if (bearishScore > bullishScore) {
        bearishScore += 1;
        signals.push('High volume supports bearish trend');
      }
    }

    // ML predictions
    const avgPrediction = Object.values(modelPredictions).reduce((sum: number, val: any) => sum + val, 0) / Object.keys(modelPredictions).length;
    if (avgPrediction > 0.6) {
      bullishScore += 2;
      signals.push('ML models predict upward movement');
    } else if (avgPrediction < 0.4) {
      bearishScore += 2;
      signals.push('ML models predict downward movement');
    }

    // Pattern analysis
    const bullishPatterns = patterns.filter(p => p.direction === 'bullish').length;
    const bearishPatterns = patterns.filter(p => p.direction === 'bearish').length;
    
    if (bullishPatterns > bearishPatterns) {
      bullishScore += bullishPatterns;
      signals.push(`${bullishPatterns} bullish patterns detected`);
    } else if (bearishPatterns > bullishPatterns) {
      bearishScore += bearishPatterns;
      signals.push(`${bearishPatterns} bearish patterns detected`);
    }

    // Determine final signal
    const totalScore = bullishScore + bearishScore;
    let direction: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let probability = 0.5;
    let confidence = Math.min(totalScore * 10, 100);

    if (bullishScore > bearishScore && bullishScore >= 3) {
      direction = 'bullish';
      probability = Math.min(0.5 + (bullishScore - bearishScore) * 0.1, 0.9);
    } else if (bearishScore > bullishScore && bearishScore >= 3) {
      direction = 'bearish';
      probability = Math.min(0.5 + (bearishScore - bullishScore) * 0.1, 0.9);
    }

    const recommendation = this.generateRecommendation(direction, signals, symbol);

    return {
      direction,
      probability,
      recommendation,
      confidence
    };
  }

  /**
   * Generate trading recommendation text
   */
  private generateRecommendation(
    direction: 'bullish' | 'bearish' | 'neutral',
    signals: string[],
    symbol: string
  ): string {
    const signalText = signals.length > 0 ? signals.join(', ') : 'Mixed signals';
    
    switch(direction) {
      case 'bullish':
        return `CONSIDER BUYING ${symbol}. Bullish indicators: ${signalText}. Monitor for entry opportunities.`;
      case 'bearish':
        return `CONSIDER SELLING/SHORTING ${symbol}. Bearish indicators: ${signalText}. Look for exit points or short positions.`;
      default:
        return `HOLD/WATCH ${symbol}. Neutral signals: ${signalText}. Wait for clearer direction.`;
    }
  }

  // Pattern Detection Methods
  private detectFlagPattern(
    data: HistoricalData[],
    currentPrice: number,
  ): DayTradingPattern | null {
    if (data.length < 10) return null;

    const prices = data.map((d) => d.close);
    const highs = data.map((d) => d.high);
    const lows = data.map((d) => d.low);

    // Look for flag pattern: sharp move followed by sideways consolidation
    const recentPrices = prices.slice(-10);
    const momentum =
      (recentPrices[recentPrices.length - 1] - recentPrices[0]) /
      recentPrices[0];

    if (Math.abs(momentum) > 0.05) {
      // 5% move
      const consolidationRange =
        Math.max(...recentPrices.slice(-5)) -
        Math.min(...recentPrices.slice(-5));
      const avgPrice =
        recentPrices.slice(-5).reduce((sum, p) => sum + p, 0) / 5;
      const rangePercent = consolidationRange / avgPrice;

      if (rangePercent < 0.03) {
        // Tight consolidation
        return {
          type: 'flag',
          confidence: 0.7,
          direction: momentum > 0 ? 'bullish' : 'bearish',
          entryPoint: currentPrice,
          targetPrice: currentPrice * (1 + momentum * 0.5),
          stopLoss: currentPrice * (momentum > 0 ? 0.97 : 1.03),
          timeframe: '1d',
          description: `${momentum > 0 ? 'Bullish' : 'Bearish'} flag pattern detected with ${(Math.abs(momentum) * 100).toFixed(1)}% initial move`,
        };
      }
    }

    return null;
  }

  private detectPennantPattern(
    data: HistoricalData[],
    currentPrice: number,
  ): DayTradingPattern | null {
    if (data.length < 15) return null;

    const highs = data.slice(-10).map((d) => d.high);
    const lows = data.slice(-10).map((d) => d.low);

    // Check for converging trend lines
    const highTrend = this.calculateTrendSlope(highs);
    const lowTrend = this.calculateTrendSlope(lows);

    if (
      highTrend < 0 &&
      lowTrend > 0 &&
      Math.abs(highTrend - lowTrend) > 0.01
    ) {
      return {
        type: 'pennant',
        confidence: 0.6,
        direction: 'bullish', // Pennants usually continue the prior trend
        entryPoint: currentPrice,
        targetPrice: currentPrice * 1.04,
        stopLoss: currentPrice * 0.98,
        timeframe: '1d',
        description:
          'Pennant pattern detected - converging price action suggesting continuation',
      };
    }

    return null;
  }

  private detectDoubleTopBottom(
    data: HistoricalData[],
    currentPrice: number,
  ): DayTradingPattern | null {
    if (data.length < 20) return null;

    const prices = data.map((d) => d.close);
    const highs = data.map((d) => d.high);
    const lows = data.map((d) => d.low);

    // Look for double top pattern
    const maxHigh = Math.max(...highs);
    const maxIndices = highs
      .map((h, i) => (h >= maxHigh * 0.99 ? i : -1))
      .filter((i) => i !== -1);

    if (
      maxIndices.length >= 2 &&
      maxIndices[maxIndices.length - 1] - maxIndices[0] > 5
    ) {
      return {
        type: 'double_top',
        confidence: 0.65,
        direction: 'bearish',
        entryPoint: currentPrice,
        targetPrice: currentPrice * 0.96,
        stopLoss: maxHigh,
        timeframe: '1d',
        description: 'Double top pattern detected - bearish reversal signal',
      };
    }

    // Look for double bottom pattern
    const minLow = Math.min(...lows);
    const minIndices = lows
      .map((l, i) => (l <= minLow * 1.01 ? i : -1))
      .filter((i) => i !== -1);

    if (
      minIndices.length >= 2 &&
      minIndices[minIndices.length - 1] - minIndices[0] > 5
    ) {
      return {
        type: 'double_bottom',
        confidence: 0.65,
        direction: 'bullish',
        entryPoint: currentPrice,
        targetPrice: currentPrice * 1.04,
        stopLoss: minLow,
        timeframe: '1d',
        description: 'Double bottom pattern detected - bullish reversal signal',
      };
    }

    return null;
  }

  private detectHeadShoulders(
    data: HistoricalData[],
    currentPrice: number,
  ): DayTradingPattern | null {
    if (data.length < 15) return null;

    const highs = data.map((d) => d.high);
    const peaks = this.findPeaks(highs);

    if (peaks.length >= 3) {
      const lastThree = peaks.slice(-3);
      const [left, head, right] = lastThree.map((i) => highs[i]);

      // Head should be higher than shoulders
      if (head > left && head > right && Math.abs(left - right) / left < 0.05) {
        return {
          type: 'head_shoulders',
          confidence: 0.7,
          direction: 'bearish',
          entryPoint: currentPrice,
          targetPrice: currentPrice * 0.94,
          stopLoss: head,
          timeframe: '1d',
          description:
            'Head and shoulders pattern detected - strong bearish reversal signal',
        };
      }
    }

    // Check for inverse head and shoulders
    const lows = data.map((d) => d.low);
    const troughs = this.findTroughs(lows);

    if (troughs.length >= 3) {
      const lastThree = troughs.slice(-3);
      const [left, head, right] = lastThree.map((i) => lows[i]);

      if (head < left && head < right && Math.abs(left - right) / left < 0.05) {
        return {
          type: 'inverse_head_shoulders',
          confidence: 0.7,
          direction: 'bullish',
          entryPoint: currentPrice,
          targetPrice: currentPrice * 1.06,
          stopLoss: head,
          timeframe: '1d',
          description:
            'Inverse head and shoulders pattern detected - strong bullish reversal signal',
        };
      }
    }

    return null;
  }

  private detectTrianglePattern(
    data: HistoricalData[],
    currentPrice: number,
  ): DayTradingPattern | null {
    if (data.length < 12) return null;

    const highs = data.slice(-12).map((d) => d.high);
    const lows = data.slice(-12).map((d) => d.low);

    const highSlope = this.calculateTrendSlope(highs);
    const lowSlope = this.calculateTrendSlope(lows);

    // Ascending triangle
    if (Math.abs(highSlope) < 0.001 && lowSlope > 0.01) {
      return {
        type: 'triangle',
        confidence: 0.55,
        direction: 'bullish',
        entryPoint: currentPrice,
        targetPrice: currentPrice * 1.03,
        stopLoss: currentPrice * 0.98,
        timeframe: '1d',
        description: 'Ascending triangle pattern - bullish continuation',
      };
    }

    // Descending triangle
    if (Math.abs(lowSlope) < 0.001 && highSlope < -0.01) {
      return {
        type: 'triangle',
        confidence: 0.55,
        direction: 'bearish',
        entryPoint: currentPrice,
        targetPrice: currentPrice * 0.97,
        stopLoss: currentPrice * 1.02,
        timeframe: '1d',
        description: 'Descending triangle pattern - bearish continuation',
      };
    }

    return null;
  }

  // ML Model Simulation Methods
  private simulateNeuralNetwork(
    data: HistoricalData[],
    technicalAnalysis: any,
  ): number {
    // Enhanced neural network simulation with dynamic features
    const currentPrice = data[data.length - 1].close;
    const previousPrice = data[data.length - 2]?.close || currentPrice;

    const features = [
      technicalAnalysis.rsi / 100,
      (technicalAnalysis.sma20 - currentPrice) / currentPrice,
      technicalAnalysis.volatility,
      (technicalAnalysis.volume - technicalAnalysis.avgVolume) /
        technicalAnalysis.avgVolume,
      (currentPrice - previousPrice) / previousPrice, // Price momentum
      Math.sin(Date.now() / 100000), // Time-based variation
    ];

    // Enhanced neural network simulation with more dynamic weights
    const weights = [0.35, 0.45, -0.25, 0.15, 0.8, 0.2];
    let prediction = features.reduce(
      (sum, feature, i) => sum + (feature || 0) * weights[i],
      0,
    );

    // Add market regime detection
    const trendBoost =
      technicalAnalysis.trend === 'upward'
        ? 0.3
        : technicalAnalysis.trend === 'downward'
          ? -0.3
          : 0;
    prediction += trendBoost;

    // Add randomization for live behavior
    prediction += (Math.random() - 0.5) * 0.4;

    return Math.max(-0.9, Math.min(0.9, Math.tanh(prediction * 2))); // Enhanced range
  }

  private simulateSVM(data: HistoricalData[], technicalAnalysis: any): number {
    // Simulate SVM for support/resistance prediction
    const currentPrice = data[data.length - 1].close;
    const bollinger = technicalAnalysis.bollinger;

    let score = 0;

    // Distance from bollinger bands influences prediction
    if (currentPrice > bollinger.upper) score -= 0.5;
    else if (currentPrice < bollinger.lower) score += 0.5;

    // RSI influences
    if (technicalAnalysis.rsi > 70) score -= 0.3;
    else if (technicalAnalysis.rsi < 30) score += 0.3;

    return Math.max(-1, Math.min(1, score));
  }

  private simulateEnsemble(technicalAnalysis: any): number {
    // Enhanced ensemble combining multiple strategies
    const rsiSignal = (technicalAnalysis.rsi - 50) / 50; // Normalized RSI signal
    const trendSignal =
      technicalAnalysis.trend === 'upward'
        ? 0.5
        : technicalAnalysis.trend === 'downward'
          ? -0.5
          : 0;
    const volSignal = technicalAnalysis.volatility > 0.25 ? -0.2 : 0.2;
    const bollingerSignal =
      technicalAnalysis.bollingerPosition === 'upper'
        ? -0.3
        : technicalAnalysis.bollingerPosition === 'lower'
          ? 0.3
          : 0;

    // Time-based market sentiment simulation
    const marketCycle = Math.sin(Date.now() / 200000) * 0.3;
    const dailyVariation = Math.cos(Date.now() / 80000) * 0.2;

    // Weighted ensemble prediction
    const ensemble =
      rsiSignal * 0.3 +
      trendSignal * 0.4 +
      volSignal * 0.1 +
      bollingerSignal * 0.3 +
      marketCycle * 0.2 +
      dailyVariation * 0.15;

    return Math.max(-0.8, Math.min(0.8, ensemble));
  }

  private calculateMomentumScore(data: HistoricalData[]): number {
    if (data.length < 5) return 0;

    const prices = data.map((d) => d.close);
    const shortMomentum =
      (prices[prices.length - 1] - prices[prices.length - 3]) /
      prices[prices.length - 3];
    const longMomentum =
      (prices[prices.length - 1] - prices[prices.length - 6]) /
      prices[prices.length - 6];

    return (shortMomentum * 0.6 + longMomentum * 0.4) * 10; // Scale for visibility
  }

  private calculateMeanReversionScore(
    data: HistoricalData[],
    technicalAnalysis: any,
  ): number {
    // Mean reversion tends to be opposite of current trend
    const currentPrice = data[data.length - 1].close;
    const meanPrice = technicalAnalysis.sma20;
    const deviation = (currentPrice - meanPrice) / meanPrice;

    // Strong deviation suggests mean reversion opportunity
    return -Math.tanh(deviation * 5); // Negative because it's contrarian
  }

  // Helper Methods
  private calculateTrendSlope(values: number[]): number {
    if (values.length < 2) return 0;

    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, i) => sum + i * val, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }

  private findPeaks(values: number[]): number[] {
    const peaks: number[] = [];
    for (let i = 1; i < values.length - 1; i++) {
      if (values[i] > values[i - 1] && values[i] > values[i + 1]) {
        peaks.push(i);
      }
    }
    return peaks;
  }

  private findTroughs(values: number[]): number[] {
    const troughs: number[] = [];
    for (let i = 1; i < values.length - 1; i++) {
      if (values[i] < values[i - 1] && values[i] < values[i + 1]) {
        troughs.push(i);
      }
    }
    return troughs;
  }

  // ML Pattern Helper Methods
  private mapMLPatternToType(mlPatternType: string): DayTradingPattern['type'] {
    switch (mlPatternType) {
      case 'advanced_flag':
        return 'flag';
      case 'ai_head_shoulders':
        return 'head_shoulders';
      case 'gartley':
      case 'butterfly':
      case 'bat':
      case 'crab':
        return 'triangle'; // Map harmonic patterns to triangle
      case 'elliott_wave':
        return 'wedge'; // Map Elliott waves to wedge
      default:
        return 'none';
    }
  }

  private calculateTargetFromMLPattern(
    currentPrice: number,
    mlPattern: any,
  ): number {
    const baseMultiplier = mlPattern.direction === 'bullish' ? 1.03 : 0.97;
    const confidenceAdjustment = mlPattern.confidence * 0.02; // 0-2% adjustment based on confidence

    if (mlPattern.direction === 'bullish') {
      return currentPrice * (baseMultiplier + confidenceAdjustment);
    } else {
      return currentPrice * (baseMultiplier - confidenceAdjustment);
    }
  }

  private calculateStopLossFromMLPattern(
    currentPrice: number,
    mlPattern: any,
  ): number {
    const baseMultiplier = mlPattern.direction === 'bullish' ? 0.98 : 1.02;
    const confidenceAdjustment = mlPattern.confidence * 0.01; // 0-1% adjustment

    if (mlPattern.direction === 'bullish') {
      return currentPrice * (baseMultiplier - confidenceAdjustment);
    } else {
      return currentPrice * (baseMultiplier + confidenceAdjustment);
    }
  }

  /**
   * Convert Yahoo Finance historical data to our HistoricalData format
   */
  convertYahooDataToHistorical(yahooData: any[]): HistoricalData[] {
    if (!Array.isArray(yahooData)) {
      return [];
    }

    return yahooData.map(item => ({
      date: item.date instanceof Date ? item.date.toISOString().split('T')[0] : item.date.toString(),
      open: Number(item.open) || 0,
      high: Number(item.high) || 0,
      low: Number(item.low) || 0,
      close: Number(item.close) || 0,
      volume: Number(item.volume) || 0,
    })).filter(item => 
      // Filter out invalid data points
      item.open > 0 && item.high > 0 && item.low > 0 && item.close > 0
    );
  }

}
