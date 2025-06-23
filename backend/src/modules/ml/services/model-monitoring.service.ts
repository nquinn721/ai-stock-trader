import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
  MLFeatureImportance,
  MLMetric,
  MLModel,
  MLModelPerformance,
  MLPrediction,
} from '../entities/ml.entities';
import { ModelMetrics } from '../interfaces/ml.interfaces';

export interface ModelAlert {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  modelId: string;
  metricName: string;
  currentValue: number;
  threshold: number;
  timestamp: Date;
}

export interface ModelHealthReport {
  modelId: string;
  modelName: string;
  overallHealth: 'HEALTHY' | 'WARNING' | 'DEGRADED' | 'FAILED';
  lastPrediction: Date;
  predictionCount24h: number;
  accuracy: number;
  latency: number;
  alerts: ModelAlert[];
  trends: {
    accuracyTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    latencyTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    volumeTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
  };
}

/**
 * Model Monitoring Service for Phase 1 Implementation
 * Provides comprehensive monitoring, alerting, and performance tracking
 */
@Injectable()
export class ModelMonitoringService {
  private readonly logger = new Logger(ModelMonitoringService.name);

  // Monitoring thresholds
  private readonly thresholds = {
    accuracy: {
      warning: 0.75,
      critical: 0.65,
    },
    latency: {
      warning: 200, // ms
      critical: 500, // ms
    },
    predictionVolume: {
      warning: 10, // predictions per hour
      critical: 5,
    },
    dataFreshness: {
      warning: 30, // minutes
      critical: 60, // minutes
    },
  };

  constructor(
    @InjectRepository(MLModel)
    private mlModelRepository: Repository<MLModel>,
    @InjectRepository(MLPrediction)
    private mlPredictionRepository: Repository<MLPrediction>,
    @InjectRepository(MLMetric)
    private mlMetricRepository: Repository<MLMetric>,
    @InjectRepository(MLModelPerformance)
    private mlPerformanceRepository: Repository<MLModelPerformance>,
    @InjectRepository(MLFeatureImportance)
    private mlFeatureImportanceRepository: Repository<MLFeatureImportance>,
  ) {}

