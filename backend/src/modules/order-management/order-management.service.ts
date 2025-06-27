/**
 * =============================================================================
 * ORDER MANAGEMENT SERVICE - Central Order Processing Hub
 * =============================================================================
 *
 * Comprehensive order management system that orchestrates the complete order
 * lifecycle from submission to settlement. Coordinates risk management,
 * execution, and position updates for all trading activities.
 *
 * Key Features:
 * - Complete order lifecycle management (submission to settlement)
 * - Multi-order type support (market, limit, stop, stop-limit)
 * - Conditional order processing and trigger monitoring
 * - Real-time order status tracking and updates
 * - Risk validation and compliance checking
 * - Order execution coordination and settlement
 * - Position management and portfolio synchronization
 * - Order cancellation and modification handling
 *
 * Order Types Supported:
 * - Market Orders: Immediate execution at current market price
 * - Limit Orders: Execution at specified price or better
 * - Stop Orders: Market order triggered at stop price
 * - Stop-Limit Orders: Limit order triggered at stop price
 * - Conditional Orders: Complex logic-based order triggers
 *
 * Order Processing Flow:
 * 1. Order validation and risk assessment
 * 2. Order routing and queue management
 * 3. Market data monitoring for execution conditions
 * 4. Execution engine coordination and fill processing
 * 5. Position updates and portfolio reconciliation
 * 6. Settlement processing and confirmation
 * 7. Real-time status updates and notifications
 *
 * Risk Integration:
 * - Pre-trade risk validation and limit checking
 * - Real-time position monitoring and margin calculations
 * - Portfolio concentration and diversification rules
 * - Day trading rule compliance (PDT regulations)
 * - Buying power verification and margin requirements
 *
 * Scheduled Operations:
 * - Conditional order monitoring and trigger evaluation
 * - Market hours compliance and order queue management
 * - Expired order cleanup and status reconciliation
 * - Position synchronization and portfolio updates
 * - Performance metrics collection and reporting
 *
 * Used By:
 * - Paper Trading Service for virtual trade execution
 * - Frontend trading interface for order submission
 * - Risk Management for compliance monitoring
 * - WebSocket for real-time order status updates
 * =============================================================================
 */

