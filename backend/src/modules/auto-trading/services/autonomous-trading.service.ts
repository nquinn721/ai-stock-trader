import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockService } from '../../stock/stock.service';
import { PaperTradingService } from '../../paper-trading/paper-trading.service';
import {
  AutoTrade,
  AutoTradeStatus,
  TradeType,
} from '../entities/auto-trade.entity';
import { TradingStrategy } from '../entities/trading-strategy.entity';
import { StrategyBuilderService } from '../strategy-builder.service';
import { BacktestingService, MarketData, Signal } from './backtesting.service';
import { RiskManagementService } from './risk-management.service';

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
        relations: ['user'],
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

      // Start strategy execution
      await this.startStrategyExecution(instance);

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
      (instance) => instance.strategy.userId === userId,
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

    // Check risk limits before executing
    const riskCheck = await this.checkRiskLimits(instance);
    if (!riskCheck.isValid) {
      await this.handleRiskBreach(instance, riskCheck.violations);
      return;
    }

    // Get current market data
    const symbols = instance.config.symbols || instance.strategy.symbols || [];
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
        this.logger.error(`Failed to execute trade in portfolio: ${tradeError.message}`);
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
      return portfolios.map(portfolio => ({
        id: portfolio.id.toString(),
        name: portfolio.name,
        currentCash: portfolio.currentCash,
        totalValue: portfolio.totalValue,
        isActive: portfolio.isActive,
        portfolioType: portfolio.portfolioType,
      }));
    } catch (error) {
      this.logger.error(`Error fetching portfolios: ${error.message}`);
      return [];
    }
  }

  async getPortfolioPerformance(portfolioId: string) {
    try {
      const portfolio = await this.paperTradingService.getPortfolio(portfolioId);
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
      this.logger.error(`Error fetching portfolio performance: ${error.message}`);
      throw error;
    }
  }
}
