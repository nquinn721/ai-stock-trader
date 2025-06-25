import { Injectable, Logger } from '@nestjs/common';
import { TechnicalIndicators, FundamentalMetrics } from '../entities/scanner.entity';

export interface PriceData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PatternResult {
  name: string;
  confidence: number;
  description: string;
  signals: string[];
}

@Injectable()
export class TechnicalIndicatorService {
  private readonly logger = new Logger(TechnicalIndicatorService.name);

  /**
   * Calculate all technical indicators for a stock
   */
  async calculateIndicators(symbol: string, priceData: PriceData[]): Promise<TechnicalIndicators> {
    try {
      if (!priceData || priceData.length < 20) {
        this.logger.warn(`Insufficient data for ${symbol}: ${priceData?.length || 0} points`);
        return {};
      }

      const closePrices = priceData.map(d => d.close);
      const volumes = priceData.map(d => d.volume);

      return {
        rsi: this.calculateRSI(closePrices),
        macd: this.calculateMACD(closePrices),
        bollingerBands: this.calculateBollingerBands(closePrices),
        movingAverages: this.calculateMovingAverages(closePrices),
        volume: this.calculateVolumeIndicators(volumes),
        patterns: this.detectPatterns(priceData),
      };
    } catch (error) {
      this.logger.error(`Error calculating indicators for ${symbol}:`, error);
      return {};
    }
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  private calculateRSI(prices: number[], period: number = 14): number | undefined {
    if (prices.length < period + 1) return undefined;

    const gains: number[] = [];
    const losses: number[] = [];

    // Calculate gains and losses
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    // Calculate average gains and losses
    const avgGain = gains.slice(-period).reduce((sum, gain) => sum + gain, 0) / period;
    const avgLoss = losses.slice(-period).reduce((sum, loss) => sum + loss, 0) / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));

