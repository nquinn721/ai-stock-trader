import { Injectable, Logger } from '@nestjs/common';

export interface PreprocessingPipeline {
  id: string;
  name: string;
  steps: PreprocessingStep[];
  inputSchema: any;
  outputSchema: any;
  schedule?: string; // cron expression
  isActive: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export interface PreprocessingStep {
  id: string;
  name: string;
  operation: string;
  parameters: Record<string, any>;
  order: number;
  isEnabled: boolean;
  dependencies: string[];
}

export interface PreprocessingJob {
  id: string;
  pipelineId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  inputRecords: number;
  outputRecords: number;
  errorMessage?: string;
  metrics: Record<string, number>;
}

export interface TransformationConfig {
  normalization: {
    method: 'z_score' | 'min_max' | 'robust' | 'quantile';
    parameters: Record<string, any>;
  };
  outlierHandling: {
    method: 'iqr' | 'z_score' | 'isolation_forest' | 'none';
    threshold: number;
    action: 'remove' | 'clip' | 'impute';
  };
  missingDataStrategy: {
    method: 'forward_fill' | 'backward_fill' | 'interpolate' | 'median' | 'mean';
    window?: number;
  };
  featureSelection: {
    method: 'correlation' | 'mutual_info' | 'lasso' | 'rfe' | 'none';
    threshold: number;
    maxFeatures?: number;
  };
}

@Injectable()
export class DataPreprocessingService {
  private readonly logger = new Logger(DataPreprocessingService.name);

  private pipelines: Map<string, PreprocessingPipeline> = new Map();
  private jobs: Map<string, PreprocessingJob> = new Map();

  constructor() {
    this.initializeDefaultPipelines();
  }

  /**
   * Create a new preprocessing pipeline
   */
  async createPipeline(pipeline: Omit<PreprocessingPipeline, 'id'>): Promise<PreprocessingPipeline> {
    const id = this.generatePipelineId();
    const newPipeline: PreprocessingPipeline = {
      id,
      ...pipeline,
      lastRun: undefined,
      nextRun: pipeline.schedule ? this.calculateNextRun(pipeline.schedule) : undefined
    };

    this.pipelines.set(id, newPipeline);
    this.logger.log(`Created preprocessing pipeline: ${id} (${pipeline.name})`);

    return newPipeline;
  }

