import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import {
  PortfolioAnalytics,
  PortfolioAnalyticsService,
} from './portfolio-analytics.service';

@Controller('portfolio-analytics')
export class PortfolioAnalyticsController {
  constructor(
    private readonly portfolioAnalyticsService: PortfolioAnalyticsService,
  ) {}

  /**
   * Get comprehensive analytics for a portfolio
   */
  @Get(':portfolioId')
  async getPortfolioAnalytics(
    @Param('portfolioId', ParseIntPipe) portfolioId: number,
  ): Promise<PortfolioAnalytics> {
    return this.portfolioAnalyticsService.generatePortfolioAnalytics(
      portfolioId,
    );
  }

  /**
   * Get sector allocation for a portfolio
   */
  @Get(':portfolioId/sectors')
  async getSectorAllocation(
    @Param('portfolioId', ParseIntPipe) portfolioId: number,
  ) {
    const analytics =
      await this.portfolioAnalyticsService.generatePortfolioAnalytics(
        portfolioId,
      );
    return {
      portfolioId,
      sectorAllocation: analytics.sectorAllocation,
      timestamp: analytics.timestamp,
    };
  }

  /**
   * Get performance attribution for a portfolio
   */
  @Get(':portfolioId/attribution')
  async getPerformanceAttribution(
    @Param('portfolioId', ParseIntPipe) portfolioId: number,
  ) {
    const analytics =
      await this.portfolioAnalyticsService.generatePortfolioAnalytics(
        portfolioId,
      );
    return {
      portfolioId,
      performanceAttribution: analytics.performanceAttribution,
      timestamp: analytics.timestamp,
    };
  }

  /**
   * Get risk metrics for a portfolio
   */
  @Get(':portfolioId/risk')
  async getRiskMetrics(
    @Param('portfolioId', ParseIntPipe) portfolioId: number,
  ) {
    const analytics =
      await this.portfolioAnalyticsService.generatePortfolioAnalytics(
        portfolioId,
      );
    return {
      portfolioId,
      riskMetrics: analytics.riskMetrics,
      timestamp: analytics.timestamp,
    };
  }

  /**
   * Get benchmark comparison for a portfolio
   */
  @Get(':portfolioId/benchmarks')
  async getBenchmarkComparison(
    @Param('portfolioId', ParseIntPipe) portfolioId: number,
  ) {
    const analytics =
      await this.portfolioAnalyticsService.generatePortfolioAnalytics(
        portfolioId,
      );
    return {
      portfolioId,
      benchmarkComparison: analytics.benchmarkComparison,
      timestamp: analytics.timestamp,
    };
  }

  /**
   * Get rebalancing suggestions for a portfolio
   */
  @Get(':portfolioId/rebalancing')
  async getRebalancingSuggestions(
    @Param('portfolioId', ParseIntPipe) portfolioId: number,
  ) {
    const analytics =
      await this.portfolioAnalyticsService.generatePortfolioAnalytics(
        portfolioId,
      );
    return {
      portfolioId,
      rebalancingSuggestions: analytics.rebalancingSuggestions,
      timestamp: analytics.timestamp,
    };
  }
}
