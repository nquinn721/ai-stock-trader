import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('portfolios')
export class Portfolio {
  @PrimaryGeneratedColumn()
  id: number;
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, default: 'BASIC' })
  portfolioType: string; // DAY_TRADING_PRO, DAY_TRADING_STANDARD, SMALL_ACCOUNT_BASIC, MICRO_ACCOUNT_STARTER

  @Column({ type: 'boolean', default: false })
  dayTradingEnabled: boolean;

  @Column({ type: 'int', default: 0 })
  dayTradeCount: number; // Tracks day trades in rolling 5 business day period

  @Column({ type: 'date', nullable: true })
  lastDayTradeReset: Date; // Last time day trade count was reset

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 100000 })
  initialCash: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 100000 })
  currentCash: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalValue: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalPnL: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  totalReturn: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany('Position', 'portfolio')
  positions: any[];

  @OneToMany('Trade', 'portfolio')
  trades: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
