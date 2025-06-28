import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column({ type: 'json' })
  predictions: any;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  consensusView: number;

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  marketPricing: number;

  @Column({ type: 'json' })
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

  @Column({ type: 'json' })
  keyThemes: string[];

  @Column({ type: 'json' })
  concerns: string[];

  @Column({ type: 'json' })
  priorities: string[];

  @Column({ type: 'json' })
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

  @Column({ type: 'json' })
  probability: any;

  @Column({ type: 'json' })
  factors: any;

  @Column({ type: 'json' })
  expectedScale: any;

  @Column({ type: 'json' })
  marketImpact: any;

  @Column({ type: 'json' })
  historicalComparison: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
