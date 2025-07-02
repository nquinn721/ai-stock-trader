// CRITICAL: Load crypto polyfill FIRST
require('./setup-crypto');

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AutoTradingOrder } from './entities/auto-trading-order.entity';
import { News } from './entities/news.entity';
import { Order } from './entities/order.entity';
import { Portfolio } from './entities/portfolio.entity';
import { Position } from './entities/position.entity';
import { Stock } from './entities/stock.entity';
import { Trade } from './entities/trade.entity';
import { TradingSignal } from './entities/trading-signal.entity';
import { AutoTradingModule } from './modules/auto-trading/auto-trading.module';
import { AutoTrade } from './modules/auto-trading/entities/auto-trade.entity';
import { BacktestResult } from './modules/auto-trading/entities/backtest-result.entity';
import { StrategyTemplate } from './modules/auto-trading/entities/strategy-template.entity';
import { TradingRule } from './modules/auto-trading/entities/trading-rule.entity';
import { TradingSession } from './modules/auto-trading/entities/trading-session.entity';
import { TradingStrategy } from './modules/auto-trading/entities/trading-strategy.entity';
import { BehavioralFinanceModule } from './modules/behavioral-finance/behavioral-finance.module';
import { BreakoutModule } from './modules/breakout/breakout.module';
import { DataIntelligenceModule } from './modules/data-intelligence/data-intelligence.module';
import { EconomicIntelligenceModule } from './modules/economic-intelligence/economic-intelligence.module';
import {
  BusinessCycle,
  EconomicForecast,
  RecessionProbability,
} from './modules/macro-intelligence/entities/economic.entities';
import {
  ConflictRiskAssessment,
  ElectionPrediction,
  PoliticalStabilityScore,
} from './modules/macro-intelligence/entities/geopolitical.entities';
import {
  MonetaryPolicyPrediction,
  PolicyStanceAnalysis,
  QEProbabilityAssessment,
} from './modules/macro-intelligence/entities/monetary-policy.entities';
import { MacroIntelligenceModule } from './modules/macro-intelligence/macro-intelligence.module';
import {
  ArbitrageOpportunityEntity,
  LiquidityPositionEntity,
  MarketMakingQuoteEntity,
  MarketMakingStrategyEntity,
  RiskExposureEntity,
} from './modules/market-making/entities/market-making.entities';
import { MarketMakingModule } from './modules/market-making/market-making.module';
import {
  MarketAlert,
  ScanResult,
  ScreenerTemplate,
} from './modules/market-scanner/entities/scanner.entity';
import { MarketScannerModule } from './modules/market-scanner/market-scanner.module';
import {
  MLABTest,
  MLFeatureImportance,
  MLMetric,
  MLModel,
  MLModelPerformance,
  MLPrediction,
} from './modules/ml/entities/ml.entities';
import { MLModule } from './modules/ml/ml.module';
import { AlternativeData } from './modules/multi-asset/entities/alternative-data.entity';
import { ArbitrageOpportunity } from './modules/multi-asset/entities/arbitrage-opportunity.entity';
import { AssetData } from './modules/multi-asset/entities/asset-data.entity';
import { CommodityData } from './modules/multi-asset/entities/commodity-data.entity';
import { CrossAssetCorrelation } from './modules/multi-asset/entities/cross-asset-correlation.entity';
import { MultiAssetModule } from './modules/multi-asset/multi-asset.module';
import { NewsModule } from './modules/news/news.module';
import {
  NotificationEntity,
  NotificationPreferenceEntity,
  NotificationTemplateEntity,
} from './modules/notification/entities/notification.entities';
import { NotificationModule } from './modules/notification/notification.module';
import { OrderManagementModule } from './modules/order-management/order-management.module';
import { PaperTradingModule } from './modules/paper-trading/paper-trading.module';
import { StockModule } from './modules/stock/stock.module';
import { TradingModule } from './modules/trading/trading.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { SeedService } from './services/seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    // ⚠️ CRITICAL: NEVER MODIFY DATABASE CONNECTION SETTINGS
    // See: docs/DATABASE-CONNECTION-POLICY.md for strict policies
    // Local: admin/password@localhost:3306/stocktrading_dev
    // Production: Uses Cloud SQL Unix socket with Secret Manager
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbHost = configService.get('DATABASE_HOST');
        const dbPort = configService.get('DATABASE_PORT') || '3306';
        const dbUsername = configService.get('DATABASE_USERNAME');
        const dbPassword = configService.get('DATABASE_PASSWORD');
        const dbName = configService.get('DATABASE_NAME');
        const nodeEnv = configService.get('NODE_ENV');
        const cloudSqlConnection = configService.get(
          'CLOUD_SQL_CONNECTION_NAME',
        );

        // Check if required database configuration is provided
        if (!dbHost || !dbUsername || !dbPassword || !dbName) {
          console.error(
            '❌ Missing required database configuration for MySQL:',
          );
          console.error(`DATABASE_HOST: ${dbHost ? '✓' : '❌ (empty)'}`);
          console.error(
            `DATABASE_USERNAME: ${dbUsername ? '✓' : '❌ (empty)'}`,
          );
          console.error(
            `DATABASE_PASSWORD: ${dbPassword ? '✓' : '❌ (empty)'}`,
          );
          console.error(`DATABASE_NAME: ${dbName ? '✓' : '❌ (empty)'}`);
          console.error('');
          console.error('🔧 For local development:');
          console.error('   1. Set up a local MySQL instance, OR');
          console.error(
            '   2. Use a cloud MySQL service (AWS RDS, Google Cloud SQL, etc.), OR',
          );
          console.error('   3. Use a free MySQL hosting service');
          console.error('');
          console.error(
            '📝 Then update backend/.env with your MySQL credentials:',
          );
          console.error('   DATABASE_HOST=your-mysql-host');
          console.error('   DATABASE_USERNAME=your-username');
          console.error('   DATABASE_PASSWORD=your-password');
          console.error('   DATABASE_NAME=your-database-name');
          console.error('');
          console.error(
            '🚀 For production: Database credentials are handled via Google Secret Manager',
          );

          // In Cloud Run, don't throw error immediately - allow app to start and fail gracefully
          if (process.env.K_SERVICE) {
            console.warn(
              '⚠️ Cloud Run detected - starting without database connection for health checks',
            );
            // Return a minimal config that won't connect but allows app to start
            return {
              type: 'mysql',
              host: 'localhost',
              port: 3306,
              username: 'placeholder',
              password: 'placeholder',
              database: 'placeholder',
              entities: [],
              synchronize: false,
              logging: false,
              autoLoadEntities: false,
            };
          }

          throw new Error(
            'Missing required database configuration. Please set DATABASE_HOST, DATABASE_USERNAME, DATABASE_PASSWORD, and DATABASE_NAME environment variables.',
          );
        }

        // Cloud SQL socket connection configuration
        const isCloudRun = process.env.K_SERVICE && process.env.K_REVISION;
        const isProduction = nodeEnv === 'production';

        let connectionConfig: any;

        if (isCloudRun || (isProduction && cloudSqlConnection)) {
          // Cloud Run with Cloud SQL Unix Socket connection
          const socketPath =
            cloudSqlConnection ||
            'heroic-footing-460117-k8:us-central1:stocktrading-mysql';

          console.log(
            `🔗 Connecting to Cloud SQL via Unix socket: /cloudsql/${socketPath}`,
          );

          connectionConfig = {
            type: 'mysql',
            extra: {
              socketPath: `/cloudsql/${socketPath}`,
            },
            username: dbUsername,
            password: dbPassword,
            database: dbName,
          };
        } else if (dbHost.includes('/cloudsql/')) {
          // Direct Cloud SQL socket path
          console.log(`🔗 Connecting to Cloud SQL via Unix socket: ${dbHost}`);

          connectionConfig = {
            type: 'mysql',
            extra: {
              socketPath: dbHost,
            },
            username: dbUsername,
            password: dbPassword,
            database: dbName,
          };
        } else if (dbHost.includes('cloudsql') || dbHost.includes(':')) {
          // Cloud SQL TCP connection (when using proxy or direct connection)
          console.log(
            `🔗 Connecting to Cloud SQL via TCP: ${dbHost}:${dbPort}/${dbName}`,
          );

          connectionConfig = {
            type: 'mysql',
            host: dbHost,
            port: +dbPort,
            username: dbUsername,
            password: dbPassword,
            database: dbName,
          };
        } else {
          // Local MySQL connection
          console.log(
            `🔗 Connecting to local MySQL: ${dbHost}:${dbPort}/${dbName}`,
          );

          connectionConfig = {
            type: 'mysql',
            host: dbHost,
            port: +dbPort,
            username: dbUsername,
            password: dbPassword,
            database: dbName,
          };
        }

        return {
          ...connectionConfig,
          entities: [
            Stock,
            News,
            TradingSignal,
            Portfolio,
            Position,
            Trade,
            Order,
            AutoTradingOrder,
            MLModel,
            MLPrediction,
            MLMetric,
            MLABTest,
            MLFeatureImportance,
            MLModelPerformance,
            NotificationEntity,
            NotificationPreferenceEntity,
            NotificationTemplateEntity,
            TradingRule,
            AutoTrade,
            TradingSession,
            TradingStrategy,
            StrategyTemplate,
            BacktestResult,
            ScreenerTemplate,
            MarketAlert,
            ScanResult,
            AssetData,
            CommodityData,
            AlternativeData,
            CrossAssetCorrelation,
            ArbitrageOpportunity,
            MarketMakingStrategyEntity,
            MarketMakingQuoteEntity,
            ArbitrageOpportunityEntity,
            RiskExposureEntity,
            LiquidityPositionEntity,
            // Macro Intelligence entities
            EconomicForecast,
            BusinessCycle,
            RecessionProbability,
            MonetaryPolicyPrediction,
            PolicyStanceAnalysis,
            QEProbabilityAssessment,
            PoliticalStabilityScore,
            ElectionPrediction,
            ConflictRiskAssessment,
          ],
          synchronize: true,
          logging: ['error', 'warn'],
          retryAttempts: 10,
          retryDelay: 5000,
          connectTimeout: 120000,
          acquireTimeout: 120000,
          timeout: 120000,
          extra: {
            ...connectionConfig.extra,
            connectionLimit: 10,
            acquireTimeout: 120000,
            timeout: 120000,
          },
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Stock, Portfolio, NotificationEntity]),
    StockModule,
    WebsocketModule,
    NewsModule,
    TradingModule,
    PaperTradingModule,
    OrderManagementModule,
    BreakoutModule,
    MLModule,
    NotificationModule,
    AutoTradingModule, // Re-enabled - routing issue was fixed
    BehavioralFinanceModule, // Re-enabled
    MarketScannerModule,
    MultiAssetModule, // Re-enabled - routing issue was fixed
    DataIntelligenceModule, // Re-enabled - routing issue was fixed
    EconomicIntelligenceModule, // Re-enabled - routing issue was fixed
    MarketMakingModule, // Re-enabled - routing issue was fixed
    MacroIntelligenceModule, // Keep this one enabled for testing
  ],
  controllers: [AppController],
  providers: [AppService, SeedService], // Temporarily disabled DatabaseInitializationService - needs TypeORM update
})
export class AppModule {}