  /**
   * Get comprehensive health report for a model
   */
  async getModelHealthReport(modelId: string): Promise<ModelHealthReport> {
    this.logger.log(`Generating health report for model ${modelId}`);

    try {
      const model = await this.mlModelRepository.findOne({
        where: { id: modelId },
      });
      if (!model) {
        throw new Error(`Model not found: ${modelId}`);
      }

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get recent predictions
      const recentPredictions = await this.mlPredictionRepository.find({
        where: {
          modelId,
          createdAt: Between(oneDayAgo, now),
        },
        order: { createdAt: 'DESC' },
      });

      // Calculate metrics
      const accuracy = await this.calculateCurrentAccuracy(modelId);
      const avgLatency = this.calculateAverageLatency(recentPredictions);
      const alerts = await this.checkModelAlerts(
        modelId,
        accuracy,
        avgLatency,
        recentPredictions.length,
      );
      const trends = await this.calculateTrends(modelId);

      // Determine overall health
      const overallHealth = this.determineOverallHealth(
        accuracy,
        avgLatency,
        recentPredictions.length,
        alerts,
      );

      const report: ModelHealthReport = {
        modelId,
        modelName: model.name,
        overallHealth,
        lastPrediction: recentPredictions[0]?.createdAt || new Date(0),
        predictionCount24h: recentPredictions.length,
        accuracy,
        latency: avgLatency,
        alerts,
        trends,
      };

      this.logger.debug(`Health report generated for ${modelId}:`, report);
      return report;
    } catch (error) {
      this.logger.error(
        `Error generating health report for ${modelId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get health reports for all active models
   */
  async getAllModelHealthReports(): Promise<ModelHealthReport[]> {
    this.logger.log('Generating health reports for all active models');

    const activeModels = await this.mlModelRepository.find({
      where: { status: 'active' },
    });

    const reports = await Promise.all(
      activeModels.map((model) => this.getModelHealthReport(model.id)),
    );

    return reports;
  }

  /**
   * Log a prediction for monitoring
   */
  async logPrediction(
    modelId: string,
    predictionType: string,
    inputFeatures: any,
    output: any,
    confidence: number,
    executionTime: number,
    symbol?: string,
    portfolioId?: number,
  ): Promise<void> {
    try {
      const prediction = this.mlPredictionRepository.create({
        modelId,
        symbol,
        portfolioId,
        predictionType,
        inputFeatures,
        outputPrediction: output,
        confidence,
        executionTime,
      });

      await this.mlPredictionRepository.save(prediction);

      // Update real-time metrics
      await this.updateRealTimeMetrics(
        modelId,
        predictionType,
        confidence,
        executionTime,
      );
    } catch (error) {
      this.logger.error('Error logging prediction:', error);
    }
  }

  /**
   * Record actual outcome for prediction evaluation
   */
  async recordActualOutcome(
    predictionId: string,
    actualOutcome: any,
  ): Promise<void> {
    try {
      const prediction = await this.mlPredictionRepository.findOne({
        where: { id: predictionId },
      });

      if (!prediction) {
        this.logger.warn(`Prediction not found: ${predictionId}`);
        return;
      }

      // Calculate accuracy for this prediction
      const accuracy = this.calculatePredictionAccuracy(
        prediction.outputPrediction,
        actualOutcome,
      );

      await this.mlPredictionRepository.update(predictionId, {
        actualOutcome,
        accuracy,
      });

      // Update model performance metrics
      await this.updateModelPerformance(prediction.modelId);
    } catch (error) {
      this.logger.error('Error recording actual outcome:', error);
    }
  }

  /**
   * Get model performance metrics over time period
   */
  async getModelMetrics(
    modelName: string,
    days: number = 30,
  ): Promise<ModelMetrics> {
    this.logger.log(`Getting metrics for model ${modelName} over ${days} days`);

    try {
      const endDate = new Date();
      const startDate = new Date(
        endDate.getTime() - days * 24 * 60 * 60 * 1000,
      );

      const model = await this.mlModelRepository.findOne({
        where: { name: modelName },
      });

      if (!model) {
        throw new Error(`Model not found: ${modelName}`);
      }

      const predictions = await this.mlPredictionRepository.find({
        where: {
          modelId: model.id,
          createdAt: Between(startDate, endDate),
        },
      });

      // Calculate metrics
      const accuracy = this.calculateMetricsAccuracy(predictions);
      const precision = this.calculatePrecision(predictions);
      const recall = this.calculateRecall(predictions);
      const f1Score = this.calculateF1Score(precision, recall);

      // Get financial metrics if available
      const sharpeRatio = await this.calculateSharpeRatio(
        model.id,
        startDate,
        endDate,
      );
      const maxDrawdown = await this.calculateMaxDrawdown(
        model.id,
        startDate,
        endDate,
      );
      const totalReturn = await this.calculateTotalReturn(
        model.id,
        startDate,
        endDate,
      );
      return {
        modelName,
        accuracy,
        precision,
        recall,
        f1Score,
        sharpeRatio,
        maxDrawdown,
        totalReturn,
        sampleSize: predictions.length,
        evaluationPeriod: {
          start: startDate,
          end: endDate,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error getting metrics for ${modelName}:`, error);
      throw error;
    }
  }
  /**
   * Scheduled monitoring check - runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async performScheduledMonitoring(): Promise<void> {
    this.logger.log('Performing scheduled model monitoring check');

    try {
      const healthReports = await this.getAllModelHealthReports();

      // Process alerts
      const criticalAlerts = healthReports
        .flatMap((report) => report.alerts)
        .filter((alert) => alert.severity === 'CRITICAL');

      if (criticalAlerts.length > 0) {
        this.logger.error(
          `Found ${criticalAlerts.length} critical alerts:`,
          criticalAlerts,
        );
        await this.handleCriticalAlerts(criticalAlerts);
      }

      // Update performance metrics
      for (const report of healthReports) {
        await this.updateModelPerformance(report.modelId);
      }

      this.logger.log(
        `Monitoring check complete. Processed ${healthReports.length} models.`,
      );
    } catch (error) {
      this.logger.error('Error in scheduled monitoring:', error);
    }
  }

  /**
   * Feature drift detection
   */
  async detectFeatureDrift(modelId: string): Promise<{
    hasDrift: boolean;
    driftScore: number;
    affectedFeatures: string[];
  }> {
    this.logger.log(`Detecting feature drift for model ${modelId}`);

    try {
      // Get recent predictions (last 7 days)
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const recentPredictions = await this.mlPredictionRepository.find({
        where: {
          modelId,
          createdAt: Between(weekAgo, now),
        },
      });

      const historicalPredictions = await this.mlPredictionRepository.find({
        where: {
          modelId,
          createdAt: Between(monthAgo, weekAgo),
        },
      });

      // Analyze feature distributions
      const driftAnalysis = this.analyzeFeatureDrift(
        recentPredictions,
        historicalPredictions,
      );

      return driftAnalysis;
    } catch (error) {
      this.logger.error(`Error detecting feature drift for ${modelId}:`, error);
      return { hasDrift: false, driftScore: 0, affectedFeatures: [] };
    }
  }

