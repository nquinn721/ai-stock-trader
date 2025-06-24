import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsService } from '../../news/news.service';
import { MLModel, MLPrediction } from '../entities/ml.entities';
import { SentimentScore } from '../interfaces/ml.interfaces';
import { SentimentAnalysisService } from './sentiment-analysis.service';

export interface SentimentAlert {
  id: string;
  symbol: string;
  alertType:
    | 'EXTREME_POSITIVE'
    | 'EXTREME_NEGATIVE'
    | 'VOLATILITY_SPIKE'
    | 'TREND_REVERSAL';
  sentiment: SentimentScore;
  threshold: number;
  triggered: Date;
  acknowledged: boolean;
}

export interface SentimentTradingSignal {
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  strength: number; // 0-1
  confidence: number; // 0-1
  reasoning: string[];
  sentimentScore: SentimentScore;
  riskAdjustment: number;
  timestamp: Date;
}

/**
 * S28A: Real-time Sentiment Monitoring Service
 * Provides continuous sentiment tracking and trading signal integration
 */
@Injectable()
export class SentimentMonitoringService {
  private readonly logger = new Logger(SentimentMonitoringService.name);
  private sentimentHistory = new Map<string, SentimentScore[]>();
  private activeAlerts = new Map<string, SentimentAlert[]>();
  private tradingSignals = new Map<string, SentimentTradingSignal>();

  constructor(
    @InjectRepository(MLModel)
    private mlModelRepository: Repository<MLModel>,
    @InjectRepository(MLPrediction)
    private mlPredictionRepository: Repository<MLPrediction>,
    private sentimentAnalysisService: SentimentAnalysisService,
    private newsService: NewsService,
  ) {
    this.logger.log('🎯 S28A Sentiment Monitoring Service initialized');
  }

  /**
   * Real-time sentiment monitoring - runs every 5 minutes
   */
  @Cron('*/5 * * * *') // Every 5 minutes
  async monitorSentimentRealTime(): Promise<void> {
    this.logger.log('🔍 Starting real-time sentiment monitoring cycle');

    try {
      // Get list of actively traded symbols
      const activeSymbols = await this.getActiveSymbols();

      for (const symbol of activeSymbols) {
        await this.processSentimentForSymbol(symbol);
      }

      this.logger.log(
        `✅ Completed sentiment monitoring for ${activeSymbols.length} symbols`,
      );
    } catch (error) {
      this.logger.error('❌ Error in real-time sentiment monitoring:', error);
    }
  }

  /**
   * Process sentiment analysis for a specific symbol
   */
  private async processSentimentForSymbol(symbol: string): Promise<void> {
    try {
      // Fetch latest news data
      const newsData = await this.newsService.fetchNewsForStock(symbol);

      if (newsData.length === 0) {
        this.logger.debug(`⚠️ No news data available for ${symbol}`);
        return;
      }

      // Perform advanced sentiment analysis
      const sentimentScore =
        await this.sentimentAnalysisService.analyzeSentimentAdvanced(
          symbol,
          newsData,
          undefined, // Social media data (would integrate with Twitter/Reddit APIs)
          undefined, // Analyst reports (would integrate with financial data providers)
        );

      // Store sentiment history
      this.updateSentimentHistory(symbol, sentimentScore);

      // Check for alerts
      await this.checkSentimentAlerts(symbol, sentimentScore);

      // Generate trading signals
      await this.generateTradingSignals(symbol, sentimentScore);

      this.logger.debug(
        `📊 Processed sentiment for ${symbol}: ${sentimentScore.overallSentiment.toFixed(3)}`,
      );
    } catch (error) {
      this.logger.error(`❌ Error processing sentiment for ${symbol}:`, error);
    }
  }

  /**
   * Update sentiment history for trend analysis
   */
  private updateSentimentHistory(
    symbol: string,
    sentiment: SentimentScore,
  ): void {
    if (!this.sentimentHistory.has(symbol)) {
      this.sentimentHistory.set(symbol, []);
    }

    const history = this.sentimentHistory.get(symbol)!;
    history.unshift(sentiment);

    // Keep only last 100 sentiment readings
    if (history.length > 100) {
      history.splice(100);
    }
  }

