import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Portfolio } from '../../entities/portfolio.entity';
import { Trade } from '../../entities/trade.entity';
import {
  CreatePortfolioDto,
  CreateTradeDto,
  PaperTradingService,
} from './paper-trading.service';

@ApiTags('paper-trading')
@Controller('paper-trading')
export class PaperTradingController {
  constructor(private readonly paperTradingService: PaperTradingService) {}

  @Post('portfolios')
  @ApiOperation({ summary: 'Create a new portfolio' })
  @ApiResponse({ status: 201, description: 'Portfolio created successfully' })
  async createPortfolio(
    @Body() createPortfolioDto: CreatePortfolioDto,
  ): Promise<Portfolio> {
    return this.paperTradingService.createPortfolio(createPortfolioDto);
  }

  @Get('portfolios')
  @ApiOperation({ summary: 'Get all portfolios' })
  @ApiResponse({ status: 200, description: 'List of all portfolios' })
  async getPortfolios(): Promise<Portfolio[]> {
    return this.paperTradingService.getPortfolios();
  }

  @Get('portfolios/:id')
  @ApiOperation({ summary: 'Get portfolio by ID' })
  @ApiResponse({ status: 200, description: 'Portfolio details' })
  async getPortfolio(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Portfolio> {
    return this.paperTradingService.getPortfolio(id);
  }

  @Delete('portfolios/:id')
  @ApiOperation({ summary: 'Delete portfolio' })
  @ApiResponse({ status: 200, description: 'Portfolio deleted successfully' })
  async deletePortfolio(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.paperTradingService.deletePortfolio(id);
  }

  @Post('trade')
  @ApiOperation({ summary: 'Execute a paper trade' })
  @ApiResponse({ status: 201, description: 'Trade executed successfully' })
  async executeTrade(@Body() createTradeDto: CreateTradeDto): Promise<Trade> {
    return this.paperTradingService.executeTrade(createTradeDto);
  }

  @Get('portfolios/:id/performance')
  @ApiOperation({ summary: 'Get portfolio performance data' })
  @ApiResponse({ status: 200, description: 'Portfolio performance data' })
  async getPortfolioPerformance(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<any> {
    return this.paperTradingService.getPortfolioPerformance(id);
  }
}
