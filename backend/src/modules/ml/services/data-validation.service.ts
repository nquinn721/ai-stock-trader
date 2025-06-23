import { Injectable, Logger } from '@nestjs/common';
import { MarketDataPoint } from './data-ingestion.service';
import { FeatureSet } from './feature-pipeline.service';

export interface ValidationRule {
  name: string;
  description: string;
  check: (data: any) => ValidationResult;
  severity: 'error' | 'warning' | 'info';
  category: 'data_quality' | 'business_logic' | 'technical' | 'statistical';
}

export interface ValidationResult {
  passed: boolean;
  message: string;
  score: number; // 0-1, where 1 is perfect
  metadata?: Record<string, any>;
}

export interface DataQualityReport {
  overall_score: number;
  total_checks: number;
  passed_checks: number;
  failed_checks: number;
  warnings: number;
  timestamp: Date;
  symbol?: string;
  validation_results: Array<{
    rule_name: string;
    result: ValidationResult;
    severity: string;
  }>;
  recommendations: string[];
}

export interface OutlierDetectionResult {
  outliers: Array<{
    index: number;
    value: number;
    z_score: number;
    type: 'mild' | 'extreme';
  }>;
  outlier_percentage: number;
  clean_data_percentage: number;
}

@Injectable()
export class DataValidationService {
  private readonly logger = new Logger(DataValidationService.name);
  private readonly validationRules: ValidationRule[] = [];

  constructor() {
    this.initializeValidationRules();
    this.logger.log('Data Validation Service initialized');
  }

  /**
   * Initialize standard validation rules
   */
  private initializeValidationRules(): void {
    // Market data validation rules
    this.validationRules.push(
      {
        name: 'price_positive',
        description: 'All price values must be positive',
        check: (data: MarketDataPoint[]) => this.checkPositivePrices(data),
        severity: 'error',
        category: 'data_quality',
      },
      {
        name: 'volume_non_negative',
        description: 'Volume values must be non-negative',
        check: (data: MarketDataPoint[]) => this.checkNonNegativeVolume(data),
        severity: 'error',
        category: 'data_quality',
      },
      {
        name: 'ohlc_logical',
        description: 'OHLC values must follow logical relationships',
        check: (data: MarketDataPoint[]) => this.checkOHLCLogic(data),
        severity: 'error',
        category: 'business_logic',
      },
      {
        name: 'price_continuity',
        description: 'Price changes should be reasonable (no extreme gaps)',
        check: (data: MarketDataPoint[]) => this.checkPriceContinuity(data),
        severity: 'warning',
        category: 'business_logic',
      },
      {
        name: 'sufficient_data',
        description: 'Sufficient data points for analysis',
        check: (data: MarketDataPoint[]) => this.checkDataSufficiency(data),
        severity: 'warning',
        category: 'technical',
      },
      {
        name: 'timestamp_ordering',
        description: 'Timestamps must be in chronological order',
        check: (data: MarketDataPoint[]) => this.checkTimestampOrdering(data),
        severity: 'error',
        category: 'data_quality',
      },
      {
        name: 'duplicate_timestamps',
        description: 'No duplicate timestamps allowed',
        check: (data: MarketDataPoint[]) => this.checkDuplicateTimestamps(data),
        severity: 'warning',
        category: 'data_quality',
      },
      {
        name: 'missing_data_gaps',
        description: 'Check for significant data gaps',
        check: (data: MarketDataPoint[]) => this.checkDataGaps(data),
        severity: 'info',
        category: 'technical',
      },
      {
        name: 'volume_consistency',
        description: 'Volume should be consistent with market hours',
        check: (data: MarketDataPoint[]) => this.checkVolumeConsistency(data),
        severity: 'warning',
        category: 'business_logic',
      },
      {
        name: 'statistical_outliers',
        description: 'Detect statistical outliers in price movements',
        check: (data: MarketDataPoint[]) => this.checkStatisticalOutliers(data),
        severity: 'info',
        category: 'statistical',
      },
    );

    // Feature validation rules
    this.validationRules.push(
      {
        name: 'feature_completeness',
        description: 'All expected features are present',
        check: (data: FeatureSet[]) => this.checkFeatureCompleteness(data),
        severity: 'error',
        category: 'technical',
      },
      {
        name: 'feature_range_validation',
        description: 'Features are within expected ranges',
        check: (data: FeatureSet[]) => this.checkFeatureRanges(data),
        severity: 'warning',
        category: 'technical',
      },
      {
        name: 'nan_inf_check',
        description: 'No NaN or infinite values in features',
        check: (data: FeatureSet[]) => this.checkNaNInfValues(data),
        severity: 'error',
        category: 'data_quality',
      },
    );

    this.logger.log(
      `Initialized ${this.validationRules.length} validation rules`,
    );
  }

