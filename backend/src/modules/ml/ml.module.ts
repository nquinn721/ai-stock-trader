import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsModule } from '../news/news.module';
import {
  MLABTest,
  MLFeatureImportance,
  MLMetric,
  MLModel,
  MLModelPerformance,
  MLPrediction,
} from './entities/ml.entities';
import { MLController } from './ml.controller';
import { ABTestingService } from './services/ab-testing.service';
import { BreakoutDetectionService } from './services/breakout-detection.service';
import { DataIngestionService } from './services/data-ingestion.service';
import { DataPipelineOrchestratorService } from './services/data-pipeline-orchestrator.service';
import { DataPreprocessingService } from './services/data-preprocessing.service';
import { DataStorageService } from './services/data-storage.service';
import { DataValidationService } from './services/data-validation.service';
import { DataVersioningService } from './services/data-versioning.service';
import { DynamicRiskManagementService } from './services/dynamic-risk-management.service';
import { EnsembleSystemsService } from './services/ensemble-systems.service';
import { ExperimentTrackingService } from './services/experiment-tracking.service';
import { FeatureEngineeringService } from './services/feature-engineering.service';
import { FeaturePipelineService } from './services/feature-pipeline.service';
import { IntelligentRecommendationService } from './services/intelligent-recommendation.service';
import { MarketPredictionService } from './services/market-prediction.service';
import { MLInferenceService } from './services/ml-inference.service';
import { MLService } from './services/ml.service';
import { ModelMonitoringService } from './services/model-monitoring.service';
import { ModelTrainingService } from './services/model-training.service';
import { PatternRecognitionService } from './services/pattern-recognition.service';
import { PortfolioOptimizationService } from './services/portfolio-optimization.service';
import { RealTimeModelUpdateService } from './services/real-time-model-update.service';
import { SentimentAnalysisService } from './services/sentiment-analysis.service';
import { SentimentMonitoringService } from './services/sentiment-monitoring.service';
import { SignalGenerationService } from './services/signal-generation.service';

@Module({
  imports: [
    NewsModule,
    TypeOrmModule.forFeature([
      MLModel,
      MLPrediction,
      MLMetric,
      MLABTest,
      MLFeatureImportance,
      MLModelPerformance,
    ]),
  ],
  controllers: [MLController],
  providers: [
    MLService,
    FeatureEngineeringService,
    MLInferenceService,
    ABTestingService,
    ModelMonitoringService,
    SentimentAnalysisService,
    SentimentMonitoringService,
    PortfolioOptimizationService,
    PatternRecognitionService,
    MarketPredictionService,
    SignalGenerationService,
    EnsembleSystemsService,
    // S29C Real-time Model Updates
    RealTimeModelUpdateService,
    // S27A Data Pipeline Services
    DataIngestionService,
    FeaturePipelineService,
    DataValidationService,
    DataVersioningService,
    DataStorageService,
    DataPreprocessingService,
    DataPipelineOrchestratorService,
    // S27B Model Training Infrastructure
    ModelTrainingService,
    ExperimentTrackingService,
    // S27C Breakout Detection ML Model
    BreakoutDetectionService, // S27D Dynamic Risk Management ML System
    DynamicRiskManagementService,
    // S19 Intelligent Recommendation Engine
    IntelligentRecommendationService,
  ],
  exports: [
    MLService,
    FeatureEngineeringService,
    MLInferenceService,
    ABTestingService,
    ModelMonitoringService,
    SentimentAnalysisService,
    SentimentMonitoringService,
    PortfolioOptimizationService,
    PatternRecognitionService,
    MarketPredictionService,
    SignalGenerationService,
    EnsembleSystemsService, // S29C Real-time Model Updates
    RealTimeModelUpdateService,
    // S27A Data Pipeline Services
    DataIngestionService,
    FeaturePipelineService,
    DataValidationService,
    DataVersioningService,
    DataStorageService,
    DataPreprocessingService,
    DataPipelineOrchestratorService,
    // S27B Model Training Infrastructure
    ModelTrainingService,
    ExperimentTrackingService,
    // S27C Breakout Detection ML Model
    BreakoutDetectionService, // S27D Dynamic Risk Management ML System
    DynamicRiskManagementService,
    // S19 Intelligent Recommendation Engine
    IntelligentRecommendationService,
  ],
})
export class MLModule {}
