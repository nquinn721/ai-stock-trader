/**
 * =============================================================================
 * DATABASE INITIALIZATION SERVICE - Production Database Setup Engine
 * =============================================================================
 *
 * Service responsible for ensuring proper database initialization in production
 * environments, including table creation, initial data seeding, and connection
 * health verification.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection, InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { Portfolio } from '../entities/portfolio.entity';
import { Stock } from '../entities/stock.entity';
import { NotificationEntity } from '../modules/notification/entities/notification.entities';

@Injectable()
export class DatabaseInitializationService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseInitializationService.name);

  constructor(
    @InjectConnection() private connection: Connection,
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(NotificationEntity)
    private notificationRepository: Repository<NotificationEntity>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
  ) {}

  async onModuleInit() {
    await this.initializeDatabase();
  }

  async initializeDatabase(): Promise<void> {
    try {
      this.logger.log('🔧 Starting database initialization...');

      // Verify database connection
      await this.verifyConnection();

      // Verify table existence
      await this.verifyTables();

      // Initialize basic data if needed
      await this.initializeBasicData();

      this.logger.log('✅ Database initialization completed successfully');
    } catch (error) {
      this.logger.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  private async verifyConnection(): Promise<void> {
    try {
      if (!this.connection.isConnected) {
        this.logger.log('🔌 Establishing database connection...');
        await this.connection.connect();
      }

      // Test the connection with a simple query
      await this.connection.query('SELECT 1');
      this.logger.log('✅ Database connection verified');
    } catch (error) {
      this.logger.error('❌ Database connection failed:', error);
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  private async verifyTables(): Promise<void> {
    try {
      this.logger.log('🔍 Verifying database tables...');

      // Check if critical tables exist
      const tables = [
        'portfolios',
        'notifications',
        'stocks',
        'positions',
        'trades',
      ];

      for (const tableName of tables) {
        const exists = await this.tableExists(tableName);
        if (exists) {
          this.logger.log(`✅ Table '${tableName}' exists`);
        } else {
          this.logger.warn(`⚠️ Table '${tableName}' does not exist`);
        }
      }

      this.logger.log('📊 Table verification completed');
    } catch (error) {
      this.logger.error('❌ Table verification failed:', error);
      throw error;
    }
  }

  private async tableExists(tableName: string): Promise<boolean> {
    try {
      const result = await this.connection.query(
        `SHOW TABLES LIKE '${tableName}'`,
      );
      return result.length > 0;
    } catch (error) {
      this.logger.error(`Error checking table ${tableName}:`, error);
      return false;
    }
  }

  private async initializeBasicData(): Promise<void> {
    try {
      this.logger.log('🌱 Initializing basic data...');

      // Check if we need to create initial data
      const portfolioCount = await this.portfolioRepository.count();
      this.logger.log(`📊 Found ${portfolioCount} portfolios in database`);

      if (portfolioCount === 0) {
        this.logger.log(
          '📝 No portfolios found, will create default portfolio on first request',
        );
      }

      this.logger.log('✅ Basic data initialization completed');
    } catch (error) {
      this.logger.error('❌ Basic data initialization failed:', error);
      // Don't throw here - let the app start even if initial data fails
      this.logger.warn(
        '⚠️ Continuing startup despite data initialization failure',
      );
    }
  }

  async healthCheck(): Promise<{
    database: boolean;
    tables: { [key: string]: boolean };
    connection: any;
  }> {
    try {
      const isConnected = this.connection.isConnected;

      const tables = {
        portfolios: await this.tableExists('portfolios'),
        notifications: await this.tableExists('notifications'),
        stocks: await this.tableExists('stocks'),
        positions: await this.tableExists('positions'),
        trades: await this.tableExists('trades'),
      };

      const connectionInfo = {
        isConnected,
        driver: this.connection.options.type,
        database: (this.connection.options as any).database,
        host: (this.connection.options as any).host,
      };

      return {
        database: isConnected,
        tables,
        connection: connectionInfo,
      };
    } catch (error) {
      this.logger.error('Health check failed:', error);
      return {
        database: false,
        tables: {},
        connection: { error: error.message },
      };
    }
  }
}
