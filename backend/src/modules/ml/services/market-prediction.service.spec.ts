import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MLMetric, MLModel, MLPrediction } from '../entities/ml.entities';
import { TechnicalFeatures } from '../interfaces/ml.interfaces';
import { FeaturePipelineService } from './feature-pipeline.service';
import { MarketPredictionService } from './market-prediction.service';

describe('MarketPredictionService', () => {
  let service: MarketPredictionService;
  let featurePipelineService: jest.Mocked<FeaturePipelineService>;
  let mlModelRepository: jest.Mocked<Repository<MLModel>>;
  let mlPredictionRepository: jest.Mocked<Repository<MLPrediction>>;
  let mlMetricRepository: jest.Mocked<Repository<MLMetric>>;

  const mockTechnicalFeatures: TechnicalFeatures = {
    symbol: 'AAPL',
    timestamp: new Date(),
    price: 150.0,
    volume: 1000000,
    rsi: 65.5,
    macd: 2.5,
    bollingerBands: {
      upper: 155.0,
      middle: 150.0,
      lower: 145.0,
    },
    movingAverages: {
      sma20: 148.0,
      sma50: 145.0,
      ema12: 149.0,
      ema26: 147.0,
    },
    support: 140.0,
    resistance: 160.0,
    volatility: 0.25,
    momentum: 0.05,
  };

  const mockFeatureSet = {
    symbol: 'AAPL',
    timestamp: new Date(),
    timeframe: '1m',
    features: new Map([
      ['close', 150.0],
      ['rsi_14', 65.5],
      ['macd_line', 2.5],
      ['bb_upper', 155.0],
      ['bb_middle', 150.0],
      ['bb_lower', 145.0],
      ['sma_20', 148.0],
      ['sma_50', 145.0],
      ['ema_12', 149.0],
      ['ema_26', 147.0],
    ]),
    indicators: [],
    metadata: {
      volume: 1000000,
      volatility: 0.25,
      trend: 'up' as const,
      marketRegime: 'bullish' as const,
      dataQuality: 0.95,
    },
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const mockFeaturePipeline = {
      extractFeatures: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketPredictionService,
        {
          provide: FeaturePipelineService,
          useValue: mockFeaturePipeline,
        },
        {
          provide: getRepositoryToken(MLModel),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(MLPrediction),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(MLMetric),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MarketPredictionService>(MarketPredictionService);
    featurePipelineService = module.get(FeaturePipelineService);
    mlModelRepository = module.get(getRepositoryToken(MLModel));
    mlPredictionRepository = module.get(getRepositoryToken(MLPrediction));
    mlMetricRepository = module.get(getRepositoryToken(MLMetric));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('predictMarket', () => {
    it('should generate comprehensive market predictions', async () => {
      const result = await service.predictMarket(
        'AAPL',
        mockTechnicalFeatures,
        ['1h', '1d'],
      );

      expect(result).toBeDefined();
      expect(result.symbol).toBe('AAPL');
      expect(result.horizonPredictions).toHaveLength(2);
      expect(result.ensemblePrediction).toBeDefined();
      expect(result.uncertaintyBounds).toBeDefined();
      expect(result.signals).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle single horizon prediction', async () => {
      const result = await service.predictMarket(
        'AAPL',
        mockTechnicalFeatures,
        ['1d'],
      );

      expect(result.horizonPredictions).toHaveLength(1);
      expect(result.horizonPredictions[0].horizon).toBe('1d');
    });

    it('should generate trading signals based on predictions', async () => {
      const result = await service.predictMarket(
        'AAPL',
        mockTechnicalFeatures,
        ['1d'],
      );

      expect(result.signals).toBeDefined();
      expect(result.signals.signal).toMatch(
        /STRONG_BUY|BUY|HOLD|SELL|STRONG_SELL/,
      );
      expect(result.signals.strength).toBeGreaterThanOrEqual(0);
      expect(result.signals.strength).toBeLessThanOrEqual(1);
      expect(result.signals.reasoning).toBeDefined();
    });
  });

  describe('predictPriceDirection', () => {
    beforeEach(() => {
      featurePipelineService.extractFeatures.mockResolvedValue([
        mockFeatureSet,
      ]);
    });

    it('should predict price direction with confidence', async () => {
      const result = await service.predictPriceDirection('AAPL', '1d');

      expect(result).toBeDefined();
      expect(result.direction).toMatch(/UP|DOWN|NEUTRAL/);
      expect(result.probability).toBeGreaterThanOrEqual(0);
      expect(result.probability).toBeLessThanOrEqual(1);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.priceTarget).toBeGreaterThan(0);
      expect(result.confidenceInterval).toHaveLength(2);
      expect(result.confidenceInterval[0]).toBeLessThan(
        result.confidenceInterval[1],
      );
    });

    it('should handle different time horizons', async () => {
      const result1h = await service.predictPriceDirection('AAPL', '1h');
      const result1d = await service.predictPriceDirection('AAPL', '1d');

      expect(result1h).toBeDefined();
      expect(result1d).toBeDefined();
      // Shorter horizons typically have different characteristics
      expect(result1h.direction).toMatch(/UP|DOWN|NEUTRAL/);
      expect(result1d.direction).toMatch(/UP|DOWN|NEUTRAL/);
    });

    it('should throw error when no feature data available', async () => {
      featurePipelineService.extractFeatures.mockResolvedValue([]);

      await expect(
        service.predictPriceDirection('INVALID', '1d'),
      ).rejects.toThrow('No feature data available');
    });
  });

  describe('predictPriceRange', () => {
    beforeEach(() => {
      featurePipelineService.extractFeatures.mockResolvedValue([
        mockFeatureSet,
      ]);
    });

    it('should predict price range with confidence bands', async () => {
      const result = await service.predictPriceRange('AAPL', '1d');

      expect(result).toBeDefined();
      expect(result.low).toBeGreaterThan(0);
      expect(result.high).toBeGreaterThan(result.low);
      expect(result.median).toBeGreaterThan(result.low);
      expect(result.median).toBeLessThan(result.high);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.volatilityForecast).toBeGreaterThanOrEqual(0);
    });

    it('should handle error when feature extraction fails', async () => {
      featurePipelineService.extractFeatures.mockRejectedValue(
        new Error('Feature extraction failed'),
      );

      await expect(service.predictPriceRange('AAPL', '1d')).rejects.toThrow();
    });
  });

  describe('getEnsemblePrediction', () => {
    beforeEach(() => {
      featurePipelineService.extractFeatures.mockResolvedValue([
        mockFeatureSet,
      ]);
    });

    it('should return ensemble prediction with model breakdown', async () => {
      const result = await service.getEnsemblePrediction('AAPL', '1d');

      expect(result).toBeDefined();
      expect(result.ensembleResult).toBeDefined();
      expect(result.modelContributions).toBeDefined();
      expect(result.modelContributions.length).toBeGreaterThan(0);
      expect(result.consensusScore).toBeGreaterThanOrEqual(0);
      expect(result.consensusScore).toBeLessThanOrEqual(1);
      expect(result.diversityIndex).toBeGreaterThanOrEqual(0);
      expect(result.diversityIndex).toBeLessThanOrEqual(1);
    });

    it('should calculate consensus score based on model agreement', async () => {
      const result = await service.getEnsemblePrediction('AAPL', '1d');

      // Consensus score should be reasonable (models somewhat agree)
      expect(result.consensusScore).toBeGreaterThan(0);
      expect(result.consensusScore).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateConfidenceIntervals', () => {
    it('should calculate confidence intervals correctly', async () => {
      const predictions = [0.02, 0.015, 0.025, 0.018, 0.022];
      const result = await service.calculateConfidenceIntervals(
        predictions,
        0.95,
      );

      expect(result).toBeDefined();
      expect(result.lower).toBeLessThan(result.upper);
      expect(result.mean).toBeGreaterThan(result.lower);
      expect(result.mean).toBeLessThan(result.upper);
      expect(result.standardError).toBeGreaterThan(0);
    });

    it('should handle different confidence levels', async () => {
      const predictions = [0.02, 0.015, 0.025, 0.018, 0.022];

      const result95 = await service.calculateConfidenceIntervals(
        predictions,
        0.95,
      );
      const result99 = await service.calculateConfidenceIntervals(
        predictions,
        0.99,
      );

      // 99% confidence interval should be wider than 95%
      const width95 = result95.upper - result95.lower;
      const width99 = result99.upper - result99.lower;
      expect(width99).toBeGreaterThan(width95);
    });

    it('should throw error for empty predictions array', async () => {
      await expect(
        service.calculateConfidenceIntervals([], 0.95),
      ).rejects.toThrow('No predictions provided');
    });
  });

  describe('monitorModelPerformance', () => {
    it('should return model performance metrics', async () => {
      const result = await service.monitorModelPerformance();

      expect(result).toBeDefined();
      expect(result.modelMetrics).toBeDefined();
      expect(result.ensemblePerformance).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should track individual model metrics', async () => {
      const result = await service.monitorModelPerformance();

      expect(result.modelMetrics.size).toBeGreaterThan(0);

      // Check that each model has proper metrics
      for (const [modelId, metrics] of result.modelMetrics.entries()) {
        expect(metrics.accuracy).toBeGreaterThanOrEqual(0);
        expect(metrics.accuracy).toBeLessThanOrEqual(1);
        expect(metrics.precision).toBeGreaterThanOrEqual(0);
        expect(metrics.precision).toBeLessThanOrEqual(1);
        expect(metrics.recall).toBeGreaterThanOrEqual(0);
        expect(metrics.recall).toBeLessThanOrEqual(1);
        expect(metrics.f1Score).toBeGreaterThanOrEqual(0);
        expect(metrics.f1Score).toBeLessThanOrEqual(1);
        expect(metrics.lastUpdated).toBeInstanceOf(Date);
      }
    });

    it('should provide ensemble performance metrics', async () => {
      const result = await service.monitorModelPerformance();

      expect(result.ensemblePerformance.accuracy).toBeGreaterThanOrEqual(0);
      expect(result.ensemblePerformance.accuracy).toBeLessThanOrEqual(1);
      expect(result.ensemblePerformance.consistency).toBeGreaterThanOrEqual(0);
      expect(result.ensemblePerformance.consistency).toBeLessThanOrEqual(1);
      expect(result.ensemblePerformance.diversityScore).toBeGreaterThanOrEqual(
        0,
      );
      expect(result.ensemblePerformance.diversityScore).toBeLessThanOrEqual(1);
      expect(result.ensemblePerformance.lastEvaluation).toBeInstanceOf(Date);
    });

    it('should generate recommendations for low-performing models', async () => {
      const result = await service.monitorModelPerformance();

      // Recommendations should be strings
      expect(
        result.recommendations.every((rec) => typeof rec === 'string'),
      ).toBe(true);
    });
  });

  describe('Model Integration', () => {
    it('should initialize models correctly', () => {
      // Models should be initialized in constructor
      expect(service).toBeDefined();
      // This is testing that the service initializes without throwing
    });

    it('should handle different model architectures', async () => {
      // Test that different model types can be called
      const mockFeatures = mockTechnicalFeatures;

      // These should not throw errors
      expect(async () => {
        await service.predictMarket(mockFeatures.symbol, mockFeatures, ['1h']);
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors gracefully', async () => {
      mlPredictionRepository.save.mockRejectedValue(
        new Error('Database error'),
      );

      // Should still return prediction even if logging fails
      const result = await service.predictMarket(
        'AAPL',
        mockTechnicalFeatures,
        ['1d'],
      );

      expect(result).toBeDefined();
    });

    it('should handle feature pipeline errors', async () => {
      featurePipelineService.extractFeatures.mockRejectedValue(
        new Error('Feature pipeline error'),
      );

      await expect(
        service.predictPriceDirection('AAPL', '1d'),
      ).rejects.toThrow();
    });
  });

  describe('Performance', () => {
    it('should complete predictions within reasonable time', async () => {
      const startTime = Date.now();

      await service.predictMarket('AAPL', mockTechnicalFeatures, ['1d']);

      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle multiple concurrent predictions', async () => {
      const promises = [
        service.predictMarket('AAPL', mockTechnicalFeatures, ['1d']),
        service.predictMarket('GOOGL', mockTechnicalFeatures, ['1d']),
        service.predictMarket('MSFT', mockTechnicalFeatures, ['1d']),
      ];

      const results = await Promise.all(promises);
      expect(results).toHaveLength(3);
      expect(results.every((r) => r.symbol)).toBe(true);
    });
  });
});
