import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('market_making_strategies')
export class MarketMakingStrategyEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ 
    type: 'enum',
    enum: ['CONSERVATIVE', 'AGGRESSIVE', 'BALANCED', 'SCALPING'],
    default: 'BALANCED'
  })
  type: string;

  @Column({ 
    type: 'enum',
    enum: ['ACTIVE', 'INACTIVE', 'PAUSED', 'ERROR'],
    default: 'ACTIVE'
  })
  status: string;

  @Column('json')
  symbols: string[];

  @Column('decimal', { precision: 10, scale: 6 })
  maxSpreadWidth: number;

  @Column('decimal', { precision: 15, scale: 2 })
  inventoryTarget: number;

  @Column('json')
  riskProfile: object;

  @Column('json')
  parameters: object;

  @Column('decimal', { precision: 15, scale: 2, default: 0 })
  totalPnl: number;

  @Column('decimal', { precision: 10, scale: 4, default: 0 })
  sharpeRatio: number;

  @Column('decimal', { precision: 10, scale: 4, default: 0 })
  maxDrawdown: number;

  @Column('int', { default: 0 })
  totalTrades: number;

  @Column('decimal', { precision: 10, scale: 4, default: 0 })
  winRate: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  lastExecutedAt: Date;
}

@Entity('market_making_quotes')
export class MarketMakingQuoteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20 })
  symbol: string;

  @Column({ length: 50 })
  venue: string;

  @Column('decimal', { precision: 15, scale: 6 })
  bidPrice: number;

  @Column('decimal', { precision: 15, scale: 6 })
  askPrice: number;

  @Column('int')
  bidSize: number;

  @Column('int')
  askSize: number;

  @Column('decimal', { precision: 10, scale: 6 })
  spread: number;

  @Column('decimal', { precision: 10, scale: 4 })
  confidence: number;

  @Column('decimal', { precision: 15, scale: 8 })
  expectedProfit: number;

  @Column('decimal', { precision: 10, scale: 4 })
  riskScore: number;

  @Column({ 
    type: 'enum',
    enum: ['ACTIVE', 'FILLED', 'CANCELLED', 'EXPIRED'],
    default: 'ACTIVE'
  })
  status: string;

  @Column({ nullable: true })
  bidOrderId: string;

  @Column({ nullable: true })
  askOrderId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  filledAt: Date;
}

@Entity('arbitrage_opportunities')
export class ArbitrageOpportunityEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ 
    type: 'enum',
    enum: ['SPATIAL', 'TEMPORAL', 'STATISTICAL', 'TRIANGULAR'],
    default: 'SPATIAL'
  })
  type: string;

  @Column('json')
  instruments: object[];

  @Column('decimal', { precision: 10, scale: 6 })
  profitPotential: number;

  @Column('decimal', { precision: 10, scale: 4 })
  riskScore: number;

  @Column('decimal', { precision: 15, scale: 2 })
  requiredCapital: number;

  @Column('int')
  executionTimeframe: number; // minutes

  @Column('decimal', { precision: 10, scale: 4 })
  confidence: number;

  @Column({ 
    type: 'enum',
    enum: ['DETECTED', 'EXECUTING', 'EXECUTED', 'EXPIRED', 'FAILED'],
    default: 'DETECTED'
  })
  status: string;

  @Column('decimal', { precision: 15, scale: 8, nullable: true })
  actualProfit: number;

  @Column('decimal', { precision: 10, scale: 6, nullable: true })
  executionSlippage: number;

  @Column('json', { nullable: true })
  executionResults: object;

  @CreateDateColumn()
  discoveredAt: Date;

  @Column()
  expiresAt: Date;

  @Column({ nullable: true })
  executedAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('risk_exposures')
export class RiskExposureEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20 })
  symbol: string;

  @Column({ length: 50 })
  portfolioId: string;

  @Column('decimal', { precision: 15, scale: 8 })
  delta: number;

  @Column('decimal', { precision: 15, scale: 8 })
  gamma: number;

  @Column('decimal', { precision: 15, scale: 8 })
  theta: number;

  @Column('decimal', { precision: 15, scale: 8 })
  vega: number;

  @Column('decimal', { precision: 15, scale: 8 })
  rho: number;

  @Column('decimal', { precision: 15, scale: 2 })
  totalExposure: number;

  @Column('decimal', { precision: 15, scale: 2 })
  marketValue: number;

  @Column('decimal', { precision: 10, scale: 4 })
  riskScore: number;

  @Column('json', { nullable: true })
  hedgingActions: object;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('liquidity_positions')
export class LiquidityPositionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  poolId: string;

  @Column({ length: 50 })
  protocol: string;

  @Column({ length: 20 })
  tokenA: string;

  @Column({ length: 20 })
  tokenB: string;

  @Column('decimal', { precision: 20, scale: 8 })
  lpTokens: number;

  @Column('decimal', { precision: 15, scale: 2 })
  initialValue: number;

  @Column('decimal', { precision: 15, scale: 2 })
  currentValue: number;

  @Column('decimal', { precision: 10, scale: 6 })
  impermanentLoss: number;

  @Column('decimal', { precision: 15, scale: 8 })
  feesEarned: number;

  @Column('decimal', { precision: 10, scale: 4 })
  apr: number;

  @Column('decimal', { precision: 10, scale: 4 })
  impermanentLossRisk: number;

  @Column({ 
    type: 'enum',
    enum: ['ACTIVE', 'WITHDRAWN', 'PARTIALLY_WITHDRAWN'],
    default: 'ACTIVE'
  })
  status: string;

  @Column({ nullable: true })
  transactionHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  withdrawnAt: Date;
}
