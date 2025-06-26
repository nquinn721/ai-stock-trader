import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CrossAssetCorrelation } from '../entities/cross-asset-correlation.entity';
import {
  AssetClass,
  AssetIdentifier,
  CorrelationData,
  CrossAssetPortfolioAllocation,
  CrossAssetSignal,
  CrossAssetSignalType,
  MacroIndicator,
} from '../types/multi-asset.types';

@Injectable()
export class CrossAssetAnalyticsService {
  private readonly logger = new Logger(CrossAssetAnalyticsService.name);

  constructor(
    @InjectRepository(CrossAssetCorrelation)
    private correlationRepository: Repository<CrossAssetCorrelation>,
  ) {}

  async calculateCrossAssetCorrelations(
    assets: AssetIdentifier[],
    timeframe: string = '30d',
  ): Promise<CorrelationData> {
    this.logger.debug(
      `Calculating correlations for ${assets.length} assets over ${timeframe}`,
    );

    // Mock correlation matrix calculation
    const matrix: { [assetId: string]: { [assetId: string]: number } } = {};
    const assetIds = assets.map((asset) => `${asset.class}:${asset.symbol}`);

    // Initialize correlation matrix
    assetIds.forEach((assetId) => {
      matrix[assetId] = {};
      assetIds.forEach((otherId) => {
        if (assetId === otherId) {
          matrix[assetId][otherId] = 1.0;
        } else {
          // Generate realistic correlations based on asset classes
          matrix[assetId][otherId] = this.generateRealisticCorrelation(
            assetId,
            otherId,
          );
        }
      });
    });

    return {
      matrix,
      assets: assetIds,
      timeframe,
      calculatedAt: new Date(),
      confidence: 0.85,
    };
  }

  async detectCrossAssetSignals(
    assets: AssetIdentifier[],
  ): Promise<CrossAssetSignal[]> {
    this.logger.debug(
      `Detecting cross-asset signals for ${assets.length} assets`,
    );

    const signals: CrossAssetSignal[] = [];
    const correlations = await this.calculateCrossAssetCorrelations(assets);

    // Detect correlation breakdowns
    signals.push(
      ...(await this.detectCorrelationBreakdowns(correlations, assets)),
    );

    // Detect momentum divergences
    signals.push(...(await this.detectMomentumDivergences(assets)));

    // Detect mean reversion opportunities
    signals.push(...(await this.detectMeanReversionSignals(assets)));

    // Detect risk-on/risk-off signals
    signals.push(...(await this.detectRiskOnOffSignals(assets)));

    // Detect sector rotation signals
    signals.push(...(await this.detectSectorRotationSignals(assets)));

    // Detect currency hedging opportunities
    signals.push(...(await this.detectCurrencyHedgingSignals(assets)));

    return signals;
  }

  private async detectCorrelationBreakdowns(
    correlations: CorrelationData,
    assets: AssetIdentifier[],
  ): Promise<CrossAssetSignal[]> {
    const signals: CrossAssetSignal[] = [];

    // Look for pairs with historically high correlation that are now diverging
    for (let i = 0; i < assets.length; i++) {
      for (let j = i + 1; j < assets.length; j++) {
        const asset1Id = `${assets[i].class}:${assets[i].symbol}`;
        const asset2Id = `${assets[j].class}:${assets[j].symbol}`;

        const currentCorrelation = correlations.matrix[asset1Id][asset2Id];
        const historicalCorrelation = Math.random() * 0.4 + 0.6; // Mock historical correlation

        if (Math.abs(historicalCorrelation - currentCorrelation) > 0.3) {
          signals.push({
            type: CrossAssetSignalType.CORRELATION_BREAKDOWN,
            source: assets[i],
            target: assets[j],
            strength: Math.abs(historicalCorrelation - currentCorrelation),
            confidence: 0.75,
            timeframe: '7d',
            description: `Correlation breakdown detected between ${assets[i].symbol} and ${assets[j].symbol}`,
            actionable: true,
          });
        }
      }
    }

    return signals;
  }

