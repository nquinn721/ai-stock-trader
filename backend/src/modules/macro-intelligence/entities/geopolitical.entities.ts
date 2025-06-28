import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('political_stability_scores')
export class PoliticalStabilityScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  country: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  overall: number;

  @Column({ type: 'json' })
  components: any;

  @Column({ type: 'json' })
  trends: any;

  @Column({ type: 'json' })
  risks: any;

  @Column({ type: 'json' })
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

  @Column({ type: 'json' })
  predictions: any;

  @Column({ type: 'json' })
  scenarios: any;

  @Column({ type: 'json' })
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

  @Column({ type: 'json' })
  regions: string[];

  @Column({ type: 'varchar' })
  riskLevel: string;

  @Column({ type: 'json' })
  conflictTypes: any;

  @Column({ type: 'json' })
  drivers: any;

  @Column({ type: 'json' })
  timeframe: any;

  @Column({ type: 'json' })
  spilloverRisk: any;

  @Column({ type: 'json' })
  preventionMeasures: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
