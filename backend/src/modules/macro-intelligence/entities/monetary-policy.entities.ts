import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('monetary_policy_predictions')
export class MonetaryPolicyPrediction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  centralBank: string;

  @Column({ type: 'date' })
  meetingDate: Date;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  currentRate: number;

  @Column({ type: 'jsonb' })
  predictions: any;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  consensusView: number;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  marketPricing: number;

  @Column({ type: 'jsonb' })
  factors: any;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  confidence: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('policy_stance_analysis')
export class PolicyStanceAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  centralBank: string;

  @Column({ type: 'varchar' })
  stance: string;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  confidence: number;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  change: number;

  @Column({ type: 'jsonb' })
  keyThemes: string[];

  @Column({ type: 'jsonb' })
  concerns: string[];

  @Column({ type: 'jsonb' })
  priorities: string[];

  @Column({ type: 'jsonb' })
  marketImpact: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('qe_probability_assessments')
export class QEProbabilityAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  centralBank: string;

  @Column({ type: 'jsonb' })
  probability: any;

  @Column({ type: 'jsonb' })
  factors: any;

  @Column({ type: 'jsonb' })
  expectedScale: any;

  @Column({ type: 'jsonb' })
  marketImpact: any;

  @Column({ type: 'jsonb' })
  historicalComparison: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