  private async detectMomentumDivergences(
    assets: AssetIdentifier[],
  ): Promise<CrossAssetSignal[]> {
    const signals: CrossAssetSignal[] = [];

    // Mock momentum data for each asset
    const momentumData = assets.map((asset) => ({
      asset,
      momentum: (Math.random() - 0.5) * 20, // -10% to +10% momentum
      strength: Math.random(),
    }));

    // Look for divergences between related assets
    for (let i = 0; i < momentumData.length; i++) {
      for (let j = i + 1; j < momentumData.length; j++) {
        const asset1 = momentumData[i];
        const asset2 = momentumData[j];

        // Check if assets are in related classes and have diverging momentum
        if (this.areAssetsRelated(asset1.asset, asset2.asset)) {
          const momentumDivergence = Math.abs(
            asset1.momentum - asset2.momentum,
          );

          if (momentumDivergence > 10) {
            // 10% divergence threshold
            signals.push({
              type: CrossAssetSignalType.MOMENTUM_DIVERGENCE,
              source: asset1.asset,
              target: asset2.asset,
              strength: momentumDivergence / 20, // Normalize to 0-1
              confidence: 0.68,
              timeframe: '14d',
              description: `Momentum divergence: ${asset1.asset.symbol} vs ${asset2.asset.symbol}`,
              actionable: true,
            });
          }
        }
      }
    }

    return signals;
  }

  private async detectMeanReversionSignals(
    assets: AssetIdentifier[],
  ): Promise<CrossAssetSignal[]> {
    const signals: CrossAssetSignal[] = [];

    // Look for assets that have moved significantly from their mean
    assets.forEach((asset) => {
      const currentPrice = Math.random() * 200 + 50; // Mock current price
      const meanPrice = Math.random() * 180 + 60; // Mock mean price
      const deviation = Math.abs(currentPrice - meanPrice) / meanPrice;

      if (deviation > 0.15) {
        // 15% deviation threshold
        signals.push({
          type: CrossAssetSignalType.MEAN_REVERSION,
          source: asset,
          target: asset,
          strength: deviation,
          confidence: 0.72,
          timeframe: '21d',
          description: `Mean reversion opportunity for ${asset.symbol} (${(deviation * 100).toFixed(1)}% from mean)`,
          actionable: true,
        });
      }
    });

    return signals;
  }

  private async detectRiskOnOffSignals(
    assets: AssetIdentifier[],
  ): Promise<CrossAssetSignal[]> {
    const signals: CrossAssetSignal[] = [];

    // Mock VIX-like risk indicator
    const riskIndicator = Math.random() * 50 + 10; // 10-60 range
    const riskThreshold = 25;

    const riskAssets = assets.filter(
      (asset) =>
        asset.class === AssetClass.STOCKS || asset.class === AssetClass.CRYPTO,
    );

    const safeAssets = assets.filter(
      (asset) =>
        asset.symbol.includes('GOLD') ||
        asset.symbol.includes('USD') ||
        asset.symbol.includes('BONDS'),
    );

    if (riskIndicator > riskThreshold && riskAssets.length > 0) {
      // Risk-off signal
      riskAssets.forEach((riskAsset) => {
        signals.push({
          type: CrossAssetSignalType.RISK_ON_OFF,
          source: riskAsset,
          target: riskAsset,
          strength: (riskIndicator - riskThreshold) / (60 - riskThreshold),
          confidence: 0.78,
          timeframe: '7d',
          description: `Risk-off environment detected - consider reducing exposure to ${riskAsset.symbol}`,
          actionable: true,
        });
      });
    } else if (riskIndicator < 20 && safeAssets.length > 0) {
      // Risk-on signal
      safeAssets.forEach((safeAsset) => {
        signals.push({
          type: CrossAssetSignalType.RISK_ON_OFF,
          source: safeAsset,
          target: safeAsset,
          strength: (20 - riskIndicator) / 20,
          confidence: 0.75,
          timeframe: '7d',
          description: `Risk-on environment - consider reducing safe haven exposure in ${safeAsset.symbol}`,
          actionable: true,
        });
      });
    }

    return signals;
  }

