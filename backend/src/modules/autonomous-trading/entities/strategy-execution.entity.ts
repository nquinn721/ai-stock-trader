import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TradingStrategy } from './trading-strategy.entity';

export type ExecutionStatus = 'ACTIVE' | 'PAUSED' | 'STOPPED' | 'ERROR';
export type ExecutionMode = 'LIVE' | 'PAPER' | 'SIMULATION';

export interface ExecutionMetrics {
  tradesExecuted: number;
  profitableTrades: number;
  currentDrawdown: number;
  totalPnL: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  sharpeRatio: number;
  lastTradeDate?: Date;
}

export interface ExecutionSettings {
  mode: ExecutionMode;
  maxRisk: number;
  maxDailyLoss: number;
  maxPositions: number;
  emergencyStop: boolean;
  notificationSettings: {
    onTrade: boolean;
    onError: boolean;
    onThreshold: boolean;
  };
}

@Entity('strategy_executions')
export class StrategyExecution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  strategy_id: string;

  @ManyToOne(() => TradingStrategy)
  @JoinColumn({ name: 'strategy_id' })
  strategy: TradingStrategy;

  @Column()
  portfolio_id: string;

  @Column({
    type: 'enum',
    enum: ['ACTIVE', 'PAUSED', 'STOPPED', 'ERROR'],
    default: 'ACTIVE',
  })
  status: ExecutionStatus;

  @Column({
    type: 'enum',
    enum: ['LIVE', 'PAPER', 'SIMULATION'],
    default: 'PAPER',
  })
  mode: ExecutionMode;

  @Column({ type: 'jsonb' })
  settings: ExecutionSettings;

  @Column({ type: 'jsonb', nullable: true })
  metrics: ExecutionMetrics;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  allocated_capital: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  current_value: number;

  @Column({ type: 'text', nullable: true })
  last_error: string;

  @Column({ type: 'jsonb', nullable: true })
  current_positions: Array<{
    symbol: string;
    quantity: number;
    entryPrice: number;
    currentPrice: number;
    unrealizedPnL: number;
    entryDate: Date;
  }>;

  @Column({ type: 'jsonb', nullable: true })
  performance_history: Array<{
    date: Date;
    value: number;
    drawdown: number;
    trades: number;
  }>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  stopped_at: Date;
}