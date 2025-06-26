import { Body, Controller, Get, Logger, Post, Query } from '@nestjs/common';
import { ArbitrageDetectionService } from '../services/arbitrage-detection.service';
import { AssetClassManagerService } from '../services/asset-class-manager.service';
import { CrossAssetAnalyticsService } from '../services/cross-asset-analytics.service';
import {
  ArbitrageOpportunityData,
  AssetIdentifier,
  CorrelationData,
  CrossAssetPortfolioAllocation,
  CrossAssetSignal,
  MacroIndicator,
  UnifiedMarketData,
} from '../types/multi-asset.types';

@Controller('multi-asset')
export class MultiAssetController {
  private readonly logger = new Logger(MultiAssetController.name);

  constructor(
    private readonly assetClassManager: AssetClassManagerService,
    private readonly crossAssetAnalytics: CrossAssetAnalyticsService,
    private readonly arbitrageDetection: ArbitrageDetectionService,
  ) {}

  @Get('market-data')
  async getUnifiedMarketData(
    @Query('assets') assetsJson: string,
  ): Promise<UnifiedMarketData[]> {
    this.logger.debug('Getting unified market data');

    try {
      const assets: AssetIdentifier[] = JSON.parse(assetsJson);
      return await this.assetClassManager.getUnifiedMarketData(assets);
    } catch (error) {
      this.logger.error('Error parsing assets JSON', error);
      throw new Error('Invalid assets format');
    }
  }

  @Get('supported-assets')
  async getSupportedAssets(): Promise<{ [assetClass: string]: string[] }> {
    this.logger.debug('Getting supported assets');

    // Get supported asset classes and return a mock structure
    const assetClasses =
      await this.assetClassManager.getSupportedAssetClasses();
    const supportedAssets: { [assetClass: string]: string[] } = {};

    assetClasses.forEach((assetClass) => {
      switch (assetClass) {
        case 'stocks':
          supportedAssets[assetClass] = [
            'AAPL',
            'MSFT',
            'GOOGL',
            'TSLA',
            'AMZN',
          ];
          break;
        case 'crypto':
          supportedAssets[assetClass] = ['BTC', 'ETH', 'ADA', 'SOL', 'DOT'];
          break;
        case 'forex':
          supportedAssets[assetClass] = [
            'EUR/USD',
            'GBP/USD',
            'USD/JPY',
            'AUD/USD',
          ];
          break;
        case 'commodities':
          supportedAssets[assetClass] = ['GC', 'SI', 'CL', 'NG', 'ZC'];
          break;
        default:
          supportedAssets[assetClass] = [];
      }
    });

    return supportedAssets;
  }

  @Get('correlations')
  async getCrossAssetCorrelations(
    @Query('assets') assetsJson: string,
    @Query('timeframe') timeframe?: string,
  ): Promise<CorrelationData> {
    this.logger.debug('Getting cross-asset correlations');

    try {
      const assets: AssetIdentifier[] = JSON.parse(assetsJson);
      return await this.crossAssetAnalytics.calculateCrossAssetCorrelations(
        assets,
        timeframe,
      );
    } catch (error) {
      this.logger.error('Error parsing assets JSON', error);
      throw new Error('Invalid assets format');
    }
  }

  @Get('signals')
  async getCrossAssetSignals(
    @Query('assets') assetsJson: string,
  ): Promise<CrossAssetSignal[]> {
    this.logger.debug('Getting cross-asset signals');

    try {
      const assets: AssetIdentifier[] = JSON.parse(assetsJson);
      return await this.crossAssetAnalytics.detectCrossAssetSignals(assets);
    } catch (error) {
      this.logger.error('Error parsing assets JSON', error);
      throw new Error('Invalid assets format');
    }
  }