    return Math.round(rsi * 100) / 100;
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  private calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } | undefined {
    if (prices.length < 34) return undefined;

    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    
    if (!ema12 || !ema26) return undefined;

    const macd = ema12 - ema26;
    
    // Calculate MACD signal line (9-day EMA of MACD)
    const macdLine = prices.slice(-9).map((_, i) => {
      const idx = prices.length - 9 + i;
      if (idx < 26) return 0;
      const ema12Val = this.calculateEMA(prices.slice(0, idx + 1), 12);
      const ema26Val = this.calculateEMA(prices.slice(0, idx + 1), 26);
      if (!ema12Val || !ema26Val) return 0;
      return ema12Val - ema26Val;
    });

    const signal = this.calculateEMA(macdLine, 9) || 0;
    const histogram = macd - signal;

    return {
      macd: Math.round(macd * 10000) / 10000,
      signal: Math.round(signal * 10000) / 10000,
      histogram: Math.round(histogram * 10000) / 10000,
    };
  }

  /**
   * Calculate Bollinger Bands
   */
  private calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): {
    upper: number;
    middle: number;
    lower: number;
    position: number;
  } | undefined {
    if (prices.length < period) return undefined;

    const recentPrices = prices.slice(-period);
    const sma = recentPrices.reduce((sum, price) => sum + price, 0) / period;
    
    // Calculate standard deviation
    const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);

    const upper = sma + (stdDev * standardDeviation);
    const lower = sma - (stdDev * standardDeviation);
    const currentPrice = prices[prices.length - 1];
    
    // Calculate position within bands (0 = lower band, 1 = upper band)
    const position = (currentPrice - lower) / (upper - lower);

    return {
      upper: Math.round(upper * 100) / 100,
      middle: Math.round(sma * 100) / 100,
      lower: Math.round(lower * 100) / 100,
      position: Math.round(position * 1000) / 1000,
    };
  }

  /**
   * Calculate Moving Averages
   */
  private calculateMovingAverages(prices: number[]): {
    sma20?: number;
    sma50?: number;
    sma200?: number;
    ema20?: number;
    ema50?: number;
  } {
    return {
      sma20: this.calculateSMA(prices, 20),
      sma50: this.calculateSMA(prices, 50),
      sma200: this.calculateSMA(prices, 200),
      ema20: this.calculateEMA(prices, 20),
      ema50: this.calculateEMA(prices, 50),
    };
  }

  /**
   * Calculate Simple Moving Average
   */
  private calculateSMA(prices: number[], period: number): number | undefined {
    if (prices.length < period) return undefined;
    
    const recentPrices = prices.slice(-period);
    const sum = recentPrices.reduce((total, price) => total + price, 0);
    return Math.round((sum / period) * 100) / 100;
  }

  /**
   * Calculate Exponential Moving Average
   */
  private calculateEMA(prices: number[], period: number): number | undefined {
    if (prices.length < period) return undefined;

    const multiplier = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
    }

    return Math.round(ema * 100) / 100;
  }

  /**
   * Calculate Volume Indicators
   */
  private calculateVolumeIndicators(volumes: number[]): { average: number; ratio: number } | undefined {
    if (volumes.length < 20) return undefined;

    const recent20 = volumes.slice(-20);
    const average = recent20.reduce((sum, vol) => sum + vol, 0) / 20;
    const currentVolume = volumes[volumes.length - 1];
    const ratio = currentVolume / average;

    return {
      average: Math.round(average),
      ratio: Math.round(ratio * 100) / 100,
    };
  }

  /**
   * Detect Chart Patterns
   */
  private detectPatterns(priceData: PriceData[]): string[] {
    const patterns: string[] = [];

    if (priceData.length < 20) return patterns;

    const recent = priceData.slice(-20);
    const prices = recent.map(d => d.close);

    // Simple pattern detection
    const currentPrice = prices[prices.length - 1];
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = this.calculateSMA(prices.slice(-50), 50);

    // Breakout patterns
    if (sma20 && currentPrice > sma20 * 1.02) {
      patterns.push('Bullish Breakout');
    }
    if (sma20 && currentPrice < sma20 * 0.98) {
      patterns.push('Bearish Breakdown');
    }

    // Moving average crossovers
    if (sma20 && sma50) {
      if (sma20 > sma50 * 1.001) {
        patterns.push('Golden Cross');
      }
      if (sma20 < sma50 * 0.999) {
        patterns.push('Death Cross');
      }
    }

    // Gap detection
    if (recent.length >= 2) {
      const yesterdayClose = recent[recent.length - 2].close;
      const todayOpen = recent[recent.length - 1].open;
      const gapPercent = ((todayOpen - yesterdayClose) / yesterdayClose) * 100;

      if (gapPercent > 2) {
        patterns.push('Gap Up');
      }
      if (gapPercent < -2) {
        patterns.push('Gap Down');
      }
    }

    // Volume patterns
    const volumes = recent.map(d => d.volume);
    const volumeIndicators = this.calculateVolumeIndicators(volumes);
    if (volumeIndicators && volumeIndicators.ratio > 2) {
      patterns.push('High Volume');
    }

    return patterns;
  }

  /**
   * Calculate fundamental metrics (placeholder for now - would integrate with financial data API)
   */
  async calculateFundamentals(symbol: string): Promise<FundamentalMetrics> {
    // This would typically fetch from a financial data API
    // For now, return empty object or default values
    try {
      // TODO: Integrate with financial data provider (Alpha Vantage, Financial Modeling Prep, etc.)
      return {
        peRatio: undefined,
        eps: undefined,
        dividend: undefined,
        dividendYield: undefined,
        bookValue: undefined,
        priceToBook: undefined,
        debtToEquity: undefined,
        roe: undefined,
        roa: undefined,
        grossMargin: undefined,
        netMargin: undefined,
        revenueGrowth: undefined,
        epsGrowth: undefined,
      };
    } catch (error) {
      this.logger.error(`Error calculating fundamentals for ${symbol}:`, error);
      return {};
    }
  }

  /**
   * Evaluate if a stock matches specific technical criteria
   */
  evaluateTechnicalCriteria(indicators: TechnicalIndicators, field: string, operator: string, value: number): boolean {
    try {
      let actualValue: number | undefined;

      // Extract the actual value based on field
      switch (field) {
        case 'rsi':
          actualValue = indicators.rsi;
          break;
        case 'macd.macd':
          actualValue = indicators.macd?.macd;
          break;
        case 'macd.signal':
          actualValue = indicators.macd?.signal;
          break;
        case 'macd.histogram':
          actualValue = indicators.macd?.histogram;
          break;
        case 'bb.position':
          actualValue = indicators.bollingerBands?.position;
          break;
        case 'sma20':
          actualValue = indicators.movingAverages?.sma20;
          break;
        case 'sma50':
          actualValue = indicators.movingAverages?.sma50;
          break;
        case 'sma200':
          actualValue = indicators.movingAverages?.sma200;
          break;
        case 'ema20':
          actualValue = indicators.movingAverages?.ema20;
          break;
        case 'ema50':
          actualValue = indicators.movingAverages?.ema50;
          break;
        case 'volume.ratio':
          actualValue = indicators.volume?.ratio;
          break;
        default:
          return false;
      }

      if (actualValue === null || actualValue === undefined) {
        return false;
      }

      // Apply operator
      switch (operator) {
        case 'gt':
          return actualValue > value;
        case 'lt':
          return actualValue < value;
        case 'eq':
          return Math.abs(actualValue - value) < 0.01;
        case 'above':
          return actualValue > value;
        case 'below':
          return actualValue < value;
        default:
          return false;
      }
    } catch (error) {
      this.logger.error(`Error evaluating technical criteria: ${field} ${operator} ${value}`, error);
      return false;
    }
  }
}
