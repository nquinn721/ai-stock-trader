import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MLMetric,
  MLModel,
  MLModelPerformance,
  MLPrediction,
} from '../entities/ml.entities';
import {
  BreakoutPrediction,
  ModelMetrics,
  PortfolioOptimization,
  RiskParameters,
  SentimentScore,
  TechnicalFeatures,
} from '../interfaces/ml.interfaces';

@Injectable()
export class MLService {
  private readonly logger = new Logger(MLService.name);

  constructor(
    @InjectRepository(MLModel)
    private mlModelRepository: Repository<MLModel>,
    @InjectRepository(MLPrediction)
    private mlPredictionRepository: Repository<MLPrediction>,
    @InjectRepository(MLMetric)
    private mlMetricRepository: Repository<MLMetric>,
    @InjectRepository(MLModelPerformance)
    private mlPerformanceRepository: Repository<MLModelPerformance>,
  ) {}

  /**
   * Get breakout prediction for a symbol
   * This is a placeholder implementation for Phase 1
   */
  async getBreakoutPrediction(symbol: string): Promise<BreakoutPrediction> {
    this.logger.log(`Getting breakout prediction for ${symbol}`);

    // Placeholder implementation - would call actual ML model
    const mockPrediction: BreakoutPrediction = {
      symbol,
      probability: Math.random() * 0.4 + 0.3, // 30-70% probability
      direction: Math.random() > 0.5 ? 'UP' : 'DOWN',
      confidence: Math.random() * 0.3 + 0.6, // 60-90% confidence
      targetPrice: 150 + Math.random() * 50, // Mock target price
      timeHorizon: Math.floor(Math.random() * 24) + 1, // 1-24 hours
      riskScore: Math.random() * 0.5 + 0.2, // 20-70% risk
      features: await this.mockTechnicalFeatures(symbol),
      modelVersion: 'v1.0.0-placeholder',
      timestamp: new Date(),
    };

    // Log the prediction for monitoring
    await this.logPrediction('breakout', mockPrediction);

    return mockPrediction;
  }

  /**
   * Get risk optimization parameters for a portfolio position
   * This is a placeholder implementation for Phase 1
   */
  async getRiskOptimization(
    portfolioId: number,
    symbol: string,
  ): Promise<RiskParameters> {
    this.logger.log(
      `Getting risk optimization for portfolio ${portfolioId}, symbol ${symbol}`,
    );

    // Placeholder implementation - would call actual ML model
    const mockRiskParams: RiskParameters = {
      portfolioId,
      symbol,
      recommendedPosition: Math.random() * 0.15 + 0.05, // 5-20% position
      stopLoss: Math.random() * 0.05 + 0.02, // 2-7% stop loss
      takeProfit: Math.random() * 0.1 + 0.05, // 5-15% take profit
      maxDrawdown: Math.random() * 0.08 + 0.02, // 2-10% max drawdown
      volatilityAdjustment: Math.random() * 0.2 + 0.8, // 0.8-1.0 adjustment
      correlationRisk: Math.random() * 0.3 + 0.1, // 10-40% correlation risk
      timestamp: new Date(),
    };

    await this.logPrediction('risk-optimization', mockRiskParams);

    return mockRiskParams;
  }

  /**
   * Get sentiment analysis for a symbol
   * This is a placeholder implementation for Phase 1
   */
  async getSentimentAnalysis(symbol: string): Promise<SentimentScore> {
    this.logger.log(`Getting sentiment analysis for ${symbol}`);

    // Placeholder implementation - would call actual ML model
    const mockSentiment: SentimentScore = {
      symbol,
      overallSentiment: (Math.random() - 0.5) * 2, // -1 to 1
      newsCount: Math.floor(Math.random() * 20) + 5, // 5-25 articles
      confidence: Math.random() * 0.3 + 0.6, // 60-90% confidence
      topics: {
        earnings: Math.random(),
        analyst: Math.random(),
        product: Math.random(),
        regulatory: Math.random(),
        market: Math.random(),
      },
      impactScore: Math.random(),
      timeDecay: Math.random() * 0.2 + 0.8, // 80-100% (recent news)
      timestamp: new Date(),
    };

    await this.logPrediction('sentiment', mockSentiment);

    return mockSentiment;
  }

  /**
   * Get portfolio optimization recommendations
   * This is a placeholder implementation for Phase 2
   */
  async getPortfolioOptimization(
    portfolioId: number,
  ): Promise<PortfolioOptimization> {
    this.logger.log(`Getting portfolio optimization for ${portfolioId}`);

    // Placeholder implementation
    const mockOptimization: PortfolioOptimization = {
      portfolioId,
      recommendations: [
        {
          symbol: 'AAPL',
          currentWeight: 0.3,
          recommendedWeight: 0.25,
          confidence: 0.85,
          reasoning: 'Reduce exposure due to high correlation with tech sector',
        },
        {
          symbol: 'GOOGL',
          currentWeight: 0.2,
          recommendedWeight: 0.22,
          confidence: 0.78,
          reasoning: 'Slight increase based on strong fundamentals',
        },
      ],
      expectedReturn: 0.12, // 12% expected annual return
      expectedRisk: 0.18, // 18% expected volatility
      sharpeRatio: 0.67,
      diversificationScore: 0.75,
      timestamp: new Date(),
    };

    await this.logPrediction('portfolio-optimization', mockOptimization);

    return mockOptimization;
  }