  /**
   * Validate market data
   */
  async validateMarketData(
    data: MarketDataPoint[],
    symbol?: string,
  ): Promise<DataQualityReport> {
    this.logger.debug(
      `Validating market data: ${data.length} points${symbol ? ` for ${symbol}` : ''}`,
    );

    const marketDataRules = this.validationRules.filter((rule) =>
      ['data_quality', 'business_logic', 'technical', 'statistical'].includes(
        rule.category,
      ),
    );

    return this.runValidation(data, marketDataRules, symbol);
  }

  /**
   * Validate feature data
   */
  async validateFeatureData(
    data: FeatureSet[],
    symbol?: string,
  ): Promise<DataQualityReport> {
    this.logger.debug(
      `Validating feature data: ${data.length} feature sets${symbol ? ` for ${symbol}` : ''}`,
    );

    const featureDataRules = this.validationRules.filter(
      (rule) => rule.name.includes('feature') || rule.name.includes('nan_inf'),
    );

    return this.runValidation(data, featureDataRules, symbol);
  }

  /**
   * Run validation rules against data
   */
  private runValidation(
    data: any,
    rules: ValidationRule[],
    symbol?: string,
  ): DataQualityReport {
    const results: Array<{
      rule_name: string;
      result: ValidationResult;
      severity: string;
    }> = [];

    let totalScore = 0;
    let passedChecks = 0;
    let failedChecks = 0;
    let warnings = 0;

    for (const rule of rules) {
      try {
        const result = rule.check(data);
        results.push({
          rule_name: rule.name,
          result,
          severity: rule.severity,
        });

        totalScore += result.score;

        if (result.passed) {
          passedChecks++;
        } else {
          failedChecks++;
          if (rule.severity === 'warning') {
            warnings++;
          }
        }
      } catch (error) {
        this.logger.error(`Validation rule ${rule.name} failed:`, error);
        results.push({
          rule_name: rule.name,
          result: {
            passed: false,
            message: `Validation rule execution failed: ${error.message}`,
            score: 0,
          },
          severity: 'error',
        });
        failedChecks++;
      }
    }

    const overallScore = rules.length > 0 ? totalScore / rules.length : 0;
    const recommendations = this.generateRecommendations(results);

    return {
      overall_score: overallScore,
      total_checks: rules.length,
      passed_checks: passedChecks,
      failed_checks: failedChecks,
      warnings,
      timestamp: new Date(),
      symbol,
      validation_results: results,
      recommendations,
    };
  }

  /**
   * Detect outliers in data
   */
  detectOutliers(
    values: number[],
    threshold: number = 3,
  ): OutlierDetectionResult {
    if (values.length < 3) {
      return {
        outliers: [],
        outlier_percentage: 0,
        clean_data_percentage: 100,
      };
    }

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;
    const stdDev = Math.sqrt(variance);

    const outliers = values
      .map((value, index) => {
        const zScore = Math.abs((value - mean) / stdDev);
        return {
          index,
          value,
          z_score: zScore,
          type:
            zScore > threshold * 1.5 ? ('extreme' as const) : ('mild' as const),
          is_outlier: zScore > threshold,
        };
      })
      .filter((item) => item.is_outlier)
      .map(({ is_outlier, ...rest }) => rest);

    const outlierPercentage = (outliers.length / values.length) * 100;

    return {
      outliers,
      outlier_percentage: outlierPercentage,
      clean_data_percentage: 100 - outlierPercentage,
    };
  }

