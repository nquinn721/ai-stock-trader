import { Injectable, Logger } from '@nestjs/common';
import {
  CreateOrderRequest,
  ExchangeBalance,
  ExchangeCandle,
  ExchangeConfig,
  ExchangeConnector,
  ExchangeInfo,
  ExchangeOrder,
  ExchangeOrderBook,
  ExchangePosition,
  ExchangeTicker,
  ExchangeTrade,
  TradingFees,
} from '../interfaces/exchange-connector.interface';

@Injectable()
export class CoinbaseAdapter implements ExchangeConnector {
  private readonly logger = new Logger(CoinbaseAdapter.name);
  private config: ExchangeConfig;
  private connected = false;

  constructor(config: ExchangeConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    this.logger.log('Coinbase adapter - Mock implementation for Phase 2A');
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async getTicker(symbol: string): Promise<ExchangeTicker> {
    // Mock implementation
    return {
      symbol: symbol.toUpperCase(),
      exchange: 'coinbase',
      timestamp: new Date(),
      open: 45000,
      high: 46000,
      low: 44500,
      close: 45500,
      volume: 1000000,
      quoteVolume: 45500000000,
      change: 500,
      changePercent: 1.11,
      vwap: 45250,
    };
  }

  async getTickers(symbols: string[]): Promise<ExchangeTicker[]> {
    return Promise.all(symbols.map((symbol) => this.getTicker(symbol)));
  }

  async getOrderBook(symbol: string, limit = 100): Promise<ExchangeOrderBook> {
    // Mock implementation
    const bids: [number, number][] = [];
    const asks: [number, number][] = [];
    const basePrice = 45500;

    for (let i = 0; i < limit; i++) {
      bids.push([basePrice - (i + 1) * 0.1, Math.random() * 10]);
      asks.push([basePrice + (i + 1) * 0.1, Math.random() * 10]);
    }

    return {
      symbol: symbol.toUpperCase(),
      exchange: 'coinbase',
      timestamp: new Date(),
      bids,
      asks,
      sequence: Date.now(),
    };
  }

  async getTrades(symbol: string, limit = 100): Promise<ExchangeTrade[]> {
    // Mock implementation
    const trades: ExchangeTrade[] = [];
    const basePrice = 45500;

    for (let i = 0; i < limit; i++) {
      trades.push({
        id: `trade_${Date.now()}_${i}`,
        symbol: symbol.toUpperCase(),
        exchange: 'coinbase',
        timestamp: new Date(Date.now() - i * 1000),
        price: basePrice + (Math.random() - 0.5) * 100,
        quantity: Math.random() * 5,
        side: Math.random() > 0.5 ? 'buy' : 'sell',
        maker: Math.random() > 0.5,
      });
    }

    return trades;
  }

  async getCandles(
    symbol: string,
    interval: string,
    limit = 100,
  ): Promise<ExchangeCandle[]> {
    // Mock implementation
    const candles: ExchangeCandle[] = [];
    const basePrice = 45500;
    const now = Date.now();

    for (let i = 0; i < limit; i++) {
      const timestamp = new Date(now - i * 60000); // 1 minute intervals
      const open = basePrice + (Math.random() - 0.5) * 1000;
      const close = open + (Math.random() - 0.5) * 500;
      const high = Math.max(open, close) + Math.random() * 200;
      const low = Math.min(open, close) - Math.random() * 200;

      candles.push({
        timestamp,
        open,
        high,
        low,
        close,
        volume: Math.random() * 1000,
        symbol,
        exchange: 'coinbase',
        interval,
      });
    }

    return candles;
  }

  async createOrder(request: CreateOrderRequest): Promise<ExchangeOrder> {
    throw new Error('Order creation not implemented in mock Coinbase adapter');
  }

  async cancelOrder(orderId: string, symbol: string): Promise<boolean> {
    this.logger.log(`Cancelling order ${orderId} for ${symbol}`);
    return true;
  }

  async getOrder(orderId: string, symbol: string): Promise<ExchangeOrder> {
    throw new Error('Get order not implemented in mock Coinbase adapter');
  }

  async getOrders(symbol?: string, status?: string): Promise<ExchangeOrder[]> {
    // Mock implementation - replaces getOpenOrders
    return [];
  }

  async getBalance(): Promise<ExchangeBalance> {
    // Single balance method - kept for backward compatibility
    return {
      currency: 'USD',
      exchange: 'coinbase',
      available: 10000,
      locked: 0,
      total: 10000,
      timestamp: new Date(),
    };
  }

  async getTradingFees(): Promise<TradingFees> {
    return {
      makerFee: 0.005, // Fixed: was 'maker'
      takerFee: 0.005, // Fixed: was 'taker' 
      timestamp: new Date(),
    };
  }

  async getExchangeInfo(): Promise<ExchangeInfo> {
    return {
      name: 'coinbase',
      status: 'online',
      serverTime: new Date(),
      symbols: [
        {
          symbol: 'BTC-USD',
          status: 'trading',
          baseAsset: 'BTC',
          quoteAsset: 'USD',
          baseAssetPrecision: 8,
          quoteAssetPrecision: 2,
          minQuantity: 0.00001,
          maxQuantity: 9000,
          stepSize: 0.00001,
          minPrice: 0.01,
          maxPrice: 1000000,
          tickSize: 0.01,
          minNotional: 10,
          filters: []
        },
        {
          symbol: 'ETH-USD',
          status: 'trading',
          baseAsset: 'ETH',
          quoteAsset: 'USD',
          baseAssetPrecision: 8,
          quoteAssetPrecision: 2,
          minQuantity: 0.001,
          maxQuantity: 5000,
          stepSize: 0.001,
          minPrice: 0.01,
          maxPrice: 50000,
          tickSize: 0.01,
          minNotional: 10,
          filters: []
        }
      ],
      rateLimits: [
        {
          rateLimitType: 'REQUEST_WEIGHT',
          interval: 'MINUTE',
          intervalNum: 1,
          limit: this.config.rateLimits.requests
        }
      ],
      filters: []
    };
  }

  async subscribeTicker(
    symbol: string,
    callback: (ticker: ExchangeTicker) => void,
  ): Promise<void> {
    this.logger.log(`Mock subscription to ticker updates for ${symbol}`);
  }

  async subscribeOrderBook(
    symbol: string,
    callback: (orderBook: ExchangeOrderBook) => void,
  ): Promise<void> {
    this.logger.log(`Mock subscription to order book updates for ${symbol}`);
  }

  async subscribeTrades(
    symbol: string,
    callback: (trade: ExchangeTrade) => void,
  ): Promise<void> {
    this.logger.log(`Mock subscription to trade updates for ${symbol}`);
  }

  async getPositions(symbol?: string): Promise<ExchangePosition[]> {
    return [];
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Missing methods from ExchangeConnector interface

  async getOrderHistory(symbol?: string, limit?: number): Promise<ExchangeOrder[]> {
    // Mock implementation
    return [];
  }

  async getBalances(): Promise<ExchangeBalance[]> {
    // Mock implementation - return multiple currency balances
    return [
      {
        currency: 'USD',
        exchange: 'coinbase',
        available: 10000,
        locked: 0,
        total: 10000,
        timestamp: new Date(),
      },
      {
        currency: 'BTC',
        exchange: 'coinbase',
        available: 0.5,
        locked: 0,
        total: 0.5,
        timestamp: new Date(),
      }
    ];
  }

  async subscribeOrders(callback: (data: ExchangeOrder) => void): Promise<void> {
    this.logger.log('Mock subscription to order updates');
  }

  async subscribeBalances(callback: (data: ExchangeBalance[]) => void): Promise<void> {
    this.logger.log('Mock subscription to balance updates');
  }

  async unsubscribeOrderBook(symbol: string): Promise<void> {
    this.logger.log(`Mock unsubscribe from order book for ${symbol}`);
  }

  async unsubscribeTicker(symbol: string): Promise<void> {
    this.logger.log(`Mock unsubscribe from ticker for ${symbol}`);
  }

  async unsubscribeTrades(symbol: string): Promise<void> {
    this.logger.log(`Mock unsubscribe from trades for ${symbol}`);
  }

  async unsubscribeOrders(): Promise<void> {
    this.logger.log('Mock unsubscribe from orders');
  }

  async unsubscribeBalances(): Promise<void> {
    this.logger.log('Mock unsubscribe from balances');
  }

  async unsubscribeAll(): Promise<void> {
    this.logger.log('Mock unsubscribe from all streams');
  }
}
