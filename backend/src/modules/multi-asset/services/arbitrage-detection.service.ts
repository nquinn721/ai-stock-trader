import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ArbitrageOpportunity } from '../entities/arbitrage-opportunity.entity';
import {
  ArbitrageOpportunityData,
  ArbitrageType,
  AssetClass,
  AssetIdentifier,
  PairsTradingOpportunity,
} from '../types/multi-asset.types';

@Injectable()
export class ArbitrageDetectionService {
  private readonly logger = new Logger(ArbitrageDetectionService.name);

  constructor(
    @InjectRepository(ArbitrageOpportunity)
    private arbitrageRepository: Repository<ArbitrageOpportunity>,
  ) {}

  async detectAllArbitrageOpportunities(
    assets: AssetIdentifier[],
  ): Promise<ArbitrageOpportunityData[]> {
    this.logger.debug(
      `Detecting arbitrage opportunities across ${assets.length} assets`,
    );

    const opportunities: ArbitrageOpportunityData[] = [];

    // Detect different types of arbitrage
    opportunities.push(...(await this.detectSpatialArbitrage(assets)));
    opportunities.push(...(await this.detectTemporalArbitrage(assets)));
    opportunities.push(...(await this.detectTriangularArbitrage(assets)));
    opportunities.push(...(await this.detectStatisticalArbitrage(assets)));
    opportunities.push(...(await this.detectMergerArbitrage(assets)));
    opportunities.push(...(await this.detectConvertibleArbitrage(assets)));

    // Sort by expected return and filter by minimum threshold
    return opportunities
      .filter((opp) => opp.expectedReturn > 0.005) // Minimum 0.5% return
      .sort((a, b) => b.expectedReturn - a.expectedReturn)
      .slice(0, 20); // Top 20 opportunities
  }

  async detectSpatialArbitrage(
    assets: AssetIdentifier[],
  ): Promise<ArbitrageOpportunityData[]> {
    this.logger.debug('Detecting spatial arbitrage opportunities');

    const opportunities: ArbitrageOpportunityData[] = [];

    // Group assets by symbol but different exchanges
    const assetsBySymbol = new Map<string, AssetIdentifier[]>();
    assets.forEach((asset) => {
      if (!assetsBySymbol.has(asset.symbol)) {
        assetsBySymbol.set(asset.symbol, []);
      }
      assetsBySymbol.get(asset.symbol).push(asset);
    });

    // Find price differences across exchanges
    for (const [symbol, symbolAssets] of assetsBySymbol) {
      if (symbolAssets.length > 1) {
        // Mock price data for different exchanges
        const priceData = symbolAssets.map((asset) => ({
          asset,
          price: this.getMockPrice(symbol) * (0.98 + Math.random() * 0.04), // ±2% price variation
          exchange: asset.exchange || 'UNKNOWN',
          volume: Math.random() * 1000000,
          fees: Math.random() * 0.002 + 0.0005, // 0.05% - 0.25% fees
        }));

        // Find the cheapest and most expensive
        const cheapest = priceData.reduce((min, current) =>
          current.price < min.price ? current : min,
        );

        const mostExpensive = priceData.reduce((max, current) =>
          current.price > max.price ? current : max,
        );

        const priceDifference = mostExpensive.price - cheapest.price;
        const returnRate = priceDifference / cheapest.price;
        const totalFees = cheapest.fees + mostExpensive.fees;
        const netReturn = returnRate - totalFees;

        if (netReturn > 0.002) {
          // Minimum 0.2% net return
          opportunities.push({
            id: `spatial_${symbol}_${Date.now()}`,
            type: ArbitrageType.SPATIAL,
            assets: [cheapest.asset, mostExpensive.asset],
            expectedReturn: netReturn,
            requiredCapital: cheapest.price * 100, // Mock 100 units
            timeToExecution: 300, // 5 minutes
            riskLevel: 'low',
            confidence: 0.85,
            expirationTime: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
            executionSteps: [
              {
                order: 1,
                action: 'buy',
                asset: cheapest.asset,
                quantity: 100,
                expectedPrice: cheapest.price,
                exchange: cheapest.exchange,
                timing: 'immediate',
              },
              {
                order: 2,
                action: 'sell',
                asset: mostExpensive.asset,
                quantity: 100,
                expectedPrice: mostExpensive.price,
                exchange: mostExpensive.exchange,
                timing: 'immediate',
              },
            ],
          });
        }
      }
    }

    return opportunities;
  }

