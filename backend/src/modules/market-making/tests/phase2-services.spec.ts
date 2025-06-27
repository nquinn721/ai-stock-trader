import { Test, TestingModule } from '@nestjs/testing';
// import { BinanceAdapter } from '../adapters/binance.adapter';
import {
  ExchangeConfig,
  ExchangeOrderBook,
  ExchangeTicker,
} from '../interfaces/exchange-connector.interface';
import { ExchangeConnectorService } from '../services/exchange-connector.service';
import { WebSocketManagerService } from '../services/websocket-manager.service';

describe('ExchangeConnectorService', () => {
  let service: ExchangeConnectorService;
  let binanceAdapter: BinanceAdapter;

  const mockConfig: ExchangeConfig = {
    name: 'binance',
    apiKey: 'test-api-key',
    secretKey: 'test-secret-key',
    sandbox: true,
    rateLimits: {
      requests: 1200,
      interval: 60000,
      weight: 1,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExchangeConnectorService,
        {
          provide: BinanceAdapter,
          useValue: {
            connect: jest.fn(),
            disconnect: jest.fn(),
            isConnected: jest.fn().mockReturnValue(true),
            getOrderBook: jest.fn(),
            getTicker: jest.fn(),
            getTrades: jest.fn(),
            getBalances: jest.fn(),
            createOrder: jest.fn(),
            subscribeOrderBook: jest.fn(),
            subscribeTicker: jest.fn(),
            subscribeTrades: jest.fn(),
            unsubscribeOrderBook: jest.fn(),
            unsubscribeTicker: jest.fn(),
            unsubscribeTrades: jest.fn(),
            unsubscribeAll: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ExchangeConnectorService>(ExchangeConnectorService);
    binanceAdapter = module.get<BinanceAdapter>(BinanceAdapter);

    // Register the mock adapter
    service.registerExchange('binance', binanceAdapter);
  });

  describe('Exchange Registration', () => {
    it('should register an exchange connector', () => {
      const exchangeName = 'test-exchange';
      service.registerExchange(exchangeName, binanceAdapter);

      expect(service.getExchange(exchangeName)).toBe(binanceAdapter);
      expect(service.getExchanges()).toContain(exchangeName);
    });

    it('should return undefined for non-existent exchange', () => {
      expect(service.getExchange('non-existent')).toBeUndefined();
    });

    it('should list all registered exchanges', () => {
      service.registerExchange('test1', binanceAdapter);
      service.registerExchange('test2', binanceAdapter);

      const exchanges = service.getExchanges();
      expect(exchanges).toContain('test1');
      expect(exchanges).toContain('test2');
      expect(exchanges).toContain('binance');
    });
  });

  describe('Aggregated Order Book', () => {
    it('should get aggregated order book from multiple exchanges', async () => {
      const mockOrderBook: ExchangeOrderBook = {
        symbol: 'BTCUSDT',
        exchange: 'binance',
        timestamp: new Date(),
        bids: [
          [45000, 1.5],
          [44999, 2.0],
        ],
        asks: [
          [45001, 1.0],
          [45002, 1.8],
        ],
      };

      (binanceAdapter.getOrderBook as jest.Mock).mockResolvedValue(
        mockOrderBook,
      );

      const result = await service.getAggregatedOrderBook('BTCUSDT', [
        'binance',
      ]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockOrderBook);
      expect(binanceAdapter.getOrderBook).toHaveBeenCalledWith('BTCUSDT');
    });

    it('should handle errors gracefully when getting order book', async () => {
      (binanceAdapter.getOrderBook as jest.Mock).mockRejectedValue(
        new Error('API Error'),
      );

      const result = await service.getAggregatedOrderBook('BTCUSDT', [
        'binance',
      ]);

      expect(result).toHaveLength(0);
    });

    it('should use all exchanges when no specific exchanges provided', async () => {
      const mockOrderBook: ExchangeOrderBook = {
        symbol: 'BTCUSDT',
        exchange: 'binance',
        timestamp: new Date(),
        bids: [[45000, 1.5]],
        asks: [[45001, 1.0]],
      };

      (binanceAdapter.getOrderBook as jest.Mock).mockResolvedValue(
        mockOrderBook,
      );

      const result = await service.getAggregatedOrderBook('BTCUSDT');

      expect(result).toHaveLength(1);
    });
  });

  describe('Best Quotes', () => {
    it('should find best bid and ask across exchanges', async () => {
      const mockOrderBook1: ExchangeOrderBook = {
        symbol: 'BTCUSDT',
        exchange: 'binance',
        timestamp: new Date(),
        bids: [
          [45000, 1.5],
          [44999, 2.0],
        ], // Best bid: 45000
        asks: [
          [45002, 1.0],
          [45003, 1.8],
        ], // Best ask: 45002
      };

      const mockOrderBook2: ExchangeOrderBook = {
        symbol: 'BTCUSDT',
        exchange: 'coinbase',
        timestamp: new Date(),
        bids: [
          [44999.5, 1.0],
          [44998, 1.5],
        ], // Lower bid
        asks: [
          [45001, 0.5],
          [45001.5, 1.0],
        ], // Better ask: 45001
      };

      service.registerExchange('coinbase', {
        ...binanceAdapter,
        getOrderBook: jest.fn().mockResolvedValue(mockOrderBook2),
      });

      (binanceAdapter.getOrderBook as jest.Mock).mockResolvedValue(
        mockOrderBook1,
      );

      const result = await service.getBestQuotes('BTCUSDT');

      expect(result.bestBid).toEqual({
        price: 45000,
        quantity: 1.5,
        exchange: 'binance',
      });
      expect(result.bestAsk).toEqual({
        price: 45001,
        quantity: 0.5,
        exchange: 'coinbase',
      });
    });

    it('should handle empty order books', async () => {
      const mockOrderBook: ExchangeOrderBook = {
        symbol: 'BTCUSDT',
        exchange: 'binance',
        timestamp: new Date(),
        bids: [],
        asks: [],
      };

      (binanceAdapter.getOrderBook as jest.Mock).mockResolvedValue(
        mockOrderBook,
      );

      const result = await service.getBestQuotes('BTCUSDT');

      expect(result.bestBid).toBeNull();
      expect(result.bestAsk).toBeNull();
    });
  });

  describe('Arbitrage Execution', () => {
    it('should execute arbitrage between exchanges', async () => {
      const mockBuyOrder = {
        id: 'buy-order-123',
        symbol: 'BTCUSDT',
        exchange: 'binance',
        side: 'buy' as const,
        type: 'market' as const,
        quantity: 1.0,
        averagePrice: 45000,
        timeInForce: 'GTC' as const,
        status: 'filled' as const,
        filledQuantity: 1.0,
        remainingQuantity: 0,
        timestamp: new Date(),
        updatedAt: new Date(),
      };

      const mockSellOrder = {
        id: 'sell-order-456',
        symbol: 'BTCUSDT',
        exchange: 'coinbase',
        side: 'sell' as const,
        type: 'market' as const,
        quantity: 1.0,
        averagePrice: 45100,
        timeInForce: 'GTC' as const,
        status: 'filled' as const,
        filledQuantity: 1.0,
        remainingQuantity: 0,
        timestamp: new Date(),
        updatedAt: new Date(),
      };

      const sellAdapter = {
        ...binanceAdapter,
        createOrder: jest.fn().mockResolvedValue(mockSellOrder),
      };

      service.registerExchange('coinbase', sellAdapter);
      (binanceAdapter.createOrder as jest.Mock).mockResolvedValue(mockBuyOrder);

      const result = await service.executeArbitrage(
        'BTCUSDT',
        'binance', // buy exchange
        'coinbase', // sell exchange
        1.0,
        100, // expected profit
      );

      expect(result.success).toBe(true);
      expect(result.buyOrder).toEqual(mockBuyOrder);
      expect(result.sellOrder).toEqual(mockSellOrder);
      expect(result.actualProfit).toBe(100); // 45100 - 45000 = 100
    });

    it('should handle arbitrage execution errors', async () => {
      const sellAdapter = {
        ...binanceAdapter,
        createOrder: jest.fn().mockRejectedValue(new Error('Order failed')),
      };

      service.registerExchange('coinbase', sellAdapter);
      (binanceAdapter.createOrder as jest.Mock).mockRejectedValue(
        new Error('Order failed'),
      );

      const result = await service.executeArbitrage(
        'BTCUSDT',
        'binance',
        'coinbase',
        1.0,
        100,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Order failed');
    });

    it('should return error for non-existent exchange', async () => {
      const result = await service.executeArbitrage(
        'BTCUSDT',
        'non-existent',
        'binance',
        1.0,
        100,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Exchange connector not found');
    });
  });

  describe('Connectivity and Status', () => {
    it('should check connectivity for all exchanges', async () => {
      (binanceAdapter.connect as jest.Mock).mockResolvedValue(undefined);

      const result = await service.checkConnectivity();

      expect(result).toEqual({ binance: true });
      expect(binanceAdapter.connect).toHaveBeenCalled();
    });

    it('should handle connectivity failures', async () => {
      (binanceAdapter.connect as jest.Mock).mockRejectedValue(
        new Error('Connection failed'),
      );

      const result = await service.checkConnectivity();

      expect(result).toEqual({ binance: false });
    });

    it('should get exchange status', async () => {
      (binanceAdapter.isConnected as jest.Mock).mockReturnValue(true);

      const result = await service.getExchangeStatus();

      expect(result.binance.connected).toBe(true);
      expect(result.binance.rateLimitUsed).toBe(0);
      expect(result.binance.rateLimitRemaining).toBe(1000);
    });
  });

  describe('Aggregated Balances', () => {
    it('should aggregate balances across exchanges', async () => {
      const mockBalances = [
        {
          currency: 'BTC',
          exchange: 'binance',
          available: 0.5,
          locked: 0.1,
          total: 0.6,
          timestamp: new Date(),
        },
        {
          currency: 'USDT',
          exchange: 'binance',
          available: 10000,
          locked: 2000,
          total: 12000,
          timestamp: new Date(),
        },
      ];

      (binanceAdapter.getBalances as jest.Mock).mockResolvedValue(mockBalances);

      const result = await service.getAggregatedBalances();

      expect(result.BTC.total).toBe(0.6);
      expect(result.BTC.exchanges.binance).toBe(0.6);
      expect(result.USDT.total).toBe(12000);
      expect(result.USDT.exchanges.binance).toBe(12000);
    });

    it('should handle balance retrieval errors', async () => {
      (binanceAdapter.getBalances as jest.Mock).mockRejectedValue(
        new Error('Balance error'),
      );

      const result = await service.getAggregatedBalances();

      expect(result).toEqual({});
    });
  });
});

describe('WebSocketManagerService', () => {
  let service: WebSocketManagerService;
  let mockExchange: any;

  beforeEach(async () => {
    mockExchange = {
      subscribeOrderBook: jest.fn(),
      subscribeTicker: jest.fn(),
      subscribeTrades: jest.fn(),
      subscribeOrders: jest.fn(),
      subscribeBalances: jest.fn(),
      unsubscribeOrderBook: jest.fn(),
      unsubscribeTicker: jest.fn(),
      unsubscribeTrades: jest.fn(),
      unsubscribeOrders: jest.fn(),
      unsubscribeBalances: jest.fn(),
      unsubscribeAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [WebSocketManagerService],
    }).compile();

    service = module.get<WebSocketManagerService>(WebSocketManagerService);
    service.registerExchange('test-exchange', mockExchange);
  });

  describe('Exchange Registration', () => {
    it('should register an exchange for WebSocket operations', () => {
      const anotherExchange = { ...mockExchange };
      service.registerExchange('another-exchange', anotherExchange);

      const connectionStatus = service.getConnectionStatus();
      expect(connectionStatus['another-exchange']).toBe(false);
    });
  });

  describe('Order Book Subscription', () => {
    it('should subscribe to order book updates', async () => {
      const mockCallback = jest.fn();
      const mockOrderBook: ExchangeOrderBook = {
        symbol: 'BTCUSDT',
        exchange: 'test-exchange',
        timestamp: new Date(),
        bids: [[45000, 1.0]],
        asks: [[45001, 1.0]],
      };

      mockExchange.subscribeOrderBook.mockImplementation(
        (symbol: string, callback: Function) => {
          callback(mockOrderBook);
          return Promise.resolve();
        },
      );

      const subscriptionId = await service.subscribeOrderBook(
        'test-exchange',
        'BTCUSDT',
        mockCallback,
      );

      expect(subscriptionId).toBeDefined();
      expect(mockCallback).toHaveBeenCalledWith(mockOrderBook);
      expect(mockExchange.subscribeOrderBook).toHaveBeenCalledWith(
        'BTCUSDT',
        expect.any(Function),
      );
    });

    it('should handle subscription errors', async () => {
      mockExchange.subscribeOrderBook.mockRejectedValue(
        new Error('Subscription failed'),
      );

      await expect(
        service.subscribeOrderBook('test-exchange', 'BTCUSDT', jest.fn()),
      ).rejects.toThrow('Subscription failed');
    });

    it('should throw error for non-existent exchange', async () => {
      await expect(
        service.subscribeOrderBook('non-existent', 'BTCUSDT', jest.fn()),
      ).rejects.toThrow('Exchange non-existent not found');
    });
  });

  describe('Ticker Subscription', () => {
    it('should subscribe to ticker updates', async () => {
      const mockCallback = jest.fn();
      const mockTicker: ExchangeTicker = {
        symbol: 'BTCUSDT',
        exchange: 'test-exchange',
        timestamp: new Date(),
        open: 45000,
        high: 46000,
        low: 44000,
        close: 45500,
        volume: 1000,
        change: 500,
        changePercent: 1.11,
      };

      mockExchange.subscribeTicker.mockImplementation(
        (symbol: string, callback: Function) => {
          callback(mockTicker);
          return Promise.resolve();
        },
      );

      const subscriptionId = await service.subscribeTicker(
        'test-exchange',
        'BTCUSDT',
        mockCallback,
      );

      expect(subscriptionId).toBeDefined();
      expect(mockCallback).toHaveBeenCalledWith(mockTicker);
    });
  });

  describe('Unsubscription', () => {
    it('should unsubscribe from order book', async () => {
      const subscriptionId = await service.subscribeOrderBook(
        'test-exchange',
        'BTCUSDT',
        jest.fn(),
      );
      const result = await service.unsubscribe(subscriptionId);

      expect(result).toBe(true);
      expect(mockExchange.unsubscribeOrderBook).toHaveBeenCalledWith('BTCUSDT');
    });

    it('should return false for non-existent subscription', async () => {
      const result = await service.unsubscribe('non-existent-id');
      expect(result).toBe(false);
    });

    it('should unsubscribe all from exchange', async () => {
      await service.subscribeOrderBook('test-exchange', 'BTCUSDT', jest.fn());
      await service.subscribeTicker('test-exchange', 'ETHUSDT', jest.fn());

      await service.unsubscribeExchange('test-exchange');

      expect(mockExchange.unsubscribeAll).toHaveBeenCalled();
      expect(service.getActiveSubscriptions()).toHaveLength(0);
    });
  });

  describe('Market Data Cache', () => {
    it('should store and retrieve market data snapshots', async () => {
      const mockOrderBook: ExchangeOrderBook = {
        symbol: 'BTCUSDT',
        exchange: 'test-exchange',
        timestamp: new Date(),
        bids: [[45000, 1.0]],
        asks: [[45001, 1.0]],
      };

      mockExchange.subscribeOrderBook.mockImplementation(
        (symbol: string, callback: Function) => {
          callback(mockOrderBook);
          return Promise.resolve();
        },
      );

      await service.subscribeOrderBook('test-exchange', 'BTCUSDT', jest.fn());

      const snapshot = service.getMarketDataSnapshot(
        'test-exchange',
        'BTCUSDT',
      );
      expect(snapshot?.orderBook).toEqual(mockOrderBook);
    });

    it('should return undefined for non-existent snapshot', () => {
      const snapshot = service.getMarketDataSnapshot('non-existent', 'BTCUSDT');
      expect(snapshot).toBeUndefined();
    });
  });

  describe('Health Check', () => {
    it('should perform health check on subscriptions', async () => {
      await service.subscribeOrderBook('test-exchange', 'BTCUSDT', jest.fn());
      await service.subscribeTicker('test-exchange', 'ETHUSDT', jest.fn());

      const healthCheck = await service.healthCheck();

      expect(healthCheck.totalSubscriptions).toBe(2);
      expect(healthCheck.activeSubscriptions).toBe(2);
      expect(healthCheck.staleSubscriptions).toBe(0);
      expect(healthCheck.connectionStatus['test-exchange']).toBe(true);
    });
  });
});
