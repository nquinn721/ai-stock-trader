// Updated Backend Controller Tests
import { Test, TestingModule } from '@nestjs/testing';
import { Stock } from '../../entities/stock.entity';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';

describe('StockController', () => {
  let controller: StockController;
  let mockStockService: jest.Mocked<StockService>;

  beforeEach(async () => {
    mockStockService = {
      getAllStocks: jest.fn(),
      getStockBySymbol: jest.fn(),
      getAllStocksWithSignals: jest.fn(),
      getStockHistory: jest.fn(),
      updateStockPrice: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockController],
      providers: [{ provide: StockService, useValue: mockStockService }],
    }).compile();

    controller = module.get<StockController>(StockController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllStocks', () => {
    it('should return array of stocks', async () => {
      const mockStocks: Stock[] = [
        {
          id: 1,
          symbol: 'AAPL',
          name: 'Apple Inc.',
          sector: 'Technology',
          description: 'Technology company',
          currentPrice: 150.25,
          previousClose: 148.5,
          changePercent: 1.18,
          volume: 1000000,
          marketCap: 2500000000000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockStockService.getAllStocks.mockResolvedValue(mockStocks);

      const result = await controller.getAllStocks();
      expect(result).toBe(mockStocks);
      expect(mockStockService.getAllStocks).toHaveBeenCalled();
    });
  });

  describe('getStockBySymbol', () => {
    it('should return specific stock', async () => {
      const mockStock: Stock = {
        id: 1,
        symbol: 'AAPL',
        name: 'Apple Inc.',
        sector: 'Technology',
        description: 'Technology company',
        currentPrice: 150.25,
        previousClose: 148.5,
        changePercent: 1.18,
        volume: 1000000,
        marketCap: 2500000000000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStockService.getStockBySymbol.mockResolvedValue(mockStock);

      const result = await controller.getStockBySymbol('AAPL');
      expect(result).toBe(mockStock);
      expect(mockStockService.getStockBySymbol).toHaveBeenCalledWith('AAPL');
    });

    it('should return null for non-existent stock', async () => {
      mockStockService.getStockBySymbol.mockResolvedValue(null);

      const result = await controller.getStockBySymbol('NONEXISTENT');
      expect(result).toBeNull();
    });
  });
  describe('getAllStocksWithSignals', () => {
    it('should return stocks with trading signals', async () => {
      const mockStocksWithSignals = [
        {
          id: 1,
          symbol: 'AAPL',
          name: 'Apple Inc.',
          sector: 'Technology',
          description: 'Technology company',
          currentPrice: 150.25,
          previousClose: 148.5,
          changePercent: 1.18,
          volume: 1000000,
          marketCap: 2500000000000,
          createdAt: new Date(),
          updatedAt: new Date(),
          tradingSignal: null,
        },
      ];

      mockStockService.getAllStocksWithSignals.mockResolvedValue(
        mockStocksWithSignals,
      );

      const result = await controller.getAllStocksWithSignals();
      expect(result).toBe(mockStocksWithSignals);
      expect(mockStockService.getAllStocksWithSignals).toHaveBeenCalled();
    });
  });

  describe('getStockHistory', () => {
    it('should return historical data for stock', async () => {
      const mockHistoricalData = [
        {
          date: '2024-01-01',
          open: 145.0,
          high: 148.0,
          low: 144.0,
          close: 147.5,
          volume: 950000,
        },
      ];

      mockStockService.getStockHistory.mockResolvedValue(mockHistoricalData);

      const result = await controller.getStockHistory('AAPL', '1mo');
      expect(result).toBe(mockHistoricalData);
      expect(mockStockService.getStockHistory).toHaveBeenCalledWith(
        'AAPL',
        '1mo',
      );
    });
  });

  describe('updateStockPrice', () => {
    it('should update and return stock price', async () => {
      const mockStock: Stock = {
        id: 1,
        symbol: 'AAPL',
        name: 'Apple Inc.',
        sector: 'Technology',
        description: 'Technology company',
        currentPrice: 152.3,
        previousClose: 150.25,
        changePercent: 1.36,
        volume: 1100000,
        marketCap: 2520000000000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStockService.updateStockPrice.mockResolvedValue(mockStock);

      const result = await controller.updateStockPrice('AAPL');
      expect(result).toBe(mockStock);
      expect(mockStockService.updateStockPrice).toHaveBeenCalledWith('AAPL');
    });
  });
});