  /**
   * Check for sentiment-based alerts
   */
  private async checkSentimentAlerts(
    symbol: string,
    sentiment: SentimentScore,
  ): Promise<void> {
    const alerts: SentimentAlert[] = [];

    // Extreme sentiment alerts
    if (
      Math.abs(sentiment.overallSentiment) > 0.8 &&
      sentiment.confidence > 0.7
    ) {
      alerts.push({
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        symbol,
        alertType:
          sentiment.overallSentiment > 0
            ? 'EXTREME_POSITIVE'
            : 'EXTREME_NEGATIVE',
        sentiment,
        threshold: 0.8,
        triggered: new Date(),
        acknowledged: false,
      });
    } // Volatility spike alerts
    if ((sentiment.volatilityPrediction || 0) > 0.7) {
      alerts.push({
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        symbol,
        alertType: 'VOLATILITY_SPIKE',
        sentiment,
        threshold: 0.7,
        triggered: new Date(),
        acknowledged: false,
      });
    }

    // Trend reversal alerts
    const history = this.sentimentHistory.get(symbol) || [];
    if (history.length >= 3) {
      const isReversal = this.detectTrendReversal(history);
      if (isReversal) {
        alerts.push({
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          symbol,
          alertType: 'TREND_REVERSAL',
          sentiment,
          threshold: 0.5,
          triggered: new Date(),
          acknowledged: false,
        });
      }
    }

    // Store alerts
    if (alerts.length > 0) {
      this.activeAlerts.set(symbol, [
        ...(this.activeAlerts.get(symbol) || []),
        ...alerts,
      ]);
      this.logger.log(
        `🚨 Generated ${alerts.length} sentiment alerts for ${symbol}`,
      );
    }
  }

  /**
   * Generate trading signals based on sentiment analysis
   */
  private async generateTradingSignals(
    symbol: string,
    sentiment: SentimentScore,
  ): Promise<void> {
    const history = this.sentimentHistory.get(symbol) || [];

    // Calculate signal strength and direction
    const signalData = this.calculateTradingSignal(sentiment, history);

    if (signalData.strength > 0.3) {
      // Only generate signals above threshold
      const tradingSignal: SentimentTradingSignal = {
        symbol,
        signal: signalData.signal,
        strength: signalData.strength,
        confidence: sentiment.confidence,
        reasoning: signalData.reasoning,
        sentimentScore: sentiment,
        riskAdjustment: this.calculateRiskAdjustment(sentiment, history),
        timestamp: new Date(),
      };

      this.tradingSignals.set(symbol, tradingSignal);
      this.logger.log(
        `📈 Generated ${signalData.signal} signal for ${symbol} (strength: ${signalData.strength.toFixed(2)})`,
      );
    }
  }

  /**
   * Calculate trading signal from sentiment data
   */
  private calculateTradingSignal(
    sentiment: SentimentScore,
    history: SentimentScore[],
  ): {
    signal: 'BUY' | 'SELL' | 'HOLD';
    strength: number;
    reasoning: string[];
  } {
    const reasoning: string[] = [];
    let signalScore = 0;

    // Current sentiment weight (40%)
    const sentimentWeight =
      Math.abs(sentiment.overallSentiment) * sentiment.confidence * 0.4;
    signalScore +=
      sentiment.overallSentiment > 0 ? sentimentWeight : -sentimentWeight;

    if (Math.abs(sentiment.overallSentiment) > 0.6) {
      reasoning.push(
        `Strong ${sentiment.overallSentiment > 0 ? 'positive' : 'negative'} sentiment (${sentiment.overallSentiment.toFixed(2)})`,
      );
    }

    // Sentiment momentum (30%)
    if (history.length >= 3) {
      const momentum = this.calculateMomentum(history.slice(0, 3));
      const momentumWeight = Math.abs(momentum) * 0.3;
      signalScore += momentum > 0 ? momentumWeight : -momentumWeight;

      if (Math.abs(momentum) > 0.2) {
        reasoning.push(
          `${momentum > 0 ? 'Improving' : 'Deteriorating'} sentiment momentum`,
        );
      }
    }

    // Impact score weight (20%)
    const impactWeight = sentiment.impactScore * 0.2;
    signalScore +=
      sentiment.overallSentiment > 0 ? impactWeight : -impactWeight;

    if (sentiment.impactScore > 0.6) {
      reasoning.push(
        `High market impact potential (${sentiment.impactScore.toFixed(2)})`,
      );
    }

    // Entity-specific sentiment (10%)
    const entityScore = this.calculateEntityScore(sentiment.topics);
    signalScore += entityScore * 0.1;

    if (Math.abs(entityScore) > 0.5) {
      reasoning.push(`Strong entity-specific sentiment indicators`);
    }

    // Determine signal
    const strength = Math.abs(signalScore);
    let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';

    if (signalScore > 0.3) {
      signal = 'BUY';
    } else if (signalScore < -0.3) {
      signal = 'SELL';
    }

    return { signal, strength, reasoning };
  }

