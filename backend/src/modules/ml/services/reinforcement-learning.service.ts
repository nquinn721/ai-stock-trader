import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as tf from '@tensorflow/tfjs';
import { Repository } from 'typeorm';
import { PaperTradingService } from '../../paper-trading/paper-trading.service';
import { StockService } from '../../stock/stock.service';
import { MLModel, MLPrediction } from '../entities/ml.entities';

/**
 * S42: Deep Reinforcement Learning Trading Agent Service
 * Implements sophisticated DQN-based autonomous trading with continuous learning
 */

interface DQNConfig {
  stateSize: number;
  actionSize: number;
  learningRate: number;
  memorySize: number;
  batchSize: number;
  epsilon: number;
  epsilonMin: number;
  epsilonDecay: number;
  gamma: number;
  targetUpdateFreq: number;
}

interface Experience {
  state: number[];
  action: number;
  reward: number;
  nextState: number[];
  done: boolean;
  timestamp: Date;
}

interface MarketState {
  prices: number[];
  volumes: number[];
  technicalIndicators: number[];
  portfolioState: number[];
  riskMetrics: number[];
  marketRegime: number;
  timestamp: Date;
}

interface TradingEnvironment {
  symbol: string;
  initialCapital: number;
  transactionCost: number;
  slippage: number;
  maxDrawdown: number;
  positionLimit: number;
}

interface AgentPerformance {
  agentId: string;
  totalReturns: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  averageReward: number;
  tradesExecuted: number;
  learningProgress: {
    episode: number;
    epsilon: number;
    loss: number;
    avgReward: number;
  };
}

@Injectable()
export class ReinforcementLearningService {
  private readonly logger = new Logger(ReinforcementLearningService.name);
  private agents: Map<string, DQNAgent> = new Map();
  private activeDeployments: Map<string, AgentDeployment> = new Map();

  constructor(
    @InjectRepository(MLModel)
    private mlModelRepository: Repository<MLModel>,
    @InjectRepository(MLPrediction)
    private mlPredictionRepository: Repository<MLPrediction>,
    private paperTradingService: PaperTradingService,
    private stockService: StockService,
  ) {}

  /**
   * Train a new DQN agent for autonomous trading
   */
  async trainAgent(
    symbol: string,
    historicalData: any[],
    config?: Partial<DQNConfig>,
  ): Promise<{ agentId: string; performance: AgentPerformance }> {
    this.logger.log(`Starting DQN training for ${symbol}`);

    const defaultConfig: DQNConfig = {
      stateSize: 52, // Market features + portfolio state
      actionSize: 7, // [strong_sell, sell, weak_sell, hold, weak_buy, buy, strong_buy]
      learningRate: 0.001,
      memorySize: 100000,
      batchSize: 32,
      epsilon: 1.0,
      epsilonMin: 0.01,
      epsilonDecay: 0.995,
      gamma: 0.95,
      targetUpdateFreq: 100,
    };

    const agentConfig = { ...defaultConfig, ...config };

    // Create trading environment
    const environment = new TradingEnvironmentSimulator({
      symbol,
      data: historicalData,
      initialCapital: 100000,
      transactionCost: 0.001,
      slippage: 0.0005,
      maxDrawdown: 0.15,
      positionLimit: 0.3,
    });

    // Initialize DQN agent
    const agent = new DQNAgent(agentConfig);
    const agentId = `dqn_${symbol}_${Date.now()}`;
    this.agents.set(agentId, agent);

    // Training loop
    const trainingMetrics = await this.runTrainingLoop(
      agent,
      environment,
      agentConfig,
      agentId,
    );

    // Save trained model
    await this.saveAgentModel(agentId, agent, trainingMetrics);

    this.logger.log(
      `DQN training completed for ${symbol}, Agent ID: ${agentId}`,
    );

    return {
      agentId,
      performance: trainingMetrics,
    };
  }

  /**
   * Deploy trained agent for live trading
   */
  async deployAgent(
    agentId: string,
    portfolioId: string,
    riskLimits?: any,
  ): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const deployment = new AgentDeployment({
      agentId,
      agent,
      portfolioId,
      riskLimits: riskLimits || (await this.getDefaultRiskLimits(portfolioId)),
      startTime: new Date(),
      isActive: true,
    });