  /**
   * Impute missing data
   */
  imputeMissingData(
    data: MarketDataPoint[],
    method: 'forward_fill' | 'backward_fill' | 'interpolate' = 'interpolate',
  ): MarketDataPoint[] {
    if (data.length === 0) return data;

    const result = [...data];

    for (let i = 0; i < result.length; i++) {
      const point = result[i];

      // Check for missing values (0 or undefined/null)
      if (
        this.isMissingValue(point.open) ||
        this.isMissingValue(point.high) ||
        this.isMissingValue(point.low) ||
        this.isMissingValue(point.close)
      ) {
        switch (method) {
          case 'forward_fill':
            if (i > 0) {
              result[i] = { ...point, ...this.fillFromPrevious(result[i - 1]) };
            }
            break;
          case 'backward_fill':
            if (i < result.length - 1) {
              result[i] = { ...point, ...this.fillFromNext(result[i + 1]) };
            }
            break;
          case 'interpolate':
            result[i] = { ...point, ...this.interpolateValues(result, i) };
            break;
        }
      }
    }

    return result;
  }

  // Validation rule implementations
  private checkPositivePrices(data: MarketDataPoint[]): ValidationResult {
    const negativeCount = data.filter(
      (d) => d.open <= 0 || d.high <= 0 || d.low <= 0 || d.close <= 0,
    ).length;

    const score = 1 - negativeCount / data.length;

    return {
      passed: negativeCount === 0,
      message:
        negativeCount === 0
          ? 'All prices are positive'
          : `Found ${negativeCount} data points with non-positive prices`,
      score,
      metadata: { negative_count: negativeCount },
    };
  }

  private checkNonNegativeVolume(data: MarketDataPoint[]): ValidationResult {
    const negativeCount = data.filter((d) => d.volume < 0).length;
    const score = 1 - negativeCount / data.length;

    return {
      passed: negativeCount === 0,
      message:
        negativeCount === 0
          ? 'All volumes are non-negative'
          : `Found ${negativeCount} data points with negative volumes`,
      score,
      metadata: { negative_volume_count: negativeCount },
    };
  }

  private checkOHLCLogic(data: MarketDataPoint[]): ValidationResult {
    const violations = data.filter(
      (d) =>
        d.high < Math.max(d.open, d.close) ||
        d.low > Math.min(d.open, d.close) ||
        d.high < d.low,
    ).length;

    const score = 1 - violations / data.length;

    return {
      passed: violations === 0,
      message:
        violations === 0
          ? 'All OHLC relationships are logical'
          : `Found ${violations} OHLC logic violations`,
      score,
      metadata: { violations },
    };
  }

  private checkPriceContinuity(data: MarketDataPoint[]): ValidationResult {
    if (data.length < 2) {
      return {
        passed: true,
        message: 'Insufficient data for continuity check',
        score: 1,
      };
    }

    let extremeGaps = 0;
    const gapThreshold = 0.1; // 10% price change threshold

    for (let i = 1; i < data.length; i++) {
      const prevClose = data[i - 1].close;
      const currentOpen = data[i].open;
      const gap = Math.abs(currentOpen - prevClose) / prevClose;

      if (gap > gapThreshold) {
        extremeGaps++;
      }
    }

    const score = 1 - extremeGaps / (data.length - 1);

    return {
      passed: extremeGaps / (data.length - 1) < 0.05, // Less than 5% extreme gaps
      message: `Found ${extremeGaps} extreme price gaps (>${(gapThreshold * 100).toFixed(1)}%)`,
      score,
      metadata: { extreme_gaps: extremeGaps, threshold: gapThreshold },
    };
  }

  private checkDataSufficiency(data: MarketDataPoint[]): ValidationResult {
    const minRequired = 200; // Minimum points for reliable analysis
    const score = Math.min(data.length / minRequired, 1);

    return {
      passed: data.length >= minRequired,
      message:
        data.length >= minRequired
          ? `Sufficient data: ${data.length} points`
          : `Insufficient data: ${data.length}/${minRequired} points`,
      score,
      metadata: { data_points: data.length, minimum_required: minRequired },
    };
  }

  private checkTimestampOrdering(data: MarketDataPoint[]): ValidationResult {
    let violations = 0;

    for (let i = 1; i < data.length; i++) {
      if (data[i].timestamp < data[i - 1].timestamp) {
        violations++;
      }
    }

    const score = 1 - violations / Math.max(data.length - 1, 1);

    return {
      passed: violations === 0,
      message:
        violations === 0
          ? 'Timestamps are properly ordered'
          : `Found ${violations} timestamp ordering violations`,
      score,
      metadata: { violations },
    };
  }

