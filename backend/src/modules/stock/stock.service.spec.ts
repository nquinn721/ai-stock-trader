import { Test, TestingModule } from '@nestjs/testing';
import yahooFinance from 'yahoo-finance2';
import { SignalType } from '../../entities/trading-signal.entity';
import { BreakoutService } from '../breakout/breakout.service';
import { MLAnalysisService } from '../ml-analysis/ml-analysis.service';
import { NewsService } from '../news/news.service';
import { TradingService } from '../trading/trading.service';
import { StockWebSocketGateway } from '../websocket/websocket.gateway';
import { StockService } from './stock.service';

// Mock yahoo-finance2
jest.mock('yahoo-finance2');
const mockYahooFinance = yahooFinance as jest.Mocked<typeof yahooFinance>;

describe('StockService', () => {
  let service: StockService;
  let mockWebSocketGateway: jest.Mocked<StockWebSocketGateway>;
  let mockNewsService: jest.Mocked<NewsService>;
  let mockTradingService: jest.Mocked<TradingService>;
  let mockBreakoutService: jest.Mocked<BreakoutService>;
  let mockMLAnalysisService: jest.Mocked<MLAnalysisService>;

  beforeEach(async () => {
    // Create mock services
    mockWebSocketGateway = {
      broadcastStockUpdate: jest.fn(),
      broadcastTradingSignal: jest.fn(),
      getConnectedClientsCount: jest.fn().mockReturnValue(1),
    } as any;

    mockNewsService = {
      getNewsSentiment: jest.fn(),
      getPortfolioSentiment: jest.fn().mockResolvedValue({}),
    } as any;
    mockTradingService = {
      getSignalsForStock: jest.fn(),
      analyzeAllStocks: jest.fn(),
    } as any;

    mockBreakoutService = {
      detectBreakouts: jest.fn(),
      getHistoricalData: jest.fn(),
    } as any;

    mockMLAnalysisService = {
      analyzeStock: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        { provide: StockWebSocketGateway, useValue: mockWebSocketGateway },
        { provide: NewsService, useValue: mockNewsService },
        { provide: TradingService, useValue: mockTradingService },
        { provide: BreakoutService, useValue: mockBreakoutService },
        { provide: MLAnalysisService, useValue: mockMLAnalysisService },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllStocks', () => {
    it('should return all tracked stocks after price update', async () => {
      // Mock Yahoo Finance API response
      mockYahooFinance.quote.mockResolvedValue({
        regularMarketPrice: 150.25,
        regularMarketPreviousClose: 148.5,
        regularMarketVolume: 1000000,
        regularMarketChangePercent: 1.18,
        fiftyTwoWeekHigh: 180.0,
        fiftyTwoWeekLow: 120.0,
      } as any);

      // First update prices so stocks have currentPrice > 0
      await service.updateAllStockPrices();

      const stocks = await service.getAllStocks();
      expect(stocks).toBeDefined();
      expect(Array.isArray(stocks)).toBe(true);
      expect(stocks.length).toBeGreaterThan(0);

      // Check if popular stocks are included
      const symbols = stocks.map((stock) => stock.symbol);
      expect(symbols).toContain('AAPL');
      expect(symbols).toContain('GOOGL');
      expect(symbols).toContain('MSFT');
    }, 15000);
  });

  describe('getStockBySymbol', () => {
    it('should return stock by symbol', async () => {
      const stock = await service.getStockBySymbol('AAPL');
      expect(stock).toBeDefined();
      expect(stock?.symbol).toBe('AAPL');
      expect(stock?.name).toBe('Apple Inc.');
    });

    it('should return null for non-existent symbol', async () => {
      const stock = await service.getStockBySymbol('NONEXISTENT');
      expect(stock).toBeNull();
    });
  });
  describe('updateAllStockPrices', () => {
    beforeEach(() => {
      // Mock Yahoo Finance API response
      mockYahooFinance.quote.mockResolvedValue({
        regularMarketPrice: 150.25,
        regularMarketPreviousClose: 148.5,
        regularMarketVolume: 1000000,
        regularMarketChangePercent: 1.18,
        fiftyTwoWeekHigh: 180.0,
        fiftyTwoWeekLow: 120.0,
      } as any);
    });

    it('should update stock prices with live data', async () => {
      await service.updateAllStockPrices();

      const stocks = await service.getAllStocks();
      const appleStock = stocks.find((s) => s.symbol === 'AAPL');

      expect(appleStock).toBeDefined();
      expect(appleStock?.currentPrice).toBe(150.25);
      expect(appleStock?.previousClose).toBe(148.5);
      expect(appleStock?.volume).toBe(1000000);
      expect(appleStock?.changePercent).toBe(1.18);
    }, 15000);

    it('should handle API errors gracefully', async () => {
      mockYahooFinance.quote.mockRejectedValue(new Error('API Error'));

      await expect(service.updateAllStockPrices()).resolves.not.toThrow();
    }, 15000);

    it('should broadcast updates via WebSocket', async () => {
      await service.updateAllStockPrices();

      expect(mockWebSocketGateway.broadcastStockUpdate).toHaveBeenCalled();
    }, 15000);
  });
  describe('getAllStocksWithSignals', () => {
    beforeEach(async () => {
      // First ensure stocks have prices by running updateAllStockPrices
      mockYahooFinance.quote.mockResolvedValue({
        regularMarketPrice: 150.25,
        regularMarketPreviousClose: 148.5,
        regularMarketVolume: 1000000,
        regularMarketChangePercent: 1.18,
        fiftyTwoWeekHigh: 180.0,
        fiftyTwoWeekLow: 120.0,
      } as any);

      await service.updateAllStockPrices();

      mockTradingService.getSignalsForStock.mockResolvedValue([
        {
          id: 1,
          stockId: 1,
          signal: SignalType.BUY,
          confidence: 0.75,
          price: 150.25,
          timestamp: new Date(),
          reason: 'Technical analysis indicates upward trend',
        },
      ]);
    });

    it('should return stocks with trading signals', async () => {
      const result = await service.getAllStocksWithSignals();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      const stockWithSignal = result.find((s) => s.symbol === 'AAPL');
      expect(stockWithSignal).toBeDefined();
      expect(stockWithSignal?.tradingSignal).toBeDefined();
    });

    it('should handle stocks without signals', async () => {
      mockTradingService.getSignalsForStock.mockResolvedValue([]);

      const result = await service.getAllStocksWithSignals();

      expect(result).toBeDefined();
      result.forEach((stock) => {
        expect(stock.tradingSignal).toBeNull();
      });
    });
  });
  describe('getStockHistory', () => {
    beforeEach(() => {
      mockYahooFinance.historical.mockResolvedValue([
        {
          date: new Date('2024-01-01'),
          open: 145.0,
          high: 148.0,
          low: 144.0,
          close: 147.5,
          volume: 950000,
        },
        {
          date: new Date('2024-01-02'),
          open: 147.5,
          high: 150.0,
          low: 146.0,
          close: 149.25,
          volume: 1100000,
        },
      ] as any);
    });

    it('should return historical data for a stock', async () => {
      const data = await service.getStockHistory('AAPL', '1mo');

      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0]).toEqual({
        date: new Date('2024-01-01'),
        open: 145.0,
        high: 148.0,
        low: 144.0,
        close: 147.5,
        volume: 950000,
      });
    });

    it('should handle API errors', async () => {
      mockYahooFinance.historical.mockRejectedValue(new Error('API Error'));

      const data = await service.getStockHistory('AAPL', '1mo');
      expect(Array.isArray(data)).toBe(true);
    });
  });
});
