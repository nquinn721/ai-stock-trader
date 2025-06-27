import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketMakingController } from './controllers/market-making.controller';
import { MarketMakingServiceImpl } from './services/market-making.service';
import { LiquidityProvisionServiceImpl } from './services/liquidity-provision.service';
import { RiskManagementServiceImpl } from './services/risk-management.service';
import { MarketDataServiceImpl } from './services/market-data.service';
import { ExchangeConnectorService } from './services/exchange-connector.service';
import { WebSocketManagerService } from './services/websocket-manager.service';
import { DataPersistenceService, MarketDataSnapshot, TradingSession, PerformanceMetrics, HistoricalCandle } from './services/data-persistence.service';
import { BinanceAdapter } from './adapters/binance.adapter';
import { CoinbaseAdapter } from './adapters/coinbase.adapter';
import {
  MarketMakingStrategyEntity,
  MarketMakingQuoteEntity,
  ArbitrageOpportunityEntity,
  RiskExposureEntity,
  LiquidityPositionEntity
} from './entities/market-making.entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Existing entities
      MarketMakingStrategyEntity,
      MarketMakingQuoteEntity,
      ArbitrageOpportunityEntity,
      RiskExposureEntity,
      LiquidityPositionEntity,
      // New persistence entities
      MarketDataSnapshot,
      TradingSession,
      PerformanceMetrics,
      HistoricalCandle
    ])
  ],
  controllers: [MarketMakingController],
  providers: [
    // Core services
    MarketMakingServiceImpl,
    LiquidityProvisionServiceImpl,
    RiskManagementServiceImpl,
    MarketDataServiceImpl,
    // Phase 2 services
    ExchangeConnectorService,
    WebSocketManagerService,
    DataPersistenceService,
    // Exchange adapters
    BinanceAdapter,
    CoinbaseAdapter
  ],
  exports: [
    MarketMakingServiceImpl,
    LiquidityProvisionServiceImpl,
    RiskManagementServiceImpl,
    MarketDataServiceImpl,
    ExchangeConnectorService,
    WebSocketManagerService,
    DataPersistenceService
  ]
})
export class MarketMakingModule {}
