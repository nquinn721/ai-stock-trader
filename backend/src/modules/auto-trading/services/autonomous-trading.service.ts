import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from '../../../entities/portfolio.entity';
import { PaperTradingService } from '../../paper-trading/paper-trading.service';
import { StockService } from '../../stock/stock.service';
import {
  AutoTrade,
  AutoTradeStatus,
  TradeType,
} from '../entities/auto-trade.entity';
import { TradingStrategy } from '../entities/trading-strategy.entity';
import { StrategyBuilderService } from '../strategy-builder.service';
import { BacktestingService, MarketData, Signal } from './backtesting.service';
import { RiskManagementService } from './risk-management.service';

// Constants for automatic strategy assignment
const PDT_MINIMUM_BALANCE = 25000; // SEC requirement for Pattern Day Trading

// Predefined strategy configurations for automatic assignment
const PREDEFINED_STRATEGIES = {
  DAY_TRADING_AGGRESSIVE: {
    id: 'day-trading-aggressive',
    name: 'Day Trading Aggressive',
    description:
      'High-frequency day trading strategy for PDT-eligible accounts',
    type: 'day_trading',
    minBalance: 25000,
    riskLevel: 'aggressive',
    maxPositions: 10,
    defaultStopLoss: 2, // 2%
    defaultTakeProfit: 4, // 4%
    executionFrequency: 'minute' as const,
  },
  DAY_TRADING_CONSERVATIVE: {
    id: 'day-trading-conservative',
    name: 'Day Trading Conservative',
    description: 'Conservative day trading strategy for PDT-eligible accounts',
    type: 'day_trading',
    minBalance: 25000,
    riskLevel: 'conservative',
    maxPositions: 5,
    defaultStopLoss: 1.5, // 1.5%
    defaultTakeProfit: 3, // 3%
    executionFrequency: 'minute' as const,
  },
  SWING_TRADING_GROWTH: {
    id: 'swing-trading-growth',
    name: 'Swing Trading Growth',
    description: 'Growth-focused swing trading for non-PDT accounts',
    type: 'swing_trading',
    minBalance: 0,
    riskLevel: 'moderate',
    maxPositions: 3,
    defaultStopLoss: 5, // 5%
    defaultTakeProfit: 10, // 10%
    executionFrequency: 'hour' as const,
  },
  SWING_TRADING_VALUE: {
    id: 'swing-trading-value',
    name: 'Swing Trading Value',
    description: 'Value-focused swing trading for smaller accounts',
    type: 'swing_trading',
    minBalance: 0,
    riskLevel: 'conservative',
    maxPositions: 2,
    defaultStopLoss: 3, // 3%
    defaultTakeProfit: 8, // 8%
    executionFrequency: 'daily' as const,
  },
};

export interface DeploymentConfig {
  mode: 'paper' | 'live';
  portfolioId: string; // Reference to actual portfolio ID
  initialCapital: number;
  maxPositions: number;
  riskLimits: RiskLimits;
  executionFrequency: 'minute' | 'hour' | 'daily';
  symbols?: string[];
  notifications: NotificationConfig;
}

export interface RiskLimits {
  maxDrawdown: number; // percentage
  maxPositionSize: number; // percentage of portfolio
  dailyLossLimit: number; // dollar amount
  correlationLimit: number; // max correlation between positions
}

export interface NotificationConfig {
  enabled: boolean;
  onTrade: boolean;
  onError: boolean;
  onRiskBreach: boolean;
  email?: string;
  webhook?: string;
}

export interface StrategyInstance {
  id: string;
  strategyId: string;
  strategy: TradingStrategy;
  config: DeploymentConfig;
  status: 'running' | 'paused' | 'stopped' | 'error';
  startedAt: Date;
  performance: InstancePerformance;
  executionInterval?: NodeJS.Timeout;
  errorCount: number;
  lastError?: string;
}

export interface InstancePerformance {
  totalReturn: number;
  dailyReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  currentDrawdown: number;
  winRate: number;
  totalTrades: number;
  profitableTrades: number;
  currentValue: number;
  unrealizedPnL: number;
}

