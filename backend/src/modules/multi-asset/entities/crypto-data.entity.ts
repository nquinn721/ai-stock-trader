import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('crypto_data')
@Index(['symbol', 'timestamp'])
export class CryptoData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  symbol: string;

  @Column({ type: 'varchar', length: 50 })
  exchange: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  spotPrice: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  futuresPrice: number;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  volume24h: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  marketCap: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  circulatingSupply: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  totalSupply: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  maxSupply: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  fundingRate: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  openInterest: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  premiumIndex: number;

  @Column({ type: 'timestamp', nullable: true })
  nextFundingTime: Date;

  @Column({ type: 'json', nullable: true })
  onChainMetrics: any;

  @Column({ type: 'json', nullable: true })
  defiMetrics: any;

  @Column({ type: 'json', nullable: true })
  technicalIndicators: any;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
