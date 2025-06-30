import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import {
  AutoTradingOrder,
  AutoTradingOrderStatus,
} from '../../../entities/auto-trading-order.entity';
import { Portfolio } from '../../../entities/portfolio.entity';
import { Stock } from '../../../entities/stock.entity';
import {
  CreateAutoTradingOrderDto,
  UpdateAutoTradingOrderDto,
} from '../dto/auto-trading-order.dto';

@Injectable()
export class AutoTradingOrderPreviewService {
  private readonly logger = new Logger(AutoTradingOrderPreviewService.name);

  constructor(
    @InjectRepository(AutoTradingOrder)
    private autoTradingOrderRepository: Repository<AutoTradingOrder>,
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
  ) {}

  /**
   * Get all pending auto trading orders for a portfolio
   */
  async getPendingOrdersForPortfolio(
    portfolioId: number,
  ): Promise<AutoTradingOrder[]> {
    this.logger.debug(`Getting pending orders for portfolio ${portfolioId}`);

    const orders = await this.autoTradingOrderRepository.find({
      where: {
        portfolioId,
        status: In([
          AutoTradingOrderStatus.PENDING,
          AutoTradingOrderStatus.APPROVED,
        ]),
      },
      relations: ['stock', 'portfolio'],
      order: {
        createdAt: 'DESC',
      },
    });

    // Update current prices for all orders
    await this.updateCurrentPrices(orders);

    return orders;
  }

