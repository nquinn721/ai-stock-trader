import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import {
  ExchangeCandle,
  ExchangeOrderBook,
  ExchangeTicker,
  ExchangeTrade,
} from '../interfaces/exchange-connector.interface';

// New entities for data persistence
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('market_data_snapshots')
@Index(['exchange', 'symbol', 'timestamp'])
export class MarketDataSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  exchange: string;

  @Column()
  symbol: string;

  @Column('jsonb', { nullable: true })
  ticker: ExchangeTicker;

  @Column('jsonb', { nullable: true })
  orderBook: ExchangeOrderBook;

  @Column('jsonb', { nullable: true })
  trades: ExchangeTrade[];

  @CreateDateColumn()
  timestamp: Date;
}

@Entity('trading_sessions')
@Index(['exchange', 'startTime'])
export class TradingSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  exchange: string;

  @Column()
  symbol: string;

  @Column()
  strategyId: string;

  @Column('timestamp')
  startTime: Date;

  @Column('timestamp', { nullable: true })
  endTime: Date;

  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  totalVolume: number;

  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  realizedPnl: number;

  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  unrealizedPnl: number;

  @Column('int', { default: 0 })
  totalTrades: number;

  @Column('int', { default: 0 })
  profitableTrades: number;

  @Column('jsonb', { nullable: true })
  metrics: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('performance_metrics')
@Index(['strategyId', 'date'])
export class PerformanceMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  strategyId: string;

  @Column()
  exchange: string;

  @Column()
  symbol: string;

  @Column('date')
  date: Date;

  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  dailyPnl: number;

  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  cumulativePnl: number;

  @Column('decimal', { precision: 10, scale: 6, default: 0 })
  sharpeRatio: number;

  @Column('decimal', { precision: 10, scale: 6, default: 0 })
  maxDrawdown: number;

  @Column('decimal', { precision: 10, scale: 6, default: 0 })
  winRate: number;

  @Column('decimal', { precision: 20, scale: 8, default: 0 })
  volume: number;

  @Column('int', { default: 0 })
  tradeCount: number;

  @Column('jsonb', { nullable: true })
  detailedMetrics: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('historical_candles')
@Index(['exchange', 'symbol', 'interval', 'timestamp'], { unique: true })
export class HistoricalCandle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  exchange: string;

  @Column()
  symbol: string;

  @Column()
  interval: string; // 1m, 5m, 1h, 1d, etc.

  @Column('timestamp')
  timestamp: Date;

  @Column('decimal', { precision: 20, scale: 8 })
  open: number;

  @Column('decimal', { precision: 20, scale: 8 })
  high: number;

  @Column('decimal', { precision: 20, scale: 8 })
  low: number;

  @Column('decimal', { precision: 20, scale: 8 })
  close: number;

  @Column('decimal', { precision: 20, scale: 8 })
  volume: number;

  @Column('decimal', { precision: 20, scale: 8, nullable: true })
  quoteVolume: number;

  @Column('int', { nullable: true })
  trades: number;

  @CreateDateColumn()
  createdAt: Date;
}

@Injectable()
export class DataPersistenceService {
  private readonly logger = new Logger(DataPersistenceService.name);

  constructor(
    @InjectRepository(MarketDataSnapshot)
    private marketDataRepository: Repository<MarketDataSnapshot>,
    @InjectRepository(TradingSession)
    private tradingSessionRepository: Repository<TradingSession>,
    @InjectRepository(PerformanceMetrics)
    private performanceRepository: Repository<PerformanceMetrics>,
    @InjectRepository(HistoricalCandle)
    private candleRepository: Repository<HistoricalCandle>,
  ) {}

  /**
   * Store market data snapshot
   */
  async storeMarketDataSnapshot(
    exchange: string,
    symbol: string,
    data: {
      ticker?: ExchangeTicker;
      orderBook?: ExchangeOrderBook;
      trades?: ExchangeTrade[];
    },
  ): Promise<void> {
    try {
      const snapshot = this.marketDataRepository.create({
        exchange,
        symbol,
        ticker: data.ticker,
        orderBook: data.orderBook,
        trades: data.trades,
        timestamp: new Date(),
      });

      await this.marketDataRepository.save(snapshot);
    } catch (error) {
      this.logger.error(
        `Failed to store market data snapshot: ${error.message}`,
      );
    }
  }

