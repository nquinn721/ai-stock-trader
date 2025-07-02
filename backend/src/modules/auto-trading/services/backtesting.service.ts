import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockService } from '../../stock/stock.service';
import {
  BacktestResult,
  PerformanceMetrics,
  RiskMetrics,
  TradeDetail,
} from '../entities/backtest-result.entity';
import { TradingStrategy } from '../entities/trading-strategy.entity';

export interface BacktestParams {
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  symbols: string[];
  commission?: number;
  slippage?: number;
  benchmark?: string;
}

export interface Signal {
  type: 'entry' | 'exit';
  symbol: string;
  direction: 'buy' | 'sell';
  size: number;
  price: number;
  timestamp: Date;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface MarketData {
  symbol: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose?: number;
}

export interface Position {
  symbol: string;
  quantity: number;
  entryPrice: number;
  entryDate: Date;
  currentPrice: number;
  unrealizedPnL: number;
  marketValue: number;
}

export interface Portfolio {
  cash: number;
  totalValue: number;
  positions: Map<string, Position>;
  trades: TradeDetail[];
  equityCurve: Array<{ date: Date; value: number }>;
  drawdownCurve: Array<{ date: Date; drawdown: number }>;
}

class BacktestEngine {
  private portfolio: Portfolio;
  private commission: number;
  private slippage: number;
  private highWaterMark: number;

  constructor(params: {
    initialCapital: number;
    commission: number;
    slippage: number;
  }) {
    this.commission = params.commission;
    this.slippage = params.slippage;
    this.highWaterMark = params.initialCapital;

    this.portfolio = {
      cash: params.initialCapital,
      totalValue: params.initialCapital,
      positions: new Map(),
      trades: [],
      equityCurve: [{ date: new Date(), value: params.initialCapital }],
      drawdownCurve: [{ date: new Date(), drawdown: 0 }],
    };
  }

  async processSignal(signal: Signal, marketData: MarketData): Promise<void> {
    const adjustedPrice = this.applySlippage(signal.price, signal.direction);

    if (signal.type === 'entry') {
      await this.enterPosition(signal, adjustedPrice, marketData.timestamp);
    } else if (signal.type === 'exit') {
      await this.exitPosition(signal, adjustedPrice, marketData.timestamp);
    }
  }

  private applySlippage(price: number, direction: 'buy' | 'sell'): number {
    const slippageAmount = price * this.slippage;
    return direction === 'buy'
      ? price + slippageAmount
      : price - slippageAmount;
  }

  private async enterPosition(
    signal: Signal,
    price: number,
    timestamp: Date,
  ): Promise<void> {
    const tradeValue = signal.size * price;
    const commissionCost = tradeValue * this.commission;
    const totalCost = tradeValue + commissionCost;

    if (totalCost > this.portfolio.cash) {
      // Insufficient funds - adjust position size
      const maxAffordable = Math.floor(
        (this.portfolio.cash - commissionCost) / price,
      );
      if (maxAffordable <= 0) return;

      signal.size = maxAffordable;
      const adjustedValue = signal.size * price;
      const adjustedCommission = adjustedValue * this.commission;

      this.portfolio.cash -= adjustedValue + adjustedCommission;
    } else {
      this.portfolio.cash -= totalCost;
    }

    // Update position
    const existingPosition = this.portfolio.positions.get(signal.symbol);
    if (existingPosition) {
      // Average down/up
      const totalQuantity = existingPosition.quantity + signal.size;
      const totalCost =
        existingPosition.quantity * existingPosition.entryPrice +
        signal.size * price;
      existingPosition.quantity = totalQuantity;
      existingPosition.entryPrice = totalCost / totalQuantity;
    } else {
      this.portfolio.positions.set(signal.symbol, {
        symbol: signal.symbol,
        quantity: signal.size,
        entryPrice: price,
        entryDate: timestamp,
        currentPrice: price,
        unrealizedPnL: 0,
        marketValue: signal.size * price,
      });
    }

    // Record trade
    this.portfolio.trades.push({
      symbol: signal.symbol,
      entryPrice: price,
      quantity: signal.size,
      type: signal.direction,
      timestamp,
      pnl: -commissionCost, // Commission as cost
    });
  }