  /**
   * Execute preprocessing pipeline
   */
  async executePipeline(pipelineId: string, inputData: any[]): Promise<PreprocessingJob> {
    this.logger.log(`Executing preprocessing pipeline: ${pipelineId}`);

    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline not found: ${pipelineId}`);
    }

    const job: PreprocessingJob = {
      id: this.generateJobId(),
      pipelineId,
      status: 'running',
      startTime: new Date(),
      inputRecords: inputData.length,
      outputRecords: 0,
      metrics: {}
    };

    this.jobs.set(job.id, job);

    try {
      // Execute pipeline steps in order
      let processedData = [...inputData];
      const stepMetrics: Record<string, number> = {};

      for (const step of pipeline.steps.sort((a, b) => a.order - b.order)) {
        if (!step.isEnabled) {
          this.logger.log(`Skipping disabled step: ${step.name}`);
          continue;
        }

        this.logger.log(`Executing step: ${step.name} (${step.operation})`);
        const stepStart = Date.now();

        processedData = await this.executeStep(step, processedData);
        
        const stepDuration = Date.now() - stepStart;
        stepMetrics[`${step.name}_duration_ms`] = stepDuration;
        stepMetrics[`${step.name}_output_count`] = processedData.length;

        this.logger.log(`Step completed: ${step.name} (${stepDuration}ms, ${processedData.length} records)`);
      }

      // Update job status
      job.status = 'completed';
      job.endTime = new Date();
      job.outputRecords = processedData.length;
      job.metrics = stepMetrics;

      // Update pipeline last run
      pipeline.lastRun = new Date();
      if (pipeline.schedule) {
        pipeline.nextRun = this.calculateNextRun(pipeline.schedule);
      }

      this.logger.log(`Pipeline execution completed: ${pipelineId} (${job.inputRecords} -> ${job.outputRecords} records)`);

      return job;

    } catch (error) {
      job.status = 'failed';
      job.endTime = new Date();
      job.errorMessage = error.message;

      this.logger.error(`Pipeline execution failed: ${pipelineId}`, error);
      throw error;
    }
  }
  /**
   * Execute automated data preprocessing with standard transformations
   */
  async preprocessData(
    data: any[],
    config: TransformationConfig,
    targetColumns: string[]
  ): Promise<{ data: any[]; metadata: any }> {
    this.logger.log(`Preprocessing ${data.length} records with ${targetColumns.length} target columns`);

    let processedData = [...data];
    const metadata: any = {
      originalRecords: data.length,
      transformations: [] as string[],
      droppedRecords: 0,
      outlierCount: 0,
      imputedValues: 0,
      finalRecords: 0,
      selectedFeatures: [] as string[]
    };

    // 1. Handle missing data
    const missingDataResult = await this.handleMissingData(processedData, config.missingDataStrategy, targetColumns);
    processedData = missingDataResult.data;
    metadata.imputedValues = missingDataResult.imputedCount;
    metadata.transformations.push('missing_data_handling');

    // 2. Detect and handle outliers
    const outlierResult = await this.handleOutliers(processedData, config.outlierHandling, targetColumns);
    processedData = outlierResult.data;
    metadata.outlierCount = outlierResult.outlierCount;
    metadata.transformations.push('outlier_handling');

    // 3. Normalize features
    const normalizationResult = await this.normalizeFeatures(processedData, config.normalization, targetColumns);
    processedData = normalizationResult.data;
    metadata.transformations.push('normalization');

    // 4. Feature selection (if configured)
    if (config.featureSelection.method !== 'none') {
      const featureSelectionResult = await this.selectFeatures(processedData, config.featureSelection, targetColumns);
      processedData = featureSelectionResult.data;
      metadata.transformations.push('feature_selection');
      metadata.selectedFeatures = featureSelectionResult.selectedFeatures;
    }

    metadata.finalRecords = processedData.length;
    metadata.droppedRecords = data.length - processedData.length;

    this.logger.log(`Preprocessing completed: ${metadata.finalRecords} records, ${metadata.transformations.length} transformations`);

    return { data: processedData, metadata };
  }

  /**
   * Create feature engineering pipeline
   */
  async createFeatureEngineeringPipeline(symbols: string[]): Promise<PreprocessingPipeline> {
    const steps: PreprocessingStep[] = [
      {
        id: 'price_features',
        name: 'Price Feature Engineering',
        operation: 'calculate_price_features',
        parameters: {
          features: ['returns', 'log_returns', 'price_change', 'volatility']
        },
        order: 1,
        isEnabled: true,
        dependencies: []
      },
      {
        id: 'technical_indicators',
        name: 'Technical Indicators',
        operation: 'calculate_technical_indicators',
        parameters: {
          indicators: ['sma_20', 'ema_12', 'rsi', 'macd', 'bollinger_bands']
        },
        order: 2,
        isEnabled: true,
        dependencies: ['price_features']
      },
      {
        id: 'volume_features',
        name: 'Volume Features',
        operation: 'calculate_volume_features',
        parameters: {
          features: ['volume_sma', 'volume_ratio', 'on_balance_volume']
        },
        order: 3,
        isEnabled: true,
        dependencies: []
      },
      {
        id: 'market_features',
        name: 'Market State Features',
        operation: 'calculate_market_features',
        parameters: {
          features: ['market_regime', 'correlation_matrix', 'beta']
        },
        order: 4,
        isEnabled: true,
        dependencies: ['technical_indicators', 'volume_features']
      }
    ];

    return await this.createPipeline({
      name: `Feature Engineering Pipeline - ${symbols.join(', ')}`,
      steps,
      inputSchema: {
        required: ['symbol', 'timestamp', 'open', 'high', 'low', 'close', 'volume'],
        optional: []
      },
      outputSchema: {
        required: ['symbol', 'timestamp'],
        features: steps.flatMap(step => Object.values(step.parameters.features || []))
      },
      schedule: '0 */15 * * * *', // Every 15 minutes
      isActive: true
    });
  }

  /**
   * Get pipeline status and metrics
   */
  async getPipelineStatus(pipelineId: string): Promise<{ pipeline: PreprocessingPipeline; recentJobs: PreprocessingJob[] }> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline not found: ${pipelineId}`);
    }

    const recentJobs = Array.from(this.jobs.values())
      .filter(job => job.pipelineId === pipelineId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, 10);

