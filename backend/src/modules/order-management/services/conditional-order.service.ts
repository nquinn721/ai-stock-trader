import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConditionalTrigger,
  Order,
  OrderStatus,
} from '../../../entities/order.entity';
import { Stock } from '../../../entities/stock.entity';
import { OrderManagementService } from '../order-management.service';

export interface TechnicalIndicator {
  rsi: number;
  sma20: number;
  sma50: number;
  ema12: number;
  ema26: number;
  macd: number;
  bollinger_upper: number;
  bollinger_lower: number;
  volume_sma: number;
}

export interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  timestamp: Date;
  technicalIndicators?: TechnicalIndicator;
}

@Injectable()
export class ConditionalOrderService {
  private readonly logger = new Logger(ConditionalOrderService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    private readonly orderManagementService: OrderManagementService,
  ) {}

  /**
   * Evaluate all pending conditional orders
   */
  async evaluateConditionalOrders(): Promise<void> {
    const conditionalOrders = await this.orderRepository.find({
      where: { status: OrderStatus.PENDING },
      relations: ['stock'],
    });

    const ordersToTrigger: Order[] = [];

    for (const order of conditionalOrders) {
      if (order.conditionalTriggers && order.conditionalTriggers.length > 0) {
        try {
          const shouldTrigger = await this.evaluateOrderTriggers(order);
          if (shouldTrigger) {
            ordersToTrigger.push(order);
          }
        } catch (error) {
          this.logger.error(
            `Error evaluating conditional order ${order.id}: ${error.message}`,
          );
        }
      }
    }

    // Trigger orders that meet conditions
    for (const order of ordersToTrigger) {
      await this.triggerConditionalOrder(order);
    }

    if (ordersToTrigger.length > 0) {
      this.logger.log(
        `Triggered ${ordersToTrigger.length} conditional orders`,
      );
    }
  }

  /**
   * Evaluate if an order's conditional triggers are met
   */
  private async evaluateOrderTriggers(order: Order): Promise<boolean> {
    const marketData = await this.getMarketData(order.symbol);
    if (!marketData) {
      return false;
    }

    const triggers = order.conditionalTriggers as ConditionalTrigger[];
    
    // Group triggers by logical operator
    const andTriggers = triggers.filter(t => !t.logicalOperator || t.logicalOperator === 'AND');
    const orTriggers = triggers.filter(t => t.logicalOperator === 'OR');

    // Evaluate AND triggers (all must be true)
    let andResult = true;
    if (andTriggers.length > 0) {
      andResult = andTriggers.every(trigger => this.evaluateTrigger(trigger, marketData));
    }

    // Evaluate OR triggers (at least one must be true)
    let orResult = false;
    if (orTriggers.length > 0) {
      orResult = orTriggers.some(trigger => this.evaluateTrigger(trigger, marketData));
    }

    // If we have both AND and OR triggers, both groups must pass
    if (andTriggers.length > 0 && orTriggers.length > 0) {
      return andResult && orResult;
    }

    // If we only have AND triggers
    if (andTriggers.length > 0) {
      return andResult;
    }

    // If we only have OR triggers
    if (orTriggers.length > 0) {
      return orResult;
    }

    return false;
  }

  /**
   * Evaluate a single trigger condition
   */
  private evaluateTrigger(trigger: ConditionalTrigger, marketData: MarketData): boolean {
    let fieldValue: number;

    // Get the field value from market data
    switch (trigger.field.toLowerCase()) {
      case 'price':
        fieldValue = marketData.price;
        break;
      case 'volume':
        fieldValue = marketData.volume;
        break;
      case 'high':
        fieldValue = marketData.high;
        break;
      case 'low':
        fieldValue = marketData.low;
        break;
      case 'open':
        fieldValue = marketData.open;
        break;
      case 'rsi':
        fieldValue = marketData.technicalIndicators?.rsi || 0;
        break;
      case 'sma20':
        fieldValue = marketData.technicalIndicators?.sma20 || 0;
        break;
      case 'sma50':
        fieldValue = marketData.technicalIndicators?.sma50 || 0;
        break;
      case 'ema12':
        fieldValue = marketData.technicalIndicators?.ema12 || 0;
        break;
      case 'ema26':
        fieldValue = marketData.technicalIndicators?.ema26 || 0;
        break;
      case 'macd':
        fieldValue = marketData.technicalIndicators?.macd || 0;
        break;
      case 'bollinger_upper':
        fieldValue = marketData.technicalIndicators?.bollinger_upper || 0;
        break;
      case 'bollinger_lower':
        fieldValue = marketData.technicalIndicators?.bollinger_lower || 0;
        break;
      case 'volume_sma':
        fieldValue = marketData.technicalIndicators?.volume_sma || 0;
        break;
      default:
        this.logger.warn(`Unknown field in trigger: ${trigger.field}`);
        return false;
    }

    // Handle time-based triggers
    if (trigger.type === 'time') {
      const targetTime = new Date(trigger.value as string);
      const currentTime = new Date();
      
      switch (trigger.condition) {
        case 'greater_than':
          return currentTime > targetTime;
        case 'less_than':
          return currentTime < targetTime;
        case 'equals':
          // For time equality, consider within 1 minute window
          const timeDiff = Math.abs(currentTime.getTime() - targetTime.getTime());
          return timeDiff <= 60000; // 1 minute in milliseconds
        default:
          return false;
      }
    }

    // Handle numeric conditions
    const triggerValue = Number(trigger.value);
    const triggerValue2 = trigger.value2 ? Number(trigger.value2) : undefined;

    switch (trigger.condition) {
      case 'greater_than':
        return fieldValue > triggerValue;
      case 'less_than':
        return fieldValue < triggerValue;
      case 'equals':
        // For price equality, use small tolerance
        const tolerance = fieldValue * 0.001; // 0.1% tolerance
        return Math.abs(fieldValue - triggerValue) <= tolerance;
      case 'between':
        if (triggerValue2 === undefined) {
          this.logger.warn(`'between' condition requires value2 for trigger ${trigger.id}`);
          return false;
        }
        const min = Math.min(triggerValue, triggerValue2);
        const max = Math.max(triggerValue, triggerValue2);
        return fieldValue >= min && fieldValue <= max;
      default:
        this.logger.warn(`Unknown condition: ${trigger.condition}`);
        return false;
    }
  }

