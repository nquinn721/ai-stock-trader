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
import { Position } from './position.entity';
import { Stock } from './stock.entity';

export enum OrderType {
  MARKET = 'market',
  LIMIT = 'limit',
  STOP_LOSS = 'stop_loss',
  TAKE_PROFIT = 'take_profit',
  STOP_LIMIT = 'stop_limit',
  ENTRY = 'entry', // Legacy support
}

export enum OrderSide {
  BUY = 'buy',
  SELL = 'sell',
}

export enum OrderStatus {
  PENDING = 'pending',
  TRIGGERED = 'triggered',
  EXECUTED = 'executed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum TimeInForce {
  DAY = 'day',
  GTC = 'gtc', // Good Till Cancelled
  IOC = 'ioc', // Immediate or Cancel
  FOK = 'fok', // Fill or Kill
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

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
    enum: OrderType,
  })
  orderType: OrderType;

  @Column({
    type: 'enum',
    enum: OrderSide,
  })
  side: OrderSide;

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
  triggerPrice: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: TimeInForce,
    default: TimeInForce.DAY,
  })
  timeInForce: TimeInForce;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  executedPrice: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  executedQuantity: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  commission: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  expiryDate: Date;

  @Column({ nullable: true })
  executedAt: Date;

  @Column({ nullable: true })
  cancelledAt: Date;

  @Column({ type: 'text', nullable: true })
  cancellationReason: string;

  // Parent order reference for bracket orders
  @Column({ nullable: true })
  parentOrderId: number;

  @ManyToOne(() => Order, { nullable: true })
  @JoinColumn({ name: 'parent_order_id' })
  parentOrder: Order;

  // Legacy support
  @Column({ nullable: true })
  positionId: number;

  @ManyToOne(() => Position, { nullable: true })
  @JoinColumn({ name: 'positionId' })
  position: Position;

  @Column({ type: 'timestamp', nullable: true })
  expirationDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Calculated fields
  get totalValue(): number {
    return (
      Number(this.quantity) * Number(this.executedPrice || this.limitPrice || 0)
    );
  }

  get isActive(): boolean {
    return (
      this.status === OrderStatus.PENDING ||
      this.status === OrderStatus.TRIGGERED
    );
  }

  get isPending(): boolean {
    return this.status === OrderStatus.PENDING;
  }

  get isExecuted(): boolean {
    return this.status === OrderStatus.EXECUTED;
  }

  get isCancelled(): boolean {
    return this.status === OrderStatus.CANCELLED;
  }

  // Legacy support for existing code
  get type(): OrderType {
    return this.orderType;
  }

  set type(value: OrderType) {
    this.orderType = value;
  }
}
