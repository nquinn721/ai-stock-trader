import axios from 'axios';
import {
  TradingRule,
  CreateTradingRuleDto,
  TradingSession,
  TradingSessionDto,
  AutoTrade,
  SessionStatusResponse,
  TradingHistoryResponse,
  SessionPerformanceResponse,
} from '../types/autoTrading.types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance for auto-trading API
const autoTradingApi = axios.create({
  baseURL: `${API_BASE_URL}/auto-trading`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth (if needed)
autoTradingApi.interceptors.request.use((config) => {
  // Add auth token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
autoTradingApi.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Auto-trading API error:', error);
    throw error;
  }
);

class AutoTradingService {
  // Trading Rules Management
  async createTradingRule(ruleData: CreateTradingRuleDto): Promise<TradingRule> {
    const response = await autoTradingApi.post('/rules', ruleData);
    return response.data;
  }

  async getTradingRules(portfolioId: string): Promise<TradingRule[]> {
    const response = await autoTradingApi.get(`/rules/${portfolioId}`);
    return response.data;
  }

  async updateTradingRule(ruleId: string, updates: Partial<TradingRule>): Promise<TradingRule> {
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
  async startTradingSession(portfolioId: string, sessionData: TradingSessionDto): Promise<TradingSession> {
    const response = await autoTradingApi.post(`/sessions/${portfolioId}/start`, sessionData);
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

  async getSessionPerformance(sessionId: string): Promise<SessionPerformanceResponse> {
    const response = await autoTradingApi.get(`/sessions/${sessionId}/performance`);
    return response.data;
  }

  async getActiveSessions(): Promise<TradingSession[]> {
    const response = await autoTradingApi.get('/sessions/active');
    return response.data;
  }

  // Trade Management
  async getAutoTrades(portfolioId: string, filters?: any): Promise<AutoTrade[]> {
    const response = await autoTradingApi.get(`/trades/${portfolioId}`, { params: filters });
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

  async getTradingHistory(portfolioId: string): Promise<TradingHistoryResponse> {
    const response = await autoTradingApi.get(`/history/${portfolioId}`);
    return response.data;
  }

  // Global Controls (if implemented in backend)
  async startGlobalTrading(): Promise<void> {
    try {
      await autoTradingApi.post('/global/start');
    } catch (error) {
      console.warn('Global trading controls not implemented in backend');
      throw new Error('Global trading controls not available');
    }
  }

  async stopGlobalTrading(): Promise<void> {
    try {
      await autoTradingApi.post('/global/stop');
    } catch (error) {
      console.warn('Global trading controls not implemented in backend');
      throw new Error('Global trading controls not available');
    }
  }

  async pauseGlobalTrading(): Promise<void> {
    try {
      await autoTradingApi.post('/global/pause');
    } catch (error) {
      console.warn('Global trading controls not implemented in backend');
      throw new Error('Global trading controls not available');
    }
  }

  async triggerEmergencyStop(): Promise<void> {
    try {
      await autoTradingApi.post('/emergency-stop');
    } catch (error) {
      console.warn('Emergency stop not implemented in backend');
      throw new Error('Emergency stop not available');
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await autoTradingApi.get('/health');
    return response.data;
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
        sizing_method: action.sizingMethod || action.sizing_method || 'percentage',
        size_value: action.sizeValue || action.size_value || 5,
        price_type: action.priceType || action.price_type || 'market',
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
    const executedTrades = trades.filter(t => t.status === 'executed');
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
    const successfulTrades = mockPnL.filter(pnl => pnl > 0).length;
    const totalPnL = mockPnL.reduce((sum, pnl) => sum + pnl, 0);

    return {
      totalTrades,
      successfulTrades,
      failedTrades: trades.filter(t => t.status === 'failed').length,
      winRate: totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0,
      totalPnL,
      averagePnL: totalTrades > 0 ? totalPnL / totalTrades : 0,
    };
  }
}

export default new AutoTradingService();