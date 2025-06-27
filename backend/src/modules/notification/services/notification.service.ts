/**
 * =============================================================================
 * NOTIFICATION SERVICE - Intelligent Alert and Communication Engine
 * =============================================================================
 *
 * Comprehensive notification and alert system that delivers personalized,
 * real-time notifications for trading activities, market events, and portfolio
 * changes. Supports multiple delivery channels and intelligent filtering.
 *
 * Key Features:
 * - Multi-channel notification delivery (email, SMS, push, in-app)
 * - Intelligent alert detection and pattern recognition
 * - Personalized notification preferences and filtering
 * - Template-based notification formatting and customization
 * - Real-time delivery tracking and status monitoring
 * - Market event alerts and threshold-based notifications
 * - Portfolio performance alerts and risk warnings
 * - Trading signal notifications and opportunity alerts
 *
 * Notification Types:
 * - TRADE_EXECUTION: Order fills and trade confirmations
 * - PRICE_ALERT: Stock price threshold notifications
 * - PORTFOLIO_UPDATE: Portfolio value and performance changes
 * - RISK_WARNING: Risk limit breaches and margin calls
 * - MARKET_NEWS: Important market events and news
 * - SYSTEM_STATUS: Platform status and maintenance alerts
 *
 * Alert Detection:
 * - Price movement alerts (percentage or absolute thresholds)
 * - Volume spike detection and unusual activity alerts
 * - Technical pattern recognition (breakouts, reversals)
 * - Multi-timeframe analysis and confirmation signals
 * - Correlation alerts and cross-asset opportunities
 * - Sentiment analysis alerts from news and social media
 *
 * Delivery Channels:
 * - Email: Rich HTML templates with charts and data
 * - SMS: Concise text alerts for urgent notifications
 * - Push Notifications: Mobile app and browser notifications
 * - In-App: Real-time dashboard alerts and popups
 * - WebSocket: Live notification streaming
 *
 * Personalization:
 * - User-defined alert criteria and thresholds
 * - Notification frequency control and quiet hours
 * - Priority-based filtering and escalation rules
 * - Channel preferences by notification type
 * - Alert group management and batch processing
 *
 * Used By:
 * - Stock Service for price and volume alerts
 * - Paper Trading Service for trade notifications
 * - Risk Management for compliance alerts
 * - Frontend notification center for user alerts
 * =============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
  DeliveryChannel,
  NotificationEntity,
  NotificationPreferenceEntity,
  NotificationPriority,
  NotificationStatus,
  NotificationTemplateEntity,
  NotificationType,
} from '../entities/notification.entities';
import {
  AlertDetector,
  CreateNotificationDto,
  MarketEventAlert,
  MultiTimeframeAlert,
  NotificationFilter,
  NotificationPreference,
  PatternAlert,
  RiskManagementAlert,
  Stock,
  TechnicalAlert,
  TradingOpportunityAlert,
  TradingSignal,
} from '../interfaces/notification.interfaces';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private alertDetectors: Map<NotificationType, AlertDetector> = new Map();
  private isProcessing = false;

  constructor(
    @InjectRepository(NotificationEntity)
    private notificationRepository: Repository<NotificationEntity>,
    @InjectRepository(NotificationPreferenceEntity)
    private preferenceRepository: Repository<NotificationPreferenceEntity>,
    @InjectRepository(NotificationTemplateEntity)
    private templateRepository: Repository<NotificationTemplateEntity>,
  ) {
    this.initializeDefaultTemplates();
  }

  // === Core Notification Management ===
  async createNotification(
    dto: CreateNotificationDto,
  ): Promise<NotificationEntity | null> {
    try {
      // Check user preferences
      const shouldSend = await this.shouldSendNotification(
        dto.userId,
        dto.type,
        dto.priority,
      );
      if (!shouldSend) {
        this.logger.debug(
          `Notification blocked by user preferences: ${dto.type} for user ${dto.userId}`,
        );
        return null;
      }

      // Create notification entity
      const notification = this.notificationRepository.create({
        ...dto,
        deliveryChannels: dto.deliveryChannels || [
          DeliveryChannel.IN_APP,
          DeliveryChannel.WEBSOCKET,
        ],
        triggeredAt: new Date(),
      });

      const saved = await this.notificationRepository.save(notification);
      this.logger.log(
        `Created notification ${saved.id} for user ${dto.userId}: ${dto.title}`,
      );

      return saved;
    } catch (error) {
      this.logger.error(
        `Failed to create notification: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getNotifications(
    filter: NotificationFilter,
  ): Promise<{ notifications: NotificationEntity[]; total: number }> {
    try {
      const query =
        this.notificationRepository.createQueryBuilder('notification');

      if (filter.userId) {
        query.andWhere('notification.userId = :userId', {
          userId: filter.userId,
        });
      }

      if (filter.type) {
        query.andWhere('notification.type = :type', { type: filter.type });
      }

      if (filter.priority) {
        query.andWhere('notification.priority = :priority', {
          priority: filter.priority,
        });
      }

      if (filter.symbol) {
        query.andWhere('notification.symbol = :symbol', {
          symbol: filter.symbol,
        });
      }

      if (filter.portfolioId) {
        query.andWhere('notification.portfolioId = :portfolioId', {
          portfolioId: filter.portfolioId,
        });
      }

      if (filter.status) {
        query.andWhere('notification.status = :status', {
          status: filter.status,
        });
      }

      if (filter.fromDate && filter.toDate) {
        query.andWhere('notification.createdAt BETWEEN :fromDate AND :toDate', {
          fromDate: filter.fromDate,
          toDate: filter.toDate,
        });
      }

      query.orderBy('notification.createdAt', 'DESC');

      const total = await query.getCount();

      if (filter.limit) {
        query.limit(filter.limit);
      }

      if (filter.offset) {
        query.offset(filter.offset);
      }

      const notifications = await query.getMany();

      return { notifications, total };
    } catch (error) {
      this.logger.error(
        `Failed to get notifications: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
  async markAsRead(notificationId: number, userId: string): Promise<boolean> {
    try {
      const result = await this.notificationRepository.update(
        { id: notificationId, userId },
        {
          status: NotificationStatus.READ,
          readAt: new Date(),
        },
      );

      return (result.affected ?? 0) > 0;
    } catch (error) {
      this.logger.error(
        `Failed to mark notification as read: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }
  async markAsDismissed(
    notificationId: number,
    userId: string,
  ): Promise<boolean> {
    try {
      const result = await this.notificationRepository.update(
        { id: notificationId, userId },
        {
          status: NotificationStatus.DISMISSED,
          dismissedAt: new Date(),
        },
      );

      return (result.affected ?? 0) > 0;
    } catch (error) {
      this.logger.error(
        `Failed to mark notification as dismissed: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await this.notificationRepository.count({
        where: {
          userId,
          status: NotificationStatus.SENT,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to get unread count: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }

  // === Preference Management ===

  async getUserPreferences(userId: string): Promise<NotificationPreference[]> {
    try {
      const preferences = await this.preferenceRepository.find({
        where: { userId },
      });
      return preferences.map((p) => ({
        userId: p.userId,
        type: p.notificationType,
        enabled: p.enabled,
        deliveryChannels: p.deliveryChannels,
        minimumPriority: p.minimumPriority,
        customThresholds: p.customThresholds,
        quietHours: p.quietHours
          ? {
              enabled: p.quietHours,
              start: p.quietHoursStart || '',
              end: p.quietHoursEnd || '',
            }
          : undefined,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to get user preferences: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  async updatePreference(
    userId: string,
    type: NotificationType,
    preference: Partial<NotificationPreference>,
  ): Promise<boolean> {
    try {
      const existing = await this.preferenceRepository.findOne({
        where: { userId, notificationType: type },
      });

      if (existing) {
        await this.preferenceRepository.update(existing.id, {
          enabled: preference.enabled ?? existing.enabled,
          deliveryChannels:
            preference.deliveryChannels ?? existing.deliveryChannels,
          minimumPriority:
            preference.minimumPriority ?? existing.minimumPriority,
          customThresholds:
            preference.customThresholds ?? existing.customThresholds,
          quietHours: preference.quietHours?.enabled ?? existing.quietHours,
          quietHoursStart:
            preference.quietHours?.start ?? existing.quietHoursStart,
          quietHoursEnd: preference.quietHours?.end ?? existing.quietHoursEnd,
        });
      } else {
        await this.preferenceRepository.save({
          userId,
          notificationType: type,
          enabled: preference.enabled ?? true,
          deliveryChannels: preference.deliveryChannels ?? [
            DeliveryChannel.IN_APP,
          ],
          minimumPriority:
            preference.minimumPriority ?? NotificationPriority.MEDIUM,
          customThresholds: preference.customThresholds,
          quietHours: preference.quietHours?.enabled ?? false,
          quietHoursStart: preference.quietHours?.start,
          quietHoursEnd: preference.quietHours?.end,
        });
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Failed to update preference: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  // === Alert Generation ===

  async createTradingOpportunityAlert(
    userId: string,
    alert: TradingOpportunityAlert,
  ): Promise<NotificationEntity | null> {
    return await this.createNotification({
      userId,
      type: NotificationType.TRADING_OPPORTUNITY,
      priority:
        alert.confidenceScore >= 80
          ? NotificationPriority.HIGH
          : alert.confidenceScore >= 60
            ? NotificationPriority.MEDIUM
            : NotificationPriority.LOW,
      title: `${alert.type.replace('_', ' ').toUpperCase()} Signal: ${alert.symbol}`,
      message: `${alert.reason} | Price: $${alert.currentPrice} | Confidence: ${alert.confidenceScore}% | Timeframe: ${alert.timeframe}`,
      symbol: alert.symbol,
      metadata: {
        alertType: alert.type,
        currentPrice: alert.currentPrice,
        targetPrice: alert.targetPrice,
        stopLoss: alert.stopLoss,
        timeframe: alert.timeframe,
      },
      confidenceScore: alert.confidenceScore,
      timeframe: alert.timeframe,
      expiresAt: alert.expiry,
    });
  }

  async createPatternAlert(
    userId: string,
    alert: PatternAlert,
  ): Promise<NotificationEntity | null> {
    return await this.createNotification({
      userId,
      type: NotificationType.PATTERN_ALERT,
      priority:
        alert.strength >= 80
          ? NotificationPriority.HIGH
          : NotificationPriority.MEDIUM,
      title: `Pattern Alert: ${alert.patternName} - ${alert.symbol}`,
      message: `${alert.type.replace('_', ' ')} detected for ${alert.symbol}. Current price: $${alert.currentPrice}, Key level: $${alert.keyLevel}`,
      symbol: alert.symbol,
      metadata: {
        patternType: alert.type,
        patternName: alert.patternName,
        currentPrice: alert.currentPrice,
        keyLevel: alert.keyLevel,
        direction: alert.direction,
        strength: alert.strength,
      },
      timeframe: alert.timeframe,
    });
  }

  async createTechnicalAlert(
    userId: string,
    alert: TechnicalAlert,
  ): Promise<NotificationEntity | null> {
    const priority =
      alert.severity === 'high'
        ? NotificationPriority.HIGH
        : alert.severity === 'medium'
          ? NotificationPriority.MEDIUM
          : NotificationPriority.LOW;

    return await this.createNotification({
      userId,
      type: NotificationType.TECHNICAL_ALERT,
      priority,
      title: `Technical Alert: ${alert.indicatorName} - ${alert.symbol}`,
      message: `${alert.type.replace('_', ' ')} detected. Current value: ${alert.currentValue}, Threshold: ${alert.threshold}`,
      symbol: alert.symbol,
      metadata: {
        indicatorType: alert.type,
        indicatorName: alert.indicatorName,
        currentValue: alert.currentValue,
        threshold: alert.threshold,
        severity: alert.severity,
      },
      timeframe: alert.timeframe,
    });
  }

  async createRiskManagementAlert(
    userId: string,
    alert: RiskManagementAlert,
  ): Promise<NotificationEntity | null> {
    return await this.createNotification({
      userId,
      type: NotificationType.RISK_MANAGEMENT,
      priority:
        alert.type === 'margin_call'
          ? NotificationPriority.CRITICAL
          : NotificationPriority.HIGH,
      title: `Risk Alert: ${alert.type.replace('_', ' ').toUpperCase()} - ${alert.symbol}`,
      message: `${alert.action.replace('_', ' ')} required. Current: $${alert.currentPrice}, Trigger: $${alert.triggerPrice}, Risk: $${alert.riskAmount}`,
      symbol: alert.symbol,
      portfolioId: alert.portfolioId,
      metadata: {
        alertType: alert.type,
        currentPrice: alert.currentPrice,
        triggerPrice: alert.triggerPrice,
        positionSize: alert.positionSize,
        riskAmount: alert.riskAmount,
        action: alert.action,
      },
    });
  }

  async createMarketEventAlert(
    userId: string,
    alert: MarketEventAlert,
  ): Promise<NotificationEntity | null> {
    const priority =
      alert.severity === 'high'
        ? NotificationPriority.HIGH
        : alert.severity === 'medium'
          ? NotificationPriority.MEDIUM
          : NotificationPriority.LOW;

    return await this.createNotification({
      userId,
      type: NotificationType.MARKET_EVENT,
      priority,
      title: `Market Event: ${alert.event} - ${alert.symbol}`,
      message: `${alert.impact.toUpperCase()} impact detected from ${alert.source}`,
      symbol: alert.symbol,
      metadata: {
        eventType: alert.type,
        event: alert.event,
        impact: alert.impact,
        severity: alert.severity,
        source: alert.source,
        url: alert.url,
      },
    });
  }

  async createMultiTimeframeAlert(
    userId: string,
    alert: MultiTimeframeAlert,
  ): Promise<NotificationEntity | null> {
    return await this.createNotification({
      userId,
      type: NotificationType.MULTI_TIMEFRAME,
      priority:
        alert.confluence >= 80
          ? NotificationPriority.HIGH
          : NotificationPriority.MEDIUM,
      title: `Multi-Timeframe Alert: ${alert.type.replace('_', ' ')} - ${alert.symbol}`,
      message: `${alert.confluence}% confluence across ${alert.timeframes.length} timeframes`,
      symbol: alert.symbol,
      metadata: {
        alertType: alert.type,
        timeframes: alert.timeframes,
        signals: alert.signals,
        confluence: alert.confluence,
        primaryTimeframe: alert.primaryTimeframe,
      },
      timeframe: alert.primaryTimeframe,
    });
  }

  // === Alert Detection & Processing ===

  async detectAndCreateAlerts(
    stocks: Stock[],
    signals: TradingSignal[],
  ): Promise<void> {
    if (this.isProcessing) {
      return; // Prevent concurrent processing
    }

    this.isProcessing = true;
    const startTime = Date.now();

    try {
      const allAlerts: CreateNotificationDto[] = [];

      // Process each stock with available detectors
      for (const stock of stocks) {
        try {
          const stockSignals = signals.filter((s) => s.symbol === stock.symbol);

          // Run all alert detectors
          for (const [type, detector] of this.alertDetectors) {
            if (detector.isEnabled()) {
              const alerts = await detector.detect(stock, stockSignals);
              allAlerts.push(...alerts);
            }
          }

          // Custom detection logic for built-in alerts
          const builtInAlerts = await this.detectBuiltInAlerts(
            stock,
            stockSignals,
          );
          allAlerts.push(...builtInAlerts);
        } catch (error) {
          this.logger.error(
            `Failed to detect alerts for ${stock.symbol}: ${error.message}`,
          );
        }
      }

      // Create notifications in batch
      if (allAlerts.length > 0) {
        await this.createNotificationsBatch(allAlerts);
        this.logger.log(
          `Created ${allAlerts.length} alerts in ${Date.now() - startTime}ms`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Alert detection failed: ${error.message}`,
        error.stack,
      );
    } finally {
      this.isProcessing = false;
    }
  }

  private async detectBuiltInAlerts(
    stock: Stock,
    signals: TradingSignal[],
  ): Promise<CreateNotificationDto[]> {
    const alerts: CreateNotificationDto[] = [];
    const userId = 'default_user'; // For now, using default user

    try {
      // Price change alerts
      if (Math.abs(stock.changePercent) >= 5) {
        alerts.push({
          userId,
          type: NotificationType.MARKET_EVENT,
          priority:
            Math.abs(stock.changePercent) >= 10
              ? NotificationPriority.HIGH
              : NotificationPriority.MEDIUM,
          title: `Significant Price Movement: ${stock.symbol}`,
          message: `${stock.symbol} moved ${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(2)}% to $${stock.currentPrice}`,
          symbol: stock.symbol,
          metadata: {
            priceChange: stock.change,
            percentChange: stock.changePercent,
            currentPrice: stock.currentPrice,
            previousClose: stock.previousClose,
          },
        });
      }

      // Volume spike alerts
      if (stock.volume && stock.volume > 1000000) {
        // Configurable threshold
        alerts.push({
          userId,
          type: NotificationType.TECHNICAL_ALERT,
          priority: NotificationPriority.MEDIUM,
          title: `Volume Spike: ${stock.symbol}`,
          message: `Unusual volume detected: ${(stock.volume / 1000000).toFixed(1)}M shares`,
          symbol: stock.symbol,
          metadata: {
            volume: stock.volume,
            alertType: 'volume_spike',
          },
        });
      }

      // Trading signal alerts
      for (const signal of signals) {
        if (signal.strength >= 70) {
          alerts.push({
            userId,
            type: NotificationType.TRADING_OPPORTUNITY,
            priority:
              signal.strength >= 85
                ? NotificationPriority.HIGH
                : NotificationPriority.MEDIUM,
            title: `${signal.signal.toUpperCase()} Signal: ${signal.symbol}`,
            message: signal.reason,
            symbol: signal.symbol,
            confidenceScore: signal.strength,
            metadata: {
              signal: signal.signal,
              strength: signal.strength,
              price: signal.price,
              reason: signal.reason,
            },
          });
        }
      }
    } catch (error) {
      this.logger.error(
        `Built-in alert detection failed for ${stock.symbol}: ${error.message}`,
      );
    }

    return alerts;
  }

  private async createNotificationsBatch(
    alerts: CreateNotificationDto[],
  ): Promise<void> {
    try {
      const notifications = alerts.map((alert) =>
        this.notificationRepository.create({
          ...alert,
          deliveryChannels: alert.deliveryChannels || [
            DeliveryChannel.IN_APP,
            DeliveryChannel.WEBSOCKET,
          ],
          triggeredAt: new Date(),
        }),
      );

      await this.notificationRepository.save(notifications);
    } catch (error) {
      this.logger.error(
        `Failed to create notifications batch: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  // === Helper Methods ===

  private async shouldSendNotification(
    userId: string,
    type: NotificationType,
    priority?: NotificationPriority,
  ): Promise<boolean> {
    try {
      const preference = await this.preferenceRepository.findOne({
        where: { userId, notificationType: type },
      });

      if (!preference) {
        return true; // Default to sending if no preference set
      }

      if (!preference.enabled) {
        return false;
      }

      if (
        priority &&
        this.isPriorityLower(priority, preference.minimumPriority)
      ) {
        return false;
      }

      // Check quiet hours
      if (
        preference.quietHours &&
        preference.quietHoursStart &&
        preference.quietHoursEnd
      ) {
        const now = new Date();
        const currentTime = now.getHours() * 100 + now.getMinutes();
        const startTime = this.parseTimeString(preference.quietHoursStart);
        const endTime = this.parseTimeString(preference.quietHoursEnd);

        if (this.isInQuietHours(currentTime, startTime, endTime)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Error checking notification permission: ${error.message}`,
      );
      return true; // Default to sending on error
    }
  }

  private isPriorityLower(
    priority: NotificationPriority,
    minimum: NotificationPriority,
  ): boolean {
    const priorities = {
      [NotificationPriority.LOW]: 1,
      [NotificationPriority.MEDIUM]: 2,
      [NotificationPriority.HIGH]: 3,
      [NotificationPriority.CRITICAL]: 4,
    };

    return priorities[priority] < priorities[minimum];
  }

  private parseTimeString(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 100 + minutes;
  }

  private isInQuietHours(current: number, start: number, end: number): boolean {
    if (start <= end) {
      return current >= start && current <= end;
    } else {
      // Crosses midnight
      return current >= start || current <= end;
    }
  }

  private async initializeDefaultTemplates(): Promise<void> {
    try {
      const defaultTemplates = [
        {
          type: NotificationType.TRADING_OPPORTUNITY,
          name: 'Trading Signal',
          titleTemplate: '{signal} Signal: {symbol}',
          messageTemplate:
            '{reason} | Price: ${currentPrice} | Confidence: {confidenceScore}%',
        },
        {
          type: NotificationType.TECHNICAL_ALERT,
          name: 'Technical Indicator',
          titleTemplate: 'Technical Alert: {indicatorName} - {symbol}',
          messageTemplate:
            '{alertType} detected. Current: {currentValue}, Threshold: {threshold}',
        },
        // Add more default templates as needed
      ];

      for (const template of defaultTemplates) {
        const exists = await this.templateRepository.findOne({
          where: { type: template.type, name: template.name },
        });

        if (!exists) {
          await this.templateRepository.save(template);
        }
      }
    } catch (error) {
      this.logger.error(
        `Failed to initialize default templates: ${error.message}`,
      );
    }
  }

  // === Cleanup ===

  async cleanupOldNotifications(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await this.notificationRepository.delete({
        createdAt: Between(new Date(0), cutoffDate),
        status: NotificationStatus.DISMISSED,
      });

      this.logger.log(`Cleaned up ${result.affected} old notifications`);
      return result.affected || 0;
    } catch (error) {
      this.logger.error(
        `Failed to cleanup old notifications: ${error.message}`,
        error.stack,
      );
      return 0;
    }
  }

  // === S30: Notification History and Management ===

  /**
   * Get notification analytics for a user
   */
  async getNotificationAnalytics(userId: string): Promise<any> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get basic counts
      const totalNotifications = await this.notificationRepository.count({
        where: { userId },
      });
      const unreadCount = await this.notificationRepository.count({
        where: {
          userId,
          status: NotificationStatus.PENDING,
        },
      });

      const recentNotifications = await this.notificationRepository.count({
        where: {
          userId,
          createdAt: Between(thirtyDaysAgo, new Date()),
        },
      });

      // Get notifications by type
      const typeStats = await this.notificationRepository
        .createQueryBuilder('notification')
        .select('notification.type', 'type')
        .addSelect('COUNT(*)', 'count')
        .where('notification.userId = :userId', { userId })
        .groupBy('notification.type')
        .getRawMany();

      // Get notifications by priority
      const priorityStats = await this.notificationRepository
        .createQueryBuilder('notification')
        .select('notification.priority', 'priority')
        .addSelect('COUNT(*)', 'count')
        .where('notification.userId = :userId', { userId })
        .groupBy('notification.priority')
        .getRawMany();

      // Get daily activity for last 30 days
      const dailyActivity = await this.notificationRepository
        .createQueryBuilder('notification')
        .select('DATE(notification.createdAt)', 'date')
        .addSelect('COUNT(*)', 'count')
        .where('notification.userId = :userId', { userId })
        .andWhere('notification.createdAt >= :startDate', {
          startDate: thirtyDaysAgo,
        })
        .groupBy('DATE(notification.createdAt)')
        .orderBy('date', 'ASC')
        .getRawMany();

      return {
        summary: {
          total: totalNotifications,
          unread: unreadCount,
          recent: recentNotifications,
          readRate:
            totalNotifications > 0
              ? (
                  ((totalNotifications - unreadCount) / totalNotifications) *
                  100
                ).toFixed(2)
              : 0,
        },
        byType: typeStats.map((stat) => ({
          type: stat.type,
          count: parseInt(stat.count),
        })),
        byPriority: priorityStats.map((stat) => ({
          priority: stat.priority,
          count: parseInt(stat.count),
        })),
        dailyActivity: dailyActivity.map((day) => ({
          date: day.date,
          count: parseInt(day.count),
        })),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get notification analytics for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Get notification history with filtering and pagination
   */
  async getNotificationHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      type?: NotificationType;
      priority?: NotificationPriority;
      status?: NotificationStatus;
      dateFrom?: Date;
      dateTo?: Date;
      tags?: string[];
    },
  ): Promise<{
    notifications: NotificationEntity[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const queryBuilder = this.notificationRepository
        .createQueryBuilder('notification')
        .where('notification.userId = :userId', { userId });

      // Apply filters
      if (filters?.type) {
        queryBuilder.andWhere('notification.type = :type', {
          type: filters.type,
        });
      }
      if (filters?.priority) {
        queryBuilder.andWhere('notification.priority = :priority', {
          priority: filters.priority,
        });
      }
      if (filters?.status) {
        queryBuilder.andWhere('notification.status = :status', {
          status: filters.status,
        });
      }
      if (filters?.dateFrom) {
        queryBuilder.andWhere('notification.createdAt >= :dateFrom', {
          dateFrom: filters.dateFrom,
        });
      }
      if (filters?.dateTo) {
        queryBuilder.andWhere('notification.createdAt <= :dateTo', {
          dateTo: filters.dateTo,
        });
      }
      if (filters?.tags && filters.tags.length > 0) {
        // Use metadata field for tags since tags field doesn't exist
        queryBuilder.andWhere(
          'JSON_EXTRACT(notification.metadata, "$.tags") && :tags',
          { tags: filters.tags },
        );
      }

      // Get total count
      const total = await queryBuilder.getCount();

      // Apply pagination and get results
      const notifications = await queryBuilder
        .orderBy('notification.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      return {
        notifications,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get notification history for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Search notifications by content or metadata
   */
  async searchNotifications(
    userId: string,
    query: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    notifications: NotificationEntity[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const queryBuilder = this.notificationRepository
        .createQueryBuilder('notification')
        .where('notification.userId = :userId', { userId })
        .andWhere(
          '(notification.title ILIKE :query OR notification.message ILIKE :query OR notification.metadata::text ILIKE :query)',
          { query: `%${query}%` },
        );

      const total = await queryBuilder.getCount();

      const notifications = await queryBuilder
        .orderBy('notification.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit)
        .getMany();

      return {
        notifications,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(
        `Failed to search notifications for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
  /**
   * Bulk delete notifications
   */
  async bulkDeleteNotifications(
    userId: string,
    notificationIds: string[],
  ): Promise<{ deleted: number }> {
    try {
      // Convert string IDs to numbers
      const numericIds = notificationIds.map((id) => parseInt(id));

      const result = await this.notificationRepository
        .createQueryBuilder()
        .delete()
        .where('id IN (:...ids)', { ids: numericIds })
        .andWhere('userId = :userId', { userId })
        .execute();

      this.logger.log(
        `Bulk deleted ${result.affected} notifications for user ${userId}`,
      );
      return { deleted: result.affected || 0 };
    } catch (error) {
      this.logger.error(
        `Failed to bulk delete notifications for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Bulk archive notifications (mark as dismissed)
   */
  async bulkArchiveNotifications(
    userId: string,
    notificationIds: string[],
  ): Promise<{ archived: number }> {
    try {
      // Convert string IDs to numbers
      const numericIds = notificationIds.map((id) => parseInt(id));

      const result = await this.notificationRepository
        .createQueryBuilder()
        .update()
        .set({
          status: NotificationStatus.DISMISSED,
          dismissedAt: new Date(),
        })
        .where('id IN (:...ids)', { ids: numericIds })
        .andWhere('userId = :userId', { userId })
        .execute();

      this.logger.log(
        `Bulk archived ${result.affected} notifications for user ${userId}`,
      );
      return { archived: result.affected || 0 };
    } catch (error) {
      this.logger.error(
        `Failed to bulk archive notifications for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Export notifications to various formats
   */
  async exportNotifications(
    userId: string,
    format: 'json' | 'csv' = 'json',
    filters?: {
      type?: NotificationType;
      priority?: NotificationPriority;
      status?: NotificationStatus;
      dateFrom?: Date;
      dateTo?: Date;
    },
  ): Promise<{ data: any; filename: string; contentType: string }> {
    try {
      const queryBuilder = this.notificationRepository
        .createQueryBuilder('notification')
        .where('notification.userId = :userId', { userId });

      // Apply filters (same as history method)
      if (filters?.type) {
        queryBuilder.andWhere('notification.type = :type', {
          type: filters.type,
        });
      }
      if (filters?.priority) {
        queryBuilder.andWhere('notification.priority = :priority', {
          priority: filters.priority,
        });
      }
      if (filters?.status) {
        queryBuilder.andWhere('notification.status = :status', {
          status: filters.status,
        });
      }
      if (filters?.dateFrom) {
        queryBuilder.andWhere('notification.createdAt >= :dateFrom', {
          dateFrom: filters.dateFrom,
        });
      }
      if (filters?.dateTo) {
        queryBuilder.andWhere('notification.createdAt <= :dateTo', {
          dateTo: filters.dateTo,
        });
      }

      const notifications = await queryBuilder
        .orderBy('notification.createdAt', 'DESC')
        .getMany();

      const dateStr = new Date().toISOString().split('T')[0];

      if (format === 'json') {
        return {
          data: JSON.stringify(notifications, null, 2),
          filename: `notifications-${dateStr}.json`,
          contentType: 'application/json',
        };
      } else if (format === 'csv') {
        // Convert to CSV format
        const csvHeader =
          'ID,Type,Priority,Status,Title,Message,Created At,Read At,Dismissed At\n';
        const csvRows = notifications
          .map((n) => {
            const title = (n.title || '').replace(/"/g, '""');
            const message = (n.message || '').replace(/"/g, '""');
            const createdAt = n.createdAt?.toISOString() || '';
            const readAt = n.readAt?.toISOString() || '';
            const dismissedAt = n.dismissedAt?.toISOString() || '';
            return `"${n.id}","${n.type}","${n.priority}","${n.status}","${title}","${message}","${createdAt}","${readAt}","${dismissedAt}"`;
          })
          .join('\n');

        return {
          data: csvHeader + csvRows,
          filename: `notifications-${dateStr}.csv`,
          contentType: 'text/csv',
        };
      }

      throw new Error(`Unsupported export format: ${format}`);
    } catch (error) {
      this.logger.error(
        `Failed to export notifications for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Add tags to a notification
   */ async addTagsToNotification(
    userId: string,
    notificationId: string,
    tags: string[],
  ): Promise<NotificationEntity> {
    try {
      const notification = await this.notificationRepository.findOne({
        where: { id: parseInt(notificationId), userId },
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      // Use metadata field to store tags since tags field doesn't exist in entity
      const existingMetadata = notification.metadata || {};
      const existingTags = existingMetadata.tags || [];
      const uniqueTags = [...new Set([...existingTags, ...tags])];

      notification.metadata = {
        ...existingMetadata,
        tags: uniqueTags,
      };
      await this.notificationRepository.save(notification);

      this.logger.log(
        `Added tags to notification ${notificationId} for user ${userId}`,
      );
      return notification;
    } catch (error) {
      this.logger.error(
        `Failed to add tags to notification ${notificationId} for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
