import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MLABTest } from '../entities/ml.entities';

export interface ABTestConfig {
  testName: string;
  controlModelId: string;
  variantModelId: string;
  trafficSplit: number; // 0.5 = 50/50 split
  startDate: Date;
  endDate?: Date;
  successMetric: string;
  minimumSampleSize: number;
}

export interface ABTestResult {
  testId: string;
  controlPerformance: number;
  variantPerformance: number;
  statisticalSignificance: number;
  confidence: number;
  recommendation:
    | 'USE_CONTROL'
    | 'USE_VARIANT'
    | 'CONTINUE_TEST'
    | 'INCONCLUSIVE';
  sampleSize: number;
}

/**
 * A/B Testing Service for ML Model Validation
 * Phase 1 Implementation: Framework for testing ML model improvements
 */
@Injectable()
export class ABTestingService {
  private readonly logger = new Logger(ABTestingService.name);
  private activeTests: Map<string, ABTestConfig> = new Map();

  constructor(
    @InjectRepository(MLABTest)
    private abTestRepository: Repository<MLABTest>,
  ) {
    this.initializeActiveTests();
  }
  /**
   * Create a new A/B test for ML model comparison
   */
  async createABTest(config: ABTestConfig): Promise<string> {
    this.logger.log(`Creating A/B test: ${config.testName}`);

    try {
      const abTest = this.abTestRepository.create({
        testName: config.testName,
        controlModelId: config.controlModelId,
        variantModelId: config.variantModelId,
        trafficSplit: config.trafficSplit,
        startDate: config.startDate,
        endDate: config.endDate,
        status: 'running',
        hypothesis: `Testing ${config.variantModelId} vs ${config.controlModelId} for ${config.successMetric}`,
        results: {
          successMetric: config.successMetric,
          minimumSampleSize: config.minimumSampleSize,
          createdBy: 'system',
          purpose: 'ml-model-comparison',
        },
      });

      const savedTest = await this.abTestRepository.save(abTest);
      this.activeTests.set(savedTest.id, config);

      this.logger.log(`A/B test created with ID: ${savedTest.id}`);
      return savedTest.id;
    } catch (error) {
      this.logger.error('Error creating A/B test:', error);
      throw error;
    }
  }

  /**
   * Determine which model to use for a prediction based on active A/B tests
   */
  async getModelForPrediction(
    predictionType: string,
    userId?: string,
  ): Promise<string> {
    const activeTest = this.findActiveTestForType(predictionType);

    if (!activeTest) {
      return this.getDefaultModelId(predictionType);
    }

    // Determine assignment based on user ID or random assignment
    const assignment = this.getTestAssignment(activeTest.testName, userId);

    return assignment === 'CONTROL'
      ? activeTest.controlModelId
      : activeTest.variantModelId;
  }

  /**
   * Record a prediction result for A/B test analysis
   */
  async recordTestResult(
    testId: string,
    modelId: string,
    prediction: any,
    actualOutcome?: any,
  ): Promise<void> {
    try {
      // Store the result for later analysis
      const testResult = {
        testId,
        modelId,
        prediction,
        actualOutcome,
        timestamp: new Date(),
      };

      // In a real implementation, this would go to a specialized results table
      this.logger.debug(
        `Recording A/B test result for test ${testId}`,
        testResult,
      );
    } catch (error) {
      this.logger.error('Error recording A/B test result:', error);
    }
  }

  /**
   * Analyze A/B test results and provide recommendations
   */
  async analyzeTestResults(testId: string): Promise<ABTestResult> {
    this.logger.log(`Analyzing A/B test results for ${testId}`);

    try {
      const test = await this.abTestRepository.findOne({
        where: { id: testId },
      });
      if (!test) {
        throw new Error(`A/B test not found: ${testId}`);
      }

      // Get performance metrics for both models
      const controlPerformance = await this.getModelPerformance(
        test.controlModelId,
        test.startDate,
      );
      const variantPerformance = await this.getModelPerformance(
        test.variantModelId,
        test.startDate,
      );

      // Calculate statistical significance
      const statSig = this.calculateStatisticalSignificance(
        controlPerformance,
        variantPerformance,
        test.minimumSampleSize,
      );

      const result: ABTestResult = {
        testId,
        controlPerformance: controlPerformance.value,
        variantPerformance: variantPerformance.value,
        statisticalSignificance: statSig.pValue,
        confidence: statSig.confidence,
        recommendation: this.getRecommendation(
          controlPerformance.value,
          variantPerformance.value,
          statSig.pValue,
          Math.min(
            controlPerformance.sampleSize,
            variantPerformance.sampleSize,
          ),
        ),
        sampleSize: Math.min(
          controlPerformance.sampleSize,
          variantPerformance.sampleSize,
        ),
      };

      this.logger.log(`A/B test analysis complete:`, result);
      return result;
    } catch (error) {
      this.logger.error('Error analyzing A/B test results:', error);
      throw error;
    }
  }

  /**
   * Stop an active A/B test
   */
  async stopABTest(testId: string, reason: string): Promise<void> {
    this.logger.log(`Stopping A/B test ${testId}: ${reason}`);

    try {
      await this.abTestRepository.update(testId, {
        status: 'completed',
        endDate: new Date(),
        conclusion: reason,
      });

      this.activeTests.delete(testId);
    } catch (error) {
      this.logger.error('Error stopping A/B test:', error);
      throw error;
    }
  }
  /**
   * Get all active A/B tests
   */
  async getActiveTests(): Promise<MLABTest[]> {
    return this.abTestRepository.find({
      where: { status: 'running' },
    });
  }

