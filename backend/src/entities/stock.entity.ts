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

  @Column({ nullable: true })
  sector: string;

  @Column({ default: false })
  favorite: boolean;

  // Live price data columns (not stored in DB, calculated on-the-fly)
  currentPrice?: number;
  previousClose?: number;
  changePercent?: number;
  volume?: number;
  marketCap?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
