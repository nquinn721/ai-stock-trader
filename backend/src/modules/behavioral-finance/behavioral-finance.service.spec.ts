import { Test, TestingModule } from '@nestjs/testing';
import { BehavioralFinanceService } from './behavioral-finance.service';

describe('BehavioralFinanceService', () => {
  let service: BehavioralFinanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BehavioralFinanceService],
    }).compile();

    service = module.get<BehavioralFinanceService>(BehavioralFinanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('detectCognitiveBias', () => {
    it('should return cognitive bias analysis for valid market data', async () => {
      const mockMarketData = {
        symbol: 'AAPL',
        prices: [150, 155, 160, 158, 162],
        volume: [1000000, 1100000, 950000, 1200000, 1050000],
        timestamps: [
          '2025-06-27T09:00:00Z',
          '2025-06-27T10:00:00Z',
          '2025-06-27T11:00:00Z',
          '2025-06-27T12:00:00Z',
          '2025-06-27T13:00:00Z',
        ],
      };

      const result = await service.detectCognitiveBias(mockMarketData);

      expect(result).toBeDefined();
      expect(result.symbol).toBe('AAPL');
      expect(result.biases).toHaveProperty('anchoring');
      expect(result.biases).toHaveProperty('confirmation');
      expect(result.biases).toHaveProperty('recency');
      expect(result.biases).toHaveProperty('availability');
      expect(result.biases).toHaveProperty('overconfidence');
      expect(result.overallBiasScore).toBeGreaterThanOrEqual(0);
      expect(result.overallBiasScore).toBeLessThanOrEqual(1);
      expect(['exploit', 'neutral', 'avoid']).toContain(
        result.recommendedAction,
      );
    });

    it('should handle anchoring bias analysis', async () => {
      const mockMarketData = {
        symbol: 'TSLA',
        prices: [100, 100, 100, 100, 100], // Consistent pricing to test anchoring
        volume: [1000000],
        timestamps: ['2025-06-27T09:00:00Z'],
      };

      const result = await service.detectCognitiveBias(mockMarketData);

      expect(result.biases.anchoring.score).toBeGreaterThanOrEqual(0);
      expect(result.biases.anchoring.confidence).toBeGreaterThanOrEqual(0);
      expect(result.biases.anchoring.description).toBeDefined();
      expect(result.biases.anchoring.priceAnchor).toBeDefined();
    });

    it('should handle confirmation bias analysis', async () => {
      const mockMarketData = {
        symbol: 'NVDA',
        prices: [200, 205, 210, 215, 220], // Trending upward
        volume: [1000000],
        timestamps: ['2025-06-27T09:00:00Z'],
      };

      const result = await service.detectCognitiveBias(mockMarketData);

      expect(result.biases.confirmation.score).toBeGreaterThanOrEqual(0);
      expect(result.biases.confirmation.confidence).toBeGreaterThanOrEqual(0);
      expect(
        result.biases.confirmation.confirmatorySignals,
      ).toBeGreaterThanOrEqual(0);
    });
  });

  describe('analyzeMarketSentimentCycle', () => {
    it('should return sentiment cycle analysis', async () => {
      const result = await service.analyzeMarketSentimentCycle();

      expect(result).toBeDefined();
      expect([
        'despair',
        'depression',
        'hope',
        'optimism',
        'belief',
        'thrill',
        'euphoria',
        'complacency',
        'anxiety',
        'denial',
        'fear',
        'capitulation',
      ]).toContain(result.phase);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.marketImplications).toBeDefined();
      expect(
        result.marketImplications.expectedVolatility,
      ).toBeGreaterThanOrEqual(0);
      expect(['up', 'down', 'sideways']).toContain(
        result.marketImplications.expectedDirection,
      );
    });

    it('should provide valid transition probability', async () => {
      const result = await service.analyzeMarketSentimentCycle();

      expect(result.transitionProbability).toBeGreaterThanOrEqual(0);
      expect(result.transitionProbability).toBeLessThanOrEqual(1);
      expect(result.expectedTransition).toBeDefined();
    });
  });

  describe('calculateFearGreedIndex', () => {
    it('should return fear and greed index between 0-100', async () => {
      const result = await service.calculateFearGreedIndex();

      expect(result).toBeDefined();
      expect(result.overallIndex).toBeGreaterThanOrEqual(0);
      expect(result.overallIndex).toBeLessThanOrEqual(100);
      expect(result.interpretation).toBeDefined();
      expect(result.components).toBeDefined();
    });

    it('should provide valid component breakdown', async () => {
      const result = await service.calculateFearGreedIndex();

      expect(result.components.marketVolatility).toBeDefined();
      expect(result.components.marketMomentum).toBeDefined();
      expect(result.components.stockPriceBreadth).toBeDefined();
      expect(result.components.putCallRatio).toBeDefined();
      expect(result.components.junkBondDemand).toBeDefined();
    });

    it('should have appropriate interpretation for index ranges', async () => {
      const result = await service.calculateFearGreedIndex();

      expect([
        'extreme-fear',
        'fear',
        'neutral',
        'greed',
        'extreme-greed',
      ]).toContain(result.interpretation);
      expect(result.tradingSignal).toBeDefined();
      expect(result.tradingSignal.confidence).toBeGreaterThanOrEqual(0);
      expect(result.tradingSignal.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('detectHerdingBehavior', () => {
    it('should detect herding behavior for a symbol', async () => {
      const symbol = 'SPY';
      const result = await service.detectHerdingBehavior(symbol);

      expect(result).toBeDefined();
      expect(result.symbol).toBe(symbol);
      expect(result.herdingScore).toBeGreaterThanOrEqual(0);
      expect(result.herdingScore).toBeLessThanOrEqual(1);
      expect(result.institutionalHerding).toBeGreaterThanOrEqual(0);
      expect(result.retailHerding).toBeGreaterThanOrEqual(0);
      expect(result.socialMediaHerding).toBeGreaterThanOrEqual(0);
      expect(typeof result.contrarian.opportunity).toBe('boolean');
    });

    it('should provide contrarian analysis', async () => {
      const symbol = 'QQQ';
      const result = await service.detectHerdingBehavior(symbol);

      expect(result.contrarian).toBeDefined();
      expect(result.contrarian.strength).toBeGreaterThanOrEqual(0);
      expect(result.contrarian.expectedReversion).toBeDefined();
      expect(result.contrarian.timeframe).toBeGreaterThan(0);
      expect(result.crowdPsychology).toBeDefined();
      expect(['accumulation', 'markup', 'distribution', 'decline']).toContain(
        result.crowdPsychology.phase,
      );
    });
  });

  describe('analyzeProspectTheory', () => {
    it('should analyze prospect theory for portfolio', async () => {
      const mockPortfolio = {
        id: 'test-portfolio-1',
        positions: [
          { symbol: 'AAPL', quantity: 10, avgPrice: 150, currentPrice: 155 },
          { symbol: 'GOOGL', quantity: 5, avgPrice: 2500, currentPrice: 2480 },
        ],
        totalValue: 25000,
        totalReturn: 500,
      };

      const result = await service.analyzeProspectTheory(mockPortfolio);

      expect(result).toBeDefined();
      expect(result.portfolioId).toBeDefined();
      expect(result.riskTolerance).toBeDefined();
      expect(result.riskTolerance.gainsReaction).toBeGreaterThanOrEqual(0);
      expect(result.riskTolerance.lossesReaction).toBeGreaterThanOrEqual(0);
      expect(result.riskTolerance.lossAversion).toBeGreaterThanOrEqual(0);
      expect(result.mentalAccounting).toBeDefined();
      expect(result.decisionFraming).toBeDefined();
      expect(result.overallBiasScore).toBeGreaterThanOrEqual(0);
    });

    it('should calculate value function correctly', async () => {
      const mockPortfolio = {
        id: 'test-portfolio-2',
        positions: [
          { symbol: 'MSFT', quantity: 10, avgPrice: 300, currentPrice: 310 },
        ],
        totalValue: 3100,
        totalReturn: 100,
      };

      const result = await service.analyzeProspectTheory(mockPortfolio);

      expect(result.mentalAccounting).toBeDefined();
      expect(result.mentalAccounting.accounts).toBeDefined();
      expect(result.decisionFraming).toBeDefined();
      expect(['gains', 'losses']).toContain(result.decisionFraming.frameType);
    });
  });

  describe('assessLossAversion', () => {
    it('should assess loss aversion from trading history', async () => {
      const mockTradingHistory = [
        {
          type: 'buy',
          symbol: 'AAPL',
          quantity: 10,
          price: 150,
          pnl: 0,
          date: '2025-06-01',
        },
        {
          type: 'sell',
          symbol: 'AAPL',
          quantity: 10,
          price: 155,
          pnl: 50,
          date: '2025-06-02',
        },
        {
          type: 'buy',
          symbol: 'TSLA',
          quantity: 5,
          price: 200,
          pnl: 0,
          date: '2025-06-03',
        },
        {
          type: 'sell',
          symbol: 'TSLA',
          quantity: 5,
          price: 190,
          pnl: -50,
          date: '2025-06-04',
        },
      ];

      const result = await service.assessLossAversion(mockTradingHistory);

      expect(result).toBeDefined();
      expect(result.traderId).toBeDefined();
      expect(result.lossAversionCoefficient).toBeGreaterThan(0);
      expect(result.realizationEffect).toBeDefined();
      expect(
        result.realizationEffect.prematureGainRealization,
      ).toBeGreaterThanOrEqual(0);
      expect(
        result.realizationEffect.lossHoldingTendency,
      ).toBeGreaterThanOrEqual(0);
      expect(result.dispositionEffect).toBeDefined();
      expect(result.recommendations).toBeDefined();
    });

    it('should handle empty trading history', async () => {
      const result = await service.assessLossAversion([]);

      expect(result).toBeDefined();
      expect(result.lossAversionCoefficient).toBe(2.25); // Default loss aversion coefficient
      expect(result.realizationEffect).toBeDefined();
      expect(result.dispositionEffect).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle invalid market data gracefully', async () => {
      const invalidData = {
        symbol: '',
        prices: [],
        volume: [],
        timestamps: [],
      };

      const result = await service.detectCognitiveBias(invalidData);

      expect(result).toBeDefined();
      expect(result.symbol).toBe('UNKNOWN'); // Default fallback for invalid data
      expect(result.overallBiasScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle null/undefined inputs', async () => {
      const result = await service.detectCognitiveBias(null as any);

      expect(result).toBeDefined();
      expect(result.overallBiasScore).toBeGreaterThanOrEqual(0);
    });
  });
});