  private async detectSectorRotationSignals(
    assets: AssetIdentifier[],
  ): Promise<CrossAssetSignal[]> {
    const signals: CrossAssetSignal[] = [];

    // Mock sector performance data
    const sectors = ['TECH', 'FINANCIALS', 'HEALTHCARE', 'ENERGY', 'UTILITIES'];
    const sectorPerformance = sectors.map((sector) => ({
      sector,
      performance: (Math.random() - 0.5) * 20,
      momentum: Math.random(),
    }));

    // Find best and worst performing sectors
    const bestSector = sectorPerformance.reduce((best, current) =>
      current.performance > best.performance ? current : best,
    );

    const worstSector = sectorPerformance.reduce((worst, current) =>
      current.performance < worst.performance ? current : worst,
    );

    // Find assets in these sectors
    const bestSectorAssets = assets.filter(
      (asset) =>
        asset.symbol.includes(bestSector.sector) ||
        this.isAssetInSector(asset, bestSector.sector),
    );

    const worstSectorAssets = assets.filter(
      (asset) =>
        asset.symbol.includes(worstSector.sector) ||
        this.isAssetInSector(asset, worstSector.sector),
    );

    // Generate rotation signals
    bestSectorAssets.forEach((asset) => {
      signals.push({
        type: CrossAssetSignalType.SECTOR_ROTATION,
        source: asset,
        target: asset,
        strength: bestSector.performance / 20,
        confidence: 0.7,
        timeframe: '30d',
        description: `Sector rotation into ${bestSector.sector} - ${asset.symbol} showing strength`,
        actionable: true,
      });
    });

    return signals;
  }

  private async detectCurrencyHedgingSignals(
    assets: AssetIdentifier[],
  ): Promise<CrossAssetSignal[]> {
    const signals: CrossAssetSignal[] = [];

    const forexAssets = assets.filter(
      (asset) => asset.class === AssetClass.FOREX,
    );
    const internationalAssets = assets.filter(
      (asset) => asset.currency && asset.currency !== 'USD',
    );

    // Look for currency exposure that might need hedging
    internationalAssets.forEach((asset) => {
      const currencyVolatility = Math.random() * 0.3 + 0.1; // 10-40% volatility

      if (currencyVolatility > 0.25) {
        // High volatility threshold
        const hedgingPair = forexAssets.find(
          (fx) =>
            asset.currency &&
            fx.symbol.includes(asset.currency) &&
            fx.symbol.includes('USD'),
        );

        if (hedgingPair) {
          signals.push({
            type: CrossAssetSignalType.CURRENCY_HEDGE,
            source: asset,
            target: hedgingPair,
            strength: currencyVolatility,
            confidence: 0.8,
            timeframe: '60d',
            description: `Currency hedging opportunity for ${asset.symbol} using ${hedgingPair.symbol}`,
            actionable: true,
          });
        }
      }
    });

    return signals;
  }

  async getMacroIndicators(): Promise<MacroIndicator[]> {
    this.logger.debug('Getting macro indicators for cross-asset analysis');

    return [
      {
        name: 'VIX',
        value: Math.random() * 40 + 10,
        change: (Math.random() - 0.5) * 10,
        impact: 'Market volatility indicator',
        significance: 'HIGH',
      },
      {
        name: 'DXY',
        value: Math.random() * 20 + 90,
        change: (Math.random() - 0.5) * 2,
        impact: 'USD strength affects global assets',
        significance: 'HIGH',
      },
      {
        name: '10Y Treasury Yield',
        value: Math.random() * 3 + 2,
        change: (Math.random() - 0.5) * 0.5,
        impact: 'Risk-free rate affects asset valuations',
        significance: 'HIGH',
      },
      {
        name: 'Gold/Silver Ratio',
        value: Math.random() * 20 + 70,
        change: (Math.random() - 0.5) * 5,
        impact: 'Precious metals market dynamics',
        significance: 'MEDIUM',
      },
      {
        name: 'Oil/Gold Ratio',
        value: Math.random() * 0.1 + 0.03,
        change: (Math.random() - 0.5) * 0.02,
        impact: 'Energy vs safe haven sentiment',
        significance: 'MEDIUM',
      },
    ];
  }

