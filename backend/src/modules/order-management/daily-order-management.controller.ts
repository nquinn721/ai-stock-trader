/**
 * =============================================================================
 * DAILY ORDER MANAGEMENT CONTROLLER
 * =============================================================================
 *
 * REST API endpoints for daily order management, EOD processing, and order
 * lifecycle monitoring. Provides access to daily order summaries, processing
 * status, and manual trigger capabilities for administrative operations.
 *
 * Key Endpoints:
 * - GET /daily-order-management/summary/:portfolioId/today - Today's order summary
 * - GET /daily-order-management/summary/:portfolioId/range - Date range summaries
 * - POST /daily-order-management/eod/force - Force EOD processing (admin)
 * - GET /daily-order-management/status - Current processing status
 *
 * Used By:
 * - Frontend dashboard for daily performance display
 * - Admin interface for manual processing triggers
 * - Portfolio analytics for historical order data
 * - Reporting systems for order execution metrics
 * =============================================================================
 */

import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  DailyOrderManagementService,
  DailyOrderSummary,
  EODProcessingResult,
} from './services/daily-order-management.service';

@Controller('daily-order-management')
export class DailyOrderManagementController {
  private readonly logger = new Logger(DailyOrderManagementController.name);

  constructor(
    private readonly dailyOrderManagementService: DailyOrderManagementService,
  ) {}

  /**
   * Get today's order summary for a specific portfolio
   */
  @Get('summary/:portfolioId/today')
  async getTodayOrderSummary(
    @Param('portfolioId', ParseIntPipe) portfolioId: number,
  ): Promise<DailyOrderSummary> {
    try {
      this.logger.log(
        `Getting today's order summary for portfolio ${portfolioId}`,
      );
      return await this.dailyOrderManagementService.getTodayOrderSummary(
        portfolioId,
      );
    } catch (error) {
      this.logger.error(
        `Error getting today's order summary for portfolio ${portfolioId}:`,
        error,
      );
      throw new HttpException(
        "Failed to get today's order summary",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get order summaries for a date range
   */
  @Get('summary/:portfolioId/range')
  async getOrderSummariesByRange(
    @Param('portfolioId', ParseIntPipe) portfolioId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<DailyOrderSummary[]> {
    try {
      if (!startDate || !endDate) {
        throw new HttpException(
          'startDate and endDate query parameters are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new HttpException(
          'Invalid date format. Use YYYY-MM-DD format',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (start > end) {
        throw new HttpException(
          'startDate cannot be after endDate',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Limit to maximum 90 days
      const daysDifference = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysDifference > 90) {
        throw new HttpException(
          'Date range cannot exceed 90 days',
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(
        `Getting order summaries for portfolio ${portfolioId} from ${startDate} to ${endDate}`,
      );

      return await this.dailyOrderManagementService.getOrderSummaries(
        portfolioId,
        start,
        end,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error getting order summaries for portfolio ${portfolioId}:`,
        error,
      );
      throw new HttpException(
        'Failed to get order summaries',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Force EOD processing (admin endpoint)
   */
  @Post('eod/force')
  async forceEODProcessing(): Promise<EODProcessingResult> {
    try {
      this.logger.log('Manual EOD processing triggered');
      return await this.dailyOrderManagementService.forceEODProcessing();
    } catch (error) {
      this.logger.error('Error during manual EOD processing:', error);
      throw new HttpException(
        'Failed to execute EOD processing',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get current processing status and next scheduled runs
   */
  @Get('status')
  async getProcessingStatus(): Promise<{
    currentTime: string;
    marketStatus: string;
    nextScheduledRuns: {
      marketOpen: string;
      marketClose: string;
      eodProcessing: string;
      hourlyMaintenance: string;
    };
    isValidTradingDay: boolean;
  }> {
    try {
      const currentTime = new Date();
      const nextDay = new Date(currentTime);
      nextDay.setDate(nextDay.getDate() + 1);

      // Calculate next scheduled runs (simplified - in production would use more sophisticated scheduling)
      const marketOpen = new Date(currentTime);
      marketOpen.setHours(9, 25, 0, 0); // 9:25 AM ET
      if (marketOpen <= currentTime) {
        marketOpen.setDate(marketOpen.getDate() + 1);
      }

      const marketClose = new Date(currentTime);
      marketClose.setHours(16, 0, 0, 0); // 4:00 PM ET
      if (marketClose <= currentTime) {
        marketClose.setDate(marketClose.getDate() + 1);
      }

      const eodProcessing = new Date(currentTime);
      eodProcessing.setHours(18, 0, 0, 0); // 6:00 PM ET
      if (eodProcessing <= currentTime) {
        eodProcessing.setDate(eodProcessing.getDate() + 1);
      }

      const hourlyMaintenance = new Date(currentTime);
      hourlyMaintenance.setMinutes(0, 0, 0);
      hourlyMaintenance.setHours(hourlyMaintenance.getHours() + 1);

      // Check if today is a valid trading day (simplified)
      const dayOfWeek = currentTime.getDay();
      const isValidTradingDay = dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday

      return {
        currentTime: currentTime.toISOString(),
        marketStatus: 'open', // Simplified - would integrate with MarketHoursService
        nextScheduledRuns: {
          marketOpen: marketOpen.toISOString(),
          marketClose: marketClose.toISOString(),
          eodProcessing: eodProcessing.toISOString(),
          hourlyMaintenance: hourlyMaintenance.toISOString(),
        },
        isValidTradingDay,
      };
    } catch (error) {
      this.logger.error('Error getting processing status:', error);
      throw new HttpException(
        'Failed to get processing status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get order lifecycle statistics
   */
  @Get('statistics/:portfolioId')
  async getOrderStatistics(
    @Param('portfolioId', ParseIntPipe) portfolioId: number,
    @Query('days') days?: string,
  ): Promise<{
    period: string;
    totalOrders: number;
    successRate: number;
    averageExecutionTime: number;
    orderTypeBreakdown: Record<string, number>;
    dailyOrderCounts: Array<{ date: string; count: number }>;
  }> {
    try {
      const periodDays = days ? parseInt(days, 10) : 30;

      if (periodDays < 1 || periodDays > 365) {
        throw new HttpException(
          'Days parameter must be between 1 and 365',
          HttpStatus.BAD_REQUEST,
        );
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);

      const summaries =
        await this.dailyOrderManagementService.getOrderSummaries(
          portfolioId,
          startDate,
          endDate,
        );

      const totalOrders = summaries.reduce((sum, s) => sum + s.totalOrders, 0);
      const totalExecuted = summaries.reduce(
        (sum, s) => sum + s.executedOrders,
        0,
      );
      const successRate =
        totalOrders > 0 ? (totalExecuted / totalOrders) * 100 : 0;

      // Simplified statistics - would be more comprehensive in production
      return {
        period: `${periodDays} days`,
        totalOrders,
        successRate: Math.round(successRate * 100) / 100,
        averageExecutionTime: 0, // Would calculate from execution timestamps
        orderTypeBreakdown: {
          market: 0,
          limit: 0,
          stop: 0,
        }, // Would analyze actual order types
        dailyOrderCounts: summaries.map((s) => ({
          date: s.date,
          count: s.totalOrders,
        })),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(
        `Error getting order statistics for portfolio ${portfolioId}:`,
        error,
      );
      throw new HttpException(
        'Failed to get order statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
