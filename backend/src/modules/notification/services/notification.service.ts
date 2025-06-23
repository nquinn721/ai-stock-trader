import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { 
  NotificationEntity, 
  NotificationPreferenceEntity, 
  NotificationTemplateEntity,
  NotificationType,
  NotificationPriority,
  NotificationStatus,
  DeliveryChannel
} from '../entities/notification.entities';
import {
  CreateNotificationDto,
  NotificationFilter,
  NotificationPreference,
  TradingOpportunityAlert,
  PatternAlert,
  TechnicalAlert,
  RiskManagementAlert,
  MarketEventAlert,
  MultiTimeframeAlert,
  Stock,
  TradingSignal,
  AlertDetector,
  PatternDetectionResult,
  TechnicalIndicatorResult
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
  async createNotification(dto: CreateNotificationDto): Promise<NotificationEntity | null> {
    try {
      // Check user preferences
      const shouldSend = await this.shouldSendNotification(dto.userId, dto.type, dto.priority);
      if (!shouldSend) {
        this.logger.debug(`Notification blocked by user preferences: ${dto.type} for user ${dto.userId}`);
        return null;
      }

      // Create notification entity
      const notification = this.notificationRepository.create({
        ...dto,
        deliveryChannels: dto.deliveryChannels || [DeliveryChannel.IN_APP, DeliveryChannel.WEBSOCKET],
        triggeredAt: new Date(),
      });

      const saved = await this.notificationRepository.save(notification);
      this.logger.log(`Created notification ${saved.id} for user ${dto.userId}: ${dto.title}`);

      return saved;
    } catch (error) {
      this.logger.error(`Failed to create notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getNotifications(filter: NotificationFilter): Promise<{ notifications: NotificationEntity[]; total: number }> {
    try {
      const query = this.notificationRepository.createQueryBuilder('notification');

      if (filter.userId) {
        query.andWhere('notification.userId = :userId', { userId: filter.userId });
      }

      if (filter.type) {
        query.andWhere('notification.type = :type', { type: filter.type });
      }

      if (filter.priority) {
        query.andWhere('notification.priority = :priority', { priority: filter.priority });
      }

      if (filter.symbol) {
        query.andWhere('notification.symbol = :symbol', { symbol: filter.symbol });
      }

      if (filter.portfolioId) {
        query.andWhere('notification.portfolioId = :portfolioId', { portfolioId: filter.portfolioId });
      }

      if (filter.status) {
        query.andWhere('notification.status = :status', { status: filter.status });
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
      this.logger.error(`Failed to get notifications: ${error.message}`, error.stack);
      throw error;
    }
  }
  async markAsRead(notificationId: number, userId: string): Promise<boolean> {
    try {
      const result = await this.notificationRepository.update(
        { id: notificationId, userId },
        { 
          status: NotificationStatus.READ, 
          readAt: new Date() 
        }
      );

      return (result.affected ?? 0) > 0;
    } catch (error) {
      this.logger.error(`Failed to mark notification as read: ${error.message}`, error.stack);
      return false;
    }
  }
  async markAsDismissed(notificationId: number, userId: string): Promise<boolean> {
    try {
      const result = await this.notificationRepository.update(
        { id: notificationId, userId },
        { 
          status: NotificationStatus.DISMISSED, 
          dismissedAt: new Date() 
        }
      );

      return (result.affected ?? 0) > 0;
    } catch (error) {
      this.logger.error(`Failed to mark notification as dismissed: ${error.message}`, error.stack);
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
      this.logger.error(`Failed to get unread count: ${error.message}`, error.stack);
      return 0;
    }
  }

  // === Preference Management ===

  async getUserPreferences(userId: string): Promise<NotificationPreference[]> {
    try {
      const preferences = await this.preferenceRepository.find({
        where: { userId },
      });      return preferences.map(p => ({
        userId: p.userId,
        type: p.notificationType,
        enabled: p.enabled,
        deliveryChannels: p.deliveryChannels,
        minimumPriority: p.minimumPriority,
        customThresholds: p.customThresholds,
        quietHours: p.quietHours ? {
          enabled: p.quietHours,
          start: p.quietHoursStart || '',
          end: p.quietHoursEnd || '',
        } : undefined,
      }));
    } catch (error) {
      this.logger.error(`Failed to get user preferences: ${error.message}`, error.stack);
      return [];
    }
  }

  async updatePreference(userId: string, type: NotificationType, preference: Partial<NotificationPreference>): Promise<boolean> {
    try {
      const existing = await this.preferenceRepository.findOne({
        where: { userId, notificationType: type },
      });

      if (existing) {
        await this.preferenceRepository.update(existing.id, {
          enabled: preference.enabled ?? existing.enabled,
          deliveryChannels: preference.deliveryChannels ?? existing.deliveryChannels,
          minimumPriority: preference.minimumPriority ?? existing.minimumPriority,
          customThresholds: preference.customThresholds ?? existing.customThresholds,
          quietHours: preference.quietHours?.enabled ?? existing.quietHours,
          quietHoursStart: preference.quietHours?.start ?? existing.quietHoursStart,
          quietHoursEnd: preference.quietHours?.end ?? existing.quietHoursEnd,
        });
      } else {
        await this.preferenceRepository.save({
          userId,
          notificationType: type,
          enabled: preference.enabled ?? true,
          deliveryChannels: preference.deliveryChannels ?? [DeliveryChannel.IN_APP],
          minimumPriority: preference.minimumPriority ?? NotificationPriority.MEDIUM,
          customThresholds: preference.customThresholds,
          quietHours: preference.quietHours?.enabled ?? false,
          quietHoursStart: preference.quietHours?.start,
          quietHoursEnd: preference.quietHours?.end,
        });
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to update preference: ${error.message}`, error.stack);
      return false;
    }
  }

  // === Alert Generation ===

  async createTradingOpportunityAlert(userId: string, alert: TradingOpportunityAlert): Promise<NotificationEntity | null> {
    return await this.createNotification({
      userId,
      type: NotificationType.TRADING_OPPORTUNITY,
      priority: alert.confidenceScore >= 80 ? NotificationPriority.HIGH : 
               alert.confidenceScore >= 60 ? NotificationPriority.MEDIUM : NotificationPriority.LOW,
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

  async createPatternAlert(userId: string, alert: PatternAlert): Promise<NotificationEntity | null> {
    return await this.createNotification({
      userId,
      type: NotificationType.PATTERN_ALERT,
      priority: alert.strength >= 80 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
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

  async createTechnicalAlert(userId: string, alert: TechnicalAlert): Promise<NotificationEntity | null> {
    const priority = alert.severity === 'high' ? NotificationPriority.HIGH :
                    alert.severity === 'medium' ? NotificationPriority.MEDIUM : NotificationPriority.LOW;

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

  async createRiskManagementAlert(userId: string, alert: RiskManagementAlert): Promise<NotificationEntity | null> {
    return await this.createNotification({
      userId,
      type: NotificationType.RISK_MANAGEMENT,
      priority: alert.type === 'margin_call' ? NotificationPriority.CRITICAL : NotificationPriority.HIGH,
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

  async createMarketEventAlert(userId: string, alert: MarketEventAlert): Promise<NotificationEntity | null> {
    const priority = alert.severity === 'high' ? NotificationPriority.HIGH :
                    alert.severity === 'medium' ? NotificationPriority.MEDIUM : NotificationPriority.LOW;

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

  async createMultiTimeframeAlert(userId: string, alert: MultiTimeframeAlert): Promise<NotificationEntity | null> {
    return await this.createNotification({
      userId,
      type: NotificationType.MULTI_TIMEFRAME,
      priority: alert.confluence >= 80 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
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

  async detectAndCreateAlerts(stocks: Stock[], signals: TradingSignal[]): Promise<void> {
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
          const stockSignals = signals.filter(s => s.symbol === stock.symbol);
          
          // Run all alert detectors
          for (const [type, detector] of this.alertDetectors) {
            if (detector.isEnabled()) {
              const alerts = await detector.detect(stock, stockSignals);
              allAlerts.push(...alerts);
            }
          }

          // Custom detection logic for built-in alerts
          const builtInAlerts = await this.detectBuiltInAlerts(stock, stockSignals);
          allAlerts.push(...builtInAlerts);

        } catch (error) {
          this.logger.error(`Failed to detect alerts for ${stock.symbol}: ${error.message}`);
        }
      }

      // Create notifications in batch
      if (allAlerts.length > 0) {
        await this.createNotificationsBatch(allAlerts);
        this.logger.log(`Created ${allAlerts.length} alerts in ${Date.now() - startTime}ms`);
      }

    } catch (error) {
      this.logger.error(`Alert detection failed: ${error.message}`, error.stack);
    } finally {
      this.isProcessing = false;
    }
  }

  private async detectBuiltInAlerts(stock: Stock, signals: TradingSignal[]): Promise<CreateNotificationDto[]> {
    const alerts: CreateNotificationDto[] = [];
    const userId = 'default_user'; // For now, using default user

    try {
      // Price change alerts
      if (Math.abs(stock.changePercent) >= 5) {
        alerts.push({
          userId,
          type: NotificationType.MARKET_EVENT,
          priority: Math.abs(stock.changePercent) >= 10 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
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
      if (stock.volume && stock.volume > 1000000) { // Configurable threshold
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
            priority: signal.strength >= 85 ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
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
      this.logger.error(`Built-in alert detection failed for ${stock.symbol}: ${error.message}`);
    }

    return alerts;
  }

  private async createNotificationsBatch(alerts: CreateNotificationDto[]): Promise<void> {
    try {
      const notifications = alerts.map(alert => 
        this.notificationRepository.create({
          ...alert,
          deliveryChannels: alert.deliveryChannels || [DeliveryChannel.IN_APP, DeliveryChannel.WEBSOCKET],
          triggeredAt: new Date(),
        })
      );

      await this.notificationRepository.save(notifications);
    } catch (error) {
      this.logger.error(`Failed to create notifications batch: ${error.message}`, error.stack);
      throw error;
    }
  }

  // === Helper Methods ===

  private async shouldSendNotification(
    userId: string, 
    type: NotificationType, 
    priority?: NotificationPriority
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

      if (priority && this.isPriorityLower(priority, preference.minimumPriority)) {
        return false;
      }

      // Check quiet hours
      if (preference.quietHours && preference.quietHoursStart && preference.quietHoursEnd) {
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
      this.logger.error(`Error checking notification permission: ${error.message}`);
      return true; // Default to sending on error
    }
  }

  private isPriorityLower(priority: NotificationPriority, minimum: NotificationPriority): boolean {
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
          messageTemplate: '{reason} | Price: ${currentPrice} | Confidence: {confidenceScore}%',
        },
        {
          type: NotificationType.TECHNICAL_ALERT,
          name: 'Technical Indicator',
          titleTemplate: 'Technical Alert: {indicatorName} - {symbol}',
          messageTemplate: '{alertType} detected. Current: {currentValue}, Threshold: {threshold}',
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
      this.logger.error(`Failed to initialize default templates: ${error.message}`);
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
      this.logger.error(`Failed to cleanup old notifications: ${error.message}`, error.stack);
      return 0;
    }
  }
}