  private async exitPosition(
    signal: Signal,
    price: number,
    timestamp: Date,
  ): Promise<void> {
    const position = this.portfolio.positions.get(signal.symbol);
    if (!position || position.quantity === 0) return;

    const quantityToSell = Math.min(signal.size, position.quantity);
    const tradeValue = quantityToSell * price;
    const commissionCost = tradeValue * this.commission;
    const netProceeds = tradeValue - commissionCost;

    // Calculate P&L
    const pnl = (price - position.entryPrice) * quantityToSell - commissionCost;

    this.portfolio.cash += netProceeds;

    // Update position
    position.quantity -= quantityToSell;
    if (position.quantity === 0) {
      this.portfolio.positions.delete(signal.symbol);
    }

    // Record trade
    this.portfolio.trades.push({
      symbol: signal.symbol,
      entryPrice: position.entryPrice,
      exitPrice: price,
      quantity: quantityToSell,
      type: signal.direction,
      timestamp,
      pnl,
    });
  }

  async updatePortfolio(marketData: MarketData): Promise<void> {
    // Update position values
    const position = this.portfolio.positions.get(marketData.symbol);
    if (position) {
      position.currentPrice = marketData.close;
      position.marketValue = position.quantity * marketData.close;
      position.unrealizedPnL =
        (marketData.close - position.entryPrice) * position.quantity;
    }

    // Calculate total portfolio value
    let totalPositionValue = 0;
    for (const pos of this.portfolio.positions.values()) {
      totalPositionValue += pos.marketValue;
    }

    this.portfolio.totalValue = this.portfolio.cash + totalPositionValue;

    // Update equity curve
    this.portfolio.equityCurve.push({
      date: marketData.timestamp,
      value: this.portfolio.totalValue,
    });

    // Update drawdown curve
    if (this.portfolio.totalValue > this.highWaterMark) {
      this.highWaterMark = this.portfolio.totalValue;
    }

    const drawdown =
      (this.highWaterMark - this.portfolio.totalValue) / this.highWaterMark;
    this.portfolio.drawdownCurve.push({
      date: marketData.timestamp,
      drawdown: drawdown * 100,
    });
  }

  getResults(): Portfolio {
    return this.portfolio;
  }
}

@Injectable()
export class BacktestingService {
  private readonly logger = new Logger(BacktestingService.name);

  constructor(
    @InjectRepository(BacktestResult)
    private readonly backtestRepository: Repository<BacktestResult>,
    @InjectRepository(TradingStrategy)
    private readonly strategyRepository: Repository<TradingStrategy>,
    private readonly stockService: StockService,
  ) {}

