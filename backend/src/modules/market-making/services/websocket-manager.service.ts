import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import {
  ExchangeConnector,
  ExchangeOrderBook,
  ExchangeTicker,
  ExchangeTrade,
  ExchangeOrder,
  ExchangeBalance,
} from '../interfaces/exchange-connector.interface';

export interface WebSocketSubscription {
  id: string;
  exchange: string;
  symbol: string;
  type: 'orderbook' | 'ticker' | 'trades' | 'orders' | 'balances';
  active: boolean;
  callback: (data: any) => void;
  lastUpdate: Date;
}

export interface MarketDataSnapshot {
  exchange: string;
  symbol: string;
  timestamp: Date;
  ticker?: ExchangeTicker;
  orderBook?: ExchangeOrderBook;
  trades?: ExchangeTrade[];
}

@Injectable()
export class WebSocketManagerService extends EventEmitter {
  private readonly logger = new Logger(WebSocketManagerService.name);
  private subscriptions: Map<string, WebSocketSubscription> = new Map();
  private exchanges: Map<string, ExchangeConnector> = new Map();
  private marketDataCache: Map<string, MarketDataSnapshot> = new Map();
  private connectionStatus: Map<string, boolean> = new Map();

  constructor() {
    super();
    this.setMaxListeners(100); // Increase limit for multiple subscriptions
  }

  /**
   * Register an exchange connector for WebSocket operations
   */
  registerExchange(name: string, connector: ExchangeConnector): void {
    this.exchanges.set(name, connector);
    this.connectionStatus.set(name, false);
    this.logger.log(`Registered WebSocket exchange: ${name}`);
  }