  private checkDuplicateTimestamps(data: MarketDataPoint[]): ValidationResult {
    const timestamps = data.map((d) => d.timestamp.getTime());
    const uniqueTimestamps = new Set(timestamps);
    const duplicates = timestamps.length - uniqueTimestamps.size;

    const score = 1 - duplicates / data.length;

    return {
      passed: duplicates === 0,
      message:
        duplicates === 0
          ? 'No duplicate timestamps'
          : `Found ${duplicates} duplicate timestamps`,
      score,
      metadata: { duplicates },
    };
  }
  private checkDataGaps(data: MarketDataPoint[]): ValidationResult {
    if (data.length < 2) {
      return {
        passed: true,
        message: 'Insufficient data for gap analysis',
        score: 1,
      };
    }

    // Check for gaps larger than expected trading intervals
    const intervals: number[] = [];
    for (let i = 1; i < data.length; i++) {
      const gap = data[i].timestamp.getTime() - data[i - 1].timestamp.getTime();
      intervals.push(gap);
    }

    const medianInterval = this.calculateMedian(intervals);
    const largeGaps = intervals.filter(
      (interval) => interval > medianInterval * 5,
    ).length;

    const score = 1 - largeGaps / intervals.length;

    return {
      passed: largeGaps / intervals.length < 0.1, // Less than 10% large gaps
      message: `Found ${largeGaps} large data gaps`,
      score,
      metadata: { large_gaps: largeGaps, median_interval: medianInterval },
    };
  }

  private checkVolumeConsistency(data: MarketDataPoint[]): ValidationResult {
    const volumes = data.map((d) => d.volume).filter((v) => v > 0);
    if (volumes.length === 0) {
      return { passed: false, message: 'No valid volume data', score: 0 };
    }

    const outlierResult = this.detectOutliers(volumes);
    const score = outlierResult.clean_data_percentage / 100;

    return {
      passed: outlierResult.outlier_percentage < 5, // Less than 5% outliers
      message: `Volume outliers: ${outlierResult.outlier_percentage.toFixed(1)}%`,
      score,
      metadata: outlierResult,
    };
  }
  private checkStatisticalOutliers(data: MarketDataPoint[]): ValidationResult {
    const returns: number[] = [];
    for (let i = 1; i < data.length; i++) {
      const ret = (data[i].close - data[i - 1].close) / data[i - 1].close;
      returns.push(ret);
    }

    const outlierResult = this.detectOutliers(returns);
    const score = outlierResult.clean_data_percentage / 100;

    return {
      passed: outlierResult.outlier_percentage < 2, // Less than 2% extreme outliers
      message: `Price return outliers: ${outlierResult.outlier_percentage.toFixed(1)}%`,
      score,
      metadata: outlierResult,
    };
  }

  private checkFeatureCompleteness(data: FeatureSet[]): ValidationResult {
    if (data.length === 0) {
      return { passed: false, message: 'No feature data provided', score: 0 };
    }

    const expectedFeatures = [
      'sma_20',
      'rsi_14',
      'macd',
      'bb_upper',
      'volume_ratio_20d',
    ];
    let totalMissing = 0;
    let totalChecks = 0;

    data.forEach((featureSet) => {
      expectedFeatures.forEach((feature) => {
        totalChecks++;
        if (!featureSet.features.has(feature)) {
          totalMissing++;
        }
      });
    });

    const score = 1 - totalMissing / totalChecks;

    return {
      passed: totalMissing === 0,
      message:
        totalMissing === 0
          ? 'All expected features are present'
          : `Missing ${totalMissing}/${totalChecks} expected features`,
      score,
      metadata: { missing_features: totalMissing, total_checks: totalChecks },
    };
  }
  private checkFeatureRanges(data: FeatureSet[]): ValidationResult {
    const rangeViolations: Array<{
      index: number;
      feature: string;
      value: number;
    }> = [];

    data.forEach((featureSet, index) => {
      featureSet.features.forEach((value, key) => {
        if (this.isFeatureOutOfRange(key, value)) {
          rangeViolations.push({ index, feature: key, value });
        }
      });
    });

    const totalFeatures = data.reduce((sum, fs) => sum + fs.features.size, 0);
    const score = 1 - rangeViolations.length / totalFeatures;

    return {
      passed: rangeViolations.length === 0,
      message:
        rangeViolations.length === 0
          ? 'All features are within expected ranges'
          : `Found ${rangeViolations.length} features out of range`,
      score,
      metadata: { violations: rangeViolations.length },
    };
  }

