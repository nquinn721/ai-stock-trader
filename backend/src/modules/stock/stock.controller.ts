import { Controller, Get, Param, Query } from '@nestjs/common';
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
}
