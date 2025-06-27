import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StrategyBacktest, BacktestParameters, BacktestMetrics, TradeRecord } from '../entities/strategy-backtest.entity';
import { TradingStrategy } from '../entities/trading-strategy.entity';

export interface BacktestRequest {
  strategyId: string;
  name: string;
  parameters: BacktestParameters;
}

@Injectable()
export class BacktestingEngineService {
  private readonly logger = new Logger(BacktestingEngineService.name);

  constructor(
    @InjectRepository(StrategyBacktest)
    private readonly backtestRepository: Repository<StrategyBacktest>,
    @InjectRepository(TradingStrategy)
    private readonly strategyRepository: Repository<TradingStrategy>,
  ) {}

  /**
   * Start a new backtest
   */
  async startBacktest(request: BacktestRequest): Promise<StrategyBacktest> {
    try {
      const strategy = await this.strategyRepository.findOne({
        where: { id: request.strategyId },
      });

      if (!strategy) {
        throw new Error('Strategy not found');
      }

      const backtest = this.backtestRepository.create({
        strategy_id: request.strategyId,
        name: request.name,
        parameters: request.parameters,
        status: 'PENDING',
        execution_stats: {
          startTime: new Date(),
        },
      });

      const saved = await this.backtestRepository.save(backtest);
      this.logger.log(`Backtest started: ${saved.name} (${saved.id})`);

      // Start backtest execution asynchronously
      this.executeBacktest(saved.id).catch(error => {
        this.logger.error(`Backtest execution failed: ${saved.id}`, error);
      });

      return saved;
    } catch (error) {
      this.logger.error('Error starting backtest:', error);
      throw error;
    }
  }