  /**
   * Calculate risk adjustment based on sentiment volatility
   */
  private calculateRiskAdjustment(
    sentiment: SentimentScore,
    history: SentimentScore[],
  ): number {
    let riskFactor = 1.0;

    // Volatility adjustment
    if (
      sentiment.volatilityPrediction !== null &&
      sentiment.volatilityPrediction !== undefined
    ) {
      riskFactor *= 1 + sentiment.volatilityPrediction;
    }

    // Confidence adjustment
    riskFactor *= 2 - sentiment.confidence;

    // Historical volatility
    if (history.length >= 5) {
      const volatility = this.calculateHistoricalVolatility(
        history.slice(0, 5),
      );
      riskFactor *= 1 + volatility;
    }

    return Math.min(3.0, riskFactor); // Cap at 3x risk adjustment
  }

  /**
   * Public API Methods
   */

  /**
   * Get current sentiment score for a symbol
   */
  async getCurrentSentiment(symbol: string): Promise<SentimentScore | null> {
    const history = this.sentimentHistory.get(symbol.toUpperCase());
    return history && history.length > 0 ? history[0] : null;
  }

  /**
   * Get sentiment history for a symbol
   */
  async getSentimentHistory(
    symbol: string,
    limit: number = 50,
  ): Promise<SentimentScore[]> {
    const history = this.sentimentHistory.get(symbol.toUpperCase()) || [];
    return history.slice(0, limit);
  }

  /**
   * Get active sentiment alerts
   */
  async getActiveAlerts(symbol?: string): Promise<SentimentAlert[]> {
    if (symbol) {
      return this.activeAlerts.get(symbol.toUpperCase()) || [];
    }

    const allAlerts: SentimentAlert[] = [];
    for (const alerts of this.activeAlerts.values()) {
      allAlerts.push(...alerts.filter((alert) => !alert.acknowledged));
    }

    return allAlerts.sort(
      (a, b) => b.triggered.getTime() - a.triggered.getTime(),
    );
  }

  /**
   * Get current trading signals
   */
  async getTradingSignals(symbol?: string): Promise<SentimentTradingSignal[]> {
    if (symbol) {
      const signal = this.tradingSignals.get(symbol.toUpperCase());
      return signal ? [signal] : [];
    }

    return Array.from(this.tradingSignals.values()).sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string): Promise<boolean> {
    for (const [symbol, alerts] of this.activeAlerts.entries()) {
      const alert = alerts.find((a) => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
        this.logger.log(`✅ Acknowledged alert ${alertId} for ${symbol}`);
        return true;
      }
    }
    return false;
  }

  /**
   * Helper Methods
   */

  private async getActiveSymbols(): Promise<string[]> {
    // In a real implementation, this would query the database for actively traded symbols
    // For now, return a list of popular symbols
    return [
      'AAPL',
      'GOOGL',
      'MSFT',
      'AMZN',
      'TSLA',
      'META',
      'NVDA',
      'NFLX',
      'CRM',
      'UBER',
    ];
  }

  private detectTrendReversal(history: SentimentScore[]): boolean {
    if (history.length < 3) return false;

    const recent = history[0].overallSentiment;
    const previous = history[1].overallSentiment;
    const older = history[2].overallSentiment;

    // Detect significant sentiment direction change
    const wasIncreasing = previous > older;
    const nowDecreasing = recent < previous;
    const wasDecreasing = previous < older;
    const nowIncreasing = recent > previous;

    const changeThreshold = 0.3;
    const significantChange = Math.abs(recent - previous) > changeThreshold;

    return (
      significantChange &&
      ((wasIncreasing && nowDecreasing) || (wasDecreasing && nowIncreasing))
    );
  }

  private calculateMomentum(recentHistory: SentimentScore[]): number {
    if (recentHistory.length < 2) return 0;

    const changes = recentHistory
      .slice(0, -1)
      .map(
        (current, i) =>
          current.overallSentiment - recentHistory[i + 1].overallSentiment,
      );

    return changes.reduce((sum, change) => sum + change, 0) / changes.length;
  }

  private calculateEntityScore(topics: any): number {
    const weights = {
      earnings: 0.3,
      analyst: 0.25,
      product: 0.2,
      regulatory: 0.15,
      market: 0.1,
    };

    return Object.entries(topics).reduce((score, [topic, value]) => {
      const weight = weights[topic as keyof typeof weights] || 0;
      return score + (value as number) * weight;
    }, 0);
  }

  private calculateHistoricalVolatility(history: SentimentScore[]): number {
    if (history.length < 2) return 0;

    const sentiments = history.map((h) => h.overallSentiment);
    const mean = sentiments.reduce((sum, s) => sum + s, 0) / sentiments.length;
    const variance =
      sentiments.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) /
      sentiments.length;

    return Math.sqrt(variance);
  }
}