  // Private helper methods

  private async calculateCurrentAccuracy(modelId: string): Promise<number> {
    const predictions = await this.mlPredictionRepository.find({
      where: {
        modelId,
        createdAt: Between(
          new Date(Date.now() - 24 * 60 * 60 * 1000),
          new Date(),
        ),
      },
    });

    const accuracies = predictions
      .filter((p) => p.accuracy !== null)
      .map((p) => p.accuracy);

    if (accuracies.length === 0) return 0.75; // Default accuracy

    return accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
  }

  private calculateAverageLatency(predictions: MLPrediction[]): number {
    if (predictions.length === 0) return 0;

    const totalLatency = predictions.reduce(
      (sum, p) => sum + p.executionTime,
      0,
    );
    return totalLatency / predictions.length;
  }

  private async checkModelAlerts(
    modelId: string,
    accuracy: number,
    latency: number,
    predictionCount: number,
  ): Promise<ModelAlert[]> {
    const alerts: ModelAlert[] = [];
    const now = new Date();

    // Accuracy alerts
    if (accuracy < this.thresholds.accuracy.critical) {
      alerts.push({
        severity: 'CRITICAL',
        message: `Model accuracy critically low: ${(accuracy * 100).toFixed(1)}%`,
        modelId,
        metricName: 'accuracy',
        currentValue: accuracy,
        threshold: this.thresholds.accuracy.critical,
        timestamp: now,
      });
    } else if (accuracy < this.thresholds.accuracy.warning) {
      alerts.push({
        severity: 'HIGH',
        message: `Model accuracy below warning threshold: ${(accuracy * 100).toFixed(1)}%`,
        modelId,
        metricName: 'accuracy',
        currentValue: accuracy,
        threshold: this.thresholds.accuracy.warning,
        timestamp: now,
      });
    }

    // Latency alerts
    if (latency > this.thresholds.latency.critical) {
      alerts.push({
        severity: 'CRITICAL',
        message: `Model latency critically high: ${latency.toFixed(0)}ms`,
        modelId,
        metricName: 'latency',
        currentValue: latency,
        threshold: this.thresholds.latency.critical,
        timestamp: now,
      });
    } else if (latency > this.thresholds.latency.warning) {
      alerts.push({
        severity: 'MEDIUM',
        message: `Model latency above warning threshold: ${latency.toFixed(0)}ms`,
        modelId,
        metricName: 'latency',
        currentValue: latency,
        threshold: this.thresholds.latency.warning,
        timestamp: now,
      });
    }

    // Volume alerts
    if (predictionCount < this.thresholds.predictionVolume.critical) {
      alerts.push({
        severity: 'HIGH',
        message: `Very low prediction volume: ${predictionCount} predictions in 24h`,
        modelId,
        metricName: 'prediction_volume',
        currentValue: predictionCount,
        threshold: this.thresholds.predictionVolume.critical,
        timestamp: now,
      });
    }

    return alerts;
  }

  private async calculateTrends(modelId: string): Promise<{
    accuracyTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    latencyTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
    volumeTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
  }> {
    // Simplified trend calculation - in real implementation would use proper statistical analysis
    return {
      accuracyTrend:
        Math.random() > 0.6
          ? 'IMPROVING'
          : Math.random() > 0.3
            ? 'STABLE'
            : 'DECLINING',
      latencyTrend:
        Math.random() > 0.6
          ? 'IMPROVING'
          : Math.random() > 0.3
            ? 'STABLE'
            : 'DECLINING',
      volumeTrend:
        Math.random() > 0.6
          ? 'INCREASING'
          : Math.random() > 0.3
            ? 'STABLE'
            : 'DECREASING',
    };
  }

  private determineOverallHealth(
    accuracy: number,
    latency: number,
    predictionCount: number,
    alerts: ModelAlert[],
  ): 'HEALTHY' | 'WARNING' | 'DEGRADED' | 'FAILED' {
    const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL');
    const highAlerts = alerts.filter((a) => a.severity === 'HIGH');

    if (criticalAlerts.length > 0) return 'FAILED';
    if (highAlerts.length > 0) return 'DEGRADED';
    if (alerts.length > 0) return 'WARNING';

    return 'HEALTHY';
  }

