import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AlternativeData } from '../entities/alternative-data.entity';
import {
  AlternativeDataPoint,
  AlternativeDataType,
  AssetIdentifier,
  EconomicIndicator,
  ESGScore,
  NewsVolumeData,
  PatentData,
  SatelliteData,
  SatelliteDataType,
  SentimentMetric,
  SentimentMomentum,
  SocialSentimentData,
  SupplyChainData,
} from '../types/multi-asset.types';

@Injectable()
export class AlternativeDataService {
  private readonly logger = new Logger(AlternativeDataService.name);

  constructor(
    @InjectRepository(AlternativeData)
    private alternativeDataRepository: Repository<AlternativeData>,
  ) {}

  async getDataForAsset(
    asset: AssetIdentifier,
  ): Promise<AlternativeDataPoint[]> {
    this.logger.debug(
      `Getting alternative data for asset ${asset.symbol} in class ${asset.class}`,
    );

    const dataPoints: AlternativeDataPoint[] = [];

    // Get different types of alternative data based on asset class
    switch (asset.class) {
      case 'stocks':
        dataPoints.push(
          ...(await this.getEarningsCallSentiment(asset.symbol)),
          ...(await this.getPatentFilings(asset.symbol)),
          ...(await this.getESGScores(asset.symbol)),
          ...(await this.getSupplyChainData(asset.symbol)),
        );
        break;
      case 'commodities':
        dataPoints.push(
          ...(await this.getSatelliteImagery(asset.symbol)),
          ...(await this.getWeatherData(asset.symbol)),
        );
        break;
      case 'crypto':
      case 'forex':
        dataPoints.push(...(await this.getSocialSentiment(asset.symbol)));
        break;
      default:
        dataPoints.push(...(await this.getEconomicIndicators(asset.symbol)));
    }

    return dataPoints;
  }

  async getSatelliteImagery(symbol: string): Promise<AlternativeDataPoint[]> {
    this.logger.debug(`Getting satellite imagery data for ${symbol}`);

    // Mock satellite data for different commodity types
    const dataPoints: AlternativeDataPoint[] = [];

    // Oil storage satellite data
    if (symbol.includes('CL') || symbol.includes('oil')) {
      const oilStorageData: SatelliteData = {
        type: SatelliteDataType.OIL_STORAGE,
        location: {
          latitude: 29.7604,
          longitude: -95.3698,
          region: 'US_GULF_COAST',
          country: 'USA',
        },
        data: {
          tankFillLevel: Math.random() * 100,
          capacityUtilization: Math.random() * 90 + 10,
          changeFromLastWeek: (Math.random() - 0.5) * 20,
          estimatedVolume: Math.floor(Math.random() * 500000000), // barrels
        },
        timestamp: new Date(),
        confidence: 0.85,
        source: 'Planet Labs',
      };

      dataPoints.push({
        type: AlternativeDataType.SATELLITE_IMAGERY,
        value: oilStorageData,
        timestamp: new Date(),
        source: 'Satellite Analysis',
        reliability: 0.85,
        impact:
          oilStorageData.data.changeFromLastWeek > 0 ? 'bearish' : 'bullish',
      });
    }

    // Crop yield satellite data
    if (
      symbol.includes('ZC') ||
      symbol.includes('ZS') ||
      symbol.includes('ZW')
    ) {
      const cropData: SatelliteData = {
        type: SatelliteDataType.CROP_YIELD,
        location: {
          latitude: 41.8781,
          longitude: -87.6298,
          region: 'US_MIDWEST',
          country: 'USA',
        },
        data: {
          vegetationIndex: Math.random() * 0.8 + 0.2,
          soilMoisture: Math.random() * 100,
          plantingProgress: Math.random() * 100,
          yieldEstimate: Math.random() * 200 + 100, // bushels per acre
          weatherStress: Math.random() * 0.5,
        },
        timestamp: new Date(),
        confidence: 0.78,
        source: 'USDA/NASA',
      };

      dataPoints.push({
        type: AlternativeDataType.SATELLITE_IMAGERY,
        value: cropData,
        timestamp: new Date(),
        source: 'Agricultural Satellite Data',
        reliability: 0.78,
        impact: cropData.data.yieldEstimate > 150 ? 'bearish' : 'bullish',
      });
    }

    return dataPoints;
  }

