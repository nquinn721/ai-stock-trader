import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Stock } from './stock.entity';

@Entity('news')
export class News {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  stockId: number;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column()
  url: string;

  @Column()
  source: string;

  @Column('datetime')
  publishedAt: Date;

  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  sentimentScore: number; // -1 to 1, where -1 is very negative, 1 is very positive

  @Column({ nullable: true })
  sentimentLabel: string; // 'positive', 'negative', 'neutral'

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Stock)
  @JoinColumn({ name: 'stockId' })
  stock: Stock;
}
