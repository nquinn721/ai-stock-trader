import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('commodity_data')
@Index(['symbol', 'timestamp'])
export class CommodityData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  symbol: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50 })
  category: string; // energy, metals, agriculture

  @Column({ type: 'varchar', length: 50 })
  exchange: string;

  @Column({ type: 'decimal', precision: 18, scale: 8 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  change: number;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  changePercent: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  volume: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  openInterest: number;

  @Column({ type: 'timestamp', nullable: true })
  contractExpiry: Date;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  spotPrice: number;

  @Column({ type: 'decimal', precision: 18, scale: 8, nullable: true })
  futuresPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, nullable: true })
  contango: number; // Positive if futures > spot

  @Column({ type: 'json', nullable: true })
  seasonalPatterns: any;

  @Column({ type: 'json', nullable: true })
  supplyDemandData: any;

  @Column({ type: 'json', nullable: true })
  weatherData: any;

  @Column({ type: 'json', nullable: true })
  inventoryLevels: any;

  @Column({ type: 'json', nullable: true })
  technicalIndicators: any;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
