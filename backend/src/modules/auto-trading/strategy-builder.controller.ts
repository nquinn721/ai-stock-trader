import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { BacktestResult } from './entities/backtest-result.entity';
import { StrategyTemplate } from './entities/strategy-template.entity';
import { TradingStrategy } from './entities/trading-strategy.entity';
import {
  AutonomousTradingService,
  DeploymentConfig,
} from './services/autonomous-trading.service';
import {
  BacktestingService,
  BacktestParams,
} from './services/backtesting.service';
import {
  StrategyBuilderService,
  StrategyConfig,
} from './services/strategy-builder.service';

export class CreateStrategyDto {
  name: string;
  description: string;
  components: any[];
  riskRules: any[];
  symbols?: string[];
  timeframe?: string;
}

export class UpdateStrategyDto {
  name?: string;
  description?: string;
  components?: any[];
  riskRules?: any[];
  symbols?: string[];
  timeframe?: string;
}

export class RunBacktestDto {
  startDate: string;
  endDate: string;
  initialCapital: number;
  symbols: string[];
  commission?: number;
  slippage?: number;
}

export class DeployStrategyDto {
  portfolioId: string;
  maxCapitalAllocation: number;
  riskLimits: {
    maxDrawdown: number;
    maxDailyLoss: number;
    maxPositionSize: number;
  };
  tradingHours?: {
    start: string;
    end: string;
    timezone: string;
  };
  enablePaperTrading: boolean;
  autoRebalance?: boolean;
  notificationSettings?: {
    onTrade: boolean;
    onError: boolean;
    onDaily: boolean;
  };
}

@Controller('api/strategy-builder')
export class StrategyBuilderController {
  constructor(
    private readonly strategyBuilderService: StrategyBuilderService,
    private readonly backtestingService: BacktestingService,
    private readonly autonomousTradingService: AutonomousTradingService,
  ) {}

  // Strategy Management
  @Post('strategies')
  async createStrategy(
    @Body() createStrategyDto: CreateStrategyDto,
    @Query('userId') userId: string,
  ): Promise<TradingStrategy> {
    const strategyConfig: StrategyConfig = {
      name: createStrategyDto.name,
      description: createStrategyDto.description,
      components: createStrategyDto.components,
      riskRules: createStrategyDto.riskRules,
      symbols: createStrategyDto.symbols,
      timeframe: createStrategyDto.timeframe,
    };

    return await this.strategyBuilderService.createStrategy(
      userId,
      strategyConfig,
    );
  }

  @Get('strategies')
  async getUserStrategies(
    @Query('userId') userId: string,
  ): Promise<TradingStrategy[]> {
    return await this.strategyBuilderService.getUserStrategies(userId);
  }

  @Get('strategies/:id')
  async getStrategy(@Param('id') strategyId: string): Promise<TradingStrategy> {
    return await this.strategyBuilderService.getStrategy(strategyId);
  }

  @Put('strategies/:id')
  async updateStrategy(
    @Param('id') strategyId: string,
    @Body() updateStrategyDto: UpdateStrategyDto,
  ): Promise<TradingStrategy> {
    return await this.strategyBuilderService.updateStrategy(
      strategyId,
      updateStrategyDto,
    );
  }

  @Delete('strategies/:id')
  async deleteStrategy(@Param('id') strategyId: string): Promise<void> {
    return await this.strategyBuilderService.deleteStrategy(strategyId);
  }

  @Post('strategies/:id/duplicate')
  async duplicateStrategy(
    @Param('id') strategyId: string,
    @Query('userId') userId: string,
    @Body('newName') newName?: string,
  ): Promise<TradingStrategy> {
    return await this.strategyBuilderService.duplicateStrategy(
      strategyId,
      userId,
      newName,
    );
  }

  @Post('strategies/:id/validate')
  async validateStrategy(@Param('id') strategyId: string): Promise<any> {
    const strategy = await this.strategyBuilderService.getStrategy(strategyId);
    return await this.strategyBuilderService.validateStrategy(strategy);
  }

  @Post('strategies/:id/publish')
  async publishStrategy(@Param('id') strategyId: string): Promise<void> {
    return await this.strategyBuilderService.publishStrategy(strategyId);
  }

  // Strategy Templates
  @Get('templates')
  async getStrategyTemplates(): Promise<StrategyTemplate[]> {
    return await this.strategyBuilderService.getStrategyTemplates();
  }

  @Post('strategies/from-template/:templateId')
  async createStrategyFromTemplate(
    @Param('templateId') templateId: string,
    @Query('userId') userId: string,
    @Body() customizations?: Partial<StrategyConfig>,
  ): Promise<TradingStrategy> {
    return await this.strategyBuilderService.createStrategyFromTemplate(
      templateId,
      userId,
      customizations,
    );
  }

  // Strategy Marketplace
  @Get('marketplace')
  async getPublishedStrategies(
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ): Promise<TradingStrategy[]> {
    return await this.strategyBuilderService.getPublishedStrategies(
      limit,
      offset,
    );
  }

