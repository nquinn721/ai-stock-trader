import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ArbitrageType } from '../types/multi-asset.types';

@Entity('arbitrage_opportunity')
@Index(['type', 'expectedReturn', 'expirationTime'])
export class ArbitrageOpportunity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ArbitrageType,
  })
  type: ArbitrageType;

  @Column({ type: 'json' })
  assets: any; // Array of AssetIdentifier

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  expectedReturn: number; // Percentage return

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  requiredCapital: number;

  @Column({ type: 'integer' })
  timeToExecution: number; // Seconds

  @Column({ type: 'varchar', length: 20 })
  riskLevel: string; // low, medium, high

  @Column({ type: 'decimal', precision: 4, scale: 3 })
  confidence: number; // 0-1

  @Column({ type: 'timestamp' })
  expirationTime: Date;

  @Column({ type: 'json' })
  executionSteps: any; // Array of ArbitrageStep

  @Column({ type: 'boolean', default: false })
  executed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  executedAt: Date;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  actualReturn: number;

  @Column({ type: 'json', nullable: true })
  executionResults: any;

  @Column({ type: 'json', nullable: true })
  marketConditions: any;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
