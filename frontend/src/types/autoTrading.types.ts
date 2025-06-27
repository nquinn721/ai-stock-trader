// Automated Trading Type Definitions for S30D - Updated for New Backend
export interface TradingRule {
  id: string;
  portfolio_id: string; // Backend uses snake_case
  name: string;
  description?: string;
  is_active: boolean; // Backend uses snake_case
  priority: number;
  rule_type: "entry" | "exit" | "risk"; // Backend uses snake_case
  conditions: RuleCondition[];
  actions: RuleAction[];
  last_triggered?: Date;
  performance?: RulePerformance;
  created_at: Date; // Backend uses snake_case
  updated_at: Date; // Backend uses snake_case
}

// Frontend display interface (camelCase for UI)
export interface TradingRuleDisplay {
  id: string;
  portfolioId: string;
  name: string;
  description?: string;
  isActive: boolean;
  priority: number;
  ruleType: "entry" | "exit" | "risk";
  conditions: RuleCondition[];
  actions: RuleAction[];
  lastTriggered?: Date;
  performance?: RulePerformance;
  createdAt: Date;
  updatedAt: Date;
}

export interface RulePerformance {
  totalTrades: number;
  successfulTrades: number;
  totalPnL: number;
  successRate: number;
  averagePnL: number;
}

export interface RuleCondition {
  id?: string; // Optional ID for frontend use
  field: string;
  operator: "equals" | "greater_than" | "less_than" | "greater_equal" | "less_equal" | "not_equals";
  value: any;
  logical?: "AND" | "OR"; // Backend uses 'logical' not 'logicalOperator'
  logicalOperator?: "AND" | "OR"; // Frontend alias for compatibility
}

export interface RuleAction {
  id?: string; // Optional ID for frontend use
  type: "buy" | "sell";
  sizing_method?: "fixed" | "percentage" | "full_position" | "kelly"; // Backend structure
  size_value?: number;
  price_type?: "market" | "limit" | "stop";
  price_offset?: number;
  parameters?: { // Frontend compatibility structure
    sizingMethod?: "fixed" | "percentage" | "full_position" | "kelly";
    sizeValue?: number;
    maxPositionSize?: number;
    priceType?: "market" | "limit" | "stop";
    priceOffset?: number;
  };
}

export interface TradingSession {
  id: string;
  portfolio_id: string; // Backend uses snake_case
  session_name: string; // Backend uses session_name
  is_active: boolean; // Backend uses boolean instead of status string
  start_time: Date; // Backend uses snake_case
  end_time?: Date; // Backend uses snake_case
  stop_reason?: string; // Backend field
  config?: any; // Backend has generic config
  created_at: Date;
}

// Frontend display interface
export interface TradingSessionDisplay {
  id: string;
  portfolioId: string;
  name: string;
  status: "active" | "stopped" | "paused";
  startedAt: Date;
  stoppedAt?: Date;
  stopReason?: string;
  config?: any;
  createdAt: Date;
}

// Simplified config for new backend
export interface TradingConfig {
  maxRisk?: number;
  maxDailyLoss?: number;
  maxPositions?: number;
  emergencyStop?: boolean;
  notificationSettings?: {
    onTrade: boolean;
    onError: boolean;
    onThreshold: boolean;
  };
}

// Legacy config interface for backward compatibility
export interface TradingConfigLegacy {
  maxConcurrentTrades: number;
  riskPerTrade: number;
  maxDailyLoss: number;
  maxPositionSize?: number;
  maxDailyTrades?: number;
  riskLevel?: "low" | "medium" | "high";
  allowedTradingHours?: {
    start: string;
    end: string;
  };
  enableAfterHours?: boolean;
  emergencyStopLoss: number;
  autoRebalance: boolean;
}

export interface SessionPerformance {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnL: number;
  dailyPnL: number;
  winRate: number;
  successRate: number; // Adding for compatibility
  averageWin: number;
  averageLoss: number;
  averagePnL: number; // Adding for compatibility
  maxDrawdown: number;
  sharpeRatio: number;
}

export interface AutoTrade {
  id: string;
  portfolio_id: string; // Backend uses snake_case
  rule_id?: string; // Backend uses snake_case, optional
  symbol: string;
  trade_type: "buy" | "sell"; // Backend uses trade_type
  quantity: number;
  target_price?: number; // Backend uses target_price
  executed_price?: number; // Backend uses snake_case
  status: "pending" | "executed" | "failed"; // Backend statuses
  error_message?: string; // Backend uses error_message
  created_at: Date; // Backend uses snake_case
  executed_at?: Date; // Backend uses snake_case
}

// Frontend display interface
export interface AutoTradeDisplay {
  id: string;
  portfolioId: string;
  ruleId?: string;
  symbol: string;
  type: "buy" | "sell";
  quantity: number;
  targetPrice?: number;
  executedPrice?: number;
  status: "pending" | "executed" | "failed";
  errorMessage?: string;
  createdAt: Date;
  executedAt?: Date;
  ruleName?: string; // For display purposes
  pnl?: number; // Calculated field
}

