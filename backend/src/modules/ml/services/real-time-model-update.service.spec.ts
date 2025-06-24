/**
 * Integration tests for S29C Real-time ML Model Updates Service
 * Tests the real-time model update functionality including online learning,
 * streaming data processing, model lifecycle management, and performance monitoring
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MLMetric, MLModel, MLPrediction } from '../entities/ml.entities';
import { TechnicalFeatures } from '../interfaces/ml.interfaces';
import { FeaturePipelineService } from './feature-pipeline.service';
import { MarketPredictionService } from './market-prediction.service';
import { RealTimeModelUpdateService } from './real-time-model-update.service';
import { SignalGenerationService } from './signal-generation.service';

describe('RealTimeModelUpdateService (S29C)', () => {
  let service: RealTimeModelUpdateService;
  let mlModelRepository: Repository<MLModel>;
  let mlPredictionRepository: Repository<MLPrediction>;
  let mlMetricRepository: Repository<MLMetric>;
  let marketPredictionService: MarketPredictionService;
  let signalGenerationService: SignalGenerationService;
  let featurePipelineService: FeaturePipelineService;

  const mockMLModelRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockMLPredictionRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockMLMetricRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockMarketPredictionService = {
    generatePredictions: jest.fn(),
    getModelPerformance: jest.fn(),
  };

  const mockSignalGenerationService = {
    generateEnsembleSignals: jest.fn(),
    updateEnsembleWeights: jest.fn(),
  };

  const mockFeaturePipelineService = {
    extractFeatures: jest.fn(),
    validateFeatures: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RealTimeModelUpdateService,
        {
          provide: getRepositoryToken(MLModel),
          useValue: mockMLModelRepository,
        },
        {
          provide: getRepositoryToken(MLPrediction),
          useValue: mockMLPredictionRepository,
        },
        {
          provide: getRepositoryToken(MLMetric),
          useValue: mockMLMetricRepository,
        },
        {
          provide: MarketPredictionService,
          useValue: mockMarketPredictionService,
        },
        {
          provide: SignalGenerationService,
          useValue: mockSignalGenerationService,
        },
        {
          provide: FeaturePipelineService,
          useValue: mockFeaturePipelineService,
        },
      ],
    }).compile();

    service = module.get<RealTimeModelUpdateService>(
      RealTimeModelUpdateService,
    );
    mlModelRepository = module.get<Repository<MLModel>>(
      getRepositoryToken(MLModel),
    );
    mlPredictionRepository = module.get<Repository<MLPrediction>>(
      getRepositoryToken(MLPrediction),
    );
    mlMetricRepository = module.get<Repository<MLMetric>>(
      getRepositoryToken(MLMetric),
    );
    marketPredictionService = module.get<MarketPredictionService>(
      MarketPredictionService,
    );
    signalGenerationService = module.get<SignalGenerationService>(
      SignalGenerationService,
    );
    featurePipelineService = module.get<FeaturePipelineService>(
      FeaturePipelineService,
    );

    // Setup mock data
    mockMLModelRepository.find.mockResolvedValue([
      {
        id: '1',
        name: 'test_model',
        version: '1',
        type: 'lstm',
        status: 'active',
      },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize real-time system on module init', async () => {
      const initSpy = jest.spyOn(service as any, 'initializeRealTimeSystem');
      await service.onModuleInit();
      expect(initSpy).toHaveBeenCalled();
    });
  });

  describe('Online Learning', () => {
    it('should update models with streaming data', async () => {
      const symbol = 'AAPL';
      const marketData = {
        price: 150.0,
        volume: 1000000,
        timestamp: new Date(),
      };
      const features: TechnicalFeatures = {
        symbol,
        timestamp: new Date(),
        price: 150.0,
        volume: 1000000,
        rsi: 45.5,
        macd: 0.5,
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
        volatility: 0.02,
        momentum: 0.01,
      };

      await expect(
        service.updateModelsOnline(symbol, marketData, features),
      ).resolves.not.toThrow();
    });

    it('should trigger updates when buffer threshold is reached', async () => {
      const symbol = 'AAPL';
      const shouldTrigger = (service as any).shouldTriggerUpdate(symbol);
      expect(typeof shouldTrigger).toBe('boolean');
    });

    it('should handle LSTM model updates with online gradient descent', async () => {
      const symbol = 'AAPL';
      const data = Array(10)
        .fill(0)
        .map((_, i) => ({
          timestamp: new Date(),
          marketData: { price: 150 + i, volume: 1000000 },
          features: { sma: 150 + i, rsi: 50 + i },
        }));

      await expect(
        (service as any).updateLSTMModel(symbol, data),
      ).resolves.not.toThrow();
    });

    it('should update ensemble weights based on performance', async () => {
      const symbol = 'AAPL';
      const data = Array(10)
        .fill(0)
        .map(() => ({
          timestamp: new Date(),
          marketData: { price: 150, volume: 1000000 },
          features: { sma: 150, rsi: 50 },
        }));

      await expect(
        (service as any).updateEnsembleWeights(symbol, data),
      ).resolves.not.toThrow();
    });
  });

  describe('Feature Drift Detection', () => {
    it('should calculate feature drift scores', () => {
      const baseline: TechnicalFeatures = {
        symbol: 'AAPL',
        timestamp: new Date(),
        price: 150.0,
        volume: 1000000,
        rsi: 50.0,
        macd: 0.0,
        bollingerBands: { upper: 155, middle: 150, lower: 145 },
        movingAverages: { sma20: 150, sma50: 148, ema12: 151, ema26: 149 },
        support: 140,
        resistance: 160,
        volatility: 0.02,
        momentum: 0.01,
      };

      const current: TechnicalFeatures = {
        ...baseline,
        rsi: 55.0, // 10% change
        macd: 0.1, // Significant change
      };

      const driftScore = (service as any).calculateFeatureDrift(
        baseline,
        current,
      );
      expect(typeof driftScore).toBe('number');
      expect(driftScore).toBeGreaterThanOrEqual(0);
    });

    it('should handle feature drift events', async () => {
      const symbol = 'AAPL';
      const driftScore = 0.15; // Above threshold

      await expect(
        (service as any).handleFeatureDrift(symbol, driftScore),
      ).resolves.not.toThrow();
    });

    it('should update feature drift detection system', async () => {
      const symbol = 'AAPL';
      const features: TechnicalFeatures = {
        symbol,
        timestamp: new Date(),
        price: 150.0,
        volume: 1000000,
        rsi: 45.5,
        macd: 0.5,
        bollingerBands: { upper: 155, middle: 150, lower: 145 },
        movingAverages: { sma20: 148, sma50: 145, ema12: 149, ema26: 147 },
        support: 140,
        resistance: 160,
        volatility: 0.02,
        momentum: 0.01,
      };

      await expect(
        (service as any).updateFeatureDriftDetection(symbol, features),
      ).resolves.not.toThrow();
    });
  });

  describe('Performance Monitoring', () => {
    it('should monitor model performance', async () => {
      const symbol = 'AAPL';
      mockMLPredictionRepository.find.mockResolvedValue([
        {
          id: '1',
          symbol,
          outputPrediction: { value: 150.5 },
          confidence: 0.85,
          createdAt: new Date(),
        },
      ]);

      await expect(
        (service as any).monitorModelPerformance(symbol),
      ).resolves.not.toThrow();
    });

    it('should calculate recent performance metrics', async () => {
      const symbol = 'AAPL';
      mockMLPredictionRepository.find.mockResolvedValue([
        {
          id: '1',
          symbol,
          outputPrediction: { value: 150.5 },
          confidence: 0.85,
          createdAt: new Date(),
        },
      ]);

      const metrics = await (service as any).calculateRecentPerformance(symbol);
      expect(metrics).toHaveProperty('accuracy');
      expect(metrics).toHaveProperty('precision');
      expect(metrics).toHaveProperty('f1Score');
      expect(metrics.accuracy).toBeGreaterThanOrEqual(0);
      expect(metrics.accuracy).toBeLessThanOrEqual(1);
    });

    it('should detect performance degradation', () => {
      const metrics = {
        modelName: 'test',
        accuracy: 0.5, // Below threshold
        precision: 0.6,
        recall: 0.55,
        f1Score: 0.57,
        sampleSize: 100,
        evaluationPeriod: { start: new Date(), end: new Date() },
        timestamp: new Date(),
      };

      const degraded = (service as any).checkPerformanceDegradation(metrics);
      expect(typeof degraded).toBe('boolean');
      expect(degraded).toBe(true);
    });

    it('should handle performance degradation', async () => {
      const symbol = 'AAPL';
      const metrics = {
        modelName: 'test',
        accuracy: 0.5,
        precision: 0.6,
        recall: 0.55,
        f1Score: 0.57,
        sampleSize: 100,
        evaluationPeriod: { start: new Date(), end: new Date() },
        timestamp: new Date(),
      };

      await expect(
        (service as any).handlePerformanceDegradation(symbol, metrics),
      ).resolves.not.toThrow();
    });
  });

  describe('Model Lifecycle Management', () => {
    it('should trigger model retraining', async () => {
      const symbol = 'AAPL';
      const reason = 'performance_degradation';

      await expect(
        service.triggerModelRetraining(symbol, reason),
      ).resolves.not.toThrow();
    });

    it('should deploy candidate models', async () => {
      const symbol = 'AAPL';
      const model = {
        version: 2,
        type: 'ensemble',
        accuracy: 0.85,
      };

      await expect(
        (service as any).deployCandidateModel(symbol, model),
      ).resolves.not.toThrow();
    });

    it('should start A/B testing', async () => {
      const symbol = 'AAPL';
      const candidateModel = {
        version: 2,
        type: 'ensemble',
        accuracy: 0.85,
      };

      await expect(
        (service as any).startABTest(symbol, candidateModel),
      ).resolves.not.toThrow();
    });

    it('should consider model rollback', async () => {
      const symbol = 'AAPL';

      // Setup model history
      (service as any).modelHistory.set(symbol, [
        { version: 1, accuracy: 0.8 },
        { version: 2, accuracy: 0.6 }, // Current degraded model
      ]);

      await expect(
        (service as any).considerModelRollback(symbol),
      ).resolves.not.toThrow();
    });
  });

  describe('Market Regime Detection', () => {
    it('should detect current market regime', async () => {
      const marketData = {
        volatility: 0.03,
        trend: 0.01,
        momentum: 0.02,
      };

      const regime = await (service as any).detectCurrentRegime(marketData);
      expect(typeof regime).toBe('string');
      expect(['bull', 'bear', 'sideways', 'volatile', 'normal']).toContain(
        regime,
      );
    });

    it('should handle regime changes', async () => {
      const newRegime = 'bull';
      await expect(
        (service as any).handleRegimeChange(newRegime),
      ).resolves.not.toThrow();
    });

    it('should switch to regime-appropriate models', async () => {
      const regime = 'bull';
      await expect(
        (service as any).switchToRegimeModels(regime),
      ).resolves.not.toThrow();
    });
  });

  describe('Public API Methods', () => {
    it('should get model status for a symbol', async () => {
      const symbol = 'AAPL';
      const status = await service.getModelStatus(symbol);

      expect(status).toHaveProperty('symbol');
      expect(status).toHaveProperty('version');
      expect(status).toHaveProperty('regime');
    });

    it('should get overall model status', async () => {
      const status = await service.getModelStatus();

      expect(status).toHaveProperty('totalModels');
      expect(status).toHaveProperty('currentRegime');
      expect(status).toHaveProperty('streamingActive');
    });

    it('should validate model manually', async () => {
      const symbol = 'AAPL';

      // Setup deployed model
      (service as any).deployedModels.set(symbol, {
        version: 1,
        type: 'ensemble',
        accuracy: 0.8,
      });

      const result = await service.validateModelManually(symbol);
      expect(result).toHaveProperty('isValid');
      expect(result).toHaveProperty('accuracy');
    });

    it('should rollback model manually', async () => {
      const symbol = 'AAPL';

      // Setup model history
      (service as any).modelHistory.set(symbol, [
        { version: 1, accuracy: 0.8 },
        { version: 2, accuracy: 0.85 },
      ]);

      const result = await service.rollbackModel(symbol, 1);
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('rolledBackTo');
      expect(result.success).toBe(true);
    });

    it('should configure streaming', async () => {
      const symbol = 'AAPL';
      const config = {
        bufferSize: 500,
        updateFrequency: 30000,
      };

      const result = await service.configureStreaming(symbol, config);
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
    });

    it('should get streaming status for a symbol', async () => {
      const symbol = 'AAPL';
      const status = await service.getStreamingStatus(symbol);

      expect(status).toHaveProperty('symbol');
      expect(status).toHaveProperty('bufferSize');
      expect(status).toHaveProperty('isActive');
    });

    it('should get overall streaming status', async () => {
      const status = await service.getStreamingStatus();

      expect(status).toHaveProperty('totalStreams');
      expect(status).toHaveProperty('systemActive');
      expect(status).toHaveProperty('currentRegime');
    });

    it('should get lifecycle metrics', async () => {
      const metrics = await service.getLifecycleMetrics();

      expect(metrics).toHaveProperty('modelVersions');
      expect(metrics).toHaveProperty('currentRegime');
      expect(metrics).toHaveProperty('deployedModels');
      expect(metrics).toHaveProperty('candidateModels');
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in online model updates gracefully', async () => {
      const symbol = 'AAPL';
      const invalidMarketData = null;
      const invalidFeatures = {} as TechnicalFeatures;

      await expect(
        service.updateModelsOnline(symbol, invalidMarketData, invalidFeatures),
      ).resolves.not.toThrow();
    });

    it('should handle model validation errors', async () => {
      const symbol = 'NONEXISTENT';

      await expect(service.validateModelManually(symbol)).rejects.toThrow();
    });

    it('should handle rollback errors for non-existent models', async () => {
      const symbol = 'NONEXISTENT';

      await expect(service.rollbackModel(symbol)).rejects.toThrow();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent model updates', async () => {
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
      const marketData = { price: 150, volume: 1000000 };
      const features: TechnicalFeatures = {
        symbol: 'TEST',
        timestamp: new Date(),
        price: 150,
        volume: 1000000,
        rsi: 50,
        macd: 0,
        bollingerBands: { upper: 155, middle: 150, lower: 145 },
        movingAverages: { sma20: 150, sma50: 148, ema12: 151, ema26: 149 },
        support: 140,
        resistance: 160,
        volatility: 0.02,
        momentum: 0.01,
      };

      const promises = symbols.map((symbol) =>
        service.updateModelsOnline(symbol, marketData, { ...features, symbol }),
      );

      await expect(Promise.all(promises)).resolves.not.toThrow();
    });

    it('should maintain performance with large streaming buffers', async () => {
      const symbol = 'AAPL';
      const marketData = { price: 150, volume: 1000000 };
      const features: TechnicalFeatures = {
        symbol,
        timestamp: new Date(),
        price: 150,
        volume: 1000000,
        rsi: 50,
        macd: 0,
        bollingerBands: { upper: 155, middle: 150, lower: 145 },
        movingAverages: { sma20: 150, sma50: 148, ema12: 151, ema26: 149 },
        support: 140,
        resistance: 160,
        volatility: 0.02,
        momentum: 0.01,
      };

      // Simulate large number of updates
      const updates = Array(100)
        .fill(0)
        .map(() => service.updateModelsOnline(symbol, marketData, features));

      await expect(Promise.all(updates)).resolves.not.toThrow();
    });
  });
});
