import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export interface DeploymentConfig {
  mode: "paper" | "live";
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

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

class AutonomousTradingApi {
  private baseURL = `${API_BASE_URL}/api/autonomous-trading`;

  async deployStrategy(
    strategyId: string,
    deploymentConfig: DeploymentConfig,
    userId: string = "demo-user" // In real app, this would come from auth
  ): Promise<ApiResponse<StrategyInstance>> {
    try {
      const response = await axios.post(
        `${this.baseURL}/${strategyId}/deploy?userId=${userId}`,
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
      const response = await axios.put(
        `${this.baseURL}/${strategyId}/stop?userId=${userId}`
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
      const response = await axios.put(
        `${this.baseURL}/${strategyId}/pause?userId=${userId}`
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
      const response = await axios.put(
        `${this.baseURL}/${strategyId}/resume?userId=${userId}`
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

  async getStrategyStatus(
    strategyId: string,
    userId: string = "demo-user"
  ): Promise<ApiResponse<StrategyInstance>> {
    try {
      const response = await axios.get(
        `${this.baseURL}/${strategyId}/status?userId=${userId}`
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
      const response = await axios.get(
        `${this.baseURL}/${strategyId}/performance?userId=${userId}`
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
}

export default new AutonomousTradingApi();
