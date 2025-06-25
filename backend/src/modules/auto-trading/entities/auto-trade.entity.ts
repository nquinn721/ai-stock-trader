import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Portfolio } from '../../../entities/portfolio.entity';
import { TradingRule } from './trading-rule.entity';

export enum AutoTradeStatus {
  PENDING = 'pending',
  EXECUTING = 'executing',
  EXECUTED = 'executed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum TradeType {
  BUY = 'buy',
  SELL = 'sell',
}

@Entity('auto_trades')
export class AutoTrade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  portfolio_id: string;

  @ManyToOne(() => Portfolio, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;

  @Column({ type: 'varchar', length: 10 })
  symbol: string;

  @Column({
    type: 'enum',
    enum: TradeType,
  })
  trade_type: TradeType;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  trigger_price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  executed_price: number;

  @Column({
    type: 'enum',
    enum: AutoTradeStatus,
    default: AutoTradeStatus.PENDING,
  })
  status: AutoTradeStatus;

  @Column({ type: 'uuid', nullable: true })
  rule_id: string;

  @ManyToOne(() => TradingRule, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'rule_id' })
  rule: TradingRule;

  @Column({ type: 'uuid', nullable: true })
  recommendation_id: string;

  @Column({ type: 'text', nullable: true })
  failure_reason: string;

  @Column({ type: 'json', nullable: true })
  execution_details: any;

  @Column({ type: 'timestamp', nullable: true })
  executed_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
