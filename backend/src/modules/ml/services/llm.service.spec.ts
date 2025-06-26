import { Test, TestingModule } from '@nestjs/testing';
import { ExplanationContext } from '../interfaces/ai.interfaces';
import { LLMService } from './llm.service';

describe('LLMService', () => {
  let service: LLMService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LLMService],
    }).compile();

    service = module.get<LLMService>(LLMService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateExplanation', () => {
    it('should generate fallback explanation when no API key is configured', async () => {
      const context: ExplanationContext = {
        signal: 'BUY',
        confidence: 0.85,
        indicators: { rsi: 35, macd: 0.5 },
        marketConditions: {
          marketTrend: 'BULLISH',
          volatility: 15,
          volume: 1000000,
          sector: 'Technology',
          marketCap: 'Large Cap',
        },
        riskFactors: ['Market volatility'],
        priceTarget: 150,
        stopLoss: 120,
      };

      const explanation = await service.generateExplanation(context);

      expect(explanation).toBeTruthy();
      expect(explanation).toContain('BUY');
      expect(explanation).toContain('High Confidence');
      expect(explanation).toContain('Target Price: $150');
      expect(explanation).toContain('Stop Loss: $120');
    });

    it('should include confidence level in fallback explanation', async () => {
      const lowConfidenceContext: ExplanationContext = {
        signal: 'SELL',
        confidence: 0.4,
        indicators: { rsi: 75 },
        marketConditions: {
          marketTrend: 'BEARISH',
          volatility: 25,
          volume: 500000,
          sector: 'Energy',
          marketCap: 'Mid Cap',
        },
        riskFactors: ['High volatility', 'Sector decline'],
      };

      const explanation =
        await service.generateExplanation(lowConfidenceContext);

      expect(explanation).toContain('SELL');
      expect(explanation).toContain('Low Confidence');
      expect(explanation).toContain('bearish market conditions');
    });

    it('should handle medium confidence HOLD signals', async () => {
      const holdContext: ExplanationContext = {
        signal: 'HOLD',
        confidence: 0.65,
        indicators: { rsi: 50, macd: 0 },
        marketConditions: {
          marketTrend: 'SIDEWAYS',
          volatility: 10,
          volume: 750000,
          sector: 'Healthcare',
          marketCap: 'Large Cap',
        },
        riskFactors: ['Uncertain market direction'],
      };

      const explanation = await service.generateExplanation(holdContext);

      expect(explanation).toContain('HOLD');
      expect(explanation).toContain('Medium Confidence');
      expect(explanation).toContain('sideways market conditions');
    });
  });

  describe('processQuery', () => {
    it('should return fallback response when no API key is configured', async () => {
      const userContext = {
        userId: 'test-user',
        riskProfile: 'moderate' as const,
      };

      const response = await service.processQuery(
        'What stocks should I buy?',
        userContext,
      );

      expect(response.response).toBeTruthy();
      expect(response.confidence).toBeLessThan(0.5);
      expect(response.context?.fallback).toBe(true);
      expect(response.response).toContain('limited');
    });

    it('should include user context in fallback response', async () => {
      const userContext = {
        userId: 'test-user',
        riskProfile: 'conservative' as const,
        portfolio: {
          holdings: [
            {
              symbol: 'AAPL',
              quantity: 10,
              currentPrice: 150,
              purchasePrice: 140,
              value: 1500,
              gainLoss: 100,
              gainLossPercent: 7.14,
            },
          ],
          totalValue: 1500,
          performance: { daily: 0.5, weekly: 2.1, monthly: 7.14 },
        },
      };

      const response = await service.processQuery(
        'How is my portfolio doing?',
        userContext,
      );

      expect(response.response).toContain('portfolio');
      expect(response.context?.question).toBe('How is my portfolio doing?');
    });
  });

  describe('API configuration', () => {
    it('should handle missing API key gracefully', () => {
      // The service should initialize without throwing even without API keys
      expect(service).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should return fallback explanation on LLM service errors', async () => {
      // Mock a service with API key but simulate API failure
      const serviceWithKey = new LLMService();
      // Override the config to simulate having an API key
      (serviceWithKey as any).config.apiKey = 'test-key';

      // Mock fetch to simulate API failure
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const context: ExplanationContext = {
        signal: 'BUY',
        confidence: 0.8,
        indicators: {},
        marketConditions: {
          marketTrend: 'BULLISH',
          volatility: 15,
          volume: 1000000,
          sector: 'Technology',
          marketCap: 'Large Cap',
        },
        riskFactors: [],
      };

      const explanation = await serviceWithKey.generateExplanation(context);

      expect(explanation).toBeTruthy();
      expect(explanation).toContain('BUY');
      expect(explanation).toContain(
        'AI explanation service is currently limited',
      );
    });
  });
});
