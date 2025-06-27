import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Logger,
} from '@nestjs/common';
import { AutonomousTradingService } from './autonomous-trading.service';
import { CreateStrategyDto } from './services/strategy-builder.service';
import { BacktestRequest } from './services/backtesting-engine.service';
import { StartExecutionRequest } from './services/autonomous-execution.service';

@Controller('autonomous-trading')
export class AutonomousTradingController {
  private readonly logger = new Logger(AutonomousTradingController.name);

  constructor(
    private readonly autonomousTradingService: AutonomousTradingService,
  ) {}

  // Strategy Management Endpoints

  @Post('strategies')
  async createStrategy(@Body() createDto: CreateStrategyDto) {
    this.logger.log(`Creating strategy: ${createDto.name}`);
    return this.autonomousTradingService.createStrategy(createDto);
  }

  @Get('strategies/templates')
  async getStrategyTemplates() {
    return this.autonomousTradingService.getStrategyTemplates();
  }

  @Post('strategies/from-template')
  async createFromTemplate(@Body() body: {
    templateId: string;
    userId: string;
    portfolioId: string;
    customName?: string;
  }) {
    return this.autonomousTradingService.createFromTemplate(
      body.templateId,
      body.userId,
      body.portfolioId,
      body.customName,
    );
  }

  @Get('strategies/user/:userId')
  async getUserStrategies(@Param('userId') userId: string) {
    return this.autonomousTradingService.getUserStrategies(userId);
  }

  @Get('strategies/:id')
  async getStrategy(@Param('id') id: string) {
    const strategy = await this.autonomousTradingService.getStrategy(id);
    if (!strategy) {
      throw new Error('Strategy not found');
    }
    return strategy;
  }

  @Put('strategies/:id')
  async updateStrategy(
    @Param('id') id: string,
    @Body() updates: any,
  ) {
    return this.autonomousTradingService.updateStrategy(id, updates);
  }

  @Delete('strategies/:id')
  async deleteStrategy(@Param('id') id: string) {
    await this.autonomousTradingService.deleteStrategy(id);
    return { message: 'Strategy deleted successfully' };
  }

  @Post('strategies/:id/validate')
  async validateStrategy(@Param('id') id: string) {
    return this.autonomousTradingService.validateStrategy(id);
  }

  // Backtesting Endpoints

  @Post('backtests')
  async startBacktest(@Body() request: BacktestRequest) {
    this.logger.log(`Starting backtest: ${request.name}`);
    return this.autonomousTradingService.startBacktest(request);
  }

  @Get('backtests/:id')
  async getBacktest(@Param('id') id: string) {
    const backtest = await this.autonomousTradingService.getBacktest(id);
    if (!backtest) {
      throw new Error('Backtest not found');
    }
    return backtest;
  }

  @Get('strategies/:id/backtests')
  async getStrategyBacktests(@Param('id') strategyId: string) {
    return this.autonomousTradingService.getStrategyBacktests(strategyId);
  }

  @Post('backtests/:id/cancel')
  async cancelBacktest(@Param('id') id: string) {
    await this.autonomousTradingService.cancelBacktest(id);
    return { message: 'Backtest cancelled successfully' };
  }

  // Execution Endpoints

  @Post('executions')
  async startExecution(@Body() request: StartExecutionRequest) {
    this.logger.log(`Starting execution for strategy: ${request.strategyId}`);
    return this.autonomousTradingService.startExecution(request);
  }

  @Post('executions/:id/stop')
  async stopExecution(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    await this.autonomousTradingService.stopExecution(id, body.reason);
    return { message: 'Execution stopped successfully' };
  }

  @Post('executions/:id/pause')
  async pauseExecution(@Param('id') id: string) {
    await this.autonomousTradingService.pauseExecution(id);
    return { message: 'Execution paused successfully' };
  }

  @Post('executions/:id/resume')
  async resumeExecution(@Param('id') id: string) {
    await this.autonomousTradingService.resumeExecution(id);
    return { message: 'Execution resumed successfully' };
  }

  @Get('executions/:id')
  async getExecution(@Param('id') id: string) {
    const execution = await this.autonomousTradingService.getExecution(id);
    if (!execution) {
      throw new Error('Execution not found');
    }
    return execution;
  }

  @Get('executions')
  async getActiveExecutions() {
    return this.autonomousTradingService.getActiveExecutions();
  }

  @Get('portfolios/:id/executions')
  async getPortfolioExecutions(@Param('id') portfolioId: string) {
    return this.autonomousTradingService.getPortfolioExecutions(portfolioId);
  }

  // Analytics Endpoints

  @Get('strategies/:id/performance')
  async getStrategyPerformance(@Param('id') strategyId: string) {
    return this.autonomousTradingService.getStrategyPerformance(strategyId);
  }

  @Get('dashboard/:userId')
  async getDashboardData(@Param('userId') userId: string) {
    return this.autonomousTradingService.getDashboardData(userId);
  }

  // Health Check
  @Get('health')
  async healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'autonomous-trading',
    };
  }
}