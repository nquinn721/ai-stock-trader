import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MLMetric, MLModel, MLModelPerformance } from '../entities/ml.entities';

export interface TrainingConfig {
  modelType: string;
  hyperparameters: Record<string, any>;
  crossValidationFolds: number;
  testSize: number;
  randomState?: number;
  scalingMethod?: 'standard' | 'minmax' | 'robust';
  featureSelection?: {
    method: 'selectkbest' | 'rfe' | 'lasso';
    nFeatures?: number;
  };
}

export interface TrainingResult {
  modelId: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
  crossValScores: number[];
  hyperparameters: Record<string, any>;
  trainingTime: number;
  modelSize: number;
  featureImportances?: Record<string, number>;
}

export interface HyperparameterTuningConfig {
  searchMethod: 'grid' | 'random' | 'bayesian';
  paramGrid: Record<string, any[]>;
  cvFolds: number;
  maxIterations?: number;
  scoringMetric: string;
  nJobs?: number;
}

export interface ExperimentMetadata {
  experimentId: string;
  name: string;
  description: string;
  tags: string[];
  parameters: Record<string, any>;
  metrics: Record<string, number>;
  artifacts: string[];
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
}

@Injectable()
export class ModelTrainingService {
  private readonly logger = new Logger(ModelTrainingService.name);

  constructor(
    @InjectRepository(MLModel)
    private readonly modelRepository: Repository<MLModel>,
    @InjectRepository(MLModelPerformance)
    private readonly performanceRepository: Repository<MLModelPerformance>,
    @InjectRepository(MLMetric)
    private readonly metricRepository: Repository<MLMetric>,
  ) {}

