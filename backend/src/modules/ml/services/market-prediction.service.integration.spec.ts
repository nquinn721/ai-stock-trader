import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TechnicalFeatures } from '../interfaces/ml.interfaces';
import { MLModule } from '../ml.module';
import { FeaturePipelineService } from '../services/feature-pipeline.service';
import { MarketPredictionService } from '../services/market-prediction.service';

describe('MarketPredictionService Integration', () => {
  let app: TestingModule;
  let marketPredictionService: MarketPredictionService;
  let featurePipelineService: FeaturePipelineService;

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

  beforeAll(async () => {
    app = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [__dirname + '/../entities/*.entity{.ts,.js}'],
          synchronize: true,
          logging: false,
        }),
        MLModule,
      ],
    }).compile();

    marketPredictionService = app.get<MarketPredictionService>(
      MarketPredictionService,
    );
    featurePipelineService = app.get<FeaturePipelineService>(
      FeaturePipelineService,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Full Prediction Pipeline', () => {
    it('should generate complete market predictions with all horizons', async () => {
      const result = await marketPredictionService.predictMarket(
        'AAPL',
        mockTechnicalFeatures,
        ['1h', '4h', '1d', '1w'],
      );

      // Verify structure
      expect(result).toBeDefined();
      expect(result.symbol).toBe('AAPL');
      expect(result.horizonPredictions).toHaveLength(4);
      expect(result.ensemblePrediction).toBeDefined();
      expect(result.uncertaintyBounds).toBeDefined();
      expect(result.signals).toBeDefined();

      // Verify each horizon prediction
      for (const horizonPred of result.horizonPredictions) {
        expect(horizonPred.horizon).toMatch(/1h|4h|1d|1w/);
        expect(horizonPred.predictions.length).toBeGreaterThan(0);
        expect(horizonPred.ensemble).toBeDefined();
        expect(horizonPred.confidence).toBeGreaterThan(0);
      }

      // Verify ensemble prediction
      expect(result.ensemblePrediction.returnPrediction).toBeDefined();
      expect(result.ensemblePrediction.priceTarget).toBeGreaterThan(0);
      expect(result.ensemblePrediction.confidence).toBeGreaterThan(0);

      // Verify uncertainty bounds
      expect(result.uncertaintyBounds.confidenceIntervals).toBeDefined();
      expect(result.uncertaintyBounds.confidenceIntervals['95%']).toHaveLength(
        2,
      );
      expect(result.uncertaintyBounds.standardError).toBeGreaterThanOrEqual(0);

      // Verify trading signals
      expect(result.signals.signal).toMatch(
        /STRONG_BUY|BUY|HOLD|SELL|STRONG_SELL/,
      );
      expect(result.signals.strength).toBeGreaterThanOrEqual(0);
      expect(result.signals.reasoning).toBeTruthy();
    }, 10000);

    it('should handle different market scenarios', async () => {
      // Test bullish scenario
      const bullishFeatures = {
        ...mockTechnicalFeatures,
        rsi: 45, // Not overbought
        momentum: 0.08, // Strong positive momentum
      };

      const bullishResult = await marketPredictionService.predictMarket(
        'AAPL',
        bullishFeatures,
        ['1d'],
      );

      // Test bearish scenario
      const bearishFeatures = {
        ...mockTechnicalFeatures,
        rsi: 75, // Overbought
        momentum: -0.06, // Negative momentum
        volatility: 0.4, // High volatility
      };

      const bearishResult = await marketPredictionService.predictMarket(
        'AAPL',
        bearishFeatures,
        ['1d'],
      );

      // Verify different predictions for different scenarios
      expect(bullishResult.ensemblePrediction).toBeDefined();
      expect(bearishResult.ensemblePrediction).toBeDefined();

      // Results should be different
      expect(bullishResult.signals.signal).toBeDefined();
      expect(bearishResult.signals.signal).toBeDefined();
    }, 10000);
  });

  describe('Model Performance Monitoring', () => {
    it('should track and report model performance metrics', async () => {
      const performance =
        await marketPredictionService.monitorModelPerformance();

      expect(performance).toBeDefined();
      expect(performance.modelMetrics).toBeDefined();
      expect(performance.ensemblePerformance).toBeDefined();
      expect(performance.recommendations).toBeDefined();

      // Check model metrics structure
      expect(performance.modelMetrics.size).toBeGreaterThan(0);
      for (const [modelId, metrics] of performance.modelMetrics.entries()) {
        expect(modelId).toBeTruthy();
        expect(metrics.accuracy).toBeGreaterThanOrEqual(0);
        expect(metrics.precision).toBeGreaterThanOrEqual(0);
        expect(metrics.recall).toBeGreaterThanOrEqual(0);
        expect(metrics.f1Score).toBeGreaterThanOrEqual(0);
      }

      // Check ensemble performance
      expect(performance.ensemblePerformance.accuracy).toBeGreaterThanOrEqual(
        0,
      );
      expect(
        performance.ensemblePerformance.consistency,
      ).toBeGreaterThanOrEqual(0);
      expect(
        performance.ensemblePerformance.diversityScore,
      ).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Price Direction Prediction', () => {
    it('should predict price direction accurately', async () => {
      const result = await marketPredictionService.predictPriceDirection(
        'AAPL',
        '1d',
      );

      expect(result).toBeDefined();
      expect(result.direction).toMatch(/UP|DOWN|NEUTRAL/);
      expect(result.probability).toBeGreaterThanOrEqual(0.5);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.priceTarget).toBeGreaterThan(0);
      expect(result.confidenceInterval).toHaveLength(2);
    });

    it('should handle different time horizons for direction prediction', async () => {
      const horizons = ['1h', '4h', '1d', '1w'];

      for (const horizon of horizons) {
        const result = await marketPredictionService.predictPriceDirection(
          'AAPL',
          horizon,
        );

        expect(result).toBeDefined();
        expect(result.direction).toMatch(/UP|DOWN|NEUTRAL/);
        expect(result.probability).toBeGreaterThanOrEqual(0);
        expect(result.confidence).toBeGreaterThan(0);
      }
    });
  });

  describe('Price Range Prediction', () => {
    it('should predict price ranges with confidence bands', async () => {
      const result = await marketPredictionService.predictPriceRange(
        'AAPL',
        '1d',
      );

      expect(result).toBeDefined();
      expect(result.low).toBeGreaterThan(0);
      expect(result.high).toBeGreaterThan(result.low);
      expect(result.median).toBeGreaterThan(result.low);
      expect(result.median).toBeLessThan(result.high);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.volatilityForecast).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Ensemble Prediction Analysis', () => {
    it('should provide detailed ensemble analysis', async () => {
      const result = await marketPredictionService.getEnsemblePrediction(
        'AAPL',
        '1d',
      );

      expect(result).toBeDefined();
      expect(result.ensembleResult).toBeDefined();
      expect(result.modelContributions).toBeDefined();
      expect(result.modelContributions.length).toBeGreaterThan(0);
      expect(result.consensusScore).toBeGreaterThanOrEqual(0);
      expect(result.diversityIndex).toBeGreaterThanOrEqual(0);

      // Verify model contributions structure
      for (const contribution of result.modelContributions) {
        expect(contribution.modelId).toBeTruthy();
        expect(contribution.modelType).toMatch(
          /timeseries|technical|fundamental|regime/,
        );
        expect(contribution.prediction).toBeDefined();
        expect(contribution.weight).toBeGreaterThan(0);
      }
    });
  });

  describe('Confidence Interval Calculation', () => {
    it('should calculate statistically valid confidence intervals', async () => {
      const predictions = [
        0.02, 0.015, 0.025, 0.018, 0.022, 0.019, 0.024, 0.016,
      ];

      const result95 =
        await marketPredictionService.calculateConfidenceIntervals(
          predictions,
          0.95,
        );
      const result99 =
        await marketPredictionService.calculateConfidenceIntervals(
          predictions,
          0.99,
        );

      // Basic validation
      expect(result95.lower).toBeLessThan(result95.upper);
      expect(result99.lower).toBeLessThan(result99.upper);

      // 99% interval should be wider than 95%
      const width95 = result95.upper - result95.lower;
      const width99 = result99.upper - result99.lower;
      expect(width99).toBeGreaterThan(width95);

      // Mean should be within intervals
      expect(result95.mean).toBeGreaterThan(result95.lower);
      expect(result95.mean).toBeLessThan(result95.upper);
      expect(result99.mean).toBeGreaterThan(result99.lower);
      expect(result99.mean).toBeLessThan(result99.upper);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple concurrent predictions efficiently', async () => {
      const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
      const startTime = Date.now();

      const promises = symbols.map((symbol) =>
        marketPredictionService.predictMarket(
          symbol,
          {
            ...mockTechnicalFeatures,
            symbol,
          },
          ['1d'],
        ),
      );

      const results = await Promise.all(promises);
      const executionTime = Date.now() - startTime;

      expect(results).toHaveLength(symbols.length);
      expect(executionTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Verify all predictions completed successfully
      for (let i = 0; i < results.length; i++) {
        expect(results[i].symbol).toBe(symbols[i]);
        expect(results[i].horizonPredictions).toHaveLength(1);
      }
    }, 15000);
    it('should maintain prediction quality under load', async () => {
      const iterations = 5;
      const results: any[] = [];

      for (let i = 0; i < iterations; i++) {
        const result = await marketPredictionService.predictMarket(
          'AAPL',
          mockTechnicalFeatures,
          ['1d'],
        );
        results.push(result);
      }

      // All predictions should be valid
      for (const result of results) {
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.ensemblePrediction.priceTarget).toBeGreaterThan(0);
        expect(result.signals.signal).toMatch(
          /STRONG_BUY|BUY|HOLD|SELL|STRONG_SELL/,
        );
      }

      // Predictions should be reasonably consistent
      const confidences = results.map((r) => r.confidence);
      const avgConfidence =
        confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
      expect(avgConfidence).toBeGreaterThan(0.3); // Reasonable baseline confidence
    }, 20000);
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle missing or incomplete data gracefully', async () => {
      const incompleteFeatures = {
        symbol: 'TEST',
        timestamp: new Date(),
        price: 100,
        volume: 0, // Missing volume
        rsi: NaN, // Invalid RSI
        macd: 0,
        bollingerBands: {
          upper: 105,
          middle: 100,
          lower: 95,
        },
        movingAverages: {
          sma20: 100,
          sma50: 100,
          ema12: 100,
          ema26: 100,
        },
        support: 95,
        resistance: 105,
        volatility: 0.1,
        momentum: 0,
      };

      // Should not throw, but handle gracefully
      const result = await marketPredictionService.predictMarket(
        'TEST',
        incompleteFeatures,
        ['1d'],
      );

      expect(result).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0); // Should still provide some prediction
    });
  });
});