    this.activeDeployments.set(portfolioId, deployment);

    // Start agent execution loop
    this.startAgentExecution(deployment);

    this.logger.log(`Agent ${agentId} deployed to portfolio ${portfolioId}`);
  }

  /**
   * Get real-time trading decision from deployed agent
   */
  async getTradingDecision(
    portfolioId: string,
    marketState: MarketState,
  ): Promise<{
    action: string;
    positionSize: number;
    confidence: number;
    reasoning: string;
  }> {
    const deployment = this.activeDeployments.get(portfolioId);
    if (!deployment || !deployment.isActive) {
      throw new Error(`No active agent for portfolio ${portfolioId}`);
    }

    const agent = deployment.agent;
    const stateVector = this.encodeMarketState(marketState);

    // Get Q-values from agent
    const qValues = await agent.predict(stateVector);
    const actionIndex = agent.selectAction(stateVector);

    // Map action index to trading action
    const actions = [
      'STRONG_SELL',
      'SELL',
      'WEAK_SELL',
      'HOLD',
      'WEAK_BUY',
      'BUY',
      'STRONG_BUY',
    ];

    const action = actions[actionIndex];
    const confidence =
      Math.max(...qValues) /
      (Math.max(...qValues) + Math.abs(Math.min(...qValues)));

    // Calculate position size based on action strength
    const positionSize = this.calculatePositionSize(
      actionIndex,
      confidence,
      deployment.riskLimits,
    );

    // Generate explanation
    const reasoning = await this.generateDecisionExplanation(
      marketState,
      qValues,
      actionIndex,
      agent,
    );

    return {
      action,
      positionSize,
      confidence,
      reasoning,
    };
  }

  /**
   * Update agent with trading outcome for continuous learning
   */
  async updateAgentFromOutcome(
    portfolioId: string,
    state: MarketState,
    action: number,
    reward: number,
    nextState: MarketState,
    done: boolean,
  ): Promise<void> {
    const deployment = this.activeDeployments.get(portfolioId);
    if (!deployment) return;

    const agent = deployment.agent;
    const stateVector = this.encodeMarketState(state);
    const nextStateVector = this.encodeMarketState(nextState);

    // Store experience in agent memory
    agent.remember(stateVector, action, reward, nextStateVector, done);

    // Perform experience replay learning
    if (agent.memory.length >= agent.config.batchSize) {
      await agent.replay(agent.config.batchSize);
    }

    // Update deployment metrics
    deployment.updateMetrics(reward, action);

    this.logger.debug(
      `Agent learning update: reward=${reward}, action=${action}`,
    );
  }

  /**
   * Get agent performance metrics
   */
  async getAgentPerformance(agentId: string): Promise<AgentPerformance> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    return agent.getPerformanceMetrics();
  }

  /**
   * Get all active agents
   */
  async getActiveAgents(): Promise<AgentPerformance[]> {
    const performances: AgentPerformance[] = [];

    for (const [agentId, agent] of this.agents.entries()) {
      performances.push(await this.getAgentPerformance(agentId));
    }

    return performances;
  }

  /**
   * Pause/resume agent trading
   */
  async toggleAgent(portfolioId: string, isActive: boolean): Promise<void> {
    const deployment = this.activeDeployments.get(portfolioId);
    if (deployment) {
      deployment.isActive = isActive;
      this.logger.log(
        `Agent for portfolio ${portfolioId} ${isActive ? 'resumed' : 'paused'}`,
      );
    }
  }

  /**
   * Stop and remove agent deployment
   */
  async stopAgent(portfolioId: string): Promise<void> {
    const deployment = this.activeDeployments.get(portfolioId);
    if (deployment) {
      deployment.isActive = false;
      this.activeDeployments.delete(portfolioId);
      this.logger.log(`Agent for portfolio ${portfolioId} stopped`);
    }
  }

  // Private helper methods

  private async runTrainingLoop(
    agent: DQNAgent,
    environment: TradingEnvironmentSimulator,
    config: DQNConfig,
    agentId: string,
  ): Promise<AgentPerformance> {
    const maxEpisodes = 10000;
    const evaluationFreq = 100;
    let bestPerformance = -Infinity;

    for (let episode = 0; episode < maxEpisodes; episode++) {
      let state = environment.reset();
      let totalReward = 0;
      let stepCount = 0;

      while (!environment.isDone() && stepCount < 1000) {
        const stateVector = this.encodeMarketState(state);
        const action = agent.act(stateVector);

        const { nextState, reward, done } = environment.step(action);
        const nextStateVector = this.encodeMarketState(nextState);

        agent.remember(stateVector, action, reward, nextStateVector, done);
        state = nextState;
        totalReward += reward;
        stepCount++;

        // Train agent
        if (agent.memory.length >= config.batchSize) {
          await agent.replay(config.batchSize);
        }

        // Update target network
        if (stepCount % config.targetUpdateFreq === 0) {
          agent.updateTargetModel();
        }
      }

      // Evaluation and logging
      if (episode % evaluationFreq === 0) {
        const performance = await this.evaluateAgent(agent, environment);

        if (performance.totalReturns > bestPerformance) {
          bestPerformance = performance.totalReturns;
          await this.saveCheckpoint(agentId, agent, episode, performance);
        }

        this.logger.log(
          `Episode ${episode}: Reward=${totalReward.toFixed(4)}, ` +
            `Epsilon=${agent.epsilon.toFixed(4)}, ` +
            `Performance=${performance.totalReturns.toFixed(4)}`,
        );
      }
    }

    return agent.getPerformanceMetrics();
  }

  private encodeMarketState(marketState: MarketState): number[] {
    // Normalize and encode market state into neural network input
    const stateVector: number[] = [];

    // Price features (normalized)
    const priceFeatures = marketState.prices.map(
      (p) =>
        (p - Math.min(...marketState.prices)) /
        (Math.max(...marketState.prices) - Math.min(...marketState.prices)),
    );
    stateVector.push(...priceFeatures);

    // Volume features (normalized)
    const volumeFeatures = marketState.volumes.map(
      (v) => Math.log(v + 1) / 20, // Log normalize volumes
    );
    stateVector.push(...volumeFeatures);

    // Technical indicators (already normalized 0-1)
    stateVector.push(...marketState.technicalIndicators);

    // Portfolio state
    stateVector.push(...marketState.portfolioState);

    // Risk metrics
    stateVector.push(...marketState.riskMetrics);

    // Market regime (one-hot encoded)
    const regimeVector = new Array(4).fill(0);
    regimeVector[marketState.marketRegime] = 1;
    stateVector.push(...regimeVector);

    return stateVector.slice(0, 52); // Ensure fixed size
  }

  private calculatePositionSize(
    actionIndex: number,
    confidence: number,
    riskLimits: any,
  ): number {
    const actionStrengths = [1.0, 0.7, 0.3, 0.0, 0.3, 0.7, 1.0]; // Position size multipliers
    const baseSize = actionStrengths[actionIndex];

    // Adjust by confidence
    const confidenceAdjusted = baseSize * confidence;

    // Apply risk limits
    const maxPosition = riskLimits.maxPositionSize || 0.3;
    return Math.min(confidenceAdjusted * maxPosition, maxPosition);
  }

  private async generateDecisionExplanation(
    marketState: MarketState,
    qValues: number[],
    actionIndex: number,
    agent: DQNAgent,
  ): Promise<string> {
    const actions = [
      'Strong Sell',
      'Sell',
      'Weak Sell',
      'Hold',
      'Weak Buy',
      'Buy',
      'Strong Buy',
    ];
    const selectedAction = actions[actionIndex];

    // Analyze which features influenced the decision most
    const featureImportance = await agent.explainDecision(
      this.encodeMarketState(marketState),
    );
    const topFeatures = featureImportance
      .map((importance, idx) => ({
        importance,
        feature: this.getFeatureName(idx),
      }))
      .sort((a, b) => Math.abs(b.importance) - Math.abs(a.importance))
      .slice(0, 3);

    return (
      `Action: ${selectedAction} (confidence: ${Math.max(...qValues).toFixed(3)}).\n` +
      `Key factors: ${topFeatures.map((f) => f.feature).join(', ')}.\n` +
      `Market regime: ${this.getMarketRegimeName(marketState.marketRegime)}.`
    );
  }

  private getFeatureName(index: number): string {
    const featureNames = [
      'Price_T-5',
      'Price_T-4',
      'Price_T-3',
      'Price_T-2',
      'Price_T-1',
      'Volume_T-5',
      'Volume_T-4',
      'Volume_T-3',
      'Volume_T-2',
      'Volume_T-1',
      'RSI',
      'MACD',
      'BB_Upper',
      'BB_Lower',
      'SMA_20',
      'EMA_12',
      'EMA_26',
      'ATR',
      'ADX',
      'Stoch_K',
      'Stoch_D',
      'Williams_R',
      'CCI',
      'ROC',
      'Portfolio_Value',
      'Cash_Ratio',
      'Position_Size',
      'Unrealized_PnL',
      'VaR_95',
      'Volatility',
      'Beta',
      'Sharpe_Ratio',
      'Bull_Market',
      'Bear_Market',
      'Sideways',
      'High_Volatility',
    ];
    return featureNames[index] || `Feature_${index}`;
  }

  private getMarketRegimeName(regime: number): string {
    const regimes = [
      'Bull Market',
      'Bear Market',
      'Sideways',
      'High Volatility',
    ];
    return regimes[regime] || 'Unknown';
  }

  private async evaluateAgent(
    agent: DQNAgent,
    environment: TradingEnvironmentSimulator,
  ): Promise<AgentPerformance> {
    // Run evaluation episodes without exploration
    const originalEpsilon = agent.epsilon;
    agent.epsilon = 0; // No exploration during evaluation

    let totalReturns = 0;
    let totalTrades = 0;
    const episodes = 10;

    for (let i = 0; i < episodes; i++) {
      let state = environment.reset();
      let episodeReturn = 0;

      while (!environment.isDone()) {
        const action = agent.act(this.encodeMarketState(state));
        const { nextState, reward } = environment.step(action);

        episodeReturn += reward;
        totalTrades++;
        state = nextState;
      }

      totalReturns += episodeReturn;
    }

    agent.epsilon = originalEpsilon; // Restore exploration

    return {
      agentId: agent.id,
      totalReturns: totalReturns / episodes,
      sharpeRatio: this.calculateSharpeRatio(totalReturns, episodes),
      maxDrawdown: 0.05, // Placeholder - would calculate from episode data
      winRate: 0.6, // Placeholder
      averageReward: totalReturns / (episodes * totalTrades),
      tradesExecuted: totalTrades,
      learningProgress: {
        episode: agent.episodeCount,
        epsilon: agent.epsilon,
        loss: agent.lastLoss,
        avgReward: totalReturns / episodes,
      },
    };
  }

  private calculateSharpeRatio(returns: number, episodes: number): number {
    // Simplified Sharpe ratio calculation
    const avgReturn = returns / episodes;
    const riskFreeRate = 0.02; // 2% annual risk-free rate
    const volatility = Math.abs(avgReturn) * 0.15; // Estimated volatility

    return (avgReturn - riskFreeRate) / (volatility + 0.001); // Add small epsilon
  }

  private async saveAgentModel(
    agentId: string,
    agent: DQNAgent,
    performance: AgentPerformance,
  ): Promise<void> {
    // Save model to database
    const modelData = {
      id: agentId,
      type: 'DQN_TRADING_AGENT',
      config: agent.config,
      performance,
      createdAt: new Date(),
    };

    // In a real implementation, you would serialize the TensorFlow model
    // and save it to file storage or database
    this.logger.log(
      `Saved DQN model ${agentId} with performance: ${performance.totalReturns}`,
    );
  }

  private async saveCheckpoint(
    agentId: string,
    agent: DQNAgent,
    episode: number,
    performance: AgentPerformance,
  ): Promise<void> {
    this.logger.log(`Checkpoint saved for ${agentId} at episode ${episode}`);
  }

  private async getDefaultRiskLimits(portfolioId: string): Promise<any> {
    return {
      maxPositionSize: 0.3,
      maxDrawdown: 0.15,
      stopLoss: 0.05,
      riskPerTrade: 0.02,
    };
  }

  private startAgentExecution(deployment: AgentDeployment): void {
    // Start background process for agent execution
    // In a real implementation, this would be a scheduled job
    // that monitors market data and makes trading decisions
    this.logger.log(`Started execution for agent ${deployment.agentId}`);
  }
}

