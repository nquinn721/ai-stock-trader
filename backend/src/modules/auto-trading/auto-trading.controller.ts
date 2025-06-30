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
import { AutoTradingService } from './auto-trading.service';
import {
  CreateAdvancedOrderDto,
  ModifyAdvancedOrderDto,
} from './dto/advanced-order.dto';
import { TradeFiltersDto } from './dto/auto-trade-config.dto';
import {
  CreateTradingRuleDto,
  UpdateTradingRuleDto,
} from './dto/create-trading-rule.dto';
import { DeploymentConfigDto } from './dto/deployment-config.dto';
import {
  StopTradingSessionDto,
  TradingSessionDto,
} from './dto/trading-session.dto';
import { AdvancedOrderExecutionService } from './services/advanced-order-execution.service';
import { AutoTradingOrderPreviewService } from './services/auto-trading-order-preview.service';

@Controller('auto-trading')
export class AutoTradingController {
  constructor(
    private readonly autoTradingService: AutoTradingService,
    private readonly autoTradingOrderPreviewService: AutoTradingOrderPreviewService,
    private readonly advancedOrderExecutionService: AdvancedOrderExecutionService,
  ) {}

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
    console.log('=== SESSION DTO RECEIVED ===');
    console.log('Raw body:', JSON.stringify(sessionDto, null, 2));
    console.log('portfolio_id:', sessionDto.portfolio_id);
    console.log('session_name:', sessionDto.session_name);
    console.log('config:', JSON.stringify(sessionDto.config, null, 2));
    console.log('==========================');
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
    @Body() config: DeploymentConfigDto,
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

