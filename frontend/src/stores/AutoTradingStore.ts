import { makeAutoObservable, runInAction } from "mobx";
import autoTradingService from "../services/autoTradingService";
import {
  AutoTradeDisplay,
  CreateTradingRuleDtoDisplay,
  EmergencyStopConfig,
  RuleTemplate,
  TradingAlert,
  TradingConfig,
  TradingPerformance,
  TradingRule,
  TradingRuleDisplay,
  TradingSessionDisplay,
  TradingSessionDtoDisplay,
  transformAutoTradeToDisplay,
  transformCreateRuleDtoToBackend,
  transformSessionDtoToBackend,
  transformTradingRuleToDisplay,
  transformTradingSessionToDisplay,
} from "../types/autoTrading.types";
import { ApiStore } from "./ApiStore";

export class AutoTradingStore {
  // Observable state (using display interfaces for UI)
  tradingRules: TradingRuleDisplay[] = [];
  tradingSessions: TradingSessionDisplay[] = [];
  activeTrades: AutoTradeDisplay[] = [];
  tradeHistory: AutoTradeDisplay[] = [];
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
  selectedRule: TradingRuleDisplay | null = null;
  selectedSession: TradingSessionDisplay | null = null;

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
      // All auto-trading endpoints require portfolioId or sessionId parameters
      // Data will be loaded when a specific portfolio/session is selected
      console.log(
        "AutoTradingStore initialized - data will be loaded when portfolio is selected"
      );
    } catch (error) {
      console.error("Failed to load initial auto trading data:", error);
    }
  }

  // Trading Rules Management
  async createTradingRule(
    ruleDto: CreateTradingRuleDtoDisplay
  ): Promise<TradingRuleDisplay> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      // Transform to backend format
      const backendDto = transformCreateRuleDtoToBackend(ruleDto);
      const newRule = await autoTradingService.createTradingRule(backendDto);
      const displayRule = transformTradingRuleToDisplay(newRule);

      runInAction(() => {
        this.tradingRules.push(displayRule);
        this.isLoading = false;
      });

      return displayRule;
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
      if (!portfolioId) {
        console.warn(
          "fetchTradingRules called without portfolioId, skipping API call"
        );
        runInAction(() => {
          this.tradingRules = [];
        });
        return;
      }

      const rules = await autoTradingService.getTradingRules(portfolioId);
      const displayRules = rules.map(transformTradingRuleToDisplay);

      runInAction(() => {
        this.tradingRules = displayRules;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch trading rules";
      });
    }
  }

  async updateTradingRule(
    ruleId: string,
    updates: Partial<TradingRuleDisplay>
  ): Promise<void> {
    try {
      // Transform updates to backend format
      const backendUpdates: Partial<TradingRule> = {
        portfolio_id: updates.portfolioId,
        name: updates.name,
        description: updates.description,
        is_active: updates.isActive,
        priority: updates.priority,
        rule_type: updates.ruleType,
        conditions: updates.conditions,
        actions: updates.actions,
      };

      // Remove undefined values
      Object.keys(backendUpdates).forEach(
        (key) =>
          backendUpdates[key as keyof typeof backendUpdates] === undefined &&
          delete backendUpdates[key as keyof typeof backendUpdates]
      );

      const updatedRule = await autoTradingService.updateTradingRule(
        ruleId,
        backendUpdates
      );
      const displayRule = transformTradingRuleToDisplay(updatedRule);

      runInAction(() => {
        const index = this.tradingRules.findIndex((rule) => rule.id === ruleId);
        if (index !== -1) {
          this.tradingRules[index] = displayRule;
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
      await autoTradingService.deleteTradingRule(ruleId);

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
      if (isActive) {
        await autoTradingService.activateRule(ruleId);
      } else {
        await autoTradingService.deactivateRule(ruleId);
      }

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
    sessionData: TradingSessionDtoDisplay
  ): Promise<TradingSessionDisplay> {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const backendDto = transformSessionDtoToBackend(sessionData);
      const newSession = await autoTradingService.startTradingSession(
        portfolioId,
        backendDto
      );
      const displaySession = transformTradingSessionToDisplay(newSession);

      runInAction(() => {
        this.tradingSessions.push(displaySession);
        this.isLoading = false;
      });

      return displaySession;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to start trading session";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async stopTradingSession(sessionId: string, reason?: string): Promise<void> {
    try {
      await autoTradingService.stopTradingSession(sessionId, reason);

      runInAction(() => {
        const session = this.tradingSessions.find((s) => s.id === sessionId);
        if (session) {
          session.status = "stopped";
          session.stoppedAt = new Date();
          session.stopReason = reason;
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
      if (!portfolioId) {
        console.warn(
          "fetchTradingSessions called without portfolioId, skipping API call"
        );
        runInAction(() => {
          this.tradingSessions = [];
        });
        return;
      }

      const sessions = await autoTradingService.getTradingSessions(portfolioId);
      const displaySessions = sessions.map(transformTradingSessionToDisplay);

      runInAction(() => {
        this.tradingSessions = displaySessions;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch trading sessions";
      });
    }
  }

  // Global Trading Controls (graceful fallback since not implemented in backend)
  async startGlobalTrading(): Promise<void> {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      try {
        await autoTradingService.startGlobalTrading();
      } catch (error) {
        // Backend doesn't support global controls, simulate locally
        console.warn(
          "Global trading controls not available in backend, simulating locally"
        );
      }

      runInAction(() => {
        this.isGlobalTradingActive = true;
        this.tradingSessions.forEach((session) => {
          if (session.status === "stopped") {
            session.status = "active";
          }
        });
        this.isLoading = false;
      });

      this.addAlert({
        type: "session_stopped",
        severity: "info",
        title: "Global Trading Started",
        message: "All trading sessions have been activated",
        data: { action: "global_start" },
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

      try {
        await autoTradingService.stopGlobalTrading();
      } catch (error) {
        // Backend doesn't support global controls, stop sessions individually
        console.warn(
          "Global trading controls not available in backend, stopping sessions individually"
        );
        for (const session of this.tradingSessions) {
          if (session.status === "active") {
            try {
              await autoTradingService.stopTradingSession(
                session.id,
                "Global stop"
              );
            } catch (sessionError) {
              console.error(
                `Failed to stop session ${session.id}:`,
                sessionError
              );
            }
          }
        }
      }

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

      this.addAlert({
        type: "session_stopped",
        severity: "warning",
        title: "Global Trading Stopped",
        message: "All trading sessions have been stopped",
        data: { action: "global_stop" },
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
      try {
        await autoTradingService.pauseGlobalTrading();
      } catch (error) {
        console.warn(
          "Global pause not available in backend, feature not implemented"
        );
        throw new Error(
          "Pause functionality is not available - use stop instead"
        );
      }

      runInAction(() => {
        this.tradingSessions.forEach((session) => {
          if (session.status === "active") {
            session.status = "stopped"; // Backend only supports stop, not pause
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
      try {
        await autoTradingService.triggerEmergencyStop();
      } catch (error) {
        // Backend doesn't support emergency stop, stop all sessions individually
        console.warn(
          "Emergency stop not available in backend, stopping all sessions"
        );
        for (const session of this.tradingSessions) {
          if (session.status === "active") {
            try {
              await autoTradingService.stopTradingSession(
                session.id,
                "Emergency stop"
              );
            } catch (sessionError) {
              console.error(
                `Failed to stop session ${session.id}:`,
                sessionError
              );
            }
          }
        }
      }

      runInAction(() => {
        this.isGlobalTradingActive = false;
        this.tradingSessions.forEach((session) => {
          if (session.status === "active") {
            session.status = "stopped";
            session.stoppedAt = new Date();
            session.stopReason = "Emergency stop";
          }
        });
      });

      this.addAlert({
        type: "session_stopped",
        severity: "error",
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
  async fetchActiveTrades(portfolioId?: string): Promise<void> {
    try {
      if (!portfolioId) {
        console.warn(
          "fetchActiveTrades called without portfolioId, skipping API call"
        );
        runInAction(() => {
          this.activeTrades = [];
        });
        return;
      }

      const trades = await autoTradingService.getAutoTrades(portfolioId, {
        status: "pending",
      });
      const displayTrades = trades.map(transformAutoTradeToDisplay);

      runInAction(() => {
        this.activeTrades = displayTrades;
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
      if (!portfolioId) {
        console.warn(
          "fetchTradeHistory called without portfolioId, skipping API call"
        );
        runInAction(() => {
          this.tradeHistory = [];
        });
        return;
      }

      const historyResponse =
        await autoTradingService.getTradingHistory(portfolioId);
      const displayTrades = historyResponse.trades.map(
        transformAutoTradeToDisplay
      );

      runInAction(() => {
        this.tradeHistory = displayTrades.slice(0, limit);
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch trade history";
      });
    }
  }

  async fetchTradingPerformance(sessionId?: string): Promise<void> {
    try {
      if (!sessionId) {
        console.warn(
          "fetchTradingPerformance called without sessionId, skipping API call"
        );
        runInAction(() => {
          this.tradingPerformance = null;
        });
        return;
      }

      const performanceResponse =
        await autoTradingService.getSessionPerformance(sessionId);

      // Transform to legacy format for existing UI
      const legacyPerformance: TradingPerformance = {
        totalActiveSessions: 1,
        globalPnL: performanceResponse.totalPnL,
        dailyPnL: performanceResponse.totalPnL, // Simplified
        totalTrades: performanceResponse.totalTrades,
        winRate: performanceResponse.winRate,
        bestPerformingRule: {
          id: "unknown",
          name: "Unknown",
          pnl: 0,
        },
        worstPerformingRule: {
          id: "unknown",
          name: "Unknown",
          pnl: 0,
        },
        riskMetrics: {
          currentDrawdown: 0,
          maxDrawdown: 0,
          volatility: 0,
        },
      };

      runInAction(() => {
        this.tradingPerformance = legacyPerformance;
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
  ): CreateTradingRuleDtoDisplay {
    const template = this.ruleTemplates.find((t) => t.id === templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Transform template to new backend format
    return {
      portfolioId,
      name: template.ruleDefinition.name,
      description: template.ruleDefinition.description,
      ruleType: template.ruleDefinition.ruleType,
      isActive: template.ruleDefinition.isActive,
      priority: template.ruleDefinition.priority,
      conditions: template.ruleDefinition.conditions.map((condition) => ({
        field: condition.field,
        operator: condition.operator as any,
        value: condition.value,
        logical: condition.logicalOperator as any,
      })),
      actions: template.ruleDefinition.actions.map((action) => ({
        type: action.type as "buy" | "sell",
        sizing_method: (action.parameters?.sizingMethod as any) || "percentage",
        size_value: action.parameters?.sizeValue || 5,
        price_type: "market",
        price_offset: 0,
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

  setSelectedRule(rule: TradingRuleDisplay | null): void {
    runInAction(() => {
      this.selectedRule = rule;
    });
  }

  setSelectedSession(session: TradingSessionDisplay | null): void {
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
  handleTradeExecuted(trade: AutoTradeDisplay): void {
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
    status: TradingSessionDisplay["status"]
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

  async loadActiveTrades(portfolioId?: string): Promise<void> {
    return this.fetchActiveTrades(portfolioId);
  }

  // Additional methods for portfolio trading control
  async pausePortfolioTrading(portfolioId: string): Promise<void> {
    try {
      // Backend doesn't support pause, use stop instead
      const session = this.tradingSessions.find(
        (s) => s.portfolioId === portfolioId && s.status === "active"
      );

      if (session) {
        await autoTradingService.stopTradingSession(
          session.id,
          "Portfolio paused"
        );
        runInAction(() => {
          session.status = "stopped";
          session.stoppedAt = new Date();
          session.stopReason = "Portfolio paused";
        });
      }
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to pause portfolio trading";
      });
      throw error;
    }
  }

  async resumePortfolioTrading(
    portfolioId: string,
    config?: TradingConfig
  ): Promise<void> {
    try {
      // Backend doesn't support resume, need to start new session
      const sessionData: TradingSessionDtoDisplay = {
        sessionName: `Resumed Session - ${new Date().toISOString()}`,
        config: config || {},
      };

      const newSession = await this.startTradingSession(
        portfolioId,
        sessionData
      );

      this.addAlert({
        type: "session_stopped",
        severity: "info",
        title: "Portfolio Trading Resumed",
        message: `New trading session started for portfolio ${portfolioId}`,
        data: { portfolioId, sessionId: newSession.id },
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
    sessionData: TradingSessionDtoDisplay
  ): Promise<void> {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      const session = await this.startTradingSession(portfolioId, sessionData);

      runInAction(() => {
        const existingIndex = this.tradingSessions.findIndex(
          (s) => s.portfolioId === portfolioId && s.status === "active"
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

      const activeSession = this.tradingSessions.find(
        (s) => s.portfolioId === portfolioId && s.status === "active"
      );

      if (activeSession) {
        await autoTradingService.stopTradingSession(
          activeSession.id,
          "Portfolio stopped"
        );
        runInAction(() => {
          activeSession.status = "stopped";
          activeSession.stoppedAt = new Date();
          activeSession.stopReason = "Portfolio stopped";
        });
      }

      runInAction(() => {
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

      // Backend doesn't support import, create rules individually
      const importedRules: TradingRuleDisplay[] = [];

      for (const rule of rules) {
        try {
          const createdRule = await this.createTradingRule(rule);
          importedRules.push(createdRule);
        } catch (error) {
          console.error(`Failed to import rule ${rule.name}:`, error);
        }
      }

      runInAction(() => {
        this.isLoading = false;
      });

      this.addAlert({
        type: "rule_triggered",
        severity: "info",
        title: "Rules Imported",
        message: `${importedRules.length} out of ${rules.length} rules imported successfully`,
        data: { importedCount: importedRules.length, totalCount: rules.length },
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
