import { makeAutoObservable, runInAction } from "mobx";
import {
  AutoTrade,
  CreateTradingRuleDto,
  EmergencyStopConfig,
  RuleTemplate,
  TradingAlert,
  TradingConfig,
  TradingPerformance,
  TradingRule,
  TradingSession,
} from "../types/autoTrading.types";
import { ApiStore } from "./ApiStore";

export class AutoTradingStore {
  // Observable state
  tradingRules: TradingRule[] = [];
  tradingSessions: TradingSession[] = [];
  activeTrades: AutoTrade[] = [];
  tradeHistory: AutoTrade[] = [];
  alerts: TradingAlert[] = [];

  // Global state
  isGlobalTradingActive: boolean = false;
  tradingPerformance: TradingPerformance | null = null;
  emergencyStopConfig: EmergencyStopConfig = {
    maxDrawdownPercent: 10,
    maxDailyLossPercent: 5,
    consecutiveLossLimit: 3,
    enabled: true,
  };

  // UI state
  isLoading: boolean = false;
  error: string | null = null;
  selectedRule: TradingRule | null = null;
  selectedSession: TradingSession | null = null;

  // Rule templates for quick setup
  ruleTemplates: RuleTemplate[] = [
    {
      id: "ai_strong_buy",
      name: "AI Strong Buy Strategy",
      description: "Buy when AI gives strong buy signal with high confidence",
      category: "momentum",
      difficulty: "beginner",
      ruleDefinition: {
        name: "AI Strong Buy Strategy",
        isActive: true,
        priority: 1,
        ruleType: "entry",
        conditions: [
          {
            id: "ai_signal",
            field: "ai_recommendation.signal",
            operator: "equals",
            value: "STRONG_BUY",
          },
          {
            id: "ai_confidence",
            field: "ai_recommendation.confidence",
            operator: "greater_than",
            value: 0.8,
            logicalOperator: "AND",
          },
        ],
        actions: [
          {
            id: "buy_action",
            type: "buy",
            parameters: {
              sizingMethod: "percentage",
              sizeValue: 5,
              maxPositionSize: 10,
            },
          },
        ],
      },
    },
    {
      id: "stop_loss_protection",
      name: "Stop Loss Protection",
      description: "Automatically sell positions at 5% loss",
      category: "risk_management",
      difficulty: "beginner",
      ruleDefinition: {
        name: "Stop Loss Protection",
        isActive: true,
        priority: 0, // High priority for risk management
        ruleType: "exit",
        conditions: [
          {
            id: "position_loss",
            field: "position_pnl_percentage",
            operator: "less_than",
            value: -5,
          },
        ],
        actions: [
          {
            id: "sell_action",
            type: "sell",
            parameters: {
              sizingMethod: "percentage",
              sizeValue: 100, // Sell entire position
            },
          },
        ],
      },
    },
  ];

  constructor(private apiStore: ApiStore) {
    makeAutoObservable(this);
    this.loadInitialData();
  }

  // Actions
  private async loadInitialData() {
    try {
      await Promise.all([
        this.fetchTradingRules(),
        this.fetchTradingSessions(),
        this.fetchTradingPerformance(),
        this.fetchActiveTrades(),
      ]);
    } catch (error) {
      console.error("Failed to load initial auto trading data:", error);
    }
  }

  // Trading Rules Management
  async createTradingRule(ruleDto: CreateTradingRuleDto): Promise<TradingRule> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const response = await this.apiStore.post("/auto-trading/rules", ruleDto);
      const newRule = (response as any).data as TradingRule;

      runInAction(() => {
        this.tradingRules.push(newRule);
        this.isLoading = false;
      });

