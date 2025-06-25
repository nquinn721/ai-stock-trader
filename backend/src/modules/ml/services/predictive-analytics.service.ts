import { Injectable, Logger } from '@nestjs/common';
import { Observable, interval } from 'rxjs';
import { distinctUntilChanged, switchMap } from 'rxjs/operators';
import {
  MarketRegime,
  MultiTimeframePrediction,
  PredictionData,
  PredictionUpdate,
  RiskMetrics,
  SentimentData,
} from '../interfaces/predictive-analytics.interfaces';
import { TechnicalFeatures } from '../interfaces/ml.interfaces';
import { EnsembleSystemsService } from './ensemble-systems.service';
import { FeatureEngineeringService } from './feature-engineering.service';
import { MarketPredictionService } from './market-prediction.service';
import { PatternRecognitionService } from './pattern-recognition.service';
import { SentimentAnalysisService } from './sentiment-analysis.service';

/**
 * S39: Real-Time Predictive Analytics Service
 *
 * Provides comprehensive real-time ML predictions with multi-timeframe analysis,
 * sentiment integration, market regime detection, and risk analytics.
 *
 * Core Features:
 * - Multi-timeframe predictions (1H, 4H, 1D)
 * - Real-time sentiment analysis integration
 * - Market regime detection and transitions
 * - Confidence intervals and risk metrics
 * - Streaming prediction updates
 */
@Injectable()
export class PredictiveAnalyticsService {
  private readonly logger = new Logger(PredictiveAnalyticsService.name);
  private predictionCache = new Map<string, PredictionData>();
  private lastUpdateTime = new Map<string, Date>();

  constructor(
    private marketPredictionService: MarketPredictionService,
    private sentimentAnalysisService: SentimentAnalysisService,
    private patternRecognitionService: PatternRecognitionService,
    private ensembleSystemsService: EnsembleSystemsService,
    private featureEngineeringService: FeatureEngineeringService,
  ) {}

  /**
   * Get comprehensive real-time predictions for a symbol
   */
  async getRealTimePredictions(symbol: string): Promise<PredictionData> {
    try {
      this.logger.log(`Getting real-time predictions for ${symbol}`);

      // Check cache first (refresh every 30 seconds)
      const cached = this.predictionCache.get(symbol);
      const lastUpdate = this.lastUpdateTime.get(symbol);
      const now = new Date();

      if (
        cached &&
        lastUpdate &&
        now.getTime() - lastUpdate.getTime() < 30000
      ) {
        return cached;
      }

      // Generate fresh predictions
      const [predictions, sentiment, regime, riskMetrics] = await Promise.all([
        this.getMultiTimeframePredictions(symbol),
        this.getLiveSentiment(symbol),
        this.getCurrentRegime(symbol),
        this.calculateRiskMetrics(symbol),
      ]);

      const predictionData: PredictionData = {
        symbol,
        timestamp: now,
        predictions,
        sentiment,
        regime,
        riskMetrics,
        confidence: this.calculateOverallConfidence(
          predictions,
          sentiment,
          regime,
        ),
      };

      // Update cache
      this.predictionCache.set(symbol, predictionData);
      this.lastUpdateTime.set(symbol, now);

      return predictionData;
    } catch (error) {
      this.logger.error(`Error getting predictions for ${symbol}:`, error);
      return this.createFallbackPrediction(symbol);
    }
  }

  /**
   * Get technical features for a symbol using feature engineering service
   */
  private async getTechnicalFeatures(symbol: string): Promise<TechnicalFeatures> {
    try {
      // Use feature engineering service to get technical features
      return await this.featureEngineeringService.generateFeatures(symbol, {
        technicalIndicators: true,
        marketFeatures: true,
        sentimentFeatures: false,
      });
    } catch (error) {
      this.logger.error(`Error getting technical features for ${symbol}:`, error);
      // Return fallback features
      return {
        sma20: 0,
        sma50: 0,
        rsi: 50,
        macd: 0,
        volumeRatio: 1,
        priceChange: 0,
        momentum: 0,
        volatility: 0.2,
        timestamp: new Date(),
      } as TechnicalFeatures;
    }
  }

