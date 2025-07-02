import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlternativeDataController } from './controllers/alternative-data.controller';
import { CommoditiesController } from './controllers/commodities.controller';
import { MultiAssetController } from './controllers/multi-asset.controller';
import { AlternativeData } from './entities/alternative-data.entity';
import { ArbitrageOpportunity } from './entities/arbitrage-opportunity.entity';
import { AssetData } from './entities/asset-data.entity';
import { CommodityData } from './entities/commodity-data.entity';
import { CrossAssetCorrelation } from './entities/cross-asset-correlation.entity';
import { AlternativeDataService } from './services/alternative-data.service';
import { ArbitrageDetectionService } from './services/arbitrage-detection.service';
import { AssetClassManagerService } from './services/asset-class-manager.service';
import { CommoditiesTradingService } from './services/commodities-trading.service';
import { CrossAssetAnalyticsService } from './services/cross-asset-analytics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssetData,
      CommodityData,
      AlternativeData,
      CrossAssetCorrelation,
      ArbitrageOpportunity,
    ]),
  ],
  controllers: [
    MultiAssetController,
    CommoditiesController,
    AlternativeDataController,
  ],
  providers: [
    AssetClassManagerService,
    CommoditiesTradingService,
    AlternativeDataService,
    CrossAssetAnalyticsService,
    ArbitrageDetectionService,
  ],
  exports: [
    AssetClassManagerService,
    CommoditiesTradingService,
    AlternativeDataService,
    CrossAssetAnalyticsService,
    ArbitrageDetectionService,
  ],
})
export class MultiAssetModule {}
