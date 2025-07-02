import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, OrderType } from '../../entities/order.entity';
import { Stock } from '../../entities/stock.entity';
import { PaperTradingService } from '../paper-trading/paper-trading.service';
import { StockWebSocketGateway } from '../websocket/websocket.gateway';
import { CreateOrderDto, UpdateOrderDto } from './dto/order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    @Inject(forwardRef(() => PaperTradingService))
    private paperTradingService: PaperTradingService,
    @Inject(forwardRef(() => StockWebSocketGateway))
    private websocketGateway: StockWebSocketGateway,
  ) {}

  /**
   * Create a new order
   */
  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    // Validate portfolio exists and has sufficient funds/shares
    await this.validateOrderCreation(createOrderDto);

    const order = this.orderRepository.create({
      ...createOrderDto,
      status: OrderStatus.PENDING,
    });

    const savedOrder = await this.orderRepository.save(order);

    // Notify clients of new order
    if (this.websocketGateway.server) {
      this.websocketGateway.server.emit('order_created', {
        orderId: savedOrder.id,
        portfolioId: savedOrder.portfolioId,
        type: savedOrder.type,
        symbol: savedOrder.symbol,
      });
    } else {
      console.warn(
        'WebSocket server not available, skipping order_created emit',
      );
    }

    return savedOrder;
  }

  /**
   * Get all orders for a portfolio
   */
  async getPortfolioOrders(portfolioId: number): Promise<Order[]> {
    return await this.orderRepository.find({
      where: { portfolioId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Cancel a pending order
   */
  async cancelOrder(orderId: number): Promise<void> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new Error('Only pending orders can be cancelled');
    }

    order.status = OrderStatus.CANCELLED;
    await this.orderRepository.save(order);

    // Notify clients of order cancellation
    if (this.websocketGateway.server) {
      this.websocketGateway.server.emit('order_cancelled', {
        orderId: order.id,
        portfolioId: order.portfolioId,
      });
    } else {
      console.warn(
        'WebSocket server not available, skipping order_cancelled emit',
      );
    }
  }

  /**
   * Update an existing order (only pending orders)
   */
  async updateOrder(
    orderId: number,
    updateOrderDto: UpdateOrderDto,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new Error('Only pending orders can be updated');
    }

    Object.assign(order, updateOrderDto);
    return await this.orderRepository.save(order);
  }

  /**
   * Monitor all pending orders and trigger execution when conditions are met
   * Runs every 30 seconds
   */
  @Cron('*/30 * * * * *')
  async monitorOrders(): Promise<void> {
    try {
      console.log('🔍 Monitoring pending orders...');

      const pendingOrders = await this.orderRepository.find({
        where: { status: OrderStatus.PENDING },
      });

      if (pendingOrders.length === 0) {
        return;
      }

      // Group orders by symbol to minimize database queries
      const ordersBySymbol = pendingOrders.reduce(
        (acc, order) => {
          if (!acc[order.symbol]) {
            acc[order.symbol] = [];
          }
          acc[order.symbol].push(order);
          return acc;
        },
        {} as Record<string, Order[]>,
      );

      // Check each symbol's orders
      for (const [symbol, orders] of Object.entries(ordersBySymbol)) {
        await this.checkOrdersForSymbol(symbol, orders);
      }

      console.log(
        `✅ Order monitoring complete. Checked ${pendingOrders.length} orders.`,
      );
    } catch (error) {
      console.error('❌ Error monitoring orders:', error);
    }
  }

  /**
   * Check orders for a specific symbol against current market price
   */
  private async checkOrdersForSymbol(
    symbol: string,
    orders: Order[],
  ): Promise<void> {
    const stock = await this.stockRepository.findOne({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!stock || !stock.currentPrice) {
      return;
    }

    const currentPrice = Number(stock.currentPrice);

    for (const order of orders) {
      if (this.shouldTriggerOrder(order, currentPrice)) {
        await this.executeOrder(order, currentPrice);
      }
    }
  }

  /**
   * Determine if an order should be triggered based on current price
   */
  private shouldTriggerOrder(order: Order, currentPrice: number): boolean {
    const triggerPrice = Number(order.triggerPrice);

    switch (order.type) {
      case OrderType.ENTRY:
        // Entry orders trigger when price drops to or below the entry level
        return currentPrice <= triggerPrice;

      case OrderType.STOP_LOSS:
        // Stop-loss orders trigger when price drops to or below the stop level
        return currentPrice <= triggerPrice;

      case OrderType.TAKE_PROFIT:
        // Take-profit orders trigger when price rises to or above the profit level
        return currentPrice >= triggerPrice;

      default:
        return false;
    }
  }

  /**
   * Execute a triggered order
   */
  private async executeOrder(
    order: Order,
    currentPrice: number,
  ): Promise<void> {
    try {
      console.log(
        `🚀 Executing ${order.type} order ${order.id} for ${order.symbol} at $${currentPrice}`,
      );

      // Update order status to triggered
      order.status = OrderStatus.TRIGGERED;
      await this.orderRepository.save(order);

      // Execute the trade based on order type
      let tradeType: 'buy' | 'sell';

      if (order.type === OrderType.ENTRY) {
        tradeType = 'buy';
      } else {
        // STOP_LOSS and TAKE_PROFIT are sell orders
        tradeType = 'sell';
      }

      // Execute the trade through paper trading service
      const trade = await this.paperTradingService.executeTrade({
        userId: 'system', // System-generated trade
        symbol: order.symbol,
        type: tradeType,
        quantity: order.quantity,
      });

      // Update order with execution details
      order.status = OrderStatus.EXECUTED;
      order.executedPrice = currentPrice;
      order.executedAt = new Date();
      await this.orderRepository.save(order);

      // Notify clients of order execution
      if (this.websocketGateway.server) {
        this.websocketGateway.server.emit('order_executed', {
          orderId: order.id,
          portfolioId: order.portfolioId,
          symbol: order.symbol,
          type: order.type,
          executedPrice: currentPrice,
          quantity: order.quantity,
          tradeId: trade.id,
        });
      } else {
        console.warn(
          'WebSocket server not available, skipping order_executed emit',
        );
      }

      console.log(`✅ Order ${order.id} executed successfully`);
    } catch (error) {
      console.error(`❌ Failed to execute order ${order.id}:`, error);

      // Mark order as failed/cancelled if execution fails
      order.status = OrderStatus.CANCELLED;
      await this.orderRepository.save(order);

      // Notify clients of execution failure
      if (this.websocketGateway.server) {
        this.websocketGateway.server.emit('order_execution_failed', {
          orderId: order.id,
          portfolioId: order.portfolioId,
          error: error.message,
        });
      } else {
        console.warn(
          'WebSocket server not available, skipping order_execution_failed emit',
        );
      }
    }
  }

  /**
   * Validate order creation requirements
   */
  private async validateOrderCreation(
    createOrderDto: CreateOrderDto,
  ): Promise<void> {
    // Check if portfolio exists
    const portfolio = await this.paperTradingService.getPortfolio(
      createOrderDto.portfolioId,
    );

    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    // For entry orders, check if sufficient funds will be available
    if (createOrderDto.type === OrderType.ENTRY) {
      const requiredFunds =
        createOrderDto.triggerPrice * createOrderDto.quantity;
      if (portfolio.currentCash < requiredFunds) {
        throw new Error('Insufficient funds for entry order');
      }
    }

    // For stop-loss and take-profit orders, check if position exists and has sufficient shares
    if (
      createOrderDto.type === OrderType.STOP_LOSS ||
      createOrderDto.type === OrderType.TAKE_PROFIT
    ) {
      const position = portfolio.positions?.find(
        (p) => p.symbol === createOrderDto.symbol.toUpperCase(),
      );

      if (!position) {
        throw new Error(`No position found for ${createOrderDto.symbol}`);
      }

      if (position.quantity < createOrderDto.quantity) {
        throw new Error('Insufficient shares for stop-loss/take-profit order');
      }
    }

    // Check if stock exists
    const stock = await this.stockRepository.findOne({
      where: { symbol: createOrderDto.symbol.toUpperCase() },
    });

    if (!stock) {
      throw new Error(`Stock ${createOrderDto.symbol} not found`);
    }
  }
}
