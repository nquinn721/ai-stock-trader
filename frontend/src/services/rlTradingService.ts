import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export interface RLAgent {
  id: string;
  name: string;
  status: "training" | "ready" | "deployed" | "stopped" | "error";
  trainingProgress: number;
  episodeCount: number;
  totalReward: number;
  averageReward: number;
  performance: {
    winRate: number;
    sharpeRatio: number;
    maxDrawdown: number;
    totalReturn: number;
  };
  lastUpdated: Date;
}

export interface TrainingConfig {
  episodes: number;
  learningRate: number;
  batchSize: number;
  memorySize: number;
  epsilon: number;
  epsilonDecay: number;
  symbols: string[];
  riskTolerance: number;
}

export interface TradingDecision {
  symbol: string;
  action: "buy" | "sell" | "hold";
  confidence: number;
  position: number;
  expectedReward: number;
  riskLevel: number;
  timestamp: Date;
}

export interface RLMetrics {
  agentId: string;
  episodeRewards: number[];
  cumulativeReward: number;
  learningProgress: number;
  explorationRate: number;
  averageLoss: number;
  performanceMetrics: {
    profitLoss: number;
    tradesExecuted: number;
    successfulTrades: number;
    sharpeRatio: number;
    maxDrawdown: number;
    volatility: number;
  };
}

export interface DeploymentConfig {
  agentId: string;
  portfolioId: string;
  riskLimits: {
    maxPositionSize: number;
    dailyLossLimit: number;
    maxDrawdown: number;
  };
  executionMode: "live" | "paper" | "simulation";
  symbols: string[];
  notificationsEnabled: boolean;
}

class RLTradingService {
  private readonly baseUrl = `${API_BASE_URL}/ml/reinforcement-learning`;

  // Agent Management
  async getAgents(): Promise<{
    success: boolean;
    data?: RLAgent[];
    error?: string;
  }> {
    try {
      const response = await axios.get<RLAgent[]>(`${this.baseUrl}/agents`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Failed to fetch RL agents:", error);
      return { success: false, error: "Failed to fetch RL agents" };
    }
  }

  async createAgent(
    config: Partial<TrainingConfig> & { name: string }
  ): Promise<{ success: boolean; data?: RLAgent; error?: string }> {
    try {
      const response = await axios.post<RLAgent>(
        `${this.baseUrl}/agents`,
        config
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Failed to create RL agent:", error);
      return { success: false, error: "Failed to create RL agent" };
    }
  }

  async deleteAgent(
    agentId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await axios.delete(`${this.baseUrl}/agents/${agentId}`);
      return { success: true };
    } catch (error) {
      console.error("Failed to delete RL agent:", error);
      return { success: false, error: "Failed to delete RL agent" };
    }
  }

  // Training Management
  async startTraining(
    agentId: string,
    config: TrainingConfig
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await axios.post(`${this.baseUrl}/agents/${agentId}/train`, config);
      return { success: true };
    } catch (error) {
      console.error("Failed to start training:", error);
      return { success: false, error: "Failed to start training" };
    }
  }

  async stopTraining(
    agentId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await axios.post(`${this.baseUrl}/agents/${agentId}/stop-training`);
      return { success: true };
    } catch (error) {
      console.error("Failed to stop training:", error);
      return { success: false, error: "Failed to stop training" };
    }
  }

  async getTrainingProgress(
    agentId: string
  ): Promise<{ success: boolean; data?: RLMetrics; error?: string }> {
    try {
      const response = await axios.get<RLMetrics>(
        `${this.baseUrl}/agents/${agentId}/metrics`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Failed to fetch training progress:", error);
      return { success: false, error: "Failed to fetch training progress" };
    }
  }

  // Deployment Management
  async deployAgent(
    config: DeploymentConfig
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await axios.post(`${this.baseUrl}/deploy`, config);
      return { success: true };
    } catch (error) {
      console.error("Failed to deploy agent:", error);
      return { success: false, error: "Failed to deploy agent" };
    }
  }

  async stopDeployment(
    agentId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await axios.post(`${this.baseUrl}/agents/${agentId}/stop-deployment`);
      return { success: true };
    } catch (error) {
      console.error("Failed to stop deployment:", error);
      return { success: false, error: "Failed to stop deployment" };
    }
  }

  // Trading Decisions
  async getTradingDecision(
    agentId: string,
    marketData: any
  ): Promise<{ success: boolean; data?: TradingDecision; error?: string }> {
    try {
      const response = await axios.post<TradingDecision>(
        `${this.baseUrl}/agents/${agentId}/decide`,
        marketData
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Failed to get trading decision:", error);
      return { success: false, error: "Failed to get trading decision" };
    }
  }

  async getRecentDecisions(
    agentId: string,
    limit: number = 50
  ): Promise<{ success: boolean; data?: TradingDecision[]; error?: string }> {
    try {
      const response = await axios.get<TradingDecision[]>(
        `${this.baseUrl}/agents/${agentId}/decisions?limit=${limit}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Failed to fetch recent decisions:", error);
      return { success: false, error: "Failed to fetch recent decisions" };
    }
  }

  // Performance Analytics
  async getPerformanceAnalytics(
    agentId: string,
    timeframe: string = "24h"
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/agents/${agentId}/performance?timeframe=${timeframe}`
      );
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Failed to fetch performance analytics:", error);
      return { success: false, error: "Failed to fetch performance analytics" };
    }
  }

  // Model Management
  async saveModel(
    agentId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await axios.post(`${this.baseUrl}/agents/${agentId}/save-model`);
      return { success: true };
    } catch (error) {
      console.error("Failed to save model:", error);
      return { success: false, error: "Failed to save model" };
    }
  }

  async loadModel(
    agentId: string,
    modelPath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await axios.post(`${this.baseUrl}/agents/${agentId}/load-model`, {
        modelPath,
      });
      return { success: true };
    } catch (error) {
      console.error("Failed to load model:", error);
      return { success: false, error: "Failed to load model" };
    }
  }
}

export const rlTradingService = new RLTradingService();
export default rlTradingService;