import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Not, Repository } from 'typeorm';
import {
  ConditionalTrigger,
  Order,
  OrderSide,
  OrderStatus,
  OrderType,
  TimeInForce,
} from '../../entities/order.entity';
import { Portfolio } from '../../entities/portfolio.entity';
import { Position } from '../../entities/position.entity';
import { Stock } from '../../entities/stock.entity';
import { MarketHoursService } from '../../utils/market-hours.service';
import { PaperTradingService } from '../paper-trading/paper-trading.service';
import { ConditionalOrderService } from './services/conditional-order.service';
import { OrderExecutionEngine } from './services/order-execution-engine.service';
import { RiskManagementService } from './services/risk-management.service';

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
  // Advanced order features
  trailAmount?: number;
  trailPercent?: number;
  ocoGroupId?: string;
  conditionalTriggers?: ConditionalTrigger[];
  profitTargetPrice?: number;
  stopLossPrice?: number;
  routingDestination?: string;
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
    private marketHoursService: MarketHoursService,
    private riskManagementService: RiskManagementService,
    @Inject(forwardRef(() => ConditionalOrderService))
    private conditionalOrderService: ConditionalOrderService,
    private executionEngine: OrderExecutionEngine,
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
      // Validate market hours before creating order
      this.marketHoursService.validateTradingHours(true);

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
        // Advanced order features
        trailAmount: createOrderDto.trailAmount,
        trailPercent: createOrderDto.trailPercent,
        ocoGroupId: createOrderDto.ocoGroupId,
        conditionalTriggers: createOrderDto.conditionalTriggers,
        profitTargetPrice: createOrderDto.profitTargetPrice,
        stopLossPrice: createOrderDto.stopLossPrice,
        routingDestination: createOrderDto.routingDestination,
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
      // Skip monitoring if market is closed
      if (!this.marketHoursService.isMarketOpen()) {
        return;
      }

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

      case OrderType.TRAILING_STOP:
        if (currentPrice <= Number(order.stopPrice)) {
          shouldTrigger = true;
          triggerReason = `Trailing stop triggered at ${currentPrice} (stop: ${order.stopPrice})`;
        }
        break;
    }

    if (shouldTrigger) {
      await this.executeOrder(order, currentPrice, triggerReason);
    }
  }

  /**
   * Execute a triggered order (public method for conditional orders)
   */
  async executeTriggeredOrder(order: Order): Promise<OrderExecutionResult> {
    return this.executeOrder(order);
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
      // Validate market hours before executing order
      this.marketHoursService.validateTradingHours(true);

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

        // Handle OCO order cancellation
        await this.handleOCOExecution(order);

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
    // Perform comprehensive risk management validation
    const riskValidation = await this.riskManagementService.validateOrder(
      order,
      portfolio,
    );

    if (!riskValidation.valid) {
      const errorMessage = riskValidation.errors.join('; ');
      throw new Error(`Order validation failed: ${errorMessage}`);
    }

    // Log warnings if any
    if (riskValidation.warnings.length > 0) {
      this.logger.warn(
        `Order warnings for ${order.symbol}: ${riskValidation.warnings.join('; ')}`,
      );
    }

    // Basic order validation
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

      case OrderType.TRAILING_STOP:
        if (!order.trailAmount && !order.trailPercent) {
          throw new Error(
            'Either trail amount or trail percent required for trailing stop orders',
          );
        }
        break;

      case OrderType.BRACKET:
        if (!order.profitTargetPrice || !order.stopLossPrice) {
          throw new Error(
            'Both profit target and stop loss prices required for bracket orders',
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

  /**
   * Create trailing stop order
   */
  async createTrailingStopOrder(
    portfolioId: number,
    symbol: string,
    quantity: number,
    trailAmount?: number,
    trailPercent?: number,
  ): Promise<Order> {
    if (!trailAmount && !trailPercent) {
      throw new Error('Either trail amount or trail percent must be specified');
    }

    const stock = await this.stockRepository.findOne({
      where: { symbol },
    });

    if (!stock) {
      throw new Error(`Stock ${symbol} not found`);
    }

    const currentPrice = Number(stock.currentPrice);

    return this.createOrder({
      portfolioId,
      symbol,
      orderType: OrderType.TRAILING_STOP,
      side: OrderSide.SELL,
      quantity,
      trailAmount,
      trailPercent,
      stopPrice:
        currentPrice -
        (trailAmount || (currentPrice * (trailPercent || 0)) / 100),
      notes: `Trailing stop - ${trailAmount ? `$${trailAmount}` : `${trailPercent}%`} trail`,
    });
  }

  /**
   * Create OCO (One-Cancels-Other) order pair
   */
  async createOCOOrder(
    portfolioId: number,
    symbol: string,
    quantity: number,
    limitPrice: number,
    stopPrice: number,
  ): Promise<{ limitOrder: Order; stopOrder: Order }> {
    const ocoGroupId = `oco_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const limitOrder = await this.createOrder({
      portfolioId,
      symbol,
      orderType: OrderType.LIMIT,
      side: OrderSide.SELL,
      quantity,
      limitPrice,
      ocoGroupId,
      notes: 'OCO order - limit leg',
    });

    const stopOrder = await this.createOrder({
      portfolioId,
      symbol,
      orderType: OrderType.STOP_LOSS,
      side: OrderSide.SELL,
      quantity,
      stopPrice,
      ocoGroupId,
      notes: 'OCO order - stop leg',
    });

    return { limitOrder, stopOrder };
  }

  /**
   * Create conditional order with multiple triggers
   */
  async createConditionalOrder(
    orderDto: CreateOrderDto,
    triggers: ConditionalTrigger[],
  ): Promise<Order> {
    return this.createOrder({
      ...orderDto,
      conditionalTriggers: triggers,
      notes: `${orderDto.notes || ''} - Conditional order with ${triggers.length} trigger(s)`,
    });
  }

  /**
   * Update trailing stop high water mark
   */
  private async updateTrailingStops(
    symbol: string,
    currentPrice: number,
  ): Promise<void> {
    const trailingStops = await this.orderRepository.find({
      where: {
        symbol,
        orderType: OrderType.TRAILING_STOP,
        status: OrderStatus.PENDING,
      },
    });

    for (const order of trailingStops) {
      const highWaterMark = Number(order.highWaterMark || currentPrice);

      if (currentPrice > highWaterMark) {
        // Update high water mark and adjust stop price
        order.highWaterMark = currentPrice;

        let newStopPrice: number;
        if (order.trailAmount) {
          newStopPrice = currentPrice - Number(order.trailAmount);
        } else if (order.trailPercent) {
          newStopPrice = currentPrice * (1 - Number(order.trailPercent) / 100);
        } else {
          continue;
        }

        order.stopPrice = Math.max(Number(order.stopPrice), newStopPrice);
        await this.orderRepository.save(order);
      }
    }
  }

  /**
   * Check conditional triggers for orders
   */
  private async checkConditionalTriggers(
    order: Order,
    marketData: any,
  ): Promise<boolean> {
    if (!order.conditionalTriggers || order.conditionalTriggers.length === 0) {
      return false;
    }

    const results: boolean[] = [];

    for (const trigger of order.conditionalTriggers) {
      let triggerMet = false;
      const value = this.getFieldValue(marketData, trigger.field);

      switch (trigger.condition) {
        case 'greater_than':
          triggerMet = value > Number(trigger.value);
          break;
        case 'less_than':
          triggerMet = value < Number(trigger.value);
          break;
        case 'equals':
          triggerMet = value === Number(trigger.value);
          break;
        case 'between':
          triggerMet =
            value >= Number(trigger.value) &&
            value <= Number(trigger.value2 || 0);
          break;
      }

      results.push(triggerMet);
    }

    // Process logical operators
    let finalResult = results[0];
    for (let i = 1; i < results.length; i++) {
      const trigger = order.conditionalTriggers[i];
      if (trigger.logicalOperator === 'OR') {
        finalResult = finalResult || results[i];
      } else {
        finalResult = finalResult && results[i];
      }
    }

    return finalResult;
  }

  /**
   * Get field value from market data
   */
  private getFieldValue(marketData: any, field: string): number {
    switch (field) {
      case 'price':
        return marketData.currentPrice || 0;
      case 'volume':
        return marketData.volume || 0;
      case 'change':
        return marketData.change || 0;
      case 'changePercent':
        return marketData.changePercent || 0;
      default:
        return 0;
    }
  }

  /**
   * Cancel OCO order group
   */
  async cancelOCOGroup(ocoGroupId: string): Promise<Order[]> {
    const orders = await this.orderRepository.find({
      where: { ocoGroupId },
    });

    const cancelledOrders: Order[] = [];
    for (const order of orders) {
      if (
        order.status === OrderStatus.PENDING ||
        order.status === OrderStatus.TRIGGERED
      ) {
        const cancelled = await this.cancelOrder(
          order.id,
          'OCO group cancelled',
        );
        cancelledOrders.push(cancelled);
      }
    }

    return cancelledOrders;
  }

  /**
   * Handle OCO order execution (cancel other orders in group)
   */
  private async handleOCOExecution(executedOrder: Order): Promise<void> {
    if (!executedOrder.ocoGroupId) return;

    const otherOrders = await this.orderRepository.find({
      where: {
        ocoGroupId: executedOrder.ocoGroupId,
        id: Not(executedOrder.id),
        status: In([OrderStatus.PENDING, OrderStatus.TRIGGERED]),
      },
    });

    for (const order of otherOrders) {
      await this.cancelOrder(order.id, 'OCO - other order executed');
    }
  }

  /**
   * Enhanced monitoring with advanced order types (runs every 30 seconds)
   */
  @Cron('*/30 * * * * *')
  async monitorAdvancedOrders(): Promise<void> {
    try {
      // Skip monitoring if market is closed
      if (!this.marketHoursService.isMarketOpen()) {
        return;
      }

      const activeOrders = await this.getActiveOrders();
      const stocks = await this.stockRepository.find();
      const stockDataMap = new Map(
        stocks.map((s) => [
          s.symbol,
          {
            currentPrice: Number(s.currentPrice),
            volume: Number(s.volume || 0),
            change: Number((s as any).change || 0),
            changePercent: Number(s.changePercent || 0),
          },
        ]),
      );

      for (const order of activeOrders) {
        const marketData = stockDataMap.get(order.symbol);
        if (!marketData) continue;

        // Update trailing stops first
        if (order.orderType === OrderType.TRAILING_STOP) {
          await this.updateTrailingStops(order.symbol, marketData.currentPrice);
        }

        // Check conditional triggers
        if (order.conditionalTriggers && order.conditionalTriggers.length > 0) {
          const triggered = await this.checkConditionalTriggers(
            order,
            marketData,
          );
          if (triggered) {
            await this.executeOrder(
              order,
              marketData.currentPrice,
              'Conditional trigger activated',
            );
            continue;
          }
        }

        // Standard order trigger checking
        await this.checkOrderTrigger(order, marketData.currentPrice);
      }
    } catch (error) {
      this.logger.error('Error monitoring advanced orders:', error);
    }
  }

  /**
   * Scheduled check for conditional orders (every 30 seconds during market hours)
   */
  @Cron('*/30 * * * * *') // Every 30 seconds
  async checkConditionalOrders(): Promise<void> {
    try {
      // Only check during market hours
      if (!this.marketHoursService.isMarketOpen()) {
        return;
      }

      await this.conditionalOrderService.evaluateConditionalOrders();
    } catch (error) {
      this.logger.error(`Error checking conditional orders: ${error.message}`);
    }
  }

  /**
   * Get execution quality metrics for a portfolio
   */
  async getExecutionQuality(portfolioId: number, periodDays: number = 30) {
    return this.executionEngine.getExecutionQuality(portfolioId, periodDays);
  }

  /**
   * Get portfolio risk analysis
   */
  async getPortfolioRisk(portfolioId: number) {
    return this.riskManagementService.getPortfolioRisk(portfolioId);
  }

  /**
   * Get conditional orders for a portfolio
   */
  async getConditionalOrders(portfolioId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: {
        portfolioId,
        conditionalTriggers: Not(null),
        status: In([OrderStatus.PENDING, OrderStatus.TRIGGERED]),
      },
      relations: ['stock'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get bracket orders for a portfolio
   */
  async getBracketOrders(portfolioId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: {
        portfolioId,
        orderType: OrderType.BRACKET,
        status: In([
          OrderStatus.PENDING,
          OrderStatus.TRIGGERED,
          OrderStatus.EXECUTED,
        ]),
      },
      relations: ['stock'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get OCO order groups for a portfolio
   */
  async getOCOOrders(portfolioId: number): Promise<any[]> {
    const ocoOrders = await this.orderRepository
      .createQueryBuilder('order')
      .where('order.portfolioId = :portfolioId', { portfolioId })
      .andWhere('order.ocoGroupId IS NOT NULL')
      .andWhere('order.status IN (:...statuses)', {
        statuses: [OrderStatus.PENDING, OrderStatus.TRIGGERED],
      })
      .leftJoinAndSelect('order.stock', 'stock')
      .orderBy('order.createdAt', 'DESC')
      .getMany();

    // Group by OCO group ID
    const groupedOrders = new Map<string, Order[]>();
    ocoOrders.forEach((order) => {
      if (order.ocoGroupId) {
        if (!groupedOrders.has(order.ocoGroupId)) {
          groupedOrders.set(order.ocoGroupId, []);
        }
        groupedOrders.get(order.ocoGroupId)!.push(order);
      }
    });

    return Array.from(groupedOrders.entries()).map(([groupId, orders]) => ({
      ocoGroupId: groupId,
      orders,
    }));
  }

  /**
   * Modify an existing order
   */
  async modifyOrder(
    orderId: number,
    updates: Partial<CreateOrderDto>,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['portfolio'],
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new Error(
        `Cannot modify order ${orderId} - status: ${order.status}`,
      );
    }

    // Cancel the existing order and create a new one with updates
    order.status = OrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.cancellationReason = 'Modified by user';
    await this.orderRepository.save(order);

    // Create new order with updates
    const newOrderDto: CreateOrderDto = {
      portfolioId: order.portfolioId,
      symbol: order.symbol,
      orderType: updates.orderType || order.orderType,
      side: order.side,
      quantity: updates.quantity || order.quantity,
      limitPrice: updates.limitPrice || order.limitPrice,
      stopPrice: updates.stopPrice || order.stopPrice,
      triggerPrice: updates.triggerPrice || order.triggerPrice,
      timeInForce: updates.timeInForce || order.timeInForce,
      notes: updates.notes || order.notes,
      ...updates,
    };

    return this.createOrder(newOrderDto);
  }

  /**
   * Get order execution history
   */
  async getOrderExecutions(orderId: number) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    return {
      orderId: order.id,
      status: order.status,
      executedPrice: order.executedPrice,
      executedQuantity: order.executedQuantity,
      executedAt: order.executedAt,
      commission: order.commission,
      executionReports: order.executionReports || [],
      fillCount: order.fillCount || 0,
      avgExecutionPrice: order.avgExecutionPrice,
    };
  }
}
