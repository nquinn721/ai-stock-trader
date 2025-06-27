import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TradingStrategy } from './trading-strategy.entity';

export type BacktestStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface BacktestParameters {
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  commission: number;
  slippage: number;
  symbols: string[];
  benchmarkSymbol: string;
  riskFreeRate: number;
}

export interface BacktestMetrics {
  returns: {
    total: number;
    annualized: number;
    volatility: number;
    sharpeRatio: number;
    sortinoRatio: number;
    calmarRatio: number;
  };
  drawdown: {
    maximum: number;
    current: number;
    duration: number;
    recoveryTime: number;
  };
  trades: {
    total: number;
    profitable: number;
    unprofitable: number;
    winRate: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
    avgHoldingPeriod: number;
  };
  risk: {
    valueAtRisk: number;
    conditionalVaR: number;
    beta: number;
    alpha: number;
    informationRatio: number;
  };
  benchmark: {
    correlation: number;
    trackingError: number;
    upCapture: number;
    downCapture: number;
  };
}

export interface TradeRecord {
  symbol: string;
  entryDate: Date;
  exitDate: Date;
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  side: 'BUY' | 'SELL';
  pnl: number;
  commission: number;
  slippage: number;
  holdingPeriod: number;
  tags: string[];
}

@Entity('strategy_backtests')
export class StrategyBacktest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  strategy_id: string;

  @ManyToOne(() => TradingStrategy)
  @JoinColumn({ name: 'strategy_id' })
  strategy: TradingStrategy;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'],
    default: 'PENDING',
  })
  status: BacktestStatus;

  @Column({ type: 'jsonb' })
  parameters: BacktestParameters;

  @Column({ type: 'jsonb', nullable: true })
  metrics: BacktestMetrics;

  @Column({ type: 'jsonb', nullable: true })
  trade_records: TradeRecord[];

  @Column({ type: 'jsonb', nullable: true })
  equity_curve: Array<{
    date: Date;
    equity: number;
    drawdown: number;
    benchmarkEquity: number;
  }>;

  @Column({ type: 'int', default: 0 })
  progress_percentage: number;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Column({ type: 'jsonb', nullable: true })
  execution_stats: {
    startTime: Date;
    endTime?: Date;
    duration?: number;
    memoryUsage?: number;
    cpuUsage?: number;
  };

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date;
}