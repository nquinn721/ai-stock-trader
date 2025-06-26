import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface StrategyComponent {
  id: string;
  type: 'indicator' | 'condition' | 'action';
  name: string;
  category: string;
  parameters: Record<string, any>;
  position?: { x: number; y: number };
  connections?: string[];
}

export interface RiskRule {
  id: string;
  type: 'position_size' | 'stop_loss' | 'take_profit' | 'max_drawdown';
  parameters: Record<string, any>;
}

@Entity('strategy_templates')
export class StrategyTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column()
  category: string;

  @Column({
    type: 'enum',
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
  })
  complexity: string;

  @Column('json')
  components: StrategyComponent[];

  @Column('json')
  defaultRiskRules: RiskRule[];

  @Column('simple-array', { nullable: true })
  defaultSymbols: string[];

  @Column({ default: '1h' })
  defaultTimeframe: string;

  @Column('json', { nullable: true })
  backtestResults: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  popularity: number;

  @Column({ default: 0 })
  rating: number;

  @Column({ default: 0 })
  ratingCount: number;

  @Column({ default: 0 })
  usageCount: number;

  @Column('text', { nullable: true })
  documentation: string;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ nullable: true })
  authorId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