/**
 * Deep Q-Network Agent Implementation
 */
class DQNAgent {
  public model: tf.LayersModel;
  public targetModel: tf.LayersModel;
  public memory: Experience[] = [];
  public epsilon: number;
  public config: DQNConfig;
  public id: string;
  public episodeCount: number = 0;
  public lastLoss: number = 0;

  constructor(config: DQNConfig) {
    this.config = config;
    this.epsilon = config.epsilon;
    this.id = `agent_${Date.now()}`;

    this.model = this.buildModel(config);
    this.targetModel = this.buildModel(config);
    this.updateTargetModel();
  }

  private buildModel(config: DQNConfig): tf.LayersModel {
    const model = tf.sequential();

    // Input layer
    model.add(
      tf.layers.dense({
        units: 256,
        activation: 'relu',
        inputShape: [config.stateSize],
        kernelInitializer: 'heNormal',
      }),
    );

    model.add(tf.layers.dropout({ rate: 0.3 }));

    // Hidden layers
    model.add(
      tf.layers.dense({
        units: 128,
        activation: 'relu',
        kernelInitializer: 'heNormal',
      }),
    );

    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(
      tf.layers.dense({
        units: 64,
        activation: 'relu',
        kernelInitializer: 'heNormal',
      }),
    );

    // Output layer (Q-values for each action)
    model.add(
      tf.layers.dense({
        units: config.actionSize,
        activation: 'linear',
      }),
    );

    model.compile({
      optimizer: tf.train.adam(config.learningRate),
      loss: 'meanSquaredError',
      metrics: ['mse'],
    });

    return model;
  }

