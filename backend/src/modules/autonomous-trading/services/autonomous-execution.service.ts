import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StrategyExecution, ExecutionStatus, ExecutionMode } from '../entities/strategy-execution.entity';
import { TradingStrategy } from '../entities/trading-strategy.entity';

export interface StartExecutionRequest {
  strategyId: string;
  portfolioId: string;
  mode: ExecutionMode;
  allocatedCapital: number;
  settings?: Partial<any>;
}

@Injectable()
export class AutonomousExecutionService {
  private readonly logger = new Logger(AutonomousExecutionService.name);
  private readonly activeExecutions = new Map<string, NodeJS.Timeout>();

  constructor(
    @InjectRepository(StrategyExecution)
    private readonly executionRepository: Repository<StrategyExecution>,
    @InjectRepository(TradingStrategy)
    private readonly strategyRepository: Repository<TradingStrategy>,
  ) {}

  /**
   * Start autonomous strategy execution
   */
  async startExecution(request: StartExecutionRequest): Promise<StrategyExecution> {
    try {
      const strategy = await this.strategyRepository.findOne({
        where: { id: request.strategyId },
      });

      if (!strategy) {
        throw new Error('Strategy not found');
      }

      if (strategy.status !== 'ACTIVE') {
        throw new Error('Strategy must be active to start execution');
      }

      // Check if execution already exists for this strategy
      const existingExecution = await this.executionRepository.findOne({
        where: {
          strategy_id: request.strategyId,
          status: 'ACTIVE',
        },
      });

      if (existingExecution) {
        throw new Error('Strategy is already being executed');
      }

      const execution = this.executionRepository.create({
        strategy_id: request.strategyId,
        portfolio_id: request.portfolioId,
        mode: request.mode,
        allocated_capital: request.allocatedCapital,
        current_value: request.allocatedCapital,
        status: 'ACTIVE',
        started_at: new Date(),
        settings: {
          mode: request.mode,
          maxRisk: 0.02, // 2% max risk per trade
          maxDailyLoss: 0.05, // 5% max daily loss
          maxPositions: 10,
          emergencyStop: true,
          notificationSettings: {
            onTrade: true,
            onError: true,
            onThreshold: true,
          },
          ...request.settings,
        },
        metrics: {
          tradesExecuted: 0,
          profitableTrades: 0,
          currentDrawdown: 0,
          totalPnL: 0,
          winRate: 0,
          avgWin: 0,
          avgLoss: 0,
          sharpeRatio: 0,
        },
        current_positions: [],
        performance_history: [],
      });

      const saved = await this.executionRepository.save(execution);
      this.logger.log(`Strategy execution started: ${strategy.name} (${saved.id})`);

      // Start execution monitoring
      this.startExecutionMonitoring(saved.id);

      return saved;
    } catch (error) {
      this.logger.error('Error starting strategy execution:', error);
      throw error;
    }
  }

  /**
   * Stop strategy execution
   */
  async stopExecution(executionId: string, reason?: string): Promise<void> {
    try {
      const execution = await this.executionRepository.findOne({
        where: { id: executionId },
      });

      if (!execution) {
        throw new Error('Execution not found');
      }

      await this.executionRepository.update(executionId, {
        status: 'STOPPED',
        stopped_at: new Date(),
        last_error: reason,
      });

      // Stop monitoring
      this.stopExecutionMonitoring(executionId);

      this.logger.log(`Strategy execution stopped: ${executionId} - ${reason || 'Manual stop'}`);
    } catch (error) {
      this.logger.error(`Error stopping execution ${executionId}:`, error);
      throw error;
    }
  }

  /**
   * Pause strategy execution
   */
  async pauseExecution(executionId: string): Promise<void> {
    await this.executionRepository.update(executionId, {
      status: 'PAUSED',
    });

    this.stopExecutionMonitoring(executionId);
    this.logger.log(`Strategy execution paused: ${executionId}`);
  }

  /**
   * Resume strategy execution
   */
  async resumeExecution(executionId: string): Promise<void> {
    await this.executionRepository.update(executionId, {
      status: 'ACTIVE',
    });

    this.startExecutionMonitoring(executionId);
    this.logger.log(`Strategy execution resumed: ${executionId}`);
  }

  /**
   * Start monitoring execution
   */
  private startExecutionMonitoring(executionId: string): void {
    // Execute strategy evaluation every minute
    const interval = setInterval(async () => {
      try {
        await this.evaluateAndExecuteStrategy(executionId);
      } catch (error) {
        this.logger.error(`Error in strategy evaluation for ${executionId}:`, error);
        
        // Update execution with error status
        await this.executionRepository.update(executionId, {
          status: 'ERROR',
          last_error: error.message,
        });

        this.stopExecutionMonitoring(executionId);
      }
    }, 60000); // 1 minute interval

    this.activeExecutions.set(executionId, interval);
    this.logger.debug(`Started monitoring for execution: ${executionId}`);
  }

  /**
   * Stop monitoring execution
   */
  private stopExecutionMonitoring(executionId: string): void {
    const interval = this.activeExecutions.get(executionId);
    if (interval) {
      clearInterval(interval);
      this.activeExecutions.delete(executionId);
      this.logger.debug(`Stopped monitoring for execution: ${executionId}`);
    }
  }

