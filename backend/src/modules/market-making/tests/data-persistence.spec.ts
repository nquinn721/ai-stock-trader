import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ExchangeCandle,
  ExchangeOrderBook,
  ExchangeTicker,
} from '../interfaces/exchange-connector.interface';
import {
  DataPersistenceService,
  HistoricalCandle,
  MarketDataSnapshot,
  PerformanceMetrics,
  TradingSession,
} from '../services/data-persistence.service';

describe('DataPersistenceService', () => {
  let service: DataPersistenceService;
  let marketDataRepository: Repository<MarketDataSnapshot>;
  let tradingSessionRepository: Repository<TradingSession>;
  let performanceRepository: Repository<PerformanceMetrics>;
  let candleRepository: Repository<HistoricalCandle>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataPersistenceService,
        {
          provide: getRepositoryToken(MarketDataSnapshot),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
            delete: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(TradingSession),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(PerformanceMetrics),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(HistoricalCandle),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => ({
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              limit: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            })),
            delete: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DataPersistenceService>(DataPersistenceService);
    marketDataRepository = module.get<Repository<MarketDataSnapshot>>(
      getRepositoryToken(MarketDataSnapshot),
    );
    tradingSessionRepository = module.get<Repository<TradingSession>>(
      getRepositoryToken(TradingSession),
    );
    performanceRepository = module.get<Repository<PerformanceMetrics>>(
      getRepositoryToken(PerformanceMetrics),
    );
    candleRepository = module.get<Repository<HistoricalCandle>>(
      getRepositoryToken(HistoricalCandle),
    );
  });

  describe('Market Data Storage', () => {
    it('should store market data snapshot', async () => {
      const mockTicker: ExchangeTicker = {
        symbol: 'BTCUSDT',
        exchange: 'binance',
        timestamp: new Date(),
        open: 45000,
        high: 46000,
        low: 44000,
        close: 45500,
        volume: 1000,
        change: 500,
        changePercent: 1.11,
      };

      const mockOrderBook: ExchangeOrderBook = {
        symbol: 'BTCUSDT',
        exchange: 'binance',
        timestamp: new Date(),
        bids: [[45000, 1.0]],
        asks: [[45001, 1.0]],
      };

      const mockSnapshot = {
        exchange: 'binance',
        symbol: 'BTCUSDT',
        ticker: mockTicker,
        orderBook: mockOrderBook,
        timestamp: expect.any(Date),
      };

      (marketDataRepository.create as jest.Mock).mockReturnValue(mockSnapshot);
      (marketDataRepository.save as jest.Mock).mockResolvedValue(mockSnapshot);

      await service.storeMarketDataSnapshot('binance', 'BTCUSDT', {
        ticker: mockTicker,
        orderBook: mockOrderBook,
      });

      expect(marketDataRepository.create).toHaveBeenCalledWith({
        exchange: 'binance',
        symbol: 'BTCUSDT',
        ticker: mockTicker,
        orderBook: mockOrderBook,
        trades: undefined,
        timestamp: expect.any(Date),
      });
      expect(marketDataRepository.save).toHaveBeenCalledWith(mockSnapshot);
    });

    it('should handle storage errors gracefully', async () => {
      (marketDataRepository.create as jest.Mock).mockReturnValue({});
      (marketDataRepository.save as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      // Should not throw error
      await expect(
        service.storeMarketDataSnapshot('binance', 'BTCUSDT', {}),
      ).resolves.toBeUndefined();
    });
  });

  describe('Historical Candles', () => {
    it('should store candles', async () => {
      const mockCandles: ExchangeCandle[] = [
        {
          symbol: 'BTCUSDT',
          exchange: 'binance',
          interval: '1m',
          timestamp: new Date(),
          open: 45000,
          high: 45100,
          low: 44900,
          close: 45050,
          volume: 100,
          quoteVolume: 4505000,
          trades: 50,
        },
      ];

      const mockCandleEntities = mockCandles.map((candle) => ({
        exchange: candle.exchange,
        symbol: candle.symbol,
        interval: candle.interval,
        timestamp: candle.timestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
        quoteVolume: candle.quoteVolume,
        trades: candle.trades,
      }));

      (candleRepository.create as jest.Mock).mockImplementation((data) => data);
      (candleRepository.save as jest.Mock).mockResolvedValue(
        mockCandleEntities,
      );

      await service.storeCandles(mockCandles);

      expect(candleRepository.create).toHaveBeenCalledTimes(1);
      expect(candleRepository.save).toHaveBeenCalledWith(mockCandleEntities);
    });

    it('should get historical candles with filters', async () => {
      const mockCandles = [
        {
          id: '1',
          exchange: 'binance',
          symbol: 'BTCUSDT',
          interval: '1m',
          timestamp: new Date(),
          open: 45000,
          high: 45100,
          low: 44900,
          close: 45050,
          volume: 100,
          quoteVolume: 4505000,
          trades: 50,
          createdAt: new Date(),
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockCandles),
      };

      (candleRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getCandles(
        'binance',
        'BTCUSDT',
        '1m',
        new Date('2023-01-01'),
        new Date('2023-01-02'),
        100,
      );

      expect(result).toEqual(mockCandles);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'candle.exchange = :exchange',
        { exchange: 'binance' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'candle.symbol = :symbol',
        { symbol: 'BTCUSDT' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'candle.interval = :interval',
        { interval: '1m' },
      );
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(100);
    });
  });

  describe('Trading Sessions', () => {
    it('should start a new trading session', async () => {
      const mockSession = {
        id: 'session-123',
        exchange: 'binance',
        symbol: 'BTCUSDT',
        strategyId: 'strategy-1',
        startTime: expect.any(Date),
        totalVolume: 0,
        realizedPnl: 0,
        unrealizedPnl: 0,
        totalTrades: 0,
        profitableTrades: 0,
      };

      (tradingSessionRepository.create as jest.Mock).mockReturnValue(
        mockSession,
      );
      (tradingSessionRepository.save as jest.Mock).mockResolvedValue({
        ...mockSession,
        id: 'session-123',
      });

      const sessionId = await service.startTradingSession(
        'binance',
        'BTCUSDT',
        'strategy-1',
      );

      expect(sessionId).toBe('session-123');
      expect(tradingSessionRepository.create).toHaveBeenCalledWith({
        exchange: 'binance',
        symbol: 'BTCUSDT',
        strategyId: 'strategy-1',
        startTime: expect.any(Date),
        totalVolume: 0,
        realizedPnl: 0,
        unrealizedPnl: 0,
        totalTrades: 0,
        profitableTrades: 0,
      });
    });

    it('should update trading session metrics', async () => {
      const updates = {
        totalVolume: 1000,
        realizedPnl: 150.5,
        totalTrades: 5,
      };

      (tradingSessionRepository.update as jest.Mock).mockResolvedValue({
        affected: 1,
      });

      await service.updateTradingSession('session-123', updates);

      expect(tradingSessionRepository.update).toHaveBeenCalledWith(
        'session-123',
        updates,
      );
    });

    it('should end a trading session', async () => {
      (tradingSessionRepository.update as jest.Mock).mockResolvedValue({
        affected: 1,
      });

      await service.endTradingSession('session-123');

      expect(tradingSessionRepository.update).toHaveBeenCalledWith(
        'session-123',
        {
          endTime: expect.any(Date),
        },
      );
    });

    it('should get trading sessions with filters', async () => {
      const mockSessions = [
        {
          id: 'session-1',
          exchange: 'binance',
          symbol: 'BTCUSDT',
          strategyId: 'strategy-1',
          startTime: new Date(),
          endTime: null,
          totalVolume: 1000,
          realizedPnl: 50,
          unrealizedPnl: 25,
          totalTrades: 3,
          profitableTrades: 2,
          metrics: {},
          createdAt: new Date(),
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockSessions),
      };

      (
        tradingSessionRepository.createQueryBuilder as jest.Mock
      ).mockReturnValue(mockQueryBuilder);

      const result = await service.getTradingSessions('strategy-1', 'binance');

      expect(result).toEqual(mockSessions);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'session.strategyId = :strategyId',
        { strategyId: 'strategy-1' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'session.exchange = :exchange',
        { exchange: 'binance' },
      );
    });
  });

  describe('Performance Metrics', () => {
    it('should store new performance metrics', async () => {
      const metrics = {
        dailyPnl: 150.75,
        cumulativePnl: 2500.5,
        sharpeRatio: 1.8,
        maxDrawdown: 0.12,
        winRate: 0.65,
        volume: 10000,
        tradeCount: 25,
      };

      (performanceRepository.findOne as jest.Mock).mockResolvedValue(null);
      (performanceRepository.create as jest.Mock).mockReturnValue({
        strategyId: 'strategy-1',
        exchange: 'binance',
        symbol: 'BTCUSDT',
        date: expect.any(Date),
        ...metrics,
      });
      (performanceRepository.save as jest.Mock).mockResolvedValue({});

      await service.storePerformanceMetrics(
        'strategy-1',
        'binance',
        'BTCUSDT',
        metrics,
      );

      expect(performanceRepository.findOne).toHaveBeenCalled();
      expect(performanceRepository.create).toHaveBeenCalledWith({
        strategyId: 'strategy-1',
        exchange: 'binance',
        symbol: 'BTCUSDT',
        date: expect.any(Date),
        ...metrics,
      });
    });

    it('should update existing performance metrics', async () => {
      const existingMetrics = {
        id: 'metrics-1',
        strategyId: 'strategy-1',
        exchange: 'binance',
        symbol: 'BTCUSDT',
        date: new Date(),
      };

      const updates = {
        dailyPnl: 200.25,
        cumulativePnl: 2700.75,
        sharpeRatio: 1.9,
        maxDrawdown: 0.15,
        winRate: 0.7,
        volume: 12000,
        tradeCount: 30,
      };

      (performanceRepository.findOne as jest.Mock).mockResolvedValue(
        existingMetrics,
      );
      (performanceRepository.update as jest.Mock).mockResolvedValue({
        affected: 1,
      });

      await service.storePerformanceMetrics(
        'strategy-1',
        'binance',
        'BTCUSDT',
        updates,
      );

      expect(performanceRepository.update).toHaveBeenCalledWith(
        'metrics-1',
        updates,
      );
    });

    it('should get performance metrics with date range', async () => {
      const mockMetrics = [
        {
          id: 'metrics-1',
          strategyId: 'strategy-1',
          exchange: 'binance',
          symbol: 'BTCUSDT',
          date: new Date(),
          dailyPnl: 150.75,
          cumulativePnl: 2500.5,
          sharpeRatio: 1.8,
          maxDrawdown: 0.12,
          winRate: 0.65,
          volume: 10000,
          tradeCount: 25,
          detailedMetrics: {},
          createdAt: new Date(),
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockMetrics),
      };

      (performanceRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getPerformanceMetrics(
        'strategy-1',
        new Date('2023-01-01'),
        new Date('2023-01-31'),
      );

      expect(result).toEqual(mockMetrics);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'metrics.strategyId = :strategyId',
        { strategyId: 'strategy-1' },
      );
    });
  });

  describe('Data Cleanup', () => {
    it('should cleanup old data', async () => {
      (marketDataRepository.delete as jest.Mock).mockResolvedValue({
        affected: 100,
      });
      (candleRepository.delete as jest.Mock).mockResolvedValue({
        affected: 50,
      });

      await service.cleanupOldData(30);

      expect(marketDataRepository.delete).toHaveBeenCalledWith({
        timestamp: expect.any(Object), // LessThan date
      });
      expect(candleRepository.delete).toHaveBeenCalledWith({
        timestamp: expect.any(Object), // LessThan date
      });
    });

    it('should handle cleanup errors gracefully', async () => {
      (marketDataRepository.delete as jest.Mock).mockRejectedValue(
        new Error('Delete error'),
      );

      // Should not throw error
      await expect(service.cleanupOldData(30)).resolves.toBeUndefined();
    });
  });

  describe('Database Statistics', () => {
    it('should get database statistics', async () => {
      (marketDataRepository.count as jest.Mock).mockResolvedValue(1000);
      (tradingSessionRepository.count as jest.Mock).mockResolvedValue(50);
      (performanceRepository.count as jest.Mock).mockResolvedValue(200);
      (candleRepository.count as jest.Mock).mockResolvedValue(5000);

      const stats = await service.getDatabaseStats();

      expect(stats).toEqual({
        marketDataSnapshots: 1000,
        tradingSessions: 50,
        performanceMetrics: 200,
        historicalCandles: 5000,
      });
    });

    it('should handle statistics errors gracefully', async () => {
      (marketDataRepository.count as jest.Mock).mockRejectedValue(
        new Error('Count error'),
      );

      const stats = await service.getDatabaseStats();

      expect(stats).toEqual({
        marketDataSnapshots: 0,
        tradingSessions: 0,
        performanceMetrics: 0,
        historicalCandles: 0,
      });
    });
  });

  describe('Market Data Snapshots Retrieval', () => {
    it('should get market data snapshots with filters', async () => {
      const mockSnapshots = [
        {
          id: 'snapshot-1',
          exchange: 'binance',
          symbol: 'BTCUSDT',
          ticker: { symbol: 'BTCUSDT', exchange: 'binance' },
          orderBook: { symbol: 'BTCUSDT', exchange: 'binance' },
          trades: [],
          timestamp: new Date(),
        },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockSnapshots),
      };

      (marketDataRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getMarketDataSnapshots(
        'binance',
        'BTCUSDT',
        new Date('2023-01-01'),
        new Date('2023-01-02'),
        100,
      );

      expect(result).toEqual(mockSnapshots);
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'snapshot.exchange = :exchange',
        { exchange: 'binance' },
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'snapshot.symbol = :symbol',
        { symbol: 'BTCUSDT' },
      );
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(100);
    });

    it('should handle retrieval errors gracefully', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockRejectedValue(new Error('Query error')),
      };

      (marketDataRepository.createQueryBuilder as jest.Mock).mockReturnValue(
        mockQueryBuilder,
      );

      const result = await service.getMarketDataSnapshots('binance', 'BTCUSDT');

      expect(result).toEqual([]);
    });
  });
});
