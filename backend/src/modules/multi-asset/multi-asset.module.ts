import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlternativeDataController } from './controllers/alternative-data.controller';
import { CommoditiesController } from './controllers/commodities.controller';
import { CryptoController } from './controllers/crypto.controller';
import { ForexController } from './controllers/forex.controller';
import { MultiAssetController } from './controllers/multi-asset.controller';
import { AlternativeData } from './entities/alternative-data.entity';
import { ArbitrageOpportunity } from './entities/arbitrage-opportunity.entity';
import { AssetData } from './entities/asset-data.entity';
import { CommodityData } from './entities/commodity-data.entity';
import { CrossAssetCorrelation } from './entities/cross-asset-correlation.entity';
import { CryptoData } from './entities/crypto-data.entity';
import { ForexData } from './entities/forex-data.entity';
import { AlternativeDataService } from './services/alternative-data.service';
import { ArbitrageDetectionService } from './services/arbitrage-detection.service';
import { AssetClassManagerService } from './services/asset-class-manager.service';
import { CommoditiesTradingService } from './services/commodities-trading.service';
import { CrossAssetAnalyticsService } from './services/cross-asset-analytics.service';
import { CryptoTradingService } from './services/crypto-trading.service';
import { ForexTradingService } from './services/forex-trading.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssetData,
      CryptoData,
      ForexData,
      CommodityData,
      AlternativeData,
      CrossAssetCorrelation,
      ArbitrageOpportunity,
    ]),
  ],
  controllers: [
    MultiAssetController,
    CryptoController,
    ForexController,
    CommoditiesController,
    AlternativeDataController,
  ],
  providers: [
    AssetClassManagerService,
    CryptoTradingService,
    ForexTradingService,
    CommoditiesTradingService,
    AlternativeDataService,
    CrossAssetAnalyticsService,
    ArbitrageDetectionService,
  ],
  exports: [
    AssetClassManagerService,
    CryptoTradingService,
    ForexTradingService,
    CommoditiesTradingService,
    AlternativeDataService,
    CrossAssetAnalyticsService,
    ArbitrageDetectionService,
  ],
})
export class MultiAssetModule {}
