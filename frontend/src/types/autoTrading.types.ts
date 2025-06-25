// Automated Trading Type Definitions for S30D
export interface TradingRule {
  id: string;
  portfolioId: string;
  name: string;
  description?: string;
  isActive: boolean;
  priority: number;
  ruleType: "entry" | "exit" | "risk";
  conditions: RuleCondition[];
  actions: RuleAction[];
  lastTriggered?: Date; // Adding for tracking
  performance?: RulePerformance; // Adding for performance tracking
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
  id: string;
  field: string;
  operator: "equals" | "greater_than" | "less_than" | "contains" | "not_equals";
  value: any;
  logicalOperator?: "AND" | "OR";
}

export interface RuleAction {
  id: string;
  type: "buy" | "sell" | "notify" | "stop_loss" | "take_profit";
  parameters: {
    sizingMethod?: "fixed" | "percentage" | "kelly_criterion";
    sizeValue?: number;
    maxPositionSize?: number;
    limitPrice?: number;
    stopPrice?: number;
  };
}

export interface TradingSession {
  id: string;
  portfolioId: string;
  name: string;
  status: "active" | "paused" | "stopped" | "error";
  startedAt: Date;
  startTime: Date; // Adding for compatibility
  stoppedAt?: Date;
  configuration: TradingConfig;
  performance: SessionPerformance;
  activeRules: string[]; // Rule IDs
  tradesExecuted?: number; // Adding for display
  lastTradeTime?: Date; // Adding for display
}

export interface TradingConfig {
  maxConcurrentTrades: number;
  riskPerTrade: number;
  maxDailyLoss: number;
  maxPositionSize?: number; // Adding for position sizing
  maxDailyTrades?: number; // Adding for trade limiting
  riskLevel?: "low" | "medium" | "high"; // Adding risk level
  allowedTradingHours?: {
    start: string; // HH:mm format
    end: string;
  };
  allowedMarketHours?: {
    // Alternative name for compatibility
    start: string;
    end: string;
    timezone: string;
  };
  enableAfterHours?: boolean; // Adding after hours trading
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
  sessionId: string;
  ruleId: string;
  portfolioId: string;
  symbol: string;
  type: "buy" | "sell";
  action: "buy" | "sell"; // Adding for compatibility
  quantity: number;
  triggerPrice: number;
  price: number; // Adding for compatibility
  executedPrice?: number;
  status: "pending" | "executed" | "cancelled" | "failed";
  reason: string;
  ruleName?: string; // Adding rule name for display
  executedAt?: Date;
  createdAt: Date;
  pnl?: number;
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
  ruleDefinition: Omit<
    TradingRule,
    "id" | "portfolioId" | "createdAt" | "updatedAt"
  >;
}

export interface CreateTradingRuleDto {
  portfolioId: string;
  name: string;
  description?: string;
  ruleType: "entry" | "exit" | "risk";
  conditions: Omit<RuleCondition, "id">[];
  actions: Omit<RuleAction, "id">[];
  priority?: number;
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

export interface TradingAlert {
  id: string;
  type: "rule_triggered" | "trade_executed" | "risk_limit" | "session_stopped";
  severity: "info" | "warning" | "error";
  title: string;
  message: string;
  portfolioId?: string; // Adding for filtering
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
