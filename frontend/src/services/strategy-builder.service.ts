import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export interface StrategyComponent {
  id: string;
  type: "indicator" | "condition" | "action";
  name: string;
  category: string;
  parameters: Record<string, any>;
  position?: { x: number; y: number };
  connections?: string[];
}

export interface RiskRule {
  id: string;
  type: "position_size" | "stop_loss" | "take_profit" | "max_drawdown";
  parameters: Record<string, any>;
}

export interface StrategyConfig {
  id?: string;
  name: string;
  description: string;
  components: StrategyComponent[];
  connections?: Array<{ from: string; to: string }>;
  riskRules: RiskRule[];
  symbols?: string[];
  timeframe?: string;
  isActive?: boolean;
}

export interface TradingStrategy {
  id: string;
  userId: string;
  name: string;
  description: string;
  components: StrategyComponent[];
  riskRules: RiskRule[];
  symbols: string[];
  timeframe: string;
  status: "draft" | "validated" | "deployed" | "archived";
  version: number;
  createdAt: Date;
  updatedAt: Date;
  backtestResults?: any[];
  deploymentStatus?: "idle" | "running" | "paused" | "error";
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface BacktestParams {
  startDate: string;
  endDate: string;
  initialCapital: number;
  symbols: string[];
  commission?: number;
  slippage?: number;
}

export interface BacktestResult {
  id: string;
  strategyId: string;
  totalReturn: number;
  annualizedReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  profitableTrades: number;
  avgWinningTrade: number;
  avgLosingTrade: number;
  profitFactor: number;
  equity: Array<{ date: string; value: number }>;
  trades: Array<{
    symbol: string;
    action: "buy" | "sell";
    quantity: number;
    price: number;
    timestamp: Date;
    pnl?: number;
  }>;
  metrics: Record<string, any>;
  createdAt: Date;
}

export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  components: StrategyComponent[];
  riskRules: RiskRule[];
  defaultSymbols: string[];
  defaultTimeframe: string;
  tags: string[];
  author: string;
  rating: number;
  usageCount: number;
  createdAt: Date;
}

export interface ComponentDefinition {
  id: string;
  name: string;
  type: "indicator" | "condition" | "action";
  category: string;
  description: string;
  parameters: Record<string, any>;
  inputs?: string[];
  outputs?: string[];
  documentation?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

class StrategyBuilderService {
  private baseURL = `${API_BASE_URL}/api/strategy-builder`;

  // Strategy Management
  async createStrategy(
    strategyConfig: StrategyConfig,
    userId: string = "demo-user"
  ): Promise<ApiResponse<TradingStrategy>> {
    try {
      const response = await axios.post(
        `${this.baseURL}/strategies?userId=${userId}`,
        strategyConfig
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as TradingStrategy,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async getUserStrategies(
    userId: string = "demo-user"
  ): Promise<ApiResponse<TradingStrategy[]>> {
    try {
      const response = await axios.get(
        `${this.baseURL}/strategies?userId=${userId}`
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

  async getStrategy(strategyId: string): Promise<ApiResponse<TradingStrategy>> {
    try {
      const response = await axios.get(
        `${this.baseURL}/strategies/${strategyId}`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as TradingStrategy,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async updateStrategy(
    strategyId: string,
    updates: Partial<StrategyConfig>
  ): Promise<ApiResponse<TradingStrategy>> {
    try {
      const response = await axios.put(
        `${this.baseURL}/strategies/${strategyId}`,
        updates
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as TradingStrategy,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async deleteStrategy(
    strategyId: string
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      await axios.delete(`${this.baseURL}/strategies/${strategyId}`);
      return {
        success: true,
        data: { message: "Strategy deleted successfully" },
      };
    } catch (error: any) {
      return {
        success: false,
        data: { message: "" },
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async duplicateStrategy(
    strategyId: string,
    userId: string = "demo-user",
    newName?: string
  ): Promise<ApiResponse<TradingStrategy>> {
    try {
      const response = await axios.post(
        `${this.baseURL}/strategies/${strategyId}/duplicate?userId=${userId}`,
        { newName }
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as TradingStrategy,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async validateStrategy(
    strategyId: string
  ): Promise<ApiResponse<ValidationResult>> {
    try {
      const response = await axios.post(
        `${this.baseURL}/strategies/${strategyId}/validate`
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: { isValid: false, errors: ["Validation failed"] },
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // Backtesting
  async runBacktest(
    strategyId: string,
    backtestParams: BacktestParams
  ): Promise<ApiResponse<BacktestResult>> {
    try {
      const response = await axios.post(
        `${this.baseURL}/strategies/${strategyId}/backtest`,
        backtestParams
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as BacktestResult,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  async getBacktestResults(
    strategyId: string
  ): Promise<ApiResponse<BacktestResult[]>> {
    try {
      const response = await axios.get(
        `${this.baseURL}/strategies/${strategyId}/backtests`
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

  // Templates
  async getTemplates(): Promise<ApiResponse<StrategyTemplate[]>> {
    try {
      const response = await axios.get(`${this.baseURL}/templates`);
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

  async createStrategyFromTemplate(
    templateId: string,
    name: string,
    userId: string = "demo-user"
  ): Promise<ApiResponse<TradingStrategy>> {
    try {
      const response = await axios.post(
        `${this.baseURL}/templates/${templateId}/create-strategy?userId=${userId}`,
        { name }
      );
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        data: {} as TradingStrategy,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // Component Library
  async getComponentLibrary(): Promise<ApiResponse<ComponentDefinition[]>> {
    try {
      const response = await axios.get(`${this.baseURL}/components`);
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

  async getComponentCategories(): Promise<ApiResponse<string[]>> {
    try {
      const response = await axios.get(`${this.baseURL}/components/categories`);
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

  // Marketplace
  async publishStrategy(
    strategyId: string,
    publishConfig: {
      isPublic: boolean;
      price?: number;
      tags?: string[];
      category?: string;
    }
  ): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await axios.post(
        `${this.baseURL}/strategies/${strategyId}/publish`,
        publishConfig
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

  async searchMarketplace(query: {
    search?: string;
    category?: string;
    tags?: string[];
    minRating?: number;
    sortBy?: "rating" | "usage" | "recent";
  }): Promise<ApiResponse<StrategyTemplate[]>> {
    try {
      const params = new URLSearchParams();
      if (query.search) params.append("search", query.search);
      if (query.category) params.append("category", query.category);
      if (query.tags) query.tags.forEach((tag) => params.append("tags", tag));
      if (query.minRating)
        params.append("minRating", query.minRating.toString());
      if (query.sortBy) params.append("sortBy", query.sortBy);

      const response = await axios.get(
        `${this.baseURL}/marketplace/search?${params}`
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
}

export const strategyBuilderService = new StrategyBuilderService();
export default StrategyBuilderService;