  async detectTemporalArbitrage(
    assets: AssetIdentifier[],
  ): Promise<ArbitrageOpportunityData[]> {
    this.logger.debug('Detecting temporal arbitrage opportunities');

    const opportunities: ArbitrageOpportunityData[] = [];

    // Look for futures/spot price discrepancies
    const futuresAssets = assets.filter(
      (asset) => asset.class === AssetClass.FUTURES,
    );
    const spotAssets = assets.filter(
      (asset) => asset.class !== AssetClass.FUTURES,
    );

    futuresAssets.forEach((futuresAsset) => {
      // Find corresponding spot asset
      const spotAsset = spotAssets.find(
        (spot) => spot.symbol === futuresAsset.symbol.replace(/\d{4}$/, ''), // Remove expiry date
      );

      if (spotAsset) {
        const spotPrice = this.getMockPrice(spotAsset.symbol);
        const futuresPrice = spotPrice * (1 + Math.random() * 0.06 - 0.03); // ±3% basis
        const timeToExpiry = Math.random() * 365; // Days to expiry
        const riskFreeRate = 0.05; // 5% risk-free rate

        const theoreticalFuturesPrice =
          spotPrice * Math.exp((riskFreeRate * timeToExpiry) / 365);
        const mispricing = futuresPrice - theoreticalFuturesPrice;
        const returnRate = Math.abs(mispricing) / spotPrice;

        if (returnRate > 0.01) {
          // Minimum 1% return
          opportunities.push({
            id: `temporal_${futuresAsset.symbol}_${Date.now()}`,
            type: ArbitrageType.TEMPORAL,
            assets: [spotAsset, futuresAsset],
            expectedReturn: returnRate,
            requiredCapital: spotPrice * 100,
            timeToExecution: timeToExpiry,
            riskLevel: 'medium',
            confidence: 0.75,
            expirationTime: new Date(
              Date.now() + timeToExpiry * 24 * 60 * 60 * 1000,
            ),
            executionSteps:
              mispricing > 0
                ? [
                    {
                      order: 1,
                      action: 'buy',
                      asset: spotAsset,
                      quantity: 100,
                      expectedPrice: spotPrice,
                      exchange: spotAsset.exchange || 'SPOT',
                      timing: 'immediate',
                    },
                    {
                      order: 2,
                      action: 'sell',
                      asset: futuresAsset,
                      quantity: 100,
                      expectedPrice: futuresPrice,
                      exchange: futuresAsset.exchange || 'FUTURES',
                      timing: 'immediate',
                    },
                  ]
                : [
                    {
                      order: 1,
                      action: 'sell',
                      asset: spotAsset,
                      quantity: 100,
                      expectedPrice: spotPrice,
                      exchange: spotAsset.exchange || 'SPOT',
                      timing: 'immediate',
                    },
                    {
                      order: 2,
                      action: 'buy',
                      asset: futuresAsset,
                      quantity: 100,
                      expectedPrice: futuresPrice,
                      exchange: futuresAsset.exchange || 'FUTURES',
                      timing: 'immediate',
                    },
                  ],
          });
        }
      }
    });

    return opportunities;
  }

