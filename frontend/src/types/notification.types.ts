// Notification types for frontend
export interface Notification {
  id: number;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  symbol?: string;
  portfolioId?: number;
  metadata?: Record<string, any>;
  status: NotificationStatus;
  deliveryChannels: DeliveryChannel[];
  confidenceScore?: number;
  timeframe?: string;
  triggeredAt: Date;
  expiresAt?: Date;
  readAt?: Date;
  dismissedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum NotificationType {
  TRADING_OPPORTUNITY = "trading_opportunity",
  PATTERN_ALERT = "pattern_alert",
  TECHNICAL_ALERT = "technical_alert",
  RISK_MANAGEMENT = "risk_management",
  MARKET_EVENT = "market_event",
  MULTI_TIMEFRAME = "multi_timeframe",
  ORDER_EVENT = "order_event",
  PORTFOLIO_UPDATE = "portfolio_update",
}

export enum NotificationPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum NotificationStatus {
  PENDING = "pending",
  SENT = "sent",
  READ = "read",
  DISMISSED = "dismissed",
  FAILED = "failed",
}

export enum DeliveryChannel {
  IN_APP = "in_app",
  WEBSOCKET = "websocket",
  EMAIL = "email",
  PUSH = "push",
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

export interface NotificationFilter {
  userId?: string;
  type?: NotificationType;
  priority?: NotificationPriority;
  symbol?: string;
  portfolioId?: number;
  status?: NotificationStatus;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

export interface CreateNotificationRequest {
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

// WebSocket notification events
export interface NotificationWebSocketEvent {
  type:
    | "new_notification"
    | "status_update"
    | "unread_count_update"
    | "bulk_notifications"
    | "system_alert";
  data: any;
  timestamp: string;
}

// Alert-specific interfaces
export interface TradingOpportunityAlert {
  type: "buy_signal" | "sell_signal" | "hold_signal";
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
  type:
    | "breakout_confirmed"
    | "pattern_completion"
    | "support_break"
    | "resistance_break";
  symbol: string;
  patternName: string;
  currentPrice: number;
  keyLevel: number;
  direction: "bullish" | "bearish";
  strength: number;
  timeframe: string;
}

export interface TechnicalAlert {
  type:
    | "rsi_overbought"
    | "rsi_oversold"
    | "macd_crossover"
    | "bb_squeeze"
    | "volume_spike";
  symbol: string;
  indicatorName: string;
  currentValue: number;
  threshold: number;
  severity: "low" | "medium" | "high";
  timeframe: string;
}

export interface RiskManagementAlert {
  type:
    | "stop_loss_trigger"
    | "take_profit_target"
    | "position_size_alert"
    | "margin_call";
  symbol: string;
  portfolioId: number;
  currentPrice: number;
  triggerPrice: number;
  positionSize: number;
  riskAmount: number;
  action: "reduce_position" | "close_position" | "add_margin";
}

export interface MarketEventAlert {
  type:
    | "news_sentiment_change"
    | "earnings_announcement"
    | "analyst_upgrade"
    | "analyst_downgrade";
  symbol: string;
  event: string;
  impact: "positive" | "negative" | "neutral";
  severity: "low" | "medium" | "high";
  source: string;
  url?: string;
}

export interface MultiTimeframeAlert {
  type: "scalping_opportunity" | "momentum_shift" | "trend_change";
  symbol: string;
  timeframes: string[];
  signals: { timeframe: string; signal: string; strength: number }[];
  confluence: number; // How many timeframes agree (0-100)
  primaryTimeframe: string;
}