  /**
   * Stream real-time prediction updates
   */
  streamPredictions(symbol: string): Observable<PredictionUpdate> {
    return interval(30000).pipe(
      // Update every 30 seconds
      switchMap(() => this.getRealTimePredictions(symbol)),
      distinctUntilChanged((prev, curr) =>
        this.arePredictionsEqual(prev, curr),
      ),
      switchMap(async (prediction) => ({
        type: 'prediction-update' as const,
        symbol,
        timestamp: new Date(),
        data: prediction,
        changeDetected: await this.detectSignificantChanges(symbol, prediction),
      })),
    );
  }

  /**
   * Get multi-timeframe predictions (1H, 4H, 1D)
   */
  private async getMultiTimeframePredictions(
    symbol: string,
  ): Promise<MultiTimeframePrediction> {
    try {
      // Get technical features first (required for prediction services)
      const technicalFeatures = await this.getTechnicalFeatures(symbol);

      // Get predictions from market prediction service for different timeframes
      const [oneHourData, fourHourData, oneDayData] = await Promise.all([
        this.marketPredictionService.predictMarket(symbol, technicalFeatures, [
          '1h',
        ]),
        this.marketPredictionService.predictMarket(symbol, technicalFeatures, [
          '4h',
        ]),
        this.marketPredictionService.predictMarket(symbol, technicalFeatures, [
          '1d',
        ]),
      ]);

      return {
        oneHour: this.formatPrediction(oneHourData.horizonPredictions[0], '1H'),
        fourHour: this.formatPrediction(
          fourHourData.horizonPredictions[0],
          '4H',
        ),
        oneDay: this.formatPrediction(oneDayData.horizonPredictions[0], '1D'),
      };
    } catch (error) {
      this.logger.error(
        `Error getting multi-timeframe predictions for ${symbol}:`,
        error,
      );
      return this.createFallbackMultiTimeframePrediction();
    }
  }

