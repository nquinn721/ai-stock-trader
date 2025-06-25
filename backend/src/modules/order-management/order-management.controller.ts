import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Order,
  OrderSide,
  OrderStatus,
  OrderType,
  TimeInForce,
} from '../../entities/order.entity';
import { Stock } from '../../entities/stock.entity';
import {
  CreateOrderDto,
  OrderManagementService,
} from './order-management.service';
import { OrderExecutionService } from './services/order-execution.service';
import { OrderRiskManagementService } from './services/order-risk-management.service';
import { ConditionalOrderService } from './services/conditional-order.service';

export class CreateOrderRequestDto {
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
  expiryDate?: string; // ISO date string
}

export class CreateBracketOrderDto {
  portfolioId: number;
  symbol: string;
  side: OrderSide;
  quantity: number;
  entryPrice: number;
  stopLossPrice: number;
  takeProfitPrice: number;
}

export class CreateTrailingStopDto {
  portfolioId: number;
  symbol: string;
  quantity: number;
  trailAmount?: number;
  trailPercent?: number;
}

export class CreateOCOOrderDto {
  portfolioId: number;
  symbol: string;
  quantity: number;
  limitPrice: number;
  stopPrice: number;
}

export class CreateConditionalOrderDto {
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
  conditionalTriggers: Array<{
    id: string;
    type: 'price' | 'time' | 'indicator' | 'volume';
    condition: 'greater_than' | 'less_than' | 'equals' | 'between';
    value: number | string;
    value2?: number;
    field: string;
    logicalOperator?: 'AND' | 'OR';
  }>;
}

export class CreateTrailingStopOrderDto {
  portfolioId: number;
  symbol: string;
  quantity: number;
  side: OrderSide;
  trailAmount?: number;
  trailPercent?: number;
  triggerPrice?: number;
}

export class CreateOCOOrderPairDto {
  portfolioId: number;
  symbol: string;
  quantity: number;
  // First order (usually limit order)
  limitPrice: number;
  // Second order (usually stop order)
  stopPrice: number;
  side: OrderSide;
}

export class ModifyOrderDto {
  quantity?: number;
  limitPrice?: number;
  stopPrice?: number;
  triggerPrice?: number;
}

export class OrderRoutingOptionsDto {
  routingStrategy?: 'best_execution' | 'speed' | 'dark_pool' | 'minimal_impact';
  maxSlippage?: number;
  timeLimit?: number;
  allowPartialFills?: boolean;
}

@Controller('order-management')
export class OrderManagementController {
  constructor(
    private readonly orderManagementService: OrderManagementService,
    private readonly orderExecutionService: OrderExecutionService,
    private readonly orderRiskManagementService: OrderRiskManagementService,
    private readonly conditionalOrderService: ConditionalOrderService,
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
  ) {}

  /**
   * Create a new order
   */
  @Post('orders')
  async createOrder(
    @Body() createOrderRequest: CreateOrderRequestDto,
  ): Promise<Order> {
    const createOrderDto: CreateOrderDto = {
      ...createOrderRequest,
      expiryDate: createOrderRequest.expiryDate
        ? new Date(createOrderRequest.expiryDate)
        : undefined,
    };

    return this.orderManagementService.createOrder(createOrderDto);
  }

  /**
   * Get all orders for a portfolio
   */
  @Get('portfolios/:portfolioId/orders')
  async getOrdersByPortfolio(
    @Param('portfolioId', ParseIntPipe) portfolioId: number,
  ): Promise<Order[]> {
    return this.orderManagementService.getOrdersByPortfolio(portfolioId);
  }

  /**
   * Get active orders across all portfolios
   */
  @Get('orders/active')
  async getActiveOrders(): Promise<Order[]> {
    return this.orderManagementService.getActiveOrders();
  }

