import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Portfolio } from './portfolio.entity';
import { Stock } from './stock.entity';

export enum AutoTradingOrderStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  EXECUTED = 'executed',
  CANCELLED = 'cancelled',
}

export enum AutoTradingOrderAction {
  BUY = 'BUY',
  SELL = 'SELL',
}

export enum AutoTradingOrderType {
  MARKET = 'MARKET',
  LIMIT = 'LIMIT',
  STOP_LIMIT = 'STOP_LIMIT',
  BRACKET = 'BRACKET',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

@Entity('auto_trading_orders')
export class AutoTradingOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Portfolio, { nullable: false })
  @JoinColumn({ name: 'portfolio_id' })
  portfolio: Portfolio;

  @Column({ name: 'portfolio_id' })
  portfolioId: number;

  @Column({ length: 10 })
  symbol: string;

  @ManyToOne(() => Stock, { nullable: true })
  @JoinColumn({ name: 'symbol', referencedColumnName: 'symbol' })
  stock: Stock;

  @Column({
    type: 'enum',
    enum: AutoTradingOrderAction,
  })
  action: AutoTradingOrderAction;

  @Column({
    type: 'enum',
    enum: AutoTradingOrderType,
  })
  orderType: AutoTradingOrderType;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  quantity: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  limitPrice: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  stopPrice: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  stopLossPrice: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  takeProfitPrice: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  trailAmount: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 4,
    nullable: true,
  })
  trailPercent: number;

  @Column()
  expiryTime: Date;

  @Column({ type: 'uuid', nullable: true })
  recommendationId: string;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
  })
  confidence: number;

  @Column({ type: 'json', nullable: true })
  reasoning: string[];

  @Column({
    type: 'enum',
    enum: RiskLevel,
    default: RiskLevel.MEDIUM,
  })
  riskLevel: RiskLevel;

  @Column({
    type: 'enum',
    enum: AutoTradingOrderStatus,
    default: AutoTradingOrderStatus.PENDING,
  })
  status: AutoTradingOrderStatus;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  currentPrice: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  estimatedValue: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  riskPercentage: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  rejectedAt: Date;

  @Column({ nullable: true })
  executedAt: Date;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string;

  @Column({ nullable: true })
  executedOrderId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Computed properties
  get isPending(): boolean {
    return this.status === AutoTradingOrderStatus.PENDING;
  }

  get isApproved(): boolean {
    return this.status === AutoTradingOrderStatus.APPROVED;
  }

  get isRejected(): boolean {
    return this.status === AutoTradingOrderStatus.REJECTED;
  }

  get isExpired(): boolean {
    return (
      this.status === AutoTradingOrderStatus.EXPIRED ||
      (this.expiryTime && new Date() > this.expiryTime)
    );
  }

  get isExecuted(): boolean {
    return this.status === AutoTradingOrderStatus.EXECUTED;
  }

  get totalValue(): number {
    const price = this.limitPrice || this.currentPrice || 0;
    return Number(this.quantity) * Number(price);
  }

  get potentialProfit(): number {
    if (!this.takeProfitPrice || !this.limitPrice) return 0;
    const profitPerShare =
      this.action === AutoTradingOrderAction.BUY
        ? this.takeProfitPrice - this.limitPrice
        : this.limitPrice - this.takeProfitPrice;
    return Number(this.quantity) * profitPerShare;
  }

  get potentialLoss(): number {
    if (!this.stopLossPrice || !this.limitPrice) return 0;
    const lossPerShare =
      this.action === AutoTradingOrderAction.BUY
        ? this.limitPrice - this.stopLossPrice
        : this.stopLossPrice - this.limitPrice;
    return Number(this.quantity) * lossPerShare;
  }
}
