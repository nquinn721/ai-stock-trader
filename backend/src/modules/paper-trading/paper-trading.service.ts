import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from '../../entities/portfolio.entity';
import { Position } from '../../entities/position.entity';
import { Stock } from '../../entities/stock.entity';
import { Trade, TradeStatus, TradeType } from '../../entities/trade.entity';
import { MLService } from '../ml/services/ml.service';

// DTOs that the controller expects
export class CreatePortfolioDto {
  userId: string;
  portfolioType:
    | 'DAY_TRADING_PRO'
    | 'DAY_TRADING_STANDARD'
    | 'SMALL_ACCOUNT_BASIC'
    | 'MICRO_ACCOUNT_STARTER';
  initialBalance?: number;
}

// Portfolio type configurations
export const PORTFOLIO_CONFIGS = {
  DAY_TRADING_PRO: {
    name: 'Day Trading Pro',
    initialBalance: 50000,
    dayTradingEnabled: true,
    description: 'Professional day trading account with $50k starting capital',
    minBalance: 25000, // SEC requirement for pattern day trading
  },
  DAY_TRADING_STANDARD: {
    name: 'Day Trading Standard',
    initialBalance: 30000,
    dayTradingEnabled: true,
    description: 'Standard day trading account with $30k starting capital',
    minBalance: 25000,
  },
  SMALL_ACCOUNT_BASIC: {
    name: 'Small Account Basic',
    initialBalance: 1000,
    dayTradingEnabled: false,
    description:
      'Basic account with $1k starting capital, day trading restricted',
    minBalance: 0,
  },
  MICRO_ACCOUNT_STARTER: {
    name: 'Micro Account Starter',
    initialBalance: 500,
    dayTradingEnabled: false,
    description:
      'Starter account with $500 starting capital, day trading restricted',
    minBalance: 0,
  },
};

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
    private mlService: MLService,
  ) {} /**
   * Create a new portfolio with specified type
   */
  async createPortfolio(
    createPortfolioDto: CreatePortfolioDto,
  ): Promise<Portfolio> {
    const { userId, portfolioType } = createPortfolioDto;

    // Get configuration for the portfolio type
    const config = PORTFOLIO_CONFIGS[portfolioType];
    if (!config) {
      throw new Error(`Invalid portfolio type: ${portfolioType}`);
    }

    const initialBalance =
      createPortfolioDto.initialBalance || config.initialBalance;

    // Validate minimum balance for day trading accounts
    if (config.dayTradingEnabled && initialBalance < config.minBalance) {
      throw new Error(
        `Day trading portfolios require minimum $${config.minBalance} balance`,
      );
    }

    const portfolio = this.portfolioRepository.create({
      name: `${config.name} - ${userId}`,
      portfolioType,
      dayTradingEnabled: config.dayTradingEnabled,
      dayTradeCount: 0,
      lastDayTradeReset: new Date(),
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
    } // Check for existing position
    let position = await this.positionRepository.findOne({
      where: { portfolioId: portfolio.id, symbol: symbol.toUpperCase() },
    });

    if (type === 'sell' && (!position || position.quantity < quantity)) {
      throw new Error('Insufficient shares to sell');
    } // Check day trading rules
    await this.checkDayTradeLimit(portfolio, symbol, type); // Enhanced ML-based risk assessment for the trade
    let riskAssessment: any = null;
    try {
      riskAssessment = await this.mlService.getRiskOptimization(
        portfolio.id,
        symbol,
      );
      console.log(`🤖 ML Risk Assessment for ${symbol} trade:`, {
        recommendedPosition: riskAssessment?.recommendedPosition,
        maxDrawdown: riskAssessment?.maxDrawdown,
        volatilityAdjustment: riskAssessment?.volatilityAdjustment,
      });

      // Validate trade size against ML recommendations
      if (riskAssessment) {
        const portfolioValue = portfolio.totalValue;
        const maxRecommendedPosition =
          portfolioValue * riskAssessment.recommendedPosition;

        if (type === 'buy' && totalAmount > maxRecommendedPosition) {
          console.warn(
            `⚠️ Trade size ${totalAmount} exceeds ML recommendation ${maxRecommendedPosition} for ${symbol}`,
          );
          // Could adjust quantity or provide warning, but allowing trade to proceed
        }
      }

      // Log ML-enhanced trade decision
      console.log(
        `✅ ML-Enhanced Trade Validation: ${type.toUpperCase()} ${quantity} shares of ${symbol} at $${currentPrice}`,
      );
    } catch (error) {
      console.warn(
        `⚠️ ML risk assessment failed for ${symbol}:`,
        error.message,
      );
      // Continue with traditional validation
    }

    // Create trade record
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
   * Get ML-enhanced portfolio analysis and recommendations
   */
  async getMLPortfolioAnalysis(portfolioId: number): Promise<any> {
    try {
      const portfolio = await this.getPortfolio(portfolioId);

      // Get ML optimization recommendations
      const mlOptimization =
        await this.mlService.getPortfolioOptimization(portfolioId);
      // Get individual position risk assessments
      const positionRisks: any[] = [];
      if (portfolio.positions && portfolio.positions.length > 0) {
        for (const position of portfolio.positions) {
          try {
            const riskParams = await this.mlService.getRiskOptimization(
              portfolioId,
              position.symbol,
            );
            positionRisks.push({
              symbol: position.symbol,
              currentValue: position.currentValue || position.totalCost,
              quantity: position.quantity,
              mlRisk: {
                recommendedPosition: riskParams.recommendedPosition,
                volatilityAdjustment: riskParams.volatilityAdjustment,
                correlationRisk: riskParams.correlationRisk,
                maxDrawdown: riskParams.maxDrawdown,
              },
              recommendation: this.getPositionRecommendation(
                position,
                riskParams,
              ),
            });
          } catch (error) {
            console.warn(
              `Failed to get ML risk for ${position.symbol}:`,
              error.message,
            );
          }
        }
      }

      // Calculate portfolio-level ML insights
      const portfolioInsights = {
        totalMLScore: this.calculatePortfolioMLScore(positionRisks),
        riskLevel: this.assessPortfolioRiskLevel(positionRisks),
        diversificationScore:
          this.calculateMLDiversificationScore(positionRisks),
        recommendations: this.generateMLRecommendations(
          positionRisks,
          mlOptimization,
        ),
      };

      return {
        portfolioId,
        timestamp: new Date().toISOString(),
        mlOptimization,
        positionRisks,
        portfolioInsights,
        summary: {
          totalPositions: positionRisks.length,
          highRiskPositions: positionRisks.filter(
            (p) => p.mlRisk.correlationRisk > 0.3,
          ).length,
          recommendedActions: portfolioInsights.recommendations.length,
          overallRiskScore: portfolioInsights.totalMLScore,
        },
      };
    } catch (error) {
      console.error('Error generating ML portfolio analysis:', error);
      throw new Error('Failed to generate ML portfolio analysis');
    }
  }

  /**
   * Get position recommendation based on ML risk parameters
   */
  private getPositionRecommendation(position: any, riskParams: any): string {
    const currentValue = position.currentValue || position.totalCost;
    const volatilityRisk = riskParams.volatilityAdjustment;
    const correlationRisk = riskParams.correlationRisk;

    if (correlationRisk > 0.4) {
      return 'REDUCE - High correlation risk detected';
    } else if (volatilityRisk > 1.3) {
      return 'MONITOR - High volatility risk';
    } else if (riskParams.recommendedPosition < 0.05) {
      return 'HOLD - Low risk, maintain position';
    } else {
      return 'OPTIMAL - Position within recommended parameters';
    }
  }

  /**
   * Calculate overall portfolio ML score
   */
  private calculatePortfolioMLScore(positionRisks: any[]): number {
    if (positionRisks.length === 0) return 0;

    const totalRisk = positionRisks.reduce((sum, pos) => {
      return (
        sum +
        pos.mlRisk.correlationRisk +
        (pos.mlRisk.volatilityAdjustment - 1) * 0.1
      );
    }, 0);

    return Math.min(Math.max((totalRisk / positionRisks.length) * 100, 0), 100);
  }

  /**
   * Assess portfolio risk level
   */
  private assessPortfolioRiskLevel(positionRisks: any[]): string {
    const avgRisk = this.calculatePortfolioMLScore(positionRisks);

    if (avgRisk < 20) return 'LOW';
    else if (avgRisk < 50) return 'MODERATE';
    else if (avgRisk < 80) return 'HIGH';
    else return 'CRITICAL';
  }

  /**
   * Calculate ML-based diversification score
   */
  private calculateMLDiversificationScore(positionRisks: any[]): number {
    if (positionRisks.length < 2) return 0;

    const avgCorrelation =
      positionRisks.reduce((sum, pos) => sum + pos.mlRisk.correlationRisk, 0) /
      positionRisks.length;
    return Math.max(0, (1 - avgCorrelation) * 100);
  }
  /**
   * Generate ML-based recommendations
   */
  private generateMLRecommendations(
    positionRisks: any[],
    mlOptimization: any,
  ): string[] {
    const recommendations: string[] = [];

    // Risk-based recommendations
    const highRiskPositions = positionRisks.filter(
      (p) => p.mlRisk.correlationRisk > 0.3,
    );
    if (highRiskPositions.length > 0) {
      recommendations.push(
        `Consider reducing exposure to ${highRiskPositions.length} high-correlation positions`,
      );
    }

    // Volatility recommendations
    const volatilePositions = positionRisks.filter(
      (p) => p.mlRisk.volatilityAdjustment > 1.5,
    );
    if (volatilePositions.length > 0) {
      recommendations.push(
        `Monitor ${volatilePositions.length} high-volatility positions for potential stop-loss triggers`,
      );
    }

    // Portfolio optimization recommendations
    if (mlOptimization && mlOptimization.recommendations) {
      mlOptimization.recommendations.forEach((rec) => {
        if (Math.abs(rec.currentWeight - rec.recommendedWeight) > 0.05) {
          recommendations.push(
            `Adjust ${rec.symbol} allocation from ${(rec.currentWeight * 100).toFixed(1)}% to ${(rec.recommendedWeight * 100).toFixed(1)}%`,
          );
        }
      });
    }

    return recommendations;
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

  /**
   * Check if a trade would be considered a day trade
   */
  private async isDayTrade(
    portfolioId: number,
    symbol: string,
    type: 'buy' | 'sell',
  ): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all trades for this symbol today
    const todayTrades = await this.tradeRepository.find({
      where: {
        portfolioId,
        symbol: symbol.toUpperCase(),
        executedAt: {
          $gte: today,
          $lt: tomorrow,
        } as any,
      },
      order: { executedAt: 'ASC' },
    });

    // If selling and we bought the same symbol today, it's a day trade
    if (type === 'sell') {
      return todayTrades.some((trade) => trade.type === TradeType.BUY);
    }

    // If buying and we plan to sell today (this is harder to detect in advance)
    // For now, we'll just check if there are existing positions that might be sold
    return false;
  }

  /**
   * Check and update day trade count for a portfolio
   */
  private async checkDayTradeLimit(
    portfolio: Portfolio,
    symbol: string,
    type: 'buy' | 'sell',
  ): Promise<void> {
    // Reset day trade count if needed (every 5 business days)
    await this.resetDayTradeCountIfNeeded(portfolio);

    // Check if this would be a day trade
    const isDayTrade = await this.isDayTrade(portfolio.id, symbol, type);

    if (isDayTrade) {
      // If day trading is not enabled, block the trade
      if (!portfolio.dayTradingEnabled) {
        throw new Error(
          'Day trading is not allowed for this account type. You must wait until the next business day to sell positions purchased today.',
        );
      }

      // Check if account has minimum balance for pattern day trading
      const config = PORTFOLIO_CONFIGS[portfolio.portfolioType];
      if (portfolio.totalValue < config.minBalance) {
        throw new Error(
          `Account value must be at least $${config.minBalance} for pattern day trading. Current value: $${portfolio.totalValue}`,
        );
      }

      // Check day trade limit (4 day trades per 5 business days for pattern day traders)
      if (portfolio.dayTradeCount >= 3) {
        // Allow 3 completed day trades, 4th would trigger PDT rule
        throw new Error(
          'Pattern Day Trader limit reached. You have used 3 day trades in the past 5 business days. Additional day trades require $25,000 minimum account value.',
        );
      }

      // Increment day trade count
      portfolio.dayTradeCount += 1;
      await this.portfolioRepository.save(portfolio);
    }
  }

  /**
   * Reset day trade count if 5 business days have passed
   */
  private async resetDayTradeCountIfNeeded(
    portfolio: Portfolio,
  ): Promise<void> {
    const lastReset = portfolio.lastDayTradeReset;
    const now = new Date();

    // Calculate business days since last reset
    const businessDaysPassed = this.getBusinessDaysBetween(lastReset, now);

    if (businessDaysPassed >= 5) {
      portfolio.dayTradeCount = 0;
      portfolio.lastDayTradeReset = now;
      await this.portfolioRepository.save(portfolio);
    }
  }

  /**
   * Calculate business days between two dates
   */
  private getBusinessDaysBetween(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);

    while (current < endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Not Sunday (0) or Saturday (6)
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  /**
   * Get available portfolio type configurations
   */
  getPortfolioTypes() {
    return Object.entries(PORTFOLIO_CONFIGS).map(([key, config]) => ({
      type: key,
      ...config,
    }));
  }

  /**
   * Create portfolios with predefined types for testing
   */
  async createDefaultPortfolios(userId: string): Promise<Portfolio[]> {
    const portfolios: Portfolio[] = [];

    // Create all four portfolio types
    const types: Array<keyof typeof PORTFOLIO_CONFIGS> = [
      'DAY_TRADING_PRO',
      'DAY_TRADING_STANDARD',
      'SMALL_ACCOUNT_BASIC',
      'MICRO_ACCOUNT_STARTER',
    ];

    for (const portfolioType of types) {
      try {
        const portfolio = await this.createPortfolio({
          userId,
          portfolioType,
        });
        portfolios.push(portfolio);
      } catch (error) {
        console.error(`Failed to create ${portfolioType} portfolio:`, error);
      }
    }

    return portfolios;
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
}
