import { Controller, Get, Logger, Param, Post, Query } from '@nestjs/common';
import { CryptoTradingService } from '../services/crypto-trading.service';
import { CryptoMarketData } from '../types/multi-asset.types';

@Controller('crypto')
export class CryptoController {
  private readonly logger = new Logger(CryptoController.name);

  constructor(private readonly cryptoService: CryptoTradingService) {}

  @Get('supported')
  async getSupportedCryptos(): Promise<string[]> {
    this.logger.debug('Getting supported cryptocurrencies');
    return await this.cryptoService.getSupportedCryptos();
  }

  @Get(':symbol/market-data')
  async getMarketData(
    @Param('symbol') symbol: string,
  ): Promise<CryptoMarketData> {
    this.logger.debug(`Getting comprehensive market data for ${symbol}`);
    return await this.cryptoService.getCryptoMarketData(symbol);
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

    return await this.cryptoService.getCryptoHistory(symbol, start, end);
  }

  @Get('funding-rates')
  async getFundingRates() {
    this.logger.debug('Getting crypto funding rates');
    return await this.cryptoService.getFundingRates();
  }

  @Get('liquidation-heatmap')
  async getLiquidationHeatmap() {
    this.logger.debug('Getting liquidation heatmap');
    return await this.cryptoService.getLiquidationHeatmap();
  }

  @Get('defi/protocols')
  async getDeFiProtocols() {
    this.logger.debug('Getting DeFi protocols');

    // Mock DeFi protocols data
    return [
      {
        name: 'Uniswap',
        tvl: 5200000000,
        category: 'DEX',
        chains: ['Ethereum', 'Polygon', 'Arbitrum'],
        tokens: ['UNI'],
      },
      {
        name: 'Aave',
        tvl: 8900000000,
        category: 'Lending',
        chains: ['Ethereum', 'Polygon', 'Avalanche'],
        tokens: ['AAVE'],
      },
      {
        name: 'Compound',
        tvl: 3100000000,
        category: 'Lending',
        chains: ['Ethereum'],
        tokens: ['COMP'],
      },
      {
        name: 'MakerDAO',
        tvl: 7400000000,
        category: 'CDP',
        chains: ['Ethereum'],
        tokens: ['MKR'],
      },
    ];
  }

  @Get('exchanges')
  async getSupportedExchanges() {
    this.logger.debug('Getting supported crypto exchanges');

    return [
      {
        name: 'Binance',
        type: 'CEX',
        tradingPairs: 600,
        volume24h: 15000000000,
        status: 'active',
      },
      {
        name: 'Coinbase',
        type: 'CEX',
        tradingPairs: 200,
        volume24h: 3000000000,
        status: 'active',
      },
      {
        name: 'Uniswap V3',
        type: 'DEX',
        tradingPairs: 5000,
        volume24h: 1200000000,
        status: 'active',
      },
      {
        name: 'PancakeSwap',
        type: 'DEX',
        tradingPairs: 3000,
        volume24h: 800000000,
        status: 'active',
      },
    ];
  }

  @Post(':symbol/analyze')
  async analyzeCrypto(@Param('symbol') symbol: string): Promise<{
    marketData: CryptoMarketData;
  }> {
    this.logger.debug(`Performing comprehensive analysis for ${symbol}`);

    const marketData = await this.cryptoService.getCryptoMarketData(symbol);

    return {
      marketData,
    };
  }

  @Get('market-overview')
  async getMarketOverview() {
    this.logger.debug('Getting crypto market overview');

    return {
      totalMarketCap: Math.random() * 1000000000000 + 2000000000000, // $2T-3T
      totalVolume24h: Math.random() * 100000000000 + 50000000000, // $50B-150B
      dominance: {
        BTC: Math.random() * 20 + 40, // 40-60%
        ETH: Math.random() * 10 + 15, // 15-25%
        others: Math.random() * 30 + 20, // 20-50%
      },
      fearGreedIndex: Math.floor(Math.random() * 100),
      topGainers: [
        { symbol: 'SOL', change: Math.random() * 20 + 5 },
        { symbol: 'ADA', change: Math.random() * 15 + 3 },
        { symbol: 'DOT', change: Math.random() * 25 + 8 },
      ],
      topLosers: [
        { symbol: 'DOGE', change: -(Math.random() * 15 + 2) },
        { symbol: 'SHIB', change: -(Math.random() * 20 + 5) },
        { symbol: 'LTC', change: -(Math.random() * 10 + 1) },
      ],
    };
  }
}
