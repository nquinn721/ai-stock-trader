import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { QuantumOptimizationService } from './services/quantum-optimization.service';
import { QuantumSimulationService } from './services/quantum-simulation.service';
import { HybridQuantumClassicalService } from './services/hybrid-quantum-classical.service';

export interface PortfolioOptimizationRequest {
  assets: Asset[];
  constraints: OptimizationConstraints;
  objectives: Objective[];
  quantumParams?: any;
}

export interface Asset {
  symbol: string;
  expectedReturn: number;
  volatility: number;
  currentPrice: number;
  marketCap?: number;
  sector?: string;
}

export interface OptimizationConstraints {
  maxWeight: number;
  minWeight: number;
  maxSectorWeight?: number;
  riskBudget?: number;
  turnoverLimit?: number;
}

export interface Objective {
  type: 'maximize_return' | 'minimize_risk' | 'maximize_sharpe';
  weight: number;
  target?: number;
}

export interface MarketSimulationRequest {
  scenarios: ScenarioDefinition[];
  timeHorizon: number;
  portfolio: Portfolio;
}

export interface ScenarioDefinition {
  name: string;
  probability: number;
  marketShock: number;
  correlationShift: number;
}

export interface Portfolio {
  positions: Position[];
  totalValue: number;
  currency: string;
}

export interface Position {
  symbol: string;
  quantity: number;
  weight: number;
  currentValue: number;
}

@ApiTags('quantum')
@Controller('quantum')
export class QuantumController {
  constructor(
    private readonly quantumOptimizationService: QuantumOptimizationService,
    private readonly quantumSimulationService: QuantumSimulationService,
    private readonly hybridService: HybridQuantumClassicalService,
  ) {}

  @Post('optimize/portfolio')
  @ApiOperation({ summary: 'Optimize portfolio using quantum algorithms' })
  @ApiResponse({
    status: 200,
    description: 'Portfolio optimized successfully using quantum methods',
  })
  @ApiBody({ type: Object })
  async optimizePortfolio(@Body() request: PortfolioOptimizationRequest) {
    return await this.quantumOptimizationService.optimizePortfolioQuantum(
      request.assets,
      request.constraints,
      request.objectives,
    );
  }

  @Post('optimize/qubo')
  @ApiOperation({ summary: 'Solve QUBO problem using quantum annealing' })
  @ApiResponse({
    status: 200,
    description: 'QUBO problem solved successfully',
  })
  async solveQUBO(@Body() request: any) {
    return await this.quantumOptimizationService.solveQUBO(
      request.problem,
      request.params,
    );
  }

  @Post('simulate/vqe')
  @ApiOperation({ summary: 'Execute Variational Quantum Eigensolver' })
  @ApiResponse({
    status: 200,
    description: 'VQE executed successfully',
  })
  async executeVQE(@Body() request: any) {
    return await this.quantumOptimizationService.executeVQE(
      request.hamiltonian,
      request.ansatz,
    );
  }

  @Post('simulate/market')
  @ApiOperation({ summary: 'Run quantum market simulation' })
  @ApiResponse({
    status: 200,
    description: 'Market simulation completed successfully',
  })
  async simulateMarket(@Body() request: MarketSimulationRequest) {
    return await this.quantumSimulationService.simulateMarketQuantum(
      request.scenarios,
      request.timeHorizon,
    );
  }

  @Post('risk/var')
  @ApiOperation({ summary: 'Calculate quantum Value at Risk' })
  @ApiResponse({
    status: 200,
    description: 'Quantum VaR calculated successfully',
  })
  async calculateQuantumVaR(
    @Body() request: { portfolio: Portfolio; confidenceLevel: number },
  ) {
    return await this.quantumSimulationService.calculateQuantumVaR(
      request.portfolio,
      request.confidenceLevel,
    );
  }

  @Get('correlations/:symbols')
  @ApiOperation({ summary: 'Analyze quantum correlations between assets' })
  @ApiResponse({
    status: 200,
    description: 'Quantum correlation analysis completed',
  })
  async analyzeQuantumCorrelations(
    @Param('symbols') symbols: string,
    @Query('timeframe') timeframe: string = '1M',
  ) {
    const assetSymbols = symbols.split(',');
    const assets = assetSymbols.map(symbol => ({ symbol } as Asset));
    
    return await this.quantumSimulationService.analyzeQuantumCorrelations(
      assets,
      timeframe,
    );
  }

  @Post('hybrid/optimize')
  @ApiOperation({ summary: 'Run hybrid classical-quantum optimization' })
  @ApiResponse({
    status: 200,
    description: 'Hybrid optimization completed successfully',
  })
  async hybridOptimization(@Body() request: any) {
    return await this.hybridService.hybridPortfolioOptimization(
      request.classicalSolution,
      request.quantumEnhancement,
    );
  }

  @Post('benchmark')
  @ApiOperation({ summary: 'Benchmark quantum vs classical performance' })
  @ApiResponse({
    status: 200,
    description: 'Performance benchmark completed',
  })
  async benchmarkQuantumVsClassical(@Body() request: any) {
    return await this.hybridService.benchmarkQuantumVsClassical(
      request.problem,
    );
  }

  @Get('advantage/:problemSize')
  @ApiOperation({ summary: 'Assess quantum advantage for problem size' })
  @ApiResponse({
    status: 200,
    description: 'Quantum advantage assessment completed',
  })
  async assessQuantumAdvantage(
    @Param('problemSize') problemSize: string,
    @Query('complexity') complexity?: string,
  ) {
    const complexityMetrics = complexity ? JSON.parse(complexity) : {};
    
    return await this.hybridService.assessQuantumAdvantage(
      parseInt(problemSize),
      complexityMetrics,
    );
  }
}
