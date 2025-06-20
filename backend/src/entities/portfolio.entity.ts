import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('portfolios')
export class Portfolio {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 100000 })
  initialCash: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 100000 })
  currentCash: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalValue: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalPnL: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  totalReturn: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany('Position', 'portfolio')
  positions: any[];

  @OneToMany('Trade', 'portfolio')
  trades: any[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
