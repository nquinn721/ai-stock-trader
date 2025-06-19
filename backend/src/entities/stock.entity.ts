import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('stocks')
export class Stock {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  symbol: string;

  @Column()
  name: string;

  @Column()
  sector: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  currentPrice: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  previousClose: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  changePercent: number;

  @Column('bigint', { nullable: true })
  volume: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  marketCap: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
