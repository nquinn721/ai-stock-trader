import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaperTradingService } from '../../paper-trading/paper-trading.service';
import {
  RuleAction,
  RuleCondition,
  RuleType,
  TradingRule,
} from '../entities/trading-rule.entity';
import { TradingStrategy } from '../entities/trading-strategy.entity';

export interface StrategyRuleGenerationResult {
  success: boolean;
  rulesCreated: number;
  errors: string[];
  portfolioId: string;
  strategyId: string;
  message?: string;
}

@Injectable()
export class StrategyRuleGeneratorService {
  private readonly logger = new Logger(StrategyRuleGeneratorService.name);

  constructor(
    @InjectRepository(TradingRule)
    private readonly tradingRuleRepository: Repository<TradingRule>,
    @InjectRepository(TradingStrategy)
    private readonly strategyRepository: Repository<TradingStrategy>,
    private readonly paperTradingService: PaperTradingService,
  ) {}

  /**
   * Generate trading rules for all portfolios that have assigned strategies but no rules
   */
  async generateRulesForAllPortfolios(): Promise<
    StrategyRuleGenerationResult[]
  > {
    try {
      this.logger.log('Starting automatic rule generation for all portfolios');

      // Get all active portfolios
      const portfolios = await this.paperTradingService.getPortfolios();
      const results: StrategyRuleGenerationResult[] = [];

      for (const portfolio of portfolios) {
        if (portfolio.assignedStrategy && portfolio.isActive) {
          try {
            // Check if portfolio already has rules
            const existingRules = await this.tradingRuleRepository.find({
              where: { portfolio_id: portfolio.id.toString() },
            });

            if (existingRules.length === 0) {
              this.logger.log(
                `Generating rules for portfolio ${portfolio.id} with strategy ${portfolio.assignedStrategy}`,
              );

              const result = await this.generateRulesForPortfolio(
                portfolio.id.toString(),
              );
              results.push(result);
            } else {
              this.logger.debug(
                `Portfolio ${portfolio.id} already has ${existingRules.length} rules, skipping`,
              );
            }
          } catch (error) {
            this.logger.error(
              `Error generating rules for portfolio ${portfolio.id}:`,
              error,
            );
            results.push({
              success: false,
              rulesCreated: 0,
              errors: [error.message],
              portfolioId: portfolio.id.toString(),
              strategyId: portfolio.assignedStrategy || 'unknown',
            });
          }
        }
      }

      const totalRulesCreated = results.reduce(
        (sum, result) => sum + result.rulesCreated,
        0,
      );
      this.logger.log(
        `Rule generation completed. Total rules created: ${totalRulesCreated}`,
      );

      return results;
    } catch (error) {
      this.logger.error('Error in generateRulesForAllPortfolios:', error);
      throw error;
    }
  }

  /**
   * Generate trading rules for a specific portfolio based on its assigned strategy
   */
  async generateRulesForPortfolio(
    portfolioId: string,
  ): Promise<StrategyRuleGenerationResult> {
    try {
      this.logger.log(`Generating rules for portfolio ${portfolioId}`);

      const portfolio =
        await this.paperTradingService.getPortfolio(portfolioId);
      if (!portfolio) {
        throw new Error(`Portfolio ${portfolioId} not found`);
      }

      if (!portfolio.assignedStrategy) {
        return {
          success: true,
          rulesCreated: 0,
          errors: [],
          portfolioId,
          strategyId: null,
          message: 'Portfolio has no assigned strategy, no rules generated.',
        };
      }
      const strategyId = portfolio.assignedStrategy;

      // Get the trading strategy
      const strategy = await this.strategyRepository.findOne({
        where: { id: strategyId },
      });

      if (!strategy) {
        throw new Error(`Strategy ${strategyId} not found`);
      }

      // Clear existing rules for this portfolio
      await this.tradingRuleRepository.delete({ portfolio_id: portfolioId });

      const rulesCreated: TradingRule[] = [];

      // Generate Entry Rules
      const entryRules = await this.generateEntryRules(portfolioId, strategy);
      rulesCreated.push(...entryRules);

      // Generate Exit Rules
      const exitRules = await this.generateExitRules(portfolioId, strategy);
      rulesCreated.push(...exitRules);

      // Generate Risk Management Rules
      const riskRules = await this.generateRiskRules(portfolioId, strategy);
      rulesCreated.push(...riskRules);

      // Save all rules
      const savedRules = await this.tradingRuleRepository.save(rulesCreated);

      this.logger.log(
        `Generated ${savedRules.length} rules for portfolio ${portfolioId}`,
      );

      return {
        success: true,
        rulesCreated: savedRules.length,
        errors: [],
        portfolioId,
        strategyId,
        message: `Successfully generated ${savedRules.length} rules.`,
      };
    } catch (error) {
      this.logger.error(
        `Error generating rules for portfolio ${portfolioId}:`,
        error,
      );
      return {
        success: false,
        rulesCreated: 0,
        errors: [error.message],
        portfolioId,
        strategyId: 'unknown',
        message: error.message,
      };
    }
  }

