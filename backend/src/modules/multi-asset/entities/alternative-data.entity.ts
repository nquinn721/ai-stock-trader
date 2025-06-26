import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AlternativeDataType } from '../types/multi-asset.types';

@Entity('alternative_data')
@Index(['assetSymbol', 'dataType', 'timestamp'])
export class AlternativeData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  assetSymbol: string;

  @Column({ type: 'varchar', length: 20 })
  assetClass: string;

  @Column({
    type: 'enum',
    enum: AlternativeDataType,
  })
  dataType: AlternativeDataType;

  @Column({ type: 'varchar', length: 100 })
  source: string;

  @Column({ type: 'json' })
  data: any;

  @Column({ type: 'decimal', precision: 4, scale: 3 })
  reliability: number; // 0-1 score

  @Column({ type: 'varchar', length: 20 })
  impact: string; // bullish, bearish, neutral

  @Column({ type: 'decimal', precision: 4, scale: 3, nullable: true })
  confidence: number;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @Column({ type: 'json', nullable: true })
  geographicData: any;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
