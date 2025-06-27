import axios from "axios";
import {
  AutoTrade,
  CreateTradingRuleDto,
  SessionPerformanceResponse,
  SessionStatusResponse,
  TradingHistoryResponse,
  TradingRule,
  TradingSession,
  TradingSessionDto,
} from "../types/autoTrading.types";

// Import autonomous trading types
export interface DeploymentConfig {
  mode: "paper" | "live";
  portfolioId: string;
  initialCapital: number;
  maxPositions: number;
  executionFrequency: "minute" | "hour" | "daily";
  symbols?: string[];
  riskLimits: {
    maxDrawdown: number;
    maxPositionSize: number;
    dailyLossLimit: number;
    correlationLimit: number;
  };
  notifications: {
    enabled: boolean;
    onTrade: boolean;
    onError: boolean;
    onRiskBreach: boolean;
    email?: string;
    webhook?: string;
  };
}

export interface StrategyInstance {
  id: string;
  strategyId: string;
  status: "running" | "paused" | "stopped" | "error";
  startedAt: Date;
  performance: InstancePerformance;
  errorCount: number;
  lastError?: string;
  strategy?: {
    name: string;
    description: string;
  };
}

export interface InstancePerformance {
  totalReturn: number;
  dailyReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  currentDrawdown: number;
  winRate: number;
  totalTrades: number;
  profitableTrades: number;
  currentValue: number;
  unrealizedPnL: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface Portfolio {
  id: string;
  name: string;
  currentCash: number;
  totalValue: number;
  isActive: boolean;
  portfolioType: string;
  assignedStrategy?: string;
  assignedStrategyName?: string;
  strategyAssignedAt?: Date;
}

export interface PortfolioPerformance {
  portfolioId: string;
  portfolioName: string;
  currentValue: number;
  cash: number;
  totalReturn: number;
  totalPnL: number;
  dayTradingEnabled: boolean;
  dayTradeCount: number;
}

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3001";

// Create axios instance for auto-trading API
const autoTradingApi = axios.create({
  baseURL: `${API_BASE_URL}/auto-trading`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for auth (if needed)
autoTradingApi.interceptors.request.use((config) => {
  // Add auth token if available
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
autoTradingApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("Auto-trading API error:", error);
    throw error;
  }
);

class AutoTradingService {
  // Trading Rules Management
  async createTradingRule(
    ruleData: CreateTradingRuleDto
  ): Promise<TradingRule> {
    const response = await autoTradingApi.post("/rules", ruleData);
    return response.data;
  }

  async getTradingRules(portfolioId: string): Promise<TradingRule[]> {
    const response = await autoTradingApi.get(`/rules/${portfolioId}`);
    return response.data;
  }

  async updateTradingRule(
    ruleId: string,
    updates: Partial<TradingRule>
  ): Promise<TradingRule> {
    const response = await autoTradingApi.put(`/rules/${ruleId}`, updates);
    return response.data;
  }

  async deleteTradingRule(ruleId: string): Promise<void> {
    await autoTradingApi.delete(`/rules/${ruleId}`);
  }

  async activateRule(ruleId: string): Promise<void> {
    await autoTradingApi.post(`/rules/${ruleId}/activate`);
  }

  async deactivateRule(ruleId: string): Promise<void> {
    await autoTradingApi.post(`/rules/${ruleId}/deactivate`);
  }

  // Trading Sessions Management
  async startTradingSession(
    portfolioId: string,
    sessionData: TradingSessionDto
  ): Promise<TradingSession> {
    const response = await autoTradingApi.post(
      `/sessions/${portfolioId}/start`,
      sessionData
    );
    return response.data;
  }

  async stopTradingSession(sessionId: string, reason?: string): Promise<void> {
    await autoTradingApi.post(`/sessions/${sessionId}/stop`, { reason });
  }

  async getTradingSessions(portfolioId: string): Promise<TradingSession[]> {
    const response = await autoTradingApi.get(`/sessions/${portfolioId}`);
    return response.data;
  }

  async getSessionStatus(sessionId: string): Promise<SessionStatusResponse> {
    const response = await autoTradingApi.get(`/sessions/${sessionId}/status`);
    return response.data;
  }

  async getSessionPerformance(
    sessionId: string
  ): Promise<SessionPerformanceResponse> {
    const response = await autoTradingApi.get(
      `/sessions/${sessionId}/performance`
    );
    return response.data;
  }

  async getActiveSessions(): Promise<TradingSession[]> {
    const response = await autoTradingApi.get("/sessions/active");
    return response.data;
  }

  // Trade Management
  async getAutoTrades(
    portfolioId: string,
    filters?: any
  ): Promise<AutoTrade[]> {
    const response = await autoTradingApi.get(`/trades/${portfolioId}`, {
      params: filters,
    });
    return response.data;
  }

  async getTradeDetails(tradeId: string): Promise<AutoTrade | null> {
    const response = await autoTradingApi.get(`/trades/details/${tradeId}`);
    return response.data;
  }

  async cancelTrade(tradeId: string): Promise<boolean> {
    const response = await autoTradingApi.post(`/trades/${tradeId}/cancel`);
    return response.data;
  }

  async getTradingHistory(
    portfolioId: string
  ): Promise<TradingHistoryResponse> {
    const response = await autoTradingApi.get(`/history/${portfolioId}`);
    return response.data;
  }

  // Global Controls (if implemented in backend)
  async startGlobalTrading(): Promise<void> {
    try {
      await autoTradingApi.post("/global/start");
    } catch (error) {
      console.warn("Global trading controls not implemented in backend");
      throw new Error("Global trading controls not available");
    }
  }

  async stopGlobalTrading(): Promise<void> {
    try {
      await autoTradingApi.post("/global/stop");
    } catch (error) {
      console.warn("Global trading controls not implemented in backend");
      throw new Error("Global trading controls not available");
    }
  }

  async pauseGlobalTrading(): Promise<void> {
    try {
      await autoTradingApi.post("/global/pause");
    } catch (error) {
      console.warn("Global trading controls not implemented in backend");
      throw new Error("Global trading controls not available");
    }
  }

  async triggerEmergencyStop(): Promise<void> {
    try {
      await autoTradingApi.post("/emergency-stop");
    } catch (error) {
      console.warn("Emergency stop not implemented in backend");
      throw new Error("Emergency stop not available");
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await autoTradingApi.get("/health");
    return response.data;
  }

  // =================================================================
  // AUTONOMOUS TRADING METHODS
  // =================================================================

  // Strategy Deployment and Management
  async deployStrategy(
    strategyId: string,
    deploymentConfig: DeploymentConfig,
    userId: string = "demo-user"
  ): Promise<ApiResponse<StrategyInstance>> {
    try {
      const response = await autoTradingApi.post(
        `/autonomous/${strategyId}/deploy?userId=${userId}`,
        deploymentConfig
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as StrategyInstance,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async stopStrategy(
    strategyId: string,
    userId: string = "demo-user"
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await autoTradingApi.put(
        `/autonomous/${strategyId}/stop?userId=${userId}`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: { message: "" },
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async pauseStrategy(
    strategyId: string,
    userId: string = "demo-user"
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await autoTradingApi.put(
        `/autonomous/${strategyId}/pause?userId=${userId}`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: { message: "" },
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async resumeStrategy(
    strategyId: string,
    userId: string = "demo-user"
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await autoTradingApi.put(
        `/autonomous/${strategyId}/resume?userId=${userId}`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: { message: "" },
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async getRunningStrategies(
    userId: string = "demo-user"
  ): Promise<ApiResponse<StrategyInstance[]>> {
    try {
      const response = await autoTradingApi.get(
        `/autonomous/strategies?userId=${userId}`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async getStrategyStatus(
    strategyId: string,
    userId: string = "demo-user"
  ): Promise<ApiResponse<StrategyInstance>> {
    try {
      const response = await autoTradingApi.get(
        `/autonomous/${strategyId}/status?userId=${userId}`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as StrategyInstance,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async getPerformanceMetrics(
    strategyId: string,
    userId: string = "demo-user"
  ): Promise<ApiResponse<InstancePerformance>> {
    try {
      const response = await autoTradingApi.get(
        `/autonomous/${strategyId}/performance?userId=${userId}`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as InstancePerformance,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async getActiveStrategies(): Promise<ApiResponse<StrategyInstance[]>> {
    try {
      const response = await autoTradingApi.get(`/autonomous/strategies`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: [],
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // Portfolio Management for Autonomous Trading
  async getAvailablePortfolios(): Promise<{
    success: boolean;
    data?: Portfolio[];
    error?: string;
  }> {
    try {
      const response = await autoTradingApi.get(`/autonomous/portfolios`);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch portfolios:", error);
      return { success: false, error: "Failed to fetch portfolios" };
    }
  }

  async getPortfolioPerformance(portfolioId: string): Promise<{
    success: boolean;
    data?: PortfolioPerformance;
    error?: string;
  }> {
    try {
      const response = await autoTradingApi.get(
        `/autonomous/portfolios/${portfolioId}/performance`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to fetch portfolio performance:", error);
      return { success: false, error: "Failed to fetch portfolio performance" };
    }
  }

  async assignRandomStrategy(portfolioId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
    message?: string;
  }> {
    try {
      const response = await autoTradingApi.post(
        `/autonomous/portfolios/${portfolioId}/assign-random-strategy`
      );
      return response.data;
    } catch (error: any) {
      console.error("Failed to assign random strategy:", error);
      return {
        success: false,
        error:
          error.response?.data?.message || "Failed to assign random strategy",
      };
    }
  }

  // Utility methods for data transformation
  transformRuleForBackend(rule: any): CreateTradingRuleDto {
    return {
      portfolio_id: rule.portfolioId,
      name: rule.name,
      description: rule.description,
      rule_type: rule.ruleType,
      conditions: rule.conditions.map((condition: any) => ({
        field: condition.field,
        operator: condition.operator,
        value: condition.value,
        logical: condition.logicalOperator || condition.logical,
      })),
      actions: rule.actions.map((action: any) => ({
        type: action.type,
        sizing_method:
          action.sizingMethod || action.sizing_method || "percentage",
        size_value: action.sizeValue || action.size_value || 5,
        price_type: action.priceType || action.price_type || "market",
        price_offset: action.priceOffset || action.price_offset || 0,
      })),
      priority: rule.priority || 0,
      is_active: rule.isActive !== undefined ? rule.isActive : true,
    };
  }

  transformSessionForBackend(session: any): TradingSessionDto {
    return {
      session_name: session.sessionName || session.name,
      config: session.config || {},
    };
  }

  // Performance metrics aggregation (client-side until backend implements)
  calculatePerformanceMetrics(trades: AutoTrade[]) {
    const executedTrades = trades.filter((t) => t.status === "executed");
    const totalTrades = executedTrades.length;

    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        successfulTrades: 0,
        failedTrades: 0,
        winRate: 0,
        totalPnL: 0,
        averagePnL: 0,
      };
    }

    // This is a simplified calculation - would need real P&L data
    const mockPnL = executedTrades.map(() => (Math.random() - 0.5) * 100);
    const successfulTrades = mockPnL.filter((pnl) => pnl > 0).length;
    const totalPnL = mockPnL.reduce((sum, pnl) => sum + pnl, 0);

    return {
      totalTrades,
      successfulTrades,
      failedTrades: trades.filter((t) => t.status === "failed").length,
      winRate: totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0,
      totalPnL,
      averagePnL: totalTrades > 0 ? totalPnL / totalTrades : 0,
    };
  }
}

export default new AutoTradingService();