  async detectTriangularArbitrage(
    assets: AssetIdentifier[],
  ): Promise<ArbitrageOpportunityData[]> {
    this.logger.debug('Detecting triangular arbitrage opportunities');

    const opportunities: ArbitrageOpportunityData[] = [];

    // Find forex pairs for triangular arbitrage
    const forexAssets = assets.filter(
      (asset) => asset.class === AssetClass.FOREX,
    );

    // Look for EUR/USD, GBP/USD, EUR/GBP triangular opportunities
    const eurUsd = forexAssets.find((asset) => asset.symbol === 'EUR/USD');
    const gbpUsd = forexAssets.find((asset) => asset.symbol === 'GBP/USD');
    const eurGbp = forexAssets.find((asset) => asset.symbol === 'EUR/GBP');

    if (eurUsd && gbpUsd && eurGbp) {
      // Mock exchange rates
      const eurUsdRate = 1.085 + (Math.random() - 0.5) * 0.01;
      const gbpUsdRate = 1.265 + (Math.random() - 0.5) * 0.01;
      const eurGbpRate = 0.858 + (Math.random() - 0.5) * 0.01;

      // Calculate cross rate
      const impliedEurGbp = eurUsdRate / gbpUsdRate;
      const arbitrageSpread = Math.abs(eurGbpRate - impliedEurGbp);
      const returnRate = arbitrageSpread / eurGbpRate;

      if (returnRate > 0.0001) {
        // Minimum 0.01% return (10 basis points)
        const isEurGbpCheap = eurGbpRate < impliedEurGbp;

        opportunities.push({
          id: `triangular_EUR_GBP_USD_${Date.now()}`,
          type: ArbitrageType.TRIANGULAR,
          assets: [eurUsd, gbpUsd, eurGbp],
          expectedReturn: returnRate,
          requiredCapital: 100000, // $100k
          timeToExecution: 30, // 30 seconds
          riskLevel: 'low',
          confidence: 0.9,
          expirationTime: new Date(Date.now() + 2 * 60 * 1000), // 2 minutes
          executionSteps: isEurGbpCheap
            ? [
                {
                  order: 1,
                  action: 'buy',
                  asset: eurGbp,
                  quantity: 100000,
                  expectedPrice: eurGbpRate,
                  exchange: 'FX_MARKET',
                  timing: 'immediate',
                },
                {
                  order: 2,
                  action: 'sell',
                  asset: eurUsd,
                  quantity: 100000,
                  expectedPrice: eurUsdRate,
                  exchange: 'FX_MARKET',
                  timing: 'immediate',
                },
                {
                  order: 3,
                  action: 'buy',
                  asset: gbpUsd,
                  quantity: 100000 / gbpUsdRate,
                  expectedPrice: gbpUsdRate,
                  exchange: 'FX_MARKET',
                  timing: 'immediate',
                },
              ]
            : [
                {
                  order: 1,
                  action: 'sell',
                  asset: eurGbp,
                  quantity: 100000,
                  expectedPrice: eurGbpRate,
                  exchange: 'FX_MARKET',
                  timing: 'immediate',
                },
                {
                  order: 2,
                  action: 'buy',
                  asset: eurUsd,
                  quantity: 100000,
                  expectedPrice: eurUsdRate,
                  exchange: 'FX_MARKET',
                  timing: 'immediate',
                },
                {
                  order: 3,
                  action: 'sell',
                  asset: gbpUsd,
                  quantity: 100000 / gbpUsdRate,
                  expectedPrice: gbpUsdRate,
                  exchange: 'FX_MARKET',
                  timing: 'immediate',
                },
              ],
        });
      }
    }

    return opportunities;
  }

  async detectStatisticalArbitrage(
    assets: AssetIdentifier[],
  ): Promise<ArbitrageOpportunityData[]> {
    this.logger.debug('Detecting statistical arbitrage opportunities');

    const opportunities: ArbitrageOpportunityData[] = [];

    // Look for mean-reverting pairs
    const stockAssets = assets.filter(
      (asset) => asset.class === AssetClass.STOCKS,
    );

    for (let i = 0; i < stockAssets.length; i++) {
      for (let j = i + 1; j < stockAssets.length; j++) {
        const asset1 = stockAssets[i];
        const asset2 = stockAssets[j];

        // Mock historical correlation and current spread
        const historicalCorrelation = Math.random() * 0.4 + 0.6; // 0.6-1.0
        const currentSpread = (Math.random() - 0.5) * 4; // -2 to +2 standard deviations
        const spreadVolatility = Math.random() * 0.5 + 0.2; // 0.2-0.7

        // Check if spread is significantly away from mean
        if (Math.abs(currentSpread) > 2 && historicalCorrelation > 0.7) {
          const confidence = Math.min(
            0.95,
            historicalCorrelation * (Math.abs(currentSpread) / 2),
          );
          const expectedReturn =
            Math.abs(currentSpread) * spreadVolatility * 0.5;

          opportunities.push({
            id: `statistical_${asset1.symbol}_${asset2.symbol}_${Date.now()}`,
            type: ArbitrageType.STATISTICAL,
            assets: [asset1, asset2],
            expectedReturn: expectedReturn,
            requiredCapital: 50000, // $50k
            timeToExecution: 7 * 24 * 60, // 7 days in minutes
            riskLevel: 'medium',
            confidence: confidence,
            expirationTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            executionSteps:
              currentSpread > 0
                ? [
                    {
                      order: 1,
                      action: 'sell',
                      asset: asset1,
                      quantity: 100,
                      expectedPrice: this.getMockPrice(asset1.symbol),
                      exchange: asset1.exchange || 'STOCK_EXCHANGE',
                      timing: 'immediate',
                    },
                    {
                      order: 2,
                      action: 'buy',
                      asset: asset2,
                      quantity: 100,
                      expectedPrice: this.getMockPrice(asset2.symbol),
                      exchange: asset2.exchange || 'STOCK_EXCHANGE',
                      timing: 'immediate',
                    },
                  ]
                : [
                    {
                      order: 1,
                      action: 'buy',
                      asset: asset1,
                      quantity: 100,
                      expectedPrice: this.getMockPrice(asset1.symbol),
                      exchange: asset1.exchange || 'STOCK_EXCHANGE',
                      timing: 'immediate',
                    },
                    {
                      order: 2,
                      action: 'sell',
                      asset: asset2,
                      quantity: 100,
                      expectedPrice: this.getMockPrice(asset2.symbol),
                      exchange: asset2.exchange || 'STOCK_EXCHANGE',
                      timing: 'immediate',
                    },
                  ],
          });
        }
      }
    }

    return opportunities;
  }

