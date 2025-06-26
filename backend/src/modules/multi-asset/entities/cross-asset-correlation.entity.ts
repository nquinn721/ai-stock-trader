import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('cross_asset_correlation')
@Index(['asset1', 'asset2', 'timeframe', 'timestamp'])
export class CrossAssetCorrelation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  asset1: string; // Format: "assetClass:symbol"

  @Column({ type: 'varchar', length: 50 })
  asset2: string; // Format: "assetClass:symbol"

  @Column({ type: 'decimal', precision: 6, scale: 4 })
  correlation: number; // -1 to 1

  @Column({ type: 'varchar', length: 10 })
  timeframe: string; // 1D, 1W, 1M, 3M, 1Y

  @Column({ type: 'decimal', precision: 6, scale: 4 })
  confidence: number;

  @Column({ type: 'decimal', precision: 6, scale: 4, nullable: true })
  pValue: number;

  @Column({ type: 'integer' })
  sampleSize: number;

  @Column({ type: 'json', nullable: true })
  rollingCorrelations: any; // Array of historical correlations

  @Column({ type: 'boolean', default: false })
  isBreakdown: boolean; // True if correlation significantly changed

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