  /**
   * Subscribe to order book updates
   */
  async subscribeOrderBook(
    exchange: string,
    symbol: string,
    callback: (data: ExchangeOrderBook) => void
  ): Promise<string> {
    const connector = this.exchanges.get(exchange);
    if (!connector) {
      throw new Error(`Exchange ${exchange} not found`);
    }

    const subscriptionId = `${exchange}_${symbol}_orderbook_${Date.now()}`;
    
    try {
      await connector.subscribeOrderBook(symbol, (data) => {
        // Update cache
        this.updateMarketDataCache(exchange, symbol, { orderBook: data });
        
        // Call user callback
        callback(data);
        
        // Emit event for other listeners
        this.emit('orderbook', { exchange, symbol, data });
        
        // Update subscription
        const sub = this.subscriptions.get(subscriptionId);
        if (sub) {
          sub.lastUpdate = new Date();
        }
      });

      const subscription: WebSocketSubscription = {
        id: subscriptionId,
        exchange,
        symbol,
        type: 'orderbook',
        active: true,
        callback,
        lastUpdate: new Date()
      };

      this.subscriptions.set(subscriptionId, subscription);
      this.connectionStatus.set(exchange, true);
      
      this.logger.log(`Subscribed to order book: ${exchange}:${symbol}`);
      return subscriptionId;

    } catch (error) {
      this.logger.error(`Failed to subscribe to order book ${exchange}:${symbol}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Subscribe to ticker updates
   */
  async subscribeTicker(
    exchange: string,
    symbol: string,
    callback: (data: ExchangeTicker) => void
  ): Promise<string> {
    const connector = this.exchanges.get(exchange);
    if (!connector) {
      throw new Error(`Exchange ${exchange} not found`);
    }

    const subscriptionId = `${exchange}_${symbol}_ticker_${Date.now()}`;
    
    try {
      await connector.subscribeTicker(symbol, (data) => {
        // Update cache
        this.updateMarketDataCache(exchange, symbol, { ticker: data });
        
        // Call user callback
        callback(data);
        
        // Emit event for other listeners
        this.emit('ticker', { exchange, symbol, data });
        
        // Update subscription
        const sub = this.subscriptions.get(subscriptionId);
        if (sub) {
          sub.lastUpdate = new Date();
        }
      });

      const subscription: WebSocketSubscription = {
        id: subscriptionId,
        exchange,
        symbol,
        type: 'ticker',
        active: true,
        callback,
        lastUpdate: new Date()
      };

      this.subscriptions.set(subscriptionId, subscription);
      
      this.logger.log(`Subscribed to ticker: ${exchange}:${symbol}`);
      return subscriptionId;

    } catch (error) {
      this.logger.error(`Failed to subscribe to ticker ${exchange}:${symbol}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Subscribe to trade updates
   */
  async subscribeTrades(
    exchange: string,
    symbol: string,
    callback: (data: ExchangeTrade) => void
  ): Promise<string> {
    const connector = this.exchanges.get(exchange);
    if (!connector) {
      throw new Error(`Exchange ${exchange} not found`);
    }

    const subscriptionId = `${exchange}_${symbol}_trades_${Date.now()}`;
    
    try {
      await connector.subscribeTrades(symbol, (data) => {
        // Update cache with latest trade
        this.updateMarketDataCache(exchange, symbol, { trades: [data] });
        
        // Call user callback
        callback(data);
        
        // Emit event for other listeners
        this.emit('trade', { exchange, symbol, data });
        
        // Update subscription
        const sub = this.subscriptions.get(subscriptionId);
        if (sub) {
          sub.lastUpdate = new Date();
        }
      });

      const subscription: WebSocketSubscription = {
        id: subscriptionId,
        exchange,
        symbol,
        type: 'trades',
        active: true,
        callback,
        lastUpdate: new Date()
      };

      this.subscriptions.set(subscriptionId, subscription);
      
      this.logger.log(`Subscribed to trades: ${exchange}:${symbol}`);
      return subscriptionId;

    } catch (error) {
      this.logger.error(`Failed to subscribe to trades ${exchange}:${symbol}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Subscribe to order updates
   */
  async subscribeOrders(
    exchange: string,
    callback: (data: ExchangeOrder) => void
  ): Promise<string> {
    const connector = this.exchanges.get(exchange);
    if (!connector) {
      throw new Error(`Exchange ${exchange} not found`);
    }

    const subscriptionId = `${exchange}_orders_${Date.now()}`;
    
    try {
      await connector.subscribeOrders((data) => {
        // Call user callback
        callback(data);
        
        // Emit event for other listeners
        this.emit('order', { exchange, data });
        
        // Update subscription
        const sub = this.subscriptions.get(subscriptionId);
        if (sub) {
          sub.lastUpdate = new Date();
        }
      });

      const subscription: WebSocketSubscription = {
        id: subscriptionId,
        exchange,
        symbol: '*', // Orders subscription is symbol-agnostic
        type: 'orders',
        active: true,
        callback,
        lastUpdate: new Date()
      };

      this.subscriptions.set(subscriptionId, subscription);
      
      this.logger.log(`Subscribed to orders: ${exchange}`);
      return subscriptionId;

    } catch (error) {
      this.logger.error(`Failed to subscribe to orders ${exchange}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Subscribe to balance updates
   */
  async subscribeBalances(
    exchange: string,
    callback: (data: ExchangeBalance[]) => void
  ): Promise<string> {
    const connector = this.exchanges.get(exchange);
    if (!connector) {
      throw new Error(`Exchange ${exchange} not found`);
    }

    const subscriptionId = `${exchange}_balances_${Date.now()}`;
    
    try {
      await connector.subscribeBalances((data) => {
        // Call user callback
        callback(data);
        
        // Emit event for other listeners
        this.emit('balances', { exchange, data });
        
        // Update subscription
        const sub = this.subscriptions.get(subscriptionId);
        if (sub) {
          sub.lastUpdate = new Date();
        }
      });

      const subscription: WebSocketSubscription = {
        id: subscriptionId,
        exchange,
        symbol: '*', // Balances subscription is symbol-agnostic
        type: 'balances',
        active: true,
        callback,
        lastUpdate: new Date()
      };

      this.subscriptions.set(subscriptionId, subscription);
      
      this.logger.log(`Subscribed to balances: ${exchange}`);
      return subscriptionId;

    } catch (error) {
      this.logger.error(`Failed to subscribe to balances ${exchange}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Unsubscribe from a specific subscription
   */
  async unsubscribe(subscriptionId: string): Promise<boolean> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    const connector = this.exchanges.get(subscription.exchange);
    if (!connector) {
      return false;
    }

    try {
      switch (subscription.type) {
        case 'orderbook':
          await connector.unsubscribeOrderBook(subscription.symbol);
          break;
        case 'ticker':
          await connector.unsubscribeTicker(subscription.symbol);
          break;
        case 'trades':
          await connector.unsubscribeTrades(subscription.symbol);
          break;
        case 'orders':
          await connector.unsubscribeOrders();
          break;
        case 'balances':
          await connector.unsubscribeBalances();
          break;
      }

      subscription.active = false;
      this.subscriptions.delete(subscriptionId);
      
      this.logger.log(`Unsubscribed: ${subscriptionId}`);
      return true;

    } catch (error) {
      this.logger.error(`Failed to unsubscribe ${subscriptionId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Unsubscribe from all subscriptions for an exchange
   */
  async unsubscribeExchange(exchange: string): Promise<void> {
    const connector = this.exchanges.get(exchange);
    if (!connector) {
      return;
    }

    try {
      await connector.unsubscribeAll();
      
      // Mark all subscriptions as inactive
      for (const [id, subscription] of this.subscriptions) {
        if (subscription.exchange === exchange) {
          subscription.active = false;
          this.subscriptions.delete(id);
        }
      }

      this.connectionStatus.set(exchange, false);
      this.logger.log(`Unsubscribed all for exchange: ${exchange}`);

    } catch (error) {
      this.logger.error(`Failed to unsubscribe all for ${exchange}: ${error.message}`);
    }
  }

  /**
   * Get market data snapshot
   */
  getMarketDataSnapshot(exchange: string, symbol: string): MarketDataSnapshot | undefined {
    return this.marketDataCache.get(`${exchange}:${symbol}`);
  }

  /**
   * Get all active subscriptions
   */
  getActiveSubscriptions(): WebSocketSubscription[] {
    return Array.from(this.subscriptions.values()).filter(sub => sub.active);
  }

  /**
   * Get connection status for all exchanges
   */
  getConnectionStatus(): { [exchange: string]: boolean } {
    const status: { [exchange: string]: boolean } = {};
    for (const [exchange, connected] of this.connectionStatus) {
      status[exchange] = connected;
    }
    return status;
  }

  /**
   * Health check for stale subscriptions
   */
  async healthCheck(): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    staleSubscriptions: number;
    connectionStatus: { [exchange: string]: boolean };
  }> {
    const now = new Date();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    
    let staleCount = 0;
    const activeSubscriptions = this.getActiveSubscriptions();
    
    for (const subscription of activeSubscriptions) {
      const timeSinceLastUpdate = now.getTime() - subscription.lastUpdate.getTime();
      if (timeSinceLastUpdate > staleThreshold) {
        staleCount++;
        this.logger.warn(`Stale subscription detected: ${subscription.id}`);
      }
    }

    return {
      totalSubscriptions: this.subscriptions.size,
      activeSubscriptions: activeSubscriptions.length,
      staleSubscriptions: staleCount,
      connectionStatus: this.getConnectionStatus()
    };
  }

  /**
   * Update market data cache
   */
  private updateMarketDataCache(
    exchange: string,
    symbol: string,
    update: Partial<MarketDataSnapshot>
  ): void {
    const key = `${exchange}:${symbol}`;
    const existing = this.marketDataCache.get(key) || {
      exchange,
      symbol,
      timestamp: new Date()
    };

    const updated = {
      ...existing,
      ...update,
      timestamp: new Date()
    };

    this.marketDataCache.set(key, updated);
  }

  /**
   * Cleanup on service destruction
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Cleaning up WebSocket subscriptions...');
    
    for (const [exchangeName] of this.exchanges) {
      await this.unsubscribeExchange(exchangeName);
    }

    this.subscriptions.clear();
    this.marketDataCache.clear();
    this.removeAllListeners();
  }
}
