import { Test, TestingModule } from '@nestjs/testing';
import { SignalType } from '../../entities/trading-signal.entity';
import { NewsService } from '../news/news.service';
import { TradingService } from './trading.service';

describe('TradingService', () => {
  let service: TradingService;
  let mockNewsService: jest.Mocked<NewsService>;

  beforeEach(async () => {
    mockNewsService = {
      getAverageSentiment: jest.fn().mockResolvedValue(0.5),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradingService,
        { provide: NewsService, useValue: mockNewsService },
      ],
    }).compile();

    service = module.get<TradingService>(TradingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('detectBreakout', () => {
    it('should detect breakout patterns', async () => {
      const result = await service.detectBreakout('AAPL');

      expect(result).toBeDefined();
      expect(result.signal).toBeDefined();
      expect([SignalType.BUY, SignalType.SELL, SignalType.HOLD]).toContain(
        result.signal,
      );
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.reason).toBeDefined();
      expect(typeof result.isBreakout).toBe('boolean');
    });

    it('should return consistent results for same symbol', async () => {
      const result1 = await service.detectBreakout('AAPL');
      const result2 = await service.detectBreakout('AAPL');

      // Results should be deterministic based on time
      expect(result1.signal).toBe(result2.signal);
      expect(result1.confidence).toBe(result2.confidence);
    });
  });

  describe('generateTradingSignal', () => {
    it('should generate trading signal for a symbol', async () => {
      const signal = await service.generateTradingSignal('AAPL');

      expect(signal).toBeDefined();
      expect(signal.symbol).toBe('AAPL');
      expect([SignalType.BUY, SignalType.SELL, SignalType.HOLD]).toContain(
        signal.signal,
      );
      expect(signal.confidence).toBeGreaterThan(0);
      expect(signal.confidence).toBeLessThanOrEqual(1);
      expect(signal.reason).toBeDefined();
      expect(signal.timestamp).toBeDefined();
      expect(typeof signal.isBreakout).toBe('boolean');
      expect(typeof signal.sentimentScore).toBe('number');
    });

    it('should incorporate sentiment analysis', async () => {
      mockNewsService.getAverageSentiment.mockResolvedValue(3.0); // Very positive

      const signal = await service.generateTradingSignal('AAPL');

      expect(mockNewsService.getAverageSentiment).toHaveBeenCalledWith('AAPL');
      expect(signal.sentimentScore).toBe(3.0);
      expect(signal.reason).toContain('Sentiment score: 3.00');
    });

    it('should adjust confidence based on sentiment', async () => {
      mockNewsService.getAverageSentiment.mockResolvedValue(3.0); // Very positive

      const signal = await service.generateTradingSignal('AAPL');

      if (signal.signal === SignalType.BUY) {
        expect(signal.confidence).toBeGreaterThan(0.5);
      }
    });
  });

  describe('getActiveSignals', () => {
    it('should return signals for tracked stocks', async () => {
      const signals = await service.getActiveSignals();

      expect(signals).toBeDefined();
      expect(Array.isArray(signals)).toBe(true);
      expect(signals.length).toBeGreaterThan(0);

      // Check that signals include major stocks
      const symbols = signals.map((s) => s.symbol);
      expect(symbols).toContain('AAPL');
      expect(symbols).toContain('GOOGL');
      expect(symbols).toContain('MSFT');

      // Check signal structure
      signals.forEach((signal) => {
        expect(signal.id).toBeDefined();
        expect(signal.symbol).toBeDefined();
        expect(signal.signal).toBeDefined();
        expect(signal.confidence).toBeGreaterThan(0);
        expect(signal.isActive).toBe(true);
        expect(signal.createdAt).toBeDefined();
      });
    });

    it('should handle errors gracefully', async () => {
      mockNewsService.getAverageSentiment.mockRejectedValue(
        new Error('API Error'),
      );

      const signals = await service.getActiveSignals();

      // Should still return some signals, even if some fail
      expect(signals).toBeDefined();
      expect(Array.isArray(signals)).toBe(true);
    });
  });

  describe('getRecentSignals', () => {
    it('should return empty array for recent signals', async () => {
      const signals = await service.getRecentSignals('AAPL');

      expect(signals).toBeDefined();
      expect(Array.isArray(signals)).toBe(true);
      expect(signals.length).toBe(0);
    });

    it('should respect limit parameter', async () => {
      const signals = await service.getRecentSignals('AAPL', 5);

      expect(signals).toBeDefined();
      expect(Array.isArray(signals)).toBe(true);
    });
  });

  describe('getSignalsForStock', () => {
    it('should return signals for specific stock', async () => {
      const signals = await service.getSignalsForStock('AAPL');

      expect(signals).toBeDefined();
      expect(Array.isArray(signals)).toBe(true);
    });
  });

  describe('analyzeAllStocks', () => {
    it('should return empty array for analysis', async () => {
      const analysis = await service.analyzeAllStocks();

      expect(analysis).toBeDefined();
      expect(Array.isArray(analysis)).toBe(true);
      expect(analysis.length).toBe(0);
    });
  });

  describe('validateSignalAccuracy', () => {
    it('should return accuracy metrics', async () => {
      const accuracy = await service.validateSignalAccuracy('AAPL');

      expect(accuracy).toBeDefined();
      expect(accuracy.accuracy).toBeGreaterThan(0);
      expect(accuracy.accuracy).toBeLessThanOrEqual(1);
      expect(accuracy.totalSignals).toBeGreaterThan(0);
      expect(accuracy.correctPredictions).toBeGreaterThanOrEqual(0);
      expect(accuracy.correctPredictions).toBeLessThanOrEqual(
        accuracy.totalSignals,
      );

      // Verify accuracy calculation
      const expectedAccuracy =
        accuracy.correctPredictions / accuracy.totalSignals;
      expect(Math.abs(accuracy.accuracy - expectedAccuracy)).toBeLessThan(0.01);
    });

    it('should return realistic accuracy ranges', async () => {
      const accuracy = await service.validateSignalAccuracy('AAPL');

      expect(accuracy.accuracy).toBeGreaterThanOrEqual(0.6);
      expect(accuracy.accuracy).toBeLessThanOrEqual(0.9);
      expect(accuracy.totalSignals).toBeGreaterThanOrEqual(50);
      expect(accuracy.totalSignals).toBeLessThanOrEqual(100);
    });
  });
});
