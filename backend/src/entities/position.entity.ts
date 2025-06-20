import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Portfolio } from './portfolio.entity';
import { Stock } from './stock.entity';

@Entity('positions')
export class Position {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  portfolioId: number;

  @Column()
  stockId: number;

  @Column({ type: 'varchar', length: 10 })
  symbol: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  averagePrice: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalCost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  currentValue: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  unrealizedPnL: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  unrealizedReturn: number;

  @ManyToOne(() => Portfolio, (portfolio) => portfolio.positions)
  @JoinColumn({ name: 'portfolioId' })
  portfolio: Portfolio;

  @ManyToOne(() => Stock)
  @JoinColumn({ name: 'stockId' })
  stock: Stock;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