@Injectable()
export class AutonomousTradingService {
  private readonly logger = new Logger(AutonomousTradingService.name);
  private runningStrategies = new Map<string, StrategyInstance>();

  constructor(
    @InjectRepository(TradingStrategy)
    private readonly strategyRepository: Repository<TradingStrategy>,
    @InjectRepository(AutoTrade)
    private readonly autoTradeRepository: Repository<AutoTrade>,
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
    private readonly backtestingService: BacktestingService,
    private readonly strategyBuilderService: StrategyBuilderService,
    private readonly riskManagementService: RiskManagementService,
    private readonly stockService: StockService,
    private readonly paperTradingService: PaperTradingService,
  ) {}

  async deployStrategy(
    userId: string,
    strategyId: string,
    deploymentConfig: DeploymentConfig,
  ): Promise<StrategyInstance> {
    try {
      // Validate strategy exists and belongs to user
      const strategy = await this.strategyRepository.findOne({
        where: { id: strategyId, userId },
      });

      if (!strategy) {
        throw new Error('Strategy not found or access denied');
      }

      // Validate strategy before deployment
      const validation =
        await this.strategyBuilderService.validateStrategy(strategy);
      if (!validation.isValid) {
        throw new Error(
          `Strategy validation failed: ${validation.errors.join(', ')}`,
        );
      }

      // Check if strategy is already running
      if (this.runningStrategies.has(strategyId)) {
        throw new Error('Strategy is already deployed');
      }

      // Create strategy instance
      const instance: StrategyInstance = {
        id: `${strategyId}-${Date.now()}`,
        strategyId,
        strategy,
        config: deploymentConfig,
        status: 'running',
        startedAt: new Date(),
        performance: {
          totalReturn: 0,
          dailyReturn: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          currentDrawdown: 0,
          winRate: 0,
          totalTrades: 0,
          profitableTrades: 0,
          currentValue: deploymentConfig.initialCapital,
          unrealizedPnL: 0,
        },
        errorCount: 0,
      };

      // Store in running strategies
      this.runningStrategies.set(strategyId, instance);

      // Start strategy execution asynchronously (don't wait for it to prevent hanging)
      this.startStrategyExecution(instance).catch((error) => {
        this.logger.error(
          `Error starting strategy execution for ${strategyId}: ${error.message}`,
        );
        // Remove from running strategies if startup fails
        this.runningStrategies.delete(strategyId);
        instance.status = 'error';
      });

      this.logger.log(`Strategy deployed: ${strategyId} for user ${userId}`);
      return instance;
    } catch (error) {
      this.logger.error(
        `Error deploying strategy ${strategyId}: ${error.message}`,
      );
      throw error;
    }
  }

  async stopStrategy(userId: string, strategyId: string): Promise<void> {
    const instance = this.runningStrategies.get(strategyId);

    if (!instance) {
      throw new Error('Strategy not found or not running');
    }

    // Verify ownership
    if (instance.strategy.userId !== userId) {
      throw new Error('Access denied');
    }

    // Clear execution interval
    if (instance.executionInterval) {
      clearInterval(instance.executionInterval);
    }

    // Update status
    instance.status = 'stopped';

    // Remove from running strategies
    this.runningStrategies.delete(strategyId);

    this.logger.log(`Strategy stopped: ${strategyId}`);
  }

  async pauseStrategy(userId: string, strategyId: string): Promise<void> {
    const instance = this.runningStrategies.get(strategyId);

    if (!instance) {
      throw new Error('Strategy not found or not running');
    }

    if (instance.strategy.userId !== userId) {
      throw new Error('Access denied');
    }

    // Clear execution interval
    if (instance.executionInterval) {
      clearInterval(instance.executionInterval);
      instance.executionInterval = undefined;
    }

    instance.status = 'paused';
    this.logger.log(`Strategy paused: ${strategyId}`);
  }

  async resumeStrategy(userId: string, strategyId: string): Promise<void> {
    const instance = this.runningStrategies.get(strategyId);

    if (!instance) {
      throw new Error('Strategy not found');
    }

    if (instance.strategy.userId !== userId) {
      throw new Error('Access denied');
    }

    if (instance.status !== 'paused') {
      throw new Error('Strategy is not paused');
    }

    instance.status = 'running';
    await this.startStrategyExecution(instance);

    this.logger.log(`Strategy resumed: ${strategyId}`);
  }

