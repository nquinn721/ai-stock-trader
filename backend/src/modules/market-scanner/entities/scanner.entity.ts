import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum FilterType {
  PRICE = 'price',
  VOLUME = 'volume',
  MARKET_CAP = 'market_cap',
  TECHNICAL = 'technical',
  FUNDAMENTAL = 'fundamental',
  PATTERN = 'pattern',
}

export enum FilterOperator {
  GREATER_THAN = 'gt',
  LESS_THAN = 'lt',
  EQUALS = 'eq',
  BETWEEN = 'between',
  ABOVE = 'above',
  BELOW = 'below',
  CROSSES_ABOVE = 'crosses_above',
  CROSSES_BELOW = 'crosses_below',
}

export interface FilterCriteria {
  id: string;
  type: FilterType;
  field: string;
  operator: FilterOperator;
  value: number | string;
  value2?: number; // For BETWEEN operator
  logicalOperator?: 'AND' | 'OR';
}

export interface ScanCriteria {
  filters: FilterCriteria[];
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
  includePreMarket?: boolean;
  includeAfterHours?: boolean;
}

@Entity('screener_templates')
export class ScreenerTemplate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json' })
  criteria: ScanCriteria;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'boolean', default: false })
  isPublic: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', nullable: true })
  createdBy: number;

  @Column({ type: 'int', default: 0 })
  usageCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('market_alerts')
export class MarketAlert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'json' })
  criteria: ScanCriteria;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'json' })
  notificationTypes: string[];

  @Column({ type: 'timestamp', nullable: true })
  lastTriggered: Date;

  @Column({ type: 'int', default: 0 })
  triggerCount: number;

  @Column({ type: 'int', default: 60 }) // seconds
  scanInterval: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.8 })
  minMatchStrength: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('scan_results')
export class ScanResult {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })
  alertId: number;

  @Column({ type: 'varchar', length: 10 })
  symbol: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  matchStrength: number;

  @Column({ type: 'json' })
  criteriaMet: object;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceAtScan: number;

  @Column({ type: 'bigint' })
  volumeAtScan: number;

  @Column({ type: 'json', nullable: true })
  technicalData: object;

  @Column({ type: 'json', nullable: true })
  fundamentalData: object;

  @CreateDateColumn()
  scannedAt: Date;
}

export interface ScanMatch {
  symbol: string;
  name: string;
  price: number;
  volume: number;
  marketCap?: number;
  matchStrength: number;
  criteriaMet: string[];
  technicalData?: TechnicalIndicators;
  fundamentalData?: FundamentalMetrics;
  lastUpdated: Date;
}

export interface TechnicalIndicators {
  rsi?: number;
  macd?: {
    macd: number;
    signal: number;
    histogram: number;
  };
  bollingerBands?: {
    upper: number;
    middle: number;
    lower: number;
    position: number; // Percentage within bands
  };
  movingAverages?: {
    sma20?: number;
    sma50?: number;
    sma200?: number;
    ema20?: number;
    ema50?: number;
  };
  volume?: {
    average: number;
    ratio: number; // Current volume / average volume
  };
  patterns?: string[];
}

export interface FundamentalMetrics {
  peRatio?: number;
  eps?: number;
  dividend?: number;
  dividendYield?: number;
  bookValue?: number;
  priceToBook?: number;
  debtToEquity?: number;
  roe?: number;
  roa?: number;
  grossMargin?: number;
  netMargin?: number;
  revenueGrowth?: number;
  epsGrowth?: number;
}
