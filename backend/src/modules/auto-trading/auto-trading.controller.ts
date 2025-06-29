import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { AutoTradingService, DeploymentConfig } from './auto-trading.service';
import { TradeFiltersDto } from './dto/auto-trade-config.dto';
import {
  CreateTradingRuleDto,
  UpdateTradingRuleDto,
} from './dto/create-trading-rule.dto';
import {
  StopTradingSessionDto,
  TradingSessionDto,
} from './dto/trading-session.dto';

@Controller('auto-trading')
export class AutoTradingController {
  constructor(private readonly autoTradingService: AutoTradingService) {}

  // Trading Rules Management Endpoints
  @Post('rules')
  async createTradingRule(@Body() createRuleDto: CreateTradingRuleDto) {
    try {
      const rule =
        await this.autoTradingService.createTradingRule(createRuleDto);
      return {
        success: true,
        data: rule,
        message: 'Trading rule created successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('rules/:portfolioId')
  async getTradingRules(@Param('portfolioId') portfolioId: string) {
    try {
      const rules = await this.autoTradingService.getTradingRules(portfolioId);
      return {
        success: true,
        data: rules,
        count: rules.length,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('rules/:id')
  async updateTradingRule(
    @Param('id') id: string,
    @Body() updateRuleDto: UpdateTradingRuleDto,
  ) {
    try {
      const rule = await this.autoTradingService.updateTradingRule(
        id,
        updateRuleDto,
      );
      return {
        success: true,
        data: rule,
        message: 'Trading rule updated successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Delete('rules/:id')
  async deleteTradingRule(@Param('id') id: string) {
    try {
      await this.autoTradingService.deleteTradingRule(id);
      return {
        success: true,
        message: 'Trading rule deleted successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('rules/:id/activate')
  async activateRule(@Param('id') id: string) {
    try {
      await this.autoTradingService.activateRule(id);
      return {
        success: true,
        message: 'Trading rule activated successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('rules/:id/deactivate')
  async deactivateRule(@Param('id') id: string) {
    try {
      await this.autoTradingService.deactivateRule(id);
      return {
        success: true,
        message: 'Trading rule deactivated successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Trading Session Management Endpoints
  @Post('sessions/start')
  async startTradingSession(@Body() sessionDto: TradingSessionDto) {
    try {
      const session = await this.autoTradingService.startTradingSession(
        sessionDto.portfolio_id,
        sessionDto,
      );
      return {
        success: true,
        data: session,
        message: 'Trading session started successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('sessions/:id/stop')
  async stopTradingSession(
    @Param('id') sessionId: string,
    @Body() stopDto?: StopTradingSessionDto,
  ) {
    try {
      await this.autoTradingService.stopTradingSession(
        sessionId,
        stopDto?.stop_reason,
      );
      return {
        success: true,
        message: 'Trading session stopped successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('sessions/:portfolioId')
  async getTradingSessions(@Param('portfolioId') portfolioId: string) {
    try {
      const sessions =
        await this.autoTradingService.getTradingSessions(portfolioId);
      return {
        success: true,
        data: sessions,
        count: sessions.length,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('sessions/:id/status')
  async getSessionStatus(@Param('id') sessionId: string) {
    try {
      const status = await this.autoTradingService.getSessionStatus(sessionId);
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('sessions/:id/performance')
  async getSessionPerformance(@Param('id') sessionId: string) {
    try {
      const performance =
        await this.autoTradingService.getSessionPerformance(sessionId);
      return {
        success: true,
        data: performance,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('sessions/active/all')
  async getActiveSessions() {
    try {
      const sessions = await this.autoTradingService.getActiveSessions();
      return {
        success: true,
        data: sessions,
        count: sessions.length,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Trade Monitoring Endpoints
  @Get('trades/:portfolioId')
  async getAutoTrades(
    @Param('portfolioId') portfolioId: string,
    @Query() filters: TradeFiltersDto,
  ) {
    try {
      const trades = await this.autoTradingService.getAutoTrades(
        portfolioId,
        filters,
      );
      return {
        success: true,
        data: trades.trades,
        total: trades.total,
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 50,
          total: trades.total,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('trades/:id/details')
  async getTradeDetails(@Param('id') tradeId: string) {
    try {
      const trade = await this.autoTradingService.getTradeDetails(tradeId);
      if (!trade) {
        throw new HttpException(
          {
            success: false,
            message: 'Trade not found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        success: true,
        data: trade,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('trades/:id/cancel')
  async cancelTrade(@Param('id') tradeId: string) {
    try {
      const cancelled = await this.autoTradingService.cancelTrade(tradeId);
      if (!cancelled) {
        throw new HttpException(
          {
            success: false,
            message:
              'Unable to cancel trade - may already be executed or cancelled',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      return {
        success: true,
        message: 'Trade cancelled successfully',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('trades/:portfolioId/history')
  async getTradingHistory(@Param('portfolioId') portfolioId: string) {
    try {
      const history =
        await this.autoTradingService.getTradingHistory(portfolioId);
      return {
        success: true,
        data: history,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Utility Endpoints
  @Post('portfolio/:portfolioId/evaluate-rules')
  async evaluatePortfolioRules(@Param('portfolioId') portfolioId: string) {
    try {
      await this.autoTradingService.evaluatePortfolioRules(portfolioId);
      return {
        success: true,
        message: 'Rules evaluation completed',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('status/health')
  async getHealthStatus() {
    try {
      const activeSessions = await this.autoTradingService.getActiveSessions();
      return {
        success: true,
        data: {
          status: 'healthy',
          activeSessions: activeSessions.length,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Auto trading service is unhealthy',
          error: error.message,
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  // ============================================================================
  // AUTONOMOUS TRADING ENDPOINTS
  // ============================================================================

  @Post('autonomous/strategies/:strategyId/deploy')
  async deployStrategy(
    @Param('strategyId') strategyId: string,
    @Body() config: DeploymentConfig,
    @Query('userId') userId: string = 'default-user', // TODO: Get from auth context
  ) {
    try {
      const instance = await this.autoTradingService.deployStrategy(
        userId,
        strategyId,
        config,
      );
      return {
        success: true,
        data: instance,
        message: 'Strategy deployed successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('autonomous/strategies/:strategyId/stop')
  async stopStrategy(
    @Param('strategyId') strategyId: string,
    @Query('userId') userId: string = 'default-user',
  ) {
    try {
      await this.autoTradingService.stopStrategy(userId, strategyId);
      return {
        success: true,
        message: 'Strategy stopped successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('autonomous/strategies/:strategyId/pause')
  async pauseStrategy(
    @Param('strategyId') strategyId: string,
    @Query('userId') userId: string = 'default-user',
  ) {
    try {
      await this.autoTradingService.pauseStrategy(userId, strategyId);
      return {
        success: true,
        message: 'Strategy paused successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('autonomous/strategies/:strategyId/resume')
  async resumeStrategy(
    @Param('strategyId') strategyId: string,
    @Query('userId') userId: string = 'default-user',
  ) {
    try {
      await this.autoTradingService.resumeStrategy(userId, strategyId);
      return {
        success: true,
        message: 'Strategy resumed successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('autonomous/strategies/active')
  async getActiveStrategies(@Query('userId') userId: string = 'default-user') {
    try {
      const strategies =
        await this.autoTradingService.getActiveStrategies(userId);
      return {
        success: true,
        data: strategies,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('autonomous/strategies/:strategyId/performance')
  async getStrategyPerformance(
    @Param('strategyId') strategyId: string,
    @Query('userId') userId: string = 'default-user',
  ) {
    try {
      const performance = await this.autoTradingService.getStrategyPerformance(
        userId,
        strategyId,
      );
      return {
        success: true,
        data: performance,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  @Post('autonomous/strategies/:strategyId/backtest')
  async runBacktest(
    @Param('strategyId') strategyId: string,
    @Body()
    backtestConfig: {
      startDate: string;
      endDate: string;
      initialCapital: number;
    },
  ) {
    try {
      const result = await this.autoTradingService.runBacktest(
        strategyId,
        new Date(backtestConfig.startDate),
        new Date(backtestConfig.endDate),
        backtestConfig.initialCapital,
      );
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('autonomous/templates')
  async getStrategyTemplates() {
    try {
      const templates = await this.autoTradingService.getStrategyTemplates();
      return {
        success: true,
        data: templates,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('autonomous/templates/:templateId/create')
  async createStrategyFromTemplate(
    @Param('templateId') templateId: string,
    @Body()
    createConfig: {
      name: string;
      parameters: any;
    },
    @Query('userId') userId: string = 'default-user',
  ) {
    try {
      const strategy = await this.autoTradingService.createStrategyFromTemplate(
        userId,
        templateId,
        createConfig.name,
        createConfig.parameters,
      );
      return {
        success: true,
        data: strategy,
        message: 'Strategy created from template successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
