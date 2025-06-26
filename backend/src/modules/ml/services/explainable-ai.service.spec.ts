import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIExplanation } from '../entities/ai.entities';
import { ExplainableAIService } from './explainable-ai.service';
import { TradingRecommendation } from './intelligent-recommendation.service';
import { LLMService } from './llm.service';

describe('ExplainableAIService', () => {
  let service: ExplainableAIService;
  let llmService: LLMService;
  let explanationRepository: Repository<AIExplanation>;

  const mockRecommendation: TradingRecommendation = {
    symbol: 'AAPL',
    action: 'BUY',
    confidence: 0.85,
    reasoning: ['Strong technical indicators', 'Positive earnings outlook'],
    riskLevel: 'MEDIUM',
    timeHorizon: '1W',
    stopLoss: 140,
    takeProfit: 160,
    timestamp: new Date(),
    metrics: {
      marketPrediction: {
        direction: 'BUY',
        confidence: 0.85,
        timeHorizon: '1W',
        priceTarget: 160,
      },
      technicalSignals: {
        strength: 0.8,
        signals: [
          { type: 'RSI', value: 35, weight: 0.3 },
          { type: 'MACD', value: 0.5, weight: 0.4 },
        ],
      },
      sentimentAnalysis: {
        score: 0.7,
        sources: ['News', 'Social Media'],
        confidence: 0.8,
      },
      riskAssessment: {
        level: 'MEDIUM',
        factors: ['Market volatility'],
        maxDrawdown: 15,
        volatility: 20,
      },
      patternRecognition: {
        patterns: [
          {
            type: 'Bullish Flag',
            confidence: 0.8,
            implications: 'Continuation pattern',
          },
        ],
      },
      ensembleScore: 0.85,
      finalConfidence: 0.85,
    },
  };

  const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
  };

  const mockLLMService = {
    generateExplanation: jest.fn(),
    processQuery: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExplainableAIService,
        {
          provide: getRepositoryToken(AIExplanation),
          useValue: mockRepository,
        },
        {
          provide: LLMService,
          useValue: mockLLMService,
        },
      ],
    }).compile();

    service = module.get<ExplainableAIService>(ExplainableAIService);
    llmService = module.get<LLMService>(LLMService);
    explanationRepository = module.get<Repository<AIExplanation>>(
      getRepositoryToken(AIExplanation),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('explainRecommendation', () => {
    it('should return cached explanation if recent one exists', async () => {
      const mockRecommendation: TradingRecommendation = {
        symbol: 'AAPL',
        action: 'BUY',
        confidence: 0.85,
        reasoning: ['Strong technical indicators', 'Positive earnings outlook'],
        riskLevel: 'MEDIUM',
        timeHorizon: '1W',
        stopLoss: 140,
        takeProfit: 160,
        timestamp: new Date(),
        metrics: {
          marketPrediction: {
            direction: 'BUY',
            confidence: 0.85,
            timeHorizon: '1W',
            priceTarget: 160,
          },
          technicalSignals: {
            strength: 0.8,
            signals: [
              { type: 'RSI', value: 35, weight: 0.3 },
              { type: 'MACD', value: 0.5, weight: 0.4 },
            ],
          },
          sentimentAnalysis: {
            score: 0.7,
            sources: ['News', 'Social Media'],
            confidence: 0.8,
          },
          riskAssessment: {
            level: 'MEDIUM',
            factors: ['Market volatility'],
            maxDrawdown: 15,
            volatility: 20,
          },
          patternRecognition: {
            patterns: [
              {
                type: 'Bullish Flag',
                confidence: 0.8,
                implications: 'Continuation pattern',
              },
            ],
          },
          ensembleScore: 0.85,
          finalConfidence: 0.85,
        },
      };
      const cachedExplanation = {
        explanation: 'Cached AI explanation for AAPL buy signal',
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
      };

      mockRepository.findOne.mockResolvedValue(cachedExplanation);

      const result = await service.explainRecommendation(mockRecommendation);

      expect(result).toBe(cachedExplanation.explanation);
      expect(mockLLMService.generateExplanation).not.toHaveBeenCalled();
    });

    it('should generate new explanation if no recent cache exists', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockResolvedValue({});

      const llmExplanation = 'AI-generated explanation for AAPL buy signal';
      mockLLMService.generateExplanation.mockResolvedValue(llmExplanation);

      const result = await service.explainRecommendation(mockRecommendation);

      expect(result).toBe(llmExplanation);
      expect(mockLLMService.generateExplanation).toHaveBeenCalledWith(
        expect.objectContaining({
          signal: 'BUY',
          confidence: 0.85,
          priceTarget: 160,
          stopLoss: 140,
        }),
      );
    });

    it('should return fallback explanation on error', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('Database error'));

      const result = await service.explainRecommendation(mockRecommendation);

      expect(result).toBeTruthy();
      expect(result).toContain('BUY Recommendation for AAPL');
      expect(result).toContain('85.0% confidence');
      expect(result).toContain('MEDIUM risk level');
    });

    it('should include reasoning in fallback explanation', async () => {
      mockRepository.findOne.mockRejectedValue(new Error('Service error'));

      const result = await service.explainRecommendation(mockRecommendation);

      expect(result).toContain('Strong technical indicators');
      expect(result).toContain('Positive earnings outlook');
      expect(result).toContain('Target price: $160.00');
      expect(result).toContain('Suggested stop loss: $140.00');
    });
  });

  describe('answerTradingQuestion', () => {
    it('should process trading questions through LLM service', async () => {
      const question = 'What is the best strategy for volatile markets?';
      const userContext = { userId: 'test-user' };
      const expectedAnswer = 'In volatile markets, consider...';

      mockLLMService.processQuery.mockResolvedValue({
        response: expectedAnswer,
        confidence: 0.8,
      });

      const result = await service.answerTradingQuestion(question, userContext);

      expect(result).toBe(expectedAnswer);
      expect(mockLLMService.processQuery).toHaveBeenCalledWith(
        question,
        userContext,
      );
    });

    it('should return error message on service failure', async () => {
      const question = 'How do I analyze stocks?';
      const userContext = { userId: 'test-user' };

      mockLLMService.processQuery.mockRejectedValue(
        new Error('LLM service error'),
      );

      const result = await service.answerTradingQuestion(question, userContext);

      expect(result).toContain('trouble processing');
      expect(result).toContain('try again later');
    });
  });

  describe('getExplanationHistory', () => {
    it('should retrieve explanation history for a symbol', async () => {
      const mockHistory = [
        {
          id: '1',
          symbol: 'AAPL',
          explanation: 'Previous explanation 1',
          timestamp: new Date(),
        },
        {
          id: '2',
          symbol: 'AAPL',
          explanation: 'Previous explanation 2',
          timestamp: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(mockHistory);

      const result = await service.getExplanationHistory('AAPL', 5);

      expect(result).toEqual(mockHistory);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { symbol: 'AAPL' },
        order: { timestamp: 'DESC' },
        take: 5,
      });
    });

    it('should use default limit when not specified', async () => {
      mockRepository.find.mockResolvedValue([]);

      await service.getExplanationHistory('TSLA');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { symbol: 'TSLA' },
        order: { timestamp: 'DESC' },
        take: 10,
      });
    });
  });

  describe('buildExplanationContext', () => {
    it('should extract technical indicators from recommendation metrics', async () => {
      const recommendation = mockRecommendation;

      // Call the private method through explainRecommendation
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockResolvedValue({});
      mockLLMService.generateExplanation.mockResolvedValue('test explanation');

      await service.explainRecommendation(recommendation);

      expect(mockLLMService.generateExplanation).toHaveBeenCalledWith(
        expect.objectContaining({
          indicators: expect.objectContaining({
            RSI: 35,
            MACD: 0.5,
          }),
          marketConditions: expect.objectContaining({
            marketTrend: 'BULLISH',
            volatility: 20,
          }),
        }),
      );
    });
  });

  describe('error handling and resilience', () => {
    it('should handle repository save failures gracefully', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue({});
      mockRepository.save.mockRejectedValue(new Error('Save failed'));

      const llmExplanation = 'Generated explanation';
      mockLLMService.generateExplanation.mockResolvedValue(llmExplanation);

      const result = await service.explainRecommendation(mockRecommendation);

      // Should still return the explanation even if saving fails
      expect(result).toBe(llmExplanation);
    });

    it('should handle incomplete recommendation data', async () => {
      const incompleteRecommendation: Partial<TradingRecommendation> = {
        symbol: 'TEST',
        action: 'HOLD',
        confidence: 0.5,
        riskLevel: 'LOW',
        timeHorizon: '1D',
        timestamp: new Date(),
        reasoning: [],
        metrics: {
          marketPrediction: {
            direction: 'HOLD',
            confidence: 0.5,
            timeHorizon: '1D',
          },
          technicalSignals: { strength: 0, signals: [] },
          sentimentAnalysis: { score: 0, sources: [], confidence: 0 },
          riskAssessment: {
            level: 'LOW',
            factors: [],
            maxDrawdown: 0,
            volatility: 0,
          },
          patternRecognition: { patterns: [] },
          ensembleScore: 0.5,
          finalConfidence: 0.5,
        },
      };

      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.explainRecommendation(
        incompleteRecommendation as TradingRecommendation,
      );

      expect(result).toBeTruthy();
      expect(result).toContain('HOLD Recommendation for TEST');
    });
  });
});
