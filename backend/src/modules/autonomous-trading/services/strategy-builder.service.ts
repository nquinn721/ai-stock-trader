import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TradingStrategy,
  StrategyNode,
  StrategyConfig,
  StrategyType,
} from '../entities/trading-strategy.entity';

export interface CreateStrategyDto {
  name: string;
  description?: string;
  strategyType: StrategyType;
  userId: string;
  portfolioId: string;
  config?: Partial<StrategyConfig>;
}

export interface StrategyTemplate {
  id: string;
  name: string;
  description: string;
  category: 'TREND_FOLLOWING' | 'MEAN_REVERSION' | 'MOMENTUM' | 'ARBITRAGE' | 'ML_ENHANCED';
  complexity: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  config: StrategyConfig;
  expectedReturn: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

@Injectable()
export class StrategyBuilderService {
  private readonly logger = new Logger(StrategyBuilderService.name);

  constructor(
    @InjectRepository(TradingStrategy)
    private readonly strategyRepository: Repository<TradingStrategy>,
  ) {}

  /**
   * Create a new trading strategy
   */
  async createStrategy(createDto: CreateStrategyDto): Promise<TradingStrategy> {
    try {
      const defaultConfig: StrategyConfig = {
        nodes: [],
        connections: [],
        settings: {
          riskTolerance: 'MEDIUM',
          maxDrawdown: 0.1,
          positionSizing: 'PERCENTAGE',
          timeframes: ['1h', '4h', '1d'],
          symbols: [],
        },
      };

      const strategy = this.strategyRepository.create({
        name: createDto.name,
        description: createDto.description,
        strategy_type: createDto.strategyType,
        user_id: createDto.userId,
        portfolio_id: createDto.portfolioId,
        config: { ...defaultConfig, ...createDto.config },
        metadata: {
          tags: [],
          complexity: 'BEGINNER',
          estimatedExecutionTime: 0,
          mlModelsUsed: [],
        },
      });

      const saved = await this.strategyRepository.save(strategy);
      this.logger.log(`Strategy created: ${saved.name} (${saved.id})`);
      
      return saved;
    } catch (error) {
      this.logger.error('Error creating strategy:', error);
      throw error;
    }
  }

