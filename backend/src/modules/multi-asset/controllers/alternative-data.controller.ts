import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AlternativeDataService } from '../services/alternative-data.service';
import {
  AlternativeDataPoint,
  AlternativeDataType,
  AssetIdentifier,
} from '../types/multi-asset.types';

@Controller('alternative-data')
export class AlternativeDataController {
  private readonly logger = new Logger(AlternativeDataController.name);

  constructor(
    private readonly alternativeDataService: AlternativeDataService,
  ) {}

  @Post('asset-data')
  async getDataForAsset(
    @Body() asset: AssetIdentifier,
  ): Promise<AlternativeDataPoint[]> {
    this.logger.debug(`Getting alternative data for asset ${asset.symbol}`);
    return await this.alternativeDataService.getDataForAsset(asset);
  }

  @Get('satellite/:symbol')
  async getSatelliteImagery(
    @Param('symbol') symbol: string,
  ): Promise<AlternativeDataPoint[]> {
    this.logger.debug(`Getting satellite imagery data for ${symbol}`);
    return await this.alternativeDataService.getSatelliteImagery(symbol);
  }

  @Get('social-sentiment/:symbol')
  async getSocialSentiment(
    @Param('symbol') symbol: string,
  ): Promise<AlternativeDataPoint[]> {
    this.logger.debug(`Getting social sentiment data for ${symbol}`);
    return await this.alternativeDataService.getSocialSentiment(symbol);
  }

  @Get('economic-indicators/:symbol')
  async getEconomicIndicators(
    @Param('symbol') symbol: string,
  ): Promise<AlternativeDataPoint[]> {
    this.logger.debug(`Getting economic indicators for ${symbol}`);
    return await this.alternativeDataService.getEconomicIndicators(symbol);
  }

  @Get('earnings-sentiment/:symbol')
  async getEarningsCallSentiment(
    @Param('symbol') symbol: string,
  ): Promise<AlternativeDataPoint[]> {
    this.logger.debug(`Getting earnings call sentiment for ${symbol}`);
    return await this.alternativeDataService.getEarningsCallSentiment(symbol);
  }

  @Get('patents/:symbol')
  async getPatentFilings(
    @Param('symbol') symbol: string,
  ): Promise<AlternativeDataPoint[]> {
    this.logger.debug(`Getting patent filings for ${symbol}`);
    return await this.alternativeDataService.getPatentFilings(symbol);
  }

  @Get('supply-chain/:symbol')
  async getSupplyChainData(
    @Param('symbol') symbol: string,
  ): Promise<AlternativeDataPoint[]> {
    this.logger.debug(`Getting supply chain data for ${symbol}`);
    return await this.alternativeDataService.getSupplyChainData(symbol);
  }

  @Get('esg/:symbol')
  async getESGScores(
    @Param('symbol') symbol: string,
  ): Promise<AlternativeDataPoint[]> {
    this.logger.debug(`Getting ESG scores for ${symbol}`);
    return await this.alternativeDataService.getESGScores(symbol);
  }

  @Get('weather/:symbol')
  async getWeatherData(
    @Param('symbol') symbol: string,
  ): Promise<AlternativeDataPoint[]> {
    this.logger.debug(`Getting weather data for ${symbol}`);
    return await this.alternativeDataService.getWeatherData(symbol);
  }

  @Get('historical')
  async getHistoricalAlternativeData(
    @Query('assetSymbol') assetSymbol: string,
    @Query('dataType') dataType: AlternativeDataType,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    this.logger.debug(`Getting historical alternative data for ${assetSymbol}`);

    const start = new Date(startDate);
    const end = new Date(endDate);

    return await this.alternativeDataService.getHistoricalAlternativeData(
      assetSymbol,
      dataType,
      start,
      end,
    );
  }

  @Get('sources')
  async getDataSources(): Promise<string[]> {
    this.logger.debug('Getting alternative data sources');
    return await this.alternativeDataService.getDataSources();
  }

  @Get('types-by-asset-class')
  async getDataTypesByAssetClass(): Promise<{
    [assetClass: string]: AlternativeDataType[];
  }> {
    this.logger.debug('Getting data types by asset class');
    return await this.alternativeDataService.getDataTypesByAssetClass();
  }