  /**
   * Trigger a conditional order for execution
   */
  private async triggerConditionalOrder(order: Order): Promise<void> {
    try {
      // Update order status to triggered
      order.status = OrderStatus.TRIGGERED;
      await this.orderRepository.save(order);

      this.logger.log(
        `Triggering conditional order ${order.id} for ${order.symbol}`,
      );

      // Execute the order through the order management service
      await this.orderManagementService.executeTriggeredOrder(order);

    } catch (error) {
      this.logger.error(
        `Failed to trigger conditional order ${order.id}: ${error.message}`,
      );
    }
  }

  /**
   * Get current market data for a symbol
   */
  private async getMarketData(symbol: string): Promise<MarketData | null> {
    try {
      const stock = await this.stockRepository.findOne({
        where: { symbol },
      });

      if (!stock) {
        return null;
      }

      // Build market data from stock entity
      const marketData: MarketData = {
        symbol: stock.symbol,
        price: Number(stock.currentPrice),
        volume: Number(stock.volume || 0),
        high: Number(stock.currentPrice), // Use current price as high/low for now
        low: Number(stock.currentPrice),
        open: Number(stock.previousClose || stock.currentPrice),
        timestamp: stock.updatedAt || new Date(),
      };

      // Note: Technical indicators would need to be added to Stock entity
      // For now, we'll create empty technical indicators
      marketData.technicalIndicators = {
        rsi: 50, // Default neutral RSI
        sma20: Number(stock.currentPrice),
        sma50: Number(stock.currentPrice),
        ema12: Number(stock.currentPrice),
        ema26: Number(stock.currentPrice),
        macd: 0,
        bollinger_upper: Number(stock.currentPrice) * 1.02,
        bollinger_lower: Number(stock.currentPrice) * 0.98,
        volume_sma: Number(stock.volume || 0),
      };

      return marketData;
    } catch (error) {
      this.logger.error(
        `Failed to get market data for ${symbol}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Create a conditional order trigger
   */
  createTrigger(
    type: 'price' | 'time' | 'indicator' | 'volume',
    condition: 'greater_than' | 'less_than' | 'equals' | 'between',
    field: string,
    value: number | string,
    value2?: number,
    logicalOperator?: 'AND' | 'OR',
  ): ConditionalTrigger {
    return {
      id: `trigger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      condition,
      field,
      value,
      value2,
      logicalOperator,
    };
  }

  /**
   * Validate a conditional trigger
   */
  validateTrigger(trigger: ConditionalTrigger): { valid: boolean; error?: string } {
    // Check required fields
    if (!trigger.type || !trigger.condition || !trigger.field || trigger.value === undefined) {
      return { valid: false, error: 'Missing required trigger fields' };
    }

    // Validate condition requirements
    if (trigger.condition === 'between' && trigger.value2 === undefined) {
      return { valid: false, error: "'between' condition requires value2" };
    }

    // Validate time-based triggers
    if (trigger.type === 'time') {
      try {
        new Date(trigger.value as string);
      } catch {
        return { valid: false, error: 'Invalid date format for time trigger' };
      }
    }

    // Validate numeric values for non-time triggers
    if (trigger.type !== 'time' && typeof trigger.value !== 'number') {
      return { valid: false, error: 'Numeric value required for non-time triggers' };
    }

    return { valid: true };
  }
}