  /**
   * Create default A/B tests for Phase 1 ML models
   */
  async createPhase1ABTests(): Promise<void> {
    this.logger.log('Creating Phase 1 A/B tests for ML models');

    // Test 1: Breakout Detection Model
    await this.createABTest({
      testName: 'breakout-detection-v1-vs-baseline',
      controlModelId: 'breakout-baseline',
      variantModelId: 'breakout-neural-ensemble-v1',
      trafficSplit: 0.5,
      startDate: new Date(),
      successMetric: 'breakout_accuracy',
      minimumSampleSize: 1000,
    });

    // Test 2: Risk Management Model
    await this.createABTest({
      testName: 'risk-management-v1-vs-baseline',
      controlModelId: 'risk-static-rules',
      variantModelId: 'risk-dqn-v1',
      trafficSplit: 0.3, // More conservative for risk model
      startDate: new Date(),
      successMetric: 'portfolio_volatility_reduction',
      minimumSampleSize: 500,
    });

    // Test 3: Feature Engineering Pipeline
    await this.createABTest({
      testName: 'feature-engineering-v1-vs-baseline',
      controlModelId: 'features-basic',
      variantModelId: 'features-advanced-v1',
      trafficSplit: 0.8, // High confidence in improved features
      startDate: new Date(),
      successMetric: 'prediction_accuracy',
      minimumSampleSize: 2000,
    });
  }

  // Private helper methods

  private async initializeActiveTests(): Promise<void> {
    try {
      const activeTests = await this.getActiveTests();

      for (const test of activeTests) {
        const config: ABTestConfig = {
          testName: test.testName,
          controlModelId: test.controlModelId,
          variantModelId: test.variantModelId,
          trafficSplit: test.trafficSplit,
          startDate: test.startDate,
          endDate: test.endDate,
          successMetric: test.results?.successMetric || 'accuracy',
          minimumSampleSize: test.results?.minimumSampleSize || 1000,
        };

        this.activeTests.set(test.id, config);
      }

      this.logger.log(`Initialized ${activeTests.length} active A/B tests`);
    } catch (error) {
      this.logger.error('Error initializing active tests:', error);
    }
  }

  private findActiveTestForType(predictionType: string): ABTestConfig | null {
    for (const [testId, config] of this.activeTests) {
      if (config.testName.includes(predictionType)) {
        return config;
      }
    }
    return null;
  }

  private getTestAssignment(
    testName: string,
    userId?: string,
  ): 'CONTROL' | 'VARIANT' {
    // Deterministic assignment based on user ID or session
    const seed = userId ? this.hashString(userId) : Math.random();
    const activeTest = Array.from(this.activeTests.values()).find(
      (t) => t.testName === testName,
    );

    if (!activeTest) return 'CONTROL';

    return seed < activeTest.trafficSplit ? 'VARIANT' : 'CONTROL';
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
  }

  private getDefaultModelId(predictionType: string): string {
    const defaultModels = {
      breakout: 'breakout-baseline',
      risk: 'risk-static-rules',
      sentiment: 'sentiment-baseline',
      portfolio: 'portfolio-baseline',
    };

    return defaultModels[predictionType] || 'default-model';
  }

  private async getModelPerformance(
    modelId: string,
    startDate: Date,
  ): Promise<{
    value: number;
    sampleSize: number;
  }> {
    // In a real implementation, this would query the MLPrediction table
    // and calculate actual performance metrics

    // Simulate performance data for now
    const isVariant =
      modelId.includes('v1') ||
      modelId.includes('neural') ||
      modelId.includes('dqn');
    const basePerformance = 0.65; // 65% baseline accuracy
    const improvement = isVariant ? Math.random() * 0.15 + 0.05 : 0; // 5-20% improvement for variants

    return {
      value: Math.min(basePerformance + improvement, 0.95),
      sampleSize: Math.floor(Math.random() * 1000) + 500, // 500-1500 samples
    };
  }

  private calculateStatisticalSignificance(
    control: { value: number; sampleSize: number },
    variant: { value: number; sampleSize: number },
    minimumSampleSize: number,
  ): { pValue: number; confidence: number } {
    // Simplified statistical significance calculation
    // In real implementation, use proper statistical tests

    const pooledStdErr = Math.sqrt(
      (control.value * (1 - control.value)) / control.sampleSize +
        (variant.value * (1 - variant.value)) / variant.sampleSize,
    );

    const zScore = Math.abs(variant.value - control.value) / pooledStdErr;

    // Convert z-score to p-value (simplified)
    const pValue = Math.max(0.001, 2 * (1 - this.normalCDF(Math.abs(zScore))));
    const confidence = 1 - pValue;

    return { pValue, confidence };
  }
  private normalCDF(x: number): number {
    // Simplified normal cumulative distribution function approximation
    // Using Abramowitz and Stegun approximation
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * x);
    const y =
      1.0 -
      ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  private getRecommendation(
    controlPerf: number,
    variantPerf: number,
    pValue: number,
    sampleSize: number,
  ): 'USE_CONTROL' | 'USE_VARIANT' | 'CONTINUE_TEST' | 'INCONCLUSIVE' {
    const significanceThreshold = 0.05;
    const minSampleThreshold = 500;
    const minImprovementThreshold = 0.02; // 2% minimum improvement

    if (sampleSize < minSampleThreshold) {
      return 'CONTINUE_TEST';
    }

    if (pValue > significanceThreshold) {
      return 'INCONCLUSIVE';
    }

    const improvement = variantPerf - controlPerf;

    if (
      improvement > minImprovementThreshold &&
      pValue < significanceThreshold
    ) {
      return 'USE_VARIANT';
    } else if (
      improvement < -minImprovementThreshold &&
      pValue < significanceThreshold
    ) {
      return 'USE_CONTROL';
    } else {
      return 'CONTINUE_TEST';
    }
  }
}
