import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AssetClass } from '../types/multi-asset.types';

@Entity('asset_data')
@Index(['symbol', 'assetClass', 'timestamp'])
export class AssetData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  symbol: string;

  @Column({
    type: 'enum',
    enum: AssetClass,
  })
  assetClass: AssetClass;

  @Column({ type: 'varchar', length: 50, nullable: true })
  exchange: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  currency: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  price: number;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  volume: number;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  change: number;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  changePercent: number;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  high24h: number;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  low24h: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  marketCap: number;

  @Column({ type: 'json', nullable: true })
  technicalIndicators: any;

  @Column({ type: 'json', nullable: true })
  additionalData: any;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