  /**
   * Train a model with automated hyperparameter tuning
   */
  async trainModelWithTuning(
    modelType: string,
    trainingData: any[],
    targetColumn: string,
    tuningConfig: HyperparameterTuningConfig,
  ): Promise<TrainingResult> {
    const startTime = new Date();
    this.logger.log(
      `Starting model training with hyperparameter tuning for ${modelType}`,
    );

    try {
      // Create experiment tracking entry
      const experimentId = this.generateExperimentId();
      const experiment: ExperimentMetadata = {
        experimentId,
        name: `${modelType}_training_${Date.now()}`,
        description: `Automated training with ${tuningConfig.searchMethod} search`,
        tags: [modelType, 'hyperparameter_tuning', tuningConfig.searchMethod],
        parameters: tuningConfig,
        metrics: {},
        artifacts: [],
        startTime,
        status: 'running',
      };

      // Perform hyperparameter tuning
      const bestParams = await this.performHyperparameterTuning(
        modelType,
        trainingData,
        targetColumn,
        tuningConfig,
      );

      // Train final model with best parameters
      const trainingConfig: TrainingConfig = {
        modelType,
        hyperparameters: bestParams,
        crossValidationFolds: tuningConfig.cvFolds,
        testSize: 0.2,
        randomState: 42,
        scalingMethod: 'standard',
      };

      const result = await this.trainModel(
        trainingData,
        targetColumn,
        trainingConfig,
      );

      // Save model to database
      const model = await this.saveModel(result, experimentId);

      // Update experiment status
      experiment.endTime = new Date();
      experiment.status = 'completed';
      experiment.metrics = {
        accuracy: result.accuracy,
        precision: result.precision,
        recall: result.recall,
        f1Score: result.f1Score,
        auc: result.auc,
      };

      await this.saveExperiment(experiment);

      this.logger.log(
        `Model training completed successfully. Model ID: ${result.modelId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Model training failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Perform cross-validation for model evaluation
   */
  async crossValidateModel(
    modelType: string,
    data: any[],
    targetColumn: string,
    config: TrainingConfig,
  ): Promise<{ scores: number[]; mean: number; std: number }> {
    this.logger.log(
      `Performing ${config.crossValidationFolds}-fold cross-validation for ${modelType}`,
    );

    const scores: number[] = [];
    const foldSize = Math.floor(data.length / config.crossValidationFolds);

    for (let fold = 0; fold < config.crossValidationFolds; fold++) {
      // Split data into training and validation sets for this fold
      const validationStart = fold * foldSize;
      const validationEnd = validationStart + foldSize;

      const validationData = data.slice(validationStart, validationEnd);
      const trainingData = [
        ...data.slice(0, validationStart),
        ...data.slice(validationEnd),
      ];

      // Train model on training data
      const model = await this.trainModelFold(
        trainingData,
        targetColumn,
        config,
      );

      // Evaluate on validation data
      const score = await this.evaluateModel(
        model,
        validationData,
        targetColumn,
      );
      scores.push(score);

      this.logger.debug(`Fold ${fold + 1} score: ${score.toFixed(4)}`);
    }

    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance =
      scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) /
      scores.length;
    const std = Math.sqrt(variance);

    this.logger.log(
      `Cross-validation completed. Mean: ${mean.toFixed(4)}, Std: ${std.toFixed(4)}`,
    );

    return { scores, mean, std };
  }

  /**
   * Automated hyperparameter tuning
   */
  private async performHyperparameterTuning(
    modelType: string,
    data: any[],
    targetColumn: string,
    config: HyperparameterTuningConfig,
  ): Promise<Record<string, any>> {
    this.logger.log(`Starting ${config.searchMethod} hyperparameter search`);

    let bestParams: Record<string, any> = {};
    let bestScore = -Infinity;
    const searchResults: Array<{ params: Record<string, any>; score: number }> =
      [];

    switch (config.searchMethod) {
      case 'grid':
        const paramCombinations = this.generateGridSearchCombinations(
          config.paramGrid,
        );

        for (const params of paramCombinations.slice(
          0,
          config.maxIterations || paramCombinations.length,
        )) {
          const score = await this.evaluateParameterSet(
            modelType,
            data,
            targetColumn,
            params,
            config.cvFolds,
          );
          searchResults.push({ params, score });

          if (score > bestScore) {
            bestScore = score;
            bestParams = params;
          }

          this.logger.debug(
            `Grid search iteration: Score ${score.toFixed(4)} for params ${JSON.stringify(params)}`,
          );
        }
        break;

      case 'random':
        const maxIter = config.maxIterations || 50;

        for (let i = 0; i < maxIter; i++) {
          const params = this.generateRandomParameters(config.paramGrid);
          const score = await this.evaluateParameterSet(
            modelType,
            data,
            targetColumn,
            params,
            config.cvFolds,
          );
          searchResults.push({ params, score });

          if (score > bestScore) {
            bestScore = score;
            bestParams = params;
          }

          this.logger.debug(
            `Random search iteration ${i + 1}: Score ${score.toFixed(4)}`,
          );
        }
        break;

      case 'bayesian':
        // Simplified Bayesian optimization implementation
        bestParams = await this.performBayesianOptimization(
          modelType,
          data,
          targetColumn,
          config,
        );
        break;

      default:
        throw new Error(`Unsupported search method: ${config.searchMethod}`);
    }

    this.logger.log(
      `Hyperparameter tuning completed. Best score: ${bestScore.toFixed(4)}`,
    );
    this.logger.log(`Best parameters: ${JSON.stringify(bestParams)}`);

    return bestParams;
  }

  /**
   * Train a single model with given configuration
   */
  private async trainModel(
    data: any[],
    targetColumn: string,
    config: TrainingConfig,
  ): Promise<TrainingResult> {
    const startTime = Date.now();

    // Feature engineering and preprocessing
    const { features, target, featureNames } = await this.preprocessData(
      data,
      targetColumn,
      config,
    );

    // Split data
    const splitIndex = Math.floor(features.length * (1 - config.testSize));
    const trainFeatures = features.slice(0, splitIndex);
    const testFeatures = features.slice(splitIndex);
    const trainTarget = target.slice(0, splitIndex);
    const testTarget = target.slice(splitIndex);

    // Train model (simplified implementation)
    const model = await this.createAndTrainModel(
      config.modelType,
      trainFeatures,
      trainTarget,
      config.hyperparameters,
    );

    // Evaluate model
    const predictions = await this.predictWithModel(model, testFeatures);
    const metrics = this.calculateMetrics(testTarget, predictions);

    // Cross-validation
    const cvResult = await this.crossValidateModel(
      config.modelType,
      data,
      targetColumn,
      config,
    );

    // Calculate feature importances
    const featureImportances = await this.calculateFeatureImportances(
      model,
      featureNames,
    );

    const trainingTime = Date.now() - startTime;
    const modelId = this.generateModelId();

    return {
      modelId,
      accuracy: metrics.accuracy,
      precision: metrics.precision,
      recall: metrics.recall,
      f1Score: metrics.f1Score,
      auc: metrics.auc,
      crossValScores: cvResult.scores,
      hyperparameters: config.hyperparameters,
      trainingTime,
      modelSize: this.calculateModelSize(model),
      featureImportances,
    };
  }
  /**
   * Save trained model to database
   */
  private async saveModel(
    result: TrainingResult,
    experimentId: string,
  ): Promise<MLModel> {
    const model = this.modelRepository.create({
      name: `model_${result.modelId}`,
      type: 'breakout', // classification for breakout detection
      version: '1.0.0',
      status: 'active',
      accuracy: result.accuracy,
      precisionScore: result.precision,
      recallScore: result.recall,
      f1Score: result.f1Score,
      metadata: {
        experimentId,
        hyperparameters: result.hyperparameters,
        trainingTime: result.trainingTime,
        modelSize: result.modelSize,
        featureImportances: result.featureImportances,
      },
      description: `Automated trained model with ${result.hyperparameters.algorithm || 'ensemble'} algorithm`,
      deployedAt: new Date(),
    });

    const savedModel = await this.modelRepository.save(model);

    // Save performance metrics
    const performance = this.performanceRepository.create({
      modelId: savedModel.id,
      evaluationDate: new Date(),
      accuracy: result.accuracy,
      precision: result.precision,
      recall: result.recall,
      f1Score: result.f1Score,
      sampleSize: 1000, // This would be calculated from actual training data
      periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      periodEnd: new Date(),
      additionalMetrics: {
        auc: result.auc,
        crossValidationMean:
          result.crossValScores.reduce((a, b) => a + b, 0) /
          result.crossValScores.length,
        crossValidationStd: Math.sqrt(
          result.crossValScores.reduce(
            (sum, score) =>
              sum +
              Math.pow(
                score -
                  result.crossValScores.reduce((a, b) => a + b, 0) /
                    result.crossValScores.length,
                2,
              ),
            0,
          ) / result.crossValScores.length,
        ),
        trainingTime: result.trainingTime,
      },
    });

    await this.performanceRepository.save(performance);

    // Save individual metrics
    const currentDate = new Date();
    const periodStart = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    const metrics = [
      { name: 'accuracy', value: result.accuracy },
      { name: 'precision', value: result.precision },
      { name: 'recall', value: result.recall },
      { name: 'f1_score', value: result.f1Score },
      { name: 'auc', value: result.auc },
    ];

    for (const metric of metrics) {
      const mlMetric = this.metricRepository.create({
        modelId: savedModel.id,
        metricName: metric.name,
        metricValue: metric.value,
        calculationDate: currentDate,
        periodStart,
        periodEnd: currentDate,
      });
      await this.metricRepository.save(mlMetric);
    }

    return savedModel;
  }

  // Helper methods (simplified implementations)

  private generateExperimentId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateModelId(): string {
    return `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateGridSearchCombinations(
    paramGrid: Record<string, any[]>,
  ): Record<string, any>[] {
    const keys = Object.keys(paramGrid);
    const combinations: Record<string, any>[] = [];

    const generateCombination = (
      index: number,
      current: Record<string, any>,
    ) => {
      if (index === keys.length) {
        combinations.push({ ...current });
        return;
      }

      const key = keys[index];
      for (const value of paramGrid[key]) {
        current[key] = value;
        generateCombination(index + 1, current);
      }
    };

    generateCombination(0, {});
    return combinations;
  }

  private generateRandomParameters(
    paramGrid: Record<string, any[]>,
  ): Record<string, any> {
    const params: Record<string, any> = {};

    for (const [key, values] of Object.entries(paramGrid)) {
      const randomIndex = Math.floor(Math.random() * values.length);
      params[key] = values[randomIndex];
    }

    return params;
  }

  private async performBayesianOptimization(
    modelType: string,
    data: any[],
    targetColumn: string,
    config: HyperparameterTuningConfig,
  ): Promise<Record<string, any>> {
    // Simplified Bayesian optimization
    // In a real implementation, you would use libraries like scikit-optimize
    this.logger.warn(
      'Bayesian optimization is simplified in this implementation',
    );

    // Fall back to random search for now
    return this.generateRandomParameters(config.paramGrid);
  }

  private async evaluateParameterSet(
    modelType: string,
    data: any[],
    targetColumn: string,
    params: Record<string, any>,
    cvFolds: number,
  ): Promise<number> {
    const config: TrainingConfig = {
      modelType,
      hyperparameters: params,
      crossValidationFolds: cvFolds,
      testSize: 0.2,
    };

    const cvResult = await this.crossValidateModel(
      modelType,
      data,
      targetColumn,
      config,
    );
    return cvResult.mean;
  }

  private async trainModelFold(
    data: any[],
    targetColumn: string,
    config: TrainingConfig,
  ): Promise<any> {
    // Simplified model training for cross-validation fold
    // This would integrate with actual ML libraries like scikit-learn, TensorFlow, etc.
    return { type: config.modelType, params: config.hyperparameters };
  }

  private async evaluateModel(
    model: any,
    data: any[],
    targetColumn: string,
  ): Promise<number> {
    // Simplified model evaluation
    // This would perform actual prediction and scoring
    return 0.8 + Math.random() * 0.15; // Simulated accuracy between 0.8 and 0.95
  }

  private async preprocessData(
    data: any[],
    targetColumn: string,
    config: TrainingConfig,
  ) {
    // Simplified preprocessing
    // This would include feature scaling, encoding, etc.
    const features = data.map((row) => Object.values(row).slice(0, -1)); // All columns except target
    const target = data.map((row) => row[targetColumn]);
    const featureNames = Object.keys(data[0]).filter(
      (key) => key !== targetColumn,
    );

    return { features, target, featureNames };
  }

  private async createAndTrainModel(
    modelType: string,
    features: any[],
    target: any[],
    hyperparameters: Record<string, any>,
  ): Promise<any> {
    // Simplified model creation and training
    // This would integrate with actual ML libraries
    return { type: modelType, trained: true, params: hyperparameters };
  }

  private async predictWithModel(model: any, features: any[]): Promise<any[]> {
    // Simplified prediction
    // This would perform actual model inference
    return features.map(() => (Math.random() > 0.5 ? 1 : 0));
  }

  private calculateMetrics(actual: any[], predicted: any[]): any {
    // Simplified metrics calculation
    // This would calculate actual classification/regression metrics
    const accuracy = 0.85 + Math.random() * 0.1;
    return {
      accuracy,
      precision: accuracy * 0.98,
      recall: accuracy * 0.96,
      f1Score: accuracy * 0.97,
      auc: accuracy * 0.99,
    };
  }

  private async calculateFeatureImportances(
    model: any,
    featureNames: string[],
  ): Promise<Record<string, number>> {
    // Simplified feature importance calculation
    const importances: Record<string, number> = {};

    featureNames.forEach((name) => {
      importances[name] = Math.random();
    });

    // Normalize importances to sum to 1
    const total = Object.values(importances).reduce((sum, val) => sum + val, 0);
    Object.keys(importances).forEach((key) => {
      importances[key] = importances[key] / total;
    });

    return importances;
  }

  private calculateModelSize(model: any): number {
    // Simplified model size calculation in bytes
    return Math.floor(Math.random() * 10000000) + 1000000; // Between 1MB and 10MB
  }

  private async saveExperiment(experiment: ExperimentMetadata): Promise<void> {
    // In a real implementation, this would save to an experiment tracking system
    // like MLflow, Weights & Biases, etc.
    this.logger.log(
      `Experiment ${experiment.experimentId} saved with status: ${experiment.status}`,
    );
  }
}
