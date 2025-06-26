import { Injectable, Logger } from '@nestjs/common';
import { Observable, interval } from 'rxjs';
import { distinctUntilChanged, switchMap } from 'rxjs/operators';
import { TechnicalFeatures } from '../interfaces/ml.interfaces';
import {
  MarketRegime,
  MultiTimeframePrediction,
  PredictionChange,
  PredictionData,
  PredictionUpdate,
  RiskMetrics,
  SentimentData,
} from '../interfaces/predictive-analytics.interfaces';
import { EnsembleSystemsService } from './ensemble-systems.service';
import { FeatureEngineeringService } from './feature-engineering.service';
import { MarketPredictionService } from './market-prediction.service';
import { PatternRecognitionService } from './pattern-recognition.service';
import { SentimentAnalysisService } from './sentiment-analysis.service';

/**
 * S39: Real-Time Predictive Analytics Service
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

      const [predictions, sentiment, regime, riskMetrics] = await Promise.all([
        this.getMultiTimeframePredictions(symbol),
        this.getLiveSentiment(symbol),
        this.getCurrentRegime(symbol),
        this.calculateRiskMetrics(symbol),
      ]);

      const confidence = this.calculateOverallConfidence(
        predictions,
        sentiment,
        regime,
        riskMetrics,
      );

      const predictionData: PredictionData = {
        symbol,
        timestamp: new Date(),
        predictions,
        sentiment,
        regime,
        riskMetrics,
        confidence,
      };

      this.predictionCache.set(symbol, predictionData);
      this.lastUpdateTime.set(symbol, new Date());

      return predictionData;
    } catch (error) {
      this.logger.error(`Error getting predictions for ${symbol}:`, error);
      return this.createFallbackPrediction(symbol);
    }
  }

  /**
   * Stream real-time prediction updates
   */
  streamPredictions(symbol: string): Observable<PredictionUpdate> {
    return interval(5000).pipe(
      switchMap(async () => {
        const prediction = await this.getRealTimePredictions(symbol);
        const changes = await this.detectSignificantChanges(symbol, prediction);

        return {
          type: 'prediction-update' as const,
          symbol,
          timestamp: new Date(),
          data: prediction,
          changeDetected: changes,
        };
      }),
      distinctUntilChanged((prev, curr) =>
        this.isPredictionUnchanged(prev.data, curr.data),
      ),
    );
  }

  /**
   * Get multi-timeframe predictions
   */
  async getMultiTimeframePredictions(
    symbol: string,
  ): Promise<MultiTimeframePrediction> {
    try {
      const technicalFeatures = await this.getTechnicalFeatures(symbol);

      const oneHourPrediction =
        await this.marketPredictionService.predictMarket(
          symbol,
          technicalFeatures,
          ['1h'],
        );
      const fourHourPrediction =
        await this.marketPredictionService.predictMarket(
          symbol,
          technicalFeatures,
          ['4h'],
        );
      const oneDayPrediction = await this.marketPredictionService.predictMarket(
        symbol,
        technicalFeatures,
        ['1d'],
      );

      return {
        oneHour: this.formatTimeframePrediction(oneHourPrediction, '1H'),
        fourHour: this.formatTimeframePrediction(fourHourPrediction, '4H'),
        oneDay: this.formatTimeframePrediction(oneDayPrediction, '1D'),
      };
    } catch (error) {
      this.logger.error(
        `Error getting multi-timeframe predictions for ${symbol}:`,
        error,
      );
      return this.createFallbackTimeframePredictions();
    }
  }

  /**
   * Get live sentiment analysis
   */
  async getLiveSentiment(symbol: string): Promise<SentimentData> {
    try {
      // For now, use fallback approach until we have real data integration
      return this.createFallbackSentiment();
    } catch (error) {
      this.logger.error(`Error getting sentiment for ${symbol}:`, error);
      return this.createFallbackSentiment();
    }
  }

  /**
   * Get current market regime
   */
  async getCurrentRegime(symbol: string): Promise<MarketRegime> {
    try {
      // For now, use fallback approach until we have proper regime detection
      return this.createFallbackRegime();
    } catch (error) {
      this.logger.error(`Error determining regime for ${symbol}:`, error);
      return this.createFallbackRegime();
    }
  }

  /**
   * Calculate risk metrics
   */
  async calculateRiskMetrics(symbol: string): Promise<RiskMetrics> {
    try {
      const technicalFeatures = await this.getTechnicalFeatures(symbol);

      const ensemblePrediction =
        await this.ensembleSystemsService.generateEnsemblePrediction(
          symbol,
          { technicalFeatures, portfolioContext: {} },
          {
            marketPredictionService: this.marketPredictionService,
            sentimentAnalysisService: this.sentimentAnalysisService,
            patternRecognitionService: this.patternRecognitionService,
          },
          { includeUncertainty: true, riskAnalysis: true },
        );

      return {
        volatilityPrediction: ensemblePrediction.volatility || 0.2,
        confidenceBands: {
          upper: ensemblePrediction.confidenceInterval?.upper || 0,
          lower: ensemblePrediction.confidenceInterval?.lower || 0,
        },
        maxDrawdown: ensemblePrediction.riskMetrics?.maxDrawdown || 0.1,
        sharpeRatio: ensemblePrediction.riskMetrics?.sharpeRatio || 1.0,
        varPercentile: {
          p95: ensemblePrediction.var95 || 0.05,
          p99: ensemblePrediction.var99 || 0.01,
        },
        correlationRisk: ensemblePrediction.correlationRisk || 0.3,
        liquidityRisk: 0.1,
        concentration: 0.2,
        drawdownProbability: 0.15,
        supportResistance: {
          support: technicalFeatures.support,
          resistance: technicalFeatures.resistance,
          confidence: 0.7,
        },
        positionSizing: 0.1,
        riskScore: 0.3,
      };
    } catch (error) {
      this.logger.error(`Error calculating risk metrics for ${symbol}:`, error);
      return this.createFallbackRiskMetrics();
    }
  }

  // Helper methods
  private async getTechnicalFeatures(
    symbol: string,
  ): Promise<TechnicalFeatures> {
    try {
      const mockHistoricalData = [
        { close: 100, volume: 1000000, timestamp: new Date() },
        { close: 102, volume: 1100000, timestamp: new Date() },
      ];
      const mockTechnicalIndicators = {
        rsi: 50,
        macd: 0,
        bollingerBands: { upper: 105, middle: 100, lower: 95 },
      };

      return await this.featureEngineeringService.extractBreakoutFeatures(
        symbol,
        mockHistoricalData,
        mockTechnicalIndicators,
      );
    } catch (error) {
      this.logger.error(
        `Error getting technical features for ${symbol}:`,
        error,
      );
      return {
        symbol,
        timestamp: new Date(),
        price: 100,
        volume: 1000000,
        rsi: 50,
        macd: 0,
        bollingerBands: { upper: 105, middle: 100, lower: 95 },
        movingAverages: { sma20: 98, sma50: 95, ema12: 101, ema26: 99 },
        support: 95,
        resistance: 105,
        volatility: 0.2,
        momentum: 0.1,
      };
    }
  }

  private formatTimeframePrediction(prediction: any, timeframe: string): any {
    return {
      direction: prediction.direction || 'neutral',
      targetPrice: prediction.targetPrice || 0,
      confidence: prediction.confidence || 0.5,
      probability: prediction.probability || 0.5,
      timeHorizon: this.calculateTimeHorizon(timeframe),
      changePercent: prediction.changePercent || 0,
    };
  }

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
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  private calculateOverallConfidence(
    predictions: MultiTimeframePrediction,
    sentiment: SentimentData,
    regime: MarketRegime,
    risk: RiskMetrics,
  ): number {
    const predictionConfidence =
      (predictions.oneHour.confidence +
        predictions.fourHour.confidence +
        predictions.oneDay.confidence) /
      3;

    const sentimentConfidence = sentiment.confidence;
    const regimeConfidence = regime.confidence;
    const riskAdjustment = Math.max(0, 1 - risk.volatilityPrediction);

    return Math.min(
      1,
      predictionConfidence * 0.4 +
        sentimentConfidence * 0.2 +
        regimeConfidence * 0.2 +
        riskAdjustment * 0.2,
    );
  }

  private determineSentimentTrend(
    score: number,
  ): 'rising' | 'falling' | 'stable' {
    if (score > 0.1) return 'rising';
    if (score < -0.1) return 'falling';
    return 'stable';
  }

  private mapRegimeType(regime: string): 'bull' | 'bear' | 'sideways' {
    switch (regime?.toLowerCase()) {
      case 'bullish':
        return 'bull';
      case 'bearish':
        return 'bear';
      default:
        return 'sideways';
    }
  }

  private isPredictionUnchanged(
    prev: PredictionData,
    curr: PredictionData,
  ): boolean {
    const threshold = 0.001;

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

  private async detectSignificantChanges(
    symbol: string,
    prediction: PredictionData,
  ): Promise<PredictionChange[]> {
    const changes: PredictionChange[] = [];
    const cached = this.predictionCache.get(symbol);

    if (cached) {
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
          significance: 'high',
        });
      }

      if (cached.regime.current !== prediction.regime.current) {
        changes.push({
          type: 'regime_change',
          from: cached.regime.current,
          to: prediction.regime.current,
          confidence: prediction.regime.confidence,
          significance: 'high',
        });
      }

      if (Math.abs(cached.sentiment.score - prediction.sentiment.score) > 0.3) {
        changes.push({
          type: 'sentiment_change',
          from: cached.sentiment.score,
          to: prediction.sentiment.score,
          magnitude: Math.abs(
            cached.sentiment.score - prediction.sentiment.score,
          ),
          significance: 'medium',
        });
      }
    }

    return changes;
  }

  // Fallback methods
  private createFallbackPrediction(symbol: string): PredictionData {
    return {
      symbol,
      timestamp: new Date(),
      predictions: this.createFallbackTimeframePredictions(),
      sentiment: this.createFallbackSentiment(),
      regime: this.createFallbackRegime(),
      riskMetrics: this.createFallbackRiskMetrics(),
      confidence: 0.3,
    };
  }

  private createFallbackTimeframePredictions(): MultiTimeframePrediction {
    const basePrediction = {
      direction: 'neutral' as const,
      targetPrice: 100,
      confidence: 0.3,
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
      confidence: 0.3,
      sources: { news: 0, social: 0, analyst: 0 },
      recentEvents: [],
      trending: 'stable',
      lastUpdated: new Date(),
    };
  }

  private createFallbackRegime(): MarketRegime {
    return {
      current: 'sideways',
      confidence: 0.3,
      duration: 0,
      strength: 0.5,
      nextTransition: new Date(),
      historicalRegimes: [],
    };
  }

  private createFallbackRiskMetrics(): RiskMetrics {
    return {
      volatilityPrediction: 0.2,
      confidenceBands: { upper: 0, lower: 0 },
      maxDrawdown: 0.1,
      sharpeRatio: 1.0,
      varPercentile: { p95: 0.05, p99: 0.01 },
      correlationRisk: 0.3,
      liquidityRisk: 0.1,
      concentration: 0.2,
      drawdownProbability: 0.15,
      supportResistance: {
        support: 95,
        resistance: 105,
        confidence: 0.5,
      },
      positionSizing: 0.1,
      riskScore: 0.3,
    };
  }
}
