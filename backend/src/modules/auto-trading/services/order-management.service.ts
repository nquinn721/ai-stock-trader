import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutoTrade, AutoTradeStatus } from '../entities/auto-trade.entity';

export interface OrderRequest {
  tradeId: string;
  symbol: string;
  quantity: number;
  orderType: 'market' | 'limit' | 'stop' | 'stop_limit';
  price?: number;
  stopPrice?: number;
  timeInForce?: 'GTC' | 'IOC' | 'FOK' | 'DAY';
  expirationTime?: Date;
}

export interface OrderStatus {
  orderId: string;
  status: 'pending' | 'partial' | 'filled' | 'cancelled' | 'rejected';
  filledQuantity: number;
  avgFillPrice?: number;
  lastUpdated: Date;
}

@Injectable()
export class OrderManagementService {
  private readonly logger = new Logger(OrderManagementService.name);
  private readonly activeOrders = new Map<string, OrderRequest>();
  private readonly orderStatus = new Map<string, OrderStatus>();

  constructor(
    @InjectRepository(AutoTrade)
    private readonly autoTradeRepository: Repository<AutoTrade>,
  ) {}

  /**
   * Submit a new order
   */
  async submitOrder(request: OrderRequest): Promise<string> {
    try {
      const orderId = this.generateOrderId();

      this.activeOrders.set(orderId, request);
      this.orderStatus.set(orderId, {
        orderId,
        status: 'pending',
        filledQuantity: 0,
        lastUpdated: new Date(),
      });

      this.logger.log(
        `Order submitted: ${orderId} - ${request.orderType} ${request.quantity} ${request.symbol}`,
      );

      // For market orders, simulate immediate execution
      if (request.orderType === 'market') {
        setTimeout(() => this.simulateOrderFill(orderId), 1000);
      }

      return orderId;
    } catch (error) {
      this.logger.error('Error submitting order:', error);
      throw error;
    }
  }

  /**
   * Cancel an existing order
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      const order = this.activeOrders.get(orderId);
      const status = this.orderStatus.get(orderId);

      if (!order || !status) {
        return false;
      }

      if (status.status === 'filled' || status.status === 'cancelled') {
        return false;
      }

      status.status = 'cancelled';
      status.lastUpdated = new Date();

      this.orderStatus.set(orderId, status);
      this.activeOrders.delete(orderId);

      this.logger.log(`Order cancelled: ${orderId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error cancelling order ${orderId}:`, error);
      return false;
    }
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderId: string): Promise<OrderStatus | null> {
    return this.orderStatus.get(orderId) || null;
  }

  /**
   * Get all active orders
   */
  async getActiveOrders(): Promise<OrderRequest[]> {
    return Array.from(this.activeOrders.values());
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus['status'],
    filledQuantity?: number,
    avgFillPrice?: number,
  ): Promise<void> {
    const currentStatus = this.orderStatus.get(orderId);
    if (!currentStatus) {
      return;
    }

    const updatedStatus: OrderStatus = {
      ...currentStatus,
      status,
      filledQuantity: filledQuantity ?? currentStatus.filledQuantity,
      avgFillPrice: avgFillPrice ?? currentStatus.avgFillPrice,
      lastUpdated: new Date(),
    };

    this.orderStatus.set(orderId, updatedStatus);

    // If order is completed, remove from active orders
    if (
      status === 'filled' ||
      status === 'cancelled' ||
      status === 'rejected'
    ) {
      this.activeOrders.delete(orderId);
    }

    this.logger.debug(`Order ${orderId} status updated: ${status}`);
  }

  /**
   * Process pending limit and stop orders
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async processOrders(): Promise<void> {
    try {
      const activeOrderEntries = Array.from(this.activeOrders.entries());

      for (const [orderId, order] of activeOrderEntries) {
        const status = this.orderStatus.get(orderId);

        if (!status || status.status !== 'pending') {
          continue;
        }

        // Check if order should be filled based on current market conditions
        const shouldFill = await this.checkOrderFillConditions(order);

        if (shouldFill) {
          await this.simulateOrderFill(orderId);
        }

        // Check for order expiration
        if (order.expirationTime && new Date() > order.expirationTime) {
          await this.updateOrderStatus(orderId, 'cancelled');
          this.logger.log(`Order ${orderId} expired and cancelled`);
        }
      }
    } catch (error) {
      this.logger.error('Error processing orders:', error);
    }
  }

  /**
   * Check if order fill conditions are met
   */
  private async checkOrderFillConditions(
    order: OrderRequest,
  ): Promise<boolean> {
    try {
      // Simplified market price simulation
      const currentPrice = await this.getCurrentMarketPrice(order.symbol);

      switch (order.orderType) {
        case 'market':
          return true;

        case 'limit':
          // Limit buy: fill if market price <= limit price
          // Limit sell: fill if market price >= limit price
          return order.price ? currentPrice <= order.price : false;

        case 'stop':
          // Stop order becomes market order when stop price is hit
          return order.stopPrice ? currentPrice <= order.stopPrice : false;

        case 'stop_limit':
          // Stop-limit order becomes limit order when stop price is hit
          if (order.stopPrice && currentPrice <= order.stopPrice) {
            // Convert to limit order logic
            return order.price ? currentPrice <= order.price : false;
          }
          return false;

        default:
          return false;
      }
    } catch (error) {
      this.logger.error(`Error checking fill conditions for order:`, error);
      return false;
    }
  }