export interface TradingPerformance {
  totalActiveSessions: number;
  globalPnL: number;
  dailyPnL: number;
  totalTrades: number;
  winRate: number;
  bestPerformingRule: {
    id: string;
    name: string;
    pnl: number;
  };
  worstPerformingRule: {
    id: string;
    name: string;
    pnl: number;
  };
  riskMetrics: {
    currentDrawdown: number;
    maxDrawdown: number;
    volatility: number;
  };
}

export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category:
    | "trend_following"
    | "mean_reversion"
    | "momentum"
    | "risk_management";
  difficulty: "beginner" | "intermediate" | "advanced";
  ruleDefinition: {
    name: string;
    description?: string;
    isActive: boolean;
    priority: number;
    ruleType: "entry" | "exit" | "risk";
    conditions: RuleCondition[];
    actions: RuleAction[];
  };
}

export interface CreateTradingRuleDto {
  portfolio_id: string; // Backend uses snake_case
  name: string;
  description?: string;
  rule_type: "entry" | "exit" | "risk"; // Backend uses snake_case
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority?: number;
  is_active?: boolean;
}

// Frontend DTO (camelCase for forms)
export interface CreateTradingRuleDtoDisplay {
  portfolioId: string;
  name: string;
  description?: string;
  ruleType: "entry" | "exit" | "risk";
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority?: number;
  isActive?: boolean;
}

export interface TradingContext {
  symbol: string;
  currentPrice: number;
  marketData: {
    volume: number;
    volatility: number;
    rsi: number;
    macd: number;
    sentiment: number;
  };
  portfolioContext: {
    cashBalance: number;
    totalValue: number;
    positions: Array<{
      symbol: string;
      quantity: number;
      averagePrice: number;
      currentValue: number;
    }>;
  };
  aiRecommendation?: {
    signal: "buy" | "sell" | "hold";
    confidence: number;
    reasoning: string;
  };
}

// Trading Session DTO for backend
export interface TradingSessionDto {
  session_name: string;
  config?: any;
}

export interface TradingSessionDtoDisplay {
  sessionName: string;
  config?: any;
}

// Session status response from backend
export interface SessionStatusResponse {
  session: TradingSession;
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  pendingTrades: number;
}

// Trading performance response
export interface TradingHistoryResponse {
  trades: AutoTrade[];
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  totalPnL: number;
}

// Session performance response
export interface SessionPerformanceResponse {
  session: TradingSession;
  trades: AutoTrade[];
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  totalPnL: number;
  winRate: number;
}

export interface TradingAlert {
  id: string;
  type: "rule_triggered" | "trade_executed" | "risk_limit" | "session_stopped";
  severity: "info" | "warning" | "error";
  title: string;
  message: string;
  portfolioId?: string;
  data?: any;
  timestamp: Date;
  acknowledged: boolean;
}

export interface EmergencyStopConfig {
  maxDrawdownPercent: number;
  maxDailyLossPercent: number;
  consecutiveLossLimit: number;
  enabled: boolean;
}

// Utility functions for data transformation
export const transformTradingRuleToDisplay = (rule: TradingRule): TradingRuleDisplay => ({
  id: rule.id,
  portfolioId: rule.portfolio_id,
  name: rule.name,
  description: rule.description,
  isActive: rule.is_active,
  priority: rule.priority,
  ruleType: rule.rule_type,
  conditions: rule.conditions,
  actions: rule.actions,
  lastTriggered: rule.last_triggered,
  performance: rule.performance,
  createdAt: rule.created_at,
  updatedAt: rule.updated_at,
});

export const transformTradingSessionToDisplay = (session: TradingSession): TradingSessionDisplay => ({
  id: session.id,
  portfolioId: session.portfolio_id,
  name: session.session_name,
  status: session.is_active ? "active" : "stopped",
  startedAt: session.start_time,
  stoppedAt: session.end_time,
  stopReason: session.stop_reason,
  config: session.config,
  createdAt: session.created_at,
});

export const transformAutoTradeToDisplay = (trade: AutoTrade): AutoTradeDisplay => ({
  id: trade.id,
  portfolioId: trade.portfolio_id,
  ruleId: trade.rule_id,
  symbol: trade.symbol,
  type: trade.trade_type,
  quantity: trade.quantity,
  targetPrice: trade.target_price,
  executedPrice: trade.executed_price,
  status: trade.status,
  errorMessage: trade.error_message,
  createdAt: trade.created_at,
  executedAt: trade.executed_at,
  ruleName: undefined, // Will be populated by frontend
  pnl: undefined, // Will be calculated by frontend
});

export const transformCreateRuleDtoToBackend = (dto: CreateTradingRuleDtoDisplay): CreateTradingRuleDto => ({
  portfolio_id: dto.portfolioId,
  name: dto.name,
  description: dto.description,
  rule_type: dto.ruleType,
  conditions: dto.conditions,
  actions: dto.actions,
  priority: dto.priority,
  is_active: dto.isActive ?? true,
});

export const transformSessionDtoToBackend = (dto: TradingSessionDtoDisplay): TradingSessionDto => ({
  session_name: dto.sessionName,
  config: dto.config,
});