  /**
   * Execute backtest (simplified implementation)
   */
  private async executeBacktest(backtestId: string): Promise<void> {
    try {
      await this.backtestRepository.update(backtestId, {
        status: 'RUNNING',
        progress_percentage: 0,
      });

      const backtest = await this.backtestRepository.findOne({
        where: { id: backtestId },
        relations: ['strategy'],
      });

      if (!backtest) {
        throw new Error('Backtest not found');
      }

      // Simulate backtest execution with progress updates
      const totalDays = Math.ceil(
        (backtest.parameters.endDate.getTime() - backtest.parameters.startDate.getTime()) / 
        (1000 * 60 * 60 * 24)
      );

      // Simplified backtest simulation
      const tradeRecords: TradeRecord[] = [];
      const equityCurve: Array<{ date: Date; equity: number; drawdown: number; benchmarkEquity: number }> = [];
      
      let currentEquity = backtest.parameters.initialCapital;
      let maxEquity = currentEquity;
      let totalTrades = 0;
      let profitableTrades = 0;

      for (let day = 0; day <= totalDays; day += 5) {
        const progress = Math.min((day / totalDays) * 100, 100);
        
        // Simulate trade generation (simplified)
        if (Math.random() > 0.95) { // 5% chance of trade per period
          const trade = this.generateSimulatedTrade(
            backtest.parameters.symbols[Math.floor(Math.random() * backtest.parameters.symbols.length)],
            new Date(backtest.parameters.startDate.getTime() + day * 24 * 60 * 60 * 1000),
            currentEquity,
          );
          
          tradeRecords.push(trade);
          currentEquity += trade.pnl;
          totalTrades++;
          
          if (trade.pnl > 0) {
            profitableTrades++;
          }
          
          maxEquity = Math.max(maxEquity, currentEquity);
        }

        const currentDate = new Date(backtest.parameters.startDate.getTime() + day * 24 * 60 * 60 * 1000);
        const drawdown = Math.max(0, (maxEquity - currentEquity) / maxEquity);
        
        equityCurve.push({
          date: currentDate,
          equity: currentEquity,
          drawdown,
          benchmarkEquity: backtest.parameters.initialCapital * (1 + 0.1 * (day / 365)), // 10% annual return
        });

        await this.backtestRepository.update(backtestId, {
          progress_percentage: Math.floor(progress),
        });

        // Small delay to simulate processing time
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Calculate final metrics
      const metrics = this.calculateBacktestMetrics(
        tradeRecords,
        equityCurve,
        backtest.parameters,
      );

      await this.backtestRepository.update(backtestId, {
        status: 'COMPLETED',
        progress_percentage: 100,
        metrics,
        trade_records: tradeRecords,
        equity_curve: equityCurve,
        completed_at: new Date(),
        execution_stats: {
          ...backtest.execution_stats,
          endTime: new Date(),
          duration: Date.now() - backtest.execution_stats!.startTime.getTime(),
        },
      });

      this.logger.log(`Backtest completed: ${backtestId}`);
    } catch (error) {
      this.logger.error(`Backtest execution failed: ${backtestId}`, error);
      
      await this.backtestRepository.update(backtestId, {
        status: 'FAILED',
        error_message: error.message,
        execution_stats: {
          endTime: new Date(),
          duration: Date.now() - new Date().getTime(),
        },
      });
    }
  }

  /**
   * Generate simulated trade for backtesting
   */
  private generateSimulatedTrade(symbol: string, date: Date, currentEquity: number): TradeRecord {
    const side = Math.random() > 0.5 ? 'BUY' : 'SELL';
    const entryPrice = 100 + Math.random() * 50; // Random price between 100-150
    const holdingDays = Math.floor(Math.random() * 20) + 1; // 1-20 days
    const exitDate = new Date(date.getTime() + holdingDays * 24 * 60 * 60 * 1000);
    
    // Simulate price movement
    const priceChange = (Math.random() - 0.5) * 0.1; // -5% to +5%
    const exitPrice = entryPrice * (1 + priceChange);
    
    const quantity = Math.floor((currentEquity * 0.05) / entryPrice); // 5% position size
    const commission = quantity * 0.005; // $0.005 per share
    const slippage = quantity * entryPrice * 0.0001; // 0.01% slippage
    
    const grossPnL = side === 'BUY' 
      ? (exitPrice - entryPrice) * quantity 
      : (entryPrice - exitPrice) * quantity;
    
    const pnl = grossPnL - commission - slippage;

    return {
      symbol,
      entryDate: date,
      exitDate,
      entryPrice,
      exitPrice,
      quantity,
      side,
      pnl,
      commission,
      slippage,
      holdingPeriod: holdingDays,
      tags: ['simulated'],
    };
  }

  /**
   * Calculate comprehensive backtest metrics
   */
  private calculateBacktestMetrics(
    trades: TradeRecord[],
    equityCurve: Array<{ date: Date; equity: number; drawdown: number; benchmarkEquity: number }>,
    parameters: BacktestParameters,
  ): BacktestMetrics {
    const initialCapital = parameters.initialCapital;
    const finalEquity = equityCurve[equityCurve.length - 1]?.equity || initialCapital;
    const totalReturn = (finalEquity - initialCapital) / initialCapital;
    
    const profitableTrades = trades.filter(t => t.pnl > 0);
    const unprofitableTrades = trades.filter(t => t.pnl <= 0);
    
    const avgWin = profitableTrades.length > 0 
      ? profitableTrades.reduce((sum, t) => sum + t.pnl, 0) / profitableTrades.length 
      : 0;
    
    const avgLoss = unprofitableTrades.length > 0 
      ? Math.abs(unprofitableTrades.reduce((sum, t) => sum + t.pnl, 0) / unprofitableTrades.length)
      : 0;

    const maxDrawdown = Math.max(...equityCurve.map(e => e.drawdown));
    const currentDrawdown = equityCurve[equityCurve.length - 1]?.drawdown || 0;

    // Calculate daily returns for volatility and Sharpe ratio
    const dailyReturns: number[] = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const dailyReturn = (equityCurve[i].equity - equityCurve[i - 1].equity) / equityCurve[i - 1].equity;
      dailyReturns.push(dailyReturn);
    }

    const avgDailyReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgDailyReturn, 2), 0) / dailyReturns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
    
    const annualizedReturn = Math.pow(1 + totalReturn, 365 / equityCurve.length) - 1;
    const sharpeRatio = volatility > 0 ? (annualizedReturn - parameters.riskFreeRate) / volatility : 0;

    // Calculate benchmark correlation
    const benchmarkReturns: number[] = [];
    for (let i = 1; i < equityCurve.length; i++) {
      const benchmarkReturn = (equityCurve[i].benchmarkEquity - equityCurve[i - 1].benchmarkEquity) / equityCurve[i - 1].benchmarkEquity;
      benchmarkReturns.push(benchmarkReturn);
    }

    const correlation = this.calculateCorrelation(dailyReturns, benchmarkReturns);

    return {
      returns: {
        total: totalReturn,
        annualized: annualizedReturn,
        volatility,
        sharpeRatio,
        sortinoRatio: this.calculateSortinoRatio(dailyReturns, parameters.riskFreeRate),
        calmarRatio: annualizedReturn / maxDrawdown,
      },
      drawdown: {
        maximum: maxDrawdown,
        current: currentDrawdown,
        duration: 0, // Simplified
        recoveryTime: 0, // Simplified
      },
      trades: {
        total: trades.length,
        profitable: profitableTrades.length,
        unprofitable: unprofitableTrades.length,
        winRate: trades.length > 0 ? profitableTrades.length / trades.length : 0,
        avgWin,
        avgLoss,
        profitFactor: avgLoss > 0 ? avgWin / avgLoss : 0,
        avgHoldingPeriod: trades.length > 0 ? trades.reduce((sum, t) => sum + t.holdingPeriod, 0) / trades.length : 0,
      },
      risk: {
        valueAtRisk: this.calculateVaR(dailyReturns),
        conditionalVaR: this.calculateCVaR(dailyReturns),
        beta: this.calculateBeta(dailyReturns, benchmarkReturns),
        alpha: annualizedReturn - (parameters.riskFreeRate + this.calculateBeta(dailyReturns, benchmarkReturns) * 0.1),
        informationRatio: 0, // Simplified
      },
      benchmark: {
        correlation,
        trackingError: Math.sqrt(variance) * Math.sqrt(252),
        upCapture: 0, // Simplified
        downCapture: 0, // Simplified
      },
    };
  }

  private calculateCorrelation(returns1: number[], returns2: number[]): number {
    if (returns1.length !== returns2.length || returns1.length === 0) return 0;
    
    const mean1 = returns1.reduce((sum, r) => sum + r, 0) / returns1.length;
    const mean2 = returns2.reduce((sum, r) => sum + r, 0) / returns2.length;
    
    let numerator = 0;
    let sum1 = 0;
    let sum2 = 0;
    
    for (let i = 0; i < returns1.length; i++) {
      const diff1 = returns1[i] - mean1;
      const diff2 = returns2[i] - mean2;
      numerator += diff1 * diff2;
      sum1 += diff1 * diff1;
      sum2 += diff2 * diff2;
    }
    
    const denominator = Math.sqrt(sum1 * sum2);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateSortinoRatio(returns: number[], riskFreeRate: number): number {
    const excessReturns = returns.map(r => r - riskFreeRate / 252);
    const downSideReturns = excessReturns.filter(r => r < 0);
    
    if (downSideReturns.length === 0) return 0;
    
    const downSideDeviation = Math.sqrt(
      downSideReturns.reduce((sum, r) => sum + r * r, 0) / downSideReturns.length
    ) * Math.sqrt(252);
    
    const avgExcessReturn = excessReturns.reduce((sum, r) => sum + r, 0) / excessReturns.length * 252;
    
    return downSideDeviation === 0 ? 0 : avgExcessReturn / downSideDeviation;
  }

  private calculateVaR(returns: number[], confidence: number = 0.05): number {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor(returns.length * confidence);
    return sortedReturns[index] || 0;
  }

  private calculateCVaR(returns: number[], confidence: number = 0.05): number {
    const var95 = this.calculateVaR(returns, confidence);
    const tailReturns = returns.filter(r => r <= var95);
    return tailReturns.length > 0 ? tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length : 0;
  }

  private calculateBeta(returns: number[], benchmarkReturns: number[]): number {
    if (returns.length !== benchmarkReturns.length || returns.length === 0) return 0;
    
    const correlation = this.calculateCorrelation(returns, benchmarkReturns);
    const returnVariance = returns.reduce((sum, r) => sum + r * r, 0) / returns.length;
    const benchmarkVariance = benchmarkReturns.reduce((sum, r) => sum + r * r, 0) / benchmarkReturns.length;
    
    if (benchmarkVariance === 0) return 0;
    
    return correlation * Math.sqrt(returnVariance / benchmarkVariance);
  }

  /**
   * Get backtest results
   */
  async getBacktest(backtestId: string): Promise<StrategyBacktest | null> {
    return this.backtestRepository.findOne({
      where: { id: backtestId },
      relations: ['strategy'],
    });
  }

  /**
   * Get backtests for strategy
   */
  async getStrategyBacktests(strategyId: string): Promise<StrategyBacktest[]> {
    return this.backtestRepository.find({
      where: { strategy_id: strategyId },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Cancel running backtest
   */
  async cancelBacktest(backtestId: string): Promise<void> {
    await this.backtestRepository.update(backtestId, {
      status: 'FAILED',
      error_message: 'Cancelled by user',
      execution_stats: {
        endTime: new Date(),
      },
    });
    
    this.logger.log(`Backtest cancelled: ${backtestId}`);
  }
}