  /**
   * Simulate order fill (for paper trading)
   */
  private async simulateOrderFill(orderId: string): Promise<void> {
    try {
      const order = this.activeOrders.get(orderId);
      if (!order) {
        return;
      }

      const fillPrice = await this.getCurrentMarketPrice(order.symbol);
      const fillQuantity = order.quantity;

      await this.updateOrderStatus(orderId, 'filled', fillQuantity, fillPrice);

      // Update the corresponding auto trade
      await this.updateAutoTrade(order.tradeId, fillPrice, fillQuantity);

      this.logger.log(
        `Order ${orderId} filled: ${fillQuantity} shares at $${fillPrice}`,
      );
    } catch (error) {
      this.logger.error(`Error filling order ${orderId}:`, error);
      await this.updateOrderStatus(orderId, 'rejected');
    }
  }

  /**
   * Update auto trade with execution details
   */
  private async updateAutoTrade(
    tradeId: string,
    executedPrice: number,
    executedQuantity: number,
  ): Promise<void> {
    try {
      await this.autoTradeRepository.update(tradeId, {
        status: AutoTradeStatus.EXECUTED,
        executed_price: executedPrice,
        quantity: executedQuantity,
        executed_at: new Date(),
        updated_at: new Date(),
      });
    } catch (error) {
      this.logger.error(`Error updating auto trade ${tradeId}:`, error);
    }
  }

  /**
   * Get current market price (simplified simulation)
   */
  private async getCurrentMarketPrice(symbol: string): Promise<number> {
    // Simplified price simulation
    // In a real implementation, this would fetch from market data service
    const basePrice = 100;
    const randomVariation = (Math.random() - 0.5) * 10; // ±$5 variation
    return Math.max(1, basePrice + randomVariation);
  }

  /**
   * Generate unique order ID
   */
  private generateOrderId(): string {
    return `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get order history for a trade
   */
  async getOrderHistory(tradeId: string): Promise<OrderStatus[]> {
    const history: OrderStatus[] = [];

    for (const [orderId, status] of this.orderStatus.entries()) {
      const order = this.activeOrders.get(orderId);
      if (order && order.tradeId === tradeId) {
        history.push(status);
      }
    }

    return history.sort(
      (a, b) => a.lastUpdated.getTime() - b.lastUpdated.getTime(),
    );
  }

  /**
   * Clean up old order records
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupOrderHistory(): Promise<void> {
    try {
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      let cleanedCount = 0;

      for (const [orderId, status] of this.orderStatus.entries()) {
        if (
          status.lastUpdated < cutoffTime &&
          (status.status === 'filled' ||
            status.status === 'cancelled' ||
            status.status === 'rejected')
        ) {
          this.orderStatus.delete(orderId);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        this.logger.log(`Cleaned up ${cleanedCount} old order records`);
      }
    } catch (error) {
      this.logger.error('Error cleaning up order history:', error);
    }
  }

  /**
   * Get order statistics
   */
  async getOrderStatistics(): Promise<{
    totalOrders: number;
    activeOrders: number;
    filledOrders: number;
    cancelledOrders: number;
    avgFillTime: number;
  }> {
    const allStatuses = Array.from(this.orderStatus.values());

    return {
      totalOrders: allStatuses.length,
      activeOrders: allStatuses.filter((s) => s.status === 'pending').length,
      filledOrders: allStatuses.filter((s) => s.status === 'filled').length,
      cancelledOrders: allStatuses.filter((s) => s.status === 'cancelled')
        .length,
      avgFillTime: 2000, // Simplified average fill time in ms
    };
  }
}
