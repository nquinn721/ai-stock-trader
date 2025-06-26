import { Controller, Get, Logger, Param, Post, Query } from '@nestjs/common';
import { ForexTradingService } from '../services/forex-trading.service';
import {
  CarryTradeOpportunity,
  CentralBankPolicy,
  CurrencyCorrelation,
  EconomicIndicator,
  ForexOrderBook,
  ForexPair,
  ForexTechnicalIndicators,
  ForexTick,
  ForexTradeSignal,
} from '../types/multi-asset.types';

@Controller('forex')
export class ForexController {
  private readonly logger = new Logger(ForexController.name);

  constructor(private readonly forexService: ForexTradingService) {}

  @Get('pairs')
  async getForexPairs(): Promise<ForexPair[]> {
    this.logger.debug('Getting supported forex pairs');
    return await this.forexService.getForexPairs();
  }

  @Get(':pair/tick')
  async getTick(@Param('pair') pair: ForexPair): Promise<ForexTick> {
    this.logger.debug(`Getting tick data for ${pair}`);
    return await this.forexService.getForexTick(pair);
  }

  @Get(':pair/orderbook')
  async getOrderBook(
    @Param('pair') pair: ForexPair,
    @Query('depth') depth?: string,
  ): Promise<ForexOrderBook> {
    this.logger.debug(`Getting order book for ${pair}`);
    const depthNum = depth ? parseInt(depth) : 10;
    return await this.forexService.getOrderBook(pair, depthNum);
  }

  @Get(':pair/technical')
  async getTechnicalIndicators(
    @Param('pair') pair: ForexPair,
    @Query('timeframe') timeframe?: string,
  ): Promise<ForexTechnicalIndicators> {
    this.logger.debug(`Getting technical indicators for ${pair}`);
    return await this.forexService.calculateTechnicalIndicators(
      pair,
      timeframe,
    );
  }

  @Get(':pair/signals')
  async getTradeSignals(
    @Param('pair') pair: ForexPair,
  ): Promise<ForexTradeSignal[]> {
    this.logger.debug(`Getting trade signals for ${pair}`);
    return await this.forexService.generateTradeSignals(pair);
  }

  @Get(':pair/historical')
  async getHistoricalData(
    @Param('pair') pair: ForexPair,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('interval') interval?: string,
  ) {
    this.logger.debug(`Getting historical data for ${pair}`);

    const start = new Date(startDate);
    const end = new Date(endDate);

    return await this.forexService.getHistoricalData(
      pair,
      start,
      end,
      interval,
    );
  }

  @Get('carry-trades')
  async getCarryTradeOpportunities(): Promise<CarryTradeOpportunity[]> {
    this.logger.debug('Getting carry trade opportunities');
    return await this.forexService.getCarryTradeOpportunities();
  }

  @Get('correlations')
  async getCurrencyCorrelations(): Promise<CurrencyCorrelation[]> {
    this.logger.debug('Getting currency correlations');
    return await this.forexService.getCurrencyCorrelations();
  }

  @Get('economic-indicators/:currency')
  async getEconomicIndicators(
    @Param('currency') currency: string,
  ): Promise<EconomicIndicator[]> {
    this.logger.debug(`Getting economic indicators for ${currency}`);
    return await this.forexService.getEconomicIndicators(currency);
  }

  @Get('central-bank/:currency')
  async getCentralBankPolicy(
    @Param('currency') currency: string,
  ): Promise<CentralBankPolicy> {
    this.logger.debug(`Getting central bank policy for ${currency}`);
    return await this.forexService.getCentralBankPolicy(currency);
  }

  @Post(':pair/analyze')
  async analyzeForexPair(@Param('pair') pair: ForexPair): Promise<{
    tick: ForexTick;
    technical: ForexTechnicalIndicators;
    signals: ForexTradeSignal[];
    orderBook: ForexOrderBook;
  }> {
    this.logger.debug(`Performing comprehensive analysis for ${pair}`);

    const [tick, technical, signals, orderBook] = await Promise.all([
      this.forexService.getForexTick(pair),
      this.forexService.calculateTechnicalIndicators(pair),
      this.forexService.generateTradeSignals(pair),
      this.forexService.getOrderBook(pair),
    ]);

    return {
      tick,
      technical,
      signals,
      orderBook,
    };
  }

  @Get('market-overview')
  async getMarketOverview() {
    this.logger.debug('Getting forex market overview');

    const majorPairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD'];
    const pairData = await Promise.all(
      majorPairs.map(async (pair) => {
        const tick = await this.forexService.getForexTick(pair as ForexPair);
        return {
          pair,
          price: tick.bid,
          change: tick.change24h,
          volume: tick.volume,
        };
      }),
    );

    return {
      majorPairs: pairData,
      volatilityIndex: Math.random() * 20 + 10, // 10-30
      riskSentiment: Math.random() > 0.5 ? 'RISK_ON' : 'RISK_OFF',
      dollarIndex: Math.random() * 20 + 90, // 90-110
      topVolumePairs: pairData.sort((a, b) => b.volume - a.volume).slice(0, 5),
      topMovers: pairData
        .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
        .slice(0, 3),
    };
  }

  @Get('sessions')
  async getTradingSessions() {
    this.logger.debug('Getting forex trading sessions');

    const now = new Date();
    const currentHour = now.getUTCHours();

    return {
      current: this.getCurrentSession(currentHour),
      sessions: [
        {
          name: 'Sydney',
          open: 22,
          close: 7,
          status: this.getSessionStatus(22, 7, currentHour),
          volume: 'Low',
          pairs: ['AUD/USD', 'NZD/USD', 'AUD/JPY'],
        },
        {
          name: 'Tokyo',
          open: 0,
          close: 9,
          status: this.getSessionStatus(0, 9, currentHour),
          volume: 'Medium',
          pairs: ['USD/JPY', 'EUR/JPY', 'GBP/JPY'],
        },
        {
          name: 'London',
          open: 8,
          close: 17,
          status: this.getSessionStatus(8, 17, currentHour),
          volume: 'High',
          pairs: ['EUR/USD', 'GBP/USD', 'EUR/GBP'],
        },
        {
          name: 'New York',
          open: 13,
          close: 22,
          status: this.getSessionStatus(13, 22, currentHour),
          volume: 'High',
          pairs: ['EUR/USD', 'GBP/USD', 'USD/CAD'],
        },
      ],
      overlaps: [
        {
          sessions: ['Tokyo', 'London'],
          time: '8:00-9:00 GMT',
          activity: 'Medium',
        },
        {
          sessions: ['London', 'New York'],
          time: '13:00-17:00 GMT',
          activity: 'Highest',
        },
      ],
    };
  }

  private getCurrentSession(hour: number): string {
    if (hour >= 22 || hour < 7) return 'Sydney';
    if (hour >= 0 && hour < 9) return 'Tokyo';
    if (hour >= 8 && hour < 17) return 'London';
    if (hour >= 13 && hour < 22) return 'New York';
    return 'Between Sessions';
  }

  private getSessionStatus(
    open: number,
    close: number,
    currentHour: number,
  ): 'OPEN' | 'CLOSED' {
    if (open > close) {
      // Session crosses midnight
      return currentHour >= open || currentHour < close ? 'OPEN' : 'CLOSED';
    } else {
      return currentHour >= open && currentHour < close ? 'OPEN' : 'CLOSED';
    }
  }
}
