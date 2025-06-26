import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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

@Entity('trading_strategies')
export class TradingStrategy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('json')
  components: StrategyComponent[];

  @Column('json')
  riskRules: RiskRule[];

  @Column('simple-array', { nullable: true })
  symbols: string[];

  @Column({ default: '1h' })
  timeframe: string;

  @Column({ 
    type: 'enum', 
    enum: ['draft', 'active', 'paused', 'published', 'archived'],
    default: 'draft'
  })
  status: string;

  @Column({ default: 1 })
  version: number;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastBacktestAt: Date;

  @Column('json', { nullable: true })
  performance: Record<string, any>;

  @Column({ default: 0 })
  popularity: number;

  @Column({ default: 0 })
  rating: number;

  @Column({ default: 0 })
  ratingCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
