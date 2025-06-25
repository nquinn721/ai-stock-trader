import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Portfolio } from '../../../entities/portfolio.entity';

export enum RuleType {
  ENTRY = 'entry',
  EXIT = 'exit',
  RISK = 'risk',
}

export interface RuleCondition {
  field: string;
  operator:
    | 'equals'
    | 'greater_than'
    | 'less_than'
    | 'greater_equal'
    | 'less_equal'
    | 'not_equals';
  value: any;
  logical?: 'AND' | 'OR';
}

export interface RuleAction {
  type: 'buy' | 'sell' | 'stop_loss' | 'take_profit';
  sizing_method: 'fixed' | 'percentage' | 'kelly' | 'full_position';
  size_value?: number;
  max_position_size?: number;
  price_type?: 'market' | 'limit' | 'stop';
  price_offset?: number;
}

@Entity('trading_rules')
export class TradingRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  portfolio_id: string;

  @ManyToOne(() => Portfolio, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({
    type: 'enum',
    enum: RuleType,
  })
  rule_type: RuleType;

  @Column({ type: 'json' })
  conditions: RuleCondition[];

  @Column({ type: 'json' })
  actions: RuleAction[];

  @Column({ type: 'int', default: 0 })
  priority: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
