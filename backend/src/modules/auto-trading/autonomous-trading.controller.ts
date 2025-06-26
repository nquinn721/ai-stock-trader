import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AutonomousTradingService,
  DeploymentConfig,
  InstancePerformance,
} from './services/autonomous-trading.service';
import { BacktestingService } from './services/backtesting.service';
import { StrategyBuilderService } from './services/strategy-builder.service';

export class DeployStrategyDto {
  mode: 'paper' | 'live';
  initialCapital: number;
  maxPositions: number;
  executionFrequency: 'minute' | 'hour' | 'daily';
  symbols?: string[];
  riskLimits: {
    maxDrawdown: number;
    maxPositionSize: number;
    dailyLossLimit: number;
    correlationLimit: number;
  };
  notifications: {
    enabled: boolean;
    onTrade: boolean;
    onError: boolean;
    onRiskBreach: boolean;
    email?: string;
    webhook?: string;
  };
}

export class StrategyStatusResponse {
  id: string;
  strategyId: string;
  status: 'running' | 'paused' | 'stopped' | 'error';
  startedAt: Date;
  performance: InstancePerformance;
  errorCount: number;
  lastError?: string;
}

@ApiTags('autonomous-trading')
@Controller('api/autonomous-trading')
@ApiBearerAuth()
export class AutonomousTradingController {
  constructor(
    private readonly autonomousTradingService: AutonomousTradingService,
    private readonly strategyBuilderService: StrategyBuilderService,
    private readonly backtestingService: BacktestingService,
  ) {}

  @Post(':strategyId/deploy')
  @ApiOperation({ summary: 'Deploy an autonomous trading strategy' })
  @ApiResponse({ status: 201, description: 'Strategy deployed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid deployment configuration' })
  @ApiResponse({ status: 404, description: 'Strategy not found' })
  async deployStrategy(
    @Param('strategyId') strategyId: string,
    @Body() deploymentConfig: DeployStrategyDto,
    @Query('userId') userId: string, // In a real app, this would come from JWT token
  ): Promise<StrategyStatusResponse> {
    const instance = await this.autonomousTradingService.deployStrategy(
      userId,
      strategyId,
      deploymentConfig as DeploymentConfig,
    );

    return {
      id: instance.id,
      strategyId: instance.strategyId,
      status: instance.status,
      startedAt: instance.startedAt,
      performance: instance.performance,
      errorCount: instance.errorCount,
      lastError: instance.lastError,
    };
  }

  @Put(':strategyId/stop')
  @ApiOperation({ summary: 'Stop a running autonomous trading strategy' })
  @ApiResponse({ status: 200, description: 'Strategy stopped successfully' })
  @ApiResponse({ status: 404, description: 'Strategy not found' })
  async stopStrategy(
    @Param('strategyId') strategyId: string,
    @Query('userId') userId: string,
  ): Promise<{ message: string }> {
    await this.autonomousTradingService.stopStrategy(userId, strategyId);
    return { message: 'Strategy stopped successfully' };
  }

  @Put(':strategyId/pause')
  @ApiOperation({ summary: 'Pause a running autonomous trading strategy' })
  @ApiResponse({ status: 200, description: 'Strategy paused successfully' })
  @ApiResponse({ status: 404, description: 'Strategy not found' })
  async pauseStrategy(
    @Param('strategyId') strategyId: string,
    @Query('userId') userId: string,
  ): Promise<{ message: string }> {
    await this.autonomousTradingService.pauseStrategy(userId, strategyId);
    return { message: 'Strategy paused successfully' };
  }

  @Put(':strategyId/resume')
  @ApiOperation({ summary: 'Resume a paused autonomous trading strategy' })
  @ApiResponse({ status: 200, description: 'Strategy resumed successfully' })
  @ApiResponse({ status: 404, description: 'Strategy not found' })
  async resumeStrategy(
    @Param('strategyId') strategyId: string,
    @Query('userId') userId: string,
  ): Promise<{ message: string }> {
    await this.autonomousTradingService.resumeStrategy(userId, strategyId);
    return { message: 'Strategy resumed successfully' };
  }

  @Get('strategies')
  @ApiOperation({ summary: 'Get all running strategies for a user' })
  @ApiResponse({ status: 200, description: 'List of running strategies' })
  async getRunningStrategies(
    @Query('userId') userId: string,
  ): Promise<StrategyStatusResponse[]> {
    const instances =
      await this.autonomousTradingService.getRunningStrategies(userId);

    return instances.map((instance) => ({
      id: instance.id,
      strategyId: instance.strategyId,
      status: instance.status,
      startedAt: instance.startedAt,
      performance: instance.performance,
      errorCount: instance.errorCount,
      lastError: instance.lastError,
    }));
  }