      return newRule;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to create trading rule";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async fetchTradingRules(portfolioId?: string): Promise<void> {
    try {
      const endpoint = portfolioId
        ? `/auto-trading/rules/${portfolioId}`
        : "/auto-trading/rules";
      const response = await this.apiStore.get(endpoint);

      runInAction(() => {
        this.tradingRules = (response as any).data;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch trading rules";
      });
    }
  }

  async updateTradingRule(
    ruleId: string,
    updates: Partial<TradingRule>
  ): Promise<void> {
    try {
      const response = await this.apiStore.put(
        `/auto-trading/rules/${ruleId}`,
        updates
      );
      const updatedRule = (response as any).data as TradingRule;

      runInAction(() => {
        const index = this.tradingRules.findIndex((rule) => rule.id === ruleId);
        if (index !== -1) {
          this.tradingRules[index] = updatedRule;
        }
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to update trading rule";
      });
      throw error;
    }
  }

  async deleteTradingRule(ruleId: string): Promise<void> {
    try {
      await this.apiStore.delete(`/auto-trading/rules/${ruleId}`);

      runInAction(() => {
        this.tradingRules = this.tradingRules.filter(
          (rule) => rule.id !== ruleId
        );
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to delete trading rule";
      });
      throw error;
    }
  }

  async toggleRuleStatus(ruleId: string, isActive: boolean): Promise<void> {
    try {
      const endpoint = isActive
        ? `/auto-trading/rules/${ruleId}/activate`
        : `/auto-trading/rules/${ruleId}/deactivate`;

      await this.apiStore.post(endpoint);

      runInAction(() => {
        const rule = this.tradingRules.find((rule) => rule.id === ruleId);
        if (rule) {
          rule.isActive = isActive;
        }
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to toggle rule status";
      });
      throw error;
    }
  }

  // Trading Session Management
  async startTradingSession(
    portfolioId: string,
    config: TradingConfig
  ): Promise<TradingSession> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const response = await this.apiStore.post(
        "/auto-trading/sessions/start",
        {
          portfolioId,
          config,
        }
      );
      const newSession = (response as any).data as TradingSession;

      runInAction(() => {
        this.tradingSessions.push(newSession);
        this.isLoading = false;
      });

      return newSession;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to start trading session";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async stopTradingSession(sessionId: string): Promise<void> {
    try {
      await this.apiStore.post(`/auto-trading/sessions/${sessionId}/stop`);

      runInAction(() => {
        const session = this.tradingSessions.find((s) => s.id === sessionId);
        if (session) {
          session.status = "stopped";
          session.stoppedAt = new Date();
        }
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to stop trading session";
      });
      throw error;
    }
  }

  async pauseTradingSession(sessionId: string): Promise<void> {
    try {
      await this.apiStore.post(`/auto-trading/sessions/${sessionId}/pause`);

      runInAction(() => {
        const session = this.tradingSessions.find((s) => s.id === sessionId);
        if (session) {
          session.status = "paused";
        }
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to pause trading session";
      });
      throw error;
    }
  }

  async fetchTradingSessions(portfolioId?: string): Promise<void> {
    try {
      const endpoint = portfolioId
        ? `/auto-trading/sessions/${portfolioId}`
        : "/auto-trading/sessions";
      const response = await this.apiStore.get(endpoint);

      runInAction(() => {
        this.tradingSessions = (response as any).data;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch trading sessions";
      });
    }
  }

  // Global Trading Controls
  async startGlobalTrading(): Promise<void> {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      await this.apiStore.post("/auto-trading/global/start");

      runInAction(() => {
        this.isGlobalTradingActive = true;
        this.tradingSessions.forEach((session) => {
          if (session.status === "stopped" || session.status === "paused") {
            session.status = "active";
          }
        });
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to start global trading";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async stopGlobalTrading(): Promise<void> {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      await this.apiStore.post("/auto-trading/global/stop");

      runInAction(() => {
        this.isGlobalTradingActive = false;
        this.tradingSessions.forEach((session) => {
          if (session.status === "active") {
            session.status = "stopped";
            session.stoppedAt = new Date();
          }
        });
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to stop global trading";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async pauseGlobalTrading(): Promise<void> {
    try {
      await this.apiStore.post("/auto-trading/global/pause");
      runInAction(() => {
        this.tradingSessions.forEach((session) => {
          if (session.status === "active") {
            session.status = "paused";
          }
        });
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to pause global trading";
      });
      throw error;
    }
  }

  async emergencyStop(): Promise<void> {
    try {
      await this.apiStore.post("/auto-trading/emergency-stop");

      runInAction(() => {
        this.isGlobalTradingActive = false;
        this.tradingSessions.forEach((session) => {
          if (session.status === "active") {
            session.status = "stopped";
            session.stoppedAt = new Date();
          }
        });
      });

      this.addAlert({
        type: "session_stopped",
        severity: "warning",
        title: "Emergency Stop Activated",
        message: "All automated trading has been stopped immediately",
        data: { reason: "emergency_stop" },
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to execute emergency stop";
      });
      throw error;
    }
  }

  // Trade Management
  async fetchActiveTrades(): Promise<void> {
    try {
      const response = await this.apiStore.get("/auto-trading/trades/active");

      runInAction(() => {
        this.activeTrades = (response as any).data;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch active trades";
      });
    }
  }

  async fetchTradeHistory(
    portfolioId?: string,
    limit: number = 100
  ): Promise<void> {
    try {
      const params = new URLSearchParams();
      if (portfolioId) params.append("portfolioId", portfolioId);
      params.append("limit", limit.toString());

      const response = await this.apiStore.get(
        `/auto-trading/trades/history?${params}`
      );

      runInAction(() => {
        this.tradeHistory = (response as any).data;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch trade history";
      });
    }
  }

  async fetchTradingPerformance(): Promise<void> {
    try {
      const response = await this.apiStore.get("/auto-trading/performance");

      runInAction(() => {
        this.tradingPerformance = (response as any).data;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch trading performance";
      });
    }
  }

  // Rule Templates
  createRuleFromTemplate(
    templateId: string,
    portfolioId: string
  ): Omit<CreateTradingRuleDto, "portfolioId"> {
    const template = this.ruleTemplates.find((t) => t.id === templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    return {
      ...template.ruleDefinition,
      conditions: template.ruleDefinition.conditions.map((condition) => ({
        ...condition,
        id: undefined, // Let backend generate ID
      })),
      actions: template.ruleDefinition.actions.map((action) => ({
        ...action,
        id: undefined, // Let backend generate ID
      })),
    };
  }

  // Alert Management
  addAlert(
    alertData: Omit<TradingAlert, "id" | "timestamp" | "acknowledged">
  ): void {
    runInAction(() => {
      const alert: TradingAlert = {
        ...alertData,
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        acknowledged: false,
      };
      this.alerts.unshift(alert);

      // Keep only last 50 alerts
      if (this.alerts.length > 50) {
        this.alerts = this.alerts.slice(0, 50);
      }
    });
  }

  acknowledgeAlert(alertId: string): void {
    runInAction(() => {
      const alert = this.alerts.find((a) => a.id === alertId);
      if (alert) {
        alert.acknowledged = true;
      }
    });
  }

  clearAlerts(): void {
    runInAction(() => {
      this.alerts = [];
    });
  }

  // Computed properties
  get activeRulesCount(): number {
    return this.tradingRules.filter((rule) => rule.isActive).length;
  }

  get activeSessionsCount(): number {
    return this.tradingSessions.filter((session) => session.status === "active")
      .length;
  }

  get unacknowledgedAlerts(): TradingAlert[] {
    return this.alerts.filter((alert) => !alert.acknowledged);
  }

  get todaysPerformance(): { trades: number; pnl: number } {
    const today = new Date().toDateString();
    const todaysTrades = this.tradeHistory.filter(
      (trade) => new Date(trade.createdAt).toDateString() === today
    );

    const pnl = todaysTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);

    return {
      trades: todaysTrades.length,
      pnl,
    };
  }

  // Utility methods
  clearError(): void {
    runInAction(() => {
      this.error = null;
    });
  }

  setSelectedRule(rule: TradingRule | null): void {
    runInAction(() => {
      this.selectedRule = rule;
    });
  }

  setSelectedSession(session: TradingSession | null): void {
    runInAction(() => {
      this.selectedSession = session;
    });
  }

  updateEmergencyStopConfig(config: Partial<EmergencyStopConfig>): void {
    runInAction(() => {
      this.emergencyStopConfig = { ...this.emergencyStopConfig, ...config };
    });
  }

  // WebSocket handlers (to be called from WebSocketStore)
  handleTradeExecuted(trade: AutoTrade): void {
    runInAction(() => {
      this.activeTrades.push(trade);
      this.tradeHistory.unshift(trade);

      // Update performance if available
      if (this.tradingPerformance) {
        this.tradingPerformance.totalTrades += 1;
        this.tradingPerformance.dailyPnL += trade.pnl || 0;
        this.tradingPerformance.globalPnL += trade.pnl || 0;
      }
    });

    this.addAlert({
      type: "trade_executed",
      severity: "info",
      title: "Trade Executed",
      message: `${trade.type.toUpperCase()} ${trade.quantity} shares of ${
        trade.symbol
      }`,
      data: trade,
    });
  }

  handleRuleTriggered(ruleId: string, context: any): void {
    runInAction(() => {
      const rule = this.tradingRules.find((r) => r.id === ruleId);
      if (rule) {
        this.addAlert({
          type: "rule_triggered",
          severity: "info",
          title: "Trading Rule Triggered",
          message: `Rule "${rule.name}" has been triggered`,
          data: { rule, context },
        });
      }
    });
  }

  handleSessionStatusUpdate(
    sessionId: string,
    status: TradingSession["status"]
  ): void {
    runInAction(() => {
      const session = this.tradingSessions.find((s) => s.id === sessionId);
      if (session) {
        session.status = status;
        if (status === "stopped") {
          session.stoppedAt = new Date();
        }
      }
    });
  }

  // Alias methods for component compatibility
  async loadTradingRules(portfolioId?: string): Promise<void> {
    return this.fetchTradingRules(portfolioId);
  }

  async loadTradingSessions(portfolioId?: string): Promise<void> {
    return this.fetchTradingSessions(portfolioId);
  }

  async loadActiveTrades(): Promise<void> {
    return this.fetchActiveTrades();
  }

  // Additional methods for portfolio trading control
  async pausePortfolioTrading(portfolioId: string): Promise<void> {
    try {
      await this.apiStore.post(`/auto-trading/sessions/${portfolioId}/pause`);
      runInAction(() => {
        const session = this.tradingSessions.find(
          (s) => s.portfolioId === portfolioId
        );
        if (session) {
          session.status = "paused";
        }
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to pause portfolio trading";
      });
      throw error;
    }
  }

  async resumePortfolioTrading(portfolioId: string): Promise<void> {
    try {
      await this.apiStore.post(`/auto-trading/sessions/${portfolioId}/resume`);
      runInAction(() => {
        const session = this.tradingSessions.find(
          (s) => s.portfolioId === portfolioId
        );
        if (session) {
          session.status = "active";
        }
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to resume portfolio trading";
      });
      throw error;
    }
  }

  async startPortfolioTrading(
    portfolioId: string,
    config: TradingConfig
  ): Promise<void> {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      const response = await this.apiStore.post(
        `/auto-trading/sessions/${portfolioId}/start`,
        config
      );
      const session = (response as any).data as TradingSession;

      runInAction(() => {
        const existingIndex = this.tradingSessions.findIndex(
          (s) => s.portfolioId === portfolioId
        );
        if (existingIndex !== -1) {
          this.tradingSessions[existingIndex] = session;
        } else {
          this.tradingSessions.push(session);
        }
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to start portfolio trading";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async stopPortfolioTrading(portfolioId: string): Promise<void> {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      await this.apiStore.post(`/auto-trading/sessions/${portfolioId}/stop`);

      runInAction(() => {
        const session = this.tradingSessions.find(
          (s) => s.portfolioId === portfolioId
        );
        if (session) {
          session.status = "stopped";
          session.stoppedAt = new Date();
        }
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to stop portfolio trading";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async importTradingRules(rules: any[]): Promise<void> {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      const response = await this.apiStore.post("/auto-trading/rules/import", {
        rules,
      });
      const importedRules = (response as any).data as TradingRule[];

      runInAction(() => {
        this.tradingRules.push(...importedRules);
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to import trading rules";
        this.isLoading = false;
      });
      throw error;
    }
  }
}