  /**
   * Get the status of rule generation for a portfolio
   */
  async getRuleGenerationStatus(portfolioId: string): Promise<{
    hasRules: boolean;
    ruleCount: number;
    lastGenerated?: Date;
  }> {
    const rules = await this.tradingRuleRepository.find({
      where: { portfolio_id: portfolioId },
      order: { created_at: 'DESC' },
    });

    if (rules.length === 0) {
      return {
        hasRules: false,
        ruleCount: 0,
      };
    }

    return {
      hasRules: true,
      ruleCount: rules.length,
      lastGenerated: rules[0].created_at,
    };
  }

  /**
   * Get rule generation status for all portfolios
   */
  async getAllPortfoliosRuleGenerationStatus(): Promise<{
    portfoliosWithStrategies: number;
    portfoliosWithRules: number;
    portfoliosNeedingRules: number;
  }> {
    const portfolios = await this.paperTradingService.getPortfolios();

    let portfoliosWithStrategies = 0;
    let portfoliosWithRules = 0;
    let portfoliosNeedingRules = 0;

    for (const portfolio of portfolios) {
      if (portfolio.assignedStrategy) {
        portfoliosWithStrategies++;

        const rules = await this.tradingRuleRepository.find({
          where: { portfolio_id: portfolio.id.toString() },
        });

        if (rules.length > 0) {
          portfoliosWithRules++;
        } else {
          portfoliosNeedingRules++;
        }
      }
    }

    return {
      portfoliosWithStrategies,
      portfoliosWithRules,
      portfoliosNeedingRules,
    };
  }

  /**
   * Generate entry rules based on strategy components
   */
  private async generateEntryRules(
    portfolioId: string,
    strategy: TradingStrategy,
  ): Promise<TradingRule[]> {
    const entryRules: TradingRule[] = [];

    // Find entry signal components
    const entryComponents = strategy.components.filter(
      (component) =>
        component.type === 'condition' && component.category === 'signal',
    );

    for (const component of entryComponents) {
      // Generate ML-based entry rule
      const mlEntryRule = this.tradingRuleRepository.create({
        portfolio_id: portfolioId,
        name: `${strategy.name} - ML Entry Signal`,
        is_active: true,
        rule_type: RuleType.ENTRY,
        priority: 10,
        description: `Entry rule based on ML recommendations and ${component.name}`,
        conditions: this.generateMLEntryConditions(component),
        actions: this.generateEntryActions(strategy),
      });

      entryRules.push(mlEntryRule);

      // Generate technical indicator entry rule if RSI/MACD are specified
      if (component.parameters.indicators?.includes('RSI')) {
        const rsiEntryRule = this.tradingRuleRepository.create({
          portfolio_id: portfolioId,
          name: `${strategy.name} - RSI Entry`,
          is_active: true,
          rule_type: RuleType.ENTRY,
          priority: 8,
          description: `RSI-based entry rule`,
          conditions: this.generateRSIEntryConditions(component),
          actions: this.generateEntryActions(strategy),
        });

        entryRules.push(rsiEntryRule);
      }
    }

    return entryRules;
  }