  async detectMergerArbitrage(
    assets: AssetIdentifier[],
  ): Promise<ArbitrageOpportunityData[]> {
    this.logger.debug('Detecting merger arbitrage opportunities');

    const opportunities: ArbitrageOpportunityData[] = [];

    // Mock merger announcements
    const stockAssets = assets.filter(
      (asset) => asset.class === AssetClass.STOCKS,
    );
    const mergerCandidates = stockAssets.slice(
      0,
      Math.min(3, stockAssets.length),
    );

    mergerCandidates.forEach((asset) => {
      // Mock merger details
      const currentPrice = this.getMockPrice(asset.symbol);
      const offerPrice = currentPrice * (1.15 + Math.random() * 0.25); // 15-40% premium
      const dealProbability = Math.random() * 0.4 + 0.6; // 60-100% probability
      const timeToClose = Math.random() * 180 + 30; // 30-210 days

      const expectedReturn =
        ((offerPrice - currentPrice) / currentPrice) * dealProbability;
      const annualizedReturn = expectedReturn * (365 / timeToClose);

      if (annualizedReturn > 0.1) {
        // Minimum 10% annualized return
        opportunities.push({
          id: `merger_${asset.symbol}_${Date.now()}`,
          type: ArbitrageType.MERGER,
          assets: [asset],
          expectedReturn: expectedReturn,
          requiredCapital: currentPrice * 1000,
          timeToExecution: timeToClose,
          riskLevel: 'high',
          confidence: dealProbability,
          expirationTime: new Date(
            Date.now() + timeToClose * 24 * 60 * 60 * 1000,
          ),
          executionSteps: [
            {
              order: 1,
              action: 'buy',
              asset: asset,
              quantity: 1000,
              expectedPrice: currentPrice,
              exchange: asset.exchange || 'STOCK_EXCHANGE',
              timing: 'immediate',
            },
          ],
        });
      }
    });

    return opportunities;
  }