  @Get('arbitrage')
  async getArbitrageOpportunities(
    @Query('assets') assetsJson: string,
  ): Promise<ArbitrageOpportunityData[]> {
    this.logger.debug('Getting arbitrage opportunities');

    try {
      const assets: AssetIdentifier[] = JSON.parse(assetsJson);
      return await this.arbitrageDetection.detectAllArbitrageOpportunities(
        assets,
      );
    } catch (error) {
      this.logger.error('Error parsing assets JSON', error);
      throw new Error('Invalid assets format');
    }
  }

  @Get('arbitrage/pairs')
  async getPairsTradingOpportunities(@Query('assets') assetsJson: string) {
    this.logger.debug('Getting pairs trading opportunities');

    try {
      const assets: AssetIdentifier[] = JSON.parse(assetsJson);
      return await this.arbitrageDetection.getPairsTradingOpportunities(assets);
    } catch (error) {
      this.logger.error('Error parsing assets JSON', error);
      throw new Error('Invalid assets format');
    }
  }

  @Get('arbitrage/active')
  async getActiveArbitrageOpportunities() {
    this.logger.debug('Getting active arbitrage opportunities');
    return await this.arbitrageDetection.getActiveOpportunities();
  }

  @Get('portfolio/optimal-allocation')
  async getOptimalAllocation(
    @Query('assets') assetsJson: string,
    @Query('riskTolerance') riskTolerance?: string,
  ): Promise<CrossAssetPortfolioAllocation> {
    this.logger.debug('Getting optimal portfolio allocation');

    try {
      const assets: AssetIdentifier[] = JSON.parse(assetsJson);
      const risk = riskTolerance ? parseFloat(riskTolerance) : 0.5;
      return await this.crossAssetAnalytics.calculateOptimalAllocation(
        assets,
        risk,
      );
    } catch (error) {
      this.logger.error('Error parsing request data', error);
      throw new Error('Invalid request format');
    }
  }

  @Get('macro-indicators')
  async getMacroIndicators(): Promise<MacroIndicator[]> {
    this.logger.debug('Getting macro indicators');
    return await this.crossAssetAnalytics.getMacroIndicators();
  }

  @Post('assets/analyze')
  async analyzeAssetGroup(@Body() assets: AssetIdentifier[]): Promise<{
    marketData: UnifiedMarketData[];
    correlations: CorrelationData;
    signals: CrossAssetSignal[];
    arbitrage: ArbitrageOpportunityData[];
    allocation: CrossAssetPortfolioAllocation;
  }> {
    this.logger.debug(`Analyzing asset group of ${assets.length} assets`);

    // Get comprehensive analysis for the asset group
    const [marketData, correlations, signals, arbitrage, allocation] =
      await Promise.all([
        this.assetClassManager.getUnifiedMarketData(assets),
        this.crossAssetAnalytics.calculateCrossAssetCorrelations(assets),
        this.crossAssetAnalytics.detectCrossAssetSignals(assets),
        this.arbitrageDetection.detectAllArbitrageOpportunities(assets),
        this.crossAssetAnalytics.calculateOptimalAllocation(assets),
      ]);

    return {
      marketData,
      correlations,
      signals,
      arbitrage,
      allocation,
    };
  }

  @Get('health')
  async getHealthStatus(): Promise<{
    status: string;
    services: { [service: string]: boolean };
    timestamp: Date;
  }> {
    this.logger.debug('Getting multi-asset module health status');

    // Check if all services are responding
    const services = {
      assetClassManager: true,
      crossAssetAnalytics: true,
      arbitrageDetection: true,
    };

    try {
      // Test each service with a simple operation
      await this.assetClassManager.getSupportedAssetClasses();
      await this.crossAssetAnalytics.getMacroIndicators();
      await this.arbitrageDetection.getActiveOpportunities();
    } catch (error) {
      this.logger.error('Health check failed', error);
      services.assetClassManager = false;
      services.crossAssetAnalytics = false;
      services.arbitrageDetection = false;
    }

    const allHealthy = Object.values(services).every((status) => status);

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      services,
      timestamp: new Date(),
    };
  }
}
