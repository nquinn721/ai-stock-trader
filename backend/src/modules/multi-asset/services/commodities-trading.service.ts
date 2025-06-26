import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommodityData } from '../entities/commodity-data.entity';
import {
  AssetClass,
  CommodityMarketData,
  CommodityTechnicalIndicators,
  CommodityTradeSignal,
  CommodityType,
  FuturesContract,
  InventoryLevel,
  SeasonalPattern,
  SupplyDemandData,
  WeatherImpact,
} from '../types/multi-asset.types';

@Injectable()
export class CommoditiesTradingService {
  private readonly logger = new Logger(CommoditiesTradingService.name);

  private readonly supportedCommodities = {
    [CommodityType.ENERGY]: ['CL', 'NG', 'HO', 'RB', 'BZ'], // Crude Oil, Natural Gas, Heating Oil, RBOB Gas, Brent
    [CommodityType.METALS]: ['GC', 'SI', 'PL', 'PA', 'HG'], // Gold, Silver, Platinum, Palladium, Copper
    [CommodityType.AGRICULTURE]: ['ZC', 'ZS', 'ZW', 'CT', 'KC'], // Corn, Soybeans, Wheat, Cotton, Coffee
    [CommodityType.LIVESTOCK]: ['LC', 'LH', 'FC'], // Live Cattle, Lean Hogs, Feeder Cattle
  };

  constructor(
    @InjectRepository(CommodityData)
    private commodityDataRepository: Repository<CommodityData>,
  ) {}

  async getSupportedCommodities(): Promise<{
    [key in CommodityType]: string[];
  }> {
    return this.supportedCommodities;
  }

  async getCommodityData(symbol: string): Promise<CommodityMarketData> {
    this.logger.debug(`Getting commodity data for ${symbol}`);

    // TODO: Integrate with real commodities data provider (CME, NYMEX, COMEX)
    // For now, return mock data structure
    const commodityType = this.getCommodityType(symbol);

    return {
      symbol,
      assetClass: AssetClass.COMMODITIES,
      type: commodityType,
      price: this.generateMockPrice(symbol),
      volume: Math.floor(Math.random() * 100000),
      change: (Math.random() - 0.5) * 10,
      changePercent: (Math.random() - 0.5) * 5,
      high24h: this.generateMockPrice(symbol) * 1.02,
      low24h: this.generateMockPrice(symbol) * 0.98,
      timestamp: new Date(),
      spotPrice: this.generateMockPrice(symbol),
      futuresContracts: await this.getFuturesContracts(symbol),
      seasonalTrend: await this.getSeasonalPattern(symbol),
      supplyDemand: await this.getSupplyDemandData(symbol),
      inventory: await this.getInventoryLevels(symbol),
      technicalIndicators: await this.calculateTechnicalIndicators(symbol),
    };
  }

  async getFuturesContracts(symbol: string): Promise<FuturesContract[]> {
    this.logger.debug(`Getting futures contracts for ${symbol}`);

    // Generate mock futures contracts with different expiration dates
    const contracts: FuturesContract[] = [];
    const basePrice = this.generateMockPrice(symbol);

    for (let i = 1; i <= 6; i++) {
      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + i);

      contracts.push({
        symbol: `${symbol}${this.getContractCode(expirationDate)}`,
        underlying: symbol,
        expirationDate,
        price: basePrice + (Math.random() - 0.5) * 2,
        volume: Math.floor(Math.random() * 50000),
        openInterest: Math.floor(Math.random() * 200000),
        change: (Math.random() - 0.5) * 5,
        impliedVolatility: Math.random() * 0.5 + 0.1,
        timeToExpiration: i * 30, // days
        contango: i > 3 ? 'CONTANGO' : 'BACKWARDATION',
      });
    }