  /**
   * Generate exit rules based on strategy components
   */
  private async generateExitRules(
    portfolioId: string,
    strategy: TradingStrategy,
  ): Promise<TradingRule[]> {
    const exitRules: TradingRule[] = [];

    // Generate stop-loss rule
    const stopLossRule = strategy.riskRules.find(
      (rule) => rule.type === 'stop_loss',
    );
    if (stopLossRule) {
      const stopLossTradeRule = this.tradingRuleRepository.create({
        portfolio_id: portfolioId,
        name: `${strategy.name} - Stop Loss`,
        is_active: true,
        rule_type: RuleType.EXIT,
        priority: 20,
        description: `Automatic stop loss at ${stopLossRule.parameters.percentage}%`,
        conditions: [
          {
            field: 'position_loss_percent',
            operator: 'greater_equal',
            value: stopLossRule.parameters.percentage,
          },
        ],
        actions: [
          {
            type: 'sell',
            sizing_method: 'full_position',
            price_type: 'market',
          },
        ],
      });

      exitRules.push(stopLossTradeRule);
    }

    // Generate take-profit rule
    const takeProfitRule = strategy.riskRules.find(
      (rule) => rule.type === 'take_profit',
    );
    if (takeProfitRule) {
      const takeProfitTradeRule = this.tradingRuleRepository.create({
        portfolio_id: portfolioId,
        name: `${strategy.name} - Take Profit`,
        is_active: true,
        rule_type: RuleType.EXIT,
        priority: 18,
        description: `Automatic take profit at ${takeProfitRule.parameters.percentage}%`,
        conditions: [
          {
            field: 'position_gain_percent',
            operator: 'greater_equal',
            value: takeProfitRule.parameters.percentage,
          },
        ],
        actions: [
          {
            type: 'sell',
            sizing_method: 'full_position',
            price_type: 'market',
          },
        ],
      });

      exitRules.push(takeProfitTradeRule);
    }

    // Generate ML-based exit rule
    const mlExitRule = this.tradingRuleRepository.create({
      portfolio_id: portfolioId,
      name: `${strategy.name} - ML Exit Signal`,
      is_active: true,
      rule_type: RuleType.EXIT,
      priority: 15,
      description: `Exit based on ML sell recommendations`,
      conditions: [
        {
          field: 'ml_recommendation',
          operator: 'equals',
          value: 'sell',
        },
        {
          field: 'ml_confidence',
          operator: 'greater_than',
          value: 0.7,
          logical: 'AND',
        },
      ],
      actions: [
        {
          type: 'sell',
          sizing_method: 'full_position',
          price_type: 'market',
        },
      ],
    });

    exitRules.push(mlExitRule);

    return exitRules;
  }

  /**
   * Generate risk management rules
   */
  private async generateRiskRules(
    portfolioId: string,
    strategy: TradingStrategy,
  ): Promise<TradingRule[]> {
    const riskRules: TradingRule[] = [];

    // Generate position size limit rule
    const positionSizeRule = strategy.riskRules.find(
      (rule) => rule.type === 'position_size',
    );
    if (positionSizeRule) {
      const positionLimitRule = this.tradingRuleRepository.create({
        portfolio_id: portfolioId,
        name: `${strategy.name} - Position Size Limit`,
        is_active: true,
        rule_type: RuleType.RISK,
        priority: 25,
        description: `Limit position size to ${positionSizeRule.parameters.maxPercent}% of portfolio`,
        conditions: [
          {
            field: 'proposed_position_percent',
            operator: 'greater_than',
            value: positionSizeRule.parameters.maxPercent,
          },
        ],
        actions: [
          {
            type: 'sell',
            sizing_method: 'percentage',
            size_value: positionSizeRule.parameters.maxPercent,
            price_type: 'market',
          },
        ],
      });

      riskRules.push(positionLimitRule);
    }

    return riskRules;
  }

  /**
   * Generate ML-based entry conditions
   */
  private generateMLEntryConditions(component: any): RuleCondition[] {
    return [
      {
        field: 'ml_recommendation',
        operator: 'equals',
        value: 'buy',
      },
      {
        field: 'ml_confidence',
        operator: 'greater_than',
        value: 0.75,
        logical: 'AND',
      },
      {
        field: 'market_hours',
        operator: 'equals',
        value: true,
        logical: 'AND',
      },
    ];
  }

  /**
   * Generate RSI-based entry conditions
   */
  private generateRSIEntryConditions(component: any): RuleCondition[] {
    const rsiThresholds = component.parameters.thresholds?.rsi || [30, 70];

    return [
      {
        field: 'rsi',
        operator: 'less_than',
        value: rsiThresholds[0], // Oversold condition
      },
      {
        field: 'volume_spike',
        operator: 'greater_than',
        value: component.parameters.thresholds?.volume_spike || 1.2,
        logical: 'AND',
      },
      {
        field: 'market_hours',
        operator: 'equals',
        value: true,
        logical: 'AND',
      },
    ];
  }

  /**
   * Generate entry actions based on strategy
   */
  private generateEntryActions(strategy: TradingStrategy): RuleAction[] {
    // Find position sizing component
    const positionComponent = strategy.components.find(
      (component) =>
        component.type === 'action' && component.name === 'Position Sizing',
    );

    const riskPerTrade = positionComponent?.parameters.riskPerTrade || 0.02;
    const maxPositionSize = positionComponent?.parameters.maxPositionSize || 5;

    return [
      {
        type: 'buy',
        sizing_method: 'percentage',
        size_value: riskPerTrade * 100, // Convert to percentage
        max_position_size: maxPositionSize,
        price_type: 'market',
      },
    ];
  }

  /**
   * Remove all rules for a portfolio
   */
  async removeRulesForPortfolio(portfolioId: string): Promise<void> {
    await this.tradingRuleRepository.delete({ portfolio_id: portfolioId });
    this.logger.log(`Removed all rules for portfolio ${portfolioId}`);
  }
}
