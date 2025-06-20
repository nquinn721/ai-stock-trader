import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Portfolio } from './portfolio.entity';
import { Stock } from './stock.entity';

export enum TradeType {
  BUY = 'buy',
  SELL = 'sell',
}

export enum TradeStatus {
  PENDING = 'pending',
  EXECUTED = 'executed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

@Entity('trades')
export class Trade {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  portfolioId: number;

  @Column()
  stockId: number;

  @Column({ type: 'varchar', length: 10 })
  symbol: string;

  @Column({ type: 'enum', enum: TradeType })
  type: TradeType;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalValue: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  commission: number;

  @Column({ type: 'enum', enum: TradeStatus, default: TradeStatus.EXECUTED })
  status: TradeStatus;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => Portfolio, (portfolio) => portfolio.trades)
  @JoinColumn({ name: 'portfolioId' })
  portfolio: Portfolio;

  @ManyToOne(() => Stock)
  @JoinColumn({ name: 'stockId' })
  stock: Stock;

  @CreateDateColumn()
  executedAt: Date;
}