    return contracts;
  }

  async getSeasonalPattern(symbol: string): Promise<SeasonalPattern> {
    this.logger.debug(`Getting seasonal pattern for ${symbol}`);

    const commodityType = this.getCommodityType(symbol);

    // Mock seasonal data based on commodity type
    if (commodityType === CommodityType.AGRICULTURE) {
      return {
        symbol,
        pattern: 'SEASONAL',
        strongMonths: [5, 6, 7, 8], // May-August (growing season)
        weakMonths: [11, 12, 1, 2], // Nov-Feb (harvest/storage)
        peakMonth: 7, // July
        troughMonth: 12, // December
        confidence: 0.85,
        historicalAccuracy: 0.78,
        factors: ['Weather patterns', 'Planting cycles', 'Harvest timing'],
        currentPosition: 'PEAK_SEASON',
      };
    } else if (commodityType === CommodityType.ENERGY) {
      return {
        symbol,
        pattern: 'CYCLICAL',
        strongMonths: [11, 12, 1, 2], // Winter heating demand
        weakMonths: [4, 5, 9, 10], // Shoulder seasons
        peakMonth: 1, // January
        troughMonth: 5, // May
        confidence: 0.72,
        historicalAccuracy: 0.69,
        factors: ['Seasonal demand', 'Refinery maintenance', 'Weather'],
        currentPosition: 'OFF_SEASON',
      };
    } else {
      return {
        symbol,
        pattern: 'NO_CLEAR_PATTERN',
        strongMonths: [],
        weakMonths: [],
        peakMonth: 6,
        troughMonth: 12,
        confidence: 0.45,
        historicalAccuracy: 0.52,
        factors: ['Economic cycles', 'Industrial demand'],
        currentPosition: 'NEUTRAL',
      };
    }
  }

  async getSupplyDemandData(symbol: string): Promise<SupplyDemandData> {
    this.logger.debug(`Getting supply/demand data for ${symbol}`);

    return {
      symbol,
      supply: {
        current: Math.floor(Math.random() * 1000000),
        projected: Math.floor(Math.random() * 1100000),
        change: (Math.random() - 0.5) * 100000,
        factors: [
          'Production capacity',
          'Weather conditions',
          'Geopolitical events',
        ],
      },
      demand: {
        current: Math.floor(Math.random() * 950000),
        projected: Math.floor(Math.random() * 1050000),
        change: (Math.random() - 0.5) * 50000,
        factors: [
          'Economic growth',
          'Industrial activity',
          'Consumer behavior',
        ],
      },
      deficit: Math.floor(Math.random() * 100000) - 50000,
      priceElasticity: Math.random() * 2 - 1,
      lastUpdated: new Date(),
    };
  }

  async getInventoryLevels(symbol: string): Promise<InventoryLevel> {
    this.logger.debug(`Getting inventory levels for ${symbol}`);

    const currentLevel = Math.floor(Math.random() * 1000000);
    const fiveYearAverage = Math.floor(Math.random() * 900000) + 100000;

    return {
      symbol,
      currentLevel,
      previousWeek: currentLevel + Math.floor((Math.random() - 0.5) * 100000),
      fiveYearAverage,
      percentOfAverage: (currentLevel / fiveYearAverage) * 100,
      trend: Math.random() > 0.5 ? 'INCREASING' : 'DECREASING',
      daysOfSupply: Math.floor(Math.random() * 60) + 10,
      criticalLevel: fiveYearAverage * 0.3,
      surplusLevel: fiveYearAverage * 1.5,
      lastUpdated: new Date(),
    };
  }

  async getWeatherImpact(
    symbol: string,
    region?: string,
  ): Promise<WeatherImpact> {
    this.logger.debug(
      `Getting weather impact for ${symbol} in ${region || 'global'}`,
    );

    const commodityType = this.getCommodityType(symbol);

    if (commodityType === CommodityType.AGRICULTURE) {
      return {
        symbol,
        region: region || 'US_MIDWEST',
        currentConditions: {
          temperature: Math.floor(Math.random() * 40) + 50, // 50-90°F
          precipitation: Math.random() * 5, // 0-5 inches
          humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
          soilMoisture: Math.random() * 100,
        },
        forecast: {
          temperature: Math.floor(Math.random() * 40) + 50,
          precipitation: Math.random() * 3,
          outlook: Math.random() > 0.5 ? 'FAVORABLE' : 'CONCERNING',
        },
        impact: {
          priceImpact: (Math.random() - 0.5) * 10,
          riskLevel:
            Math.random() > 0.7
              ? 'HIGH'
              : Math.random() > 0.3
                ? 'MEDIUM'
                : 'LOW',
          affectedRegions: ['US_MIDWEST', 'BRAZIL', 'ARGENTINA'],
          timeframe: '2-4 weeks',
        },
        historicalComparison: {
          vsLastYear: Math.random() - 0.5,
          vs10YearAverage: Math.random() - 0.5,
          extremeWeatherProbability: Math.random() * 0.3,
        },
      };
    } else if (commodityType === CommodityType.ENERGY) {
      return {
        symbol,
        region: region || 'GLOBAL',
        currentConditions: {
          temperature: Math.floor(Math.random() * 60) + 20, // 20-80°F
          precipitation: Math.random() * 2,
          humidity: Math.floor(Math.random() * 50) + 30,
          soilMoisture: 0, // Not applicable for energy
        },
        forecast: {
          temperature: Math.floor(Math.random() * 60) + 20,
          precipitation: Math.random() * 2,
          outlook: Math.random() > 0.5 ? 'FAVORABLE' : 'CONCERNING',
        },
        impact: {
          priceImpact: (Math.random() - 0.5) * 15,
          riskLevel:
            Math.random() > 0.6
              ? 'HIGH'
              : Math.random() > 0.3
                ? 'MEDIUM'
                : 'LOW',
          affectedRegions: ['US_GULF_COAST', 'NORTH_SEA', 'MIDDLE_EAST'],
          timeframe: '1-2 weeks',
        },
        historicalComparison: {
          vsLastYear: Math.random() - 0.5,
          vs10YearAverage: Math.random() - 0.5,
          extremeWeatherProbability: Math.random() * 0.4,
        },
      };
    } else {
      // Minimal weather impact for metals
      return {
        symbol,
        region: region || 'GLOBAL',
        currentConditions: {
          temperature: 70,
          precipitation: 0,
          humidity: 50,
          soilMoisture: 0,
        },
        forecast: {
          temperature: 70,
          precipitation: 0,
          outlook: 'NEUTRAL',
        },
        impact: {
          priceImpact: 0,
          riskLevel: 'LOW',
          affectedRegions: [],
          timeframe: 'N/A',
        },
        historicalComparison: {
          vsLastYear: 0,
          vs10YearAverage: 0,
          extremeWeatherProbability: 0,
        },
      };
    }
  }

  async calculateTechnicalIndicators(
    symbol: string,
    timeframe: string = '1h',
  ): Promise<CommodityTechnicalIndicators> {
    this.logger.debug(
      `Calculating technical indicators for ${symbol} on ${timeframe}`,
    );

    const basePrice = this.generateMockPrice(symbol);

    return {
      symbol,
      timeframe,
      price: basePrice,
      sma20: basePrice * (0.98 + Math.random() * 0.04),
      sma50: basePrice * (0.96 + Math.random() * 0.08),
      sma200: basePrice * (0.9 + Math.random() * 0.2),
      ema12: basePrice * (0.99 + Math.random() * 0.02),
      ema26: basePrice * (0.97 + Math.random() * 0.06),
      rsi: Math.random() * 100,
      macd: {
        value: (Math.random() - 0.5) * 2,
        signal: (Math.random() - 0.5) * 1.5,
        histogram: (Math.random() - 0.5) * 1,
        trend: Math.random() > 0.5 ? 'bullish' : 'bearish',
      },
      bollinger: {
        upper: basePrice * 1.05,
        middle: basePrice,
        lower: basePrice * 0.95,
        bandwidth: 0.05,
        position:
          Math.random() > 0.66
            ? 'upper'
            : Math.random() > 0.33
              ? 'middle'
              : 'lower',
      },
      stochastic: {
        k: Math.random() * 100,
        d: Math.random() * 100,
      },
      atr: basePrice * (0.02 + Math.random() * 0.03),
      adx: Math.random() * 100,
      seasonalStrength: Math.random() * 100,
      momentum: (Math.random() - 0.5) * 0.1,
      volatility: Math.random() * 0.5 + 0.1,
      trendDirection:
        Math.random() > 0.66
          ? 'bullish'
          : Math.random() > 0.33
            ? 'bearish'
            : 'sideways',
      timestamp: new Date(),
    };
  }

  async generateTradeSignals(symbol: string): Promise<CommodityTradeSignal[]> {
    this.logger.debug(`Generating trade signals for ${symbol}`);

    const technicals = await this.calculateTechnicalIndicators(symbol);
    const seasonal = await this.getSeasonalPattern(symbol);
    const signals: CommodityTradeSignal[] = [];

    // RSI-based signals
    if (technicals.rsi > 80) {
      signals.push({
        symbol,
        assetClass: AssetClass.COMMODITIES,
        type: 'TECHNICAL',
        signal: 'SELL',
        strength: 'STRONG',
        confidence: 0.75,
        reason: 'RSI indicates overbought conditions',
        timestamp: new Date(),
        metadata: {
          indicator: 'RSI',
          value: technicals.rsi,
          threshold: 80,
        },
      });
    } else if (technicals.rsi < 20) {
      signals.push({
        symbol,
        assetClass: AssetClass.COMMODITIES,
        type: 'TECHNICAL',
        signal: 'BUY',
        strength: 'STRONG',
        confidence: 0.78,
        reason: 'RSI indicates oversold conditions',
        timestamp: new Date(),
        metadata: {
          indicator: 'RSI',
          value: technicals.rsi,
          threshold: 20,
        },
      });
    }

    // Seasonal signals
    const currentMonth = new Date().getMonth() + 1;
    if (seasonal.strongMonths.includes(currentMonth)) {
      signals.push({
        symbol,
        assetClass: AssetClass.COMMODITIES,
        type: 'SEASONAL',
        signal: 'BUY',
        strength: 'MODERATE',
        confidence: seasonal.confidence,
        reason: `Historically strong seasonal period for ${symbol}`,
        timestamp: new Date(),
        metadata: {
          pattern: seasonal.pattern,
          currentMonth,
          strongMonths: seasonal.strongMonths,
        },
      });
    } else if (seasonal.weakMonths.includes(currentMonth)) {
      signals.push({
        symbol,
        assetClass: AssetClass.COMMODITIES,
        type: 'SEASONAL',
        signal: 'SELL',
        strength: 'MODERATE',
        confidence: seasonal.confidence,
        reason: `Historically weak seasonal period for ${symbol}`,
        timestamp: new Date(),
        metadata: {
          pattern: seasonal.pattern,
          currentMonth,
          weakMonths: seasonal.weakMonths,
        },
      });
    }

    // MACD signals
    if (
      technicals.macd.value > technicals.macd.signal &&
      technicals.macd.histogram > 0
    ) {
      signals.push({
        symbol,
        assetClass: AssetClass.COMMODITIES,
        type: 'TECHNICAL',
        signal: 'BUY',
        strength: 'MODERATE',
        confidence: 0.68,
        reason: 'MACD bullish crossover',
        timestamp: new Date(),
        metadata: {
          indicator: 'MACD',
          macd: technicals.macd.value,
          signal: technicals.macd.signal,
        },
      });
    }

    // Supply/Demand signals
    const supplyDemand = await this.getSupplyDemandData(symbol);
    if (supplyDemand.deficit > 50000) {
      signals.push({
        symbol,
        assetClass: AssetClass.COMMODITIES,
        type: 'FUNDAMENTAL',
        signal: 'BUY',
        strength: 'STRONG',
        confidence: 0.82,
        reason: 'Supply deficit indicates upward price pressure',
        timestamp: new Date(),
        metadata: {
          deficit: supplyDemand.deficit,
          supplyChange: supplyDemand.supply.change,
          demandChange: supplyDemand.demand.change,
        },
      });
    }

    return signals;
  }

  async getHistoricalData(
    symbol: string,
    startDate: Date,
    endDate: Date,
    interval: string = '1h',
  ): Promise<CommodityData[]> {
    this.logger.debug(
      `Getting historical data for ${symbol} from ${startDate} to ${endDate}`,
    );

    return this.commodityDataRepository.find({
      where: {
        symbol: symbol,
        timestamp: {
          gte: startDate,
          lte: endDate,
        } as any,
      },
      order: {
        timestamp: 'ASC',
      },
    });
  }

  async saveCommodityData(
    data: Partial<CommodityData>,
  ): Promise<CommodityData> {
    const commodityData = this.commodityDataRepository.create(data);
    return this.commodityDataRepository.save(commodityData);
  }

  private getCommodityType(symbol: string): CommodityType {
    for (const [type, symbols] of Object.entries(this.supportedCommodities)) {
      if (symbols.includes(symbol)) {
        return type as CommodityType;
      }
    }
    return CommodityType.ENERGY; // Default fallback
  }

  private generateMockPrice(symbol: string): number {
    const basePrices = {
      CL: 75.5, // Crude Oil
      NG: 3.25, // Natural Gas
      GC: 1950, // Gold
      SI: 24.5, // Silver
      ZC: 450, // Corn
      ZS: 1350, // Soybeans
    };

    return basePrices[symbol] || 100 + Math.random() * 50;
  }

  private getContractCode(date: Date): string {
    const months = ['F', 'G', 'H', 'J', 'K', 'M', 'N', 'Q', 'U', 'V', 'X', 'Z'];
    const monthCode = months[date.getMonth()];
    const yearCode = date.getFullYear().toString().slice(-2);
    return monthCode + yearCode;
  }
}
