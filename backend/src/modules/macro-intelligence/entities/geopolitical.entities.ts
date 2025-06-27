import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('political_stability_scores')
export class PoliticalStabilityScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  country: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  overall: number;

  @Column({ type: 'jsonb' })
  components: any;

  @Column({ type: 'jsonb' })
  trends: any;

  @Column({ type: 'jsonb' })
  risks: any;

  @Column({ type: 'jsonb' })
  stabilizers: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('election_predictions')
export class ElectionPrediction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  country: string;

  @Column({ type: 'varchar' })
  electionType: string;

  @Column({ type: 'date' })
  electionDate: Date;

  @Column({ type: 'jsonb' })
  predictions: any;

  @Column({ type: 'jsonb' })
  scenarios: any;

  @Column({ type: 'jsonb' })
  keyFactors: string[];

  @Column({ type: 'decimal', precision: 5, scale: 4 })
  uncertainty: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('conflict_risk_assessments')
export class ConflictRiskAssessment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb' })
  regions: string[];

  @Column({ type: 'varchar' })
  riskLevel: string;

  @Column({ type: 'jsonb' })
  conflictTypes: any;

  @Column({ type: 'jsonb' })
  drivers: any;

  @Column({ type: 'jsonb' })
  timeframe: any;

  @Column({ type: 'jsonb' })
  spilloverRisk: any;

  @Column({ type: 'jsonb' })
  preventionMeasures: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