  /**
   * Get strategy templates for quick start
   */
  async getStrategyTemplates(): Promise<StrategyTemplate[]> {
    return [
      {
        id: 'moving_average_crossover',
        name: 'Moving Average Crossover',
        description: 'Buy when short MA crosses above long MA, sell when opposite',
        category: 'TREND_FOLLOWING',
        complexity: 'BEGINNER',
        expectedReturn: 0.12,
        riskLevel: 'MEDIUM',
        config: {
          nodes: [
            {
              id: 'ma_short',
              type: 'condition',
              position: { x: 100, y: 100 },
              data: { indicator: 'SMA', period: 20 },
              connections: ['crossover_check'],
            },
            {
              id: 'ma_long',
              type: 'condition',
              position: { x: 100, y: 200 },
              data: { indicator: 'SMA', period: 50 },
              connections: ['crossover_check'],
            },
            {
              id: 'crossover_check',
              type: 'logic',
              position: { x: 300, y: 150 },
              data: { operator: 'CROSSOVER' },
              connections: ['buy_action', 'sell_action'],
            },
            {
              id: 'buy_action',
              type: 'action',
              position: { x: 500, y: 100 },
              data: { action: 'BUY', sizing: 'PERCENTAGE', value: 5 },
              connections: [],
            },
            {
              id: 'sell_action',
              type: 'action',
              position: { x: 500, y: 200 },
              data: { action: 'SELL', sizing: 'FULL_POSITION' },
              connections: [],
            },
          ],
          connections: [
            { from: 'ma_short', to: 'crossover_check', type: 'data' },
            { from: 'ma_long', to: 'crossover_check', type: 'data' },
            { from: 'crossover_check', to: 'buy_action', type: 'trigger' },
            { from: 'crossover_check', to: 'sell_action', type: 'trigger' },
          ],
          settings: {
            riskTolerance: 'MEDIUM',
            maxDrawdown: 0.15,
            positionSizing: 'PERCENTAGE',
            timeframes: ['1h', '4h'],
            symbols: ['SPY', 'QQQ', 'IWM'],
          },
        },
      },
      {
        id: 'rsi_mean_reversion',
        name: 'RSI Mean Reversion',
        description: 'Buy oversold conditions (RSI < 30), sell overbought (RSI > 70)',
        category: 'MEAN_REVERSION',
        complexity: 'BEGINNER',
        expectedReturn: 0.08,
        riskLevel: 'LOW',
        config: {
          nodes: [
            {
              id: 'rsi_indicator',
              type: 'condition',
              position: { x: 100, y: 150 },
              data: { indicator: 'RSI', period: 14 },
              connections: ['oversold_check', 'overbought_check'],
            },
            {
              id: 'oversold_check',
              type: 'logic',
              position: { x: 300, y: 100 },
              data: { operator: 'LESS_THAN', value: 30 },
              connections: ['buy_action'],
            },
            {
              id: 'overbought_check',
              type: 'logic',
              position: { x: 300, y: 200 },
              data: { operator: 'GREATER_THAN', value: 70 },
              connections: ['sell_action'],
            },
            {
              id: 'buy_action',
              type: 'action',
              position: { x: 500, y: 100 },
              data: { action: 'BUY', sizing: 'PERCENTAGE', value: 3 },
              connections: [],
            },
            {
              id: 'sell_action',
              type: 'action',
              position: { x: 500, y: 200 },
              data: { action: 'SELL', sizing: 'FULL_POSITION' },
              connections: [],
            },
          ],
          connections: [
            { from: 'rsi_indicator', to: 'oversold_check', type: 'data' },
            { from: 'rsi_indicator', to: 'overbought_check', type: 'data' },
            { from: 'oversold_check', to: 'buy_action', type: 'trigger' },
            { from: 'overbought_check', to: 'sell_action', type: 'trigger' },
          ],
          settings: {
            riskTolerance: 'LOW',
            maxDrawdown: 0.1,
            positionSizing: 'PERCENTAGE',
            timeframes: ['1d'],
            symbols: ['SPY', 'QQQ'],
          },
        },
      },
      {
        id: 'ml_enhanced_momentum',
        name: 'ML-Enhanced Momentum',
        description: 'Combines momentum indicators with ML predictions',
        category: 'ML_ENHANCED',
        complexity: 'ADVANCED',
        expectedReturn: 0.18,
        riskLevel: 'HIGH',
        config: {
          nodes: [
            {
              id: 'ml_signal',
              type: 'ml_signal',
              position: { x: 100, y: 100 },
              data: { model: 'MOMENTUM_PREDICTOR', confidence_threshold: 0.7 },
              connections: ['momentum_filter'],
            },
            {
              id: 'momentum_indicator',
              type: 'condition',
              position: { x: 100, y: 200 },
              data: { indicator: 'MACD' },
              connections: ['momentum_filter'],
            },
            {
              id: 'momentum_filter',
              type: 'logic',
              position: { x: 300, y: 150 },
              data: { operator: 'AND' },
              connections: ['position_sizing'],
            },
            {
              id: 'position_sizing',
              type: 'ml_signal',
              position: { x: 500, y: 150 },
              data: { model: 'POSITION_OPTIMIZER' },
              connections: ['trade_action'],
            },
            {
              id: 'trade_action',
              type: 'action',
              position: { x: 700, y: 150 },
              data: { action: 'DYNAMIC', sizing: 'ML_OPTIMIZED' },
              connections: [],
            },
          ],
          connections: [
            { from: 'ml_signal', to: 'momentum_filter', type: 'data' },
            { from: 'momentum_indicator', to: 'momentum_filter', type: 'data' },
            { from: 'momentum_filter', to: 'position_sizing', type: 'trigger' },
            { from: 'position_sizing', to: 'trade_action', type: 'data' },
          ],
          settings: {
            riskTolerance: 'HIGH',
            maxDrawdown: 0.2,
            positionSizing: 'ML_OPTIMIZED',
            timeframes: ['15m', '1h', '4h'],
            symbols: ['SPY', 'QQQ', 'IWM', 'TLT', 'GLD'],
          },
        },
      },
    ];
  }

