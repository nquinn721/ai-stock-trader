import { Injectable, Logger } from '@nestjs/common';
import { StrategyBuilderService, CreateStrategyDto } from './services/strategy-builder.service';
import { BacktestingEngineService, BacktestRequest } from './services/backtesting-engine.service';
import { AutonomousExecutionService, StartExecutionRequest } from './services/autonomous-execution.service';
import { TradingStrategy } from './entities/trading-strategy.entity';
import { StrategyBacktest } from './entities/strategy-backtest.entity';
import { StrategyExecution } from './entities/strategy-execution.entity';

@Injectable()
export class AutonomousTradingService {
  private readonly logger = new Logger(AutonomousTradingService.name);

  constructor(
    private readonly strategyBuilderService: StrategyBuilderService,
    private readonly backtestingEngineService: BacktestingEngineService,
    private readonly autonomousExecutionService: AutonomousExecutionService,
  ) {}

  // Strategy Management
  async createStrategy(createDto: CreateStrategyDto): Promise<TradingStrategy> {
    return this.strategyBuilderService.createStrategy(createDto);
  }

  async getStrategyTemplates() {
    return this.strategyBuilderService.getStrategyTemplates();
  }

  async createFromTemplate(
    templateId: string,
    userId: string,
    portfolioId: string,
    customName?: string,
  ): Promise<TradingStrategy> {
    return this.strategyBuilderService.createFromTemplate(templateId, userId, portfolioId, customName);
  }

  async getUserStrategies(userId: string): Promise<TradingStrategy[]> {
    return this.strategyBuilderService.getUserStrategies(userId);
  }

  async getStrategy(strategyId: string): Promise<TradingStrategy | null> {
    return this.strategyBuilderService.getStrategy(strategyId);
  }

  async updateStrategy(strategyId: string, updates: Partial<TradingStrategy>): Promise<TradingStrategy> {
    return this.strategyBuilderService.updateStrategy(strategyId, updates);
  }

  async deleteStrategy(strategyId: string): Promise<void> {
    return this.strategyBuilderService.deleteStrategy(strategyId);
  }

  async validateStrategy(strategyId: string) {
    return this.strategyBuilderService.validateStrategy(strategyId);
  }

  // Backtesting
  async startBacktest(request: BacktestRequest): Promise<StrategyBacktest> {
    return this.backtestingEngineService.startBacktest(request);
  }

  async getBacktest(backtestId: string): Promise<StrategyBacktest | null> {
    return this.backtestingEngineService.getBacktest(backtestId);
  }

  async getStrategyBacktests(strategyId: string): Promise<StrategyBacktest[]> {
    return this.backtestingEngineService.getStrategyBacktests(strategyId);
  }

  async cancelBacktest(backtestId: string): Promise<void> {
    return this.backtestingEngineService.cancelBacktest(backtestId);
  }

  // Execution
  async startExecution(request: StartExecutionRequest): Promise<StrategyExecution> {
    return this.autonomousExecutionService.startExecution(request);
  }

  async stopExecution(executionId: string, reason?: string): Promise<void> {
    return this.autonomousExecutionService.stopExecution(executionId, reason);
  }

  async pauseExecution(executionId: string): Promise<void> {
    return this.autonomousExecutionService.pauseExecution(executionId);
  }

  async resumeExecution(executionId: string): Promise<void> {
    return this.autonomousExecutionService.resumeExecution(executionId);
  }

  async getExecution(executionId: string): Promise<StrategyExecution | null> {
    return this.autonomousExecutionService.getExecution(executionId);
  }

  async getActiveExecutions(): Promise<StrategyExecution[]> {
    return this.autonomousExecutionService.getActiveExecutions();
  }

  async getPortfolioExecutions(portfolioId: string): Promise<StrategyExecution[]> {
    return this.autonomousExecutionService.getPortfolioExecutions(portfolioId);
  }

  // Analytics
  async getStrategyPerformance(strategyId: string) {
    const strategy = await this.getStrategy(strategyId);
    if (!strategy) {
      throw new Error('Strategy not found');
    }

    const backtests = await this.getStrategyBacktests(strategyId);
    const executions = await this.autonomousExecutionService.getPortfolioExecutions(strategy.portfolio_id);
    
    return {
      strategy,
      backtests: backtests.filter(b => b.status === 'COMPLETED'),
      liveExecutions: executions.filter(e => e.strategy_id === strategyId),
      performanceScore: strategy.performance_score,
      lastBacktest: backtests.find(b => b.status === 'COMPLETED'),
    };
  }

  async getDashboardData(userId: string) {
    const strategies = await this.getUserStrategies(userId);
    const activeExecutions = await this.getActiveExecutions();
    
    const userExecutions = activeExecutions.filter(exec => 
      strategies.some(strategy => strategy.id === exec.strategy_id)
    );

    const totalStrategies = strategies.length;
    const activeStrategies = userExecutions.length;
    const totalValue = userExecutions.reduce((sum, exec) => sum + Number(exec.current_value), 0);
    const totalPnL = userExecutions.reduce((sum, exec) => sum + (exec.metrics?.totalPnL || 0), 0);

    return {
      summary: {
        totalStrategies,
        activeStrategies,
        totalValue,
        totalPnL,
        avgPerformance: strategies.length > 0 ? strategies.reduce((sum, s) => sum + Number(s.performance_score), 0) / strategies.length : 0,
      },
      strategies: strategies.map(strategy => ({
        ...strategy,
        isActive: userExecutions.some(exec => exec.strategy_id === strategy.id),
        execution: userExecutions.find(exec => exec.strategy_id === strategy.id),
      })),
      recentActivity: userExecutions.slice(0, 10),
    };
  }
}