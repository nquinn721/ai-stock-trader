import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MLMetric, MLModel } from '../entities/ml.entities';

export interface ExperimentConfig {
  name: string;
  description: string;
  tags: string[];
  parameters: Record<string, any>;
  modelType: string;
  datasetVersion?: string;
}

export interface ExperimentResult {
  experimentId: string;
  metrics: Record<string, number>;
  artifacts: string[];
  status: 'completed' | 'failed' | 'running';
  duration: number;
  modelId?: string;
}

export interface ModelVersioning {
  modelId: string;
  version: string;
  parentVersion?: string;
  changelog: string;
  performanceComparison?: Record<string, number>;
}

export interface ArtifactMetadata {
  artifactId: string;
  type: 'model' | 'dataset' | 'config' | 'plot' | 'log';
  path: string;
  size: number;
  checksum: string;
  metadata: Record<string, any>;
}

@Injectable()
export class ExperimentTrackingService {
  private readonly logger = new Logger(ExperimentTrackingService.name);
  private readonly experiments = new Map<string, any>();
  private readonly artifacts = new Map<string, ArtifactMetadata>();

  constructor(
    @InjectRepository(MLModel)
    private readonly modelRepository: Repository<MLModel>,
    @InjectRepository(MLMetric)
    private readonly metricRepository: Repository<MLMetric>,
  ) {}

  /**
   * Start a new experiment
   */
  async startExperiment(config: ExperimentConfig): Promise<string> {
    const experimentId = this.generateExperimentId();
    const startTime = new Date();

    const experiment = {
      id: experimentId,
      name: config.name,
      description: config.description,
      tags: config.tags,
      parameters: config.parameters,
      modelType: config.modelType,
      datasetVersion: config.datasetVersion,
      status: 'running',
      startTime,
      endTime: null,
      metrics: {},
      artifacts: [],
      logs: [],
    };

    this.experiments.set(experimentId, experiment);

    this.logger.log(`Started experiment: ${experimentId} - ${config.name}`);
    return experimentId;
  }

  /**
   * Log metrics during experiment
   */
  async logMetrics(
    experimentId: string,
    metrics: Record<string, number>,
    step?: number,
  ): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    const timestamp = new Date();
    const logEntry = {
      timestamp,
      step: step || 0,
      metrics,
    };

    if (!experiment.metricHistory) {
      experiment.metricHistory = [];
    }
    experiment.metricHistory.push(logEntry);

    // Update current metrics
    Object.assign(experiment.metrics, metrics);