  @Get('dashboard')
  async getAlternativeDataDashboard(): Promise<{
    socialSentiment: any;
    satelliteInsights: any;
    economicData: any;
    corporateData: any;
    marketSentiment: any;
  }> {
    this.logger.debug('Getting alternative data dashboard');

    // Mock dashboard data aggregating various alternative data sources
    return {
      socialSentiment: {
        overview: {
          bullishMentions: Math.floor(Math.random() * 50000) + 10000,
          bearishMentions: Math.floor(Math.random() * 30000) + 5000,
          neutralMentions: Math.floor(Math.random() * 40000) + 20000,
          trendingTopics: [
            'inflation',
            'fed policy',
            'earnings',
            'crypto regulation',
          ],
          sentiment: (Math.random() - 0.5) * 2, // -1 to 1
        },
        platforms: {
          twitter: {
            volume: Math.floor(Math.random() * 100000),
            sentiment: (Math.random() - 0.5) * 2,
            influencerSentiment: (Math.random() - 0.5) * 2,
          },
          reddit: {
            volume: Math.floor(Math.random() * 50000),
            sentiment: (Math.random() - 0.5) * 2,
            subredditActivity: [
              'wallstreetbets',
              'investing',
              'stocks',
              'cryptocurrency',
            ],
          },
          news: {
            articles: Math.floor(Math.random() * 1000),
            sentiment: (Math.random() - 0.5) * 2,
            sources: ['Reuters', 'Bloomberg', 'CNBC', 'Financial Times'],
          },
        },
      },
      satelliteInsights: {
        oilStorage: {
          globalCapacity: Math.random() * 100, // percentage
          weeklyChange: (Math.random() - 0.5) * 10,
          majorRegions: [
            {
              region: 'US Gulf Coast',
              capacity: Math.random() * 100,
              change: (Math.random() - 0.5) * 5,
            },
            {
              region: 'Cushing, OK',
              capacity: Math.random() * 100,
              change: (Math.random() - 0.5) * 5,
            },
            {
              region: 'Singapore',
              capacity: Math.random() * 100,
              change: (Math.random() - 0.5) * 5,
            },
          ],
        },
        cropYields: {
          usMidwest: {
            corn: { condition: Math.random() * 100, forecast: 'above_average' },
            soybeans: { condition: Math.random() * 100, forecast: 'average' },
            wheat: {
              condition: Math.random() * 100,
              forecast: 'below_average',
            },
          },
          weatherRisk: Math.random() * 100,
          plantingProgress: Math.random() * 100,
        },
      },
      economicData: {
        indicators: {
          gdpGrowth: Math.random() * 3 + 1, // 1-4%
          unemployment: Math.random() * 5 + 3, // 3-8%
          inflation: Math.random() * 5 + 2, // 2-7%
          consumerConfidence: Math.random() * 40 + 60, // 60-100
        },
        central_banks: {
          fed: {
            nextMeeting: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
            stance: 'dovish',
          },
          ecb: {
            nextMeeting: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            stance: 'neutral',
          },
          boj: {
            nextMeeting: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
            stance: 'dovish',
          },
        },
      },
      corporateData: {
        earningsSentiment: {
          overallSentiment: (Math.random() - 0.5) * 2,
          sectorsData: [
            {
              sector: 'Technology',
              sentiment: Math.random() - 0.5,
              earnings_surprise: Math.random() - 0.5,
            },
            {
              sector: 'Healthcare',
              sentiment: Math.random() - 0.5,
              earnings_surprise: Math.random() - 0.5,
            },
            {
              sector: 'Energy',
              sentiment: Math.random() - 0.5,
              earnings_surprise: Math.random() - 0.5,
            },
            {
              sector: 'Financials',
              sentiment: Math.random() - 0.5,
              earnings_surprise: Math.random() - 0.5,
            },
          ],
        },
        patents: {
          filingTrend: Math.random() > 0.5 ? 'increasing' : 'decreasing',
          topCategories: [
            'AI/ML',
            'Blockchain',
            'Biotechnology',
            'Renewable Energy',
          ],
          innovationIndex: Math.random() * 100,
        },
        supplyChain: {
          globalRisk: Math.random() * 100,
          regionalRisks: [
            { region: 'Asia Pacific', risk: Math.random() * 100 },
            { region: 'Europe', risk: Math.random() * 100 },
            { region: 'North America', risk: Math.random() * 100 },
          ],
          disruptionAlerts: Math.floor(Math.random() * 10),
        },
      },
      marketSentiment: {
        fearGreedIndex: Math.floor(Math.random() * 100),
        vixLevel: Math.random() * 40 + 10,
        putCallRatio: Math.random() * 1.5 + 0.5,
        marginDebt: Math.random() * 1000000000000, // Trillions
        insiderTrading: {
          buyingSentiment: Math.random(),
          sellingPressure: Math.random(),
          netFlow: (Math.random() - 0.5) * 1000000000, // Millions
        },
      },
    };
  }

  @Get('realtime-feeds')
  async getRealtimeFeeds() {
    this.logger.debug('Getting real-time alternative data feeds');

    return {
      activeSources: [
        {
          name: 'Twitter Sentiment Stream',
          status: 'active',
          lastUpdate: new Date(),
          dataPoints: Math.floor(Math.random() * 10000) + 1000,
          coverage: ['stocks', 'crypto', 'forex'],
        },
        {
          name: 'Satellite Imagery Feed',
          status: 'active',
          lastUpdate: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          dataPoints: Math.floor(Math.random() * 100) + 50,
          coverage: ['commodities', 'energy'],
        },
        {
          name: 'Economic Indicators Stream',
          status: 'active',
          lastUpdate: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          dataPoints: Math.floor(Math.random() * 50) + 10,
          coverage: ['forex', 'bonds'],
        },
        {
          name: 'Patent Filings Monitor',
          status: 'delayed',
          lastUpdate: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          dataPoints: Math.floor(Math.random() * 20) + 5,
          coverage: ['stocks'],
        },
      ],
      throughput: {
        messagesPerSecond: Math.floor(Math.random() * 1000) + 100,
        bytesPerSecond: Math.floor(Math.random() * 1000000) + 100000,
        errorRate: Math.random() * 0.05, // 0-5%
      },
      healthCheck: {
        overallStatus: 'healthy',
        uptime: '99.8%',
        lastIncident: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      },
    };
  }
}