  @Post('autonomous/portfolios/:portfolioId/auto-deploy')
  async autoDeployStrategyForPortfolio(
    @Param('portfolioId') portfolioId: string,
    @Query('userId') userId: string = 'default-user',
  ) {
    try {
      const instance =
        await this.autoTradingService.autoDeployStrategyForPortfolio(
          userId,
          portfolioId,
        );
      return {
        success: true,
        data: instance,
        message:
          'Strategy automatically deployed based on portfolio balance and PDT eligibility',
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

  // ============================================================================
  // AUTO TRADING ORDER PREVIEW ENDPOINTS (S41)
  // ============================================================================

  @Get('orders/preview/:portfolioId')
  async getPendingOrders(@Param('portfolioId') portfolioId: string) {
    try {
      const orders =
        await this.autoTradingOrderPreviewService.getPendingOrdersForPortfolio(
          Number(portfolioId),
        );
      return {
        success: true,
        data: orders,
        count: orders.length,
        message: 'Pending auto trading orders retrieved successfully',
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

  @Post('orders/approve/:orderId')
  async approveOrder(@Param('orderId') orderId: string) {
    try {
      const order =
        await this.autoTradingOrderPreviewService.approveOrder(orderId);
      return {
        success: true,
        data: order,
        message: 'Auto trading order approved successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.message.includes('not found')
          ? HttpStatus.NOT_FOUND
          : HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('orders/reject/:orderId')
  async rejectOrder(
    @Param('orderId') orderId: string,
    @Body() body: { reason?: string },
  ) {
    try {
      const order = await this.autoTradingOrderPreviewService.rejectOrder(
        orderId,
        body.reason,
      );
      return {
        success: true,
        data: order,
        message: 'Auto trading order rejected successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.message.includes('not found')
          ? HttpStatus.NOT_FOUND
          : HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put('orders/modify/:orderId')
  async modifyOrder(
    @Param('orderId') orderId: string,
    @Body() updateDto: any, // Using any for now, would use UpdateAutoTradingOrderDto
  ) {
    try {
      const order = await this.autoTradingOrderPreviewService.modifyOrder(
        orderId,
        updateDto,
      );
      return {
        success: true,
        data: order,
        message: 'Auto trading order modified successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.message.includes('not found')
          ? HttpStatus.NOT_FOUND
          : HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('orders/status/:portfolioId')
  async getOrderStatusSummary(@Param('portfolioId') portfolioId: string) {
    try {
      const summary =
        await this.autoTradingOrderPreviewService.getOrderStatusSummary(
          Number(portfolioId),
        );
      return {
        success: true,
        data: summary,
        message: 'Order status summary retrieved successfully',
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

  @Post('orders/bulk/approve')
  async bulkApproveOrders(@Body() body: { orderIds: string[] }) {
    try {
      const orders =
        await this.autoTradingOrderPreviewService.bulkApproveOrders(
          body.orderIds,
        );
      return {
        success: true,
        data: orders,
        count: orders.length,
        message: `${orders.length} orders approved successfully`,
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

  @Post('orders/bulk/reject')
  async bulkRejectOrders(
    @Body() body: { orderIds: string[]; reason?: string },
  ) {
    try {
      const orders = await this.autoTradingOrderPreviewService.bulkRejectOrders(
        body.orderIds,
        body.reason,
      );
      return {
        success: true,
        data: orders,
        count: orders.length,
        message: `${orders.length} orders rejected successfully`,
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

  @Delete('orders/expired')
  async cleanupExpiredOrders() {
    try {
      await this.autoTradingOrderPreviewService.cleanupExpiredOrders();
      return {
        success: true,
        message: 'Expired orders cleanup completed',
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

  // === Advanced Order Execution Endpoints ===

  /**
   * Create an advanced auto trading order with sophisticated features
   */
  @Post('orders/advanced')
  async createAdvancedOrder(@Body() createDto: CreateAdvancedOrderDto) {
    try {
      const advancedOrder =
        await this.advancedOrderExecutionService.createAdvancedOrder(createDto);

      return {
        success: true,
        data: advancedOrder,
        message: 'Advanced order created successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
          error: error.name,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Get advanced order by ID
   */
  @Get('orders/advanced/:orderId')
  async getAdvancedOrder(@Param('orderId') orderId: string) {
    try {
      const order =
        await this.advancedOrderExecutionService.getAdvancedOrder(orderId);

      return {
        success: true,
        data: order,
        message: 'Advanced order retrieved successfully',
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

  /**
   * Get all advanced orders for a portfolio
   */
  @Get('orders/advanced/portfolio/:portfolioId')
  async getAdvancedOrdersByPortfolio(
    @Param('portfolioId') portfolioId: number,
  ) {
    try {
      const orders =
        await this.advancedOrderExecutionService.getAdvancedOrdersByPortfolio(
          portfolioId,
        );

      return {
        success: true,
        data: orders,
        message: 'Advanced orders retrieved successfully',
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

  /**
   * Cancel an advanced order
   */
  @Put('orders/advanced/:orderId/cancel')
  async cancelAdvancedOrder(@Param('orderId') orderId: string) {
    try {
      const result =
        await this.advancedOrderExecutionService.cancelAdvancedOrder(orderId);

      return {
        success: true,
        data: result,
        message: 'Advanced order cancelled successfully',
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

  /**
   * Modify an advanced order
   */
  @Put('orders/advanced/:orderId')
  async modifyAdvancedOrder(
    @Param('orderId') orderId: string,
    @Body() modifyDto: ModifyAdvancedOrderDto,
  ) {
    try {
      const result =
        await this.advancedOrderExecutionService.modifyAdvancedOrder(
          orderId,
          modifyDto,
        );

      return {
        success: true,
        data: result,
        message: 'Advanced order modified successfully',
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

  /**
   * Get execution analytics for advanced orders
   */
  @Get('orders/advanced/analytics/:portfolioId')
  async getAdvancedOrderAnalytics(
    @Param('portfolioId') portfolioId: number,
    @Query('timeRange') timeRange?: string,
  ) {
    try {
      const analytics =
        await this.advancedOrderExecutionService.getExecutionAnalytics(
          portfolioId,
          timeRange,
        );

      return {
        success: true,
        data: analytics,
        message: 'Execution analytics retrieved successfully',
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

  /**
   * Get real-time monitoring data for active orders
   */
  @Get('orders/advanced/monitoring/:portfolioId')
  async getAdvancedOrderMonitoring(@Param('portfolioId') portfolioId: number) {
    try {
      const monitoring =
        await this.advancedOrderExecutionService.getOrderMonitoring(
          portfolioId,
        );

      return {
        success: true,
        data: monitoring,
        message: 'Order monitoring data retrieved successfully',
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