    this.logger.debug(
      `Logged metrics for experiment ${experimentId}: ${JSON.stringify(metrics)}`,
    );
  }

  /**
   * Log parameters during experiment
   */
  async logParameters(
    experimentId: string,
    parameters: Record<string, any>,
  ): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    Object.assign(experiment.parameters, parameters);
    this.logger.debug(
      `Logged parameters for experiment ${experimentId}: ${JSON.stringify(parameters)}`,
    );
  }

  /**
   * Log artifacts (models, plots, datasets)
   */
  async logArtifact(
    experimentId: string,
    artifactType: ArtifactMetadata['type'],
    path: string,
    metadata: Record<string, any> = {},
  ): Promise<string> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    const artifactId = this.generateArtifactId();
    const artifact: ArtifactMetadata = {
      artifactId,
      type: artifactType,
      path,
      size: await this.getFileSize(path),
      checksum: await this.calculateChecksum(path),
      metadata: {
        experimentId,
        createdAt: new Date(),
        ...metadata,
      },
    };

    this.artifacts.set(artifactId, artifact);
    experiment.artifacts.push(artifactId);

    this.logger.log(
      `Logged artifact ${artifactId} for experiment ${experimentId}: ${path}`,
    );
    return artifactId;
  }

  /**
   * Complete an experiment
   */
  async endExperiment(
    experimentId: string,
    status: 'completed' | 'failed' = 'completed',
  ): Promise<ExperimentResult> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    experiment.endTime = new Date();
    experiment.status = status;
    experiment.duration =
      experiment.endTime.getTime() - experiment.startTime.getTime();

    // Save metrics to database
    if (experiment.modelId) {
      await this.saveExperimentMetrics(
        experimentId,
        experiment.modelId,
        experiment.metrics,
      );
    }

    const result: ExperimentResult = {
      experimentId,
      metrics: experiment.metrics,
      artifacts: experiment.artifacts,
      status,
      duration: experiment.duration,
      modelId: experiment.modelId,
    };

    this.logger.log(
      `Completed experiment ${experimentId} with status: ${status}`,
    );
    return result;
  }

  /**
   * Compare experiments
   */
  async compareExperiments(experimentIds: string[]): Promise<any> {
    const comparisons: any[] = [];

    for (const id of experimentIds) {
      const experiment = this.experiments.get(id);
      if (experiment) {
        comparisons.push({
          experimentId: id,
          name: experiment.name,
          parameters: experiment.parameters,
          metrics: experiment.metrics,
          duration: experiment.duration,
          status: experiment.status,
        });
      }
    }

    return {
      experiments: comparisons,
      metricComparison: this.generateMetricComparison(comparisons),
      bestExperiment: this.findBestExperiment(comparisons),
    };
  }

  /**
   * Create a new model version
   */
  async createModelVersion(
    modelId: string,
    version: string,
    changelog: string,
    parentVersion?: string,
  ): Promise<ModelVersioning> {
    const model = await this.modelRepository.findOne({
      where: { id: modelId },
    });
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    // Update model version
    model.version = version;
    model.metadata = {
      ...model.metadata,
      versionHistory: [
        ...(model.metadata?.versionHistory || []),
        {
          version,
          parentVersion,
          changelog,
          createdAt: new Date(),
        },
      ],
    };

    await this.modelRepository.save(model);

    const versioning: ModelVersioning = {
      modelId,
      version,
      parentVersion,
      changelog,
    };

    this.logger.log(`Created model version ${version} for model ${modelId}`);
    return versioning;
  }

  /**
   * Get experiment history
   */
  async getExperimentHistory(
    filters: {
      modelType?: string;
      tags?: string[];
      dateRange?: { start: Date; end: Date };
      status?: string;
    } = {},
  ): Promise<any[]> {
    const experiments = Array.from(this.experiments.values());

    return experiments
      .filter((exp) => {
        if (filters.modelType && exp.modelType !== filters.modelType)
          return false;
        if (filters.tags && !filters.tags.some((tag) => exp.tags.includes(tag)))
          return false;
        if (filters.status && exp.status !== filters.status) return false;
        if (filters.dateRange) {
          const expDate = new Date(exp.startTime);
          if (
            expDate < filters.dateRange.start ||
            expDate > filters.dateRange.end
          )
            return false;
        }
        return true;
      })
      .map((exp) => ({
        experimentId: exp.id,
        name: exp.name,
        modelType: exp.modelType,
        status: exp.status,
        startTime: exp.startTime,
        endTime: exp.endTime,
        duration: exp.duration,
        metrics: exp.metrics,
        tags: exp.tags,
      }));
  }

  /**
   * Get model lineage and versioning history
   */
  async getModelLineage(modelId: string): Promise<any> {
    const model = await this.modelRepository.findOne({
      where: { id: modelId },
    });
    if (!model) {
      throw new Error(`Model ${modelId} not found`);
    }

    const versionHistory = model.metadata?.versionHistory || [];

    return {
      modelId,
      currentVersion: model.version,
      versionHistory,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      totalVersions: versionHistory.length,
    };
  }

  /**
   * Clean up old experiments
   */
  async cleanupOldExperiments(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date(
      Date.now() - retentionDays * 24 * 60 * 60 * 1000,
    );
    let cleaned = 0;

    for (const [id, experiment] of this.experiments.entries()) {
      if (
        new Date(experiment.startTime) < cutoffDate &&
        experiment.status !== 'running'
      ) {
        // Clean up artifacts
        for (const artifactId of experiment.artifacts) {
          this.artifacts.delete(artifactId);
        }

        this.experiments.delete(id);
        cleaned++;
      }
    }

    this.logger.log(
      `Cleaned up ${cleaned} experiments older than ${retentionDays} days`,
    );
    return cleaned;
  }

  // Private helper methods

  private generateExperimentId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateArtifactId(): string {
    return `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getFileSize(path: string): Promise<number> {
    // Simplified - in real implementation would check actual file size
    return Math.floor(Math.random() * 10000000) + 1000;
  }

  private async calculateChecksum(path: string): Promise<string> {
    // Simplified - in real implementation would calculate actual checksum
    return `sha256_${Math.random().toString(36).substr(2, 16)}`;
  }

  private async saveExperimentMetrics(
    experimentId: string,
    modelId: string,
    metrics: Record<string, number>,
  ): Promise<void> {
    const currentDate = new Date();
    const periodStart = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const [name, value] of Object.entries(metrics)) {
      const metric = this.metricRepository.create({
        modelId,
        metricName: name,
        metricValue: value,
        calculationDate: currentDate,
        periodStart,
        periodEnd: currentDate,
        metadata: { experimentId },
      });
      await this.metricRepository.save(metric);
    }
  }

  private generateMetricComparison(experiments: any[]): Record<string, any> {
    const allMetrics = new Set<string>();
    experiments.forEach((exp) => {
      Object.keys(exp.metrics || {}).forEach((metric) =>
        allMetrics.add(metric),
      );
    });

    const comparison: Record<string, any> = {};
    allMetrics.forEach((metric) => {
      comparison[metric] = {
        values: experiments.map((exp) => exp.metrics?.[metric] || null),
        best: Math.max(
          ...experiments.map((exp) => exp.metrics?.[metric] || -Infinity),
        ),
        worst: Math.min(
          ...experiments.map((exp) => exp.metrics?.[metric] || Infinity),
        ),
        average:
          experiments
            .filter((exp) => exp.metrics?.[metric] !== undefined)
            .reduce((sum, exp) => sum + exp.metrics[metric], 0) /
          experiments.filter((exp) => exp.metrics?.[metric] !== undefined)
            .length,
      };
    });

    return comparison;
  }

  private findBestExperiment(experiments: any[]): any {
    // Simple implementation - finds experiment with highest accuracy
    // In practice, this would use more sophisticated scoring
    return experiments.reduce((best, current) => {
      const currentScore = current.metrics?.accuracy || 0;
      const bestScore = best?.metrics?.accuracy || 0;
      return currentScore > bestScore ? current : best;
    }, null);
  }
}
