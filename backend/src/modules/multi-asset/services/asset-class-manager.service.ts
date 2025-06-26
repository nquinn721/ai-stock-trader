import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetData } from '../entities/asset-data.entity';
import {
  AssetClass,
  AssetIdentifier,
  BaseMarketData,
  CrossAssetSignal,
  UnifiedMarketData,
} from '../types/multi-asset.types';
import { AlternativeDataService } from './alternative-data.service';
import { ArbitrageDetectionService } from './arbitrage-detection.service';
import { CommoditiesTradingService } from './commodities-trading.service';
import { CrossAssetAnalyticsService } from './cross-asset-analytics.service';
import { CryptoTradingService } from './crypto-trading.service';
import { ForexTradingService } from './forex-trading.service';

@Injectable()
export class AssetClassManagerService {
  private readonly logger = new Logger(AssetClassManagerService.name);

  constructor(
    @InjectRepository(AssetData)
    private assetDataRepository: Repository<AssetData>,
    private cryptoService: CryptoTradingService,
    private forexService: ForexTradingService,
    private commoditiesService: CommoditiesTradingService,
    private alternativeDataService: AlternativeDataService,
    private crossAssetAnalyticsService: CrossAssetAnalyticsService,
    private arbitrageDetectionService: ArbitrageDetectionService,
  ) {}

  async getUnifiedMarketData(
    assets: AssetIdentifier[],
  ): Promise<UnifiedMarketData[]> {
    this.logger.log(`Fetching unified market data for ${assets.length} assets`);

    const dataPromises = assets.map(async (asset) => {
      try {
        const marketData = await this.getMarketDataForAsset(asset);
        const alternativeData =
          await this.alternativeDataService.getDataForAsset(asset);
        const crossAssetSignals = await this.calculateCrossAssetSignals(asset);
        const correlations =
          await this.crossAssetAnalyticsService.calculateCrossAssetCorrelations(
            [asset],
          );

        return {
          asset,
          marketData,
          alternativeData,
          crossAssetSignals,
          correlations,
          timestamp: new Date(),
        };
      } catch (error) {
        this.logger.error(
          `Failed to fetch data for asset ${asset.symbol}:`,
          error,
        );
        throw error;
      }
    });

    return Promise.all(dataPromises);
  }

  private async getMarketDataForAsset(
    asset: AssetIdentifier,
  ): Promise<BaseMarketData> {
    switch (asset.class) {
      case AssetClass.CRYPTO:
        const cryptoData = await this.cryptoService.getCryptoMarketData(
          asset.symbol,
        );
        return this.mapCryptoToBaseMarketData(cryptoData);

      case AssetClass.FOREX:
        const forexData = await this.forexService.getForexTick(
          asset.symbol as any,
        );
        return this.mapForexToBaseMarketData(forexData);

      case AssetClass.COMMODITIES:
        const commodityData = await this.commoditiesService.getCommodityData(
          asset.symbol,
        );
        return this.mapCommodityToBaseMarketData(commodityData);

      case AssetClass.STOCKS:
        return this.getStockMarketData(asset.symbol);

      default:
        throw new Error(`Unsupported asset class: ${asset.class}`);
    }
  }

  private mapCryptoToBaseMarketData(cryptoData: any): BaseMarketData {
    return {
      symbol: cryptoData.symbol,
      price: cryptoData.spot.price,
      volume: cryptoData.spot.volume24h,
      change: cryptoData.spot.price - cryptoData.spot.previousPrice || 0,
      changePercent:
        ((cryptoData.spot.price - cryptoData.spot.previousPrice) /
          cryptoData.spot.previousPrice) *
          100 || 0,
      high24h: cryptoData.spot.high24h || cryptoData.spot.price,
      low24h: cryptoData.spot.low24h || cryptoData.spot.price,
      timestamp: new Date(),
    };
  }

  private mapForexToBaseMarketData(forexData: any): BaseMarketData {
    return {
      symbol: forexData.pair,
      price: forexData.price,
      volume: forexData.volume24h,
      change: forexData.change,
      changePercent: forexData.changePercent,
      high24h: forexData.high24h || forexData.price,
      low24h: forexData.low24h || forexData.price,
      timestamp: new Date(),
    };
  }

