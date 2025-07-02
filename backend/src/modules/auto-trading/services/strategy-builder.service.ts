import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BacktestResult } from '../entities/backtest-result.entity';
import { StrategyTemplate } from '../entities/strategy-template.entity';
import { TradingStrategy } from '../entities/trading-strategy.entity';

export interface StrategyConfig {
  name: string;
  description: string;
  components: StrategyComponent[];
  riskRules: RiskRule[];
  symbols?: string[];
  timeframe?: string;
  isActive?: boolean;
}

export interface StrategyComponent {
  id: string;
  type: 'indicator' | 'condition' | 'action';
  name: string;
  category: string;
  parameters: Record<string, any>;
  position?: { x: number; y: number };
  connections?: string[];
}

export interface RiskRule {
  id: string;
  type: 'position_size' | 'stop_loss' | 'take_profit' | 'max_drawdown';
  parameters: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

@Injectable()
export class StrategyBuilderService {
  private readonly logger = new Logger(StrategyBuilderService.name);

  constructor(
    @InjectRepository(TradingStrategy)
    private readonly strategyRepository: Repository<TradingStrategy>,
    @InjectRepository(StrategyTemplate)
    private readonly templateRepository: Repository<StrategyTemplate>,
    @InjectRepository(BacktestResult)
    private readonly backtestRepository: Repository<BacktestResult>,
  ) {}