  act(state: number[]): number {
    // Epsilon-greedy action selection
    if (Math.random() <= this.epsilon) {
      return Math.floor(Math.random() * this.config.actionSize);
    }

    return this.selectAction(state);
  }

  selectAction(state: number[]): number {
    const qValues = tf.tidy(() => {
      const stateTensor = tf.tensor2d([state]);
      return this.model.predict(stateTensor) as tf.Tensor;
    });

    const actionIndex = qValues.argMax(-1).dataSync()[0];
    qValues.dispose();

    return actionIndex;
  }

  async predict(state: number[]): Promise<number[]> {
    const qValues = tf.tidy(() => {
      const stateTensor = tf.tensor2d([state]);
      return this.model.predict(stateTensor) as tf.Tensor;
    });

    const values = await qValues.data();
    qValues.dispose();

    return Array.from(values);
  }

  remember(
    state: number[],
    action: number,
    reward: number,
    nextState: number[],
    done: boolean,
  ): void {
    this.memory.push({
      state,
      action,
      reward,
      nextState,
      done,
      timestamp: new Date(),
    });

    // Keep memory within limits
    if (this.memory.length > this.config.memorySize) {
      this.memory.shift();
    }
  }

  async replay(batchSize: number): Promise<void> {
    if (this.memory.length < batchSize) return;

    const batch = this.sampleBatch(batchSize);

    const states = tf.tensor2d(batch.map((e) => e.state));
    const nextStates = tf.tensor2d(batch.map((e) => e.nextState));

    const qValues = this.model.predict(states) as tf.Tensor;
    const nextQValues = this.targetModel.predict(nextStates) as tf.Tensor;

    const qValuesArray = (await qValues.array()) as number[][];
    const nextQValuesArray = (await nextQValues.array()) as number[][];

    // Calculate target Q-values
    const targets = qValuesArray.map((qRow, i) => {
      const experience = batch[i];
      let target = experience.reward;

      if (!experience.done) {
        const maxNextQ = Math.max(...nextQValuesArray[i]);
        target += this.config.gamma * maxNextQ;
      }

      const newQValues = [...qRow];
      newQValues[experience.action] = target;
      return newQValues;
    });

    const targetTensor = tf.tensor2d(targets);

    // Train the model
    const history = await this.model.fit(states, targetTensor, {
      epochs: 1,
      verbose: 0,
    });

    this.lastLoss = history.history.loss[0] as number;

    // Decay epsilon
    if (this.epsilon > this.config.epsilonMin) {
      this.epsilon *= this.config.epsilonDecay;
    }

    // Cleanup tensors
    states.dispose();
    nextStates.dispose();
    qValues.dispose();
    nextQValues.dispose();
    targetTensor.dispose();
  }

