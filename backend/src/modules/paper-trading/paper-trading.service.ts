import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from '../../entities/portfolio.entity';
import { Position } from '../../entities/position.entity';
import { Stock } from '../../entities/stock.entity';
import { Trade, TradeStatus, TradeType } from '../../entities/trade.entity';

// DTOs that the controller expects
export class CreatePortfolioDto {
  userId: string;
  initialBalance?: number;
}

export class CreateTradeDto {
  userId: string;
  symbol: string;
  type: 'buy' | 'sell';
  quantity: number;
}

@Injectable()
export class PaperTradingService {
  constructor(
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(Position)
    private positionRepository: Repository<Position>,
    @InjectRepository(Trade)
    private tradeRepository: Repository<Trade>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
  ) {}
  /**
   * Create a new portfolio
   */
  async createPortfolio(
    createPortfolioDto: CreatePortfolioDto,
  ): Promise<Portfolio> {
    const { userId, initialBalance = 100000 } = createPortfolioDto;

    const portfolio = this.portfolioRepository.create({
      name: `Portfolio for ${userId}`,
      initialCash: initialBalance,
      currentCash: initialBalance,
      totalValue: initialBalance,
      totalPnL: 0,
      totalReturn: 0,
      isActive: true,
    });

    return await this.portfolioRepository.save(portfolio);
  }
  async getPortfolios(): Promise<Portfolio[]> {
    return await this.portfolioRepository.find({
      where: { isActive: true },
      relations: ['positions', 'trades'],
      order: { createdAt: 'DESC' },
    });
  }
  async getPortfolio(id: string | number): Promise<Portfolio> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: Number(id), isActive: true },
      relations: ['positions', 'trades'],
    });

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    // Calculate current values for positions
    await this.updatePositionValues(portfolio);

    return portfolio;
  }
  async deletePortfolio(id: string | number): Promise<void> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: Number(id) },
    });

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    // Soft delete - mark as inactive
    portfolio.isActive = false;
    await this.portfolioRepository.save(portfolio);
  }
  async executeTrade(createTradeDto: CreateTradeDto): Promise<Trade> {
    const { userId, symbol, type, quantity } = createTradeDto;

    // Find user's portfolio
    const portfolio = await this.portfolioRepository.findOne({
      where: { isActive: true },
      relations: ['positions'],
    });

    if (!portfolio) {
      throw new Error('No active portfolio found');
    }

    // Get current stock price
    const stock = await this.stockRepository.findOne({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!stock) {
      throw new Error(`Stock ${symbol} not found`);
    }

    const currentPrice = Number(stock.currentPrice);
    const totalAmount = currentPrice * quantity;

    // Validate trade
    if (type === 'buy' && portfolio.currentCash < totalAmount) {
      throw new Error('Insufficient funds');
    }

    // Check for existing position
    let position = await this.positionRepository.findOne({
      where: { portfolioId: portfolio.id, symbol: symbol.toUpperCase() },
    });

    if (type === 'sell' && (!position || position.quantity < quantity)) {
      throw new Error('Insufficient shares to sell');
    } // Create trade record
    const trade = this.tradeRepository.create({
      portfolioId: portfolio.id,
      stockId: stock.id,
      symbol: symbol.toUpperCase(),
      type: type === 'buy' ? TradeType.BUY : TradeType.SELL,
      quantity,
      price: currentPrice,
      totalValue: totalAmount,
      status: TradeStatus.EXECUTED,
      executedAt: new Date(),
    });

    await this.tradeRepository.save(trade);

    // Update portfolio cash
    if (type === 'buy') {
      portfolio.currentCash -= totalAmount;
    } else {
      portfolio.currentCash += totalAmount;
    }

    // Update or create position
    if (type === 'buy') {
      if (position) {
        // Update existing position
        const newTotalCost = position.totalCost + totalAmount;
        const newQuantity = position.quantity + quantity;
        position.averagePrice = newTotalCost / newQuantity;
        position.quantity = newQuantity;
        position.totalCost = newTotalCost;
      } else {
        // Create new position
        position = this.positionRepository.create({
          portfolioId: portfolio.id,
          stockId: stock.id,
          symbol: symbol.toUpperCase(),
          quantity,
          averagePrice: currentPrice,
          totalCost: totalAmount,
        });
      }
      await this.positionRepository.save(position);
    } else {
      // Sell - update position
      if (position) {
        position.quantity -= quantity;
        if (position.quantity === 0) {
          await this.positionRepository.remove(position);
        } else {
          position.totalCost = position.averagePrice * position.quantity;
          await this.positionRepository.save(position);
        }
      }
    }

    // Update portfolio totals
    await this.updatePortfolioTotals(portfolio);
    await this.portfolioRepository.save(portfolio);

    return trade;
  }
  async getPortfolioPerformance(id: string | number): Promise<any> {
    const portfolio = await this.getPortfolio(id);

    // Get historical trades to calculate performance over time
    const trades = await this.tradeRepository.find({
      where: { portfolioId: Number(id) },
      order: { executedAt: 'ASC' },
    });

    // Calculate performance history based on actual trades
    const performanceHistory = await this.calculatePerformanceHistory(
      portfolio,
      trades,
    );

    const currentValue = portfolio.totalValue;
    const totalGain = portfolio.totalPnL;
    const totalGainPercent = portfolio.totalReturn; // Calculate today's gain based on price movements
    const dayGain = await this.calculateDayGain(portfolio);
    const dayGainPercent =
      portfolio.totalValue > 0 ? (dayGain / portfolio.totalValue) * 100 : 0;

    // Calculate portfolio metrics from performance history
    const returns = performanceHistory.slice(1).map((point, index) => {
      const prevValue = performanceHistory[index].totalValue;
      return prevValue > 0
        ? ((point.totalValue - prevValue) / prevValue) * 100
        : 0;
    });

    const maxDrawdown = this.calculateMaxDrawdown(
      performanceHistory.map((p) => p.totalValue),
    );
    const volatility = this.calculateVolatility(returns);
    const sharpeRatio = this.calculateSharpeRatio(returns);

    return {
      portfolioId: id,
      totalValue: Math.round(currentValue * 100) / 100,
      totalGain: Math.round(totalGain * 100) / 100,
      totalGainPercent: Math.round(totalGainPercent * 100) / 100,
      dayGain: Math.round(dayGain * 100) / 100,
      dayGainPercent: Math.round(dayGainPercent * 100) / 100,
      positions:
        portfolio.positions?.map((pos) => ({
          symbol: pos.symbol,
          gain: pos.unrealizedPnL || 0,
          gainPercent:
            pos.totalCost > 0
              ? ((pos.unrealizedPnL || 0) / pos.totalCost) * 100
              : 0,
          quantity: pos.quantity,
          currentValue: pos.currentValue || pos.totalCost,
        })) || [],
      performance: performanceHistory,
      metrics: {
        maxDrawdown: Math.round(maxDrawdown * 100) / 100,
        volatility: Math.round(volatility * 100) / 100,
        sharpeRatio: Math.round(sharpeRatio * 100) / 100,
        bestDay: returns.length > 0 ? Math.max(...returns) : 0,
        worstDay: returns.length > 0 ? Math.min(...returns) : 0,
        totalReturn: totalGainPercent,
        annualizedReturn:
          Math.round(
            ((totalGainPercent * 365) /
              Math.max(1, performanceHistory.length)) *
              100,
          ) / 100,
      },
    };
  }

  private async calculatePerformanceHistory(
    portfolio: Portfolio,
    trades: Trade[],
  ): Promise<any[]> {
    const history: any[] = [];
    let currentCash = portfolio.initialCash;
    let currentPositions: {
      [symbol: string]: { quantity: number; avgPrice: number };
    } = {};

    // Start with initial portfolio state
    history.push({
      date: portfolio.createdAt.toISOString().split('T')[0],
      timestamp: portfolio.createdAt.getTime(),
      totalValue: portfolio.initialCash,
      cash: portfolio.initialCash,
      investedValue: 0,
      dayChange: 0,
      dayChangePercent: 0,
    });

    // Process each trade chronologically
    for (const trade of trades) {
      const tradeValue = Number(trade.totalValue);

      if (trade.type === TradeType.BUY) {
        currentCash -= tradeValue;
        if (currentPositions[trade.symbol]) {
          const totalQuantity =
            currentPositions[trade.symbol].quantity + trade.quantity;
          const totalCost =
            currentPositions[trade.symbol].quantity *
              currentPositions[trade.symbol].avgPrice +
            tradeValue;
          currentPositions[trade.symbol] = {
            quantity: totalQuantity,
            avgPrice: totalCost / totalQuantity,
          };
        } else {
          currentPositions[trade.symbol] = {
            quantity: trade.quantity,
            avgPrice: Number(trade.price),
          };
        }
      } else {
        currentCash += tradeValue;
        if (currentPositions[trade.symbol]) {
          currentPositions[trade.symbol].quantity -= trade.quantity;
          if (currentPositions[trade.symbol].quantity <= 0) {
            delete currentPositions[trade.symbol];
          }
        }
      } // Calculate current invested value using current market prices
      let investedValue = 0;
      for (const [symbol, position] of Object.entries(currentPositions)) {
        // Fetch current stock price from database
        const stock = await this.stockRepository.findOne({
          where: { symbol: symbol.toUpperCase() },
        });
        const currentPrice = stock
          ? Number(stock.currentPrice)
          : position.avgPrice;
        investedValue += position.quantity * currentPrice;
      }

      const totalValue = currentCash + investedValue;
      const prevValue =
        history[history.length - 1]?.totalValue || portfolio.initialCash;
      const dayChange = totalValue - prevValue;
      const dayChangePercent =
        prevValue > 0 ? (dayChange / prevValue) * 100 : 0;

      history.push({
        date: trade.executedAt.toISOString().split('T')[0],
        timestamp: trade.executedAt.getTime(),
        totalValue: Math.round(totalValue * 100) / 100,
        cash: Math.round(currentCash * 100) / 100,
        investedValue: Math.round(investedValue * 100) / 100,
        dayChange: Math.round(dayChange * 100) / 100,
        dayChangePercent: Math.round(dayChangePercent * 100) / 100,
      });
    }

    // If no trades, return at least the initial state
    return history.length > 1 ? history : history;
  }

  /**
   * Update position values based on current stock prices
   */
  private async updatePositionValues(portfolio: Portfolio): Promise<void> {
    if (!portfolio.positions) return;

    for (const position of portfolio.positions) {
      const stock = await this.stockRepository.findOne({
        where: { symbol: position.symbol },
      });

      if (stock) {
        const currentPrice = Number(stock.currentPrice);
        position.currentValue = currentPrice * position.quantity;
        position.unrealizedPnL = position.currentValue - position.totalCost;
        position.unrealizedReturn =
          position.totalCost > 0
            ? (position.unrealizedPnL / position.totalCost) * 100
            : 0;
      }
    }

    await this.updatePortfolioTotals(portfolio);
  }

  /**
   * Update portfolio total values
   */
  private async updatePortfolioTotals(portfolio: Portfolio): Promise<void> {
    const totalPositionValue =
      portfolio.positions?.reduce(
        (sum, pos) => sum + (pos.currentValue || pos.totalCost),
        0,
      ) || 0;

    portfolio.totalValue = portfolio.currentCash + totalPositionValue;
    portfolio.totalPnL = portfolio.totalValue - portfolio.initialCash;
    portfolio.totalReturn =
      portfolio.initialCash > 0
        ? (portfolio.totalPnL / portfolio.initialCash) * 100
        : 0;
  }

  private calculateMaxDrawdown(values: number[]): number {
    let maxDrawdown = 0;
    let peak = values[0];

    for (let i = 1; i < values.length; i++) {
      if (values[i] > peak) {
        peak = values[i];
      }
      const drawdown = ((peak - values[i]) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length < 2) return 0;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) /
      returns.length;
    return Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
  }

  private calculateSharpeRatio(returns: number[]): number {
    if (returns.length < 2) return 0;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const std = Math.sqrt(
      returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) /
        returns.length,
    );
    const riskFreeRate = 0.02 / 252; // 2% annual risk-free rate, daily
    return std === 0 ? 0 : ((mean - riskFreeRate) / std) * Math.sqrt(252); // Annualized
  }

  /**
   * Calculate today's portfolio gain based on stock price movements
   */
  private async calculateDayGain(portfolio: Portfolio): Promise<number> {
    if (!portfolio.positions || portfolio.positions.length === 0) {
      return 0;
    }

    let dayGain = 0;

    for (const position of portfolio.positions) {
      const stock = await this.stockRepository.findOne({
        where: { symbol: position.symbol },
      });

      if (stock && stock.previousClose && stock.currentPrice) {
        const currentPrice = Number(stock.currentPrice);
        const previousClose = Number(stock.previousClose);
        const priceChange = currentPrice - previousClose;
        const positionDayGain = priceChange * position.quantity;
        dayGain += positionDayGain;
      }
    }

    return dayGain;
  }

  /**
   * Enhanced real-time portfolio performance update
   * Called frequently for live tracking
   */
  async updatePortfolioRealTimePerformance(portfolioId: number): Promise<any> {
    const portfolio = await this.getPortfolio(portfolioId);

    // Update all position values with current market prices
    await this.updateAllPositionValues(portfolio);

    // Recalculate portfolio totals
    await this.updatePortfolioTotals(portfolio);
    await this.portfolioRepository.save(portfolio);

    // Calculate enhanced performance metrics
    const performance = await this.calculateRealTimePerformance(portfolio);

    return performance;
  }

  /**
   * Update all positions with current market prices in real-time
   */
  private async updateAllPositionValues(portfolio: Portfolio): Promise<void> {
    if (!portfolio.positions || portfolio.positions.length === 0) {
      return;
    }

    for (const position of portfolio.positions) {
      await this.updateSinglePositionValue(position);
    }
  }

  /**
   * Update a single position with current market price
   */
  private async updateSinglePositionValue(position: any): Promise<void> {
    try {
      const stock = await this.stockRepository.findOne({
        where: { symbol: position.symbol.toUpperCase() },
      });

      if (stock && stock.currentPrice) {
        const currentPrice = Number(stock.currentPrice);
        const currentValue = position.quantity * currentPrice;
        const unrealizedPnL = currentValue - Number(position.totalCost);
        const unrealizedReturn =
          Number(position.totalCost) > 0
            ? (unrealizedPnL / Number(position.totalCost)) * 100
            : 0;

        // Update position values
        position.currentValue = Math.round(currentValue * 100) / 100;
        position.unrealizedPnL = Math.round(unrealizedPnL * 100) / 100;
        position.unrealizedReturn = Math.round(unrealizedReturn * 100) / 100;

        // Save position updates
        await this.positionRepository.save(position);

        console.log(
          `📊 Updated position ${position.symbol}: $${currentValue.toFixed(2)} (${unrealizedReturn.toFixed(2)}%)`,
        );
      }
    } catch (error) {
      console.error(`Error updating position ${position.symbol}:`, error);
    }
  }

  /**
   * Calculate enhanced real-time performance metrics
   */
  private async calculateRealTimePerformance(
    portfolio: Portfolio,
  ): Promise<any> {
    // Get today's opening portfolio value for day calculation
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // Calculate day start value (portfolio value at market open)
    const dayStartValue = await this.getPortfolioValueAtTime(
      portfolio.id,
      todayStart,
    );

    const currentValue = portfolio.totalValue;
    const dayGain = currentValue - dayStartValue;
    const dayGainPercent =
      dayStartValue > 0 ? (dayGain / dayStartValue) * 100 : 0;

    // Enhanced position details with real-time data
    const enhancedPositions =
      portfolio.positions?.map((position) => ({
        symbol: position.symbol,
        quantity: position.quantity,
        averagePrice: Number(position.averagePrice),
        currentValue:
          Number(position.currentValue) || Number(position.totalCost),
        totalCost: Number(position.totalCost),
        unrealizedPnL: Number(position.unrealizedPnL || 0),
        unrealizedReturn: Number(position.unrealizedReturn || 0),
        dayChange: this.calculatePositionDayChange(position),
        dayChangePercent: this.calculatePositionDayChangePercent(position),
        lastUpdated: new Date().toISOString(),
      })) || [];

    // Calculate portfolio allocation percentages
    const totalInvestedValue = enhancedPositions.reduce(
      (sum, pos) => sum + pos.currentValue,
      0,
    );
    const positionsWithAllocation = enhancedPositions.map((position) => ({
      ...position,
      allocationPercent:
        totalInvestedValue > 0
          ? (position.currentValue / totalInvestedValue) * 100
          : 0,
    }));

    return {
      portfolioId: portfolio.id,
      timestamp: new Date().toISOString(),
      totalValue: Math.round(currentValue * 100) / 100,
      currentCash: Math.round(Number(portfolio.currentCash) * 100) / 100,
      investedValue: Math.round(totalInvestedValue * 100) / 100,
      totalPnL: Math.round(Number(portfolio.totalPnL) * 100) / 100,
      totalReturn: Math.round(Number(portfolio.totalReturn) * 100) / 100,
      dayGain: Math.round(dayGain * 100) / 100,
      dayGainPercent: Math.round(dayGainPercent * 100) / 100,
      dayStartValue: Math.round(dayStartValue * 100) / 100,
      positions: positionsWithAllocation,
      summary: {
        totalPositions: positionsWithAllocation.length,
        gainers: positionsWithAllocation.filter((p) => p.unrealizedPnL > 0)
          .length,
        losers: positionsWithAllocation.filter((p) => p.unrealizedPnL < 0)
          .length,
        topGainer: this.getTopPerformer(positionsWithAllocation, 'gain'),
        topLoser: this.getTopPerformer(positionsWithAllocation, 'loss'),
      },
    };
  }

  /**
   * Get portfolio value at a specific time (for day calculations)
   */
  private async getPortfolioValueAtTime(
    portfolioId: number,
    timestamp: Date,
  ): Promise<number> {
    try {
      // For simplicity, we'll use the previous day's closing value
      // In production, you might want to store hourly snapshots
      const portfolio = await this.getPortfolio(portfolioId);

      // If timestamp is today's start, use yesterday's total value as approximation
      const yesterday = new Date(timestamp);
      yesterday.setDate(yesterday.getDate() - 1);

      // For now, return portfolio's current value minus today's changes
      // This is a simplified calculation - in production you'd want to store daily snapshots
      return Number(portfolio.totalValue) - Number(portfolio.totalPnL * 0.1); // Rough approximation
    } catch (error) {
      console.error('Error getting portfolio value at time:', error);
      return 0;
    }
  }

  /**
   * Calculate position-level day change (simplified)
   */
  private calculatePositionDayChange(position: any): number {
    // This is a simplified calculation
    // In production, you'd track opening prices for each position
    const dayChangeEstimate = Number(position.unrealizedPnL || 0) * 0.1;
    return Math.round(dayChangeEstimate * 100) / 100;
  }

  /**
   * Calculate position-level day change percentage
   */
  private calculatePositionDayChangePercent(position: any): number {
    const dayChange = this.calculatePositionDayChange(position);
    const currentValue = Number(position.currentValue || position.totalCost);
    return currentValue > 0
      ? Math.round((dayChange / currentValue) * 100 * 100) / 100
      : 0;
  }

  /**
   * Get top performer (gainer or loser)
   */
  private getTopPerformer(positions: any[], type: 'gain' | 'loss'): any {
    if (positions.length === 0) return null;

    if (type === 'gain') {
      return positions.reduce((prev, current) =>
        current.unrealizedReturn > prev.unrealizedReturn ? current : prev,
      );
    } else {
      return positions.reduce((prev, current) =>
        current.unrealizedReturn < prev.unrealizedReturn ? current : prev,
      );
    }
  }
  /**
   * Batch update multiple portfolios for real-time tracking
   */
  async updateMultiplePortfoliosRealTime(
    portfolioIds: number[],
  ): Promise<any[]> {
    const results: any[] = [];

    for (const portfolioId of portfolioIds) {
      try {
        const performance =
          await this.updatePortfolioRealTimePerformance(portfolioId);
        results.push(performance);
      } catch (error) {
        console.error(`Error updating portfolio ${portfolioId}:`, error);
        results.push({
          portfolioId,
          error: 'Failed to update portfolio',
          timestamp: new Date().toISOString(),
        });
      }
    }

    return results;
  }

  /**
   * Get trade history for a specific position
   */
  async getPositionTradeHistory(
    portfolioId: number,
    symbol: string,
  ): Promise<any[]> {
    try {
      const trades = await this.tradeRepository.find({
        where: {
          portfolioId: portfolioId,
          symbol: symbol.toUpperCase(),
        },
        order: { executedAt: 'DESC' },
      });

      return trades.map((trade) => ({
        id: trade.id,
        type: trade.type,
        quantity: trade.quantity,
        price: Number(trade.price),
        totalValue: Number(trade.totalValue),
        executedAt: trade.executedAt,
        status: trade.status,
      }));
    } catch (error) {
      console.error(`Error getting trade history for ${symbol}:`, error);
      return [];
    }
  }
}