  @Get(':strategyId/performance')
  @ApiOperation({ summary: 'Get performance metrics for a strategy' })
  @ApiResponse({ status: 200, description: 'Strategy performance metrics' })
  @ApiResponse({ status: 404, description: 'Strategy not found' })
  async getStrategyPerformance(
    @Param('strategyId') strategyId: string,
    @Query('userId') userId: string,
  ): Promise<InstancePerformance> {
    return await this.autonomousTradingService.getStrategyPerformance(
      userId,
      strategyId,
    );
  }

  @Get(':strategyId/status')
  @ApiOperation({ summary: 'Get current status of a strategy' })
  @ApiResponse({ status: 200, description: 'Strategy status' })
  @ApiResponse({ status: 404, description: 'Strategy not found' })
  async getStrategyStatus(
    @Param('strategyId') strategyId: string,
    @Query('userId') userId: string,
  ): Promise<StrategyStatusResponse> {
    const instances =
      await this.autonomousTradingService.getRunningStrategies(userId);
    const instance = instances.find((i) => i.strategyId === strategyId);

    if (!instance) {
      throw new Error('Strategy not found or not running');
    }

    return {
      id: instance.id,
      strategyId: instance.strategyId,
      status: instance.status,
      startedAt: instance.startedAt,
      performance: instance.performance,
      errorCount: instance.errorCount,
      lastError: instance.lastError,
    };
  }

  @Get('marketplace/strategies')
  @ApiOperation({
    summary: 'Get available strategy templates from marketplace',
  })
  @ApiResponse({ status: 200, description: 'List of strategy templates' })
  async getMarketplaceStrategies(): Promise<any[]> {
    // This would integrate with a strategy marketplace
    return [
      {
        id: 'momentum-breakout-v1',
        name: 'Momentum Breakout Strategy',
        description:
          'Trades breakouts above resistance with volume confirmation',
        category: 'momentum',
        complexity: 'beginner',
        backtestResults: {
          sharpeRatio: 1.8,
          maxDrawdown: -8.5,
          winRate: 68,
          totalReturn: 24.5,
        },
        rating: 4.5,
        downloads: 1247,
        creator: 'QuantTrader Pro',
      },
      {
        id: 'mean-reversion-rsi-v2',
        name: 'RSI Mean Reversion',
        description: 'Buys oversold conditions and sells overbought using RSI',
        category: 'mean-reversion',
        complexity: 'intermediate',
        backtestResults: {
          sharpeRatio: 1.4,
          maxDrawdown: -12.3,
          winRate: 72,
          totalReturn: 18.2,
        },
        rating: 4.2,
        downloads: 892,
        creator: 'AlgoMaster',
      },
      {
        id: 'ai-sentiment-trader-v1',
        name: 'AI Sentiment Trader',
        description:
          'Uses machine learning and news sentiment for trading decisions',
        category: 'ai-enhanced',
        complexity: 'advanced',
        backtestResults: {
          sharpeRatio: 2.1,
          maxDrawdown: -7.2,
          winRate: 58,
          totalReturn: 31.8,
        },
        rating: 4.7,
        downloads: 2156,
        creator: 'ML Trading Labs',
      },
    ];
  }

  @Post('marketplace/strategies/:templateId/clone')
  @ApiOperation({ summary: 'Clone a strategy template from marketplace' })
  @ApiResponse({
    status: 201,
    description: 'Strategy template cloned successfully',
  })
  async cloneStrategyTemplate(
    @Param('templateId') templateId: string,
    @Query('userId') userId: string,
    @Body('customizations') customizations?: any,
  ): Promise<{ strategyId: string; message: string }> {
    // This would clone a strategy template and customize it
    const strategyId = `cloned-${templateId}-${Date.now()}`;

    // In a real implementation, this would:
    // 1. Fetch the template configuration
    // 2. Apply customizations
    // 3. Create a new strategy for the user

    return {
      strategyId,
      message: 'Strategy template cloned successfully',
    };
  }

