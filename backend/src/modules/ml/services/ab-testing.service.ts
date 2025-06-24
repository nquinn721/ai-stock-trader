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

  /**
   * S27E: Advanced A/B Testing Framework Features
   */

  /**
   * Multi-variate testing for multiple model variants
   */
  async createMultivariateTest(config: {
    testName: string;
    models: Array<{ id: string; name: string; trafficAllocation: number }>;
    successMetrics: string[];
    duration: number; // days
    confidenceLevel: number;
    minimumDetectableEffect: number;
  }): Promise<{
    testId: string;
    variants: Array<{ modelId: string; allocation: number }>;
    estimatedSampleSize: number;
    estimatedDuration: number;
  }> {
    const testId = `mv_test_${Date.now()}`;

    this.logger.log(
      `Creating multivariate test: ${config.testName} with ${config.models.length} variants`,
    );

    // Validate traffic allocations sum to 1.0
    const totalAllocation = config.models.reduce(
      (sum, model) => sum + model.trafficAllocation,
      0,
    );
    if (Math.abs(totalAllocation - 1.0) > 0.01) {
      throw new Error('Traffic allocations must sum to 100%');
    }

    // Calculate required sample size for each variant
    const estimatedSampleSize = this.calculateSampleSize(
      config.minimumDetectableEffect,
      config.confidenceLevel,
      config.models.length,
    );

    const estimatedDuration = Math.ceil(
      estimatedSampleSize / (1000 * config.duration),
    ); // Assuming 1000 requests/day

    // Store test configuration
    const testConfig = {
      testId,
      testName: config.testName,
      type: 'MULTIVARIATE',
      variants: config.models,
      successMetrics: config.successMetrics,
      duration: config.duration,
      confidenceLevel: config.confidenceLevel,
      minimumDetectableEffect: config.minimumDetectableEffect,
      estimatedSampleSize,
      startDate: new Date(),
      status: 'ACTIVE',
    };

    this.logger.log(
      `Multivariate test ${testId} created with estimated ${estimatedDuration} days duration`,
    );

    return {
      testId,
      variants: config.models.map((m) => ({
        modelId: m.id,
        allocation: m.trafficAllocation,
      })),
      estimatedSampleSize,
      estimatedDuration,
    };
  }

  /**
   * Advanced statistical analysis with multiple testing correction
   */
  async analyzeMultivariateTest(testId: string): Promise<{
    testId: string;
    results: Array<{
      modelId: string;
      modelName: string;
      sampleSize: number;
      metrics: Record<
        string,
        {
          value: number;
          confidenceInterval: [number, number];
          statisticalSignificance: number;
          pValue: number;
        }
      >;
      ranking: number;
    }>;
    overallRecommendation: {
      winnerModelId: string;
      confidence: number;
      liftOverBaseline: number;
      expectedImpact: string;
    };
    multipleTestingCorrection: {
      method: 'BONFERRONI' | 'BENJAMINI_HOCHBERG';
      adjustedSignificanceLevel: number;
      corrections: Array<{
        comparison: string;
        originalP: number;
        adjustedP: number;
      }>;
    };
  }> {
    this.logger.log(`Analyzing multivariate test: ${testId}`);

    // Mock analysis results - replace with actual statistical analysis
    const models = [
      { id: 'model_1', name: 'Baseline Model' },
      { id: 'model_2', name: 'Enhanced Model' },
      { id: 'model_3', name: 'Experimental Model' },
    ];

    const results = models.map((model, index) => {
      const basePerformance = 0.75 + Math.random() * 0.2;
      const sampleSize = Math.floor(1000 + Math.random() * 2000);

      return {
        modelId: model.id,
        modelName: model.name,
        sampleSize,
        metrics: {
          accuracy: {
            value: basePerformance,
            confidenceInterval: [
              basePerformance - 0.05,
              basePerformance + 0.05,
            ] as [number, number],
            statisticalSignificance: Math.random(),
            pValue: Math.random() * 0.1,
          },
          precision: {
            value: basePerformance - 0.02 + Math.random() * 0.04,
            confidenceInterval: [
              basePerformance - 0.07,
              basePerformance + 0.03,
            ] as [number, number],
            statisticalSignificance: Math.random(),
            pValue: Math.random() * 0.1,
          },
          recall: {
            value: basePerformance + 0.01 + Math.random() * 0.03,
            confidenceInterval: [
              basePerformance - 0.04,
              basePerformance + 0.06,
            ] as [number, number],
            statisticalSignificance: Math.random(),
            pValue: Math.random() * 0.1,
          },
        },
        ranking: index + 1,
      };
    });

    // Sort by primary metric (accuracy)
    results.sort((a, b) => b.metrics.accuracy.value - a.metrics.accuracy.value);
    results.forEach((result, index) => {
      result.ranking = index + 1;
    });

    const winner = results[0];
    const baseline =
      results.find((r) => r.modelName.includes('Baseline')) ||
      results[results.length - 1];
    const liftOverBaseline =
      ((winner.metrics.accuracy.value - baseline.metrics.accuracy.value) /
        baseline.metrics.accuracy.value) *
      100;

    // Multiple testing corrections
    const corrections = results.slice(1).map((model, index) => ({
      comparison: `${winner.modelId} vs ${model.modelId}`,
      originalP: model.metrics.accuracy.pValue,
      adjustedP: model.metrics.accuracy.pValue * (results.length - 1), // Bonferroni correction
    }));

    return {
      testId,
      results,
      overallRecommendation: {
        winnerModelId: winner.modelId,
        confidence: (1 - winner.metrics.accuracy.pValue) * 100,
        liftOverBaseline,
        expectedImpact: `Expected ${liftOverBaseline.toFixed(1)}% improvement in accuracy`,
      },
      multipleTestingCorrection: {
        method: 'BONFERRONI',
        adjustedSignificanceLevel: 0.05 / (results.length - 1),
        corrections,
      },
    };
  }

  /**
   * Sequential testing with early stopping rules
   */
  async evaluateSequentialTest(testId: string): Promise<{
    testId: string;
    currentSampleSize: number;
    minimumSampleSize: number;
    canStop: boolean;
    recommendation: 'STOP_FOR_SUCCESS' | 'STOP_FOR_FUTILITY' | 'CONTINUE';
    confidence: number;
    effect: number;
    remainingTime: number; // estimated days
  }> {
    this.logger.log(`Evaluating sequential test: ${testId}`);

    const currentSampleSize = Math.floor(500 + Math.random() * 1500);
    const minimumSampleSize = 1000;
    const observedEffect = (Math.random() - 0.5) * 0.2; // -10% to +10% effect
    const standardError = 0.02 + Math.random() * 0.01;

    const tStatistic = observedEffect / standardError;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(tStatistic)));

    let canStop = false;
    let recommendation: 'STOP_FOR_SUCCESS' | 'STOP_FOR_FUTILITY' | 'CONTINUE' =
      'CONTINUE';
    let confidence = 0;

    // Early stopping rules
    if (currentSampleSize >= minimumSampleSize) {
      if (pValue < 0.01 && Math.abs(observedEffect) > 0.05) {
        canStop = true;
        recommendation = 'STOP_FOR_SUCCESS';
        confidence = (1 - pValue) * 100;
      } else if (
        pValue > 0.8 ||
        (currentSampleSize > minimumSampleSize * 2 &&
          Math.abs(observedEffect) < 0.01)
      ) {
        canStop = true;
        recommendation = 'STOP_FOR_FUTILITY';
        confidence = 90;
      }
    }

    const remainingTime = canStop
      ? 0
      : Math.max(0, (minimumSampleSize - currentSampleSize) / 100); // Assuming 100 samples per day

    return {
      testId,
      currentSampleSize,
      minimumSampleSize,
      canStop,
      recommendation,
      confidence,
      effect: observedEffect,
      remainingTime,
    };
  }

  /**
   * Bandit testing for dynamic traffic allocation
   */
  async updateBanditAllocation(testId: string): Promise<{
    testId: string;
    strategy: 'EPSILON_GREEDY' | 'THOMPSON_SAMPLING' | 'UCB';
    allocations: Array<{
      modelId: string;
      allocation: number;
      expectedReward: number;
      confidence: number;
    }>;
    totalReward: number;
    regret: number;
  }> {
    this.logger.log(`Updating bandit allocation for test: ${testId}`);

    // Mock bandit implementation - replace with actual bandit algorithm
    const models = ['model_1', 'model_2', 'model_3'];
    const strategy = 'THOMPSON_SAMPLING';

    // Simulate Thompson Sampling
    const allocations = models.map((modelId) => {
      const alpha = 10 + Math.random() * 50; // Successes
      const beta = 5 + Math.random() * 20; // Failures
      const expectedReward = alpha / (alpha + beta);
      const confidence = Math.sqrt(
        (alpha * beta) / ((alpha + beta + 1) * Math.pow(alpha + beta, 2)),
      );

      return {
        modelId,
        allocation: expectedReward, // Will be normalized
        expectedReward,
        confidence,
      };
    });

    // Normalize allocations
    const totalExpected = allocations.reduce((sum, a) => sum + a.allocation, 0);
    allocations.forEach((a) => {
      a.allocation = a.allocation / totalExpected;
    });

    const totalReward = allocations.reduce(
      (sum, a) => sum + a.expectedReward * a.allocation,
      0,
    );
    const bestExpected = Math.max(...allocations.map((a) => a.expectedReward));
    const regret = bestExpected - totalReward;

    this.logger.log(
      `Bandit allocation updated: Best model gets ${Math.max(...allocations.map((a) => a.allocation)).toFixed(2)} traffic`,
    );

    return {
      testId,
      strategy,
      allocations,
      totalReward,
      regret,
    };
  }

  /**
   * Meta-analysis across multiple tests
   */
  async performMetaAnalysis(testIds: string[]): Promise<{
    testIds: string[];
    aggregatedResults: {
      overallEffect: number;
      confidenceInterval: [number, number];
      heterogeneity: number;
      pValue: number;
    };
    individualStudies: Array<{
      testId: string;
      effect: number;
      standardError: number;
      weight: number;
      contributionToOverall: number;
    }>;
    recommendations: {
      conclusion: string;
      reliability: 'HIGH' | 'MEDIUM' | 'LOW';
      applicability: string;
      futureResearch: string[];
    };
  }> {
    this.logger.log(`Performing meta-analysis across ${testIds.length} tests`);

    // Mock meta-analysis - replace with actual meta-analysis implementation
    const individualStudies = testIds.map((testId) => {
      const effect = (Math.random() - 0.5) * 0.3; // -15% to +15%
      const standardError = 0.01 + Math.random() * 0.02;
      const weight = 1 / (standardError * standardError);

      return {
        testId,
        effect,
        standardError,
        weight,
        contributionToOverall: 0, // Will be calculated
      };
    });

    // Calculate weighted average effect
    const totalWeight = individualStudies.reduce(
      (sum, study) => sum + study.weight,
      0,
    );
    const overallEffect =
      individualStudies.reduce(
        (sum, study) => sum + study.effect * study.weight,
        0,
      ) / totalWeight;

    // Calculate contributions
    individualStudies.forEach((study) => {
      study.contributionToOverall = (study.weight / totalWeight) * 100;
    });

    // Calculate heterogeneity (I²)
    const variance =
      individualStudies.reduce(
        (sum, study) =>
          sum + study.weight * Math.pow(study.effect - overallEffect, 2),
        0,
      ) / totalWeight;
    const heterogeneity = Math.max(0, (variance - 1) / variance) * 100;

    // Calculate confidence interval
    const standardErrorOverall = Math.sqrt(1 / totalWeight);
    const confidenceInterval: [number, number] = [
      overallEffect - 1.96 * standardErrorOverall,
      overallEffect + 1.96 * standardErrorOverall,
    ];

    // Calculate p-value
    const zScore = overallEffect / standardErrorOverall;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

    // Generate recommendations
    let reliability: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    if (heterogeneity < 25 && individualStudies.length >= 5) {
      reliability = 'HIGH';
    } else if (heterogeneity > 75 || individualStudies.length < 3) {
      reliability = 'LOW';
    }

    const conclusion =
      overallEffect > 0.05 && pValue < 0.05
        ? `Significant positive effect found (${(overallEffect * 100).toFixed(1)}% improvement)`
        : overallEffect < -0.05 && pValue < 0.05
          ? `Significant negative effect found (${(Math.abs(overallEffect) * 100).toFixed(1)}% degradation)`
          : 'No significant effect detected';

    return {
      testIds,
      aggregatedResults: {
        overallEffect,
        confidenceInterval,
        heterogeneity,
        pValue,
      },
      individualStudies,
      recommendations: {
        conclusion,
        reliability,
        applicability:
          reliability === 'HIGH'
            ? 'Results are highly applicable across contexts'
            : 'Results should be interpreted with caution',
        futureResearch: [
          'Conduct longer-term studies',
          'Test in different market conditions',
          'Investigate feature importance changes',
        ],
      },
    };
  }

  private calculateSampleSize(
    minimumDetectableEffect: number,
    confidenceLevel: number,
    numberOfVariants: number,
  ): number {
    // Simplified sample size calculation
    const alpha = 1 - confidenceLevel;
    const beta = 0.2; // 80% power
    const zAlpha = this.normalInverse(1 - alpha / (2 * numberOfVariants)); // Bonferroni correction
    const zBeta = this.normalInverse(1 - beta);

    const variance = 0.25; // Assumed variance for binary outcomes
    const sampleSize =
      (2 * variance * Math.pow(zAlpha + zBeta, 2)) /
      Math.pow(minimumDetectableEffect, 2);

    return Math.ceil(sampleSize);
  }

  private normalCDF(x: number): number {
    // Approximation of the cumulative distribution function of the standard normal distribution
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp((-x * x) / 2);
    const prob =
      d *
      t *
      (0.3193815 +
        t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
  }

  private normalInverse(p: number): number {
    // Approximation of the inverse of the cumulative distribution function
    if (p <= 0 || p >= 1) {
      throw new Error('Probability must be between 0 and 1');
    }

    // Beasley-Springer-Moro algorithm approximation
    const a = [
      0, -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
      1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
    ];
    const b = [
      0, -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
      6.680131188771972e1, -1.328068155288572e1,
    ];
    const c = [
      0, -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
      -2.549732539343734, 4.374664141464968, 2.938163982698783,
    ];
    const d = [
      0, 7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
      3.754408661907416,
    ];

    const pLow = 0.02425;
    const pHigh = 1 - pLow;

    let q: number, r: number, x: number;

    if (p < pLow) {
      q = Math.sqrt(-2 * Math.log(p));
      x =
        (((((c[1] * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) * q + c[6]) /
        ((((d[1] * q + d[2]) * q + d[3]) * q + d[4]) * q + 1);
    } else if (p <= pHigh) {
      q = p - 0.5;
      r = q * q;
      x =
        ((((((a[1] * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * r + a[6]) *
          q) /
        (((((b[1] * r + b[2]) * r + b[3]) * r + b[4]) * r + b[5]) * r + 1);
    } else {
      q = Math.sqrt(-2 * Math.log(1 - p));
      x =
        -(((((c[1] * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) * q + c[6]) /
        ((((d[1] * q + d[2]) * q + d[3]) * q + d[4]) * q + 1);
    }

    return x;
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
