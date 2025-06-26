import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface TradeDetail {
  symbol: string;
  entryPrice: number;
  exitPrice?: number;
  quantity: number;
  type: 'buy' | 'sell';
  timestamp: Date;
  pnl?: number;
}

export interface PerformanceMetrics {
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  consecutiveWins: number;
  consecutiveLosses: number;
}

export interface RiskMetrics {
  volatility: number;
  beta: number;
  alpha: number;
  valueAtRisk: number;
  expectedShortfall: number;
  calmarRatio: number;
  sortinoRatio: number;
  informationRatio: number;
}

@Entity('backtest_results')
export class BacktestResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  strategyId: string;

  @Column()
  userId: string;

  @Column()
  strategyName: string;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column('decimal', { precision: 15, scale: 2 })
  initialCapital: number;

  @Column('decimal', { precision: 15, scale: 2 })
  finalCapital: number;

  @Column('simple-array')
  symbols: string[];

  @Column()
  timeframe: string;

  @Column('json')
  performanceMetrics: PerformanceMetrics;

  @Column('json')
  riskMetrics: RiskMetrics;

  @Column('json')
  trades: TradeDetail[];

  @Column('json')
  equityCurve: Array<{ date: Date; value: number }>;

  @Column('json')
  drawdownCurve: Array<{ date: Date; drawdown: number }>;

  @Column('json', { nullable: true })
  monthlyReturns: Record<string, number>;

  @Column('json', { nullable: true })
  sectorExposure: Record<string, number>;

  @Column('json', { nullable: true })
  positionSizes: Array<{ symbol: string; size: number; timestamp: Date }>;

  @Column('json', { nullable: true })
  parameters: Record<string, any>;

  @Column('decimal', { precision: 10, scale: 6, default: 0.001 })
  commission: number;

  @Column('decimal', { precision: 10, scale: 6, default: 0.0005 })
  slippage: number;

  @Column({
    type: 'enum',
    enum: ['completed', 'running', 'failed', 'cancelled'],
    default: 'completed',
  })
  status: string;

  @Column('text', { nullable: true })
  errorMessage: string;

  @Column({ type: 'int', nullable: true })
  executionTimeMs: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
