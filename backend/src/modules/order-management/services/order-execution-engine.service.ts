import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import {
  ExecutionReport,
  Order,
  OrderSide,
  OrderStatus,
  OrderType,
} from '../../../entities/order.entity';
import { Stock } from '../../../entities/stock.entity';
import { PaperTradingService } from '../../paper-trading/paper-trading.service';

export interface ExecutionResult {
  success: boolean;
  orderId: number;
  executedPrice?: number;
  executedQuantity?: number;
  commission?: number;
  message: string;
  timestamp: Date;
  executionReports?: ExecutionReport[];
}

export interface SlippageConfig {
  enabled: boolean;
  basisPoints: number; // 1 basis point = 0.01%
  maxSlippage: number; // Maximum slippage in dollars
}

export interface CommissionConfig {
  baseFee: number;
  perShareFee: number;
  percentageFee: number;
  minimumFee: number;
  maximumFee: number;
}

@Injectable()
export class OrderExecutionEngine {
  private readonly logger = new Logger(OrderExecutionEngine.name);

  // Default configuration
  private readonly slippageConfig: SlippageConfig = {
    enabled: true,
    basisPoints: 5, // 0.05% slippage
    maxSlippage: 0.50, // Maximum $0.50 slippage
  };

  private readonly commissionConfig: CommissionConfig = {
    baseFee: 0.00, // No base fee for paper trading
    perShareFee: 0.005, // $0.005 per share
    percentageFee: 0.001, // 0.1% of trade value
    minimumFee: 1.00, // Minimum $1.00 commission
    maximumFee: 65.00, // Maximum $65.00 commission
  };

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    private readonly paperTradingService: PaperTradingService,
  ) {}

  /**
   * Execute a market order at current market price
   */
  async executeMarketOrder(order: Order): Promise<ExecutionResult> {
    try {
      const stock = await this.stockRepository.findOne({
        where: { symbol: order.symbol },
      });

      if (!stock) {
        throw new Error(`Stock ${order.symbol} not found`);
      }

      const marketPrice = Number(stock.currentPrice);
      if (marketPrice <= 0) {
        throw new Error(`Invalid market price for ${order.symbol}: ${marketPrice}`);
      }

      // Apply slippage for market orders
      const executionPrice = this.applySlippage(marketPrice, order.side);
      
      // Calculate commission
      const commission = this.calculateCommission(Number(order.quantity), executionPrice);

      // Execute the trade
      const result = await this.executeTrade(order, executionPrice, commission);

      if (result.success) {
        // Update order with execution details
        await this.updateOrderExecution(order, executionPrice, Number(order.quantity), commission);

        return {
          success: true,
          orderId: order.id,
          executedPrice: executionPrice,
          executedQuantity: Number(order.quantity),
          commission,
          message: 'Market order executed successfully',
          timestamp: new Date(),
        };
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      this.logger.error(`Error executing market order ${order.id}:`, error);
      return {
        success: false,
        orderId: order.id,
        message: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Execute a limit order at specified limit price or better
   */
  async executeLimitOrder(order: Order): Promise<ExecutionResult> {
    try {
      const stock = await this.stockRepository.findOne({
        where: { symbol: order.symbol },
      });

      if (!stock) {
        throw new Error(`Stock ${order.symbol} not found`);
      }

      const marketPrice = Number(stock.currentPrice);
      const limitPrice = Number(order.limitPrice);

      // Check if limit order can be executed
      let canExecute = false;
      let executionPrice = limitPrice;

      if (order.side === OrderSide.BUY && marketPrice <= limitPrice) {
        canExecute = true;
        executionPrice = Math.min(marketPrice, limitPrice); // Get best price
      } else if (order.side === OrderSide.SELL && marketPrice >= limitPrice) {
        canExecute = true;
        executionPrice = Math.max(marketPrice, limitPrice); // Get best price
      }

      if (!canExecute) {
        // Queue the order for future execution
        return {
          success: false,
          orderId: order.id,
          message: `Limit order queued - market price ${marketPrice}, limit ${limitPrice}`,
          timestamp: new Date(),
        };
      }

      // Calculate commission
      const commission = this.calculateCommission(Number(order.quantity), executionPrice);

      // Execute the trade
      const result = await this.executeTrade(order, executionPrice, commission);

      if (result.success) {
        // Update order with execution details
        await this.updateOrderExecution(order, executionPrice, Number(order.quantity), commission);

        return {
          success: true,
          orderId: order.id,
          executedPrice: executionPrice,
          executedQuantity: Number(order.quantity),
          commission,
          message: 'Limit order executed successfully',
          timestamp: new Date(),
        };
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      this.logger.error(`Error executing limit order ${order.id}:`, error);
      return {
        success: false,
        orderId: order.id,
        message: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Execute order with partial fills support
   */
  async executeOrderWithPartialFills(
    order: Order,
    maxFillQuantity?: number,
  ): Promise<ExecutionResult> {
    const fillQuantity = maxFillQuantity || Number(order.quantity);
    const remainingQuantity = Number(order.quantity) - Number(order.executedQuantity || 0);
    const actualFillQuantity = Math.min(fillQuantity, remainingQuantity);

    if (actualFillQuantity <= 0) {
      return {
        success: false,
        orderId: order.id,
        message: 'Order already fully executed',
        timestamp: new Date(),
      };
    }

    try {
      let executionResult: ExecutionResult;

      // Route to appropriate execution method
      switch (order.orderType) {
        case OrderType.MARKET:
          executionResult = await this.executeMarketOrder(order);
          break;
        case OrderType.LIMIT:
          executionResult = await this.executeLimitOrder(order);
          break;
        default:
          throw new Error(`Unsupported order type for execution: ${order.orderType}`);
      }

      if (executionResult.success && executionResult.executedQuantity) {
        // Handle partial fill
        const newExecutedQuantity = Number(order.executedQuantity || 0) + actualFillQuantity;
        const newFillCount = (order.fillCount || 0) + 1;

        // Create execution report
        const executionReport: ExecutionReport = {
          timestamp: new Date(),
          quantity: actualFillQuantity,
          price: executionResult.executedPrice!,
          commission: executionResult.commission!,
          venue: 'PAPER_TRADING',
          executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };

        // Update order with partial fill information
        order.executedQuantity = newExecutedQuantity;
        order.fillCount = newFillCount;
        order.executionReports = [...(order.executionReports || []), executionReport];

        // Calculate average execution price
        const totalValue = (order.executionReports || []).reduce(
          (sum, report) => sum + (report.quantity * report.price),
          0,
        );
        const totalQuantity = (order.executionReports || []).reduce(
          (sum, report) => sum + report.quantity,
          0,
        );
        order.avgExecutionPrice = totalValue / totalQuantity;

        // Check if order is fully executed
        if (newExecutedQuantity >= Number(order.quantity)) {
          order.status = OrderStatus.EXECUTED;
          order.executedAt = new Date();
        }

        await this.orderRepository.save(order);

        return {
          ...executionResult,
          executedQuantity: actualFillQuantity,
          message: newExecutedQuantity >= Number(order.quantity) 
            ? 'Order fully executed' 
            : `Partial fill: ${actualFillQuantity} of ${remainingQuantity} remaining`,
        };
      }

      return executionResult;
    } catch (error) {
      this.logger.error(`Error executing order with partial fills ${order.id}:`, error);
      return {
        success: false,
        orderId: order.id,
        message: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Apply slippage to market price based on order side
   */
  private applySlippage(marketPrice: number, side: OrderSide): number {
    if (!this.slippageConfig.enabled) {
      return marketPrice;
    }

    const slippageAmount = Math.min(
      marketPrice * (this.slippageConfig.basisPoints / 10000),
      this.slippageConfig.maxSlippage,
    );

    // Buy orders get worse prices (higher), sell orders get worse prices (lower)
    return side === OrderSide.BUY 
      ? marketPrice + slippageAmount 
      : marketPrice - slippageAmount;
  }

  /**
   * Calculate commission based on configuration
   */
  private calculateCommission(quantity: number, price: number): number {
    const tradeValue = quantity * price;
    
    let commission = this.commissionConfig.baseFee;
    commission += quantity * this.commissionConfig.perShareFee;
    commission += tradeValue * this.commissionConfig.percentageFee;

    // Apply min/max limits
    commission = Math.max(commission, this.commissionConfig.minimumFee);
    commission = Math.min(commission, this.commissionConfig.maximumFee);

    return Math.round(commission * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Execute the actual trade through paper trading service
   */
  private async executeTrade(
    order: Order,
    price: number,
    commission: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.paperTradingService.executeTrade({
        userId: `portfolio_${order.portfolioId}`,
        symbol: order.symbol,
        type: order.side === OrderSide.BUY ? 'buy' : 'sell',
        quantity: Number(order.quantity),
      });

      return { success: true, message: 'Trade executed successfully' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  /**
   * Update order with execution details
   */
  private async updateOrderExecution(
    order: Order,
    executedPrice: number,
    executedQuantity: number,
    commission: number,
  ): Promise<void> {
    order.status = OrderStatus.EXECUTED;
    order.executedPrice = executedPrice;
    order.executedQuantity = executedQuantity;
    order.commission = commission;
    order.executedAt = new Date();

    await this.orderRepository.save(order);
  }

  /**
   * Get execution quality metrics for analysis
   */
  async getExecutionQuality(portfolioId: number, period: number = 30): Promise<{
    averageSlippage: number;
    averageCommission: number;
    fillRate: number;
    averageExecutionTime: number;
    totalTrades: number;
  }> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - period);

    const orders = await this.orderRepository.find({
      where: {
        portfolioId,
        status: OrderStatus.EXECUTED,
        executedAt: MoreThan(sinceDate),
      },
    });

    if (orders.length === 0) {
      return {
        averageSlippage: 0,
        averageCommission: 0,
        fillRate: 0,
        averageExecutionTime: 0,
        totalTrades: 0,
      };
    }

    // Calculate metrics
    const totalSlippage = orders
      .filter(o => o.orderType === OrderType.MARKET)
      .reduce((sum, order) => {
        // Approximate slippage calculation (would need more sophisticated tracking in production)
        const estimatedSlippage = Math.abs(Number(order.executedPrice) - Number(order.limitPrice || order.executedPrice)) / Number(order.executedPrice);
        return sum + estimatedSlippage;
      }, 0);

    const totalCommission = orders.reduce((sum, order) => sum + Number(order.commission || 0), 0);

    const executionTimes = orders
      .filter(order => order.executedAt && order.createdAt)
      .map(order => order.executedAt!.getTime() - order.createdAt.getTime());

    const averageExecutionTime = executionTimes.length > 0
      ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length / 1000 // Convert to seconds
      : 0;

    return {
      averageSlippage: totalSlippage / orders.length,
      averageCommission: totalCommission / orders.length,
      fillRate: 1.0, // 100% fill rate for paper trading
      averageExecutionTime,
      totalTrades: orders.length,
    };
  }

  /**
   * Route order to best execution venue (placeholder for future enhancement)
   */
  async routeOrder(order: Order): Promise<string> {
    // For now, all orders go through paper trading
    // In a real system, this would analyze different venues and route accordingly
    return 'PAPER_TRADING';
  }
}