  @Get('component-library')
  @ApiOperation({
    summary: 'Get available strategy components for visual builder',
  })
  @ApiResponse({ status: 200, description: 'List of strategy components' })
  async getComponentLibrary(): Promise<any> {
    return {
      indicators: [
        {
          id: 'rsi',
          name: 'Relative Strength Index (RSI)',
          category: 'momentum',
          description: 'Measures overbought/oversold conditions',
          parameters: [
            { name: 'period', type: 'number', default: 14, min: 2, max: 50 },
            {
              name: 'overbought',
              type: 'number',
              default: 70,
              min: 50,
              max: 90,
            },
            { name: 'oversold', type: 'number', default: 30, min: 10, max: 50 },
          ],
        },
        {
          id: 'macd',
          name: 'MACD',
          category: 'trend',
          description: 'Moving Average Convergence Divergence',
          parameters: [
            {
              name: 'fastPeriod',
              type: 'number',
              default: 12,
              min: 5,
              max: 20,
            },
            {
              name: 'slowPeriod',
              type: 'number',
              default: 26,
              min: 20,
              max: 35,
            },
            {
              name: 'signalPeriod',
              type: 'number',
              default: 9,
              min: 5,
              max: 15,
            },
          ],
        },
        {
          id: 'bollinger_bands',
          name: 'Bollinger Bands',
          category: 'volatility',
          description: 'Price bands around moving average',
          parameters: [
            { name: 'period', type: 'number', default: 20, min: 10, max: 50 },
            { name: 'stdDev', type: 'number', default: 2, min: 1, max: 3 },
          ],
        },
      ],
      conditions: [
        {
          id: 'price_above',
          name: 'Price Above',
          type: 'comparison',
          description: 'Price is above specified value or indicator',
          parameters: [
            { name: 'threshold', type: 'number', required: true },
            { name: 'percentage', type: 'boolean', default: false },
          ],
        },
        {
          id: 'indicator_cross',
          name: 'Indicator Cross',
          type: 'signal',
          description: 'Indicator crosses above/below another line',
          parameters: [
            {
              name: 'direction',
              type: 'select',
              options: ['above', 'below'],
              required: true,
            },
            {
              name: 'confirmationBars',
              type: 'number',
              default: 1,
              min: 1,
              max: 5,
            },
          ],
        },
        {
          id: 'volume_surge',
          name: 'Volume Surge',
          type: 'volume',
          description: 'Volume is above average by specified multiplier',
          parameters: [
            {
              name: 'multiplier',
              type: 'number',
              default: 1.5,
              min: 1.1,
              max: 5.0,
            },
            {
              name: 'lookbackPeriod',
              type: 'number',
              default: 20,
              min: 5,
              max: 50,
            },
          ],
        },
      ],
      actions: [
        {
          id: 'buy_market',
          name: 'Buy Market Order',
          type: 'order',
          description: 'Buy at current market price',
          parameters: [
            {
              name: 'positionSize',
              type: 'select',
              options: ['fixed', 'percentage', 'risk_based'],
              default: 'percentage',
            },
            { name: 'amount', type: 'number', required: true },
          ],
        },
        {
          id: 'sell_limit',
          name: 'Sell Limit Order',
          type: 'order',
          description: 'Sell at specified limit price',
          parameters: [
            { name: 'limitPrice', type: 'number', required: true },
            { name: 'percentageAboveEntry', type: 'number', default: 0 },
          ],
        },
        {
          id: 'stop_loss',
          name: 'Stop Loss',
          type: 'risk_management',
          description: 'Exit position if loss exceeds threshold',
          parameters: [
            {
              name: 'stopType',
              type: 'select',
              options: ['fixed', 'trailing', 'atr'],
              default: 'fixed',
            },
            { name: 'stopDistance', type: 'number', required: true },
          ],
        },
      ],
      riskManagement: [
        {
          id: 'position_sizing',
          name: 'Position Sizing',
          description: 'Controls how much capital to risk per trade',
          parameters: [
            {
              name: 'method',
              type: 'select',
              options: ['fixed', 'percentage', 'kelly', 'volatility'],
              default: 'percentage',
            },
            {
              name: 'riskAmount',
              type: 'number',
              default: 2,
              min: 0.1,
              max: 10,
            },
          ],
        },
        {
          id: 'correlation_filter',
          name: 'Correlation Filter',
          description: 'Prevents taking correlated positions',
          parameters: [
            {
              name: 'maxCorrelation',
              type: 'number',
              default: 0.7,
              min: 0.1,
              max: 1.0,
            },
            {
              name: 'lookbackPeriod',
              type: 'number',
              default: 30,
              min: 10,
              max: 100,
            },
          ],
        },
      ],
    };
  }
}