    return { pipeline, recentJobs };
  }

  /**
   * Schedule pipeline execution
   */
  async schedulePipeline(pipelineId: string, schedule: string): Promise<void> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline not found: ${pipelineId}`);
    }

    pipeline.schedule = schedule;
    pipeline.nextRun = this.calculateNextRun(schedule);

    this.logger.log(`Pipeline scheduled: ${pipelineId} with schedule ${schedule}`);
  }

  /**
   * Monitor pipeline performance
   */
  async getPipelineMetrics(pipelineId: string, timeRange: { start: Date; end: Date }): Promise<any> {
    const jobs = Array.from(this.jobs.values())
      .filter(job => 
        job.pipelineId === pipelineId && 
        job.startTime >= timeRange.start && 
        job.startTime <= timeRange.end
      );

    const metrics = {
      totalJobs: jobs.length,
      successfulJobs: jobs.filter(job => job.status === 'completed').length,
      failedJobs: jobs.filter(job => job.status === 'failed').length,
      avgProcessingTime: this.calculateAverageProcessingTime(jobs),
      avgThroughput: this.calculateAverageThroughput(jobs),
      errorRate: jobs.length > 0 ? jobs.filter(job => job.status === 'failed').length / jobs.length : 0
    };

    return metrics;
  }

  // Private helper methods

  private async executeStep(step: PreprocessingStep, data: any[]): Promise<any[]> {
    switch (step.operation) {
      case 'calculate_price_features':
        return this.calculatePriceFeatures(data, step.parameters);
      case 'calculate_technical_indicators':
        return this.calculateTechnicalIndicators(data, step.parameters);
      case 'calculate_volume_features':
        return this.calculateVolumeFeatures(data, step.parameters);
      case 'calculate_market_features':
        return this.calculateMarketFeatures(data, step.parameters);
      case 'normalize':
        return this.normalizeData(data, step.parameters);
      case 'filter_outliers':
        return this.filterOutliers(data, step.parameters);
      default:
        this.logger.warn(`Unknown operation: ${step.operation}`);
        return data;
    }
  }

  private async handleMissingData(
    data: any[],
    strategy: TransformationConfig['missingDataStrategy'],
    columns: string[]
  ): Promise<{ data: any[]; imputedCount: number }> {
    let imputedCount = 0;
    const processedData = data.map(record => {
      const newRecord = { ...record };
      
      for (const column of columns) {
        if (newRecord[column] === null || newRecord[column] === undefined || isNaN(newRecord[column])) {
          switch (strategy.method) {
            case 'forward_fill':
              // Implementation would use previous valid value
              newRecord[column] = 0; // Simplified
              break;
            case 'mean':
              newRecord[column] = this.calculateColumnMean(data, column);
              break;
            case 'median':
              newRecord[column] = this.calculateColumnMedian(data, column);
              break;
          }
          imputedCount++;
        }
      }
      
      return newRecord;
    });

    return { data: processedData, imputedCount };
  }

  private async handleOutliers(
    data: any[],
    config: TransformationConfig['outlierHandling'],
    columns: string[]
  ): Promise<{ data: any[]; outlierCount: number }> {
    let outlierCount = 0;

    if (config.method === 'none') {
      return { data, outlierCount };
    }

    const processedData = data.filter(record => {
      for (const column of columns) {
        const value = record[column];
        if (this.isOutlier(value, data, column, config)) {
          outlierCount++;
          if (config.action === 'remove') {
            return false; // Filter out outliers
          }
        }
      }
      return true;
    });

    return { data: processedData, outlierCount };
  }

  private async normalizeFeatures(
    data: any[],
    config: TransformationConfig['normalization'],
    columns: string[]
  ): Promise<{ data: any[] }> {
    const processedData = data.map(record => {
      const newRecord = { ...record };
      
      for (const column of columns) {
        if (typeof newRecord[column] === 'number') {
          newRecord[column] = this.normalizeValue(newRecord[column], data, column, config);
        }
      }
      
      return newRecord;
    });

    return { data: processedData };
  }

  private async selectFeatures(
    data: any[],
    config: TransformationConfig['featureSelection'],
    columns: string[]
  ): Promise<{ data: any[]; selectedFeatures: string[] }> {
    // Simplified feature selection - in production would use statistical methods
    const selectedFeatures = columns.slice(0, config.maxFeatures || columns.length);
    
    const processedData = data.map(record => {
      const newRecord: any = {};
      for (const feature of selectedFeatures) {
        newRecord[feature] = record[feature];
      }
      return newRecord;
    });

    return { data: processedData, selectedFeatures };
  }

  private calculatePriceFeatures(data: any[], parameters: any): any[] {
    return data.map(record => ({
      ...record,
      returns: (record.close - record.open) / record.open,
      log_returns: Math.log(record.close / record.open),
      price_change: record.close - record.open,
      volatility: Math.abs(record.high - record.low) / record.close
    }));
  }

  private calculateTechnicalIndicators(data: any[], parameters: any): any[] {
    // Simplified implementation - in production would use proper technical analysis
    return data.map((record, index) => ({
      ...record,
      sma_20: this.calculateSMA(data, index, 20),
      ema_12: this.calculateEMA(data, index, 12),
      rsi: Math.random() * 100, // Mock RSI
      macd: Math.random() * 2 - 1 // Mock MACD
    }));
  }

  private calculateVolumeFeatures(data: any[], parameters: any): any[] {
    return data.map((record, index) => ({
      ...record,
      volume_sma: this.calculateVolumeSMA(data, index, 20),
      volume_ratio: record.volume / (this.calculateVolumeSMA(data, index, 20) || 1),
      on_balance_volume: this.calculateOBV(data, index)
    }));
  }

  private calculateMarketFeatures(data: any[], parameters: any): any[] {
    return data.map(record => ({
      ...record,
      market_regime: Math.random() > 0.5 ? 'trending' : 'ranging',
      beta: 1 + Math.random() * 0.5 - 0.25
    }));
  }

  private normalizeData(data: any[], parameters: any): any[] {
    // Simplified normalization
    return data;
  }

  private filterOutliers(data: any[], parameters: any): any[] {
    // Simplified outlier filtering
    return data;
  }

  private isOutlier(value: number, data: any[], column: string, config: any): boolean {
    if (config.method === 'z_score') {
      const mean = this.calculateColumnMean(data, column);
      const std = this.calculateColumnStd(data, column);
      const zScore = Math.abs((value - mean) / std);
      return zScore > config.threshold;
    }
    return false;
  }

  private normalizeValue(value: number, data: any[], column: string, config: any): number {
    if (config.method === 'min_max') {
      const min = Math.min(...data.map(d => d[column]).filter(v => typeof v === 'number'));
      const max = Math.max(...data.map(d => d[column]).filter(v => typeof v === 'number'));
      return (value - min) / (max - min);
    }
    return value;
  }

  private calculateColumnMean(data: any[], column: string): number {
    const values = data.map(d => d[column]).filter(v => typeof v === 'number' && !isNaN(v));
    return values.reduce((sum, val) => sum + val, 0) / values.length || 0;
  }

  private calculateColumnMedian(data: any[], column: string): number {
    const values = data.map(d => d[column]).filter(v => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
  }

  private calculateColumnStd(data: any[], column: string): number {
    const mean = this.calculateColumnMean(data, column);
    const values = data.map(d => d[column]).filter(v => typeof v === 'number' && !isNaN(v));
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculateSMA(data: any[], index: number, period: number): number {
    const start = Math.max(0, index - period + 1);
    const values = data.slice(start, index + 1).map(d => d.close);
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateEMA(data: any[], index: number, period: number): number {
    // Simplified EMA calculation
    return this.calculateSMA(data, index, period);
  }

  private calculateVolumeSMA(data: any[], index: number, period: number): number {
    const start = Math.max(0, index - period + 1);
    const values = data.slice(start, index + 1).map(d => d.volume);
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateOBV(data: any[], index: number): number {
    // Simplified OBV calculation
    let obv = 0;
    for (let i = 1; i <= index; i++) {
      if (data[i].close > data[i - 1].close) {
        obv += data[i].volume;
      } else if (data[i].close < data[i - 1].close) {
        obv -= data[i].volume;
      }
    }
    return obv;
  }

  private calculateAverageProcessingTime(jobs: PreprocessingJob[]): number {
    const completedJobs = jobs.filter(job => job.endTime);
    if (completedJobs.length === 0) return 0;

    const totalTime = completedJobs.reduce((sum, job) => 
      sum + (job.endTime!.getTime() - job.startTime.getTime()), 0);
    
    return totalTime / completedJobs.length;
  }

  private calculateAverageThroughput(jobs: PreprocessingJob[]): number {
    const completedJobs = jobs.filter(job => job.endTime && job.outputRecords > 0);
    if (completedJobs.length === 0) return 0;

    const totalThroughput = completedJobs.reduce((sum, job) => {
      const duration = job.endTime!.getTime() - job.startTime.getTime();
      return sum + (job.outputRecords / (duration / 1000)); // records per second
    }, 0);

    return totalThroughput / completedJobs.length;
  }

  private generatePipelineId(): string {
    return `pipeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateNextRun(schedule: string): Date {
    // Simplified cron calculation - in production would use a proper cron parser
    return new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
  }

  private initializeDefaultPipelines(): void {
    // Initialize with some default pipelines
    this.logger.log('Initializing default preprocessing pipelines');
  }
}