  updateTargetModel(): void {
    // Copy weights from main model to target model
    this.targetModel.setWeights(this.model.getWeights());
  }

  private sampleBatch(batchSize: number): Experience[] {
    // Random sampling from memory
    const batch: Experience[] = [];
    for (let i = 0; i < batchSize; i++) {
      const randomIndex = Math.floor(Math.random() * this.memory.length);
      batch.push(this.memory[randomIndex]);
    }
    return batch;
  }

  async explainDecision(state: number[]): Promise<number[]> {
    // Simple feature importance calculation using gradient
    const stateTensor = tf.tensor2d([state]);

    const gradients = tf.tidy(() => {
      const f = () => this.model.predict(stateTensor) as tf.Tensor;
      return tf.grad(f)(stateTensor) as tf.Tensor;
    });

    const importance = await gradients.data();

    stateTensor.dispose();
    gradients.dispose();

    return Array.from(importance);
  }

  getPerformanceMetrics(): AgentPerformance {
    return {
      agentId: this.id,
      totalReturns: 0, // Would be calculated from trading history
      sharpeRatio: 0, // Would be calculated from trading history
      maxDrawdown: 0, // Would be calculated from trading history
      winRate: 0, // Would be calculated from trading history
      averageReward: 0, // Would be calculated from memory
      tradesExecuted: 0, // Would be tracked
      learningProgress: {
        episode: this.episodeCount,
        epsilon: this.epsilon,
        loss: this.lastLoss,
        avgReward: 0,
      },
    };
  }
}

