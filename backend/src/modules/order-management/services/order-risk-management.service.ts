import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderSide } from '../../../entities/order.entity';
import { Portfolio } from '../../../entities/portfolio.entity';
import { Position } from '../../../entities/position.entity';
import { Stock } from '../../../entities/stock.entity';

export interface RiskValidationResult {
  isValid: boolean;
  violations: string[];
  recommendations: string[];
  adjustedQuantity?: number;
  riskScore: number;
}

export interface PositionRiskMetrics {
  currentExposure: number;
  proposedExposure: number;
  concentrationRisk: number;
  portfolioPercentage: number;
  recommendedMaxPosition: number;
}

export interface OrderRiskLimits {
  maxOrderSize: number;
  maxPortfolioConcentration: number; // Percentage
  maxSingleStockExposure: number; // Dollar amount
  dayTradingBuyingPower: number;
  maxDailyLoss: number;
  maxLeverage: number;
}

@Injectable()
export class OrderRiskManagementService {
  private readonly logger = new Logger(OrderRiskManagementService.name);

  // Default risk limits
  private readonly DEFAULT_RISK_LIMITS: OrderRiskLimits = {
    maxOrderSize: 10000, // $10,000 per order
    maxPortfolioConcentration: 20, // 20% max in single stock
    maxSingleStockExposure: 25000, // $25,000 max per stock
    dayTradingBuyingPower: 100000, // $100,000 day trading power
    maxDailyLoss: 5000, // $5,000 max daily loss
    maxLeverage: 2.0, // 2:1 max leverage
  };

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Portfolio)
    private readonly portfolioRepository: Repository<Portfolio>,
    @InjectRepository(Position)
    private readonly positionRepository: Repository<Position>,
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
  ) {}

  /**
   * Validate order against risk management rules
   */
  async validateOrderRisk(
    order: Order,
    customLimits?: Partial<OrderRiskLimits>,
  ): Promise<RiskValidationResult> {
    try {
      const riskLimits = { ...this.DEFAULT_RISK_LIMITS, ...customLimits };
      const violations: string[] = [];
      const recommendations: string[] = [];
      let riskScore = 0;

      // Get portfolio and current positions
      const portfolio = await this.portfolioRepository.findOne({
        where: { id: order.portfolioId },
      });

      if (!portfolio) {
        throw new Error(`Portfolio ${order.portfolioId} not found`);
      }

      const stock = await this.stockRepository.findOne({
        where: { symbol: order.symbol },
      });

      if (!stock) {
        throw new Error(`Stock ${order.symbol} not found`);
      }

      const currentPrice = Number(stock.currentPrice);
      const orderValue =
        Number(order.quantity) * (Number(order.limitPrice) || currentPrice);

      // 1. Validate order size limits
      const orderSizeCheck = this.validateOrderSize(orderValue, riskLimits);
      violations.push(...orderSizeCheck.violations);
      recommendations.push(...orderSizeCheck.recommendations);
      riskScore += orderSizeCheck.riskScore;

      // 2. Validate buying power for buy orders
      if (order.side === OrderSide.BUY) {
        const buyingPowerCheck = await this.validateBuyingPower(
          portfolio,
          order,
          orderValue,
          riskLimits,
        );
        violations.push(...buyingPowerCheck.violations);
        recommendations.push(...buyingPowerCheck.recommendations);
        riskScore += buyingPowerCheck.riskScore;
      }

      // 3. Validate position concentration
      const concentrationCheck = await this.validateConcentrationRisk(
        portfolio,
        order,
        orderValue,
        riskLimits,
      );
      violations.push(...concentrationCheck.violations);
      recommendations.push(...concentrationCheck.recommendations);
      riskScore += concentrationCheck.riskScore;

      // 4. Validate day trading rules
      const dayTradingCheck = await this.validateDayTradingRules(
        portfolio,
        order,
        orderValue,
        riskLimits,
      );
      violations.push(...dayTradingCheck.violations);
      recommendations.push(...dayTradingCheck.recommendations);
      riskScore += dayTradingCheck.riskScore;

      // 5. Validate daily loss limits
      const dailyLossCheck = await this.validateDailyLossLimits(
        portfolio,
        order,
        orderValue,
        riskLimits,
      );
      violations.push(...dailyLossCheck.violations);
      recommendations.push(...dailyLossCheck.recommendations);
      riskScore += dailyLossCheck.riskScore;

      // 6. Calculate position sizing recommendations
      const positionSizingCheck = await this.calculateOptimalPositionSize(
        portfolio,
        order,
        riskLimits,
      );
      recommendations.push(...positionSizingCheck.recommendations);

      const result: RiskValidationResult = {
        isValid: violations.length === 0,
        violations,
        recommendations,
        adjustedQuantity: positionSizingCheck.adjustedQuantity,
        riskScore: Math.min(riskScore, 100), // Cap at 100
      };

      this.logger.log(
        `Risk validation for order ${order.symbol}: ${violations.length} violations, risk score: ${result.riskScore}`,
      );

      return result;
    } catch (error) {
      this.logger.error('Error validating order risk:', error);
      throw error;
    }
  }

  /**
   * Validate order size against limits
   */
  private validateOrderSize(
    orderValue: number,
    riskLimits: OrderRiskLimits,
  ): { violations: string[]; recommendations: string[]; riskScore: number } {
    const violations: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    if (orderValue > riskLimits.maxOrderSize) {
      violations.push(
        `Order value $${orderValue.toFixed(2)} exceeds maximum order size of $${riskLimits.maxOrderSize.toFixed(2)}`,
      );
      riskScore += 25;
    } else if (orderValue > riskLimits.maxOrderSize * 0.8) {
      recommendations.push(
        `Large order detected. Consider splitting into smaller orders to reduce market impact.`,
      );
      riskScore += 10;
    }

    return { violations, recommendations, riskScore };
  }

  /**
   * Validate buying power for purchase orders
   */
  private async validateBuyingPower(
    portfolio: Portfolio,
    order: Order,
    orderValue: number,
    riskLimits: OrderRiskLimits,
  ): Promise<{
    violations: string[];
    recommendations: string[];
    riskScore: number;
  }> {
    const violations: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    const currentCash = Number(portfolio.currentCash);
    const availableBuyingPower = currentCash * riskLimits.maxLeverage;

    if (orderValue > currentCash) {
      if (orderValue > availableBuyingPower) {
        violations.push(
          `Order value $${orderValue.toFixed(2)} exceeds available buying power of $${availableBuyingPower.toFixed(2)}`,
        );
        riskScore += 30;
      } else {
        recommendations.push(
          `Order requires leverage. Current cash: $${currentCash.toFixed(2)}, order value: $${orderValue.toFixed(2)}`,
        );
        riskScore += 15;
      }
    }

    // Check if this would exceed cash utilization threshold
    const cashUtilization = orderValue / currentCash;
    if (cashUtilization > 0.8) {
      recommendations.push(
        `High cash utilization (${(cashUtilization * 100).toFixed(1)}%). Consider maintaining cash reserves.`,
      );
      riskScore += 5;
    }

    return { violations, recommendations, riskScore };
  }

  /**
   * Validate portfolio concentration risk
   */
  private async validateConcentrationRisk(
    portfolio: Portfolio,
    order: Order,
    orderValue: number,
    riskLimits: OrderRiskLimits,
  ): Promise<{
    violations: string[];
    recommendations: string[];
    riskScore: number;
  }> {
    const violations: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    // Get current position in this stock
    const currentPosition = await this.positionRepository.findOne({
      where: { portfolioId: portfolio.id, symbol: order.symbol },
    });

    const stock = await this.stockRepository.findOne({
      where: { symbol: order.symbol },
    });

    const currentPrice = stock ? Number(stock.currentPrice) : 0;
    const currentPositionValue = currentPosition
      ? Number(currentPosition.quantity) * currentPrice
      : 0;

    const proposedPositionValue =
      order.side === OrderSide.BUY
        ? currentPositionValue + orderValue
        : currentPositionValue - orderValue;

    const portfolioValue = Number(portfolio.totalValue);
    const proposedConcentration =
      (proposedPositionValue / portfolioValue) * 100;

    // Check concentration limits
    if (proposedConcentration > riskLimits.maxPortfolioConcentration) {
      violations.push(
        `Proposed position would represent ${proposedConcentration.toFixed(1)}% of portfolio, exceeding limit of ${riskLimits.maxPortfolioConcentration}%`,
      );
      riskScore += 20;
    } else if (
      proposedConcentration >
      riskLimits.maxPortfolioConcentration * 0.8
    ) {
      recommendations.push(
        `High concentration warning: Position would be ${proposedConcentration.toFixed(1)}% of portfolio`,
      );
      riskScore += 10;
    }

    // Check absolute exposure limits
    if (proposedPositionValue > riskLimits.maxSingleStockExposure) {
      violations.push(
        `Proposed position value $${proposedPositionValue.toFixed(2)} exceeds maximum single stock exposure of $${riskLimits.maxSingleStockExposure.toFixed(2)}`,
      );
      riskScore += 15;
    }

    return { violations, recommendations, riskScore };
  }

  /**
   * Validate day trading rules
   */
  private async validateDayTradingRules(
    portfolio: Portfolio,
    order: Order,
    orderValue: number,
    riskLimits: OrderRiskLimits,
  ): Promise<{
    violations: string[];
    recommendations: string[];
    riskScore: number;
  }> {
    const violations: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    // Check if this is a day trading account
    const portfolioValue = Number(portfolio.totalValue);
    const isDayTradingAccount = portfolioValue >= 25000;

    if (!isDayTradingAccount && orderValue > portfolioValue * 2) {
      violations.push(
        `Account does not qualify for day trading. Orders are limited to 2x account value.`,
      );
      riskScore += 25;
    }

    // Count day trades for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await this.orderRepository.find({
      where: {
        portfolioId: portfolio.id,
        createdAt: new Date(today),
      },
    });

    const dayTradeCount = this.countDayTrades(todayOrders);

    if (!isDayTradingAccount && dayTradeCount >= 3) {
      violations.push(
        `Account is limited to 3 day trades per rolling 5-day period. Current count: ${dayTradeCount}`,
      );
      riskScore += 30;
    }

    return { violations, recommendations, riskScore };
  }

  /**
   * Validate daily loss limits
   */
  private async validateDailyLossLimits(
    portfolio: Portfolio,
    order: Order,
    orderValue: number,
    riskLimits: OrderRiskLimits,
  ): Promise<{
    violations: string[];
    recommendations: string[];
    riskScore: number;
  }> {
    const violations: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    // Calculate daily P&L
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await this.orderRepository.find({
      where: {
        portfolioId: portfolio.id,
        executedAt: new Date(today),
      },
    });

    const dailyPnL = this.calculateDailyPnL(todayOrders);

    if (Math.abs(dailyPnL) > riskLimits.maxDailyLoss) {
      violations.push(
        `Daily loss limit of $${riskLimits.maxDailyLoss.toFixed(2)} exceeded. Current P&L: $${dailyPnL.toFixed(2)}`,
      );
      riskScore += 35;
    } else if (Math.abs(dailyPnL) > riskLimits.maxDailyLoss * 0.8) {
      recommendations.push(
        `Approaching daily loss limit. Current P&L: $${dailyPnL.toFixed(2)}`,
      );
      riskScore += 15;
    }

    return { violations, recommendations, riskScore };
  }

  /**
   * Calculate optimal position size
   */
  private async calculateOptimalPositionSize(
    portfolio: Portfolio,
    order: Order,
    riskLimits: OrderRiskLimits,
  ): Promise<{ recommendations: string[]; adjustedQuantity?: number }> {
    const recommendations: string[] = [];

    const portfolioValue = Number(portfolio.totalValue);
    const stock = await this.stockRepository.findOne({
      where: { symbol: order.symbol },
    });

    if (!stock) {
      return { recommendations };
    }

    const currentPrice = Number(stock.currentPrice);
    const requestedValue = Number(order.quantity) * currentPrice;

    // Calculate position size based on portfolio percentage
    const maxPositionValue =
      portfolioValue * (riskLimits.maxPortfolioConcentration / 100);
    const maxQuantity = Math.floor(maxPositionValue / currentPrice);

    if (Number(order.quantity) > maxQuantity) {
      recommendations.push(
        `Consider reducing position size to ${maxQuantity} shares (${riskLimits.maxPortfolioConcentration}% of portfolio)`,
      );
      return { recommendations, adjustedQuantity: maxQuantity };
    }

    // Kelly Criterion suggestion (simplified)
    const volatility = 0.2; // Default 20% volatility (could be calculated from price history)
    const expectedReturn = 0.08; // Assume 8% expected return
    const kellyFraction = expectedReturn / (volatility * volatility);
    const kellyPositionValue = portfolioValue * Math.min(kellyFraction, 0.25); // Cap at 25%
    const kellyQuantity = Math.floor(kellyPositionValue / currentPrice);

    if (kellyQuantity < Number(order.quantity)) {
      recommendations.push(
        `Kelly Criterion suggests position size of ${kellyQuantity} shares for optimal risk-adjusted return`,
      );
    }

    return { recommendations };
  }

  /**
   * Count day trades in order list
   */
  private countDayTrades(orders: Order[]): number {
    // Group orders by symbol and count round trips
    const symbolOrders = new Map<string, Order[]>();

    orders.forEach((order) => {
      if (!symbolOrders.has(order.symbol)) {
        symbolOrders.set(order.symbol, []);
      }
      symbolOrders.get(order.symbol)!.push(order);
    });

    let dayTradeCount = 0;

    for (const [symbol, symbolOrderList] of symbolOrders) {
      // Sort by execution time
      symbolOrderList.sort(
        (a, b) =>
          (a.executedAt?.getTime() || 0) - (b.executedAt?.getTime() || 0),
      );

      // Count round trips (buy -> sell or sell -> buy on same day)
      let position = 0;
      let trades = 0;

      for (const order of symbolOrderList) {
        if (order.executedAt) {
          const prevPosition = position;
          position +=
            order.side === OrderSide.BUY
              ? Number(order.executedQuantity)
              : -Number(order.executedQuantity);

          // Check if this created a round trip
          if (
            (prevPosition > 0 && position <= 0) ||
            (prevPosition < 0 && position >= 0)
          ) {
            trades++;
          }
        }
      }

      dayTradeCount += trades;
    }

    return dayTradeCount;
  }

  /**
   * Calculate daily P&L from executed orders
   */
  private calculateDailyPnL(orders: Order[]): number {
    return orders.reduce((pnl, order) => {
      if (order.executedPrice && order.executedQuantity) {
        const tradeValue =
          Number(order.executedQuantity) * Number(order.executedPrice);
        return order.side === OrderSide.BUY
          ? pnl - tradeValue
          : pnl + tradeValue;
      }
      return pnl;
    }, 0);
  }

  /**
   * Get position risk metrics
   */
  async getPositionRiskMetrics(
    portfolioId: number,
    symbol: string,
    proposedQuantity: number,
    side: OrderSide,
  ): Promise<PositionRiskMetrics> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: portfolioId },
    });

    const currentPosition = await this.positionRepository.findOne({
      where: { portfolioId, symbol },
    });

    const stock = await this.stockRepository.findOne({
      where: { symbol },
    });

    if (!portfolio || !stock) {
      throw new Error('Portfolio or stock not found');
    }

    const currentPrice = Number(stock.currentPrice);
    const currentExposure = currentPosition
      ? Number(currentPosition.quantity) * currentPrice
      : 0;

    const proposedChange = proposedQuantity * currentPrice;
    const proposedExposure =
      side === OrderSide.BUY
        ? currentExposure + proposedChange
        : currentExposure - proposedChange;

    const portfolioValue = Number(portfolio.totalValue);
    const concentrationRisk = (proposedExposure / portfolioValue) * 100;
    const recommendedMaxPosition = portfolioValue * 0.2; // 20% max

    return {
      currentExposure,
      proposedExposure,
      concentrationRisk,
      portfolioPercentage: concentrationRisk,
      recommendedMaxPosition,
    };
  }
}