  async detectConvertibleArbitrage(
    assets: AssetIdentifier[],
  ): Promise<ArbitrageOpportunityData[]> {
    this.logger.debug('Detecting convertible bond arbitrage opportunities');

    const opportunities: ArbitrageOpportunityData[] = [];

    // Mock convertible bond opportunities
    const bondAssets = assets.filter(
      (asset) => asset.class === AssetClass.BONDS,
    );
    const stockAssets = assets.filter(
      (asset) => asset.class === AssetClass.STOCKS,
    );

    bondAssets.forEach((bondAsset) => {
      // Find corresponding stock
      const correspondingStock = stockAssets.find(
        (stock) =>
          stock.symbol === bondAsset.symbol ||
          bondAsset.symbol.includes(stock.symbol),
      );

      if (correspondingStock) {
        const stockPrice = this.getMockPrice(correspondingStock.symbol);
        const bondPrice = stockPrice * 10; // Mock bond price
        const conversionRatio = 10; // 10 shares per bond
        const conversionValue = stockPrice * conversionRatio;

        const arbitrageValue = conversionValue - bondPrice;
        const returnRate = arbitrageValue / bondPrice;

        if (returnRate > 0.02) {
          // Minimum 2% return
          opportunities.push({
            id: `convertible_${bondAsset.symbol}_${Date.now()}`,
            type: ArbitrageType.CONVERTIBLE,
            assets: [bondAsset, correspondingStock],
            expectedReturn: returnRate,
            requiredCapital: bondPrice * 10,
            timeToExecution: 1, // 1 day
            riskLevel: 'medium',
            confidence: 0.8,
            expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            executionSteps: [
              {
                order: 1,
                action: 'buy',
                asset: bondAsset,
                quantity: 10,
                expectedPrice: bondPrice,
                exchange: 'BOND_MARKET',
                timing: 'immediate',
              },
              {
                order: 2,
                action: 'sell',
                asset: correspondingStock,
                quantity: 100, // 10 bonds * 10 conversion ratio
                expectedPrice: stockPrice,
                exchange: correspondingStock.exchange || 'STOCK_EXCHANGE',
                timing: 'conditional',
              },
            ],
          });
        }
      }
    });

    return opportunities;
  }

  async getPairsTradingOpportunities(
    assets: AssetIdentifier[],
  ): Promise<PairsTradingOpportunity[]> {
    this.logger.debug('Detecting pairs trading opportunities');

    const opportunities: PairsTradingOpportunity[] = [];
    const stockAssets = assets.filter(
      (asset) => asset.class === AssetClass.STOCKS,
    );

    for (let i = 0; i < stockAssets.length; i++) {
      for (let j = i + 1; j < stockAssets.length; j++) {
        const asset1 = stockAssets[i];
        const asset2 = stockAssets[j];

        // Mock pairs analysis
        const correlation = Math.random() * 0.4 + 0.6; // 0.6-1.0
        const cointegration = Math.random() * 0.3 + 0.7; // 0.7-1.0
        const currentRatio = Math.random() * 2 + 0.5; // 0.5-2.5
        const meanRatio = 1.0 + (Math.random() - 0.5) * 0.2; // 0.9-1.1
        const stdDev = Math.random() * 0.3 + 0.1; // 0.1-0.4

        const zScore = Math.abs(currentRatio - meanRatio) / stdDev;

        if (correlation > 0.8 && cointegration > 0.8 && zScore > 2) {
          opportunities.push({
            pair: [asset1, asset2],
            correlation,
            cointegration,
            currentRatio,
            meanRatio,
            zScore,
            confidence: Math.min(0.95, (correlation + cointegration) / 2),
            expectedReturn: zScore * stdDev * 0.5,
            recommendedAction:
              currentRatio > meanRatio
                ? 'SHORT_FIRST_LONG_SECOND'
                : 'LONG_FIRST_SHORT_SECOND',
            entryPrice1: this.getMockPrice(asset1.symbol),
            entryPrice2: this.getMockPrice(asset2.symbol),
            stopLoss: zScore * 1.5,
            takeProfit: zScore * 0.5,
            timeframe: '30d',
          });
        }
      }
    }

    return opportunities
      .sort((a, b) => b.expectedReturn - a.expectedReturn)
      .slice(0, 10); // Top 10 pairs
  }

  async saveArbitrageOpportunity(
    data: Partial<ArbitrageOpportunity>,
  ): Promise<ArbitrageOpportunity> {
    const opportunity = this.arbitrageRepository.create(data);
    return this.arbitrageRepository.save(opportunity);
  }

  async getActiveOpportunities(): Promise<ArbitrageOpportunity[]> {
    return this.arbitrageRepository.find({
      where: {
        expirationTime: {
          gt: new Date(),
        } as any,
      },
      order: {
        expectedReturn: 'DESC',
      },
    });
  }

  private getMockPrice(symbol: string): number {
    const basePrices = {
      AAPL: 175,
      MSFT: 330,
      GOOGL: 2800,
      TSLA: 240,
      'EUR/USD': 1.085,
      'GBP/USD': 1.265,
      'EUR/GBP': 0.858,
      BTC: 45000,
      ETH: 2500,
      GC: 1950, // Gold
      CL: 75.5, // Crude Oil
    };

    return basePrices[symbol] || Math.random() * 200 + 50;
  }
}