  /**
   * Evaluate and execute strategy (simplified implementation)
   */
  private async evaluateAndExecuteStrategy(executionId: string): Promise<void> {
    const execution = await this.executionRepository.findOne({
      where: { id: executionId },
      relations: ['strategy'],
    });

    if (!execution || execution.status !== 'ACTIVE') {
      return;
    }

    this.logger.debug(`Evaluating strategy for execution: ${executionId}`);

    // Simplified strategy evaluation
    // In a real implementation, this would:
    // 1. Parse the strategy configuration
    // 2. Evaluate conditions using real market data
    // 3. Generate trading signals
    // 4. Execute trades through the auto-trading system
    // 5. Update positions and metrics

    // For now, simulate a simple update
    const currentMetrics = execution.metrics || {
      tradesExecuted: 0,
      profitableTrades: 0,
      currentDrawdown: 0,
      totalPnL: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      sharpeRatio: 0,
    };

    // Simulate occasional trade
    if (Math.random() > 0.98) { // 2% chance per evaluation
      const simulatedPnL = (Math.random() - 0.5) * 100; // -$50 to +$50
      const isWinner = simulatedPnL > 0;

      const updatedMetrics = {
        ...currentMetrics,
        tradesExecuted: currentMetrics.tradesExecuted + 1,
        profitableTrades: currentMetrics.profitableTrades + (isWinner ? 1 : 0),
        totalPnL: currentMetrics.totalPnL + simulatedPnL,
        winRate: (currentMetrics.profitableTrades + (isWinner ? 1 : 0)) / (currentMetrics.tradesExecuted + 1),
      };

      await this.executionRepository.update(executionId, {
        metrics: updatedMetrics,
        current_value: execution.allocated_capital + updatedMetrics.totalPnL,
      });

      this.logger.log(`Simulated trade executed for ${executionId}: ${isWinner ? 'WIN' : 'LOSS'} $${simulatedPnL.toFixed(2)}`);
    }

    // Check risk limits
    await this.checkRiskLimits(execution);
  }

  /**
   * Check risk management limits
   */
  private async checkRiskLimits(execution: StrategyExecution): Promise<void> {
    const currentDrawdown = Math.max(0, (execution.allocated_capital - execution.current_value) / execution.allocated_capital);
    const dailyPnL = execution.metrics?.totalPnL || 0;
    const dailyLoss = dailyPnL < 0 ? Math.abs(dailyPnL) / execution.allocated_capital : 0;

    let shouldStop = false;
    let stopReason = '';

    // Check maximum drawdown
    if (currentDrawdown > 0.2) { // 20% drawdown limit
      shouldStop = true;
      stopReason = 'Maximum drawdown exceeded (20%)';
    }

    // Check daily loss limit
    if (dailyLoss > (execution.settings?.maxDailyLoss || 0.05)) {
      shouldStop = true;
      stopReason = `Daily loss limit exceeded (${(execution.settings?.maxDailyLoss || 0.05) * 100}%)`;
    }

    if (shouldStop) {
      await this.stopExecution(execution.id, stopReason);
      this.logger.warn(`Execution stopped due to risk limits: ${execution.id} - ${stopReason}`);
    }
  }

  /**
   * Get execution status
   */
  async getExecution(executionId: string): Promise<StrategyExecution | null> {
    return this.executionRepository.findOne({
      where: { id: executionId },
      relations: ['strategy'],
    });
  }

  /**
   * Get active executions
   */
  async getActiveExecutions(): Promise<StrategyExecution[]> {
    return this.executionRepository.find({
      where: { status: 'ACTIVE' },
      relations: ['strategy'],
      order: { started_at: 'DESC' },
    });
  }

  /**
   * Get executions for portfolio
   */
  async getPortfolioExecutions(portfolioId: string): Promise<StrategyExecution[]> {
    return this.executionRepository.find({
      where: { portfolio_id: portfolioId },
      relations: ['strategy'],
      order: { started_at: 'DESC' },
    });
  }

  /**
   * Update execution metrics
   */
  async updateExecutionMetrics(
    executionId: string,
    metrics: Partial<any>,
  ): Promise<void> {
    const execution = await this.executionRepository.findOne({
      where: { id: executionId },
    });

    if (!execution) {
      throw new Error('Execution not found');
    }

    const updatedMetrics = {
      ...execution.metrics,
      ...metrics,
    };

    await this.executionRepository.update(executionId, {
      metrics: updatedMetrics,
    });
  }

  /**
   * Add position to execution
   */
  async addPosition(
    executionId: string,
    position: {
      symbol: string;
      quantity: number;
      entryPrice: number;
      currentPrice: number;
      unrealizedPnL: number;
      entryDate: Date;
    },
  ): Promise<void> {
    const execution = await this.executionRepository.findOne({
      where: { id: executionId },
    });

    if (!execution) {
      throw new Error('Execution not found');
    }

    const updatedPositions = [...(execution.current_positions || []), position];

    await this.executionRepository.update(executionId, {
      current_positions: updatedPositions,
    });
  }

  /**
   * Remove position from execution
   */
  async removePosition(executionId: string, symbol: string): Promise<void> {
    const execution = await this.executionRepository.findOne({
      where: { id: executionId },
    });

    if (!execution) {
      throw new Error('Execution not found');
    }

    const updatedPositions = (execution.current_positions || []).filter(
      p => p.symbol !== symbol,
    );

    await this.executionRepository.update(executionId, {
      current_positions: updatedPositions,
    });
  }

  /**
   * Cleanup service on shutdown
   */
  onModuleDestroy() {
    // Stop all active monitoring
    for (const [executionId, interval] of this.activeExecutions) {
      clearInterval(interval);
      this.logger.log(`Stopped monitoring for execution on shutdown: ${executionId}`);
    }
    this.activeExecutions.clear();
  }
}