  /**
   * Get a specific order by ID
   */
  @Get('orders/:orderId')
  async getOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
  ): Promise<Order> {
    const orders = await this.orderManagementService.getActiveOrders();
    const order = orders.find((o) => o.id === orderId);

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    return order;
  }

  /**
   * Cancel an order
   */
  @Delete('orders/:orderId')
  async cancelOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Query('reason') reason?: string,
  ): Promise<Order> {
    return this.orderManagementService.cancelOrder(orderId, reason);
  }

  /**
   * Create a bracket order (entry + stop loss + take profit)
   */
  @Post('orders/bracket')
  async createBracketOrder(
    @Body() bracketOrderDto: CreateBracketOrderDto,
  ): Promise<{
    entryOrder: Order;
    stopLossOrder: Order;
    takeProfitOrder: Order;
  }> {
    return this.orderManagementService.createBracketOrder(
      bracketOrderDto.portfolioId,
      bracketOrderDto.symbol,
      bracketOrderDto.side,
      bracketOrderDto.quantity,
      bracketOrderDto.entryPrice,
      bracketOrderDto.stopLossPrice,
      bracketOrderDto.takeProfitPrice,
    );
  }

  /**
   * Get order execution history for a portfolio
   */
  @Get('portfolios/:portfolioId/orders/history')
  async getOrderHistory(
    @Param('portfolioId', ParseIntPipe) portfolioId: number,
    @Query('limit') limit?: string,
  ): Promise<Order[]> {
    const orders =
      await this.orderManagementService.getOrdersByPortfolio(portfolioId);
    const limitNum = limit ? parseInt(limit, 10) : 50;

    return orders.filter((order) => order.isExecuted).slice(0, limitNum);
  }

  /**
   * Get pending orders for a portfolio
   */
  @Get('portfolios/:portfolioId/orders/pending')
  async getPendingOrders(
    @Param('portfolioId', ParseIntPipe) portfolioId: number,
  ): Promise<Order[]> {
    const orders =
      await this.orderManagementService.getOrdersByPortfolio(portfolioId);
    return orders.filter((order) => order.isPending);
  }

  /**
   * Get order statistics for a portfolio
   */
  @Get('portfolios/:portfolioId/orders/statistics')
  async getOrderStatistics(
    @Param('portfolioId', ParseIntPipe) portfolioId: number,
  ): Promise<{
    totalOrders: number;
    executedOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    totalCommissions: number;
    avgExecutionTime: number; // in minutes
  }> {
    const orders =
      await this.orderManagementService.getOrdersByPortfolio(portfolioId);

    const executedOrders = orders.filter((o) => o.isExecuted);
    const pendingOrders = orders.filter((o) => o.isPending);
    const cancelledOrders = orders.filter((o) => o.isCancelled);

    const totalCommissions = executedOrders.reduce(
      (sum, order) => sum + Number(order.commission || 0),
      0,
    );

    // Calculate average execution time for executed orders
    const executionTimes = executedOrders
      .filter((order) => order.executedAt && order.createdAt)
      .map((order) => {
        const diff = order.executedAt!.getTime() - order.createdAt.getTime();
        return diff / (1000 * 60); // Convert to minutes
      });

    const avgExecutionTime =
      executionTimes.length > 0
        ? executionTimes.reduce((sum, time) => sum + time, 0) /
          executionTimes.length
        : 0;

    return {
      totalOrders: orders.length,
      executedOrders: executedOrders.length,
      pendingOrders: pendingOrders.length,
      cancelledOrders: cancelledOrders.length,
      totalCommissions,
      avgExecutionTime,
    };
  }

  /**
   * Create a trailing stop order
   */
  @Post('orders/trailing-stop')
  async createTrailingStopOrder(
    @Body() trailingStopDto: CreateTrailingStopOrderDto,
  ): Promise<Order> {
    const createOrderDto: CreateOrderDto = {
      portfolioId: trailingStopDto.portfolioId,
      symbol: trailingStopDto.symbol,
      orderType: OrderType.TRAILING_STOP,
      side: trailingStopDto.side,
      quantity: trailingStopDto.quantity,
      triggerPrice: trailingStopDto.triggerPrice,
      trailAmount: trailingStopDto.trailAmount,
      trailPercent: trailingStopDto.trailPercent,
      timeInForce: TimeInForce.GTC, // Trailing stops are typically GTC
    };

    return this.orderManagementService.createOrder(createOrderDto);
  }

  /**
   * Create OCO (One-Cancels-Other) order pair
   */
  @Post('orders/oco')
  async createOCOOrderPair(
    @Body() ocoDto: CreateOCOOrderPairDto,
  ): Promise<{ order1: Order; order2: Order; ocoGroupId: string }> {
    const ocoGroupId = `oco_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create limit order
    const limitOrder = await this.orderManagementService.createOrder({
      portfolioId: ocoDto.portfolioId,
      symbol: ocoDto.symbol,
      orderType: OrderType.LIMIT,
      side: ocoDto.side,
      quantity: ocoDto.quantity,
      limitPrice: ocoDto.limitPrice,
      ocoGroupId,
      timeInForce: TimeInForce.GTC,
    });

    // Create stop order
    const stopOrder = await this.orderManagementService.createOrder({
      portfolioId: ocoDto.portfolioId,
      symbol: ocoDto.symbol,
      orderType: OrderType.STOP_LOSS,
      side: ocoDto.side,
      quantity: ocoDto.quantity,
      stopPrice: ocoDto.stopPrice,
      ocoGroupId,
      timeInForce: TimeInForce.GTC,
    });

    return {
      order1: limitOrder,
      order2: stopOrder,
      ocoGroupId,
    };
  }

  /**
   * Create conditional order with complex triggers
   */
  @Post('orders/conditional')
  async createConditionalOrder(
    @Body() conditionalDto: CreateConditionalOrderDto,
  ): Promise<Order> {
    // Use the regular order creation service with conditional triggers
    const createOrderDto: CreateOrderDto = {
      portfolioId: conditionalDto.portfolioId,
      symbol: conditionalDto.symbol,
      orderType: conditionalDto.orderType,
      side: conditionalDto.side,
      quantity: conditionalDto.quantity,
      limitPrice: conditionalDto.limitPrice,
      stopPrice: conditionalDto.stopPrice,
      triggerPrice: conditionalDto.triggerPrice,
      timeInForce: conditionalDto.timeInForce || TimeInForce.DAY,
      notes: conditionalDto.notes,
      conditionalTriggers: conditionalDto.conditionalTriggers,
    };

    return this.orderManagementService.createOrder(createOrderDto);
  }

  /**
   * Modify existing order (drag-and-drop interface support)
   */
  @Post('orders/:orderId/modify')
  async modifyOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() modifyDto: ModifyOrderDto,
  ): Promise<Order> {
    // Get existing order
    const existingOrder = await this.getOrder(orderId);
    
    if (!existingOrder.isPending) {
      throw new Error(`Cannot modify order ${orderId} - status: ${existingOrder.status}`);
    }

    // Cancel existing order
    await this.cancelOrder(orderId, 'Modified by user');

    // Create new order with updated parameters
    const newOrder = await this.orderManagementService.createOrder({
      portfolioId: existingOrder.portfolioId,
      symbol: existingOrder.symbol,
      orderType: existingOrder.orderType,
      side: existingOrder.side,
      quantity: modifyDto.quantity ?? existingOrder.quantity,
      limitPrice: modifyDto.limitPrice ?? existingOrder.limitPrice,
      stopPrice: modifyDto.stopPrice ?? existingOrder.stopPrice,
      triggerPrice: modifyDto.triggerPrice ?? existingOrder.triggerPrice,
      timeInForce: existingOrder.timeInForce,
      notes: `Modified from order ${orderId}`,
      parentOrderId: existingOrder.parentOrderId,
      ocoGroupId: existingOrder.ocoGroupId,
    });

    return newOrder;
  }

  /**
   * Execute order with specific routing options
   */
  @Post('orders/:orderId/execute')
  async executeOrderWithRouting(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() routingOptions?: OrderRoutingOptionsDto,
  ): Promise<any> {
    const order = await this.getOrder(orderId);
    
    if (!order.isPending && order.status !== OrderStatus.TRIGGERED) {
      throw new Error(`Cannot execute order ${orderId} - status: ${order.status}`);
    }

    const routingOpts = routingOptions ? {
      routingStrategy: routingOptions.routingStrategy || 'best_execution',
      maxSlippage: routingOptions.maxSlippage || 0.001,
      timeLimit: routingOptions.timeLimit || 30,
      allowPartialFills: routingOptions.allowPartialFills ?? true,
    } : undefined;

  switch (order.orderType) {
    case OrderType.MARKET:
      return this.orderExecutionService.executeMarketOrder(order, routingOpts);
    
    case OrderType.LIMIT:
      const stock = await this.stockRepository.findOne({ where: { symbol: order.symbol } });
      return this.orderExecutionService.executeLimitOrder(order, Number(stock?.currentPrice || 0), routingOpts);
    
    case OrderType.STOP_LOSS:
      const stock2 = await this.stockRepository.findOne({ where: { symbol: order.symbol } });
      return this.orderExecutionService.executeStopOrder(order, Number(stock2?.currentPrice || 0), routingOpts);
    
    case OrderType.STOP_LIMIT:
      const stock3 = await this.stockRepository.findOne({ where: { symbol: order.symbol } });
      return this.orderExecutionService.executeStopLimitOrder(order, Number(stock3?.currentPrice || 0), routingOpts);
    
    default:
      throw new Error(`Unsupported order type for manual execution: ${order.orderType}`);
  }
  }

  /**
   * Get execution quality report for an order
   */
  @Get('orders/:orderId/execution-quality')
  async getExecutionQuality(@Param('orderId', ParseIntPipe) orderId: number) {
    return this.orderExecutionService.getExecutionQuality(orderId);
  }

  /**
   * Get order risk validation
   */
  @Post('orders/validate-risk')
  async validateOrderRisk(
    @Body() orderRequest: CreateOrderRequestDto,
  ): Promise<any> {
    // Create temporary order for validation
    const tempOrder = {
      portfolioId: orderRequest.portfolioId,
      symbol: orderRequest.symbol,
      orderType: orderRequest.orderType,
      side: orderRequest.side,
      quantity: orderRequest.quantity,
      limitPrice: orderRequest.limitPrice,
      stopPrice: orderRequest.stopPrice,
    } as Order;

    return this.orderRiskManagementService.validateOrderRisk(tempOrder);
  }

  /**
   * Get position risk metrics for a proposed order
   */
  @Get('portfolios/:portfolioId/risk-metrics/:symbol')
  async getPositionRiskMetrics(
    @Param('portfolioId', ParseIntPipe) portfolioId: number,
    @Param('symbol') symbol: string,
    @Query('quantity', ParseIntPipe) quantity: number,
    @Query('side') side: OrderSide,
  ) {
    return this.orderRiskManagementService.getPositionRiskMetrics(
      portfolioId,
      symbol,
      quantity,
      side,
    );
  }

  /**
   * Get conditional order analytics
   */
  @Get('portfolios/:portfolioId/conditional-analytics')
  async getConditionalOrderAnalytics(
    @Param('portfolioId', ParseIntPipe) portfolioId: number,
  ) {
    // Get all orders for the portfolio
    const orders = await this.orderManagementService.getOrdersByPortfolio(portfolioId);
    
    const conditionalOrders = orders.filter(
      order => order.conditionalTriggers && order.conditionalTriggers.length > 0
    );

    const pendingConditional = conditionalOrders.filter(
      order => order.status === OrderStatus.PENDING
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const triggeredToday = conditionalOrders.filter(
      order => order.status === OrderStatus.TRIGGERED && 
               order.updatedAt >= today
    );

    return {
      totalConditionalOrders: conditionalOrders.length,
      pendingConditionalOrders: pendingConditional.length,
      triggeredToday: triggeredToday.length,
      averageTimeToTrigger: 0, // Simplified for now
      mostUsedConditions: [], // Simplified for now
    };
  }

  /**
   * Bulk cancel orders
   */
  @Post('orders/bulk-cancel')
  async bulkCancelOrders(
    @Body() request: { orderIds: number[]; reason?: string },
  ): Promise<{ cancelled: number[]; failed: { id: number; reason: string }[] }> {
    const cancelled: number[] = [];
    const failed: { id: number; reason: string }[] = [];

    for (const orderId of request.orderIds) {
      try {
        await this.cancelOrder(orderId, request.reason || 'Bulk cancellation');
        cancelled.push(orderId);
      } catch (error) {
        failed.push({ id: orderId, reason: error.message });
      }
    }

    return { cancelled, failed };
  }

  /**
   * Get order book for a symbol (level 2 data)
   */
  @Get('orderbook/:symbol')
  async getOrderBook(@Param('symbol') symbol: string) {
    // In a real system, this would come from market data feeds
    // For now, return simulated order book
    const orders = await this.orderManagementService.getActiveOrders();
    const symbolOrders = orders.filter(order => order.symbol === symbol);

    const buyOrders = symbolOrders
      .filter(order => order.side === OrderSide.BUY && order.limitPrice)
      .sort((a, b) => Number(b.limitPrice) - Number(a.limitPrice)) // Highest price first
      .slice(0, 10);

    const sellOrders = symbolOrders
      .filter(order => order.side === OrderSide.SELL && order.limitPrice)
      .sort((a, b) => Number(a.limitPrice) - Number(b.limitPrice)) // Lowest price first
      .slice(0, 10);

    return {
      symbol,
      timestamp: new Date(),
      bids: buyOrders.map(order => ({
        price: Number(order.limitPrice),
        quantity: Number(order.quantity),
        orderId: order.id,
      })),
      asks: sellOrders.map(order => ({
        price: Number(order.limitPrice),
        quantity: Number(order.quantity),
        orderId: order.id,
      })),
    };
  }

  /**
   * Get advanced order statistics with execution quality metrics
   */
  @Get('portfolios/:portfolioId/advanced-statistics')
  async getAdvancedOrderStatistics(
    @Param('portfolioId', ParseIntPipe) portfolioId: number,
  ) {
    const orders = await this.orderManagementService.getOrdersByPortfolio(portfolioId);
    const executedOrders = orders.filter(o => o.isExecuted);

    // Calculate advanced metrics
    const executionTimes = executedOrders
      .filter(order => order.executedAt && order.createdAt)
      .map(order => (order.executedAt!.getTime() - order.createdAt.getTime()) / 1000);

    const fillRates = executedOrders
      .filter(order => order.executedQuantity && order.quantity)
      .map(order => Number(order.executedQuantity) / Number(order.quantity));

    const priceImprovements = executedOrders
      .filter(order => order.limitPrice && order.executedPrice)
      .map(order => {
        const improvement = order.side === OrderSide.BUY
          ? Number(order.limitPrice) - Number(order.executedPrice)
          : Number(order.executedPrice) - Number(order.limitPrice);
        return Math.max(0, improvement);
      });

    return {
      ...await this.getOrderStatistics(portfolioId),
      advancedMetrics: {
        avgExecutionTimeSeconds: executionTimes.length > 0 
          ? executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length 
          : 0,
        avgFillRate: fillRates.length > 0 
          ? fillRates.reduce((sum, rate) => sum + rate, 0) / fillRates.length 
          : 0,
        avgPriceImprovement: priceImprovements.length > 0 
          ? priceImprovements.reduce((sum, imp) => sum + imp, 0) / priceImprovements.length 
          : 0,
        partialFills: executedOrders.filter(order => 
          order.executedQuantity && Number(order.executedQuantity) < Number(order.quantity)
        ).length,
        trailingStopOrders: orders.filter(order => order.orderType === OrderType.TRAILING_STOP).length,
        conditionalOrders: orders.filter(order => 
          order.conditionalTriggers && order.conditionalTriggers.length > 0
        ).length,
        ocoGroups: new Set(orders.map(order => order.ocoGroupId).filter(Boolean)).size,
      },
    };
  }
}
