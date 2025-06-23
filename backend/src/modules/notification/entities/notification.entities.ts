import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum NotificationType {
  TRADING_OPPORTUNITY = 'trading_opportunity',
  PATTERN_ALERT = 'pattern_alert',
  TECHNICAL_ALERT = 'technical_alert',
  RISK_MANAGEMENT = 'risk_management',
  MARKET_EVENT = 'market_event',
  MULTI_TIMEFRAME = 'multi_timeframe',
  ORDER_EVENT = 'order_event',
  PORTFOLIO_UPDATE = 'portfolio_update',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  READ = 'read',
  DISMISSED = 'dismissed',
  FAILED = 'failed',
}

export enum DeliveryChannel {
  IN_APP = 'in_app',
  WEBSOCKET = 'websocket',
  EMAIL = 'email',
  PUSH = 'push',
}

@Entity('notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  userId: string; // User identifier (for future multi-user support)

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  priority: NotificationPriority;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  symbol: string; // Associated stock symbol

  @Column({ type: 'int', nullable: true })
  portfolioId: number; // Associated portfolio

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>; // Additional data (prices, thresholds, etc.)

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING,
  })
  status: NotificationStatus;
  @Column({ type: 'json', nullable: true })
  deliveryChannels: DeliveryChannel[]; // Which channels to deliver through

  @Column({ type: 'json', nullable: true })
  deliveryStatus: Record<
    DeliveryChannel,
    { sent: boolean; sentAt?: Date; error?: string }
  >; // Delivery tracking

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  confidenceScore: number; // For trading opportunities (0-100)

  @Column({ type: 'varchar', length: 50, nullable: true })
  timeframe: string; // For multi-timeframe alerts (1m, 5m, 1h, etc.)

  @Column({ type: 'timestamp', nullable: true })
  triggeredAt: Date; // When the condition was triggered

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date; // When this notification becomes irrelevant

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date; // When user read the notification

  @Column({ type: 'timestamp', nullable: true })
  dismissedAt: Date; // When user dismissed the notification

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('notification_preferences')
export class NotificationPreferenceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  userId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  notificationType: NotificationType;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;
  @Column({ type: 'json', nullable: true })
  deliveryChannels: DeliveryChannel[];

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  minimumPriority: NotificationPriority;

  @Column({ type: 'json', nullable: true })
  customThresholds: Record<string, any>; // Custom alert thresholds

  @Column({ type: 'boolean', default: false })
  quietHours: boolean; // Respect quiet hours

  @Column({ type: 'time', nullable: true })
  quietHoursStart: string; // e.g., "22:00"

  @Column({ type: 'time', nullable: true })
  quietHoursEnd: string; // e.g., "08:00"

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity('notification_templates')
export class NotificationTemplateEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  titleTemplate: string; // Template with placeholders like {symbol}, {price}

  @Column({ type: 'text' })
  messageTemplate: string; // Template with placeholders

  @Column({ type: 'json', nullable: true })
  defaultMetadata: Record<string, any>; // Default values for template variables

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