  async calculateOptimalAllocation(
    assets: AssetIdentifier[],
    riskTolerance: number = 0.5,
  ): Promise<CrossAssetPortfolioAllocation> {
    this.logger.debug(
      `Calculating optimal allocation for ${assets.length} assets with risk tolerance ${riskTolerance}`,
    );

    const correlations = await this.calculateCrossAssetCorrelations(assets);

    // Mock Modern Portfolio Theory optimization
    const allocations = new Map<string, number>();
    let remainingWeight = 1.0;

    assets.forEach((asset, index) => {
      const assetId = `${asset.class}:${asset.symbol}`;

      if (index === assets.length - 1) {
        // Last asset gets remaining weight
        allocations.set(assetId, remainingWeight);
      } else {
        // Simplified allocation based on asset class and risk tolerance
        let baseWeight = this.getBaseAllocation(asset.class, riskTolerance);
        baseWeight = Math.min(baseWeight, remainingWeight);
        allocations.set(assetId, baseWeight);
        remainingWeight -= baseWeight;
      }
    });

    return {
      allocations: Object.fromEntries(allocations),
      expectedReturn: Math.random() * 0.15 + 0.05, // 5-20% expected return
      expectedVolatility: Math.random() * 0.25 + 0.1, // 10-35% volatility
      sharpeRatio: Math.random() * 2 + 0.5, // 0.5-2.5 Sharpe ratio
      maxDrawdown: Math.random() * 0.3 + 0.1, // 10-40% max drawdown
      correlationScore: 0.7, // Portfolio diversification score
      riskScore: riskTolerance,
      rebalanceFrequency: '30d',
      lastUpdated: new Date(),
    };
  }

  async saveCrossAssetCorrelation(
    data: Partial<CrossAssetCorrelation>,
  ): Promise<CrossAssetCorrelation> {
    const correlation = this.correlationRepository.create(data);
    return this.correlationRepository.save(correlation);
  }

  private generateRealisticCorrelation(
    assetId1: string,
    assetId2: string,
  ): number {
    const [class1] = assetId1.split(':');
    const [class2] = assetId2.split(':');

    // Same asset class - higher correlation
    if (class1 === class2) {
      return Math.random() * 0.6 + 0.2; // 0.2 to 0.8
    }

    // Related asset classes
    if (
      (class1 === 'stocks' && class2 === 'crypto') ||
      (class1 === 'crypto' && class2 === 'stocks')
    ) {
      return Math.random() * 0.4 + 0.1; // 0.1 to 0.5
    }

    // Commodities and forex often negatively correlated
    if (
      (class1 === 'commodities' && class2 === 'forex') ||
      (class1 === 'forex' && class2 === 'commodities')
    ) {
      return Math.random() * 0.6 - 0.3; // -0.3 to 0.3
    }

    // Default low correlation
    return Math.random() * 0.4 - 0.2; // -0.2 to 0.2
  }

  private areAssetsRelated(
    asset1: AssetIdentifier,
    asset2: AssetIdentifier,
  ): boolean {
    // Same asset class
    if (asset1.class === asset2.class) return true;

    // Related asset classes
    const relatedClasses = [
      [AssetClass.STOCKS, AssetClass.CRYPTO],
      [AssetClass.COMMODITIES, AssetClass.FOREX],
      [AssetClass.FOREX, AssetClass.BONDS],
    ];

    return relatedClasses.some(
      ([class1, class2]) =>
        (asset1.class === class1 && asset2.class === class2) ||
        (asset1.class === class2 && asset2.class === class1),
    );
  }

  private isAssetInSector(asset: AssetIdentifier, sector: string): boolean {
    // Mock sector mapping - in real implementation, would use a proper mapping service
    const sectorKeywords = {
      TECH: ['AAPL', 'MSFT', 'GOOGL', 'AMZN'],
      FINANCIALS: ['JPM', 'BAC', 'WFC', 'GS'],
      HEALTHCARE: ['JNJ', 'PFE', 'UNH', 'ABBV'],
      ENERGY: ['XOM', 'CVX', 'CL', 'NG'],
      UTILITIES: ['NEE', 'D', 'SO', 'AEP'],
    };

    return (
      sectorKeywords[sector]?.some((keyword) =>
        asset.symbol.includes(keyword),
      ) || false
    );
  }

  private getBaseAllocation(
    assetClass: AssetClass,
    riskTolerance: number,
  ): number {
    const baseAllocations = {
      [AssetClass.STOCKS]: 0.6,
      [AssetClass.BONDS]: 0.3,
      [AssetClass.COMMODITIES]: 0.05,
      [AssetClass.CRYPTO]: 0.03,
      [AssetClass.FOREX]: 0.02,
    };

    const baseWeight = baseAllocations[assetClass] || 0.1;

    // Adjust based on risk tolerance
    if (assetClass === AssetClass.STOCKS || assetClass === AssetClass.CRYPTO) {
      return baseWeight * (0.5 + riskTolerance);
    } else if (assetClass === AssetClass.BONDS) {
      return baseWeight * (1.5 - riskTolerance);
    }

    return baseWeight;
  }
}