  async runBacktest(
    strategy: TradingStrategy,
    params: BacktestParams,
  ): Promise<BacktestResult> {
    try {
      this.logger.log(
        `Starting backtest for strategy ${strategy.id}: ${strategy.name}`,
      );
      const startTime = Date.now();

      // Create backtest result record
      const backtestResult = this.backtestRepository.create({
        strategyId: strategy.id,
        userId: strategy.userId,
        strategyName: strategy.name,
        startDate: params.startDate,
        endDate: params.endDate,
        initialCapital: params.initialCapital,
        finalCapital: 0, // Will be updated
        symbols: params.symbols,
        timeframe: strategy.timeframe,
        commission: params.commission || 0.001,
        slippage: params.slippage || 0.0005,
        status: 'running',
      });

      await this.backtestRepository.save(backtestResult);

      // Get historical data
      const historicalData = await this.getHistoricalData(
        params.symbols,
        params.startDate,
        params.endDate,
      );

      if (historicalData.length === 0) {
        throw new Error(
          'No historical data available for the specified period',
        );
      }

      // Initialize backtesting engine
      const engine = new BacktestEngine({
        initialCapital: params.initialCapital,
        commission: params.commission || 0.001,
        slippage: params.slippage || 0.0005,
      });

      // Execute strategy on historical data
      let dataIndex = 0;
      for (const dataPoint of historicalData) {
        // Generate signals for this data point
        const signals = await this.generateSignals(
          strategy,
          dataPoint,
          historicalData.slice(0, dataIndex + 1),
        );

        // Process each signal
        for (const signal of signals) {
          await engine.processSignal(signal, dataPoint);
        }

        // Update portfolio with current market data
        await engine.updatePortfolio(dataPoint);
        dataIndex++;
      }

      const portfolio = engine.getResults();

      // Calculate performance metrics
      const performanceMetrics = this.calculatePerformanceMetrics(
        portfolio,
        params.initialCapital,
      );
      const riskMetrics = this.calculateRiskMetrics(
        portfolio,
        params.initialCapital,
      );

      // Update backtest result
      backtestResult.finalCapital = portfolio.totalValue;
      backtestResult.performanceMetrics = performanceMetrics;
      backtestResult.riskMetrics = riskMetrics;
      backtestResult.trades = portfolio.trades;
      backtestResult.equityCurve = portfolio.equityCurve;
      backtestResult.drawdownCurve = portfolio.drawdownCurve;
      backtestResult.status = 'completed';
      backtestResult.executionTimeMs = Date.now() - startTime;

      await this.backtestRepository.save(backtestResult);

      // Update strategy with backtest info
      await this.strategyRepository.update(strategy.id, {
        lastBacktestAt: new Date(),
        performance: performanceMetrics as any,
      });

      this.logger.log(
        `Backtest completed for strategy ${strategy.id} in ${backtestResult.executionTimeMs}ms`,
      );
      return backtestResult;
    } catch (error) {
      this.logger.error(
        `Backtest failed for strategy ${strategy.id}: ${error.message}`,
      );

      // Update status to failed
      await this.backtestRepository.update(
        { strategyId: strategy.id },
        {
          status: 'failed',
          errorMessage: error.message,
        },
      );

      throw error;
    }
  }

  async generateSignals(
    strategy: TradingStrategy,
    marketData: MarketData,
    historicalData: MarketData[],
  ): Promise<Signal[]> {
    const signals: Signal[] = [];

    if (!strategy.components || strategy.components.length === 0) {
      return signals;
    }

    // Build context for signal generation
    const context = {
      currentPrice: marketData.close,
      volume: marketData.volume,
      symbol: marketData.symbol,
      timestamp: marketData.timestamp,
      historical: historicalData,
    };

    // Evaluate entry conditions
    for (const component of strategy.components) {
      if (component.type === 'condition' && component.category === 'entry') {
        const shouldEnter = await this.evaluateCondition(component, context);
        if (shouldEnter) {
          const positionSize = this.calculatePositionSize(strategy, context);

          signals.push({
            type: 'entry',
            symbol: marketData.symbol,
            direction: component.parameters.direction || 'buy',
            size: positionSize,
            price: marketData.close,
            timestamp: marketData.timestamp,
            confidence: component.parameters.confidence || 0.5,
            metadata: {
              componentId: component.id,
              componentName: component.name,
            },
          });
        }
      }
    }

    // Evaluate exit conditions
    for (const component of strategy.components) {
      if (component.type === 'condition' && component.category === 'exit') {
        const shouldExit = await this.evaluateCondition(component, context);
        if (shouldExit) {
          signals.push({
            type: 'exit',
            symbol: marketData.symbol,
            direction: 'sell',
            size: component.parameters.size || 100, // Default to exit full position
            price: marketData.close,
            timestamp: marketData.timestamp,
            confidence: component.parameters.confidence || 0.5,
            metadata: {
              componentId: component.id,
              componentName: component.name,
            },
          });
        }
      }
    }

    return signals;
  }

