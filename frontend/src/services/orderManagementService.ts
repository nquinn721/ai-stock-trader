/**
 * =============================================================================
 * ORDER MANAGEMENT SERVICE - Frontend
 * =============================================================================
 *
 * Frontend service for interacting with the Daily Order Management API
 * endpoints. Provides comprehensive order tracking, EOD processing status,
 * and order analytics for the Auto Trading Dashboard visualization.
 *
 * Features:
 * - Real-time order status monitoring
 * - Daily order summaries and analytics
 * - EOD processing status and results
 * - Order lifecycle statistics
 * - Portfolio-specific order tracking
 * =============================================================================
 */

import { FRONTEND_API_CONFIG } from "../config/api.config";

export interface DailyOrderSummary {
  date: string;
  portfolioId: number;
  totalOrders: number;
  executedOrders: number;
  cancelledOrders: number;
  expiredOrders: number;
  totalVolume: number;
  totalValue: number;
  commissions: number;
  pnl: number;
  successRate: number;
}

export interface EODProcessingResult {
  processedDate: string;
  totalOrdersProcessed: number;
  dayOrdersCancelled: number;
  gtcOrdersRolledOver: number;
  expiredOrdersHandled: number;
  portfoliosReconciled: number;
  performanceSummaries: DailyOrderSummary[];
  processingTimeMs: number;
  errors: string[];
}

export interface OrderStatistics {
  period: string;
  totalOrders: number;
  successRate: number;
  averageExecutionTime: number;
  orderTypeBreakdown: Record<string, number>;
  dailyOrderCounts: Array<{ date: string; count: number }>;
}

export interface ProcessingStatus {
  currentTime: string;
  marketStatus: string;
  nextScheduledRuns: {
    marketOpen: string;
    marketClose: string;
    eodProcessing: string;
    hourlyMaintenance: string;
  };
  isValidTradingDay: boolean;
}

export interface OrderExecutionMetrics {
  portfolioId: number;
  totalOrdersToday: number;
  executedOrdersToday: number;
  pendingOrders: number;
  averageExecutionTime: number;
  successRateToday: number;
  totalVolumeToday: number;
  totalCommissionsToday: number;
  pnlToday: number;
}

class OrderManagementService {
  private readonly baseUrl = `${FRONTEND_API_CONFIG.backend.baseUrl}/api/daily-order-management`;

  /**
   * Get today's order summary for a specific portfolio
   */
  async getTodayOrderSummary(portfolioId: number): Promise<DailyOrderSummary> {
    try {
      const response = await fetch(
        `${this.baseUrl}/summary/${portfolioId}/today`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching today order summary:", error);
      throw error;
    }
  }

  /**
   * Get order summaries for a date range
   */
  async getOrderSummariesByRange(
    portfolioId: number,
    startDate: string,
    endDate: string
  ): Promise<DailyOrderSummary[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/summary/${portfolioId}/range?startDate=${startDate}&endDate=${endDate}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching order summaries by range:", error);
      throw error;
    }
  }

  /**
   * Force EOD processing (admin function)
   */
  async forceEODProcessing(): Promise<EODProcessingResult> {
    try {
      const response = await fetch(`${this.baseUrl}/eod/force`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error forcing EOD processing:", error);
      throw error;
    }
  }

  /**
   * Get current processing status
   */
  async getProcessingStatus(): Promise<ProcessingStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/status`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching processing status:", error);
      throw error;
    }
  }

  /**
   * Get order statistics for a portfolio
   */
  async getOrderStatistics(
    portfolioId: number,
    days: number = 30
  ): Promise<OrderStatistics> {
    try {
      const response = await fetch(
        `${this.baseUrl}/statistics/${portfolioId}?days=${days}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching order statistics:", error);
      throw error;
    }
  }

  /**
   * Get comprehensive order execution metrics for a portfolio
   */
  async getOrderExecutionMetrics(
    portfolioId: number
  ): Promise<OrderExecutionMetrics> {
    try {
      const [todaySummary, statistics] = await Promise.all([
        this.getTodayOrderSummary(portfolioId),
        this.getOrderStatistics(portfolioId, 1),
      ]);

      return {
        portfolioId,
        totalOrdersToday: todaySummary.totalOrders,
        executedOrdersToday: todaySummary.executedOrders,
        pendingOrders:
          todaySummary.totalOrders -
          todaySummary.executedOrders -
          todaySummary.cancelledOrders -
          todaySummary.expiredOrders,
        averageExecutionTime: statistics.averageExecutionTime,
        successRateToday: todaySummary.successRate,
        totalVolumeToday: todaySummary.totalVolume,
        totalCommissionsToday: todaySummary.commissions,
        pnlToday: todaySummary.pnl,
      };
    } catch (error) {
      console.error("Error fetching order execution metrics:", error);
      // Return default metrics if API fails
      return {
        portfolioId,
        totalOrdersToday: 0,
        executedOrdersToday: 0,
        pendingOrders: 0,
        averageExecutionTime: 0,
        successRateToday: 0,
        totalVolumeToday: 0,
        totalCommissionsToday: 0,
        pnlToday: 0,
      };
    }
  }

  /**
   * Get order summaries for the last N days
   */
  async getRecentOrderSummaries(
    portfolioId: number,
    days: number = 7
  ): Promise<DailyOrderSummary[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    return this.getOrderSummariesByRange(portfolioId, startDateStr, endDateStr);
  }

  /**
   * Get aggregated metrics for all portfolios
   */
  async getAllPortfoliosMetrics(portfolioIds: number[]): Promise<{
    totalOrders: number;
    totalExecuted: number;
    averageSuccessRate: number;
    totalVolume: number;
    totalPnL: number;
  }> {
    try {
      const metrics = await Promise.all(
        portfolioIds.map((id) => this.getOrderExecutionMetrics(id))
      );

      const totalOrders = metrics.reduce(
        (sum, m) => sum + m.totalOrdersToday,
        0
      );
      const totalExecuted = metrics.reduce(
        (sum, m) => sum + m.executedOrdersToday,
        0
      );
      const totalVolume = metrics.reduce(
        (sum, m) => sum + m.totalVolumeToday,
        0
      );
      const totalPnL = metrics.reduce((sum, m) => sum + m.pnlToday, 0);
      const averageSuccessRate =
        metrics.length > 0
          ? metrics.reduce((sum, m) => sum + m.successRateToday, 0) /
            metrics.length
          : 0;

      return {
        totalOrders,
        totalExecuted,
        averageSuccessRate,
        totalVolume,
        totalPnL,
      };
    } catch (error) {
      console.error("Error fetching all portfolios metrics:", error);
      return {
        totalOrders: 0,
        totalExecuted: 0,
        averageSuccessRate: 0,
        totalVolume: 0,
        totalPnL: 0,
      };
    }
  }
}

// Export singleton instance
export const orderManagementService = new OrderManagementService();
export default orderManagementService;
