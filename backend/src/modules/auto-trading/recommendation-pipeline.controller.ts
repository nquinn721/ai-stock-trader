import { 
  Controller, 
  Post, 
  Get, 
  Put,
  Body, 
  Query, 
  Param, 
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { RiskLevel } from '../../entities/auto-trading-order.entity';
import { 
  RecommendationPipelineService, 
  TradingRecommendation,
  RecommendationToOrderRequest,
  PipelineConfiguration,
} from './services/recommendation-pipeline.service';

export class GenerateRecommendationsDto {
  symbols: string[];
  timeframes?: string[];
  includeRiskAnalysis?: boolean;
  targetPortfolios?: number[];
}

export class ConvertToOrderDto {
  recommendationId: string;
  portfolioId: number;
  autoExecute?: boolean;
  customRiskParams?: {
    maxPositionPercent?: number;
    stopLossPercent?: number;
    takeProfitPercent?: number;
  };
  orderStrategy?: 'BRACKET' | 'OCO' | 'TRAILING_STOP' | 'CONDITIONAL';
}

export class ProcessPipelineDto {
  symbols: string[];
  portfolioIds: number[];
}

export class UpdateConfigDto {
  enabled?: boolean;
  autoExecutionEnabled?: boolean;
  minimumConfidence?: number;
  maximumRiskLevel?: RiskLevel;
  supportedTimeframes?: string[];
  portfolioFilters?: number[];
  symbolFilters?: string[];
  maxOrdersPerDay?: number;
  cooldownMinutes?: number;
}

/**
 * S43: Recommendation Pipeline Controller
 * 
 * Provides REST API endpoints for the AI recommendation-to-order integration pipeline.
 * Allows users to generate recommendations, convert them to orders, and manage the pipeline.
 */
@Controller('recommendation-pipeline')
export class RecommendationPipelineController {
  private readonly logger = new Logger(RecommendationPipelineController.name);

  constructor(
    private readonly recommendationPipelineService: RecommendationPipelineService,
  ) {}

  /**
   * Generate AI trading recommendations for specific symbols
   * POST /recommendation-pipeline/generate
   */
  @Post('generate')
  async generateRecommendations(
    @Body() generateDto: GenerateRecommendationsDto,
  ): Promise<{
    success: boolean;
    recommendations: TradingRecommendation[];
    totalGenerated: number;
    errors?: string[];
  }> {
    this.logger.log(`S43: Generating recommendations for ${generateDto.symbols.length} symbols`);

    if (!generateDto.symbols || generateDto.symbols.length === 0) {
      throw new BadRequestException('At least one symbol is required');
    }

    const allRecommendations: TradingRecommendation[] = [];
    const errors: string[] = [];

    try {
      for (const symbol of generateDto.symbols) {
        try {
          const recommendations = await this.recommendationPipelineService.generateRecommendations(
            symbol,
            {
              timeframes: generateDto.timeframes,
              includeRiskAnalysis: generateDto.includeRiskAnalysis,
              targetPortfolios: generateDto.targetPortfolios,
            },
          );
          allRecommendations.push(...recommendations);
        } catch (error) {
          errors.push(`${symbol}: ${error.message}`);
        }
      }

      return {
        success: true,
        recommendations: allRecommendations,
        totalGenerated: allRecommendations.length,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      this.logger.error('S43: Error in generateRecommendations:', error);
      throw new BadRequestException(`Failed to generate recommendations: ${error.message}`);
    }
  }

  /**
   * Convert a recommendation to a trading order
   * POST /recommendation-pipeline/convert-to-order
   */
  @Post('convert-to-order')
  async convertRecommendationToOrder(
    @Body() convertDto: ConvertToOrderDto,
  ): Promise<{
    success: boolean;
    orderId?: string;
    errors?: string[];
    recommendation?: TradingRecommendation;
  }> {
    this.logger.log(`S43: Converting recommendation ${convertDto.recommendationId} to order`);

    if (!convertDto.recommendationId || !convertDto.portfolioId) {
      throw new BadRequestException('Recommendation ID and Portfolio ID are required');
    }

    try {
      const result = await this.recommendationPipelineService.convertRecommendationToOrder({
        recommendationId: convertDto.recommendationId,
        portfolioId: convertDto.portfolioId,
        autoExecute: convertDto.autoExecute,
        customRiskParams: convertDto.customRiskParams,
        orderStrategy: convertDto.orderStrategy,
      });

      if (!result.success) {
        this.logger.warn(`S43: Failed to convert recommendation to order: ${result.errors?.join(', ')}`);
      }

      return result;
    } catch (error) {
      this.logger.error('S43: Error in convertRecommendationToOrder:', error);
      throw new BadRequestException(`Failed to convert recommendation: ${error.message}`);
    }
  }

  /**
   * Get all active recommendations with optional filtering
   * GET /recommendation-pipeline/recommendations
   */
  @Get('recommendations')
  async getActiveRecommendations(
    @Query('symbols') symbols?: string,
    @Query('minConfidence') minConfidence?: number,
    @Query('actions') actions?: string,
    @Query('maxAge') maxAge?: number,
  ): Promise<{
    success: boolean;
    recommendations: TradingRecommendation[];
    total: number;
    filters: any;
  }> {
    try {
      const filters: any = {};

      if (symbols) {
        filters.symbols = symbols.split(',').map(s => s.trim());
      }
      if (minConfidence !== undefined) {
        filters.minConfidence = Number(minConfidence);
      }
      if (actions) {
        filters.actions = actions.split(',').map(a => a.trim().toUpperCase());
      }
      if (maxAge !== undefined) {
        filters.maxAge = Number(maxAge);
      }

      const recommendations = await this.recommendationPipelineService.getActiveRecommendations(filters);

      return {
        success: true,
        recommendations,
        total: recommendations.length,
        filters,
      };
    } catch (error) {
      this.logger.error('S43: Error in getActiveRecommendations:', error);
      throw new BadRequestException(`Failed to get recommendations: ${error.message}`);
    }
  }

  /**
   * Get a specific recommendation by ID
   * GET /recommendation-pipeline/recommendations/:id
   */
  @Get('recommendations/:id')
  async getRecommendationById(
    @Param('id') recommendationId: string,
  ): Promise<{
    success: boolean;
    recommendation?: TradingRecommendation;
    error?: string;
  }> {
    try {
      const recommendations = await this.recommendationPipelineService.getActiveRecommendations();
      const recommendation = recommendations.find(r => r.id === recommendationId);

      if (!recommendation) {
        throw new NotFoundException(`Recommendation ${recommendationId} not found`);
      }

      return {
        success: true,
        recommendation,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      this.logger.error('S43: Error in getRecommendationById:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Process the automated pipeline for multiple symbols and portfolios
   * POST /recommendation-pipeline/process
   */
  @Post('process')
  async processAutomatedPipeline(
    @Body() processDto: ProcessPipelineDto,
  ): Promise<{
    success: boolean;
    totalRecommendations: number;
    ordersCreated: number;
    errors: string[];
  }> {
    this.logger.log(`S43: Processing automated pipeline for ${processDto.symbols.length} symbols`);

    if (!processDto.symbols || processDto.symbols.length === 0) {
      throw new BadRequestException('At least one symbol is required');
    }
    if (!processDto.portfolioIds || processDto.portfolioIds.length === 0) {
      throw new BadRequestException('At least one portfolio ID is required');
    }

    try {
      const result = await this.recommendationPipelineService.processAutomatedPipeline(
        processDto.symbols,
        processDto.portfolioIds,
      );

      return {
        success: true,
        ...result,
      };
    } catch (error) {
      this.logger.error('S43: Error in processAutomatedPipeline:', error);
      throw new BadRequestException(`Failed to process pipeline: ${error.message}`);
    }
  }

  /**
   * Get pipeline configuration
   * GET /recommendation-pipeline/config
   */
  @Get('config')
  async getPipelineConfiguration(): Promise<{
    success: boolean;
    config: PipelineConfiguration;
  }> {
    try {
      const config = this.recommendationPipelineService.getPipelineConfiguration();
      
      return {
        success: true,
        config,
      };
    } catch (error) {
      this.logger.error('S43: Error in getPipelineConfiguration:', error);
      throw new BadRequestException(`Failed to get configuration: ${error.message}`);
    }
  }

  /**
   * Update pipeline configuration
   * PUT /recommendation-pipeline/config
   */
  @Put('config')
  async updatePipelineConfiguration(
    @Body() updateDto: UpdateConfigDto,
  ): Promise<{
    success: boolean;
    config: PipelineConfiguration;
    message: string;
  }> {
    try {
      // Validate configuration values
      if (updateDto.minimumConfidence !== undefined) {
        if (updateDto.minimumConfidence < 0 || updateDto.minimumConfidence > 1) {
          throw new BadRequestException('Minimum confidence must be between 0 and 1');
        }
      }

      if (updateDto.maxOrdersPerDay !== undefined) {
        if (updateDto.maxOrdersPerDay < 1 || updateDto.maxOrdersPerDay > 1000) {
          throw new BadRequestException('Max orders per day must be between 1 and 1000');
        }
      }

      if (updateDto.cooldownMinutes !== undefined) {
        if (updateDto.cooldownMinutes < 0 || updateDto.cooldownMinutes > 1440) {
          throw new BadRequestException('Cooldown minutes must be between 0 and 1440');
        }
      }

      this.recommendationPipelineService.updatePipelineConfiguration(updateDto);
      const updatedConfig = this.recommendationPipelineService.getPipelineConfiguration();

      this.logger.log('S43: Pipeline configuration updated successfully');

      return {
        success: true,
        config: updatedConfig,
        message: 'Pipeline configuration updated successfully',
      };
    } catch (error) {
      this.logger.error('S43: Error in updatePipelineConfiguration:', error);
      throw new BadRequestException(`Failed to update configuration: ${error.message}`);
    }
  }

  /**
   * Get pipeline statistics and performance metrics
   * GET /recommendation-pipeline/stats
   */
  @Get('stats')
  async getPipelineStatistics(): Promise<{
    success: boolean;
    stats: {
      activeRecommendations: number;
      ordersCreated: number;
      successRate: number;
      avgConfidence: number;
    };
    config: {
      enabled: boolean;
      autoExecutionEnabled: boolean;
    };
  }> {
    try {
      const stats = await this.recommendationPipelineService.getPipelineStatistics();
      const config = this.recommendationPipelineService.getPipelineConfiguration();

      return {
        success: true,
        stats,
        config: {
          enabled: config.enabled,
          autoExecutionEnabled: config.autoExecutionEnabled,
        },
      };
    } catch (error) {
      this.logger.error('S43: Error in getPipelineStatistics:', error);
      throw new BadRequestException(`Failed to get statistics: ${error.message}`);
    }
  }

  /**
   * Test the pipeline with a single symbol (for development/debugging)
   * POST /recommendation-pipeline/test/:symbol
   */
  @Post('test/:symbol')
  async testPipeline(
    @Param('symbol') symbol: string,
    @Query('portfolioId') portfolioId?: number,
  ): Promise<{
    success: boolean;
    recommendation?: TradingRecommendation;
    orderId?: string;
    steps: string[];
    errors?: string[];
  }> {
    const steps: string[] = [];
    const errors: string[] = [];

    try {
      steps.push('1. Generating recommendation...');
      const recommendations = await this.recommendationPipelineService.generateRecommendations(
        symbol,
        { timeframes: ['1h'], includeRiskAnalysis: true },
      );

      if (recommendations.length === 0) {
        errors.push('No recommendations generated');
        return { success: false, steps, errors };
      }

      const recommendation = recommendations[0];
      steps.push(`2. Generated ${recommendation.action} recommendation with ${recommendation.confidence} confidence`);

      let orderId: string | undefined;
      if (portfolioId) {
        steps.push('3. Converting to order...');
        const orderResult = await this.recommendationPipelineService.convertRecommendationToOrder({
          recommendationId: recommendation.id,
          portfolioId: Number(portfolioId),
          autoExecute: false,
        });

        if (orderResult.success) {
          orderId = orderResult.orderId;
          steps.push(`4. Order created successfully: ${orderId}`);
        } else {
          errors.push(`Order creation failed: ${orderResult.errors?.join(', ')}`);
        }
      } else {
        steps.push('3. Skipping order creation (no portfolio ID provided)');
      }

      return {
        success: true,
        recommendation,
        orderId,
        steps,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      this.logger.error('S43: Error in testPipeline:', error);
      errors.push(`Pipeline test failed: ${error.message}`);
      return { success: false, steps, errors };
    }
  }
}