  /**
   * Create a new auto trading order preview from recommendation
   */
  async createAutoTradingOrder(
    createDto: CreateAutoTradingOrderDto,
  ): Promise<AutoTradingOrder> {
    this.logger.debug(
      `Creating auto trading order: ${JSON.stringify(createDto)}`,
    );

    // Verify portfolio exists
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: createDto.portfolioId },
    });

    if (!portfolio) {
      throw new NotFoundException(
        `Portfolio with ID ${createDto.portfolioId} not found`,
      );
    }

    // Get current market price
    const currentPrice = await this.getCurrentPrice(createDto.symbol);

    // Set expiry to end of day if not specified
    const expiryTime = createDto.expiryTime || this.getEndOfDayExpiry();

    // Calculate estimated value
    const estimatedValue =
      Number(createDto.quantity) * (createDto.limitPrice || currentPrice);

    const autoTradingOrder = this.autoTradingOrderRepository.create({
      ...createDto,
      currentPrice,
      estimatedValue,
      expiryTime,
      status: AutoTradingOrderStatus.PENDING,
    });

    const savedOrder =
      await this.autoTradingOrderRepository.save(autoTradingOrder);

    this.logger.log(
      `Created auto trading order ${savedOrder.id} for ${createDto.symbol}`,
    );
    return savedOrder;
  }

  /**
   * Approve a pending auto trading order
   */
  async approveOrder(orderId: string): Promise<AutoTradingOrder> {
    this.logger.debug(`Approving auto trading order ${orderId}`);

    const order = await this.autoTradingOrderRepository.findOne({
      where: { id: orderId },
      relations: ['stock', 'portfolio'],
    });

    if (!order) {
      throw new NotFoundException(
        `Auto trading order with ID ${orderId} not found`,
      );
    }

    if (order.status !== AutoTradingOrderStatus.PENDING) {
      throw new Error(
        `Order ${orderId} cannot be approved - current status: ${order.status}`,
      );
    }

    // Check if order is expired
    if (order.isExpired) {
      order.status = AutoTradingOrderStatus.EXPIRED;
      await this.autoTradingOrderRepository.save(order);
      throw new Error(`Order ${orderId} has expired and cannot be approved`);
    }

    order.status = AutoTradingOrderStatus.APPROVED;
    order.approvedAt = new Date();

    return await this.autoTradingOrderRepository.save(order);
  }

  /**
   * Reject a pending auto trading order
   */
  async rejectOrder(
    orderId: string,
    reason?: string,
  ): Promise<AutoTradingOrder> {
    this.logger.debug(`Rejecting auto trading order ${orderId}`);

    const order = await this.autoTradingOrderRepository.findOne({
      where: { id: orderId },
      relations: ['stock', 'portfolio'],
    });

    if (!order) {
      throw new NotFoundException(
        `Auto trading order with ID ${orderId} not found`,
      );
    }

    if (order.status !== AutoTradingOrderStatus.PENDING) {
      throw new Error(
        `Order ${orderId} cannot be rejected - current status: ${order.status}`,
      );
    }

    order.status = AutoTradingOrderStatus.REJECTED;
    order.rejectedAt = new Date();
    order.rejectionReason = reason;

    return await this.autoTradingOrderRepository.save(order);
  }

  /**
   * Modify an existing auto trading order
   */
  async modifyOrder(
    orderId: string,
    updateDto: UpdateAutoTradingOrderDto,
  ): Promise<AutoTradingOrder> {
    this.logger.debug(`Modifying auto trading order ${orderId}`);

    const order = await this.autoTradingOrderRepository.findOne({
      where: { id: orderId },
      relations: ['stock', 'portfolio'],
    });

    if (!order) {
      throw new NotFoundException(
        `Auto trading order with ID ${orderId} not found`,
      );
    }

    if (order.status !== AutoTradingOrderStatus.PENDING) {
      throw new Error(
        `Order ${orderId} cannot be modified - current status: ${order.status}`,
      );
    }

    // Update the order with new values
    Object.assign(order, updateDto);

    // Recalculate estimated value if quantity or price changed
    if (updateDto.quantity || updateDto.limitPrice) {
      const currentPrice =
        order.currentPrice || (await this.getCurrentPrice(order.symbol));
      order.estimatedValue =
        Number(order.quantity) * (order.limitPrice || currentPrice);
    }

    return await this.autoTradingOrderRepository.save(order);
  }

  /**
   * Get order status summary for a portfolio
   */
  async getOrderStatusSummary(portfolioId: number) {
    this.logger.debug(
      `Getting order status summary for portfolio ${portfolioId}`,
    );

    const counts = await this.autoTradingOrderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('order.portfolioId = :portfolioId', { portfolioId })
      .groupBy('order.status')
      .getRawMany();

    const summary = {
      pending: 0,
      approved: 0,
      rejected: 0,
      expired: 0,
      executed: 0,
      cancelled: 0,
      total: 0,
    };

    counts.forEach(({ status, count }) => {
      summary[status.toLowerCase()] = parseInt(count);
      summary.total += parseInt(count);
    });

    return summary;
  }

  /**
   * Bulk approve orders
   */
  async bulkApproveOrders(orderIds: string[]): Promise<AutoTradingOrder[]> {
    this.logger.debug(`Bulk approving ${orderIds.length} orders`);

    const orders = await this.autoTradingOrderRepository.find({
      where: {
        id: In(orderIds),
        status: AutoTradingOrderStatus.PENDING,
      },
    });

    const approvedOrders = [];
    for (const order of orders) {
      if (!order.isExpired) {
        order.status = AutoTradingOrderStatus.APPROVED;
        order.approvedAt = new Date();
        approvedOrders.push(order);
      }
    }

    return await this.autoTradingOrderRepository.save(approvedOrders);
  }

  /**
   * Bulk reject orders
   */
  async bulkRejectOrders(
    orderIds: string[],
    reason?: string,
  ): Promise<AutoTradingOrder[]> {
    this.logger.debug(`Bulk rejecting ${orderIds.length} orders`);

    const orders = await this.autoTradingOrderRepository.find({
      where: {
        id: In(orderIds),
        status: AutoTradingOrderStatus.PENDING,
      },
    });

    orders.forEach((order) => {
      order.status = AutoTradingOrderStatus.REJECTED;
      order.rejectedAt = new Date();
      order.rejectionReason = reason;
    });

    return await this.autoTradingOrderRepository.save(orders);
  }

  /**
   * Mark order as executed (called when actual order is executed)
   */
  async markOrderAsExecuted(
    orderId: string,
    executedOrderId: number,
  ): Promise<AutoTradingOrder> {
    const order = await this.autoTradingOrderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(
        `Auto trading order with ID ${orderId} not found`,
      );
    }

    order.status = AutoTradingOrderStatus.EXECUTED;
    order.executedAt = new Date();
    order.executedOrderId = executedOrderId;

    return await this.autoTradingOrderRepository.save(order);
  }

  /**
   * Cleanup expired orders (runs daily at market close)
   */
  @Cron(CronExpression.EVERY_DAY_AT_4PM) // Assuming market closes at 4 PM
  async cleanupExpiredOrders() {
    this.logger.log('Starting cleanup of expired auto trading orders');

    const expiredOrders = await this.autoTradingOrderRepository.find({
      where: [
        {
          status: In([
            AutoTradingOrderStatus.PENDING,
            AutoTradingOrderStatus.APPROVED,
          ]),
          expiryTime: LessThan(new Date()),
        },
      ],
    });

    if (expiredOrders.length > 0) {
      expiredOrders.forEach((order) => {
        order.status = AutoTradingOrderStatus.EXPIRED;
      });

      await this.autoTradingOrderRepository.save(expiredOrders);
      this.logger.log(`Expired ${expiredOrders.length} auto trading orders`);
    } else {
      this.logger.log('No expired orders found');
    }
  }

  /**
   * Update current prices for orders
   */
  private async updateCurrentPrices(orders: AutoTradingOrder[]): Promise<void> {
    const symbols = [...new Set(orders.map((order) => order.symbol))];

    for (const symbol of symbols) {
      try {
        const currentPrice = await this.getCurrentPrice(symbol);
        const symbolOrders = orders.filter((order) => order.symbol === symbol);

        symbolOrders.forEach((order) => {
          order.currentPrice = currentPrice;
          order.estimatedValue =
            Number(order.quantity) * (order.limitPrice || currentPrice);
        });
      } catch (error) {
        this.logger.warn(
          `Failed to update price for ${symbol}: ${error.message}`,
        );
      }
    }

    // Save updated orders
    await this.autoTradingOrderRepository.save(orders);
  }

  /**
   * Get end of day expiry time
   */
  private getEndOfDayExpiry(): Date {
    const now = new Date();
    const eod = new Date(now);
    eod.setHours(16, 0, 0, 0); // 4 PM market close

    // If it's already past market close, set for next trading day
    if (now > eod) {
      eod.setDate(eod.getDate() + 1);
      // Skip weekends
      if (eod.getDay() === 6) {
        // Saturday
        eod.setDate(eod.getDate() + 2);
      } else if (eod.getDay() === 0) {
        // Sunday
        eod.setDate(eod.getDate() + 1);
      }
    }

    return eod;
  }

  /**
   * Get current price for a symbol
   */
  private async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const stock = await this.stockRepository.findOne({
        where: { symbol: symbol.toUpperCase() },
      });

      if (!stock || !stock.currentPrice) {
        // Return a default price if not found (in production, would integrate with market data API)
        this.logger.warn(`No current price found for ${symbol}, using default`);
        return 100; // Default price for preview purposes
      }

      return Number(stock.currentPrice);
    } catch (error) {
      this.logger.error(
        `Error getting current price for ${symbol}: ${error.message}`,
      );
      return 100; // Default fallback price
    }
  }
}
