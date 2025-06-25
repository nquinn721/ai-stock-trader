import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('chat_messages')
@Index(['userId', 'conversationId'])
@Index(['timestamp'])
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  userId: string;

  @Column()
  @Index()
  conversationId: string;

  @Column('text')
  message: string;

  @Column('text')
  response: string;

  @Column('json', { nullable: true })
  context: Record<string, any>;

  @Column('decimal', { precision: 3, scale: 2, default: 0.0 })
  confidence: number;

  @Column('json', { nullable: true })
  sources: string[];

  @CreateDateColumn()
  timestamp: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('conversation_contexts')
@Index(['userId'])
@Index(['lastInteraction'])
export class ConversationContext {
  @PrimaryGeneratedColumn('uuid')
  conversationId: string;

  @Column()
  @Index()
  userId: string;

  @Column('json', { default: '{}' })
  context: Record<string, any>;

  @Column({ default: 1 })
  messageCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  lastInteraction: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  endedAt: Date;
}

@Entity('ai_explanations')
@Index(['symbol'])
@Index(['recommendationId'])
@Index(['timestamp'])
export class AIExplanation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  @Index()
  recommendationId: string;

  @Column()
  @Index()
  symbol: string;

  @Column()
  signal: 'BUY' | 'SELL' | 'HOLD';

  @Column('text')
  explanation: string;

  @Column('decimal', { precision: 3, scale: 2 })
  confidence: number;

  @Column('json')
  indicators: Record<string, number>;

  @Column('json')
  marketConditions: Record<string, any>;

  @Column('json')
  riskFactors: string[];

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  priceTarget: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  stopLoss: number;

  @CreateDateColumn()
  timestamp: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