  // Backtesting
  @Post('strategies/:id/backtest')
  async runBacktest(
    @Param('id') strategyId: string,
    @Body() backtestDto: RunBacktestDto,
  ): Promise<BacktestResult> {
    const strategy = await this.strategyBuilderService.getStrategy(strategyId);

    const backtestParams: BacktestParams = {
      startDate: new Date(backtestDto.startDate),
      endDate: new Date(backtestDto.endDate),
      initialCapital: backtestDto.initialCapital,
      symbols: backtestDto.symbols,
      commission: backtestDto.commission,
      slippage: backtestDto.slippage,
    };

    return await this.backtestingService.runBacktest(strategy, backtestParams);
  }

  @Get('strategies/:id/backtest-results')
  async getBacktestResults(
    @Param('id') strategyId: string,
  ): Promise<BacktestResult[]> {
    return await this.backtestingService.getBacktestResults(strategyId);
  }

  @Get('backtest-results/:id')
  async getBacktestResult(
    @Param('id') backtestId: string,
  ): Promise<BacktestResult> {
    return await this.backtestingService.getBacktestResult(backtestId);
  }

  @Delete('backtest-results/:id')
  async deleteBacktestResult(@Param('id') backtestId: string): Promise<void> {
    return await this.backtestingService.deleteBacktestResult(backtestId);
  }

  // Autonomous Trading Deployment
  @Post('strategies/:id/deploy')
  async deployStrategy(
    @Param('id') strategyId: string,
    @Body() deploymentDto: DeployStrategyDto,
  ): Promise<any> {
    const deploymentConfig: DeploymentConfig = {
      mode: deploymentDto.enablePaperTrading ? 'paper' : 'live',
      initialCapital: deploymentDto.maxCapitalAllocation,
      maxPositions: 10, // Default value
      riskLimits: {
        maxDrawdown: deploymentDto.riskLimits.maxDrawdown,
        maxPositionSize: deploymentDto.riskLimits.maxPositionSize,
        dailyLossLimit: deploymentDto.riskLimits.maxDailyLoss,
        correlationLimit: 0.7, // Default value
      },
      executionFrequency: 'minute',
      symbols: ['AAPL'], // Default symbols
      notifications: {
        enabled: true,
        onTrade: true,
        onError: deploymentDto.notificationSettings?.onError || false,
        onRiskBreach: true,
        email: 'user@example.com', // Default or from user context
        webhook: undefined,
      },
    };

    const userId = 'current-user'; // This should come from authentication
    const instance = await this.autonomousTradingService.deployStrategy(
      userId,
      strategyId,
      deploymentConfig,
    );
    return {
      instanceId: instance.id,
      status: instance.status,
      deployedAt: instance.startedAt,
    };
  }

  @Post('strategies/:id/stop')
  async stopStrategy(@Param('id') strategyId: string): Promise<void> {
    const userId = 'current-user'; // This should come from authentication
    return await this.autonomousTradingService.stopStrategy(userId, strategyId);
  }

  @Post('strategies/:id/pause')
  async pauseStrategy(@Param('id') strategyId: string): Promise<void> {
    const userId = 'current-user'; // This should come from authentication
    return await this.autonomousTradingService.pauseStrategy(
      userId,
      strategyId,
    );
  }

  @Post('strategies/:id/resume')
  async resumeStrategy(@Param('id') strategyId: string): Promise<void> {
    const userId = 'current-user'; // This should come from authentication
    return await this.autonomousTradingService.resumeStrategy(
      userId,
      strategyId,
    );
  }

  @Get('strategies/:id/performance')
  async getStrategyPerformance(@Param('id') strategyId: string): Promise<any> {
    const userId = 'current-user'; // This should come from authentication
    return await this.autonomousTradingService.getStrategyPerformance(
      userId,
      strategyId,
    );
  }

  @Get('deployed-strategies')
  async getRunningStrategies(): Promise<any[]> {
    const userId = 'current-user'; // This should come from authentication
    const instances =
      await this.autonomousTradingService.getRunningStrategies(userId);
    return instances.map((instance) => ({
      id: instance.id,
      name: instance.strategy.name,
      status: instance.status,
      deployedAt: instance.startedAt,
      performance: instance.performance,
    }));
  }

  @Get('strategies/:id/instance')
  async getStrategyInstance(
    @Param('id') strategyId: string,
    @Query('userId') userId: string,
  ): Promise<any> {
    const instances =
      await this.autonomousTradingService.getRunningStrategies(userId);
    const instance = instances.find((inst) => inst.strategyId === strategyId);
    if (!instance) {
      throw new Error('Strategy instance not found');
    }

    return {
      id: instance.id,
      name: instance.strategy.name,
      status: instance.status,
      deployedAt: instance.startedAt,
      performance: instance.performance,
      config: instance.config,
      errorCount: instance.errorCount,
      lastError: instance.lastError,
    };
  }