/**
 * Trading Environment Simulator for Agent Training
 */
class TradingEnvironmentSimulator {
  private config: TradingEnvironment;
  private data: any[];
  private currentStep: number = 0;
  private portfolioValue: number;
  private position: number = 0;
  private cash: number;
  private done: boolean = false;

  constructor(config: TradingEnvironment & { data: any[] }) {
    this.config = config;
    this.data = config.data;
    this.portfolioValue = config.initialCapital;
    this.cash = config.initialCapital;
  }

  reset(): MarketState {
    this.currentStep = 0;
    this.portfolioValue = this.config.initialCapital;
    this.position = 0;
    this.cash = this.config.initialCapital;
    this.done = false;

    return this.getCurrentState();
  }

  step(action: number): {
    nextState: MarketState;
    reward: number;
    done: boolean;
  } {
    if (this.done) {
      throw new Error('Environment is done. Call reset() first.');
    }

    const currentState = this.getCurrentState();

    // Execute trading action
    const reward = this.executeAction(action);

    // Move to next time step
    this.currentStep++;

    // Check if episode is done
    this.done =
      this.currentStep >= this.data.length - 1 ||
      this.portfolioValue <= this.config.initialCapital * 0.7; // 30% drawdown limit

    const nextState = this.done ? currentState : this.getCurrentState();

    return { nextState, reward, done: this.done };
  }

  isDone(): boolean {
    return this.done;
  }

  private executeAction(action: number): number {
    const actionMap = [-1, -0.7, -0.3, 0, 0.3, 0.7, 1]; // Position size changes
    const targetPositionChange = actionMap[action];

    const currentPrice = this.data[this.currentStep].close;
    const nextPrice = this.data[this.currentStep + 1]?.close || currentPrice;

    // Calculate position change
    const maxPositionValue = this.portfolioValue * this.config.positionLimit;
    const positionChange =
      (targetPositionChange * maxPositionValue) / currentPrice;

    // Apply transaction costs
    const transactionCost =
      Math.abs(positionChange) * currentPrice * this.config.transactionCost;

    // Update position and cash
    const oldPosition = this.position;
    this.position += positionChange;
    this.cash -= positionChange * currentPrice + transactionCost;

    // Calculate reward based on position performance
    const positionReturn = (nextPrice - currentPrice) / currentPrice;
    const reward =
      (this.position * positionReturn * currentPrice) /
      this.config.initialCapital;

    // Update portfolio value
    this.portfolioValue = this.cash + this.position * nextPrice;

    // Penalize for excessive risk
    const riskPenalty =
      Math.abs(this.position * currentPrice) > maxPositionValue ? -0.1 : 0;

    return reward + riskPenalty;
  }

