import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type StrategyType = 'VISUAL_BUILDER' | 'CODE_BASED' | 'ML_GENERATED' | 'TEMPLATE';
export type StrategyStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';

export interface StrategyNode {
  id: string;
  type: 'condition' | 'action' | 'logic' | 'ml_signal';
  position: { x: number; y: number };
  data: any;
  connections: string[];
}

export interface StrategyConfig {
  nodes: StrategyNode[];
  connections: Array<{
    from: string;
    to: string;
    type: 'trigger' | 'data' | 'logic';
  }>;
  settings: {
    riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
    maxDrawdown: number;
    positionSizing: 'FIXED' | 'PERCENTAGE' | 'KELLY' | 'ML_OPTIMIZED';
    timeframes: string[];
    symbols: string[];
  };
}

export interface BacktestResults {
  totalReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  avgHoldingPeriod: number;
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  finalCapital: number;
}

@Entity('trading_strategies')
export class TradingStrategy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['VISUAL_BUILDER', 'CODE_BASED', 'ML_GENERATED', 'TEMPLATE'],
    default: 'VISUAL_BUILDER',
  })
  strategy_type: StrategyType;

  @Column({
    type: 'enum',
    enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED'],
    default: 'DRAFT',
  })
  status: StrategyStatus;

  @Column()
  user_id: string;

  @Column()
  portfolio_id: string;

  @Column({ type: 'jsonb' })
  config: StrategyConfig;

  @Column({ type: 'jsonb', nullable: true })
  backtest_results: BacktestResults;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  performance_score: number;

  @Column({ type: 'int', default: 0 })
  version: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    tags: string[];
    complexity: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    estimatedExecutionTime: number;
    mlModelsUsed: string[];
    lastBacktestDate?: Date;
  };

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_execution_at: Date;

  @Column({ type: 'boolean', default: false })
  is_public: boolean;

  @Column({ type: 'boolean', default: false })
  is_template: boolean;
}