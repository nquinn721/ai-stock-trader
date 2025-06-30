import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StockWebSocketGateway } from '../websocket/websocket.gateway';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { CreateTradeDto, PaperTradingService } from './paper-trading.service';

@ApiTags('paper-trading')
@Controller('paper-trading')
export class PaperTradingController {
  constructor(
    private readonly paperTradingService: PaperTradingService,
    private readonly webSocketGateway: StockWebSocketGateway,
  ) {}
  @Post('portfolios')
  @ApiOperation({ summary: 'Create a new portfolio' })
  @ApiResponse({ status: 201, description: 'Portfolio created successfully' })
  async createPortfolio(
    @Body() createPortfolioDto: CreatePortfolioDto,
  ): Promise<any> {
    const portfolio =
      await this.paperTradingService.createPortfolio(createPortfolioDto);

    // Broadcast updated portfolios list to all clients
    this.webSocketGateway.broadcastAllPortfolios().catch((error) => {
      console.error('Failed to broadcast portfolio creation:', error);
    });

    return portfolio;
  }

  @Get('portfolios')
  @ApiOperation({ summary: 'Get all portfolios' })
  @ApiResponse({ status: 200, description: 'List of all portfolios' })
  async getPortfolios(): Promise<any[]> {
    try {
      console.log('📊 Fetching all portfolios...');
      const portfolios = await this.paperTradingService.getPortfolios();
      console.log(`✅ Successfully fetched ${portfolios.length} portfolios`);
      return portfolios;
    } catch (error) {
      console.error('❌ Error fetching portfolios:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });
      throw error;
    }
  }
  @Get('portfolios/:id')
  @ApiOperation({ summary: 'Get portfolio by ID' })
  @ApiResponse({ status: 200, description: 'Portfolio details' })
  async getPortfolio(@Param('id') id: string): Promise<any> {
    return this.paperTradingService.getPortfolio(id);
  }
  @Delete('portfolios/:id')
  @ApiOperation({ summary: 'Delete portfolio' })
  @ApiResponse({ status: 200, description: 'Portfolio deleted successfully' })
  async deletePortfolio(@Param('id') id: string): Promise<void> {
    await this.paperTradingService.deletePortfolio(id);

    // Broadcast updated portfolios list to all clients
    this.webSocketGateway.broadcastAllPortfolios().catch((error) => {
      console.error('Failed to broadcast portfolio deletion:', error);
    });
  }
  @Post('trade')
  @ApiOperation({ summary: 'Execute a paper trade' })
  @ApiResponse({ status: 201, description: 'Trade executed successfully' })
  async executeTrade(@Body() createTradeDto: CreateTradeDto): Promise<any> {
    const tradeResult =
      await this.paperTradingService.executeTrade(createTradeDto);

    // Broadcast updated portfolios after trade execution
    this.webSocketGateway.broadcastAllPortfolios().catch((error) => {
      console.error('Failed to broadcast portfolio update after trade:', error);
    });

    return tradeResult;
  }
  @Get('portfolios/:id/performance')
  @ApiOperation({ summary: 'Get portfolio performance data' })
  @ApiResponse({ status: 200, description: 'Portfolio performance data' })
  async getPortfolioPerformance(@Param('id') id: string): Promise<any> {
    return this.paperTradingService.getPortfolioPerformance(id);
  }

  @Get('portfolio-types')
  @ApiOperation({ summary: 'Get available portfolio types' })
  @ApiResponse({
    status: 200,
    description: 'List of available portfolio types',
  })
  async getPortfolioTypes(): Promise<any[]> {
    return this.paperTradingService.getPortfolioTypes();
  }

  @Post('portfolios/create-defaults/:userId')
  @ApiOperation({ summary: 'Create default portfolios for a user' })
  @ApiResponse({
    status: 201,
    description: 'Default portfolios created successfully',
  })
  async createDefaultPortfolios(
    @Param('userId') userId: string,
  ): Promise<any[]> {
    const portfolios =
      await this.paperTradingService.createDefaultPortfolios(userId);

    // Broadcast updated portfolios list to all clients
    this.webSocketGateway.broadcastAllPortfolios().catch((error) => {
      console.error('Failed to broadcast portfolio creation:', error);
    });

    return portfolios;
  }

  @Get('portfolios/:id/ml-analysis')
  @ApiOperation({ summary: 'Get ML-enhanced portfolio analysis' })
  @ApiResponse({
    status: 200,
    description:
      'ML-enhanced portfolio analysis with risk assessment and recommendations',
  })
  async getMLPortfolioAnalysis(@Param('id') id: string): Promise<any> {
    return this.paperTradingService.getMLPortfolioAnalysis(Number(id));
  }
}
