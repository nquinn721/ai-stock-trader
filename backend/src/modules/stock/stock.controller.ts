import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Stock } from '../../entities/stock.entity';
import { StockService } from './stock.service';

@ApiTags('stocks')
@Controller('stocks')
export class StockController {
  constructor(private readonly stockService: StockService) {}
  @Get()
  @ApiOperation({ summary: 'Get all stocks with sentiment and signals' })
  @ApiResponse({
    status: 200,
    description: 'List of all stocks with enriched data',
  })
  async getAllStocks(): Promise<
    (Stock & {
      tradingSignal?: any;
      breakoutStrategy?: any;
      sentiment?: any;
      recentNews?: any[];
    })[]
  > {
    return this.stockService.getAllStocks();
  }
  @Get(':symbol')
  @ApiOperation({ summary: 'Get stock by symbol' })
  @ApiResponse({ status: 200, description: 'Stock details' })
  async getStockBySymbol(
    @Param('symbol') symbol: string,
  ): Promise<Stock | null> {
    return this.stockService.getStockBySymbol(symbol.toUpperCase());
  }

  @Get(':symbol/history')
  @ApiOperation({ summary: 'Get stock price history' })
  @ApiResponse({ status: 200, description: 'Stock price history' })
  async getStockHistory(
    @Param('symbol') symbol: string,
    @Query('period') period: string = '1mo',
  ): Promise<any> {
    return this.stockService.getStockHistory(symbol.toUpperCase(), period);
  }

  @Get('with-signals/all')
  @ApiOperation({ summary: 'Get all stocks with their latest trading signals' })
  @ApiResponse({
    status: 200,
    description: 'List of all stocks with trading signals',
  })
  async getAllStocksWithSignals() {
    return this.stockService.getAllStocksWithSignals();
  }

  @Get('fast/all')
  @ApiOperation({
    summary: 'Get all stocks with live prices only (fast response)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all stocks with current prices, optimized for speed',
  })
  async getAllStocksFast() {
    return this.stockService.getAllStocksFast();
  }

  @Get('signals/batch')
  @ApiOperation({
    summary: 'Get trading signals for all stocks (async calculation)',
  })
  @ApiResponse({
    status: 200,
    description: 'Trading signals for all stocks',
  })
  async getBatchSignals() {
    return this.stockService.getBatchSignals();
  }

  @Get(':symbol/update')
  @ApiOperation({ summary: 'Update stock price' })
  @ApiResponse({ status: 200, description: 'Updated stock data' })
  async updateStockPrice(
    @Param('symbol') symbol: string,
  ): Promise<Stock | null> {
    return this.stockService.updateStockPrice(symbol.toUpperCase());
  }

  @Get(':symbol/patterns')
  @ApiOperation({ summary: 'Get pattern recognition analysis for a stock' })
  @ApiResponse({
    status: 200,
    description:
      'Pattern recognition analysis including candlestick and chart patterns',
  })
  async getPatternAnalysis(@Param('symbol') symbol: string): Promise<any> {
    return this.stockService.getPatternAnalysis(symbol.toUpperCase());
  }

  @Post(':symbol/favorite')
  @ApiOperation({ summary: 'Toggle favorite status for a stock' })
  @ApiResponse({
    status: 200,
    description: 'Updated stock with favorite status',
  })
  async toggleFavorite(@Param('symbol') symbol: string): Promise<Stock | null> {
    return this.stockService.toggleFavorite(symbol.toUpperCase());
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed database with initial stock data' })
  @ApiResponse({ status: 200, description: 'Database seeded successfully' })
  async seedDatabase(): Promise<{ message: string; count: number }> {
    return this.stockService.seedDatabase();
  }
}
