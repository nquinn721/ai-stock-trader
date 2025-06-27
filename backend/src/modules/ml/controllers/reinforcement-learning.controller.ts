import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReinforcementLearningService } from '../services/reinforcement-learning.service';

export class TrainAgentDto {
  symbol: string;
  historicalDataDays?: number;
  config?: {
    learningRate?: number;
    memorySize?: number;
    batchSize?: number;
    epsilon?: number;
    epsilonMin?: number;
    epsilonDecay?: number;
    gamma?: number;
    targetUpdateFreq?: number;
  };
}

export class DeployAgentDto {
  agentId: string;
  portfolioId: string;
  riskLimits?: {
    maxPositionSize?: number;
    maxDrawdown?: number;
    stopLoss?: number;
    riskPerTrade?: number;
  };
}

export class UpdateAgentDto {
  state: {
    prices: number[];
    volumes: number[];
    technicalIndicators: number[];
    portfolioState: number[];
    riskMetrics: number[];
    marketRegime: number;
  };
  action: number;
  reward: number;
  nextState: {
    prices: number[];
    volumes: number[];
    technicalIndicators: number[];
    portfolioState: number[];
    riskMetrics: number[];
    marketRegime: number;
  };
  done: boolean;
}

@ApiTags('Reinforcement Learning')
@Controller('reinforcement-learning')
export class ReinforcementLearningController {
  constructor(
    private readonly reinforcementLearningService: ReinforcementLearningService,
  ) {}

  @Post('train')
  @ApiOperation({ summary: 'Train a new DQN trading agent' })
  @ApiResponse({
    status: 201,
    description: 'Agent training started successfully',
  })
  async trainAgent(@Body() trainAgentDto: TrainAgentDto): Promise<any> {
    // In a real implementation, you would fetch historical data
    // For now, we'll simulate it
    const simulatedHistoricalData = this.generateSimulatedData(
      trainAgentDto.historicalDataDays || 252,
    );

    return await this.reinforcementLearningService.trainAgent(
      trainAgentDto.symbol,
      simulatedHistoricalData,
      trainAgentDto.config,
    );
  }

  @Post('deploy')
  @ApiOperation({ summary: 'Deploy a trained agent for live trading' })
  @ApiResponse({
    status: 201,
    description: 'Agent deployed successfully',
  })
  async deployAgent(@Body() deployAgentDto: DeployAgentDto) {
    await this.reinforcementLearningService.deployAgent(
      deployAgentDto.agentId,
      deployAgentDto.portfolioId,
      deployAgentDto.riskLimits,
    );

    return {
      message: `Agent ${deployAgentDto.agentId} deployed to portfolio ${deployAgentDto.portfolioId}`,
      timestamp: new Date(),
    };
  }

  @Post('decision/:portfolioId')
  @ApiOperation({ summary: 'Get trading decision from deployed agent' })
  @ApiResponse({
    status: 200,
    description: 'Trading decision generated successfully',
  })
  async getTradingDecision(
    @Param('portfolioId') portfolioId: string,
    @Body() marketState: any,
  ) {
    return await this.reinforcementLearningService.getTradingDecision(
      portfolioId,
      {
        ...marketState,
        timestamp: new Date(),
      },
    );
  }

  @Post('update/:portfolioId')
  @ApiOperation({ summary: 'Update agent with trading outcome for learning' })
  @ApiResponse({
    status: 200,
    description: 'Agent updated successfully',
  })
  async updateAgent(
    @Param('portfolioId') portfolioId: string,
    @Body() updateData: UpdateAgentDto,
  ) {
    await this.reinforcementLearningService.updateAgentFromOutcome(
      portfolioId,
      { ...updateData.state, timestamp: new Date() },
      updateData.action,
      updateData.reward,
      { ...updateData.nextState, timestamp: new Date() },
      updateData.done,
    );

    return {
      message: 'Agent updated successfully',
      timestamp: new Date(),
    };
  }

  @Get('performance/:agentId')
  @ApiOperation({ summary: 'Get agent performance metrics' })
  @ApiResponse({
    status: 200,
    description: 'Performance metrics retrieved successfully',
  })
  async getAgentPerformance(@Param('agentId') agentId: string): Promise<any> {
    return await this.reinforcementLearningService.getAgentPerformance(agentId);
  }

  @Get('agents')
  @ApiOperation({ summary: 'Get all active agents' })
  @ApiResponse({
    status: 200,
    description: 'Active agents retrieved successfully',
  })
  async getActiveAgents(): Promise<any[]> {
    return await this.reinforcementLearningService.getActiveAgents();
  }

  @Put('toggle/:portfolioId')
  @ApiOperation({ summary: 'Pause/resume agent trading' })
  @ApiResponse({
    status: 200,
    description: 'Agent status updated successfully',
  })
  async toggleAgent(
    @Param('portfolioId') portfolioId: string,
    @Query('active') isActive: string,
  ) {
    const active = isActive === 'true';
    await this.reinforcementLearningService.toggleAgent(portfolioId, active);

    return {
      message: `Agent for portfolio ${portfolioId} ${active ? 'resumed' : 'paused'}`,
      timestamp: new Date(),
    };
  }

  @Delete('stop/:portfolioId')
  @ApiOperation({ summary: 'Stop and remove agent deployment' })
  @ApiResponse({
    status: 200,
    description: 'Agent stopped successfully',
  })
  async stopAgent(@Param('portfolioId') portfolioId: string) {
    await this.reinforcementLearningService.stopAgent(portfolioId);

    return {
      message: `Agent for portfolio ${portfolioId} stopped`,
      timestamp: new Date(),
    };
  }

  @Get('agents/status')
  @ApiOperation({ summary: 'Get comprehensive RL system status' })
  @ApiResponse({
    status: 200,
    description: 'RL system status retrieved successfully',
  })
  async getSystemStatus() {
    const activeAgents =
      await this.reinforcementLearningService.getActiveAgents();

    return {
      totalAgents: activeAgents.length,
      activeDeployments: activeAgents.filter(
        (a) => a.learningProgress?.episode > 0,
      ).length,
      averagePerformance:
        activeAgents.reduce((acc, agent) => acc + agent.totalReturns, 0) /
        Math.max(activeAgents.length, 1),
      systemHealth: 'operational',
      timestamp: new Date(),
      agents: activeAgents.map((agent) => ({
        id: agent.agentId,
        returns: agent.totalReturns,
        sharpeRatio: agent.sharpeRatio,
        winRate: agent.winRate,
        tradesExecuted: agent.tradesExecuted,
        learningProgress: agent.learningProgress,
      })),
    };
  }

  /**
   * Generate simulated historical data for training
   * In production, this would be replaced with real historical data
   */
  private generateSimulatedData(days: number): any[] {
    const data: any[] = [];
    let price = 100;

    for (let i = 0; i < days; i++) {
      // Simple random walk with trend
      const change = (Math.random() - 0.48) * 2; // Slight upward bias
      price = Math.max(10, price + change);

      data.push({
        close: price,
        volume: Math.floor(Math.random() * 1000000) + 100000,
        timestamp: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000),
      });
    }

    return data;
  }
}