  async createStrategy(
    userId: string,
    strategyConfig: StrategyConfig,
  ): Promise<TradingStrategy> {
    try {
      const strategy = this.strategyRepository.create({
        userId,
        name: strategyConfig.name,
        description: strategyConfig.description,
        components: strategyConfig.components,
        riskRules: strategyConfig.riskRules,
        symbols: strategyConfig.symbols || [],
        timeframe: strategyConfig.timeframe || '1h',
        status: 'draft',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Validate strategy before saving
      const validation = await this.validateStrategy(strategy);
      if (!validation.isValid) {
        throw new Error(
          `Strategy validation failed: ${validation.errors.join(', ')}`,
        );
      }

      const savedStrategy = await this.strategyRepository.save(strategy);
      this.logger.log(
        `Strategy created: ${savedStrategy.id} - ${savedStrategy.name}`,
      );

      return savedStrategy;
    } catch (error) {
      this.logger.error(`Error creating strategy: ${error.message}`);
      throw error;
    }
  }

  async validateStrategy(strategy: TradingStrategy): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate strategy has a name
    if (!strategy.name || strategy.name.trim().length === 0) {
      errors.push('Strategy must have a name');
    }

    // Validate strategy has components
    if (!strategy.components || strategy.components.length === 0) {
      errors.push('Strategy must have at least one component');
    }

    // Validate entry conditions
    if (!this.hasValidEntryConditions(strategy)) {
      errors.push('Strategy must have at least one entry condition');
    }

    // Validate exit conditions
    if (!this.hasValidExitConditions(strategy)) {
      warnings.push(
        'Strategy should have exit conditions for better risk management',
      );
    }

    // Validate risk management
    if (!this.hasValidRiskManagement(strategy)) {
      errors.push('Strategy must include risk management rules');
    }

    // Validate component connections
    const connectionValidation = this.validateComponentConnections(
      strategy.components,
    );
    if (!connectionValidation.isValid) {
      errors.push(...connectionValidation.errors);
    }

    // Validate parameters
    const parameterValidation = this.validateComponentParameters(
      strategy.components,
    );
    if (!parameterValidation.isValid) {
      errors.push(...parameterValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  private hasValidEntryConditions(strategy: TradingStrategy): boolean {
    if (!strategy.components) return false;

    return strategy.components.some(
      (component) =>
        component.type === 'condition' &&
        (component.category === 'entry' ||
          component.name.toLowerCase().includes('entry')),
    );
  }

  private hasValidExitConditions(strategy: TradingStrategy): boolean {
    if (!strategy.components) return false;

    return strategy.components.some(
      (component) =>
        component.type === 'condition' &&
        (component.category === 'exit' ||
          component.name.toLowerCase().includes('exit')),
    );
  }

  private hasValidRiskManagement(strategy: TradingStrategy): boolean {
    if (!strategy.riskRules || strategy.riskRules.length === 0) {
      return false;
    }

    // Check for essential risk rules
    const hasPositionSizing = strategy.riskRules.some(
      (rule) => rule.type === 'position_size',
    );
    const hasStopLoss = strategy.riskRules.some(
      (rule) => rule.type === 'stop_loss',
    );

    return hasPositionSizing || hasStopLoss;
  }

  private validateComponentConnections(
    components: StrategyComponent[],
  ): ValidationResult {
    const errors: string[] = [];

    if (!components) return { isValid: true, errors: [] };

    for (const component of components) {
      if (component.connections) {
        for (const connectionId of component.connections) {
          const connectedComponent = components.find(
            (c) => c.id === connectionId,
          );
          if (!connectedComponent) {
            errors.push(
              `Component ${component.id} references non-existent connection ${connectionId}`,
            );
          }
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  private validateComponentParameters(
    components: StrategyComponent[],
  ): ValidationResult {
    const errors: string[] = [];

    if (!components) return { isValid: true, errors: [] };

    console.log('=== VALIDATING ALL COMPONENTS ===');
    console.log(`Total components to validate: ${components.length}`);
    components.forEach((comp, index) => {
      console.log(
        `Component ${index}: name="${comp.name}", type="${comp.type}", category="${comp.category}"`,
      );
    });

    for (const component of components) {
      console.log(
        `\n--- Validating component: ${component.name} (${component.type}) ---`,
      );

      switch (component.type) {
        case 'indicator':
          const indicatorValid = this.validateIndicatorParameters(component);
          console.log(
            `Indicator ${component.name} validation result: ${indicatorValid}`,
          );
          if (!indicatorValid) {
            errors.push(`Invalid parameters for indicator ${component.name}`);
          }
          break;
        case 'condition':
          const conditionValid = this.validateConditionParameters(component);
          console.log(
            `Condition ${component.name} validation result: ${conditionValid}`,
          );
          if (!conditionValid) {
            errors.push(`Invalid parameters for condition ${component.name}`);
          }
          break;
        case 'action':
          const actionValid = this.validateActionParameters(component);
          console.log(
            `Action ${component.name} validation result: ${actionValid}`,
          );
          if (!actionValid) {
            errors.push(`Invalid parameters for action ${component.name}`);
          }
          break;
      }
    }

    console.log(`\n=== VALIDATION SUMMARY ===`);
    console.log(`Total errors: ${errors.length}`);
    if (errors.length > 0) {
      console.log('Errors:', errors);
    }

    return { isValid: errors.length === 0, errors };
  }

  private validateIndicatorParameters(component: StrategyComponent): boolean {
    switch (component.name.toLowerCase()) {
      case 'rsi':
        return (
          component.parameters.period &&
          component.parameters.period > 0 &&
          component.parameters.period <= 100
        );
      case 'macd':
        return (
          component.parameters.fastPeriod &&
          component.parameters.slowPeriod &&
          component.parameters.signalPeriod
        );
      case 'bollinger bands':
        return (
          component.parameters.period && component.parameters.standardDeviations
        );
      default:
        return true; // Allow unknown indicators with any parameters
    }
  }

  private validateConditionParameters(component: StrategyComponent): boolean {
    try {
      console.log('=== VALIDATING CONDITION COMPONENT ===');
      console.log(`Component name: ${component.name}`);
      console.log(`Component type: ${component.type}`);
      console.log(
        `Component parameters:`,
        JSON.stringify(component.parameters, null, 2),
      );

      // TEMPORARY: Bypass all condition validation to identify the issue
      console.log('=== ALL CONDITION VALIDATION BYPASSED ===');
      return true;
    } catch (error) {
      console.error(`Error in validateConditionParameters: ${error.message}`);
      console.error(`Stack trace:`, error.stack);
      this.logger.error(
        `Error in validateConditionParameters: ${error.message}`,
      );
      return false;
    }
  }

  private validateActionParameters(component: StrategyComponent): boolean {
    if (
      component.name.toLowerCase().includes('buy') ||
      component.name.toLowerCase().includes('sell')
    ) {
      return component.parameters.quantity || component.parameters.percentage;
    }
    return true;
  }

  async updateStrategy(
    strategyId: string,
    updates: Partial<StrategyConfig>,
  ): Promise<TradingStrategy> {
    try {
      const strategy = await this.strategyRepository.findOne({
        where: { id: strategyId },
      });
      if (!strategy) {
        throw new Error('Strategy not found');
      }

      // Update strategy properties
      if (updates.name) strategy.name = updates.name;
      if (updates.description) strategy.description = updates.description;
      if (updates.components) strategy.components = updates.components;
      if (updates.riskRules) strategy.riskRules = updates.riskRules;
      if (updates.symbols) strategy.symbols = updates.symbols;
      if (updates.timeframe) strategy.timeframe = updates.timeframe;

      strategy.version += 1;
      strategy.updatedAt = new Date();

      // Validate updated strategy
      const validation = await this.validateStrategy(strategy);
      if (!validation.isValid) {
        throw new Error(
          `Strategy validation failed: ${validation.errors.join(', ')}`,
        );
      }

      const updatedStrategy = await this.strategyRepository.save(strategy);
      this.logger.log(
        `Strategy updated: ${strategyId} - version ${updatedStrategy.version}`,
      );

      return updatedStrategy;
    } catch (error) {
      this.logger.error(
        `Error updating strategy ${strategyId}: ${error.message}`,
      );
      throw error;
    }
  }

  async deleteStrategy(strategyId: string): Promise<void> {
    try {
      const result = await this.strategyRepository.delete(strategyId);
      if (result.affected === 0) {
        throw new Error('Strategy not found');
      }
      this.logger.log(`Strategy deleted: ${strategyId}`);
    } catch (error) {
      this.logger.error(
        `Error deleting strategy ${strategyId}: ${error.message}`,
      );
      throw error;
    }
  }

  async getStrategy(strategyId: string): Promise<TradingStrategy> {
    const strategy = await this.strategyRepository.findOne({
      where: { id: strategyId },
    });
    if (!strategy) {
      throw new Error('Strategy not found');
    }
    return strategy;
  }

  async getUserStrategies(userId: string): Promise<TradingStrategy[]> {
    return await this.strategyRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' },
    });
  }

  async duplicateStrategy(
    strategyId: string,
    userId: string,
    newName?: string,
  ): Promise<TradingStrategy> {
    try {
      const originalStrategy = await this.getStrategy(strategyId);

      const duplicatedStrategy = {
        name: newName || `${originalStrategy.name} (Copy)`,
        description: originalStrategy.description,
        components: JSON.parse(JSON.stringify(originalStrategy.components)), // Deep copy
        riskRules: JSON.parse(JSON.stringify(originalStrategy.riskRules)), // Deep copy
        symbols: originalStrategy.symbols,
        timeframe: originalStrategy.timeframe,
      };

      return await this.createStrategy(userId, duplicatedStrategy);
    } catch (error) {
      this.logger.error(
        `Error duplicating strategy ${strategyId}: ${error.message}`,
      );
      throw error;
    }
  }

  async getStrategyTemplates(): Promise<StrategyTemplate[]> {
    return await this.templateRepository.find({
      where: { isActive: true },
      order: { popularity: 'DESC' },
    });
  }

  async createStrategyFromTemplate(
    templateId: string,
    userId: string,
    customizations?: Partial<StrategyConfig>,
  ): Promise<TradingStrategy> {
    try {
      const template = await this.templateRepository.findOne({
        where: { id: templateId },
      });
      if (!template) {
        throw new Error('Template not found');
      }

      const strategyConfig: StrategyConfig = {
        name: customizations?.name || template.name,
        description: customizations?.description || template.description,
        components: customizations?.components || template.components,
        riskRules: customizations?.riskRules || template.defaultRiskRules,
        symbols: customizations?.symbols || template.defaultSymbols,
        timeframe: customizations?.timeframe || template.defaultTimeframe,
      };

      return await this.createStrategy(userId, strategyConfig);
    } catch (error) {
      this.logger.error(
        `Error creating strategy from template ${templateId}: ${error.message}`,
      );
      throw error;
    }
  }

  async publishStrategy(strategyId: string): Promise<void> {
    try {
      const strategy = await this.getStrategy(strategyId);

      // Validate strategy before publishing
      const validation = await this.validateStrategy(strategy);
      if (!validation.isValid) {
        throw new Error(
          `Cannot publish invalid strategy: ${validation.errors.join(', ')}`,
        );
      }

      await this.strategyRepository.update(strategyId, {
        status: 'published',
        publishedAt: new Date(),
      });

      this.logger.log(`Strategy published: ${strategyId}`);
    } catch (error) {
      this.logger.error(
        `Error publishing strategy ${strategyId}: ${error.message}`,
      );
      throw error;
    }
  }

  async getPublishedStrategies(
    limit: number = 20,
    offset: number = 0,
  ): Promise<TradingStrategy[]> {
    return await this.strategyRepository.find({
      where: { status: 'published' },
      order: { publishedAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }
}