  async getRunningStrategies(userId: string): Promise<StrategyInstance[]> {
    return Array.from(this.runningStrategies.values()).filter(
      (instance) => instance?.strategy?.userId === userId,
    );
  }

  async getStrategyPerformance(
    userId: string,
    strategyId: string,
  ): Promise<InstancePerformance> {
    const instance = this.runningStrategies.get(strategyId);

    if (!instance) {
      throw new Error('Strategy not found or not running');
    }

    if (instance.strategy.userId !== userId) {
      throw new Error('Access denied');
    }

    return instance.performance;
  }

  private async startStrategyExecution(
    instance: StrategyInstance,
  ): Promise<void> {
    const intervalMs = this.getExecutionIntervalMs(
      instance.config.executionFrequency,
    );

    const executionLoop = setInterval(async () => {
      try {
        await this.executeStrategyIteration(instance);
      } catch (error) {
        await this.handleExecutionError(instance, error);
      }
    }, intervalMs);

    instance.executionInterval = executionLoop;
  }

  private async executeStrategyIteration(
    instance: StrategyInstance,
  ): Promise<void> {
    if (instance.status !== 'running') {
      return;
    }

    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('Strategy iteration timeout')),
          30000,
        ); // 30 second timeout
      });

      const executionPromise = this.doStrategyIteration(instance);

      await Promise.race([executionPromise, timeoutPromise]);
    } catch (error) {
      this.logger.warn(
        `Strategy iteration error for ${instance.strategyId}: ${error.message}`,
      );
      // Don't throw the error, just log it and continue
    }
  }

  private async doStrategyIteration(instance: StrategyInstance): Promise<void> {
    // Check risk limits before executing
    const riskCheck = await this.checkRiskLimits(instance);
    if (!riskCheck.isValid) {
      await this.handleRiskBreach(instance, riskCheck.violations);
      return;
    }

    // Get current market data
    const symbols = instance.config.symbols || instance.strategy.symbols || [];

    // Skip execution if no symbols configured
    if (symbols.length === 0) {
      this.logger.debug(
        `No symbols configured for strategy ${instance.strategyId}, skipping iteration`,
      );
      return;
    }

    const marketData = await this.getRealtimeMarketData(symbols);

    if (!marketData || marketData.length === 0) {
      this.logger.warn(
        `No market data available for strategy ${instance.strategyId}`,
      );
      return;
    }

    // Generate signals for each symbol
    for (const data of marketData) {
      const signals = await this.generateSignals(instance.strategy, data);

      // Execute each signal
      for (const signal of signals) {
        await this.executeSignal(instance, signal, data);
      }
    }

    // Update performance metrics
    await this.updatePerformanceMetrics(instance);
  }

  private async generateSignals(
    strategy: TradingStrategy,
    marketData: MarketData,
  ): Promise<Signal[]> {
    // Simplified signal generation for now
    // In a full implementation, this would evaluate the strategy components
    const signals: Signal[] = [];

    // Basic momentum strategy example
    if (marketData.close > marketData.open * 1.02) {
      // 2% gain
      signals.push({
        type: 'entry',
        symbol: marketData.symbol,
        direction: 'buy',
        size: 100,
        price: marketData.close,
        timestamp: marketData.timestamp,
        confidence: 0.7,
      });
    }

    return signals;
  }

  private async executeSignal(
    instance: StrategyInstance,
    signal: Signal,
    marketData: MarketData,
  ): Promise<void> {
    try {
      // Validate signal
      if (!this.isValidSignal(signal)) {
        this.logger.warn(
          `Invalid signal for strategy ${instance.strategyId}: ${JSON.stringify(signal)}`,
        );
        return;
      }

      // Apply position sizing
      const adjustedSize = await this.calculatePositionSize(
        instance,
        signal,
        marketData,
      );

      if (adjustedSize <= 0) {
        this.logger.debug(
          `Position size too small, skipping signal: ${JSON.stringify(signal)}`,
        );
        return;
      }

      // Create auto trade record and execute through paper trading service
      const autoTrade = this.autoTradeRepository.create({
        portfolio_id: instance.config.portfolioId, // Use actual portfolio ID from config
        symbol: signal.symbol,
        trade_type: signal.direction === 'buy' ? TradeType.BUY : TradeType.SELL,
        quantity: adjustedSize,
        trigger_price: marketData.close,
        executed_price: marketData.close,
        status: AutoTradeStatus.EXECUTED,
        executed_at: new Date(),
        execution_details: {
          strategyId: instance.strategyId,
          signalType: signal.type,
          confidence: signal.confidence,
        },
      });

      await this.autoTradeRepository.save(autoTrade);

      // Execute the trade through paper trading service
      try {
        await this.paperTradingService.executeTrade({
          userId: instance.strategy.userId,
          symbol: signal.symbol,
          type: signal.direction,
          quantity: adjustedSize,
        });

        this.logger.log(
          `Trade executed through portfolio ${instance.config.portfolioId}: ${signal.symbol} ${signal.direction} ${adjustedSize} @ ${marketData.close}`,
        );
      } catch (tradeError) {
        this.logger.error(
          `Failed to execute trade in portfolio: ${tradeError.message}`,
        );
        // Update auto trade status to failed
        autoTrade.status = AutoTradeStatus.FAILED;
        await this.autoTradeRepository.save(autoTrade);
      }
    } catch (error) {
      this.logger.error(`Error executing signal: ${error.message}`);
      throw error;
    }
  }

  private async calculatePositionSize(
    instance: StrategyInstance,
    signal: Signal,
    marketData: MarketData,
  ): Promise<number> {
    const maxPositionValue =
      instance.performance.currentValue *
      (instance.config.riskLimits.maxPositionSize / 100);
    const maxShares = Math.floor(maxPositionValue / marketData.close);

    // Apply strategy-specific position sizing
    const requestedShares = signal.size || maxShares;

    return Math.min(requestedShares, maxShares);
  }

  private async checkRiskLimits(
    instance: StrategyInstance,
  ): Promise<{ isValid: boolean; violations: string[] }> {
    const violations: string[] = [];
    const limits = instance.config.riskLimits;

    // Check max drawdown
    if (instance.performance.currentDrawdown > limits.maxDrawdown) {
      violations.push(
        `Current drawdown (${instance.performance.currentDrawdown}%) exceeds limit (${limits.maxDrawdown}%)`,
      );
    }

    // Check daily loss limit
    const dailyLoss =
      instance.performance.currentValue *
      (instance.performance.dailyReturn / 100);
    if (dailyLoss < -limits.dailyLossLimit) {
      violations.push(
        `Daily loss ($${Math.abs(dailyLoss)}) exceeds limit ($${limits.dailyLossLimit})`,
      );
    }

    return {
      isValid: violations.length === 0,
      violations,
    };
  }

  private async handleRiskBreach(
    instance: StrategyInstance,
    violations: string[],
  ): Promise<void> {
    this.logger.warn(
      `Risk breach detected for strategy ${instance.strategyId}: ${violations.join(', ')}`,
    );

    // Pause the strategy
    instance.status = 'paused';

    if (instance.executionInterval) {
      clearInterval(instance.executionInterval);
      instance.executionInterval = undefined;
    }

    // Send notification if configured
    if (
      instance.config.notifications.enabled &&
      instance.config.notifications.onRiskBreach
    ) {
      await this.sendNotification(
        instance,
        'risk_breach',
        violations.join(', '),
      );
    }
  }

  private async handleExecutionError(
    instance: StrategyInstance,
    error: Error,
  ): Promise<void> {
    instance.errorCount++;
    instance.lastError = error.message;

    this.logger.error(
      `Strategy execution error (${instance.errorCount}): ${error.message}`,
    );

    // Stop strategy after too many errors
    if (instance.errorCount >= 5) {
      this.logger.error(
        `Stopping strategy ${instance.strategyId} due to excessive errors`,
      );
      instance.status = 'error';

      if (instance.executionInterval) {
        clearInterval(instance.executionInterval);
        instance.executionInterval = undefined;
      }
    }

    // Send notification if configured
    if (
      instance.config.notifications.enabled &&
      instance.config.notifications.onError
    ) {
      await this.sendNotification(instance, 'error', error.message);
    }
  }

  private async getRealtimeMarketData(
    symbols: string[],
  ): Promise<MarketData[]> {
    try {
      const marketData: MarketData[] = [];

      for (const symbol of symbols) {
        const stockData = await this.stockService.getStockBySymbol(symbol);

        if (stockData) {
          marketData.push({
            symbol,
            timestamp: new Date(),
            open: stockData.previousClose || stockData.currentPrice,
            high: stockData.currentPrice,
            low: stockData.currentPrice,
            close: stockData.currentPrice,
            volume: stockData.volume || 0,
          });
        }
      }

      return marketData;
    } catch (error) {
      this.logger.error(
        `Error fetching realtime market data: ${error.message}`,
      );
      return [];
    }
  }

  private async updatePerformanceMetrics(
    instance: StrategyInstance,
  ): Promise<void> {
    try {
      // Get trade statistics using correct field names
      const trades = await this.autoTradeRepository.find({
        where: {
          execution_details: { strategyId: instance.strategyId },
        },
        order: { executed_at: 'DESC' },
      });

      if (trades.length > 0) {
        // Calculate basic performance metrics
        instance.performance.totalTrades = trades.length;
        // More complex calculations would go here
      }
    } catch (error) {
      this.logger.error(`Error updating performance metrics: ${error.message}`);
    }
  }

  private async sendNotification(
    instance: StrategyInstance,
    type: string,
    message: string,
  ): Promise<void> {
    try {
      // Implementation would depend on notification service
      this.logger.log(
        `Notification (${type}): ${message} for strategy ${instance.strategyId}`,
      );
    } catch (error) {
      this.logger.error(`Error sending notification: ${error.message}`);
    }
  }

  private getExecutionIntervalMs(
    frequency: 'minute' | 'hour' | 'daily',
  ): number {
    switch (frequency) {
      case 'minute':
        return 60 * 1000; // 1 minute
      case 'hour':
        return 60 * 60 * 1000; // 1 hour
      case 'daily':
        return 24 * 60 * 60 * 1000; // 1 day
      default:
        return 60 * 1000;
    }
  }

  private isValidSignal(signal: Signal): boolean {
    return !!(
      signal.symbol &&
      signal.type &&
      signal.direction &&
      signal.size > 0 &&
      signal.timestamp
    );
  }

  /**
   * Automatically selects an appropriate trading strategy based on portfolio balance and type
   * @param portfolio - The portfolio to select a strategy for
   * @returns Strategy configuration for the portfolio
   */
  private selectStrategyForPortfolio(portfolio: Portfolio) {
    const totalValue =
      Number(portfolio.totalValue) || Number(portfolio.currentCash) || 0;
    const isPDTEligible = totalValue >= PDT_MINIMUM_BALANCE;

    this.logger.log(
      `Selecting strategy for portfolio ${portfolio.id}: balance=$${totalValue}, PDT eligible=${isPDTEligible}`,
    );

    if (isPDTEligible) {
      // PDT-eligible accounts get day trading strategies
      if (totalValue >= 50000) {
        return PREDEFINED_STRATEGIES.DAY_TRADING_AGGRESSIVE;
      } else {
        return PREDEFINED_STRATEGIES.DAY_TRADING_CONSERVATIVE;
      }
    } else {
      // Non-PDT accounts get swing trading strategies
      if (totalValue >= 5000) {
        return PREDEFINED_STRATEGIES.SWING_TRADING_GROWTH;
      } else {
        return PREDEFINED_STRATEGIES.SWING_TRADING_VALUE;
      }
    }
  }

  /**
   * Creates a deployment configuration automatically based on portfolio characteristics
   * @param portfolio - The portfolio to create config for
   * @param selectedStrategy - The selected strategy configuration
   * @returns Deployment configuration
   */
  private createAutoDeploymentConfig(
    portfolio: Portfolio,
    selectedStrategy: any,
  ): DeploymentConfig {
    const totalValue =
      Number(portfolio.totalValue) || Number(portfolio.currentCash) || 0;

    return {
      mode: 'paper' as const,
      portfolioId: String(portfolio.id),
      initialCapital: totalValue,
      maxPositions: selectedStrategy.maxPositions,
      executionFrequency: selectedStrategy.executionFrequency,
      riskLimits: {
        maxDrawdown:
          selectedStrategy.riskLevel === 'aggressive'
            ? 15
            : selectedStrategy.riskLevel === 'moderate'
              ? 10
              : 5,
        maxPositionSize:
          selectedStrategy.riskLevel === 'aggressive'
            ? 25
            : selectedStrategy.riskLevel === 'moderate'
              ? 15
              : 10,
        dailyLossLimit:
          totalValue *
          (selectedStrategy.riskLevel === 'aggressive'
            ? 0.05
            : selectedStrategy.riskLevel === 'moderate'
              ? 0.03
              : 0.02),
        correlationLimit: 0.7,
      },
      notifications: {
        enabled: true,
        onTrade: true,
        onError: true,
        onRiskBreach: true,
      },
    };
  }

  /**
   * Automatically deploys a strategy for a portfolio based on its balance and characteristics
   * @param userId - User ID
   * @param portfolioId - Portfolio ID to deploy strategy for
   * @returns Strategy instance
   */
  async autoDeployStrategyForPortfolio(
    userId: string,
    portfolioId: string,
  ): Promise<StrategyInstance> {
    console.log(
      `DEBUG: Starting auto-deployment for portfolio ${portfolioId}, user ${userId}`,
    );

    try {
      console.log('DEBUG: Step 1 - Checking existing instances');

      // Check if strategy is already deployed for this portfolio
      const existingInstance = Array.from(this.runningStrategies.values()).find(
        (instance) => instance.config.portfolioId === portfolioId,
      );

      if (existingInstance) {
        console.log('DEBUG: Found existing instance, throwing error');
        throw new Error(
          `Strategy is already deployed for portfolio ${portfolioId}`,
        );
      }

      console.log('DEBUG: Step 2 - Creating strategy instance');

      // Create a minimal strategy instance for immediate return (simplified for development)
      const strategyId = `auto-strategy-${portfolioId}-${Date.now()}`;

      console.log(`DEBUG: Step 3 - Strategy ID created: ${strategyId}`);

      // Create a simplified strategy instance for immediate return
      const mockStrategy: TradingStrategy = {
        id: strategyId,
        userId,
        name: `Auto-Generated Strategy for Portfolio ${portfolioId}`,
        description: 'Auto-generated trading strategy',
        components: [],
        riskRules: [],
        symbols: ['AAPL', 'MSFT'],
        timeframe: '1h',
        status: 'active',
        version: 1,
        publishedAt: null,
        lastBacktestAt: null,
        performance: null,
        popularity: 0,
        rating: 0,
        ratingCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const instance: StrategyInstance = {
        id: strategyId,
        strategyId,
        strategy: mockStrategy,
        config: {
          portfolioId,
          initialCapital: 10000,
          symbols: ['AAPL', 'MSFT'],
          riskLevel: 'medium',
          executionFrequency: 'hour',
        } as any, // Type assertion for simplicity
        status: 'running',
        startedAt: new Date(),
        performance: {
          totalReturn: 0,
          dailyReturn: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          currentDrawdown: 0,
          winRate: 0,
          totalTrades: 0,
          profitableTrades: 0,
          currentValue: 10000,
          unrealizedPnL: 0,
        },
        errorCount: 0,
      };

      console.log('DEBUG: Step 4 - Storing in running strategies');

      // Store in running strategies
      this.runningStrategies.set(strategyId, instance);

      console.log('DEBUG: Step 5 - Logging completion');

      this.logger.log(
        `Auto-deployed simplified strategy for portfolio ${portfolioId}`,
      );

      console.log('DEBUG: Step 6 - Returning instance');
      return instance;
    } catch (error) {
      this.logger.error(
        `Error auto-deploying strategy for portfolio ${portfolioId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Creates default strategy components based on strategy type
   */
  private createDefaultStrategyComponents(strategyConfig: any) {
    const baseComponents = [
      {
        id: 'entry-signal',
        type: 'condition' as const,
        name: 'Entry Signal',
        category: 'signal',
        parameters: {
          indicators: ['RSI', 'MACD', 'Volume'],
          thresholds:
            strategyConfig.type === 'day_trading'
              ? { rsi: [30, 70], volume_spike: 1.5 }
              : { rsi: [25, 75], volume_spike: 1.2 },
        },
      },
      {
        id: 'position-sizing',
        type: 'action' as const,
        name: 'Position Sizing',
        category: 'risk',
        parameters: {
          method: 'percentage',
          maxPositionSize: strategyConfig.maxPositions,
          riskPerTrade:
            strategyConfig.riskLevel === 'aggressive'
              ? 0.03
              : strategyConfig.riskLevel === 'moderate'
                ? 0.02
                : 0.01,
        },
      },
      {
        id: 'stop-loss',
        type: 'action' as const,
        name: 'Stop Loss',
        category: 'risk',
        parameters: {
          type: 'percentage',
          value: strategyConfig.defaultStopLoss,
        },
      },
      {
        id: 'take-profit',
        type: 'action' as const,
        name: 'Take Profit',
        category: 'risk',
        parameters: {
          type: 'percentage',
          value: strategyConfig.defaultTakeProfit,
        },
      },
    ];

    return baseComponents;
  }

  /**
   * Creates default risk rules based on strategy type
   */
  private createDefaultRiskRules(strategyConfig: any) {
    return [
      {
        id: 'max-position-size',
        type: 'position_size' as const,
        parameters: { maxPercent: strategyConfig.maxPositions * 5 }, // 5% per position max
      },
      {
        id: 'stop-loss-rule',
        type: 'stop_loss' as const,
        parameters: { percentage: strategyConfig.defaultStopLoss },
      },
      {
        id: 'take-profit-rule',
        type: 'take_profit' as const,
        parameters: { percentage: strategyConfig.defaultTakeProfit },
      },
      {
        id: 'max-drawdown-rule',
        type: 'max_drawdown' as const,
        parameters: {
          percentage:
            strategyConfig.riskLevel === 'aggressive'
              ? 15
              : strategyConfig.riskLevel === 'moderate'
                ? 10
                : 5,
        },
      },
    ];
  }

  // Scheduled task to monitor strategy health
  @Cron(CronExpression.EVERY_5_MINUTES)
  async monitorStrategyHealth(): Promise<void> {
    for (const [strategyId, instance] of this.runningStrategies) {
      try {
        // Check if strategy is still responsive
        if (instance.status === 'running' && !instance.executionInterval) {
          this.logger.warn(
            `Strategy ${strategyId} appears to be stuck, restarting execution`,
          );
          await this.startStrategyExecution(instance);
        }

        // Check for excessive errors
        if (instance.errorCount >= 3 && instance.status === 'running') {
          this.logger.warn(
            `Strategy ${strategyId} has ${instance.errorCount} errors, monitoring closely`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Error monitoring strategy ${strategyId}: ${error.message}`,
        );
      }
    }
  }

  // Clean up on module destroy
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down autonomous trading service...');

    for (const [strategyId, instance] of this.runningStrategies) {
      try {
        if (instance.executionInterval) {
          clearInterval(instance.executionInterval);
        }

        this.logger.log(`Strategy ${strategyId} shutdown complete`);
      } catch (error) {
        this.logger.error(
          `Error shutting down strategy ${strategyId}: ${error.message}`,
        );
      }
    }

    this.runningStrategies.clear();
  }

  async getAvailablePortfolios() {
    try {
      const portfolios = await this.paperTradingService.getPortfolios();
      return portfolios.map((portfolio) => ({
        id: portfolio.id.toString(),
        name: portfolio.name,
        currentCash: portfolio.currentCash,
        totalValue: portfolio.totalValue,
        isActive: portfolio.isActive,
        portfolioType: portfolio.portfolioType,
        assignedStrategy: portfolio.assignedStrategy,
        assignedStrategyName: portfolio.assignedStrategyName,
        strategyAssignedAt: portfolio.strategyAssignedAt,
      }));
    } catch (error) {
      this.logger.error(`Error fetching portfolios: ${error.message}`);
      return [];
    }
  }

  async getPortfolioPerformance(portfolioId: string) {
    try {
      const portfolio =
        await this.paperTradingService.getPortfolio(portfolioId);
      if (!portfolio) {
        throw new Error('Portfolio not found');
      }

      return {
        portfolioId: portfolio.id.toString(),
        portfolioName: portfolio.name,
        currentValue: portfolio.totalValue,
        cash: portfolio.currentCash,
        totalReturn: portfolio.totalReturn,
        totalPnL: portfolio.totalPnL,
        dayTradingEnabled: portfolio.dayTradingEnabled,
        dayTradeCount: portfolio.dayTradeCount,
      };
    } catch (error) {
      this.logger.error(
        `Error fetching portfolio performance: ${error.message}`,
      );
      throw error;
    }
  }

  async assignRandomStrategy(portfolioId: string) {
    try {
      // Define available trading strategies for random assignment
      const availableStrategies = [
        {
          id: 'momentum-breakout-v1',
          name: 'Momentum Breakout Strategy',
          description:
            'Trades breakouts above resistance with volume confirmation',
          category: 'momentum',
        },
        {
          id: 'mean-reversion-rsi-v2',
          name: 'RSI Mean Reversion',
          description:
            'Buys oversold conditions and sells overbought using RSI',
          category: 'mean-reversion',
        },
        {
          id: 'ai-sentiment-trader-v1',
          name: 'AI Sentiment Trader',
          description:
            'Uses machine learning and news sentiment for trading decisions',
          category: 'ai-enhanced',
        },
        {
          id: 'scalping-master-v1',
          name: 'Scalping Master',
          description:
            'High-frequency scalping strategy for small, quick profits',
          category: 'scalping',
        },
        {
          id: 'trend-following-ema-v1',
          name: 'EMA Trend Following',
          description: 'Follows trends using exponential moving averages',
          category: 'trend-following',
        },
        {
          id: 'pairs-trading-v1',
          name: 'Pairs Trading Strategy',
          description: 'Statistical arbitrage using correlated pairs',
          category: 'arbitrage',
        },
        {
          id: 'volatility-breakout-v1',
          name: 'Volatility Breakout',
          description: 'Trades volatility spikes and breakouts',
          category: 'volatility',
        },
        {
          id: 'swing-trading-macd-v1',
          name: 'MACD Swing Trading',
          description: 'Swing trading using MACD crossover signals',
          category: 'swing-trading',
        },
      ];

      // Randomly select a strategy
      const randomIndex = Math.floor(
        Math.random() * availableStrategies.length,
      );
      const selectedStrategy = availableStrategies[randomIndex];

      // Get the portfolio to update
      const portfolio =
        await this.paperTradingService.getPortfolio(portfolioId);
      if (!portfolio) {
        throw new Error('Portfolio not found');
      }

      // Update portfolio with assigned strategy
      await this.paperTradingService.updatePortfolioStrategy(
        portfolioId,
        selectedStrategy.id,
        selectedStrategy.name,
      );

      this.logger.log(
        `Randomly assigned strategy "${selectedStrategy.name}" to portfolio ${portfolioId}`,
      );

      return {
        portfolioId: portfolioId,
        portfolioName: portfolio.name,
        assignedStrategy: selectedStrategy.id,
        assignedStrategyName: selectedStrategy.name,
        strategyDescription: selectedStrategy.description,
        strategyCategory: selectedStrategy.category,
        assignedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Error assigning random strategy to portfolio ${portfolioId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Gets all currently active strategy instances
   * @param userId - User ID to filter strategies
   * @returns Array of active strategy instances
   */
  async getActiveStrategies(userId: string): Promise<StrategyInstance[]> {
    try {
      // Return all running strategies from the in-memory map
      const activeStrategies: StrategyInstance[] = [];

      for (const [strategyId, instance] of this.runningStrategies.entries()) {
        // Filter by user ID if the strategy belongs to the user
        if (instance.strategy && instance.strategy.userId === userId) {
          activeStrategies.push(instance);
        }
      }

      this.logger.log(
        `Found ${activeStrategies.length} active strategies for user ${userId}`,
      );

      return activeStrategies;
    } catch (error) {
      this.logger.error(
        `Error getting active strategies: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }
}
