import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Stock } from './stock.entity';

@Entity('stock_prices')
export class StockPrice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  stockId: number;

  @Column('decimal', { precision: 10, scale: 2 })
  open: number;

  @Column('decimal', { precision: 10, scale: 2 })
  high: number;

  @Column('decimal', { precision: 10, scale: 2 })
  low: number;

  @Column('decimal', { precision: 10, scale: 2 })
  close: number;

  @Column('decimal', { precision: 10, scale: 2 })
  adjustedClose: number;

  @Column('bigint')
  volume: number;

  @Column('date')
  date: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Stock)
  @JoinColumn({ name: 'stockId' })
  stock: Stock;
}