  /**
   * Create strategy from template
   */
  async createFromTemplate(
    templateId: string,
    userId: string,
    portfolioId: string,
    customName?: string,
  ): Promise<TradingStrategy> {
    const templates = await this.getStrategyTemplates();
    const template = templates.find(t => t.id === templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    return this.createStrategy({
      name: customName || template.name,
      description: template.description,
      strategyType: 'TEMPLATE',
      userId,
      portfolioId,
      config: template.config,
    });
  }

  /**
   * Update strategy configuration
   */
  async updateStrategy(
    strategyId: string,
    updates: Partial<TradingStrategy>,
  ): Promise<TradingStrategy> {
    try {
      await this.strategyRepository.update(strategyId, {
        ...updates,
        version: () => 'version + 1',
        updated_at: new Date(),
      });

      const updated = await this.strategyRepository.findOne({
        where: { id: strategyId },
      });

      if (!updated) {
        throw new Error('Strategy not found');
      }

      this.logger.log(`Strategy updated: ${updated.name} (${strategyId})`);
      return updated;
    } catch (error) {
      this.logger.error(`Error updating strategy ${strategyId}:`, error);
      throw error;
    }
  }

  /**
   * Add node to strategy
   */
  async addNode(strategyId: string, node: StrategyNode): Promise<TradingStrategy> {
    const strategy = await this.strategyRepository.findOne({
      where: { id: strategyId },
    });

    if (!strategy) {
      throw new Error('Strategy not found');
    }

    const updatedConfig = {
      ...strategy.config,
      nodes: [...strategy.config.nodes, node],
    };

    return this.updateStrategy(strategyId, { config: updatedConfig });
  }

  /**
   * Remove node from strategy
   */
  async removeNode(strategyId: string, nodeId: string): Promise<TradingStrategy> {
    const strategy = await this.strategyRepository.findOne({
      where: { id: strategyId },
    });

    if (!strategy) {
      throw new Error('Strategy not found');
    }

    const updatedConfig = {
      ...strategy.config,
      nodes: strategy.config.nodes.filter(n => n.id !== nodeId),
      connections: strategy.config.connections.filter(
        c => c.from !== nodeId && c.to !== nodeId,
      ),
    };

    return this.updateStrategy(strategyId, { config: updatedConfig });
  }

  /**
   * Validate strategy configuration
   */
  async validateStrategy(strategyId: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const strategy = await this.strategyRepository.findOne({
      where: { id: strategyId },
    });

    if (!strategy) {
      return {
        isValid: false,
        errors: ['Strategy not found'],
        warnings: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate nodes
    if (strategy.config.nodes.length === 0) {
      errors.push('Strategy must have at least one node');
    }

    // Check for action nodes
    const actionNodes = strategy.config.nodes.filter(n => n.type === 'action');
    if (actionNodes.length === 0) {
      errors.push('Strategy must have at least one action node');
    }

    // Validate connections
    for (const connection of strategy.config.connections) {
      const fromNode = strategy.config.nodes.find(n => n.id === connection.from);
      const toNode = strategy.config.nodes.find(n => n.id === connection.to);
      
      if (!fromNode) {
        errors.push(`Connection references missing source node: ${connection.from}`);
      }
      if (!toNode) {
        errors.push(`Connection references missing target node: ${connection.to}`);
      }
    }

    // Check for orphaned nodes
    const connectedNodes = new Set([
      ...strategy.config.connections.map(c => c.from),
      ...strategy.config.connections.map(c => c.to),
    ]);

    const orphanedNodes = strategy.config.nodes.filter(
      n => !connectedNodes.has(n.id) && n.type !== 'action',
    );

    if (orphanedNodes.length > 0) {
      warnings.push(`${orphanedNodes.length} orphaned nodes detected`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get user strategies
   */
  async getUserStrategies(userId: string): Promise<TradingStrategy[]> {
    return this.strategyRepository.find({
      where: { user_id: userId },
      order: { updated_at: 'DESC' },
    });
  }

  /**
   * Get strategy by ID
   */
  async getStrategy(strategyId: string): Promise<TradingStrategy | null> {
    return this.strategyRepository.findOne({
      where: { id: strategyId },
    });
  }

  /**
   * Delete strategy
   */
  async deleteStrategy(strategyId: string): Promise<void> {
    const result = await this.strategyRepository.delete(strategyId);
    if (result.affected === 0) {
      throw new Error('Strategy not found');
    }
    this.logger.log(`Strategy deleted: ${strategyId}`);
  }
}