  /**
   * Get live sentiment analysis
   */
  private async getLiveSentiment(symbol: string): Promise<SentimentData> {
    try {
      // This would integrate with real news/social APIs in production
      const sentimentScore =
        await this.sentimentAnalysisService.analyzeSentimentAdvanced(
          symbol,
          [], // News data would come from news service
          [], // Social media data
          [], // Analyst reports
        );

      return {
        score: sentimentScore.overallSentiment || 0,
        confidence: sentimentScore.confidence || 0.5,
        sources: {
          news: sentimentScore.topics?.earnings || 0,
          social: sentimentScore.topics?.market || 0,
          analyst: sentimentScore.topics?.analyst || 0,
        },
        recentEvents: [], // Would be populated with actual events
        trending: this.calculateSentimentTrend(symbol),
        lastUpdated: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error getting sentiment for ${symbol}:`, error);
      return this.createFallbackSentiment();
    }
  }

  /**
   * Detect current market regime (bull/bear/sideways)
   */
  private async getCurrentRegime(symbol: string): Promise<MarketRegime> {
    try {
      // Use pattern recognition service to detect market regime
      const patterns = await this.patternRecognitionService.recognizePatterns(
        symbol,
        [], // Historical data would be passed here
        ['1d'],
        ['all']
      );

      // Analyze recent price action for regime detection
      const regimeIndicators = await this.analyzeRegimeIndicators(symbol);

      return {
        current: this.determineRegime(patterns, regimeIndicators),
        confidence: regimeIndicators.confidence,
        duration: regimeIndicators.duration,
        strength: regimeIndicators.strength,
        nextTransition: regimeIndicators.nextTransition,
        historicalRegimes: [], // Would include recent regime history
      };
    } catch (error) {
      this.logger.error(`Error determining regime for ${symbol}:`, error);
      return this.createFallbackRegime();
    }
  }

  /**
   * Calculate risk metrics and probabilities
   */
  private async calculateRiskMetrics(symbol: string): Promise<RiskMetrics> {
    try {
      // Get ensemble prediction for risk analysis
      const ensemblePrediction =
        await this.ensembleSystemsService.generateEnsemblePrediction(
          symbol,
          {
            portfolioContext: {},
          },
          {
            marketPredictionService: this.marketPredictionService,
            sentimentAnalysisService: this.sentimentAnalysisService,
            patternRecognitionService: this.patternRecognitionService,
          },
          {
            includeUncertainty: true,
            riskAnalysis: true,
          }
        );

      return {
        volatilityPrediction: ensemblePrediction.volatility || 0.2,
        confidenceBands: {
          upper: ensemblePrediction.confidenceInterval?.upper || 0,
          lower: ensemblePrediction.confidenceInterval?.lower || 0,
        },
        drawdownProbability: ensemblePrediction.drawdownRisk || 0.1,
        supportResistance: {
          support: ensemblePrediction.supportLevel || 0,
          resistance: ensemblePrediction.resistanceLevel || 0,
          confidence: ensemblePrediction.confidence || 0.5,
        },
        positionSizing: this.calculateOptimalPositionSize(ensemblePrediction),
        riskScore: this.calculateRiskScore(ensemblePrediction),
      };
    } catch (error) {
      this.logger.error(`Error calculating risk metrics for ${symbol}:`, error);
      return this.createFallbackRiskMetrics();
    }
  }

  /**
   * Format prediction data for consistency
   */
  private formatPrediction(predictionData: any, timeframe: string) {
    return {
      direction: this.determineDirection(predictionData.prediction),
      targetPrice: predictionData.targetPrice || 0,
      confidence: predictionData.confidence || 0.5,
      probability: predictionData.probability || 0.5,
      timeHorizon: this.calculateTimeHorizon(timeframe),
      changePercent: predictionData.changePercent || 0,
    };
  }

  /**
   * Determine price direction from prediction
   */
  private determineDirection(
    prediction: number,
  ): 'bullish' | 'bearish' | 'neutral' {
    if (prediction > 0.6) return 'bullish';
    if (prediction < 0.4) return 'bearish';
    return 'neutral';
  }

  /**
   * Calculate time horizon for prediction
   */
  private calculateTimeHorizon(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case '1H':
        return new Date(now.getTime() + 60 * 60 * 1000);
      case '4H':
        return new Date(now.getTime() + 4 * 60 * 60 * 1000);
      case '1D':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 60 * 60 * 1000);
    }
  }

  /**
   * Calculate overall confidence across all predictions
   */
  private calculateOverallConfidence(
    predictions: MultiTimeframePrediction,
    sentiment: SentimentData,
    regime: MarketRegime,
  ): number {
    const predictionConfidence =
      (predictions.oneHour.confidence +
        predictions.fourHour.confidence +
        predictions.oneDay.confidence) /
      3;

    const sentimentWeight = Math.abs(sentiment.score) * sentiment.confidence;
    const regimeWeight = regime.confidence * regime.strength;

    return Math.min(
      0.95,
      predictionConfidence + sentimentWeight * 0.2 + regimeWeight * 0.2,
    );
  }

  /**
   * Check if predictions are significantly different
   */
  private arePredictionsEqual(
    prev: PredictionData,
    curr: PredictionData,
  ): boolean {
    if (!prev || !curr) return false;

    const threshold = 0.05; // 5% change threshold

    return (
      Math.abs(
        prev.predictions.oneHour.targetPrice -
          curr.predictions.oneHour.targetPrice,
      ) < threshold &&
      Math.abs(
        prev.predictions.fourHour.targetPrice -
          curr.predictions.fourHour.targetPrice,
      ) < threshold &&
      Math.abs(
        prev.predictions.oneDay.targetPrice -
          curr.predictions.oneDay.targetPrice,
      ) < threshold &&
      Math.abs(prev.sentiment.score - curr.sentiment.score) < 0.1
    );
  }

  /**
   * Detect significant changes that warrant alerts
   */
  private async detectSignificantChanges(
    symbol: string,
    prediction: PredictionData,
  ): Promise<any[]> {
    const changes = [];

    // Check for direction changes
    const cached = this.predictionCache.get(symbol);
    if (cached) {
      // Direction change detection
      if (
        cached.predictions.oneDay.direction !==
        prediction.predictions.oneDay.direction
      ) {
        changes.push({
          type: 'direction_change',
          timeframe: '1D',
          from: cached.predictions.oneDay.direction,
          to: prediction.predictions.oneDay.direction,
          confidence: prediction.predictions.oneDay.confidence,
        });
      }

      // Regime change detection
      if (cached.regime.current !== prediction.regime.current) {
        changes.push({
          type: 'regime_change',
          from: cached.regime.current,
          to: prediction.regime.current,
          confidence: prediction.regime.confidence,
        });
      }

      // Significant sentiment change
      if (Math.abs(cached.sentiment.score - prediction.sentiment.score) > 0.3) {
        changes.push({
          type: 'sentiment_change',
          from: cached.sentiment.score,
          to: prediction.sentiment.score,
          magnitude: Math.abs(
            cached.sentiment.score - prediction.sentiment.score,
          ),
        });
      }
    }

    return changes;
  }

  // Helper methods for regime analysis
  private async analyzeRegimeIndicators(symbol: string) {
    // This would analyze various technical indicators to determine regime
    return {
      confidence: 0.7,
      duration: 30, // days in current regime
      strength: 0.8,
      nextTransition: null, // predicted next transition
    };
  }

  private determineRegime(
    patterns: any,
    indicators: any,
  ): 'bull' | 'bear' | 'sideways' {
    // Simple regime detection logic - would be more sophisticated in production
    if (indicators.strength > 0.7) return 'bull';
    if (indicators.strength < 0.3) return 'bear';
    return 'sideways';
  }

  private calculateSentimentTrend(
    symbol: string,
  ): 'rising' | 'falling' | 'stable' {
    // Would analyze sentiment over time
    return 'stable';
  }

  private calculateOptimalPositionSize(prediction: any): number {
    // Risk-based position sizing
    const baseSize = 0.1; // 10% base position
    const confidenceMultiplier = prediction.confidence || 0.5;
    return baseSize * confidenceMultiplier;
  }

  private calculateRiskScore(prediction: any): number {
    // Overall risk score from 0-1
    const volatilityRisk = (prediction.volatility || 0.2) / 0.5;
    const confidenceRisk = 1 - (prediction.confidence || 0.5);
    return Math.min(1, (volatilityRisk + confidenceRisk) / 2);
  }

  // Fallback methods for error handling
  private createFallbackPrediction(symbol: string): PredictionData {
    return {
      symbol,
      timestamp: new Date(),
      predictions: this.createFallbackMultiTimeframePrediction(),
      sentiment: this.createFallbackSentiment(),
      regime: this.createFallbackRegime(),
      riskMetrics: this.createFallbackRiskMetrics(),
      confidence: 0.1, // Low confidence fallback
    };
  }

  private createFallbackMultiTimeframePrediction(): MultiTimeframePrediction {
    const basePrediction = {
      direction: 'neutral' as const,
      targetPrice: 0,
      confidence: 0.1,
      probability: 0.5,
      timeHorizon: new Date(),
      changePercent: 0,
    };

    return {
      oneHour: {
        ...basePrediction,
        timeHorizon: this.calculateTimeHorizon('1H'),
      },
      fourHour: {
        ...basePrediction,
        timeHorizon: this.calculateTimeHorizon('4H'),
      },
      oneDay: {
        ...basePrediction,
        timeHorizon: this.calculateTimeHorizon('1D'),
      },
    };
  }

  private createFallbackSentiment(): SentimentData {
    return {
      score: 0,
      confidence: 0.1,
      sources: { news: 0, social: 0, analyst: 0 },
      recentEvents: [],
      trending: 'stable',
      lastUpdated: new Date(),
    };
  }

  private createFallbackRegime(): MarketRegime {
    return {
      current: 'sideways',
      confidence: 0.1,
      duration: 0,
      strength: 0.5,
      nextTransition: null,
      historicalRegimes: [],
    };
  }

  private createFallbackRiskMetrics(): RiskMetrics {
    return {
      volatilityPrediction: 0.2,
      confidenceBands: { upper: 0, lower: 0 },
      drawdownProbability: 0.1,
      supportResistance: { support: 0, resistance: 0, confidence: 0.1 },
      positionSizing: 0.05,
      riskScore: 0.5,
    };
  }
}
