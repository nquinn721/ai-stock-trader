import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from '../../entities/portfolio.entity';
import { Position } from '../../entities/position.entity';
import { Stock } from '../../entities/stock.entity';
import { Trade } from '../../entities/trade.entity';

// Portfolio Analytics Interfaces
export interface SectorAllocation {
  sector: string;
  value: number;
  percentage: number;
  positions: number;
  averageReturn: number;
  topPerformer: string;
  worstPerformer: string;
}

export interface PerformanceAttribution {
  sectorContribution: Array<{
    sector: string;
    contribution: number;
    weight: number;
    return: number;
  }>;
  positionContribution: Array<{
    symbol: string;
    contribution: number;
    weight: number;
    return: number;
  }>;
  totalReturn: number;
  alphaGeneration: number;
}

export interface RiskMetrics {
  portfolioVolatility: number;
  beta: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  valueAtRisk: number; // 95% VaR
  expectedShortfall: number; // 95% ES
  correlationMatrix: { [symbol: string]: { [symbol2: string]: number } };
  concentrationRisk: number;
  liquidityRisk: number;
}

export interface BenchmarkComparison {
  benchmark: string;
  portfolioReturn: number;
  benchmarkReturn: number;
  alpha: number;
  beta: number;
  trackingError: number;
  informationRatio: number;
  upCapture: number;
  downCapture: number;
  winRate: number;
}

export interface PortfolioAnalytics {
  portfolioId: number;
  timestamp: string;
  totalValue: number;
  performanceSummary: {
    totalReturn: number;
    dayReturn: number;
    weekReturn: number;
    monthReturn: number;
    yearReturn: number;
    annualizedReturn: number;
    volatility: number;
    sharpeRatio: number;
  };
  sectorAllocation: SectorAllocation[];
  performanceAttribution: PerformanceAttribution;
  riskMetrics: RiskMetrics;
  benchmarkComparison: BenchmarkComparison[];
  topHoldings: Array<{
    symbol: string;
    weight: number;
    value: number;
    return: number;
    contribution: number;
  }>;
  rebalancingSuggestions: Array<{
    action: 'reduce' | 'increase' | 'add' | 'remove';
    symbol: string;
    currentWeight: number;
    targetWeight: number;
    reasoning: string;
  }>;
}

@Injectable()
export class PortfolioAnalyticsService {
  constructor(
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(Position)
    private positionRepository: Repository<Position>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    @InjectRepository(Trade)
    private tradeRepository: Repository<Trade>,
  ) {}