  // Component Library
  @Get('components')
  async getComponentLibrary(): Promise<any> {
    return {
      indicators: [
        {
          id: 'rsi',
          name: 'RSI',
          category: 'momentum',
          description: 'Relative Strength Index',
          parameters: {
            period: { type: 'number', default: 14, min: 2, max: 100 },
          },
        },
        {
          id: 'macd',
          name: 'MACD',
          category: 'trend',
          description: 'Moving Average Convergence Divergence',
          parameters: {
            fastPeriod: { type: 'number', default: 12, min: 2, max: 50 },
            slowPeriod: { type: 'number', default: 26, min: 2, max: 100 },
            signalPeriod: { type: 'number', default: 9, min: 2, max: 50 },
          },
        },
        {
          id: 'bb',
          name: 'Bollinger Bands',
          category: 'volatility',
          description: 'Bollinger Bands volatility indicator',
          parameters: {
            period: { type: 'number', default: 20, min: 2, max: 100 },
            standardDeviations: { type: 'number', default: 2, min: 1, max: 4 },
          },
        },
      ],
      conditions: [
        {
          id: 'price_above',
          name: 'Price Above',
          type: 'comparison',
          description: 'Trigger when price is above a value',
          parameters: {
            value: { type: 'number', required: true },
            operator: { type: 'enum', values: ['>', '>='], default: '>' },
          },
        },
        {
          id: 'price_below',
          name: 'Price Below',
          type: 'comparison',
          description: 'Trigger when price is below a value',
          parameters: {
            value: { type: 'number', required: true },
            operator: { type: 'enum', values: ['<', '<='], default: '<' },
          },
        },
        {
          id: 'rsi_oversold',
          name: 'RSI Oversold',
          type: 'signal',
          description: 'Trigger when RSI is oversold',
          parameters: {
            threshold: { type: 'number', default: 30, min: 0, max: 50 },
            period: { type: 'number', default: 14, min: 2, max: 100 },
          },
        },
        {
          id: 'rsi_overbought',
          name: 'RSI Overbought',
          type: 'signal',
          description: 'Trigger when RSI is overbought',
          parameters: {
            threshold: { type: 'number', default: 70, min: 50, max: 100 },
            period: { type: 'number', default: 14, min: 2, max: 100 },
          },
        },
        {
          id: 'volume_spike',
          name: 'Volume Spike',
          type: 'signal',
          description: 'Trigger on unusual volume',
          parameters: {
            threshold: { type: 'number', default: 2, min: 1, max: 10 },
            lookbackPeriod: { type: 'number', default: 20, min: 5, max: 100 },
          },
        },
      ],
      actions: [
        {
          id: 'buy_market',
          name: 'Buy Market',
          type: 'order',
          description: 'Execute a market buy order',
          parameters: {
            quantity: { type: 'number', required: true, min: 1 },
            maxSlippage: { type: 'number', default: 0.1, min: 0, max: 5 },
          },
        },
        {
          id: 'sell_market',
          name: 'Sell Market',
          type: 'order',
          description: 'Execute a market sell order',
          parameters: {
            quantity: { type: 'number', required: true, min: 1 },
            maxSlippage: { type: 'number', default: 0.1, min: 0, max: 5 },
          },
        },
        {
          id: 'buy_limit',
          name: 'Buy Limit',
          type: 'order',
          description: 'Execute a limit buy order',
          parameters: {
            quantity: { type: 'number', required: true, min: 1 },
            limitPrice: { type: 'number', required: true, min: 0 },
            timeInForce: {
              type: 'enum',
              values: ['GTC', 'DAY', 'IOC'],
              default: 'GTC',
            },
          },
        },
        {
          id: 'sell_limit',
          name: 'Sell Limit',
          type: 'order',
          description: 'Execute a limit sell order',
          parameters: {
            quantity: { type: 'number', required: true, min: 1 },
            limitPrice: { type: 'number', required: true, min: 0 },
            timeInForce: {
              type: 'enum',
              values: ['GTC', 'DAY', 'IOC'],
              default: 'GTC',
            },
          },
        },
      ],
      riskRules: [
        {
          id: 'position_size_fixed',
          name: 'Fixed Position Size',
          type: 'position_size',
          description: 'Use a fixed number of shares',
          parameters: {
            amount: { type: 'number', required: true, min: 1 },
          },
        },
        {
          id: 'position_size_percentage',
          name: 'Percentage Position Size',
          type: 'position_size',
          description: 'Use a percentage of portfolio value',
          parameters: {
            percentage: { type: 'number', required: true, min: 0.1, max: 100 },
          },
        },
        {
          id: 'stop_loss',
          name: 'Stop Loss',
          type: 'stop_loss',
          description: 'Exit position on loss threshold',
          parameters: {
            percentage: { type: 'number', required: true, min: 0.1, max: 50 },
          },
        },
        {
          id: 'take_profit',
          name: 'Take Profit',
          type: 'take_profit',
          description: 'Exit position on profit target',
          parameters: {
            percentage: { type: 'number', required: true, min: 0.1, max: 200 },
          },
        },
      ],
    };
  }
}