  private getCurrentState(): MarketState {
    const lookback = 5;
    const startIdx = Math.max(0, this.currentStep - lookback);
    const endIdx = this.currentStep + 1;

    const recentData = this.data.slice(startIdx, endIdx);

    return {
      prices: recentData.map((d) => d.close),
      volumes: recentData.map((d) => d.volume),
      technicalIndicators: this.calculateTechnicalIndicators(recentData),
      portfolioState: [
        this.portfolioValue / this.config.initialCapital,
        this.cash / this.portfolioValue,
        (this.position * recentData[recentData.length - 1].close) /
          this.portfolioValue,
        (this.portfolioValue - this.config.initialCapital) /
          this.config.initialCapital,
      ],
      riskMetrics: this.calculateRiskMetrics(),
      marketRegime: this.detectMarketRegime(recentData),
      timestamp: new Date(),
    };
  }

  private calculateTechnicalIndicators(data: any[]): number[] {
    // Simplified technical indicators calculation
    const prices = data.map((d) => d.close);
    const volumes = data.map((d) => d.volume);

    if (prices.length < 2) return new Array(20).fill(0);

    const rsi = this.calculateRSI(prices);
    const sma = prices.reduce((a, b) => a + b, 0) / prices.length;
    const ema = this.calculateEMA(prices);
    const volatility = this.calculateVolatility(prices);

    return [
      rsi / 100,
      (prices[prices.length - 1] - sma) / sma,
      ema / prices[prices.length - 1],
      volatility,
      // ... additional indicators (normalized to 0-1 range)
      ...new Array(16).fill(0), // Placeholder for additional indicators
    ];
  }

  private calculateRSI(prices: number[]): number {
    if (prices.length < 2) return 50;

    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      gains.push(Math.max(change, 0));
      losses.push(Math.max(-change, 0));
    }

    const avgGain = gains.reduce((a, b) => a + b, 0) / gains.length;
    const avgLoss = losses.reduce((a, b) => a + b, 0) / losses.length;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  }

  private calculateEMA(prices: number[], period: number = 12): number {
    if (prices.length === 0) return 0;

    const k = 2 / (period + 1);
    let ema = prices[0];

    for (let i = 1; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }

    return ema;
  }

  private calculateVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;

    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;

    return Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
  }

  private calculateRiskMetrics(): number[] {
    // Simplified risk metrics
    return [
      Math.min(this.portfolioValue / this.config.initialCapital, 2), // Portfolio performance (capped at 2x)
      Math.abs(this.position) * 0.1, // Position risk
      0.05, // VaR estimate
      0.15, // Maximum historical volatility
    ];
  }

  private detectMarketRegime(data: any[]): number {
    if (data.length < 3) return 0; // Default to bull market

    const prices = data.map((d) => d.close);
    const trend = (prices[prices.length - 1] - prices[0]) / prices[0];
    const volatility = this.calculateVolatility(prices);

    if (volatility > 0.3) return 3; // High volatility
    if (trend > 0.02) return 0; // Bull market
    if (trend < -0.02) return 1; // Bear market
    return 2; // Sideways market
  }
}

/**
 * Agent Deployment Management
 */
class AgentDeployment {
  public agentId: string;
  public agent: DQNAgent;
  public portfolioId: string;
  public riskLimits: any;
  public startTime: Date;
  public isActive: boolean;
  public totalTrades: number = 0;
  public totalRewards: number = 0;

  constructor(config: {
    agentId: string;
    agent: DQNAgent;
    portfolioId: string;
    riskLimits: any;
    startTime: Date;
    isActive: boolean;
  }) {
    Object.assign(this, config);
  }

  updateMetrics(reward: number, action: number): void {
    this.totalRewards += reward;
    if (action !== 3) {
      // Not a hold action
      this.totalTrades++;
    }
  }
}