  /**
   * Store historical candles
   */
  async storeCandles(candles: ExchangeCandle[]): Promise<void> {
    try {
      const entities = candles.map((candle) =>
        this.candleRepository.create({
          exchange: candle.exchange,
          symbol: candle.symbol,
          interval: candle.interval,
          timestamp: candle.timestamp,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
          quoteVolume: candle.quoteVolume,
          trades: candle.trades,
        }),
      );

      await this.candleRepository.save(entities);
      this.logger.log(`Stored ${candles.length} candles`);
    } catch (error) {
      this.logger.error(`Failed to store candles: ${error.message}`);
    }
  }

  /**
   * Get historical candles
   */
  async getCandles(
    exchange: string,
    symbol: string,
    interval: string,
    startTime?: Date,
    endTime?: Date,
    limit?: number,
  ): Promise<HistoricalCandle[]> {
    try {
      const query = this.candleRepository
        .createQueryBuilder('candle')
        .where('candle.exchange = :exchange', { exchange })
        .andWhere('candle.symbol = :symbol', { symbol })
        .andWhere('candle.interval = :interval', { interval });

      if (startTime && endTime) {
        query.andWhere('candle.timestamp BETWEEN :startTime AND :endTime', {
          startTime,
          endTime,
        });
      } else if (startTime) {
        query.andWhere('candle.timestamp >= :startTime', { startTime });
      } else if (endTime) {
        query.andWhere('candle.timestamp <= :endTime', { endTime });
      }

      query.orderBy('candle.timestamp', 'DESC');

      if (limit) {
        query.limit(limit);
      }

      return await query.getMany();
    } catch (error) {
      this.logger.error(`Failed to get candles: ${error.message}`);
      return [];
    }
  }

