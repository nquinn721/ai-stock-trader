import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  BreakoutPrediction,
  ModelMetrics,
  PortfolioOptimization,
  RiskParameters,
  SentimentScore,
} from './interfaces/ml.interfaces';
import { PredictionData } from './interfaces/predictive-analytics.interfaces';
import { IntelligentRecommendationService } from './services/intelligent-recommendation.service';
import { MLService } from './services/ml.service';
import { PredictiveAnalyticsService } from './services/predictive-analytics.service';

@Controller('ml')
export class MLController {
  private readonly logger = new Logger(MLController.name);

  constructor(
    private readonly mlService: MLService,
    private readonly intelligentRecommendationService: IntelligentRecommendationService,
    private readonly predictiveAnalyticsService: PredictiveAnalyticsService,
  ) {}

  /**
   * Get breakout prediction for a symbol
   */
  @Get('breakout/:symbol')
  async getBreakoutPrediction(
    @Param('symbol') symbol: string,
  ): Promise<BreakoutPrediction> {
    try {
      this.logger.log(`Getting breakout prediction for ${symbol}`);
      return await this.mlService.getBreakoutPrediction(symbol.toUpperCase());
    } catch (error) {
      this.logger.error(
        `Error getting breakout prediction for ${symbol}:`,
        error,
      );
      throw new HttpException(
        'Failed to get breakout prediction',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get risk optimization parameters
   */
  @Get('risk/:portfolioId/:symbol')
  async getRiskOptimization(
    @Param('portfolioId') portfolioId: number,
    @Param('symbol') symbol: string,
  ): Promise<RiskParameters> {
    try {
      this.logger.log(
        `Getting risk optimization for portfolio ${portfolioId}, symbol ${symbol}`,
      );
      return await this.mlService.getRiskOptimization(
        Number(portfolioId),
        symbol.toUpperCase(),
      );
    } catch (error) {
      this.logger.error(
        `Error getting risk optimization for ${portfolioId}/${symbol}:`,
        error,
      );
      throw new HttpException(
        'Failed to get risk optimization',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get sentiment analysis for a symbol
   */
  @Get('sentiment/:symbol')
  async getSentimentAnalysis(
    @Param('symbol') symbol: string,
  ): Promise<SentimentScore> {
    try {
      this.logger.log(`Getting sentiment analysis for ${symbol}`);
      return await this.mlService.getSentimentAnalysis(symbol.toUpperCase());
    } catch (error) {
      this.logger.error(
        `Error getting sentiment analysis for ${symbol}:`,
        error,
      );
      throw new HttpException(
        'Failed to get sentiment analysis',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get portfolio optimization recommendations
   */
  @Get('portfolio-optimization/:portfolioId')
  async getPortfolioOptimization(
    @Param('portfolioId') portfolioId: number,
  ): Promise<PortfolioOptimization> {
    try {
      this.logger.log(`Getting portfolio optimization for ${portfolioId}`);
      return await this.mlService.getPortfolioOptimization(
        Number(portfolioId),
        [],
      );
    } catch (error) {
      this.logger.error(
        `Error getting portfolio optimization for ${portfolioId}:`,
        error,
      );
      throw new HttpException(
        'Failed to get portfolio optimization',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get model performance metrics
   */
  @Get('metrics/:modelName')
  async getModelMetrics(
    @Param('modelName') modelName: string,
    @Query('days') days?: string,
  ): Promise<ModelMetrics> {
    try {
      const evaluationDays = days ? parseInt(days, 10) : 30;
      this.logger.log(
        `Getting model metrics for ${modelName} over ${evaluationDays} days`,
      );
      return await this.mlService.evaluateModelPerformance(
        modelName,
        evaluationDays,
      );
    } catch (error) {
      this.logger.error(`Error getting model metrics for ${modelName}:`, error);
      throw new HttpException(
        'Failed to get model metrics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get information about a specific model
   */
  @Get('models/:modelName')
  async getModelInfo(@Param('modelName') modelName: string) {
    try {
      this.logger.log(`Getting model info for ${modelName}`);
      const model = await this.mlService.getModelInfo(modelName);
      if (!model) {
        throw new HttpException('Model not found', HttpStatus.NOT_FOUND);
      }
      return model;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Error getting model info for ${modelName}:`, error);
      throw new HttpException(
        'Failed to get model info',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * List all active models
   */
  @Get('models')
  async listActiveModels() {
    try {
      this.logger.log('Getting list of active models');
      return await this.mlService.listActiveModels();
    } catch (error) {
      this.logger.error('Error getting list of active models:', error);
      throw new HttpException(
        'Failed to get model list',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Batch prediction endpoint for multiple symbols
   */
  @Post('batch/breakout')
  async getBatchBreakoutPredictions(
    @Body() request: { symbols: string[] },
  ): Promise<BreakoutPrediction[]> {
    try {
      this.logger.log(
        `Getting batch breakout predictions for ${request.symbols.length} symbols`,
      );
      const predictions = await Promise.all(
        request.symbols.map((symbol) =>
          this.mlService.getBreakoutPrediction(symbol.toUpperCase()),
        ),
      );
      return predictions;
    } catch (error) {
      this.logger.error('Error getting batch breakout predictions:', error);
      throw new HttpException(
        'Failed to get batch predictions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Batch sentiment analysis for multiple symbols
   */
  @Post('batch/sentiment')
  async getBatchSentimentAnalysis(
    @Body() request: { symbols: string[] },
  ): Promise<SentimentScore[]> {
    try {
      this.logger.log(
        `Getting batch sentiment analysis for ${request.symbols.length} symbols`,
      );
      const sentiments = await Promise.all(
        request.symbols.map((symbol) =>
          this.mlService.getSentimentAnalysis(symbol.toUpperCase()),
        ),
      );
      return sentiments;
    } catch (error) {
      this.logger.error('Error getting batch sentiment analysis:', error);
      throw new HttpException(
        'Failed to get batch sentiment analysis',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Health check endpoint for ML services
   */
  @Get('health')
  async healthCheck() {
    try {
      const models = await this.mlService.listActiveModels();
      return {
        status: 'healthy',
        timestamp: new Date(),
        activeModels: models.length,
        models: models.map((model) => ({
          name: model.name,
          version: model.version,
          type: model.type,
          status: model.status,
        })),
      };
    } catch (error) {
      this.logger.error('ML health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        error: error.message,
      };
    }
  }

  /**
   * S19: Generate AI-powered trading recommendation for a symbol
   */
  @Post('recommendation/:symbol')
  async generateRecommendation(
    @Param('symbol') symbol: string,
    @Body()
    request: {
      currentPrice: number;
      portfolioContext?: {
        currentHoldings: number;
        availableCash: number;
        riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
      };
      timeHorizon?: '1D' | '1W' | '1M';
      preferences?: {
        maxRisk: number;
        preferredSectors?: string[];
        excludePatterns?: string[];
      };
    },
  ): Promise<any> {
    try {
      this.logger.log(`S19: Generating AI recommendation for ${symbol}`);

      const recommendationRequest = {
        symbol: symbol.toUpperCase(),
        ...request,
      };

      return await this.intelligentRecommendationService.generateRecommendation(
        recommendationRequest,
      );
    } catch (error) {
      this.logger.error(
        `S19: Error generating recommendation for ${symbol}:`,
        error,
      );
      throw new HttpException(
        'Failed to generate AI trading recommendation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * S19: Generate batch AI-powered trading recommendations
   */
  @Post('recommendations/batch')
  async generateBatchRecommendations(
    @Body()
    requests: Array<{
      symbol: string;
      currentPrice: number;
      portfolioContext?: {
        currentHoldings: number;
        availableCash: number;
        riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
      };
      timeHorizon?: '1D' | '1W' | '1M';
      preferences?: {
        maxRisk: number;
        preferredSectors?: string[];
        excludePatterns?: string[];
      };
    }>,
  ): Promise<any> {
    try {
      this.logger.log(
        `S19: Generating ${requests.length} batch AI recommendations`,
      );
      const recommendationRequests = requests.map((req) => ({
        ...req,
        symbol: req.symbol.toUpperCase(),
      }));

      return await this.intelligentRecommendationService.generateBatchRecommendations(
        recommendationRequests,
      );
    } catch (error) {
      this.logger.error('S19: Error generating batch recommendations:', error);
      throw new HttpException(
        'Failed to generate batch AI trading recommendations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * S19: Get detailed explanation for a trading recommendation
   */
  @Get('recommendation/:symbol/explanation')
  async getRecommendationExplanation(
    @Param('symbol') symbol: string,
  ): Promise<any> {
    try {
      this.logger.log(`S19: Getting recommendation explanation for ${symbol}`);
      return await this.intelligentRecommendationService.getRecommendationExplanation(
        symbol.toUpperCase(),
      );
    } catch (error) {
      this.logger.error(
        `S19: Error getting recommendation explanation for ${symbol}:`,
        error,
      );
      throw new HttpException(
        'Failed to get recommendation explanation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * S19+S29B: Generate enhanced AI recommendation with ensemble signals
   */
  @Post('recommendation/enhanced/:symbol')
  async generateEnhancedRecommendation(
    @Param('symbol') symbol: string,
    @Body()
    request: {
      currentPrice: number;
      portfolioContext?: {
        currentHoldings: number;
        availableCash: number;
        riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
      };
      timeHorizon?: '1D' | '1W' | '1M';
      preferences?: {
        maxRisk: number;
        preferredSectors?: string[];
        excludePatterns?: string[];
      };
      ensembleOptions?: {
        timeframes?: string[];
        includeConflictResolution?: boolean;
        ensembleMethod?: 'voting' | 'averaging' | 'stacking' | 'meta_learning';
        confidenceThreshold?: number;
        enableRealTimeStream?: boolean;
      };
    },
  ): Promise<any> {
    try {
      this.logger.log(
        `S19+S29B: Generating enhanced AI recommendation for ${symbol}`,
      );
      return await this.mlService.generateEnhancedIntelligentRecommendation(
        symbol.toUpperCase(),
        request.currentPrice,
        request,
      );
    } catch (error) {
      this.logger.error(
        `S19+S29B: Error generating enhanced recommendation for ${symbol}:`,
        error,
      );
      throw new HttpException(
        'Failed to generate enhanced AI trading recommendation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ========================================
  // S39: Predictive Analytics Endpoints
  // ========================================

  /**
   * Get comprehensive real-time predictions for a symbol
   * S39: Real-Time Predictive Analytics Dashboard
   */
  @Get('predictions/:symbol')
  async getRealTimePredictions(
    @Param('symbol') symbol: string,
  ): Promise<PredictionData> {
    try {
      this.logger.log(`S39: Getting real-time predictions for ${symbol}`);
      return await this.predictiveAnalyticsService.getRealTimePredictions(
        symbol.toUpperCase(),
      );
    } catch (error) {
      this.logger.error(
        `S39: Error getting real-time predictions for ${symbol}:`,
        error,
      );
      throw new HttpException(
        'Failed to get real-time predictions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get multi-timeframe predictions for a symbol
   * S39: Multi-timeframe prediction analysis
   */
  @Get('predictions/:symbol/timeframes')
  async getMultiTimeframePredictions(
    @Param('symbol') symbol: string,
    @Query('timeframes') timeframes?: string,
  ): Promise<any> {
    try {
      this.logger.log(`S39: Getting multi-timeframe predictions for ${symbol}`);
      return await this.predictiveAnalyticsService.getMultiTimeframePredictions(
        symbol.toUpperCase(),
      );
    } catch (error) {
      this.logger.error(
        `S39: Error getting multi-timeframe predictions for ${symbol}:`,
        error,
      );
      throw new HttpException(
        'Failed to get multi-timeframe predictions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get current sentiment analysis for a symbol
   * S39: Live sentiment integration
   */
  @Get('predictions/:symbol/sentiment')
  async getLiveSentiment(@Param('symbol') symbol: string): Promise<any> {
    try {
      this.logger.log(`S39: Getting live sentiment for ${symbol}`);
      return await this.predictiveAnalyticsService.getLiveSentiment(
        symbol.toUpperCase(),
      );
    } catch (error) {
      this.logger.error(
        `S39: Error getting live sentiment for ${symbol}:`,
        error,
      );
      throw new HttpException(
        'Failed to get live sentiment',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get current market regime for a symbol
   * S39: Market regime detection
   */
  @Get('predictions/:symbol/regime')
  async getCurrentRegime(@Param('symbol') symbol: string): Promise<any> {
    try {
      this.logger.log(`S39: Getting current market regime for ${symbol}`);
      return await this.predictiveAnalyticsService.getCurrentRegime(
        symbol.toUpperCase(),
      );
    } catch (error) {
      this.logger.error(
        `S39: Error getting current market regime for ${symbol}:`,
        error,
      );
      throw new HttpException(
        'Failed to get current market regime',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get risk metrics and analytics for a symbol
   * S39: Risk analytics integration
   */
  @Get('predictions/:symbol/risk')
  async getRiskMetrics(@Param('symbol') symbol: string): Promise<any> {
    try {
      this.logger.log(`S39: Getting risk metrics for ${symbol}`);
      return await this.predictiveAnalyticsService.calculateRiskMetrics(
        symbol.toUpperCase(),
      );
    } catch (error) {
      this.logger.error(
        `S39: Error getting risk metrics for ${symbol}:`,
        error,
      );
      throw new HttpException(
        'Failed to get risk metrics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get prediction confidence intervals
   * S39: Confidence band analysis
   */
  @Get('predictions/:symbol/confidence')
  async getConfidenceIntervals(
    @Param('symbol') symbol: string,
    @Query('timeframe') timeframe?: string,
  ): Promise<any> {
    try {
      this.logger.log(`S39: Getting confidence intervals for ${symbol}`);
      const prediction =
        await this.predictiveAnalyticsService.getRealTimePredictions(
          symbol.toUpperCase(),
        );

      return {
        symbol,
        timeframe: timeframe || '1D',
        confidence: prediction.confidence,
        confidenceBands: prediction.riskMetrics.confidenceBands,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `S39: Error getting confidence intervals for ${symbol}:`,
        error,
      );
      throw new HttpException(
        'Failed to get confidence intervals',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