  /**
   * Generate comprehensive portfolio analytics
   */
  async generatePortfolioAnalytics(
    portfolioId: number,
  ): Promise<PortfolioAnalytics> {
    try {
      const portfolio = await this.portfolioRepository.findOne({
        where: { id: portfolioId },
        relations: ['positions', 'trades'],
      });

      if (!portfolio) {
        throw new Error(`Portfolio ${portfolioId} not found`);
      }

      // Get all stocks for sector mapping
      const stocks = await this.stockRepository.find();
      const stockMap = new Map(stocks.map((s) => [s.symbol, s]));

      // Calculate performance summary
      const performanceSummary =
        await this.calculatePerformanceSummary(portfolio);

      // Calculate sector allocation
      const sectorAllocation = await this.calculateSectorAllocation(
        portfolio,
        stockMap,
      );

      // Calculate performance attribution
      const performanceAttribution = await this.calculatePerformanceAttribution(
        portfolio,
        stockMap,
      );

      // Calculate risk metrics
      const riskMetrics = await this.calculateRiskMetrics(portfolio, stockMap);

      // Compare to benchmarks
      const benchmarkComparison =
        await this.calculateBenchmarkComparison(portfolio);

      // Get top holdings
      const topHoldings = await this.getTopHoldings(portfolio);

      // Generate rebalancing suggestions
      const rebalancingSuggestions = await this.generateRebalancingSuggestions(
        portfolio,
        sectorAllocation,
        riskMetrics,
      );

      return {
        portfolioId,
        timestamp: new Date().toISOString(),
        totalValue: Number(portfolio.totalValue),
        performanceSummary,
        sectorAllocation,
        performanceAttribution,
        riskMetrics,
        benchmarkComparison,
        topHoldings,
        rebalancingSuggestions,
      };
    } catch (error) {
      console.error('Error generating portfolio analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate performance summary
   */
  private async calculatePerformanceSummary(
    portfolio: Portfolio,
  ): Promise<PortfolioAnalytics['performanceSummary']> {
    const totalReturn = Number(portfolio.totalReturn);

    // Calculate time-based returns (simplified for MVP)
    const dayReturn = await this.calculatePeriodReturn(portfolio, 1);
    const weekReturn = await this.calculatePeriodReturn(portfolio, 7);
    const monthReturn = await this.calculatePeriodReturn(portfolio, 30);
    const yearReturn = await this.calculatePeriodReturn(portfolio, 365);

    // Calculate annualized return
    const daysSinceInception = Math.max(
      1,
      this.getDaysSinceInception(portfolio),
    );
    const annualizedReturn =
      Math.pow(1 + totalReturn / 100, 365 / daysSinceInception) - 1;

    // Calculate volatility (simplified)
    const volatility = await this.calculatePortfolioVolatility(portfolio);

    // Calculate Sharpe ratio (assuming 2% risk-free rate)
    const riskFreeRate = 0.02;
    const sharpeRatio =
      volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0;

    return {
      totalReturn,
      dayReturn,
      weekReturn,
      monthReturn,
      yearReturn,
      annualizedReturn: annualizedReturn * 100,
      volatility: volatility * 100,
      sharpeRatio,
    };
  }

  /**
   * Calculate sector allocation
   */
  private async calculateSectorAllocation(
    portfolio: Portfolio,
    stockMap: Map<string, Stock>,
  ): Promise<SectorAllocation[]> {
    const sectorMap = new Map<
      string,
      {
        value: number;
        positions: string[];
        returns: number[];
      }
    >();

    const totalValue = Number(portfolio.totalValue);

    // Group positions by sector
    for (const position of portfolio.positions || []) {
      const stock = stockMap.get(position.symbol);
      const sector = stock?.sector || 'Unknown';
      const value = Number(position.currentValue || position.totalCost);
      const returnPct = Number(position.unrealizedReturn || 0);

      if (!sectorMap.has(sector)) {
        sectorMap.set(sector, { value: 0, positions: [], returns: [] });
      }

      const sectorData = sectorMap.get(sector)!;
      sectorData.value += value;
      sectorData.positions.push(position.symbol);
      sectorData.returns.push(returnPct);
    }

    // Convert to sector allocation array
    const sectorAllocation: SectorAllocation[] = [];

    for (const [sector, data] of sectorMap.entries()) {
      const percentage = totalValue > 0 ? (data.value / totalValue) * 100 : 0;
      const averageReturn =
        data.returns.length > 0
          ? data.returns.reduce((sum, ret) => sum + ret, 0) /
            data.returns.length
          : 0;

      // Find best and worst performers in sector
      let topPerformer = '';
      let worstPerformer = '';
      let bestReturn = -Infinity;
      let worstReturn = Infinity;

      data.positions.forEach((symbol, idx) => {
        const ret = data.returns[idx];
        if (ret > bestReturn) {
          bestReturn = ret;
          topPerformer = symbol;
        }
        if (ret < worstReturn) {
          worstReturn = ret;
          worstPerformer = symbol;
        }
      });

      sectorAllocation.push({
        sector,
        value: data.value,
        percentage,
        positions: data.positions.length,
        averageReturn,
        topPerformer,
        worstPerformer,
      });
    }

    return sectorAllocation.sort((a, b) => b.value - a.value);
  }

  /**
   * Calculate performance attribution
   */
  private async calculatePerformanceAttribution(
    portfolio: Portfolio,
    stockMap: Map<string, Stock>,
  ): Promise<PerformanceAttribution> {
    const totalValue = Number(portfolio.totalValue);
    const totalReturn = Number(portfolio.totalReturn);

    // Calculate sector contribution
    const sectorContribution: PerformanceAttribution['sectorContribution'] = [];
    const sectorMap = new Map<
      string,
      { weight: number; return: number; value: number }
    >();

    // Group by sector
    for (const position of portfolio.positions || []) {
      const stock = stockMap.get(position.symbol);
      const sector = stock?.sector || 'Unknown';
      const value = Number(position.currentValue || position.totalCost);
      const weight = totalValue > 0 ? value / totalValue : 0;
      const returnPct = Number(position.unrealizedReturn || 0);

      if (!sectorMap.has(sector)) {
        sectorMap.set(sector, { weight: 0, return: 0, value: 0 });
      }

      const sectorData = sectorMap.get(sector)!;
      sectorData.weight += weight;
      sectorData.return += returnPct * weight;
      sectorData.value += value;
    }

    // Calculate sector contributions
    for (const [sector, data] of sectorMap.entries()) {
      const avgReturn = data.weight > 0 ? data.return / data.weight : 0;
      const contribution = data.weight * avgReturn;

      sectorContribution.push({
        sector,
        contribution,
        weight: data.weight,
        return: avgReturn,
      });
    }

    // Calculate position contribution
    const positionContribution: PerformanceAttribution['positionContribution'] =
      [];

    for (const position of portfolio.positions || []) {
      const value = Number(position.currentValue || position.totalCost);
      const weight = totalValue > 0 ? value / totalValue : 0;
      const returnPct = Number(position.unrealizedReturn || 0);
      const contribution = weight * returnPct;

      positionContribution.push({
        symbol: position.symbol,
        contribution,
        weight,
        return: returnPct,
      });
    }

    // Sort by contribution
    sectorContribution.sort((a, b) => b.contribution - a.contribution);
    positionContribution.sort((a, b) => b.contribution - a.contribution);

    // Calculate alpha (simplified)
    const marketReturn = 8; // Assume 8% market return for alpha calculation
    const alphaGeneration = totalReturn - marketReturn;

    return {
      sectorContribution,
      positionContribution,
      totalReturn,
      alphaGeneration,
    };
  }

  /**
   * Calculate risk metrics
   */
  private async calculateRiskMetrics(
    portfolio: Portfolio,
    stockMap: Map<string, Stock>,
  ): Promise<RiskMetrics> {
    // Portfolio volatility
    const portfolioVolatility =
      await this.calculatePortfolioVolatility(portfolio);

    // Beta calculation (simplified - assume market beta of 1.0 for now)
    const beta = 1.0;

    // Sharpe ratio
    const riskFreeRate = 0.02;
    const portfolioReturn = Number(portfolio.totalReturn) / 100;
    const sharpeRatio =
      portfolioVolatility > 0
        ? (portfolioReturn - riskFreeRate) / portfolioVolatility
        : 0;

    // Sortino ratio (simplified - using same volatility for downside)
    const sortinoRatio =
      portfolioVolatility > 0
        ? (portfolioReturn - riskFreeRate) / (portfolioVolatility * 0.7)
        : 0;

    // Max drawdown (simplified calculation)
    const maxDrawdown = await this.calculateMaxDrawdown(portfolio);

    // Value at Risk (95% confidence)
    const valueAtRisk =
      portfolioVolatility * 1.65 * Number(portfolio.totalValue);

    // Expected Shortfall (95% confidence)
    const expectedShortfall = valueAtRisk * 1.3;

    // Correlation matrix (simplified)
    const correlationMatrix = await this.calculateCorrelationMatrix(portfolio);

    // Concentration risk (Herfindahl Index)
    const concentrationRisk = this.calculateConcentrationRisk(portfolio);

    // Liquidity risk (simplified)
    const liquidityRisk = 0.1; // Assume 10% liquidity risk

    return {
      portfolioVolatility,
      beta,
      sharpeRatio,
      sortinoRatio,
      maxDrawdown,
      valueAtRisk,
      expectedShortfall,
      correlationMatrix,
      concentrationRisk,
      liquidityRisk,
    };
  }

  /**
   * Calculate benchmark comparison
   */
  private async calculateBenchmarkComparison(
    portfolio: Portfolio,
  ): Promise<BenchmarkComparison[]> {
    const portfolioReturn = Number(portfolio.totalReturn);

    // Simplified benchmark comparisons
    const benchmarks = [
      { name: 'S&P 500', return: 8.5 },
      { name: 'NASDAQ', return: 10.2 },
      { name: 'Russell 2000', return: 7.8 },
    ];

    return benchmarks.map((benchmark) => {
      const alpha = portfolioReturn - benchmark.return;
      const beta = 1.0; // Simplified
      const trackingError = Math.abs(alpha) * 0.5; // Simplified
      const informationRatio = trackingError > 0 ? alpha / trackingError : 0;

      return {
        benchmark: benchmark.name,
        portfolioReturn,
        benchmarkReturn: benchmark.return,
        alpha,
        beta,
        trackingError,
        informationRatio,
        upCapture: 0.95, // Simplified
        downCapture: 0.85, // Simplified
        winRate: portfolioReturn > benchmark.return ? 1 : 0,
      };
    });
  }

  /**
   * Get top holdings
   */
  private async getTopHoldings(
    portfolio: Portfolio,
  ): Promise<PortfolioAnalytics['topHoldings']> {
    const totalValue = Number(portfolio.totalValue);
    const positions = portfolio.positions || [];

    return positions
      .map((position) => {
        const value = Number(position.currentValue || position.totalCost);
        const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;
        const returnPct = Number(position.unrealizedReturn || 0);
        const contribution = (weight / 100) * returnPct;

        return {
          symbol: position.symbol,
          weight,
          value,
          return: returnPct,
          contribution,
        };
      })
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10); // Top 10 holdings
  }

  /**
   * Generate rebalancing suggestions
   */
  private async generateRebalancingSuggestions(
    portfolio: Portfolio,
    sectorAllocation: SectorAllocation[],
    riskMetrics: RiskMetrics,
  ): Promise<PortfolioAnalytics['rebalancingSuggestions']> {
    const suggestions: PortfolioAnalytics['rebalancingSuggestions'] = [];
    const totalValue = Number(portfolio.totalValue);

    // Check for overconcentration
    for (const position of portfolio.positions || []) {
      const value = Number(position.currentValue || position.totalCost);
      const weight = totalValue > 0 ? (value / totalValue) * 100 : 0;

      if (weight > 20) {
        suggestions.push({
          action: 'reduce',
          symbol: position.symbol,
          currentWeight: weight,
          targetWeight: 15,
          reasoning: 'Position exceeds 20% concentration limit',
        });
      }
    }

    // Check for sector overconcentration
    for (const sector of sectorAllocation) {
      if (sector.percentage > 30) {
        // Find the largest position in this overweight sector
        const largestPosition = portfolio.positions
          ?.filter((p) => {
            // This is simplified - in production you'd check actual sector mapping
            return true;
          })
          .sort(
            (a, b) =>
              Number(b.currentValue || b.totalCost) -
              Number(a.currentValue || a.totalCost),
          )[0];

        if (largestPosition) {
          const currentWeight =
            totalValue > 0
              ? (Number(
                  largestPosition.currentValue || largestPosition.totalCost,
                ) /
                  totalValue) *
                100
              : 0;

          suggestions.push({
            action: 'reduce',
            symbol: largestPosition.symbol,
            currentWeight,
            targetWeight: currentWeight * 0.8,
            reasoning: `Reduce ${sector.sector} sector overweight (${sector.percentage.toFixed(1)}%)`,
          });
        }
      }
    }

    // Suggest diversification if portfolio is too concentrated
    if (riskMetrics.concentrationRisk > 0.3) {
      suggestions.push({
        action: 'add',
        symbol: 'Diversification',
        currentWeight: 0,
        targetWeight: 10,
        reasoning:
          'Portfolio lacks diversification - consider adding more positions',
      });
    }

    return suggestions.slice(0, 5); // Top 5 suggestions
  }

  // Helper methods
  private async calculatePeriodReturn(
    portfolio: Portfolio,
    days: number,
  ): Promise<number> {
    // Simplified calculation - in production would use historical portfolio values
    const dailyReturn =
      Number(portfolio.totalReturn) /
      Math.max(1, this.getDaysSinceInception(portfolio));
    return dailyReturn * days;
  }

  private getDaysSinceInception(portfolio: Portfolio): number {
    const now = new Date();
    const inception = new Date(portfolio.createdAt);
    return Math.max(
      1,
      Math.floor((now.getTime() - inception.getTime()) / (1000 * 60 * 60 * 24)),
    );
  }

  private async calculatePortfolioVolatility(
    portfolio: Portfolio,
  ): Promise<number> {
    // Simplified volatility calculation
    // In production, this would calculate based on historical price movements
    const positionCount = portfolio.positions?.length || 1;
    const baseVolatility = 0.15; // 15% base volatility

    // Diversification effect
    const diversificationFactor = Math.sqrt(positionCount) / positionCount;
    return baseVolatility * diversificationFactor;
  }

  private async calculateMaxDrawdown(portfolio: Portfolio): Promise<number> {
    // Simplified max drawdown calculation
    // In production, this would analyze historical portfolio values
    const volatility = await this.calculatePortfolioVolatility(portfolio);
    return volatility * 0.6; // Assume max drawdown is 60% of volatility
  }

  private async calculateCorrelationMatrix(
    portfolio: Portfolio,
  ): Promise<{ [symbol: string]: { [symbol2: string]: number } }> {
    const matrix: { [symbol: string]: { [symbol2: string]: number } } = {};

    // Simplified correlation matrix
    for (const position1 of portfolio.positions || []) {
      matrix[position1.symbol] = {};
      for (const position2 of portfolio.positions || []) {
        if (position1.symbol === position2.symbol) {
          matrix[position1.symbol][position2.symbol] = 1.0;
        } else {
          // Simplified correlation (would calculate from historical prices in production)
          matrix[position1.symbol][position2.symbol] =
            Math.random() * 0.6 + 0.2; // 0.2 to 0.8
        }
      }
    }

    return matrix;
  }

  private calculateConcentrationRisk(portfolio: Portfolio): number {
    const totalValue = Number(portfolio.totalValue);
    if (totalValue === 0) return 0;

    // Calculate Herfindahl Index
    let herfindahlIndex = 0;
    for (const position of portfolio.positions || []) {
      const weight =
        Number(position.currentValue || position.totalCost) / totalValue;
      herfindahlIndex += weight * weight;
    }

    return herfindahlIndex;
  }
}
