import { Test, TestingModule } from '@nestjs/testing';
import { EnsembleSystemsService } from './ensemble-systems.service';
import { FeatureEngineeringService } from './feature-engineering.service';
import { MarketPredictionService } from './market-prediction.service';
import { PatternRecognitionService } from './pattern-recognition.service';
import { PredictiveAnalyticsService } from './predictive-analytics.service';
import { SentimentAnalysisService } from './sentiment-analysis.service';

describe('PredictiveAnalyticsService', () => {
  let service: PredictiveAnalyticsService;
  let marketPredictionService: jest.Mocked<MarketPredictionService>;
  let sentimentAnalysisService: jest.Mocked<SentimentAnalysisService>;
  let patternRecognitionService: jest.Mocked<PatternRecognitionService>;
  let ensembleSystemsService: jest.Mocked<EnsembleSystemsService>;
  let featureEngineeringService: jest.Mocked<FeatureEngineeringService>;

  beforeEach(async () => {
    const mockMarketPredictionService = {
      predictMarket: jest.fn(),
    };

    const mockSentimentAnalysisService = {
      analyzeSentimentAdvanced: jest.fn(),
    };

    const mockPatternRecognitionService = {
      detectMarketRegime: jest.fn(),
    };

    const mockEnsembleSystemsService = {
      generateEnsemblePrediction: jest.fn(),
    };

    const mockFeatureEngineeringService = {
      extractBreakoutFeatures: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PredictiveAnalyticsService,
        {
          provide: MarketPredictionService,
          useValue: mockMarketPredictionService,
        },
        {
          provide: SentimentAnalysisService,
          useValue: mockSentimentAnalysisService,
        },
        {
          provide: PatternRecognitionService,
          useValue: mockPatternRecognitionService,
        },
        {
          provide: EnsembleSystemsService,
          useValue: mockEnsembleSystemsService,
        },
        {
          provide: FeatureEngineeringService,
          useValue: mockFeatureEngineeringService,
        },
      ],
    }).compile();

    service = module.get<PredictiveAnalyticsService>(
      PredictiveAnalyticsService,
    );
    marketPredictionService = module.get(MarketPredictionService);
    sentimentAnalysisService = module.get(SentimentAnalysisService);
    patternRecognitionService = module.get(PatternRecognitionService);
    ensembleSystemsService = module.get(EnsembleSystemsService);
    featureEngineeringService = module.get(FeatureEngineeringService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRealTimePredictions', () => {
    it('should return comprehensive prediction data for a symbol', async () => {
      // Arrange
      const symbol = 'AAPL';
      const mockTechnicalFeatures = {
        symbol,
        timestamp: new Date(),
        price: 150,
        volume: 1000000,
        rsi: 60,
        macd: 0.5,
        bollingerBands: { upper: 155, middle: 150, lower: 145 },
        movingAverages: { sma20: 148, sma50: 145, ema12: 151, ema26: 149 },
        support: 145,
        resistance: 155,
        volatility: 0.25,
        momentum: 0.15,
      };

      const mockMarketPrediction = {
        symbol,
        timestamp: new Date(),
        horizonPredictions: [
          {
            horizon: '1h',
            predictions: [
              {
                modelId: 'test-model',
                modelType: 'timeseries' as const,
                prediction: {
                  direction: 'bullish',
                  targetPrice: 152,
                  confidence: 0.8,
                },
                weight: 1.0,
              },
            ],
            ensemble: {
              returnPrediction: 0.02,
              priceTarget: 152,
              confidence: 0.8,
            },
            confidence: 0.8,
            timestamp: new Date(),
          },
        ],
        ensemblePrediction: {
          returnPrediction: 0.02,
          priceTarget: 152,
          confidence: 0.8,
        },
        uncertaintyBounds: {
          prediction: 152,
          standardError: 2.5,
          confidenceIntervals: {
            '68%': [149.5, 154.5] as [number, number],
            '95%': [147, 157] as [number, number],
            '99%': [145, 159] as [number, number],
          },
          predictionInterval: [145, 159] as [number, number],
        },
        signals: {
          signal: 'BUY' as const,
          strength: 0.8,
          reasoning: 'Strong technical indicators',
          thresholds: {
            buyThreshold: 0.7,
            sellThreshold: 0.3,
            confidenceThreshold: 0.6,
            uncertaintyThreshold: 0.2,
          },
          riskMetrics: {
            maxDrawdown: 0.1,
            volatility: 0.25,
            sharpeRatio: 1.2,
          },
        },
        confidence: 0.8,
        modelVersions: {},
        executionTime: 100,
      };

      const mockEnsemblePrediction = {
        volatility: 0.25,
        confidenceInterval: { upper: 155, lower: 145 },
        riskMetrics: { maxDrawdown: 0.1, sharpeRatio: 1.2 },
        var95: 0.05,
        var99: 0.01,
        correlationRisk: 0.3,
      };

      featureEngineeringService.extractBreakoutFeatures.mockResolvedValue(
        mockTechnicalFeatures,
      );
      marketPredictionService.predictMarket.mockResolvedValue(
        mockMarketPrediction,
      );
      ensembleSystemsService.generateEnsemblePrediction.mockResolvedValue(
        mockEnsemblePrediction,
      );

      // Act
      const result = await service.getRealTimePredictions(symbol);

      // Assert
      expect(result).toBeDefined();
      expect(result.symbol).toBe(symbol);
      expect(result.predictions).toBeDefined();
      expect(result.sentiment).toBeDefined();
      expect(result.regime).toBeDefined();
      expect(result.riskMetrics).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(
        featureEngineeringService.extractBreakoutFeatures,
      ).toHaveBeenCalled();
      expect(marketPredictionService.predictMarket).toHaveBeenCalledTimes(3); // Called for 3 timeframes
      expect(
        ensembleSystemsService.generateEnsemblePrediction,
      ).toHaveBeenCalled();
    });

    it('should return fallback prediction when services fail', async () => {
      // Arrange
      const symbol = 'INVALID';
      featureEngineeringService.extractBreakoutFeatures.mockRejectedValue(
        new Error('Service error'),
      );
      marketPredictionService.predictMarket.mockRejectedValue(
        new Error('Service error'),
      );
      ensembleSystemsService.generateEnsemblePrediction.mockRejectedValue(
        new Error('Service error'),
      );

      // Act
      const result = await service.getRealTimePredictions(symbol);

      // Assert
      expect(result).toBeDefined();
      expect(result.symbol).toBe(symbol);
      expect(result.confidence).toBe(0.3); // Fallback confidence
    });
  });

  describe('getMultiTimeframePredictions', () => {
    it('should return predictions for all timeframes', async () => {
      // Arrange
      const symbol = 'AAPL';
      const mockTechnicalFeatures = {
        symbol,
        timestamp: new Date(),
        price: 150,
        volume: 1000000,
        rsi: 60,
        macd: 0.5,
        bollingerBands: { upper: 155, middle: 150, lower: 145 },
        movingAverages: { sma20: 148, sma50: 145, ema12: 151, ema26: 149 },
        support: 145,
        resistance: 155,
        volatility: 0.25,
        momentum: 0.15,
      };

      const mockPrediction = {
        symbol,
        timestamp: new Date(),
        horizonPredictions: [
          {
            horizon: '1h',
            predictions: [
              {
                modelId: 'test-model',
                modelType: 'timeseries' as const,
                prediction: {
                  direction: 'bullish',
                  targetPrice: 152,
                  confidence: 0.8,
                },
                weight: 1.0,
              },
            ],
            ensemble: {
              returnPrediction: 0.02,
              priceTarget: 152,
              confidence: 0.8,
            },
            confidence: 0.8,
            timestamp: new Date(),
          },
        ],
        ensemblePrediction: {
          returnPrediction: 0.02,
          priceTarget: 152,
          confidence: 0.8,
        },
        uncertaintyBounds: {
          prediction: 152,
          standardError: 2.5,
          confidenceIntervals: {
            '68%': [149.5, 154.5] as [number, number],
            '95%': [147, 157] as [number, number],
            '99%': [145, 159] as [number, number],
          },
          predictionInterval: [145, 159] as [number, number],
        },
        signals: {
          signal: 'BUY' as const,
          strength: 0.8,
          reasoning: 'Strong technical indicators',
          thresholds: {
            buyThreshold: 0.7,
            sellThreshold: 0.3,
            confidenceThreshold: 0.6,
            uncertaintyThreshold: 0.2,
          },
          riskMetrics: {
            maxDrawdown: 0.1,
            volatility: 0.25,
            sharpeRatio: 1.2,
          },
        },
        confidence: 0.8,
        modelVersions: {},
        executionTime: 100,
      };

      featureEngineeringService.extractBreakoutFeatures.mockResolvedValue(
        mockTechnicalFeatures,
      );
      marketPredictionService.predictMarket.mockResolvedValue(mockPrediction);

      // Act
      const result = await service.getMultiTimeframePredictions(symbol);

      // Assert
      expect(result).toBeDefined();
      expect(result.oneHour).toBeDefined();
      expect(result.fourHour).toBeDefined();
      expect(result.oneDay).toBeDefined();
      expect(marketPredictionService.predictMarket).toHaveBeenCalledTimes(3);
    });
  });

  describe('streamPredictions', () => {
    it('should return an observable of prediction updates', (done) => {
      // Arrange
      const symbol = 'AAPL';

      // Mock the getRealTimePredictions method
      const mockPrediction = {
        symbol,
        timestamp: new Date(),
        predictions: {
          oneHour: { direction: 'bullish', targetPrice: 152, confidence: 0.8 },
          fourHour: {
            direction: 'bullish',
            targetPrice: 155,
            confidence: 0.75,
          },
          oneDay: { direction: 'neutral', targetPrice: 150, confidence: 0.6 },
        },
        sentiment: { score: 0.1, confidence: 0.7 },
        regime: { current: 'bull', confidence: 0.8 },
        riskMetrics: { volatilityPrediction: 0.25 },
        confidence: 0.7,
      };

      jest
        .spyOn(service, 'getRealTimePredictions')
        .mockResolvedValue(mockPrediction as any);

      // Act & Assert
      const stream = service.streamPredictions(symbol);

      expect(stream).toBeDefined();

      // Subscribe to first emission and complete test
      stream.subscribe({
        next: (update) => {
          expect(update.type).toBe('prediction-update');
          expect(update.symbol).toBe(symbol);
          expect(update.data).toBeDefined();
          done();
        },
        error: done,
      });
    }, 10000); // 10 second timeout for async operation
  });

  describe('getLiveSentiment', () => {
    it('should return fallback sentiment data', async () => {
      // Act
      const result = await service.getLiveSentiment('AAPL');

      // Assert
      expect(result).toBeDefined();
      expect(result.score).toBe(0);
      expect(result.confidence).toBe(0.3);
      expect(result.trending).toBe('stable');
      expect(result.sources).toBeDefined();
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('getCurrentRegime', () => {
    it('should return fallback regime data', async () => {
      // Act
      const result = await service.getCurrentRegime('AAPL');

      // Assert
      expect(result).toBeDefined();
      expect(result.current).toBe('sideways');
      expect(result.confidence).toBe(0.3);
      expect(result.strength).toBe(0.5);
    });
  });

  describe('calculateRiskMetrics', () => {
    it('should return comprehensive risk metrics', async () => {
      // Arrange
      const symbol = 'AAPL';
      const mockTechnicalFeatures = {
        symbol,
        timestamp: new Date(),
        price: 150,
        volume: 1000000,
        rsi: 60,
        macd: 0.5,
        bollingerBands: { upper: 155, middle: 150, lower: 145 },
        movingAverages: { sma20: 148, sma50: 145, ema12: 151, ema26: 149 },
        support: 145,
        resistance: 155,
        volatility: 0.25,
        momentum: 0.15,
      };

      const mockEnsemblePrediction = {
        volatility: 0.25,
        confidenceInterval: { upper: 155, lower: 145 },
        riskMetrics: { maxDrawdown: 0.1, sharpeRatio: 1.2 },
        var95: 0.05,
        var99: 0.01,
        correlationRisk: 0.3,
      };

      featureEngineeringService.extractBreakoutFeatures.mockResolvedValue(
        mockTechnicalFeatures,
      );
      ensembleSystemsService.generateEnsemblePrediction.mockResolvedValue(
        mockEnsemblePrediction,
      );

      // Act
      const result = await service.calculateRiskMetrics(symbol);

      // Assert
      expect(result).toBeDefined();
      expect(result.volatilityPrediction).toBe(0.25);
      expect(result.confidenceBands).toBeDefined();
      expect(result.maxDrawdown).toBeDefined();
      expect(result.sharpeRatio).toBeDefined();
      expect(result.varPercentile).toBeDefined();
      expect(result.supportResistance).toBeDefined();
      expect(result.riskScore).toBeDefined();
    });
  });
});
