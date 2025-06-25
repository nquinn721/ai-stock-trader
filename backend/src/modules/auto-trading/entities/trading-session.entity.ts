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

export interface TradingSessionConfig {
  max_daily_trades?: number;
  max_position_size?: number;
  daily_loss_limit?: number;
  enable_risk_management?: boolean;
  trading_hours?: {
    start: string;
    end: string;
    timezone: string;
  };
  allowed_symbols?: string[];
  excluded_symbols?: string[];
}

@Entity('trading_sessions')
export class TradingSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  portfolio_id: string;

  @ManyToOne(() => Portfolio, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;

  @Column({ type: 'varchar', length: 255, nullable: true })
  session_name: string;

  @Column({ type: 'timestamp' })
  start_time: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_time: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'int', default: 0 })
  total_trades: number;

  @Column({ type: 'int', default: 0 })
  successful_trades: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  total_pnl: number;

  @Column({ type: 'json' })
  config: TradingSessionConfig;

  @Column({ type: 'text', nullable: true })
  stop_reason: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