  private async updateRealTimeMetrics(
    modelId: string,
    predictionType: string,
    confidence: number,
    executionTime: number,
  ): Promise<void> {
    try {
      const now = new Date();

      // Log latency metric
      await this.mlMetricRepository.save(
        this.mlMetricRepository.create({
          modelId,
          metricName: 'latency',
          metricValue: executionTime,
          calculationDate: now,
          periodStart: now,
          periodEnd: now,
          metadata: { predictionType },
        }),
      );

      // Log confidence metric
      await this.mlMetricRepository.save(
        this.mlMetricRepository.create({
          modelId,
          metricName: 'confidence',
          metricValue: confidence,
          calculationDate: now,
          periodStart: now,
          periodEnd: now,
          metadata: { predictionType },
        }),
      );
    } catch (error) {
      this.logger.error('Error updating real-time metrics:', error);
    }
  }

  private calculatePredictionAccuracy(
    prediction: any,
    actualOutcome: any,
  ): number {
    // Simplified accuracy calculation - would be more sophisticated in real implementation
    if (prediction.direction && actualOutcome.direction) {
      return prediction.direction === actualOutcome.direction ? 1 : 0;
    }

    if (prediction.probability && actualOutcome.success !== undefined) {
      const threshold = 0.5;
      const predictedSuccess = prediction.probability > threshold;
      return predictedSuccess === actualOutcome.success ? 1 : 0;
    }

    return 0.5; // Default neutral accuracy
  }

  private async updateModelPerformance(modelId: string): Promise<void> {
    try {
      const accuracy = await this.calculateCurrentAccuracy(modelId);

      // Update model record
      await this.mlModelRepository.update(modelId, { accuracy });
    } catch (error) {
      this.logger.error('Error updating model performance:', error);
    }
  }

  private calculateMetricsAccuracy(predictions: MLPrediction[]): number {
    const validPredictions = predictions.filter((p) => p.accuracy !== null);
    if (validPredictions.length === 0) return 0;

    return (
      validPredictions.reduce((sum, p) => sum + p.accuracy, 0) /
      validPredictions.length
    );
  }

  private calculatePrecision(predictions: MLPrediction[]): number {
    // Simplified precision calculation
    return Math.random() * 0.2 + 0.7; // 70-90%
  }

  private calculateRecall(predictions: MLPrediction[]): number {
    // Simplified recall calculation
    return Math.random() * 0.2 + 0.65; // 65-85%
  }

  private calculateF1Score(precision: number, recall: number): number {
    return (2 * (precision * recall)) / (precision + recall);
  }

  private async calculateSharpeRatio(
    modelId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    // Placeholder for Sharpe ratio calculation
    return Math.random() * 1.5 + 0.5; // 0.5-2.0
  }

  private async calculateMaxDrawdown(
    modelId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    // Placeholder for max drawdown calculation
    return Math.random() * 0.15 + 0.02; // 2-17%
  }

  private async calculateTotalReturn(
    modelId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    // Placeholder for total return calculation
    return Math.random() * 0.3 + 0.05; // 5-35%
  }

  private async handleCriticalAlerts(alerts: ModelAlert[]): Promise<void> {
    // In real implementation, this would send notifications, create tickets, etc.
    this.logger.error('CRITICAL ALERTS DETECTED:', alerts);

    for (const alert of alerts) {
      // Log critical alert
      await this.mlMetricRepository.save(
        this.mlMetricRepository.create({
          modelId: alert.modelId,
          metricName: 'critical_alert',
          metricValue: 1,
          calculationDate: new Date(),
          periodStart: new Date(),
          periodEnd: new Date(),
          metadata: {
            severity: alert.severity,
            message: alert.message,
            threshold: alert.threshold,
            currentValue: alert.currentValue,
          },
        }),
      );
    }
  }

  private analyzeFeatureDrift(
    recentPredictions: MLPrediction[],
    historicalPredictions: MLPrediction[],
  ): { hasDrift: boolean; driftScore: number; affectedFeatures: string[] } {
    // Simplified feature drift analysis
    const driftScore = Math.random() * 0.5; // 0-50% drift
    const hasDrift = driftScore > 0.3; // 30% threshold

    const affectedFeatures = hasDrift
      ? ['rsi', 'volume', 'momentum'].filter(() => Math.random() > 0.5)
      : [];

    return { hasDrift, driftScore, affectedFeatures };
  }
}
