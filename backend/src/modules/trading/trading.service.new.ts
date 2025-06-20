import { Injectable } from '@nestjs/common';
import { SignalType } from '../../entities/trading-signal.entity';
import { NewsService } from '../news/news.service';

@Injectable()
export class TradingService {
  constructor(private newsService: NewsService) {}

  async detectBreakout(symbol: string): Promise<{
    isBreakout: boolean;
    signal: SignalType;
    confidence: number;
    reason: string;
  }> {
    // Mock breakout detection - simplified implementation
    const now = Date.now();
    const randomFactor = Math.sin(now / 120000); // 2-minute cycles
    const confidenceBase = 0.5 + Math.abs(randomFactor) * 0.4;

    let signal: SignalType;
    let isBreakout = false;
    let reason = '';

    if (randomFactor > 0.3) {
      signal = SignalType.BUY;
      isBreakout = true;
      reason = `Upward breakout detected for ${symbol}`;
    } else if (randomFactor < -0.3) {
      signal = SignalType.SELL;
      isBreakout = true;
      reason = `Downward breakout detected for ${symbol}`;
    } else {
      signal = SignalType.HOLD;
      reason = `No significant breakout pattern for ${symbol}`;
    }

    return {
      isBreakout,
      signal,
      confidence: confidenceBase,
      reason,
    };
  }

  /**
   * Generate mock trading signal
   */
  async generateTradingSignal(symbol: string): Promise<any> {
    const breakoutResult = await this.detectBreakout(symbol);
    const sentiment = await this.newsService.getAverageSentiment(symbol);

    // Combine technical analysis with sentiment
    let adjustedConfidence = breakoutResult.confidence;
    if (sentiment > 2 && breakoutResult.signal === SignalType.BUY) {
      adjustedConfidence = Math.min(0.95, adjustedConfidence + 0.2);
    } else if (sentiment < -2 && breakoutResult.signal === SignalType.SELL) {
      adjustedConfidence = Math.min(0.95, adjustedConfidence + 0.2);
    }

    return {
      symbol,
      signal: breakoutResult.signal,
      confidence: adjustedConfidence,
      reason: `${breakoutResult.reason}. Sentiment score: ${sentiment.toFixed(2)}`,
      isBreakout: breakoutResult.isBreakout,
      sentimentScore: sentiment,
      timestamp: new Date(),
    };
  }
  /**
   * Get recent trading signals for a symbol (mock implementation)
   */
  async getRecentSignals(symbol: string, limit: number = 10): Promise<any[]> {
    const signals: any[] = [];
    const now = Date.now();

    for (let i = 0; i < limit; i++) {
      const timestamp = new Date(now - i * 2 * 60 * 60 * 1000); // Every 2 hours
      const mockSignal = await this.generateTradingSignal(symbol);

      signals.push({
        ...mockSignal,
        timestamp,
        id: `${symbol}-${timestamp.getTime()}`,
      });
    }

    return signals;
  }

  /**
   * Validate trading signal accuracy (mock implementation)
   */
  async validateSignalAccuracy(symbol: string): Promise<{
    accuracy: number;
    totalSignals: number;
    correctPredictions: number;
  }> {
    // Mock validation results
    const totalSignals = 50 + Math.floor(Math.random() * 50);
    const accuracy = 0.6 + Math.random() * 0.3; // 60-90% accuracy
    const correctPredictions = Math.floor(totalSignals * accuracy);

    return {
      accuracy,
      totalSignals,
      correctPredictions,
    };
  }
}
