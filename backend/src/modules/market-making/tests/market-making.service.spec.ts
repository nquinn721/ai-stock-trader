import { Test, TestingModule } from '@nestjs/testing';
import {
  MarketConditions,
  OrderBookDepth,
} from '../interfaces/market-making.interface';
import { MarketMakingServiceImpl } from '../services/market-making.service';

describe('MarketMakingServiceImpl', () => {
  let service: MarketMakingServiceImpl;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MarketMakingServiceImpl],
    }).compile();

    service = module.get<MarketMakingServiceImpl>(MarketMakingServiceImpl);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateOptimalSpread', () => {
    it('should calculate optimal spread based on market conditions', async () => {
      const orderBookDepth: OrderBookDepth = {
        bidLevels: [
          { price: 149.95, quantity: 100, orders: 5 },
          { price: 149.9, quantity: 200, orders: 8 },
        ],
        askLevels: [
          { price: 150.05, quantity: 100, orders: 5 },
          { price: 150.1, quantity: 200, orders: 8 },
        ],
        midPrice: 150.0,
        weightedMidPrice: 150.0,
      };

      const marketConditions: MarketConditions = {
        volatility: 0.25,
        volume: 1000000,
        spread: 0.1,
        liquidity: 0.8,
        trendDirection: 'SIDEWAYS',
        momentum: 0.1,
        marketDepth: orderBookDepth,
      };

      const result = await service.calculateOptimalSpread(
        'AAPL',
        marketConditions,
      );

      expect(result).toBeDefined();
      expect(result.bidPrice).toBeLessThan(
        marketConditions.marketDepth.midPrice,
      );
      expect(result.askPrice).toBeGreaterThan(
        marketConditions.marketDepth.midPrice,
      );
      expect(result.spread).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should adjust spread based on volatility', async () => {
      const orderBookDepth: OrderBookDepth = {
        bidLevels: [{ price: 149.95, quantity: 100, orders: 5 }],
        askLevels: [{ price: 150.05, quantity: 100, orders: 5 }],
        midPrice: 150.0,
        weightedMidPrice: 150.0,
      };

      const lowVolatilityConditions: MarketConditions = {
        volatility: 0.1,
        volume: 1000000,
        spread: 0.05,
        liquidity: 0.9,
        trendDirection: 'SIDEWAYS',
        momentum: 0.05,
        marketDepth: orderBookDepth,
      };

      const highVolatilityConditions: MarketConditions = {
        ...lowVolatilityConditions,
        volatility: 0.5,
        spread: 0.2,
      };

      const lowVolResult = await service.calculateOptimalSpread(
        'AAPL',
        lowVolatilityConditions,
      );
      const highVolResult = await service.calculateOptimalSpread(
        'AAPL',
        highVolatilityConditions,
      );

      expect(highVolResult.spread).toBeGreaterThan(lowVolResult.spread);
    });
  });

  describe('calculateFairValue', () => {
    it('should calculate fair value for a symbol', async () => {
      const symbol = 'AAPL';
      const historicalData = 'mock-historical-data';

      const fairValue = await service.calculateFairValue(
        symbol,
        historicalData,
      );

      expect(fairValue).toBeDefined();
      expect(typeof fairValue.fairValue).toBe('number');
      expect(fairValue.fairValue).toBeGreaterThan(0);
      expect(fairValue.confidence).toBeGreaterThan(0);
      expect(fairValue.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('optimizePriceQuotes', () => {
    it('should optimize price quotes based on order book', async () => {
      const orderBook: OrderBookDepth = {
        bidLevels: [
          { price: 149.95, quantity: 100, orders: 5 },
          { price: 149.9, quantity: 200, orders: 8 },
        ],
        askLevels: [
          { price: 150.05, quantity: 100, orders: 5 },
          { price: 150.1, quantity: 200, orders: 8 },
        ],
        midPrice: 150.0,
        weightedMidPrice: 150.0,
      };

      const result = await service.optimizePriceQuotes(orderBook);

      expect(result).toBeDefined();
      expect(result.bid).toBeDefined();
      expect(result.ask).toBeDefined();
      expect(result.bid.price).toBeLessThan(orderBook.midPrice);
      expect(result.ask.price).toBeGreaterThan(orderBook.midPrice);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });
});
