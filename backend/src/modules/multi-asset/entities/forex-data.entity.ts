import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('forex_data')
@Index(['pair', 'timestamp'])
export class ForexData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10 })
  pair: string;

  @Column({ type: 'varchar', length: 5 })
  baseCurrency: string;

  @Column({ type: 'varchar', length: 5 })
  quoteCurrency: string;

  @Column({ type: 'decimal', precision: 12, scale: 6 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  change: number;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  changePercent: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  volume24h: number;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  bid: number;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  ask: number;

  @Column({ type: 'decimal', precision: 10, scale: 6 })
  spread: number;

  @Column({ type: 'decimal', precision: 8, scale: 4 })
  interestRateDifferential: number;

  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  carryTradeReturn: number;

  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  volatility: number;

  @Column({ type: 'json', nullable: true })
  technicalData: any;

  @Column({ type: 'json', nullable: true })
  fundamentalData: any;

  @Column({ type: 'json', nullable: true })
  centralBankSentiment: any;

  @Column({ type: 'json', nullable: true })
  economicEvents: any;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