  /**
   * Start a new trading session
   */
  async startTradingSession(
    exchange: string,
    symbol: string,
    strategyId: string,
  ): Promise<string> {
    try {
      const session = this.tradingSessionRepository.create({
        exchange,
        symbol,
        strategyId,
        startTime: new Date(),
        totalVolume: 0,
        realizedPnl: 0,
        unrealizedPnl: 0,
        totalTrades: 0,
        profitableTrades: 0,
      });

      const saved = await this.tradingSessionRepository.save(session);
      this.logger.log(`Started trading session: ${saved.id}`);
      return saved.id;
    } catch (error) {
      this.logger.error(`Failed to start trading session: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update trading session metrics
   */
  async updateTradingSession(
    sessionId: string,
    updates: {
      totalVolume?: number;
      realizedPnl?: number;
      unrealizedPnl?: number;
      totalTrades?: number;
      profitableTrades?: number;
      metrics?: Record<string, any>;
    },
  ): Promise<void> {
    try {
      await this.tradingSessionRepository.update(sessionId, updates);
    } catch (error) {
      this.logger.error(`Failed to update trading session: ${error.message}`);
    }
  }

  /**
   * End a trading session
   */
  async endTradingSession(sessionId: string): Promise<void> {
    try {
      await this.tradingSessionRepository.update(sessionId, {
        endTime: new Date(),
      });
      this.logger.log(`Ended trading session: ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to end trading session: ${error.message}`);
    }
  }

  /**
   * Store daily performance metrics
   */
  async storePerformanceMetrics(
    strategyId: string,
    exchange: string,
    symbol: string,
    metrics: {
      dailyPnl: number;
      cumulativePnl: number;
      sharpeRatio: number;
      maxDrawdown: number;
      winRate: number;
      volume: number;
      tradeCount: number;
      detailedMetrics?: Record<string, any>;
    },
  ): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if metrics already exist for today
      const existing = await this.performanceRepository.findOne({
        where: {
          strategyId,
          exchange,
          symbol,
          date: today,
        },
      });

      if (existing) {
        // Update existing metrics
        await this.performanceRepository.update(existing.id, metrics);
      } else {
        // Create new metrics
        const performance = this.performanceRepository.create({
          strategyId,
          exchange,
          symbol,
          date: today,
          ...metrics,
        });
        await this.performanceRepository.save(performance);
      }

      this.logger.log(`Stored performance metrics for ${strategyId}`);
    } catch (error) {
      this.logger.error(
        `Failed to store performance metrics: ${error.message}`,
      );
    }
  }

  /**
   * Get performance metrics for a strategy
   */
  async getPerformanceMetrics(
    strategyId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<PerformanceMetrics[]> {
    try {
      const query = this.performanceRepository
        .createQueryBuilder('metrics')
        .where('metrics.strategyId = :strategyId', { strategyId });

      if (startDate && endDate) {
        query.andWhere('metrics.date BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });
      } else if (startDate) {
        query.andWhere('metrics.date >= :startDate', { startDate });
      } else if (endDate) {
        query.andWhere('metrics.date <= :endDate', { endDate });
      }

      query.orderBy('metrics.date', 'DESC');

      return await query.getMany();
    } catch (error) {
      this.logger.error(`Failed to get performance metrics: ${error.message}`);
      return [];
    }
  }

  /**
   * Get trading session history
   */
  async getTradingSessions(
    strategyId?: string,
    exchange?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TradingSession[]> {
    try {
      const query = this.tradingSessionRepository.createQueryBuilder('session');

      if (strategyId) {
        query.where('session.strategyId = :strategyId', { strategyId });
      }

      if (exchange) {
        query.andWhere('session.exchange = :exchange', { exchange });
      }

      if (startDate && endDate) {
        query.andWhere('session.startTime BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        });
      }

      query.orderBy('session.startTime', 'DESC');

      return await query.getMany();
    } catch (error) {
      this.logger.error(`Failed to get trading sessions: ${error.message}`);
      return [];
    }
  }

  /**
   * Get market data snapshots
   */
  async getMarketDataSnapshots(
    exchange: string,
    symbol: string,
    startTime?: Date,
    endTime?: Date,
    limit?: number,
  ): Promise<MarketDataSnapshot[]> {
    try {
      const query = this.marketDataRepository
        .createQueryBuilder('snapshot')
        .where('snapshot.exchange = :exchange', { exchange })
        .andWhere('snapshot.symbol = :symbol', { symbol });

      if (startTime && endTime) {
        query.andWhere('snapshot.timestamp BETWEEN :startTime AND :endTime', {
          startTime,
          endTime,
        });
      }

      query.orderBy('snapshot.timestamp', 'DESC');

      if (limit) {
        query.limit(limit);
      }

      return await query.getMany();
    } catch (error) {
      this.logger.error(
        `Failed to get market data snapshots: ${error.message}`,
      );
      return [];
    }
  }

  /**
   * Cleanup old data
   */
  async cleanupOldData(retentionDays: number): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      // Clean up old market data snapshots
      const deletedSnapshots = await this.marketDataRepository.delete({
        timestamp: LessThan(cutoffDate),
      });

      // Clean up old candles (keep based on interval)
      const cutoffDateCandles = new Date();
      cutoffDateCandles.setDate(
        cutoffDateCandles.getDate() - retentionDays * 2,
      ); // Keep candles longer

      const deletedCandles = await this.candleRepository.delete({
        timestamp: LessThan(cutoffDateCandles),
      });

      this.logger.log(
        `Cleaned up ${deletedSnapshots.affected} snapshots and ${deletedCandles.affected} candles`,
      );
    } catch (error) {
      this.logger.error(`Failed to cleanup old data: ${error.message}`);
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    marketDataSnapshots: number;
    tradingSessions: number;
    performanceMetrics: number;
    historicalCandles: number;
  }> {
    try {
      const [snapshots, sessions, metrics, candles] = await Promise.all([
        this.marketDataRepository.count(),
        this.tradingSessionRepository.count(),
        this.performanceRepository.count(),
        this.candleRepository.count(),
      ]);

      return {
        marketDataSnapshots: snapshots,
        tradingSessions: sessions,
        performanceMetrics: metrics,
        historicalCandles: candles,
      };
    } catch (error) {
      this.logger.error(`Failed to get database stats: ${error.message}`);
      return {
        marketDataSnapshots: 0,
        tradingSessions: 0,
        performanceMetrics: 0,
        historicalCandles: 0,
      };
    }
  }
}
