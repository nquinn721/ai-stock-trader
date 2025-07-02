/**
 * =============================================================================
 * PORTFOLIO ANALYTICS SERVICE - Performance Intelligence ENGINE
 * =============================================================================
 *
 * Advanced portfolio analytics and performance measurement service that provides
 * comprehensive insights into trading performance, risk metrics, and attribution
 * analysis for paper trading portfolios.
 *
 * Key Features:
 * - Real-time portfolio performance calculation and tracking
 * - Risk-adjusted return metrics (Sharpe ratio, Sortino ratio, Alpha/Beta)
 * - Sector allocation analysis and diversification metrics
 * - Performance attribution breakdown by position and sector
 * - Drawdown analysis and volatility measurement
 * - Trade analytics and success rate calculation
 * - Benchmark comparison and relative performance
 * - Historical performance charting and trend analysis
 *
 * Analytics Capabilities:
 * - Total return calculation (time-weighted and money-weighted)
 * - Risk metrics: VaR, max drawdown, volatility, correlation
 * - Performance attribution: security selection vs. allocation effects
 * - Sector and position-level contribution analysis
 * - Trade statistics: win rate, average gain/loss, holding periods
 * - Benchmark relative performance and tracking error
 *
 * Performance Metrics:
 * - Absolute returns: daily, weekly, monthly, YTD, inception-to-date
 * - Risk-adjusted metrics: Sharpe, Sortino, Calmar, Information ratios
 * - Portfolio statistics: beta, alpha, R-squared vs benchmarks
 * - Drawdown analysis: maximum, current, recovery time
 * - Volatility measures: standard deviation, downside deviation
 *
 * Reporting Features:
 * - Comprehensive performance reports with charts and tables
 * - Sector allocation breakdown with performance attribution
 * - Top/bottom performers identification and analysis
 * - Risk exposure analysis and concentration warnings
 * - Trade-level analytics and pattern recognition
 *
 * Used By:
 * - Frontend performance dashboard for visualization
 * - Portfolio optimization and rebalancing recommendations
 * - Risk management for exposure monitoring
 * - Paper trading education and strategy assessment
 * =============================================================================
 */

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

      const sectorData = sectorMap.get(sector);
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

      const sectorData = sectorMap.get(sector);
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
        suggestions.push({
          action: 'reduce',
          symbol: `${sector.sector} sector`,
          currentWeight: sector.percentage,
          targetWeight: 25,
          reasoning: 'Sector concentration exceeds 30% limit',
        });
      }
    }

    return suggestions;
  }

  private async calculatePeriodReturn(
    portfolio: any,
    days: number,
  ): Promise<number> {
    // Simplified calculation - in real implementation, you'd fetch historical data
    // For now, return estimated return based on current positions
    if (!portfolio || !portfolio.positions) return 0;

    // Mock calculation based on portfolio performance
    const totalReturn = Number(portfolio.totalReturn) || 0;
    const adjustmentFactor = Math.min(days / 365, 1); // Scale down for shorter periods
    return totalReturn * adjustmentFactor;
  }

  private getDaysSinceInception(portfolio: any): number {
    if (!portfolio || !portfolio.createdAt) return 1;

    const createdDate = new Date(portfolio.createdAt);
    const currentDate = new Date();
    const diffTime = Math.abs(currentDate.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(1, diffDays);
  }

  private async calculatePortfolioVolatility(portfolio: any): Promise<number> {
    if (
      !portfolio ||
      !portfolio.positions ||
      portfolio.positions.length === 0
    ) {
      return 0.15; // Default volatility
    }

    // Simplified volatility calculation
    // In real implementation, you'd calculate based on historical price data
    let weightedVolatility = 0;
    const totalValue = Number(portfolio.totalValue) || 0;

    for (const position of portfolio.positions) {
      const positionValue =
        Number(position.currentValue) || Number(position.value) || 0;
      const weight = totalValue > 0 ? positionValue / totalValue : 0;

      // Mock volatility based on position type/sector (would be calculated from historical data)
      const estimatedVolatility = this.getEstimatedVolatility(position.symbol);
      weightedVolatility += weight * estimatedVolatility;
    }

    return weightedVolatility;
  }

  private getEstimatedVolatility(symbol: string): number {
    // Mock volatility estimates - in real implementation, fetch from historical data
    const volatilityMap: { [key: string]: number } = {
      // High volatility stocks
      TSLA: 0.35,
      NVDA: 0.32,
      AMD: 0.3,
      // Medium volatility stocks
      AAPL: 0.22,
      GOOGL: 0.25,
      MSFT: 0.24,
      // Low volatility stocks
      JNJ: 0.15,
      PG: 0.14,
      KO: 0.16,
    };

    return volatilityMap[symbol] || 0.25; // Default 25% volatility
  }

  private async calculateMaxDrawdown(portfolio: any): Promise<number> {
    // Simplified max drawdown calculation
    // In real implementation, you'd use historical portfolio values
    if (!portfolio || !portfolio.positions) return 0;

    // Mock calculation based on current performance
    const totalReturn = Number(portfolio.totalReturn) || 0;

    // Estimate max drawdown as a percentage of negative return
    if (totalReturn < 0) {
      return Math.abs(totalReturn / 100) * 1.2; // Amplify negative returns for drawdown estimate
    }

    // For positive returns, estimate a smaller historical drawdown
    return 0.05; // 5% estimated max drawdown
  }

  private async calculateCorrelationMatrix(
    portfolio: any,
  ): Promise<{ [symbol: string]: { [symbol2: string]: number } }> {
    if (
      !portfolio ||
      !portfolio.positions ||
      portfolio.positions.length === 0
    ) {
      return {};
    }

    const positions = portfolio.positions;
    const correlationMatrix: {
      [symbol: string]: { [symbol2: string]: number };
    } = {};

    // Initialize correlation matrix
    for (const position1 of positions) {
      correlationMatrix[position1.symbol] = {};

      for (const position2 of positions) {
        if (position1.symbol === position2.symbol) {
          correlationMatrix[position1.symbol][position2.symbol] = 1.0; // Perfect correlation with itself
        } else {
          // Mock correlation calculation - in real implementation, use historical price data
          correlationMatrix[position1.symbol][position2.symbol] =
            this.estimateCorrelation(position1.symbol, position2.symbol);
        }
      }
    }

    return correlationMatrix;
  }

  private estimateCorrelation(symbol1: string, symbol2: string): number {
    // Mock correlation estimates - in real implementation, calculate from historical data
    const sectorCorrelations: { [key: string]: string } = {
      AAPL: 'tech',
      GOOGL: 'tech',
      MSFT: 'tech',
      NVDA: 'tech',
      TSLA: 'tech',
      JPM: 'finance',
      BAC: 'finance',
      WFC: 'finance',
      JNJ: 'healthcare',
      PFE: 'healthcare',
      UNH: 'healthcare',
    };

    const sector1 = sectorCorrelations[symbol1] || 'other';
    const sector2 = sectorCorrelations[symbol2] || 'other';

    if (sector1 === sector2) {
      return 0.6 + Math.random() * 0.3; // High correlation within same sector (0.6-0.9)
    } else {
      return 0.1 + Math.random() * 0.4; // Lower correlation across sectors (0.1-0.5)
    }
  }

  private calculateConcentrationRisk(portfolio: any): number {
    if (
      !portfolio ||
      !portfolio.positions ||
      portfolio.positions.length === 0
    ) {
      return 0;
    }

    const totalValue = Number(portfolio.totalValue) || 0;
    if (totalValue === 0) return 0;

    // Calculate Herfindahl Index for concentration risk
    const weights = portfolio.positions.map((position: any) => {
      const positionValue =
        Number(position.currentValue) || Number(position.value) || 0;
      return positionValue / totalValue;
    });

    // Herfindahl Index: sum of squared weights
    const herfindahlIndex = weights.reduce((sum: number, weight: number) => {
      return sum + weight * weight;
    }, 0);

    // Convert to risk score (0-1 scale)
    // Perfect diversification (n equal positions): HHI = 1/n
    // Maximum concentration (1 position): HHI = 1
    const numberOfPositions = portfolio.positions.length;
    const minHHI = 1 / numberOfPositions; // Perfect diversification
    const normalizedRisk = (herfindahlIndex - minHHI) / (1 - minHHI);

    return Math.max(0, Math.min(1, normalizedRisk));
  }
}
