import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Stock } from './stock.entity';

export enum SignalType {
  BUY = 'buy',
  SELL = 'sell',
  HOLD = 'hold',
}

@Entity('trading_signals')
export class TradingSignal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  stockId: number;

  @Column({
    type: 'enum',
    enum: SignalType,
  })
  signal: SignalType;

  @Column('decimal', { precision: 3, scale: 2 })
  confidence: number; // 0 to 1

  @Column('decimal', { precision: 10, scale: 2 })
  targetPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  currentPrice: number;

  @Column('text', { nullable: true })
  reason: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Stock)
  @JoinColumn({ name: 'stockId' })
  stock: Stock;
}
