import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  NotificationPriority,
  NotificationType,
} from './entities/notification.entities';
import {
  CreateNotificationDto,
  NotificationFilter,
  NotificationPreference,
} from './interfaces/notification.interfaces';
import { NotificationService } from './services/notification.service';

@Controller('notifications')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(private readonly notificationService: NotificationService) {}

  // === Notification CRUD ===

  @Post()
  async createNotification(
    @Body() createNotificationDto: CreateNotificationDto,
  ) {
    try {
      const notification = await this.notificationService.createNotification(
        createNotificationDto,
      );
      return {
        success: true,
        data: notification,
        message: 'Notification created successfully',
      };
    } catch (error) {
      this.logger.error(
        `Failed to create notification: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create notification',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async getNotifications(@Query() query: any) {
    try {
      const filter: NotificationFilter = {
        userId: query.userId,
        type: query.type as NotificationType,
        priority: query.priority as NotificationPriority,
        symbol: query.symbol,
        portfolioId: query.portfolioId
          ? parseInt(query.portfolioId)
          : undefined,
        status: query.status,
        fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
        toDate: query.toDate ? new Date(query.toDate) : undefined,
        limit: query.limit ? parseInt(query.limit) : 50,
        offset: query.offset ? parseInt(query.offset) : 0,
      };

      const result = await this.notificationService.getNotifications(filter);
      return {
        success: true,
        data: result.notifications,
        total: result.total,
        pagination: {
          limit: filter.limit,
          offset: filter.offset,
          hasMore: result.total > (filter.offset || 0) + (filter.limit || 50),
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get notifications: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get notifications',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('unread-count/:userId')
  async getUnreadCount(@Param('userId') userId: string) {
    try {
      const count = await this.notificationService.getUnreadCount(userId);
      return {
        success: true,
        data: { count },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get unread count: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get unread count',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) id: number,
    @Body('userId') userId: string,
  ) {
    try {
      const success = await this.notificationService.markAsRead(id, userId);
      return {
        success,
        message: success
          ? 'Notification marked as read'
          : 'Failed to mark as read',
      };
    } catch (error) {
      this.logger.error(
        `Failed to mark notification as read: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to mark notification as read',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/dismiss')
  async markAsDismissed(
    @Param('id', ParseIntPipe) id: number,
    @Body('userId') userId: string,
  ) {
    try {
      const success = await this.notificationService.markAsDismissed(
        id,
        userId,
      );
      return {
        success,
        message: success
          ? 'Notification dismissed'
          : 'Failed to dismiss notification',
      };
    } catch (error) {
      this.logger.error(
        `Failed to dismiss notification: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to dismiss notification',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // === Notification Preferences ===

  @Get('preferences/:userId')
  async getUserPreferences(@Param('userId') userId: string) {
    try {
      const preferences =
        await this.notificationService.getUserPreferences(userId);
      return {
        success: true,
        data: preferences,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get user preferences: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get user preferences',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('preferences/:userId/:type')
  async updatePreference(
    @Param('userId') userId: string,
    @Param('type') type: NotificationType,
    @Body() preference: Partial<NotificationPreference>,
  ) {
    try {
      const success = await this.notificationService.updatePreference(
        userId,
        type,
        preference,
      );
      return {
        success,
        message: success
          ? 'Preference updated successfully'
          : 'Failed to update preference',
      };
    } catch (error) {
      this.logger.error(
        `Failed to update preference: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update preference',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // === Alert Creation Endpoints ===

  @Post('alerts/trading-opportunity')
  async createTradingOpportunityAlert(
    @Body('userId') userId: string,
    @Body('alert') alert: any,
  ) {
    try {
      const notification =
        await this.notificationService.createTradingOpportunityAlert(
          userId,
          alert,
        );
      return {
        success: true,
        data: notification,
        message: 'Trading opportunity alert created',
      };
    } catch (error) {
      this.logger.error(
        `Failed to create trading opportunity alert: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create trading opportunity alert',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('alerts/pattern')
  async createPatternAlert(
    @Body('userId') userId: string,
    @Body('alert') alert: any,
  ) {
    try {
      const notification = await this.notificationService.createPatternAlert(
        userId,
        alert,
      );
      return {
        success: true,
        data: notification,
        message: 'Pattern alert created',
      };
    } catch (error) {
      this.logger.error(
        `Failed to create pattern alert: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create pattern alert',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('alerts/technical')
  async createTechnicalAlert(
    @Body('userId') userId: string,
    @Body('alert') alert: any,
  ) {
    try {
      const notification = await this.notificationService.createTechnicalAlert(
        userId,
        alert,
      );
      return {
        success: true,
        data: notification,
        message: 'Technical alert created',
      };
    } catch (error) {
      this.logger.error(
        `Failed to create technical alert: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create technical alert',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('alerts/risk-management')
  async createRiskManagementAlert(
    @Body('userId') userId: string,
    @Body('alert') alert: any,
  ) {
    try {
      const notification =
        await this.notificationService.createRiskManagementAlert(userId, alert);
      return {
        success: true,
        data: notification,
        message: 'Risk management alert created',
      };
    } catch (error) {
      this.logger.error(
        `Failed to create risk management alert: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create risk management alert',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('alerts/market-event')
  async createMarketEventAlert(
    @Body('userId') userId: string,
    @Body('alert') alert: any,
  ) {
    try {
      const notification =
        await this.notificationService.createMarketEventAlert(userId, alert);
      return {
        success: true,
        data: notification,
        message: 'Market event alert created',
      };
    } catch (error) {
      this.logger.error(
        `Failed to create market event alert: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create market event alert',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('alerts/multi-timeframe')
  async createMultiTimeframeAlert(
    @Body('userId') userId: string,
    @Body('alert') alert: any,
  ) {
    try {
      const notification =
        await this.notificationService.createMultiTimeframeAlert(userId, alert);
      return {
        success: true,
        data: notification,
        message: 'Multi-timeframe alert created',
      };
    } catch (error) {
      this.logger.error(
        `Failed to create multi-timeframe alert: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create multi-timeframe alert',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // === Utility Endpoints ===

  @Get('health')
  async health() {
    return {
      success: true,
      message: 'Notification service is healthy',
      timestamp: new Date().toISOString(),
      service: 'notification-service',
    };
  }

  @Post('cleanup')
  async cleanupOldNotifications(@Body('daysOld') daysOld: number = 30) {
    try {
      const cleaned =
        await this.notificationService.cleanupOldNotifications(daysOld);
      return {
        success: true,
        data: { cleaned },
        message: `Cleaned up ${cleaned} old notifications`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to cleanup notifications: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to cleanup notifications',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // === Bulk Operations ===

  @Post('bulk/mark-read')
  async bulkMarkAsRead(
    @Body() body: { userId: string; notificationIds: number[] },
  ) {
    try {
      const results = await Promise.allSettled(
        body.notificationIds.map((id) =>
          this.notificationService.markAsRead(id, body.userId),
        ),
      );

      const successful = results.filter(
        (r) => r.status === 'fulfilled' && r.value === true,
      ).length;
      const failed = results.length - successful;

      return {
        success: true,
        data: { successful, failed, total: results.length },
        message: `Marked ${successful} notifications as read`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to bulk mark as read: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to bulk mark as read',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('bulk/dismiss')
  async bulkDismiss(
    @Body() body: { userId: string; notificationIds: number[] },
  ) {
    try {
      const results = await Promise.allSettled(
        body.notificationIds.map((id) =>
          this.notificationService.markAsDismissed(id, body.userId),
        ),
      );

      const successful = results.filter(
        (r) => r.status === 'fulfilled' && r.value === true,
      ).length;
      const failed = results.length - successful;

      return {
        success: true,
        data: { successful, failed, total: results.length },
        message: `Dismissed ${successful} notifications`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to bulk dismiss: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to bulk dismiss',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // === S30: Notification History and Management Features ===

  @Get('analytics/:userId')
  async getNotificationAnalytics(@Param('userId') userId: string) {
    try {
      const analytics =
        await this.notificationService.getNotificationAnalytics(userId);
      return {
        success: true,
        data: analytics,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get notification analytics: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get notification analytics',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('history/:userId')
  async getNotificationHistory(
    @Param('userId') userId: string,
    @Query() query: any,
  ) {
    try {
      const filter = {
        userId,
        type: query.type,
        priority: query.priority,
        symbol: query.symbol,
        fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
        toDate: query.toDate ? new Date(query.toDate) : undefined,
        status: query.status || 'read,dismissed', // Default to completed notifications
        limit: query.limit ? parseInt(query.limit) : 100,
        offset: query.offset ? parseInt(query.offset) : 0,
        sortBy: query.sortBy || 'createdAt',
        sortOrder: query.sortOrder || 'DESC',
      };

      const result =
        await this.notificationService.getNotificationHistory(filter);
      return {
        success: true,
        data: result.notifications,
        total: result.total,
        pagination: {
          limit: filter.limit,
          offset: filter.offset,
          hasMore: result.total > (filter.offset || 0) + (filter.limit || 100),
        },
      };
    } catch (error) {
      this.logger.error(
        `Failed to get notification history: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get notification history',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('search')
  async searchNotifications(
    @Body()
    searchRequest: {
      userId: string;
      query: string;
      filters?: any;
      limit?: number;
      offset?: number;
    },
  ) {
    try {
      const result = await this.notificationService.searchNotifications(
        searchRequest.userId,
        searchRequest.query,
        searchRequest.filters,
        searchRequest.limit,
        searchRequest.offset,
      );
      return {
        success: true,
        data: result.notifications,
        total: result.total,
        highlights: result.highlights,
      };
    } catch (error) {
      this.logger.error(
        `Failed to search notifications: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to search notifications',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('bulk/delete')
  async bulkDelete(
    @Body() body: { userId: string; notificationIds: number[] },
  ) {
    try {
      const result = await this.notificationService.bulkDeleteNotifications(
        body.userId,
        body.notificationIds,
      );
      return {
        success: true,
        data: result,
        message: `Deleted ${result.deleted} notifications`,
      };
    } catch (error) {
      this.logger.error(`Failed to bulk delete: ${error.message}`, error.stack);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to bulk delete notifications',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('bulk/archive')
  async bulkArchive(
    @Body()
    body: {
      userId: string;
      notificationIds: number[];
      archiveUntil?: Date;
    },
  ) {
    try {
      const result = await this.notificationService.bulkArchiveNotifications(
        body.userId,
        body.notificationIds,
        body.archiveUntil,
      );
      return {
        success: true,
        data: result,
        message: `Archived ${result.archived} notifications`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to bulk archive: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to bulk archive notifications',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('export/:userId')
  async exportNotifications(
    @Param('userId') userId: string,
    @Query() query: any,
  ) {
    try {
      const format = query.format || 'json'; // json, csv, xlsx
      const filter = {
        userId,
        type: query.type,
        priority: query.priority,
        fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
        toDate: query.toDate ? new Date(query.toDate) : undefined,
        status: query.status,
      };

      const exportData = await this.notificationService.exportNotifications(
        filter,
        format,
      );

      return {
        success: true,
        data: exportData,
        filename: `notifications_${userId}_${new Date().toISOString().split('T')[0]}.${format}`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to export notifications: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        {
          success: false,
          message: 'Failed to export notifications',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post(':id/tag')
  async addTag(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { userId: string; tags: string[] },
  ) {
    try {
      const result = await this.notificationService.addTagsToNotification(
        id,
        body.userId,
        body.tags,
      );
      return {
        success: true,
        data: result,
        message: 'Tags added successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to add tags: ${error.message}`, error.stack);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to add tags',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