  private async evaluateCondition(
    component: any,
    context: any,
  ): Promise<boolean> {
    // This is a simplified condition evaluation
    // In a real implementation, this would be much more sophisticated

    switch (component.name.toLowerCase()) {
      case 'price above':
        return context.currentPrice > component.parameters.value;

      case 'price below':
        return context.currentPrice < component.parameters.value;

      case 'rsi oversold':
        const rsi = this.calculateRSI(
          context.historical,
          component.parameters.period || 14,
        );
        return rsi < (component.parameters.threshold || 30);

      case 'rsi overbought':
        const rsiOverbought = this.calculateRSI(
          context.historical,
          component.parameters.period || 14,
        );
        return rsiOverbought > (component.parameters.threshold || 70);

      case 'volume spike':
        return context.volume > component.parameters.threshold;

      default:
        // Default to false for unknown conditions
        return false;
    }
  }

  private calculateRSI(data: MarketData[], period: number = 14): number {
    if (data.length < period + 1) return 50; // Default neutral RSI

    let gains = 0;
    let losses = 0;

    for (let i = data.length - period; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      if (change > 0) {
        gains += change;
      } else {
        losses += Math.abs(change);
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    return rsi;
  }

  private calculatePositionSize(
    strategy: TradingStrategy,
    context: any,
  ): number {
    // Find position sizing rule
    const positionSizeRule = strategy.riskRules?.find(
      (rule) => rule.type === 'position_size',
    );

    if (!positionSizeRule) {
      return 100; // Default position size
    }

    switch (positionSizeRule.parameters.method) {
      case 'fixed':
        return positionSizeRule.parameters.amount || 100;

      case 'percentage':
        // This would need portfolio value context
        return Math.floor(
          ((positionSizeRule.parameters.percentage || 0.05) * 10000) /
            context.currentPrice,
        );

      default:
        return 100;
    }
  }

  private async getHistoricalData(
    symbols: string[],
    startDate: Date,
    endDate: Date,
  ): Promise<MarketData[]> {
    // This is a simplified implementation
    // In reality, you'd fetch real historical data from a data provider

    const data: MarketData[] = [];
    const dayMs = 24 * 60 * 60 * 1000;

    for (
      let date = new Date(startDate);
      date <= endDate;
      date = new Date(date.getTime() + dayMs)
    ) {
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      for (const symbol of symbols) {
        // Generate mock historical data
        const basePrice = 100 + Math.random() * 100;
        const volatility = 0.02;
        const change = (Math.random() - 0.5) * volatility;

        data.push({
          symbol,
          timestamp: new Date(date),
          open: basePrice,
          high: basePrice * (1 + Math.abs(change)),
          low: basePrice * (1 - Math.abs(change)),
          close: basePrice * (1 + change),
          volume: Math.floor(1000000 + Math.random() * 5000000),
        });
      }
    }

    return data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private calculatePerformanceMetrics(
    portfolio: Portfolio,
    initialCapital: number,
  ): PerformanceMetrics {
    const totalReturn =
      ((portfolio.totalValue - initialCapital) / initialCapital) * 100;
    const trades = portfolio.trades.filter((t) => t.pnl !== undefined);

    const winningTrades = trades.filter((t) => t.pnl > 0);
    const losingTrades = trades.filter((t) => t.pnl < 0);

    const winRate =
      trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;

    const totalProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));

    const profitFactor =
      totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;

    // Calculate max drawdown
    let maxDrawdown = 0;
    for (const point of portfolio.drawdownCurve) {
      maxDrawdown = Math.max(maxDrawdown, point.drawdown);
    }

    // Calculate Sharpe ratio (simplified)
    const returns = portfolio.equityCurve
      .map((point, index) => {
        if (index === 0) return 0;
        return (
          (point.value - portfolio.equityCurve[index - 1].value) /
          portfolio.equityCurve[index - 1].value
        );
      })
      .slice(1);

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const returnVariance =
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
      returns.length;
    const sharpeRatio =
      returnVariance > 0
        ? (avgReturn * Math.sqrt(252)) / Math.sqrt(returnVariance * 252)
        : 0;

    return {
      totalReturn,
      annualizedReturn: totalReturn, // Simplified - would need to calculate based on time period
      sharpeRatio,
      maxDrawdown,
      winRate,
      profitFactor,
      totalTrades: trades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      averageWin:
        winningTrades.length > 0 ? totalProfit / winningTrades.length : 0,
      averageLoss:
        losingTrades.length > 0 ? totalLoss / losingTrades.length : 0,
      largestWin:
        winningTrades.length > 0
          ? Math.max(...winningTrades.map((t) => t.pnl))
          : 0,
      largestLoss:
        losingTrades.length > 0
          ? Math.min(...losingTrades.map((t) => t.pnl))
          : 0,
      consecutiveWins: this.calculateConsecutiveWins(trades),
      consecutiveLosses: this.calculateConsecutiveLosses(trades),
    };
  }

  private calculateRiskMetrics(
    portfolio: Portfolio,
    initialCapital: number,
  ): RiskMetrics {
    // Simplified risk metrics calculation
    const returns = portfolio.equityCurve
      .map((point, index) => {
        if (index === 0) return 0;
        return (
          (point.value - portfolio.equityCurve[index - 1].value) /
          portfolio.equityCurve[index - 1].value
        );
      })
      .slice(1);

    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
      returns.length;
    const volatility = Math.sqrt(variance * 252) * 100; // Annualized volatility

    return {
      volatility,
      beta: 1.0, // Would need benchmark data
      alpha: 0, // Would need benchmark data
      valueAtRisk: this.calculateVaR(returns, 0.05),
      expectedShortfall: this.calculateES(returns, 0.05),
      calmarRatio: 0, // totalReturn / maxDrawdown
      sortinoRatio: 0, // Would need downside deviation
      informationRatio: 0, // Would need benchmark data
    };
  }

  private calculateVaR(returns: number[], confidence: number): number {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sortedReturns.length);
    return sortedReturns[index] || 0;
  }