  async getSocialSentiment(symbol: string): Promise<AlternativeDataPoint[]> {
    this.logger.debug(`Getting social sentiment data for ${symbol}`);

    const twitterSentiment: SentimentMetric = {
      score: (Math.random() - 0.5) * 2, // -1 to 1
      volume: Math.floor(Math.random() * 100000),
      mentions: Math.floor(Math.random() * 50000),
      engagement: Math.floor(Math.random() * 200000),
      influencerSentiment: (Math.random() - 0.5) * 2,
      timestamp: new Date(),
    };

    const redditSentiment: SentimentMetric = {
      score: (Math.random() - 0.5) * 2,
      volume: Math.floor(Math.random() * 25000),
      mentions: Math.floor(Math.random() * 10000),
      engagement: Math.floor(Math.random() * 75000),
      influencerSentiment: (Math.random() - 0.5) * 2,
      timestamp: new Date(),
    };

    const newsVolume: NewsVolumeData = {
      totalArticles: Math.floor(Math.random() * 1000),
      sentimentScore: (Math.random() - 0.5) * 2,
      keyTopics: [
        'market analysis',
        'price prediction',
        'adoption',
        'regulation',
      ],
      sourceCredibility: Math.random() * 0.3 + 0.7,
      timestamp: new Date(),
    };

    const momentum: SentimentMomentum = {
      direction:
        Math.random() > 0.33
          ? 'increasing'
          : Math.random() > 0.5
            ? 'decreasing'
            : 'stable',
      velocity: Math.random() * 10 - 5,
      acceleration: Math.random() * 2 - 1,
      turning_points: [
        new Date(Date.now() - 86400000),
        new Date(Date.now() - 172800000),
      ],
    };

    const socialSentiment: SocialSentimentData = {
      twitter: twitterSentiment,
      reddit: redditSentiment,
      newsVolume,
      aggregatedScore:
        (twitterSentiment.score +
          redditSentiment.score +
          newsVolume.sentimentScore) /
        3,
      momentum,
    };

    return [
      {
        type: AlternativeDataType.SOCIAL_SENTIMENT,
        value: socialSentiment,
        timestamp: new Date(),
        source: 'Social Media Aggregator',
        reliability: 0.72,
        impact:
          socialSentiment.aggregatedScore > 0.2
            ? 'bullish'
            : socialSentiment.aggregatedScore < -0.2
              ? 'bearish'
              : 'neutral',
      },
    ];
  }

