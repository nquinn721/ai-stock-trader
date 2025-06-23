// Types will be defined locally since backend types are different from frontend
export interface Stock {
  id: number;
  symbol: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  high?: number;
  low?: number;
  [key: string]: any;
}

export interface TradingSignal {
  id: number;
  symbol: string;
  signal: 'buy' | 'sell' | 'hold';
  strength: number;
  price: number;
  timestamp: Date;
  reason: string;
  [key: string]: any;
}
import { 
  DeliveryChannel, 
  NotificationPriority, 
  NotificationType 
} from '../entities/notification.entities';

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  priority?: NotificationPriority;
  title: string;
  message: string;
  symbol?: string;
  portfolioId?: number;
  metadata?: Record<string, any>;
  deliveryChannels?: DeliveryChannel[];
  confidenceScore?: number;
  timeframe?: string;
  expiresAt?: Date;
}

export interface NotificationFilter {
  userId?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  symbol?: string;
  portfolioId?: number;
  status?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export interface TradingOpportunityAlert {
  type: 'buy_signal' | 'sell_signal' | 'hold_signal';
  symbol: string;
  currentPrice: number;
  targetPrice?: number;
  stopLoss?: number;
  confidenceScore: number;
  reason: string;
  timeframe: string;
  expiry?: Date;
}

export interface PatternAlert {
  type: 'breakout_confirmed' | 'pattern_completion' | 'support_break' | 'resistance_break';
  symbol: string;
  patternName: string;
  currentPrice: number;
  keyLevel: number;
  direction: 'bullish' | 'bearish';
  strength: number;
  timeframe: string;
}

export interface TechnicalAlert {
  type: 'rsi_overbought' | 'rsi_oversold' | 'macd_crossover' | 'bb_squeeze' | 'volume_spike';
  symbol: string;
  indicatorName: string;
  currentValue: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high';
  timeframe: string;
}

export interface RiskManagementAlert {
  type: 'stop_loss_trigger' | 'take_profit_target' | 'position_size_alert' | 'margin_call';
  symbol: string;
  portfolioId: number;
  currentPrice: number;
  triggerPrice: number;
  positionSize: number;
  riskAmount: number;
  action: 'reduce_position' | 'close_position' | 'add_margin';
}

export interface MarketEventAlert {
  type: 'news_sentiment_change' | 'earnings_announcement' | 'analyst_upgrade' | 'analyst_downgrade';
  symbol: string;
  event: string;
  impact: 'positive' | 'negative' | 'neutral';
  severity: 'low' | 'medium' | 'high';
  source: string;
  url?: string;
}

export interface MultiTimeframeAlert {
  type: 'scalping_opportunity' | 'momentum_shift' | 'trend_change';
  symbol: string;
  timeframes: string[];
  signals: { timeframe: string; signal: string; strength: number }[];
  confluence: number; // How many timeframes agree (0-100)
  primaryTimeframe: string;
}

export interface NotificationPreference {
  userId: string;
  type: NotificationType;
  enabled: boolean;
  deliveryChannels: DeliveryChannel[];
  minimumPriority: NotificationPriority;
  customThresholds?: Record<string, any>;
  quietHours?: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

export interface AlertCondition {
  id: string;
  userId: string;
  type: NotificationType;
  symbol?: string;
  condition: Record<string, any>; // Flexible condition object
  isActive: boolean;
  lastTriggered?: Date;
  triggerCount: number;
}

export interface NotificationEngineConfig {
  batchSize: number;
  processingInterval: number;
  retryAttempts: number;
  retryDelay: number;
  maxNotificationsPerUser: number;
  cleanupAfterDays: number;
}

// Alert detection interfaces
export interface AlertDetector {
  detect(stock: Stock, signals: TradingSignal[]): Promise<CreateNotificationDto[]>;
  getType(): NotificationType;
  isEnabled(): boolean;
}

export interface PatternDetectionResult {
  detected: boolean;
  patternType: string;
  strength: number;
  keyLevels: number[];
  direction: 'bullish' | 'bearish';
  timeframe: string;
}

export interface TechnicalIndicatorResult {
  indicator: string;
  value: number;
  signal: 'buy' | 'sell' | 'neutral';
  strength: number;
  overbought?: boolean;
  oversold?: boolean;
}

export interface SentimentAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number; // -1 to 1
  source: string;
  confidence: number;
  keywords: string[];
}

// WebSocket notification events
export interface NotificationEvent {
  event: 'notification_created' | 'notification_updated' | 'notification_read' | 'notification_dismissed';
  data: {
    notificationId: number;
    userId: string;
    notification?: any;
    timestamp: Date;
  };
}

export interface BulkNotificationEvent {
  event: 'bulk_notifications';
  data: {
    userId: string;
    notifications: any[];
    total: number;
    timestamp: Date;
  };
}
