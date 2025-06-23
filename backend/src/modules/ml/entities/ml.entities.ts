import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ml_models')
export class MLModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 20 })
  version: string;

  @Column({ length: 50 })
  type: string; // 'breakout', 'risk', 'sentiment', 'portfolio'

  @Column({ length: 20, default: 'active' })
  status: string; // 'active', 'deprecated', 'testing'

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  accuracy: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  precisionScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  recallScore: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
  f1Score: number;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  deployedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('ml_predictions')
@Index(['symbol', 'createdAt'])
@Index(['modelId', 'createdAt'])
export class MLPrediction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  modelId: string;

  @Column({ length: 10, nullable: true })
  symbol: string;

  @Column({ type: 'integer', nullable: true })
  portfolioId: number;

  @Column({ length: 50 })
  predictionType: string;

  @Column({ type: 'json' })
  inputFeatures: Record<string, any>;

  @Column({ type: 'json' })
  outputPrediction: Record<string, any>;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  confidence: number;

  @Column({ type: 'json', nullable: true })
  actualOutcome: Record<string, any>; // filled later for evaluation

  @Column({ type: 'integer' })
  executionTime: number; // milliseconds

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  accuracy: number; // calculated after actual outcome

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('ml_metrics')
@Index(['modelId', 'calculationDate'])
export class MLMetric {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  modelId: string;

  @Column({ length: 50 })
  metricName: string;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  metricValue: number;

  @Column({ type: 'date' })
  calculationDate: Date;

  @Column({ type: 'timestamp' })
  periodStart: Date;

  @Column({ type: 'timestamp' })
  periodEnd: Date;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('ml_ab_tests')
export class MLABTest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  testName: string;

  @Column({ length: 50 })
  controlModelId: string;

  @Column({ length: 50 })
  variantModelId: string;
  @Column({ type: 'int', default: 1000 })
  minimumSampleSize: number;

  @Column({ type: 'decimal', precision: 3, scale: 2 })
  trafficSplit: number; // 0.5 = 50/50 split

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  endDate: Date;

  @Column({ length: 20, default: 'running' })
  status: string; // 'running', 'completed', 'paused'

  @Column({ type: 'json', nullable: true })
  results: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  hypothesis: string;

  @Column({ type: 'text', nullable: true })
  conclusion: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('ml_feature_importance')
@Index(['modelId', 'createdAt'])
export class MLFeatureImportance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  modelId: string;

  @Column({ length: 100 })
  featureName: string;

  @Column({ type: 'decimal', precision: 8, scale: 6 })
  importance: number;

  @Column({ type: 'decimal', precision: 8, scale: 6, nullable: true })
  correlation: number;

  @Column({ length: 20 })
  importanceType: string; // 'permutation', 'shap', 'gain', etc.

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('ml_model_performance')
@Index(['modelId', 'evaluationDate'])
export class MLModelPerformance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  modelId: string;

  @Column({ type: 'date' })
  evaluationDate: Date;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  accuracy: number;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  precision: number;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  recall: number;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  f1Score: number;

  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  sharpeRatio: number;

  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  maxDrawdown: number;

  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  totalReturn: number;

  @Column({ type: 'integer' })
  sampleSize: number;

  @Column({ type: 'timestamp' })
  periodStart: Date;

  @Column({ type: 'timestamp' })
  periodEnd: Date;

  @Column({ type: 'json', nullable: true })
  confusionMatrix: Record<string, any>;

  @Column({ type: 'json', nullable: true })
  additionalMetrics: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