  /**
   * Evaluate model performance over a given period
   */
  async evaluateModelPerformance(
    modelName: string,
    days: number = 30,
  ): Promise<ModelMetrics> {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    // Get predictions from the period
    const predictions = await this.mlPredictionRepository
      .createQueryBuilder('prediction')
      .leftJoin('ml_models', 'model', 'model.id = prediction.modelId')
      .where('model.name = :modelName', { modelName })
      .andWhere('prediction.createdAt >= :startDate', { startDate })
      .andWhere('prediction.createdAt <= :endDate', { endDate })
      .andWhere('prediction.actualOutcome IS NOT NULL')
      .getMany();

    if (predictions.length === 0) {
      this.logger.warn(
        `No predictions with outcomes found for model ${modelName}`,
      );
      return this.getDefaultModelMetrics(modelName, startDate, endDate);
    }

    // Calculate metrics based on predictions vs outcomes
    const metrics = this.calculateMetricsFromPredictions(predictions);

    const modelMetrics: ModelMetrics = {
      modelName,
      accuracy: metrics.accuracy,
      precision: metrics.precision,
      recall: metrics.recall,
      f1Score: metrics.f1Score,
      sampleSize: predictions.length,
      evaluationPeriod: {
        start: startDate,
        end: endDate,
      },
      timestamp: new Date(),
    };

    // Store performance metrics
    await this.storeModelPerformance(modelName, modelMetrics);

    return modelMetrics;
  }

  /**
   * Log a prediction for monitoring and evaluation
   */
  private async logPrediction(
    predictionType: string,
    prediction: any,
  ): Promise<void> {
    try {
      const mlPrediction = this.mlPredictionRepository.create({
        modelId: `${predictionType}-model-v1.0.0`, // Placeholder model ID
        symbol: prediction.symbol || null,
        portfolioId: prediction.portfolioId || null,
        predictionType,
        inputFeatures: this.extractInputFeatures(prediction),
        outputPrediction: this.extractOutputPrediction(prediction),
        confidence: prediction.confidence || 0.5,
        executionTime: Math.floor(Math.random() * 100) + 10, // Mock execution time
      });

      await this.mlPredictionRepository.save(mlPrediction);
    } catch (error) {
      this.logger.error('Error logging ML prediction:', error);
    }
  }

  /**
   * Create mock technical features for placeholder implementation
   */
  private async mockTechnicalFeatures(
    symbol: string,
  ): Promise<TechnicalFeatures> {
    return {
      symbol,
      timestamp: new Date(),
      price: 150 + Math.random() * 50,
      volume: Math.floor(Math.random() * 1000000) + 100000,
      rsi: Math.random() * 100,
      macd: (Math.random() - 0.5) * 10,
      bollingerBands: {
        upper: 160,
        middle: 150,
        lower: 140,
      },
      movingAverages: {
        sma20: 148,
        sma50: 145,
        ema12: 151,
        ema26: 147,
      },
      support: 140,
      resistance: 160,
      volatility: Math.random() * 0.05 + 0.15,
      momentum: (Math.random() - 0.5) * 20,
    };
  }

  private extractInputFeatures(prediction: any): Record<string, any> {
    // Extract input features for logging
    if (prediction.features) {
      return prediction.features;
    }
    return { symbol: prediction.symbol };
  }

  private extractOutputPrediction(prediction: any): Record<string, any> {
    // Extract output prediction for logging
    const output: any = { ...prediction };
    delete output.features; // Remove features from output
    return output;
  }

  private calculateMetricsFromPredictions(predictions: MLPrediction[]): {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  } {
    // Placeholder implementation - would calculate actual metrics
    return {
      accuracy: 0.75 + Math.random() * 0.2, // 75-95%
      precision: 0.7 + Math.random() * 0.25, // 70-95%
      recall: 0.65 + Math.random() * 0.3, // 65-95%
      f1Score: 0.72 + Math.random() * 0.23, // 72-95%
    };
  }

  private async storeModelPerformance(
    modelName: string,
    metrics: ModelMetrics,
  ): Promise<void> {
    try {
      const performance = this.mlPerformanceRepository.create({
        modelId: `${modelName}-model-v1.0.0`,
        evaluationDate: new Date(),
        accuracy: metrics.accuracy,
        precision: metrics.precision,
        recall: metrics.recall,
        f1Score: metrics.f1Score,
        sampleSize: metrics.sampleSize,
        periodStart: metrics.evaluationPeriod.start,
        periodEnd: metrics.evaluationPeriod.end,
        sharpeRatio: metrics.sharpeRatio,
        maxDrawdown: metrics.maxDrawdown,
        totalReturn: metrics.totalReturn,
      });

      await this.mlPerformanceRepository.save(performance);
    } catch (error) {
      this.logger.error('Error storing model performance:', error);
    }
  }

  private getDefaultModelMetrics(
    modelName: string,
    startDate: Date,
    endDate: Date,
  ): ModelMetrics {
    return {
      modelName,
      accuracy: 0,
      precision: 0,
      recall: 0,
      f1Score: 0,
      sampleSize: 0,
      evaluationPeriod: {
        start: startDate,
        end: endDate,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Get model status and basic info
   */
  async getModelInfo(modelName: string): Promise<MLModel | null> {
    return this.mlModelRepository.findOne({
      where: { name: modelName, status: 'active' },
    });
  }

  /**
   * List all active models
   */
  async listActiveModels(): Promise<MLModel[]> {
    return this.mlModelRepository.find({
      where: { status: 'active' },
      order: { createdAt: 'DESC' },
    });
  }
}
