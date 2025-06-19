import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TradingService } from './trading.service';

@ApiTags('trading')
@Controller('trading')
export class TradingController {
  constructor(private readonly tradingService: TradingService) {}

  @Get('signals')
  @ApiOperation({ summary: 'Get all active trading signals' })
  @ApiResponse({ status: 200, description: 'Active trading signals retrieved successfully' })
  async getActiveSignals() {
    return await this.tradingService.getActiveSignals();
  }

  @Get('signals/:symbol')
  @ApiOperation({ summary: 'Get trading signals for a specific stock' })
  @ApiResponse({ status: 200, description: 'Stock trading signals retrieved successfully' })
  async getSignalsForStock(
    @Param('symbol') symbol: string,
    @Query('limit') limit: string = '10',
  ) {
    return await this.tradingService.getSignalsForStock(symbol, parseInt(limit));
  }

  @Post('analyze/:symbol')
  @ApiOperation({ summary: 'Generate new trading signal for a stock' })
  @ApiResponse({ status: 201, description: 'Trading signal generated successfully' })
  async analyzeStock(@Param('symbol') symbol: string) {
    const signal = await this.tradingService.generateTradingSignal(symbol);
    const breakoutAnalysis = await this.tradingService.detectBreakout(symbol);
    
    return {
      signal,
      breakoutAnalysis,
    };
  }

  @Post('analyze-all')
  @ApiOperation({ summary: 'Analyze all stocks and generate trading signals' })
  @ApiResponse({ status: 201, description: 'All stocks analyzed successfully' })
  async analyzeAllStocks() {
    const signals = await this.tradingService.analyzeAllStocks();
    return {
      totalSignals: signals.length,
      signals,
    };
  }

  @Get('breakout/:symbol')
  @ApiOperation({ summary: 'Check breakout status for a specific stock' })
  @ApiResponse({ status: 200, description: 'Breakout analysis retrieved successfully' })
  async checkBreakout(@Param('symbol') symbol: string) {
    return await this.tradingService.detectBreakout(symbol);
  }
}