  async getEconomicIndicators(symbol: string): Promise<AlternativeDataPoint[]> {
    this.logger.debug(`Getting economic indicators for ${symbol}`);

    const indicators: EconomicIndicator[] = [
      {
        currency: 'USD',
        indicator: 'GDP Growth Rate',
        current: 2.1,
        previous: 1.8,
        forecast: 2.3,
        impact: 'HIGH',
        releaseDate: new Date(),
        nextRelease: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      {
        currency: 'USD',
        indicator: 'Consumer Price Index',
        current: 2.4,
        previous: 2.6,
        forecast: 2.2,
        impact: 'HIGH',
        releaseDate: new Date(),
        nextRelease: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      {
        currency: 'USD',
        indicator: 'Unemployment Rate',
        current: 3.8,
        previous: 4.1,
        forecast: 3.7,
        impact: 'MEDIUM',
        releaseDate: new Date(),
        nextRelease: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    ];

    return indicators.map((indicator) => ({
      type: AlternativeDataType.ECONOMIC_INDICATOR,
      value: indicator,
      timestamp: new Date(),
      source: 'Federal Reserve Economic Data',
      reliability: 0.95,
      impact: indicator.current > indicator.forecast ? 'bullish' : 'bearish',
    }));
  }

  async getEarningsCallSentiment(
    symbol: string,
  ): Promise<AlternativeDataPoint[]> {
    this.logger.debug(`Getting earnings call sentiment for ${symbol}`);

    const sentimentData = {
      transcript: `Earnings call transcript analysis for ${symbol}`,
      overallSentiment: (Math.random() - 0.5) * 2,
      keyTopics: [
        { topic: 'revenue growth', sentiment: Math.random() - 0.5 },
        { topic: 'market expansion', sentiment: Math.random() - 0.5 },
        { topic: 'cost management', sentiment: Math.random() - 0.5 },
        { topic: 'future outlook', sentiment: Math.random() - 0.5 },
      ],
      managementConfidence: Math.random() * 0.6 + 0.4,
      guidanceDirection:
        Math.random() > 0.5
          ? 'raised'
          : Math.random() > 0.5
            ? 'lowered'
            : 'maintained',
      analystQuestions: {
        count: Math.floor(Math.random() * 20) + 5,
        averageSentiment: (Math.random() - 0.5) * 2,
        concernLevel: Math.random(),
      },
    };

    return [
      {
        type: AlternativeDataType.EARNINGS_CALL_SENTIMENT,
        value: sentimentData,
        timestamp: new Date(),
        source: 'Natural Language Processing',
        reliability: 0.82,
        impact:
          sentimentData.overallSentiment > 0.1
            ? 'bullish'
            : sentimentData.overallSentiment < -0.1
              ? 'bearish'
              : 'neutral',
      },
    ];
  }

  async getPatentFilings(symbol: string): Promise<AlternativeDataPoint[]> {
    this.logger.debug(`Getting patent filings for ${symbol}`);

    const patentData: PatentData = {
      company: symbol,
      recentFilings: Math.floor(Math.random() * 50) + 10,
      technologyAreas: [
        'artificial intelligence',
        'blockchain',
        'semiconductors',
        'renewable energy',
      ],
      innovationScore: Math.random() * 0.4 + 0.6,
      patentQuality: Math.random() * 0.3 + 0.7,
      competitivePosition:
        Math.random() > 0.66
          ? 'leading'
          : Math.random() > 0.33
            ? 'competitive'
            : 'lagging',
      filingTrend: Math.random() > 0.5 ? 'increasing' : 'decreasing',
      citationIndex: Math.random() * 10 + 1,
    };

    return [
      {
        type: AlternativeDataType.PATENT_FILING,
        value: patentData,
        timestamp: new Date(),
        source: 'Patent Office Database',
        reliability: 0.88,
        impact:
          patentData.filingTrend === 'increasing' &&
          patentData.innovationScore > 0.7
            ? 'bullish'
            : 'neutral',
      },
    ];
  }

  async getSupplyChainData(symbol: string): Promise<AlternativeDataPoint[]> {
    this.logger.debug(`Getting supply chain data for ${symbol}`);

    const supplyChainData: SupplyChainData = {
      company: symbol,
      supplierDiversity: Math.random() * 0.4 + 0.6,
      geographicRisk: Math.random() * 0.5,
      disruptionScore: Math.random() * 0.3,
      resilience: Math.random() * 0.3 + 0.7,
      sustainability: Math.random() * 0.4 + 0.6,
      keyRisks: [
        'geopolitical tensions',
        'weather events',
        'transportation delays',
      ],
      mitigationStrategies: [
        'supplier diversification',
        'inventory buffers',
        'alternative routes',
      ],
    };

    return [
      {
        type: AlternativeDataType.SUPPLY_CHAIN,
        value: supplyChainData,
        timestamp: new Date(),
        source: 'Supply Chain Intelligence',
        reliability: 0.75,
        impact:
          supplyChainData.disruptionScore < 0.2
            ? 'bullish'
            : supplyChainData.disruptionScore > 0.4
              ? 'bearish'
              : 'neutral',
      },
    ];
  }

  async getESGScores(symbol: string): Promise<AlternativeDataPoint[]> {
    this.logger.debug(`Getting ESG scores for ${symbol}`);

    const esgScore: ESGScore = {
      company: symbol,
      overallScore: Math.random() * 40 + 60, // 60-100 range
      environmental: Math.random() * 40 + 60,
      social: Math.random() * 40 + 60,
      governance: Math.random() * 40 + 60,
      trend:
        Math.random() > 0.5
          ? 'improving'
          : Math.random() > 0.5
            ? 'declining'
            : 'stable',
      controversies: Math.floor(Math.random() * 3),
      industryRank: Math.floor(Math.random() * 100) + 1,
      lastUpdated: new Date(),
    };

    return [
      {
        type: AlternativeDataType.ESG_SCORES,
        value: esgScore,
        timestamp: new Date(),
        source: 'ESG Rating Agency',
        reliability: 0.8,
        impact:
          esgScore.trend === 'improving' && esgScore.overallScore > 75
            ? 'bullish'
            : esgScore.trend === 'declining'
              ? 'bearish'
              : 'neutral',
      },
    ];
  }

  async getWeatherData(symbol: string): Promise<AlternativeDataPoint[]> {
    this.logger.debug(`Getting weather data for ${symbol}`);

    const weatherData = {
      region: 'Global',
      temperature: Math.random() * 30 + 10, // 10-40°C
      precipitation: Math.random() * 200, // mm
      extremeEvents: Math.floor(Math.random() * 5),
      seasonalAnomaly: Math.random() * 4 - 2, // -2 to +2 standard deviations
      impactAssessment: {
        agriculture: (Math.random() - 0.5) * 2,
        energy: (Math.random() - 0.5) * 2,
        transportation: (Math.random() - 0.5) * 2,
      },
      forecast: {
        nextWeek: Math.random() > 0.5 ? 'favorable' : 'concerning',
        nextMonth: Math.random() > 0.5 ? 'normal' : 'abnormal',
      },
    };

    return [
      {
        type: AlternativeDataType.WEATHER_DATA,
        value: weatherData,
        timestamp: new Date(),
        source: 'Meteorological Service',
        reliability: 0.85,
        impact:
          Math.abs(weatherData.seasonalAnomaly) > 1.5 ? 'bearish' : 'neutral',
      },
    ];
  }

  async saveAlternativeData(
    data: Partial<AlternativeData>,
  ): Promise<AlternativeData> {
    const altData = this.alternativeDataRepository.create(data);
    return this.alternativeDataRepository.save(altData);
  }

  async getHistoricalAlternativeData(
    assetSymbol: string,
    dataType: AlternativeDataType,
    startDate: Date,
    endDate: Date,
  ): Promise<AlternativeData[]> {
    this.logger.debug(
      `Getting historical alternative data for ${assetSymbol}, type: ${dataType}`,
    );

    return this.alternativeDataRepository.find({
      where: {
        assetSymbol,
        dataType,
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

  async getDataSources(): Promise<string[]> {
    return [
      'Planet Labs (Satellite Imagery)',
      'Twitter API (Social Sentiment)',
      'Reddit API (Social Sentiment)',
      'News Aggregator (Media Sentiment)',
      'Federal Reserve Economic Data (FRED)',
      'Patent Office Database',
      'Supply Chain Intelligence Platform',
      'ESG Rating Agencies',
      'Meteorological Services',
      'Academic Research Papers',
      'Government Statistical Offices',
    ];
  }

  async getDataTypesByAssetClass(): Promise<{
    [assetClass: string]: AlternativeDataType[];
  }> {
    return {
      stocks: [
        AlternativeDataType.EARNINGS_CALL_SENTIMENT,
        AlternativeDataType.PATENT_FILING,
        AlternativeDataType.SUPPLY_CHAIN,
        AlternativeDataType.ESG_SCORES,
        AlternativeDataType.SOCIAL_SENTIMENT,
      ],
      crypto: [
        AlternativeDataType.SOCIAL_SENTIMENT,
        AlternativeDataType.ECONOMIC_INDICATOR,
      ],
      forex: [
        AlternativeDataType.ECONOMIC_INDICATOR,
        AlternativeDataType.SOCIAL_SENTIMENT,
      ],
      commodities: [
        AlternativeDataType.SATELLITE_IMAGERY,
        AlternativeDataType.WEATHER_DATA,
        AlternativeDataType.ECONOMIC_INDICATOR,
      ],
    };
  }
}
