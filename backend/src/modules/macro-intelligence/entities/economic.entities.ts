import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('economic_forecasts')
export class EconomicForecast {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  country: string;

  @Column({ type: 'varchar' })
  indicator: string;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  currentValue: number;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  forecastValue: number;

  @Column({ type: 'varchar' })
  timeframe: string;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  confidence: number;

  @Column({ type: 'text' })
  methodology: string;

  @Column({ type: 'jsonb' })
  drivers: string[];

  @Column({ type: 'jsonb' })
  risks: string[];

  @Column({ type: 'varchar' })
  outlook: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('business_cycles')
export class BusinessCycle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  economy: string;

  @Column({ type: 'varchar' })
  phase: string;

  @Column({ type: 'integer' })
  duration: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  strength: number;

  @Column({ type: 'jsonb' })
  indicators: any;

  @Column({ type: 'jsonb' })
  nextPhase: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('recession_probabilities')
export class RecessionProbability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  country: string;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  sixMonthProbability: number;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  oneYearProbability: number;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  twoYearProbability: number;

  @Column({ type: 'jsonb' })
  indicators: any;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  historicalAccuracy: number;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  confidence: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
