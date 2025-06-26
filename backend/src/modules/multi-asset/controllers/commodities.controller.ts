import { Controller, Get, Logger, Param, Post, Query } from '@nestjs/common';
import { CommoditiesTradingService } from '../services/commodities-trading.service';
import {
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

@Controller('commodities')
export class CommoditiesController {
  private readonly logger = new Logger(CommoditiesController.name);

  constructor(private readonly commoditiesService: CommoditiesTradingService) {}

  @Get('supported')
  async getSupportedCommodities(): Promise<{
    [key in CommodityType]: string[];
  }> {
    this.logger.debug('Getting supported commodities');
    return await this.commoditiesService.getSupportedCommodities();
  }

  @Get(':symbol/market-data')
  async getCommodityData(
    @Param('symbol') symbol: string,
  ): Promise<CommodityMarketData> {
    this.logger.debug(`Getting market data for ${symbol}`);
    return await this.commoditiesService.getCommodityData(symbol);
  }

  @Get(':symbol/futures')
  async getFuturesContracts(
    @Param('symbol') symbol: string,
  ): Promise<FuturesContract[]> {
    this.logger.debug(`Getting futures contracts for ${symbol}`);
    return await this.commoditiesService.getFuturesContracts(symbol);
  }

  @Get(':symbol/seasonal')
  async getSeasonalPattern(
    @Param('symbol') symbol: string,
  ): Promise<SeasonalPattern> {
    this.logger.debug(`Getting seasonal pattern for ${symbol}`);
    return await this.commoditiesService.getSeasonalPattern(symbol);
  }

  @Get(':symbol/supply-demand')
  async getSupplyDemandData(
    @Param('symbol') symbol: string,
  ): Promise<SupplyDemandData> {
    this.logger.debug(`Getting supply/demand data for ${symbol}`);
    return await this.commoditiesService.getSupplyDemandData(symbol);
  }

  @Get(':symbol/inventory')
  async getInventoryLevels(
    @Param('symbol') symbol: string,
  ): Promise<InventoryLevel> {
    this.logger.debug(`Getting inventory levels for ${symbol}`);
    return await this.commoditiesService.getInventoryLevels(symbol);
  }

  @Get(':symbol/weather')
  async getWeatherImpact(
    @Param('symbol') symbol: string,
    @Query('region') region?: string,
  ): Promise<WeatherImpact> {
    this.logger.debug(`Getting weather impact for ${symbol}`);
    return await this.commoditiesService.getWeatherImpact(symbol, region);
  }

  @Get(':symbol/technical')
  async getTechnicalIndicators(
    @Param('symbol') symbol: string,
    @Query('timeframe') timeframe?: string,
  ): Promise<CommodityTechnicalIndicators> {
    this.logger.debug(`Getting technical indicators for ${symbol}`);
    return await this.commoditiesService.calculateTechnicalIndicators(
      symbol,
      timeframe,
    );
  }

  @Get(':symbol/signals')
  async getTradeSignals(
    @Param('symbol') symbol: string,
  ): Promise<CommodityTradeSignal[]> {
    this.logger.debug(`Getting trade signals for ${symbol}`);
    return await this.commoditiesService.generateTradeSignals(symbol);
  }

  @Get(':symbol/historical')
  async getHistoricalData(
    @Param('symbol') symbol: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('interval') interval?: string,
  ) {
    this.logger.debug(`Getting historical data for ${symbol}`);

    const start = new Date(startDate);
    const end = new Date(endDate);

    return await this.commoditiesService.getHistoricalData(
      symbol,
      start,
      end,
      interval,
    );
  }

  @Post(':symbol/analyze')
  async analyzeCommodity(@Param('symbol') symbol: string): Promise<{
    marketData: CommodityMarketData;
    technical: CommodityTechnicalIndicators;
    signals: CommodityTradeSignal[];
    seasonal: SeasonalPattern;
    supplyDemand: SupplyDemandData;
    inventory: InventoryLevel;
    weather: WeatherImpact;
  }> {
    this.logger.debug(`Performing comprehensive analysis for ${symbol}`);

    const [
      marketData,
      technical,
      signals,
      seasonal,
      supplyDemand,
      inventory,
      weather,
    ] = await Promise.all([
      this.commoditiesService.getCommodityData(symbol),
      this.commoditiesService.calculateTechnicalIndicators(symbol),
      this.commoditiesService.generateTradeSignals(symbol),
      this.commoditiesService.getSeasonalPattern(symbol),
      this.commoditiesService.getSupplyDemandData(symbol),
      this.commoditiesService.getInventoryLevels(symbol),
      this.commoditiesService.getWeatherImpact(symbol),
    ]);

    return {
      marketData,
      technical,
      signals,
      seasonal,
      supplyDemand,
      inventory,
      weather,
    };
  }

  @Get('market-overview')
  async getMarketOverview() {
    this.logger.debug('Getting commodities market overview');

    const energySymbols = ['CL', 'NG', 'HO', 'RB'];
    const metalsSymbols = ['GC', 'SI', 'PL', 'PA'];
    const agriSymbols = ['ZC', 'ZS', 'ZW', 'CT'];

    const getOverviewData = async (symbols: string[]) => {
      return Promise.all(
        symbols.map(async (symbol) => {
          const data = await this.commoditiesService.getCommodityData(symbol);
          return {
            symbol,
            price: data.price,
            change: data.change,
            changePercent: data.changePercent,
            volume: data.volume,
          };
        }),
      );
    };

    const [energyData, metalsData, agriData] = await Promise.all([
      getOverviewData(energySymbols),
      getOverviewData(metalsSymbols),
      getOverviewData(agriSymbols),
    ]);

    return {
      sectors: {
        energy: energyData,
        metals: metalsData,
        agriculture: agriData,
      },
      topGainers: [...energyData, ...metalsData, ...agriData]
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, 5),
      topLosers: [...energyData, ...metalsData, ...agriData]
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, 5),
      highestVolume: [...energyData, ...metalsData, ...agriData]
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 5),
      dollarIndex: Math.random() * 20 + 90, // 90-110
      globalGdpGrowth: Math.random() * 2 + 2, // 2-4%
      inflationRate: Math.random() * 3 + 2, // 2-5%
    };
  }

  @Get('exchanges')
  async getSupportedExchanges() {
    this.logger.debug('Getting supported commodity exchanges');

    return [
      {
        name: 'CME Group',
        location: 'Chicago',
        commodities: ['CL', 'NG', 'GC', 'SI', 'ZC', 'ZS', 'ZW'],
        volume24h: 2500000,
        status: 'active',
      },
      {
        name: 'ICE',
        location: 'New York/London',
        commodities: ['BZ', 'CT', 'KC', 'SB'],
        volume24h: 1200000,
        status: 'active',
      },
      {
        name: 'LME',
        location: 'London',
        commodities: ['AL', 'CU', 'ZN', 'NI'],
        volume24h: 800000,
        status: 'active',
      },
      {
        name: 'SHFE',
        location: 'Shanghai',
        commodities: ['AU', 'AG', 'CU', 'AL'],
        volume24h: 1800000,
        status: 'active',
      },
    ];
  }

  @Get('calendar')
  async getMarketCalendar() {
    this.logger.debug('Getting commodity market calendar');

    const now = new Date();
    const events: any[] = [];

    // Generate upcoming events
    for (let i = 1; i <= 30; i++) {
      const eventDate = new Date(now);
      eventDate.setDate(now.getDate() + i);

      if (Math.random() > 0.7) {
        // 30% chance of event each day
        events.push({
          date: eventDate,
          commodity: ['CL', 'NG', 'GC', 'ZC', 'ZS'][
            Math.floor(Math.random() * 5)
          ],
          event: this.getRandomEvent(),
          impact: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)],
          time: `${Math.floor(Math.random() * 12) + 8}:00 EST`,
        });
      }
    }

    return {
      upcomingEvents: events.slice(0, 20),
      weeklyReports: [
        {
          report: 'EIA Petroleum Status Report',
          day: 'Wednesday',
          time: '10:30 EST',
        },
        {
          report: 'CFTC Commitments of Traders',
          day: 'Friday',
          time: '15:30 EST',
        },
        {
          report: 'USDA Crop Progress Report',
          day: 'Monday',
          time: '16:00 EST',
        },
        { report: 'Baker Hughes Rig Count', day: 'Friday', time: '13:00 EST' },
      ],
      monthlyReports: [
        {
          report: 'USDA World Agricultural Supply and Demand',
          day: '12th',
          time: '12:00 EST',
        },
        {
          report: 'EIA Short-Term Energy Outlook',
          day: '7th',
          time: '12:00 EST',
        },
        { report: 'IEA Oil Market Report', day: '15th', time: '09:00 EST' },
      ],
    };
  }

  private getRandomEvent(): string {
    const events = [
      'Inventory Report',
      'Production Data',
      'Export Statistics',
      'Weather Update',
      'OPEC Meeting',
      'Federal Reserve Speech',
      'Trade War Update',
      'Crop Report',
      'Mining Output',
      'Refinery Capacity',
    ];
    return events[Math.floor(Math.random() * events.length)];
  }
}
