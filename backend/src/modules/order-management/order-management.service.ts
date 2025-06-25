import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import {
  Order,
  OrderSide,
  OrderStatus,
  OrderType,
  TimeInForce,
} from '../../entities/order.entity';
import { Portfolio } from '../../entities/portfolio.entity';
import { Position } from '../../entities/position.entity';
import { Stock } from '../../entities/stock.entity';
import { PaperTradingService } from '../paper-trading/paper-trading.service';

export interface CreateOrderDto {
  portfolioId: number;
  symbol: string;
  orderType: OrderType;
  side: OrderSide;
  quantity: number;
  limitPrice?: number;
  stopPrice?: number;
  triggerPrice?: number;
  timeInForce?: TimeInForce;
  notes?: string;
  expiryDate?: Date;
  parentOrderId?: number;
}

export interface OrderExecutionResult {
  success: boolean;
  orderId: number;
  executedPrice?: number;
  executedQuantity?: number;
  commission?: number;
  message: string;
  timestamp: Date;
}

@Injectable()
export class OrderManagementService {
  private readonly logger = new Logger(OrderManagementService.name);
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(Position)
    private positionRepository: Repository<Position>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    @Inject(forwardRef(() => PaperTradingService))
    private paperTradingService: PaperTradingService,
  ) {
    // Initialize WebSocket gateway as null, will be set via setter to avoid circular dependency
    this.webSocketGateway = null;
  }

  private webSocketGateway: any = null;

  /**
   * Set the WebSocket gateway (called from gateway to avoid circular dependency)
   */
  setWebSocketGateway(gateway: any) {
    this.webSocketGateway = gateway;
  }

  /**
   * Create a new order
   */
  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    try {
      // Validate portfolio exists
      const portfolio = await this.portfolioRepository.findOne({
        where: { id: createOrderDto.portfolioId },
      });

      if (!portfolio) {
        throw new Error(`Portfolio ${createOrderDto.portfolioId} not found`);
      }

      // Validate stock exists
      const stock = await this.stockRepository.findOne({
        where: { symbol: createOrderDto.symbol },
      });

      if (!stock) {
        throw new Error(`Stock ${createOrderDto.symbol} not found`);
      }

      // Create order
      const order = this.orderRepository.create({
        portfolioId: createOrderDto.portfolioId,
        symbol: createOrderDto.symbol,
        orderType: createOrderDto.orderType,
        side: createOrderDto.side,
        quantity: createOrderDto.quantity,
        limitPrice: createOrderDto.limitPrice,
        stopPrice: createOrderDto.stopPrice,
        triggerPrice: createOrderDto.triggerPrice,
        timeInForce: createOrderDto.timeInForce || TimeInForce.DAY,
        notes: createOrderDto.notes,
        expiryDate: createOrderDto.expiryDate,
        parentOrderId: createOrderDto.parentOrderId,
        status: OrderStatus.PENDING,
      });

      // Validate order logic
      await this.validateOrder(order, portfolio);

      // Save order
      const savedOrder = await this.orderRepository.save(order);

      // If it's a market order, execute immediately
      if (order.orderType === OrderType.MARKET) {
        await this.executeOrder(savedOrder);
      }

      this.logger.log(
        `Order created: ${savedOrder.id} - ${savedOrder.symbol} ${savedOrder.side} ${savedOrder.quantity}`,
      );
      return savedOrder;
    } catch (error) {
      this.logger.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Get all orders for a portfolio
   */
  async getOrdersByPortfolio(portfolioId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: { portfolioId },
      relations: ['stock'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get active orders (pending or triggered)
   */
  async getActiveOrders(): Promise<Order[]> {
    return this.orderRepository.find({
      where: {
        status: In([OrderStatus.PENDING, OrderStatus.TRIGGERED]),
      },
      relations: ['stock', 'portfolio'],
    });
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: number, reason?: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.TRIGGERED
    ) {
      throw new Error(
        `Cannot cancel order ${orderId} - status: ${order.status}`,
      );
    }

    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.cancellationReason = reason || 'Cancelled by user';

    const savedOrder = await this.orderRepository.save(order);
    this.logger.log(`Order cancelled: ${orderId} - ${reason}`);
    return savedOrder;
  }

  /**
   * Monitor prices and trigger orders (runs every 30 seconds)
   */
  @Cron('*/30 * * * * *') // Every 30 seconds
  async monitorAndTriggerOrders(): Promise<void> {
    try {
      const activeOrders = await this.getActiveOrders();
      const stocks = await this.stockRepository.find();
      const stockPriceMap = new Map(
        stocks.map((s) => [s.symbol, Number(s.currentPrice)]),
      );

      for (const order of activeOrders) {
        const currentPrice = stockPriceMap.get(order.symbol);
        if (!currentPrice) continue;

        await this.checkOrderTrigger(order, currentPrice);
      }
    } catch (error) {
      this.logger.error('Error monitoring orders:', error);
    }
  }

  /**
   * Check if an order should be triggered
   */
  private async checkOrderTrigger(
    order: Order,
    currentPrice: number,
  ): Promise<void> {
    let shouldTrigger = false;
    let triggerReason = '';

    switch (order.orderType) {
      case OrderType.LIMIT:
        if (
          order.side === OrderSide.BUY &&
          currentPrice <= Number(order.limitPrice)
        ) {
          shouldTrigger = true;
          triggerReason = `Buy limit triggered at ${currentPrice} (limit: ${order.limitPrice})`;
        } else if (
          order.side === OrderSide.SELL &&
          currentPrice >= Number(order.limitPrice)
        ) {
          shouldTrigger = true;
          triggerReason = `Sell limit triggered at ${currentPrice} (limit: ${order.limitPrice})`;
        }
        break;

      case OrderType.STOP_LOSS:
        if (
          order.side === OrderSide.SELL &&
          currentPrice <= Number(order.stopPrice)
        ) {
          shouldTrigger = true;
          triggerReason = `Stop loss triggered at ${currentPrice} (stop: ${order.stopPrice})`;
        }
        break;

      case OrderType.TAKE_PROFIT:
        if (
          order.side === OrderSide.SELL &&
          currentPrice >= Number(order.triggerPrice)
        ) {
          shouldTrigger = true;
          triggerReason = `Take profit triggered at ${currentPrice} (target: ${order.triggerPrice})`;
        }
        break;

      case OrderType.STOP_LIMIT:
        if (
          order.status === OrderStatus.PENDING &&
          currentPrice <= Number(order.stopPrice)
        ) {
          // Convert to limit order
          order.status = OrderStatus.TRIGGERED;
          await this.orderRepository.save(order);
          this.logger.log(
            `Stop limit order triggered: ${order.id} - now limit order at ${order.limitPrice}`,
          );
          return;
        } else if (
          order.status === OrderStatus.TRIGGERED &&
          currentPrice >= Number(order.limitPrice)
        ) {
          shouldTrigger = true;
          triggerReason = `Stop limit executed at ${currentPrice} (limit: ${order.limitPrice})`;
        }
        break;
    }

    if (shouldTrigger) {
      await this.executeOrder(order, currentPrice, triggerReason);
    }
  }

  /**
   * Execute an order
   */
  private async executeOrder(
    order: Order,
    executionPrice?: number,
    reason?: string,
  ): Promise<OrderExecutionResult> {
    try {
      // Get current market price if not provided
      if (!executionPrice) {
        const stock = await this.stockRepository.findOne({
          where: { symbol: order.symbol },
        });
        executionPrice = Number(stock?.currentPrice || 0);
      }

      if (executionPrice <= 0) {
        throw new Error(`Invalid execution price: ${executionPrice}`);
      }

      // Calculate commission (0.1% of trade value)
      const tradeValue = Number(order.quantity) * executionPrice;
      const commission = tradeValue * 0.001; // 0.1%

      // Execute the trade through paper trading service
      const tradeResult = await this.executeTrade(
        order,
        executionPrice,
        commission,
      );

      if (tradeResult.success) {
        // Update order status
        order.status = OrderStatus.EXECUTED;
        order.executedPrice = executionPrice;
        order.executedQuantity = Number(order.quantity);
        order.commission = commission;
        order.executedAt = new Date();
        await this.orderRepository.save(order);

        this.logger.log(
          `Order executed: ${order.id} - ${order.symbol} ${order.side} ${order.quantity} @ ${executionPrice} (${reason || 'Market order'})`,
        );

        // Emit WebSocket event for order execution
        if (this.webSocketGateway) {
          this.webSocketGateway.server?.emit('order_executed', {
            orderId: order.id,
            symbol: order.symbol,
            side: order.side,
            quantity: order.quantity,
            executedPrice: executionPrice,
            executedQuantity: Number(order.quantity),
            commission,
            portfolioId: order.portfolioId,
            timestamp: new Date(),
            executionReason: reason || 'Market order',
          });
        }

        return {
          success: true,
          orderId: order.id,
          executedPrice: executionPrice,
          executedQuantity: Number(order.quantity),
          commission,
          message: reason || 'Order executed successfully',
          timestamp: new Date(),
        };
      } else {
        throw new Error(tradeResult.message);
      }
    } catch (error) {
      this.logger.error(`Error executing order ${order.id}:`, error);
      // Mark order as failed
      order.status = OrderStatus.CANCELLED;
      order.cancelledAt = new Date();
      order.cancellationReason = `Execution failed: ${error.message}`;
      await this.orderRepository.save(order);

      // Emit WebSocket event for order execution failure
      if (this.webSocketGateway) {
        this.webSocketGateway.server?.emit('order_execution_failed', {
          orderId: order.id,
          symbol: order.symbol,
          portfolioId: order.portfolioId,
          message: error.message,
          timestamp: new Date(),
        });
      }

      return {
        success: false,
        orderId: order.id,
        message: error.message,
        timestamp: new Date(),
      };
    }
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
        userId: `portfolio_${order.portfolioId}`, // Use portfolio ID as user ID for now
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
   * Validate order before creation
   */
  private async validateOrder(
    order: Order,
    portfolio: Portfolio,
  ): Promise<void> {
    // Check portfolio cash for buy orders
    if (order.side === OrderSide.BUY) {
      const estimatedCost =
        Number(order.quantity) * Number(order.limitPrice || 0);
      if (estimatedCost > Number(portfolio.currentCash)) {
        throw new Error('Insufficient cash for buy order');
      }
    }

    // Check position quantity for sell orders
    if (order.side === OrderSide.SELL) {
      const position = await this.positionRepository.findOne({
        where: { portfolioId: order.portfolioId, symbol: order.symbol },
      });

      if (!position || Number(position.quantity) < Number(order.quantity)) {
        throw new Error('Insufficient position for sell order');
      }
    }

    // Validate price fields based on order type
    switch (order.orderType) {
      case OrderType.LIMIT:
        if (!order.limitPrice || Number(order.limitPrice) <= 0) {
          throw new Error('Limit price required for limit orders');
        }
        break;

      case OrderType.STOP_LOSS:
        if (!order.stopPrice || Number(order.stopPrice) <= 0) {
          throw new Error('Stop price required for stop loss orders');
        }
        break;

      case OrderType.TAKE_PROFIT:
        if (!order.triggerPrice || Number(order.triggerPrice) <= 0) {
          throw new Error('Trigger price required for take profit orders');
        }
        break;

      case OrderType.STOP_LIMIT:
        if (!order.stopPrice || !order.limitPrice) {
          throw new Error(
            'Both stop price and limit price required for stop limit orders',
          );
        }
        break;
    }
  }

  /**
   * Clean up expired orders (runs daily at midnight)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredOrders(): Promise<void> {
    try {
      const expiredOrders = await this.orderRepository.find({
        where: {
          status: In([OrderStatus.PENDING, OrderStatus.TRIGGERED]),
          expiryDate: LessThan(new Date()),
        },
      });

      for (const order of expiredOrders) {
        order.status = OrderStatus.EXPIRED;
        order.cancelledAt = new Date();
        order.cancellationReason = 'Order expired';
        await this.orderRepository.save(order);
      }

      this.logger.log(`Cleaned up ${expiredOrders.length} expired orders`);
    } catch (error) {
      this.logger.error('Error cleaning up expired orders:', error);
    }
  }

  /**
   * Create bracket order (entry + stop loss + take profit)
   */
  async createBracketOrder(
    portfolioId: number,
    symbol: string,
    side: OrderSide,
    quantity: number,
    entryPrice: number,
    stopLossPrice: number,
    takeProfitPrice: number,
  ): Promise<{
    entryOrder: Order;
    stopLossOrder: Order;
    takeProfitOrder: Order;
  }> {
    // Create entry order
    const entryOrder = await this.createOrder({
      portfolioId,
      symbol,
      orderType: OrderType.LIMIT,
      side,
      quantity,
      limitPrice: entryPrice,
      notes: 'Bracket order - entry',
    });

    // Create stop loss order
    const stopLossOrder = await this.createOrder({
      portfolioId,
      symbol,
      orderType: OrderType.STOP_LOSS,
      side: side === OrderSide.BUY ? OrderSide.SELL : OrderSide.BUY,
      quantity,
      stopPrice: stopLossPrice,
      parentOrderId: entryOrder.id,
      notes: 'Bracket order - stop loss',
    });

    // Create take profit order
    const takeProfitOrder = await this.createOrder({
      portfolioId,
      symbol,
      orderType: OrderType.TAKE_PROFIT,
      side: side === OrderSide.BUY ? OrderSide.SELL : OrderSide.BUY,
      quantity,
      triggerPrice: takeProfitPrice,
      parentOrderId: entryOrder.id,
      notes: 'Bracket order - take profit',
    });
    return { entryOrder, stopLossOrder, takeProfitOrder };
  }

  /**
   * Get the complete order book (all active orders)
   */ async getOrderBook(): Promise<Order[]> {
    return this.orderRepository.find({
      where: {
        status: In([OrderStatus.PENDING, OrderStatus.TRIGGERED]),
      },
      relations: ['portfolio'],
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