  private calculateES(returns: number[], confidence: number): number {
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * sortedReturns.length);
    const tailReturns = sortedReturns.slice(0, index);
    return tailReturns.length > 0
      ? tailReturns.reduce((sum, r) => sum + r, 0) / tailReturns.length
      : 0;
  }

  private calculateConsecutiveWins(trades: TradeDetail[]): number {
    let maxConsecutive = 0;
    let current = 0;

    for (const trade of trades) {
      if (trade.pnl && trade.pnl > 0) {
        current++;
        maxConsecutive = Math.max(maxConsecutive, current);
      } else {
        current = 0;
      }
    }

    return maxConsecutive;
  }

  private calculateConsecutiveLosses(trades: TradeDetail[]): number {
    let maxConsecutive = 0;
    let current = 0;

    for (const trade of trades) {
      if (trade.pnl && trade.pnl < 0) {
        current++;
        maxConsecutive = Math.max(maxConsecutive, current);
      } else {
        current = 0;
      }
    }

    return maxConsecutive;
  }

  async getBacktestResults(strategyId: string): Promise<BacktestResult[]> {
    return await this.backtestRepository.find({
      where: { strategyId },
      order: { createdAt: 'DESC' },
    });
  }

  async getBacktestResult(backtestId: string): Promise<BacktestResult> {
    const result = await this.backtestRepository.findOne({
      where: { id: backtestId },
    });
    if (!result) {
      throw new Error('Backtest result not found');
    }
    return result;
  }

  async deleteBacktestResult(backtestId: string): Promise<void> {
    const result = await this.backtestRepository.delete(backtestId);
    if (result.affected === 0) {
      throw new Error('Backtest result not found');
    }
  }
}