  private mapCommodityToBaseMarketData(commodityData: any): BaseMarketData {
    return {
      symbol: commodityData.symbol,
      price: commodityData.price,
      volume: commodityData.volume,
      change: commodityData.change,
      changePercent: commodityData.changePercent,
      high24h: commodityData.high24h || commodityData.price,
      low24h: commodityData.low24h || commodityData.price,
      timestamp: new Date(),
    };
  }

  private async getStockMarketData(symbol: string): Promise<BaseMarketData> {
    // This would integrate with existing stock service
    // For now, return placeholder data
    return {
      symbol,
      price: 0,
      volume: 0,
      change: 0,
      changePercent: 0,
      high24h: 0,
      low24h: 0,
      timestamp: new Date(),
    };
  }

  private async calculateCrossAssetSignals(
    asset: AssetIdentifier,
  ): Promise<CrossAssetSignal[]> {
    const signals: CrossAssetSignal[] = [];

    try {
      // Get correlations for signal generation
      const correlations =
        await this.crossAssetAnalyticsService.calculateCrossAssetCorrelations([
          asset,
        ]);

      // Generate correlation breakdown signals
      if (correlations) {
        // Logic to detect correlation breakdowns and generate signals
        // This is a simplified implementation
        const correlationSignals = this.generateCorrelationBreakdownSignals(
          asset,
          correlations,
        );
        signals.push(...correlationSignals);
      }

      // Get arbitrage opportunities
      const arbitrageOpportunities =
        await this.arbitrageDetectionService.detectAllArbitrageOpportunities([
          asset,
        ]);
      if (arbitrageOpportunities.length > 0) {
        const arbitrageSignals = arbitrageOpportunities.map((opp) => ({
          type: 'arbitrage_opportunity' as any,
          source: asset,
          target: opp.assets[1] || asset,
          strength: opp.expectedReturn,
          confidence: opp.confidence,
          timeframe: '1D',
          description: `Arbitrage opportunity with ${opp.expectedReturn.toFixed(2)}% expected return`,
          actionable: true,
        }));
        signals.push(...arbitrageSignals);
      }

      // Get macro economic signals
      const macroSignals = await this.getMacroEconomicSignals(asset);
      signals.push(...macroSignals);

      return signals;
    } catch (error) {
      this.logger.error(
        `Failed to calculate cross-asset signals for ${asset.symbol}:`,
        error,
      );
      return [];
    }
  }

  private generateCorrelationBreakdownSignals(
    asset: AssetIdentifier,
    correlations: any,
  ): CrossAssetSignal[] {
    // Implementation for detecting correlation breakdowns
    // This would analyze historical correlations vs current correlations
    return [];
  }

  private async getMacroEconomicSignals(
    asset: AssetIdentifier,
  ): Promise<CrossAssetSignal[]> {
    // Implementation for macro economic signals
    // This would analyze economic indicators, central bank policies, etc.
    return [];
  }

  async storeMarketData(
    asset: AssetIdentifier,
    marketData: BaseMarketData,
  ): Promise<AssetData> {
    const assetDataEntity = this.assetDataRepository.create({
      symbol: asset.symbol,
      assetClass: asset.class,
      exchange: asset.exchange,
      currency: asset.currency,
      price: marketData.price,
      volume: marketData.volume,
      change: marketData.change,
      changePercent: marketData.changePercent,
      high24h: marketData.high24h,
      low24h: marketData.low24h,
      timestamp: marketData.timestamp,
    });

    return this.assetDataRepository.save(assetDataEntity);
  }

  async getHistoricalData(
    asset: AssetIdentifier,
    startDate: Date,
    endDate: Date,
  ): Promise<AssetData[]> {
    return this.assetDataRepository.find({
      where: {
        symbol: asset.symbol,
        assetClass: asset.class,
        timestamp: {
          $gte: startDate,
          $lte: endDate,
        } as any,
      },
      order: {
        timestamp: 'ASC',
      },
    });
  }

  async getSupportedAssetClasses(): Promise<AssetClass[]> {
    return [
      AssetClass.STOCKS,
      AssetClass.CRYPTO,
      AssetClass.FOREX,
      AssetClass.COMMODITIES,
    ];
  }

  async getAssetsByClass(assetClass: AssetClass): Promise<string[]> {
    const assets = await this.assetDataRepository
      .createQueryBuilder('asset')
      .select('DISTINCT asset.symbol', 'symbol')
      .where('asset.assetClass = :assetClass', { assetClass })
      .getRawMany();

    return assets.map((asset) => asset.symbol);
  }
}