  private checkNaNInfValues(data: FeatureSet[]): ValidationResult {
    let nanInfCount = 0;
    let totalFeatures = 0;

    data.forEach((featureSet) => {
      featureSet.features.forEach((value) => {
        totalFeatures++;
        if (!isFinite(value) || isNaN(value)) {
          nanInfCount++;
        }
      });
    });

    const score = 1 - nanInfCount / totalFeatures;

    return {
      passed: nanInfCount === 0,
      message:
        nanInfCount === 0
          ? 'No NaN or infinite values found'
          : `Found ${nanInfCount} NaN/infinite values`,
      score,
      metadata: { nan_inf_count: nanInfCount, total_features: totalFeatures },
    };
  }

  // Helper methods
  private isFeatureOutOfRange(featureName: string, value: number): boolean {
    // Define expected ranges for common features
    const ranges: Record<string, [number, number]> = {
      rsi_14: [0, 100],
      rsi_21: [0, 100],
      bb_position: [0, 1],
      stoch_k: [0, 100],
      stoch_d: [0, 100],
      williams_r: [-100, 0],
      cci: [-300, 300],
    };

    if (featureName in ranges) {
      const [min, max] = ranges[featureName];
      return value < min || value > max;
    }

    // For other features, check for reasonable bounds
    return Math.abs(value) > 1000 || !isFinite(value);
  }

  private isMissingValue(value: number): boolean {
    return value === 0 || value === undefined || value === null || isNaN(value);
  }

  private fillFromPrevious(
    previous: MarketDataPoint,
  ): Partial<MarketDataPoint> {
    return {
      open: previous.close,
      high: previous.close,
      low: previous.close,
      close: previous.close,
    };
  }

  private fillFromNext(next: MarketDataPoint): Partial<MarketDataPoint> {
    return {
      open: next.open,
      high: next.open,
      low: next.open,
      close: next.open,
    };
  }

  private interpolateValues(
    data: MarketDataPoint[],
    index: number,
  ): Partial<MarketDataPoint> {
    // Find nearest valid values before and after
    let beforeIndex = index - 1;
    let afterIndex = index + 1;

    while (beforeIndex >= 0 && this.isMissingValue(data[beforeIndex].close)) {
      beforeIndex--;
    }

    while (
      afterIndex < data.length &&
      this.isMissingValue(data[afterIndex].close)
    ) {
      afterIndex++;
    }

    if (beforeIndex >= 0 && afterIndex < data.length) {
      // Interpolate between valid values
      const before = data[beforeIndex];
      const after = data[afterIndex];
      const ratio = (index - beforeIndex) / (afterIndex - beforeIndex);

      return {
        open: before.close + (after.open - before.close) * ratio,
        high: before.close + (after.high - before.close) * ratio,
        low: before.close + (after.low - before.close) * ratio,
        close: before.close + (after.close - before.close) * ratio,
      };
    } else if (beforeIndex >= 0) {
      return this.fillFromPrevious(data[beforeIndex]);
    } else if (afterIndex < data.length) {
      return this.fillFromNext(data[afterIndex]);
    }

    return {};
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      return sorted[mid];
    }
  }

  private generateRecommendations(
    results: Array<{
      rule_name: string;
      result: ValidationResult;
      severity: string;
    }>,
  ): string[] {
    const recommendations: string[] = [];

    results.forEach(({ rule_name, result, severity }) => {
      if (!result.passed && severity === 'error') {
        switch (rule_name) {
          case 'price_positive':
            recommendations.push(
              'Remove or correct data points with non-positive prices',
            );
            break;
          case 'ohlc_logical':
            recommendations.push(
              'Fix OHLC relationships (high ≥ max(open,close), low ≤ min(open,close))',
            );
            break;
          case 'timestamp_ordering':
            recommendations.push('Sort data by timestamp in ascending order');
            break;
          case 'nan_inf_check':
            recommendations.push(
              'Replace NaN/infinite values with appropriate substitutes',
            );
            break;
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push(
        'Data quality is good - no critical issues detected',
      );
    }

    return recommendations;
  }
}
