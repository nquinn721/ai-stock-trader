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
import {
  Order,
  OrderSide,
  OrderType,
  TimeInForce,
} from '../../entities/order.entity';
import {
  CreateOrderDto,
  OrderManagementService,
} from './order-management.service';

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

@Controller('order-management')
export class OrderManagementController {
  constructor(
    private readonly orderManagementService: OrderManagementService,
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
    @Body() trailingStopDto: CreateTrailingStopDto,
  ): Promise<Order> {
    return this.orderManagementService.createTrailingStopOrder(
      trailingStopDto.portfolioId,
      trailingStopDto.symbol,
      trailingStopDto.quantity,
      trailingStopDto.trailAmount,
      trailingStopDto.trailPercent,
    );
  }

  /**
   * Create an OCO (One-Cancels-Other) order pair
   */
  @Post('orders/oco')
  async createOCOOrder(
    @Body() ocoOrderDto: CreateOCOOrderDto,
  ): Promise<{ limitOrder: Order; stopOrder: Order }> {
    return this.orderManagementService.createOCOOrder(
      ocoOrderDto.portfolioId,
      ocoOrderDto.symbol,
      ocoOrderDto.quantity,
      ocoOrderDto.limitPrice,
      ocoOrderDto.stopPrice,
    );
  }

  /**
   * Create a conditional order with triggers
   */
  @Post('orders/conditional')
  async createConditionalOrder(
    @Body() conditionalOrderDto: CreateConditionalOrderDto,
  ): Promise<Order> {
    return this.orderManagementService.createConditionalOrder(
      conditionalOrderDto,
      conditionalOrderDto.conditionalTriggers,
    );
  }

  /**
   * Cancel an OCO order group
   */
  @Delete('orders/oco/:ocoGroupId')
  async cancelOCOGroup(
    @Param('ocoGroupId') ocoGroupId: string,
  ): Promise<Order[]> {
    return this.orderManagementService.cancelOCOGroup(ocoGroupId);
  }

  /**
   * Get the order book (all active orders)
   */
  @Get('orders/book')
  async getOrderBook(): Promise<Order[]> {
    return this.orderManagementService.getOrderBook();
  }

  /**
   * Get execution quality metrics for a portfolio
   */
  @Get('portfolios/:portfolioId/execution-quality')
  async getExecutionQuality(
    @Param('portfolioId', ParseIntPipe) portfolioId: number,
    @Query('period') period?: string,
  ) {
    const periodDays = period ? parseInt(period, 10) : 30;
    return this.orderManagementService.getExecutionQuality(portfolioId, periodDays);
  }

  /**
   * Get portfolio risk analysis
   */
  @Get('portfolios/:portfolioId/risk-analysis')
  async getPortfolioRisk(
    @Param('portfolioId', ParseIntPipe) portfolioId: number,
  ) {
    return this.orderManagementService.getPortfolioRisk(portfolioId);
  }

  /**
   * Get conditional orders for a portfolio
   */
  @Get('portfolios/:portfolioId/conditional-orders')
  async getConditionalOrders(
    @Param('portfolioId', ParseIntPipe) portfolioId: number,
  ): Promise<Order[]> {
    return this.orderManagementService.getConditionalOrders(portfolioId);
  }

  /**
   * Get bracket orders for a portfolio
   */
  @Get('portfolios/:portfolioId/bracket-orders')
  async getBracketOrders(
    @Param('portfolioId', ParseIntPipe) portfolioId: number,
  ): Promise<Order[]> {
    return this.orderManagementService.getBracketOrders(portfolioId);
  }

  /**
   * Get OCO order groups for a portfolio
   */
  @Get('portfolios/:portfolioId/oco-orders')
  async getOCOOrders(
    @Param('portfolioId', ParseIntPipe) portfolioId: number,
  ): Promise<any[]> {
    return this.orderManagementService.getOCOOrders(portfolioId);
  }

  /**
   * Modify an existing order
   */
  @Post('orders/:orderId/modify')
  async modifyOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Body() updates: Partial<CreateOrderRequestDto>,
  ): Promise<Order> {
    return this.orderManagementService.modifyOrder(orderId, updates);
  }

  /**
   * Get order execution history
   */
  @Get('orders/:orderId/executions')
  async getOrderExecutions(
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    return this.orderManagementService.getOrderExecutions(orderId);
  }
}
