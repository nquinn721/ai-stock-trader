import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RuleAction,
  RuleCondition,
  TradingRule,
} from '../entities/trading-rule.entity';

export interface TradingContext {
  symbol: string;
  currentPrice: number;
  portfolioValue: number;
  cashBalance: number;
  positions: any[];
  marketData: any;
  recommendation?: {
    type: string;
    confidence: number;
    reasoning: string;
  };
  technicalIndicators?: {
    rsi?: number;
    macd?: number;
    volume?: number;
    volatility?: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class RuleEngineService {
  private readonly logger = new Logger(RuleEngineService.name);

  constructor(
    @InjectRepository(TradingRule)
    private readonly tradingRuleRepository: Repository<TradingRule>,
  ) {}

  /**
   * Evaluate a trading rule against the current trading context
   */
  async evaluateRule(
    rule: TradingRule,
    context: TradingContext,
  ): Promise<boolean> {
    try {
      if (!rule.is_active) {
        return false;
      }

      this.logger.debug(`Evaluating rule: ${rule.name} for ${context.symbol}`);

      return await this.evaluateConditions(rule.conditions, context);
    } catch (error) {
      this.logger.error(`Error evaluating rule ${rule.id}:`, error);
      return false;
    }
  }

  /**
   * Evaluate all conditions for a rule
   */
  async evaluateConditions(
    conditions: RuleCondition[],
    context: TradingContext,
  ): Promise<boolean> {
    if (!conditions || conditions.length === 0) {
      return true;
    }

    let result = true;
    let currentLogical = 'AND';

    for (const condition of conditions) {
      const conditionResult = this.evaluateCondition(condition, context);

      if (currentLogical === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }

      // Update logical operator for next condition
      currentLogical = condition.logical || 'AND';
    }

    return result;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: RuleCondition,
    context: TradingContext,
  ): boolean {
    const fieldValue = this.getFieldValue(condition.field, context);
    const expectedValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return fieldValue === expectedValue;
      case 'not_equals':
        return fieldValue !== expectedValue;
      case 'greater_than':
        return Number(fieldValue) > Number(expectedValue);
      case 'less_than':
        return Number(fieldValue) < Number(expectedValue);
      case 'greater_equal':
        return Number(fieldValue) >= Number(expectedValue);
      case 'less_equal':
        return Number(fieldValue) <= Number(expectedValue);
      default:
        this.logger.warn(`Unknown operator: ${condition.operator}`);
        return false;
    }
  }

  /**
   * Get field value from trading context
   */
  private getFieldValue(field: string, context: TradingContext): any {
    const fieldParts = field.split('.');

    if (fieldParts.length === 1) {
      // Direct context fields
      switch (field) {
        case 'symbol':
          return context.symbol;
        case 'current_price':
          return context.currentPrice;
        case 'portfolio_value':
          return context.portfolioValue;
        case 'cash_balance':
          return context.cashBalance;
        case 'portfolio_cash_percentage':
          return (context.cashBalance / context.portfolioValue) * 100;
        case 'ai_recommendation':
          return context.recommendation?.type;
        case 'confidence_score':
          return context.recommendation?.confidence;
        // Additional ML and trading fields (graceful fallbacks)
        case 'ml_recommendation':
          return context.recommendation?.type;
        case 'ml_confidence':
          return context.recommendation?.confidence;
        case 'proposed_position_percent':
          return 0; // Default to 0 for missing position percentage
        case 'position_loss_percent':
          return 0; // Default to 0 for missing loss percentage
        case 'position_gain_percent':
          return 0; // Default to 0 for missing gain percentage
        case 'market_hours':
          return true; // Default to market hours open
        case 'rsi':
          return context.technicalIndicators?.rsi || null;
        case 'volume_spike':
          return false; // Default to no volume spike
        default:
          // Reduce log spam - only warn for truly unknown fields in debug mode
          if (process.env.LOG_LEVEL === 'debug') {
            this.logger.warn(`Unknown field: ${field}`);
          }
          return null;
      }
    }

    // Nested fields
    const [parent, child] = fieldParts;
    switch (parent) {
      case 'technical':
        return context.technicalIndicators?.[child];
      case 'recommendation':
        return context.recommendation?.[child];
      case 'position':
        // Handle position-specific fields
        const position = context.positions.find(
          (p) => p.symbol === context.symbol,
        );
        if (position) {
          if (child === 'pnl_percentage') {
            return (
              ((position.current_value - position.cost_basis) /
                position.cost_basis) *
              100
            );
          }
          return position[child];
        }
        return null;
      default:
        this.logger.warn(`Unknown parent field: ${parent}`);
        return null;
    }
  }

  /**
   * Execute actions triggered by rule evaluation
   */
  async executeActions(
    actions: RuleAction[],
    context: TradingContext,
  ): Promise<any[]> {
    const results: any[] = [];

    for (const action of actions) {
      try {
        const result = await this.executeAction(action, context);
        results.push(result);
      } catch (error) {
        this.logger.error(`Error executing action:`, error);
        results.push({ error: error.message });
      }
    }

    return results;
  }

  /**
   * Execute a single action
   */
  private async executeAction(
    action: RuleAction,
    context: TradingContext,
  ): Promise<any> {
    this.logger.debug(`Executing action: ${action.type} for ${context.symbol}`);

    const quantity = this.calculateQuantity(action, context);
    const price = this.calculatePrice(action, context);

    return {
      type: action.type,
      symbol: context.symbol,
      quantity,
      price,
      price_type: action.price_type || 'market',
      timestamp: new Date(),
    };
  }

  /**
   * Calculate trade quantity based on sizing method
   */
  private calculateQuantity(
    action: RuleAction,
    context: TradingContext,
  ): number {
    switch (action.sizing_method) {
      case 'fixed':
        return action.size_value || 0;

      case 'percentage':
        const percentage = action.size_value || 5;
        const dollarsToInvest = (context.portfolioValue * percentage) / 100;
        return Math.floor(dollarsToInvest / context.currentPrice);

      case 'full_position':
        const position = context.positions.find(
          (p) => p.symbol === context.symbol,
        );
        return position ? position.quantity : 0;

      case 'kelly':
        // Simplified Kelly criterion calculation
        const winRate = 0.6; // Default assumption
        const avgWin = 0.05; // 5% average win
        const avgLoss = 0.03; // 3% average loss
        const kellyPercentage = winRate - (1 - winRate) / (avgWin / avgLoss);
        const kellyDollars =
          (context.portfolioValue * Math.max(0, kellyPercentage)) / 100;
        return Math.floor(kellyDollars / context.currentPrice);

      default:
        return 0;
    }
  }

  /**
   * Calculate trade price based on price type
   */
  private calculatePrice(action: RuleAction, context: TradingContext): number {
    const offset = action.price_offset || 0;

    switch (action.price_type) {
      case 'market':
        return context.currentPrice;
      case 'limit':
        return context.currentPrice + offset;
      case 'stop':
        return context.currentPrice + offset;
      default:
        return context.currentPrice;
    }
  }

  /**
   * Validate trading rule configuration
   */
  async validateRule(rule: Partial<TradingRule>): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate conditions
    if (!rule.conditions || rule.conditions.length === 0) {
      errors.push('Rule must have at least one condition');
    } else {
      rule.conditions.forEach((condition, index) => {
        if (!condition.field) {
          errors.push(`Condition ${index + 1}: Field is required`);
        }
        if (!condition.operator) {
          errors.push(`Condition ${index + 1}: Operator is required`);
        }
        if (condition.value === undefined || condition.value === null) {
          errors.push(`Condition ${index + 1}: Value is required`);
        }
      });
    }

    // Validate actions
    if (!rule.actions || rule.actions.length === 0) {
      errors.push('Rule must have at least one action');
    } else {
      rule.actions.forEach((action, index) => {
        if (!action.type) {
          errors.push(`Action ${index + 1}: Type is required`);
        }
        if (!action.sizing_method) {
          errors.push(`Action ${index + 1}: Sizing method is required`);
        }
        if (action.sizing_method === 'fixed' && !action.size_value) {
          errors.push(
            `Action ${index + 1}: Size value required for fixed sizing`,
          );
        }
        if (action.sizing_method === 'percentage' && !action.size_value) {
          errors.push(
            `Action ${index + 1}: Size value required for percentage sizing`,
          );
        }
      });
    }

    // Validation warnings
    if (rule.priority === undefined) {
      warnings.push('No priority set, defaulting to 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Resolve conflicts between multiple triggered rules
   */
  async conflictResolution(rules: TradingRule[]): Promise<TradingRule[]> {
    if (rules.length <= 1) {
      return rules;
    }

    // Sort by priority (higher priority first)
    const sortedRules = rules.sort((a, b) => b.priority - a.priority);

    // For now, simple conflict resolution: take highest priority rule
    // More sophisticated logic can be added here
    return [sortedRules[0]];
  }

  /**
   * Prioritize rules for evaluation
   */
  async prioritizeRules(rules: TradingRule[]): Promise<TradingRule[]> {
    return rules.sort((a, b) => {
      // First by priority (higher first)
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      // Then by rule type (exit rules first for safety)
      const typeOrder = { exit: 0, risk: 1, entry: 2 };
      return typeOrder[a.rule_type] - typeOrder[b.rule_type];
    });
  }

  /**
   * Get active rules for a portfolio
   */
  async getActiveRules(portfolioId: string): Promise<TradingRule[]> {
    return await this.tradingRuleRepository.find({
      where: {
        portfolio_id: portfolioId,
        is_active: true,
      },
      order: {
        priority: 'DESC',
        created_at: 'ASC',
      },
    });
  }
}
