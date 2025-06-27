import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketHoursService } from '../../utils/market-hours.service';
import { PaperTradingService } from '../paper-trading/paper-trading.service';
import { StockService } from '../stock/stock.service';
import { StockWebSocketGateway } from '../websocket/websocket.gateway';
import {
  CreateTradingRuleDto,
  UpdateTradingRuleDto,
} from './dto/create-trading-rule.dto';
import { TradingSessionDto } from './dto/trading-session.dto';
import { AutoTrade } from './entities/auto-trade.entity';
import { TradingRule } from './entities/trading-rule.entity';
import { TradingSession } from './entities/trading-session.entity';
import { PositionSizingService } from './services/position-sizing.service';
import { RiskManagementService } from './services/risk-management.service';
import {
  RuleEngineService,
  TradingContext,
} from './services/rule-engine.service';
import {
  TradeExecutionService,
  TradeRequest,
} from './services/trade-execution.service';
// ML Services Integration
import { DynamicRiskManagementService } from '../ml/services/dynamic-risk-management.service';
import { IntelligentRecommendationService } from '../ml/services/intelligent-recommendation.service';
import { PatternRecognitionService } from '../ml/services/pattern-recognition.service';
import { SentimentAnalysisService } from '../ml/services/sentiment-analysis.service';
import { SignalGenerationService } from '../ml/services/signal-generation.service';
import { BacktestingService } from './backtesting.service';
import {
  AutonomousTradingService,
  DeploymentConfig,
  InstancePerformance,
  StrategyInstance,
} from './services/autonomous-trading.service';
import { StrategyBuilderService } from './strategy-builder.service';

@Injectable()
export class AutoTradingService {
  private readonly logger = new Logger(AutoTradingService.name);
  private readonly activeSessions = new Map<string, TradingSession>();

  constructor(
    @InjectRepository(TradingRule)
    private readonly tradingRuleRepository: Repository<TradingRule>,
    @InjectRepository(AutoTrade)
    private readonly autoTradeRepository: Repository<AutoTrade>,
    @InjectRepository(TradingSession)
    private readonly tradingSessionRepository: Repository<TradingSession>,
    private readonly ruleEngineService: RuleEngineService,
    private readonly tradeExecutionService: TradeExecutionService,
    private readonly riskManagementService: RiskManagementService,
    private readonly positionSizingService: PositionSizingService,
    private readonly stockService: StockService,
    private readonly paperTradingService: PaperTradingService,
    private readonly stockWebSocketGateway: StockWebSocketGateway,
    private readonly marketHoursService: MarketHoursService,
    // ML Services
    private readonly intelligentRecommendationService: IntelligentRecommendationService,
    private readonly signalGenerationService: SignalGenerationService,
    private readonly dynamicRiskManagementService: DynamicRiskManagementService,
    private readonly sentimentAnalysisService: SentimentAnalysisService,
    private readonly patternRecognitionService: PatternRecognitionService,
    // Autonomous Trading Services
    private readonly autonomousTradingService: AutonomousTradingService,
    private readonly strategyBuilderService: StrategyBuilderService,
    private readonly backtestingService: BacktestingService,
  ) {}

  // Trading Rules Management
  async createTradingRule(
    createRuleDto: CreateTradingRuleDto,
  ): Promise<TradingRule> {
    try {
      // Validate rule configuration
      const validation =
        await this.ruleEngineService.validateRule(createRuleDto);
      if (!validation.isValid) {
        throw new Error(
          `Rule validation failed: ${validation.errors.join(', ')}`,
        );
      }

      const rule = this.tradingRuleRepository.create(createRuleDto);
      const savedRule = await this.tradingRuleRepository.save(rule);

      this.logger.log(
        `Trading rule created: ${savedRule.name} (${savedRule.id})`,
      );
      return savedRule;
    } catch (error) {
      this.logger.error('Error creating trading rule:', error);
      throw error;
    }
  }

  async getTradingRules(portfolioId: string): Promise<TradingRule[]> {
    return await this.tradingRuleRepository.find({
      where: { portfolio_id: portfolioId },
      order: { priority: 'DESC', created_at: 'ASC' },
    });
  }

  async updateTradingRule(
    id: string,
    updateRuleDto: UpdateTradingRuleDto,
  ): Promise<TradingRule> {
    try {
      const rule = await this.tradingRuleRepository.findOne({ where: { id } });
      if (!rule) {
        throw new Error('Trading rule not found');
      }

      // Validate updated rule
      const updatedRule = { ...rule, ...updateRuleDto };
      const validation = await this.ruleEngineService.validateRule(updatedRule);
      if (!validation.isValid) {
        throw new Error(
          `Rule validation failed: ${validation.errors.join(', ')}`,
        );
      }

      await this.tradingRuleRepository.update(id, updateRuleDto);
      const updated = await this.tradingRuleRepository.findOne({
        where: { id },
      });

      this.logger.log(`Trading rule updated: ${updated?.name} (${id})`);
      return updated!;
    } catch (error) {
      this.logger.error(`Error updating trading rule ${id}:`, error);
      throw error;
    }
  }

  async deleteTradingRule(id: string): Promise<void> {
    try {
      const result = await this.tradingRuleRepository.delete(id);
      if (result.affected === 0) {
        throw new Error('Trading rule not found');
      }
      this.logger.log(`Trading rule deleted: ${id}`);
    } catch (error) {
      this.logger.error(`Error deleting trading rule ${id}:`, error);
      throw error;
    }
  }

  async activateRule(id: string): Promise<void> {
    await this.tradingRuleRepository.update(id, { is_active: true });
    this.logger.log(`Trading rule activated: ${id}`);
  }

  async deactivateRule(id: string): Promise<void> {
    await this.tradingRuleRepository.update(id, { is_active: false });
    this.logger.log(`Trading rule deactivated: ${id}`);
  }

  // Trading Session Management
  async startTradingSession(
    portfolioId: string,
    sessionDto: TradingSessionDto,
  ): Promise<TradingSession> {
    try {
      // Check if there's already an active session for this portfolio
      const existingSession = await this.tradingSessionRepository.findOne({
        where: { portfolio_id: portfolioId, is_active: true },
      });

      if (existingSession) {
        throw new Error('Portfolio already has an active trading session');
      }

      // Check for emergency stops
      const emergencyStop =
        await this.riskManagementService.checkEmergencyStop(portfolioId);
      if (emergencyStop) {
        throw new Error('Emergency stop active - cannot start trading session');
      }

      const session = this.tradingSessionRepository.create({
        portfolio_id: portfolioId,
        session_name: sessionDto.session_name,
        start_time: new Date(),
        is_active: true,
        config: sessionDto.config,
      });

      const savedSession = await this.tradingSessionRepository.save(session);
      this.activeSessions.set(savedSession.id, savedSession);

      this.logger.log(
        `Trading session started for portfolio ${portfolioId}: ${savedSession.id}`,
      );

      // Notify via WebSocket - TODO: Fix WebSocket method compilation issues
      // await this.websocketGateway.notifyTradingSessionStarted(portfolioId, savedSession);
      this.logger.log(
        `Trading session started notification (WebSocket temporarily disabled): ${portfolioId}`,
      );

      return savedSession;
    } catch (error) {
      this.logger.error(
        `Error starting trading session for portfolio ${portfolioId}:`,
        error,
      );
      throw error;
    }
  }

  async stopTradingSession(sessionId: string, reason?: string): Promise<void> {
    try {
      const session = await this.tradingSessionRepository.findOne({
        where: { id: sessionId },
      });

      if (!session) {
        throw new Error('Trading session not found');
      }

      if (!session.is_active) {
        throw new Error('Trading session is not active');
      }

      await this.tradingSessionRepository.update(sessionId, {
        is_active: false,
        end_time: new Date(),
        stop_reason: reason,
      });

      this.activeSessions.delete(sessionId);

      this.logger.log(
        `Trading session stopped: ${sessionId} - ${reason || 'Manual stop'}`,
      );

      // Notify via WebSocket - TODO: Fix WebSocket method compilation issues
      // await this.websocketGateway.notifyTradingSessionStopped(session.portfolio_id, sessionId, reason);
      this.logger.log(
        `Trading session stopped notification (WebSocket temporarily disabled): ${sessionId}`,
      );
    } catch (error) {
      this.logger.error(`Error stopping trading session ${sessionId}:`, error);
      throw error;
    }
  }

  async getTradingSessions(portfolioId: string): Promise<TradingSession[]> {
    return await this.tradingSessionRepository.find({
      where: { portfolio_id: portfolioId },
      order: { created_at: 'DESC' },
    });
  }

  async getSessionStatus(sessionId: string): Promise<any> {
    const session = await this.tradingSessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Trading session not found');
    }

    const trades = await this.autoTradeRepository.find({
      where: { portfolio_id: session.portfolio_id },
      order: { created_at: 'DESC' },
    });

    return {
      session,
      totalTrades: trades.length,
      successfulTrades: trades.filter((t) => t.status === 'executed').length,
      failedTrades: trades.filter((t) => t.status === 'failed').length,
      pendingTrades: trades.filter((t) => t.status === 'pending').length,
    };
  }

  // Rule Evaluation and Trade Execution
  @Cron(CronExpression.EVERY_MINUTE)
  async evaluateAllRules(): Promise<void> {
    try {
      const activeSessions = await this.tradingSessionRepository.find({
        where: { is_active: true },
      });

      if (activeSessions.length === 0) {
        return;
      }

      this.logger.debug(
        `Evaluating rules for ${activeSessions.length} active sessions`,
      );

      for (const session of activeSessions) {
        await this.evaluatePortfolioRules(session.portfolio_id);
      }
    } catch (error) {
      this.logger.error('Error in rule evaluation cron job:', error);
    }
  }

  async evaluatePortfolioRules(portfolioId: string): Promise<void> {
    try {
      // Check emergency stop
      const emergencyStop =
        await this.riskManagementService.checkEmergencyStop(portfolioId);
      if (emergencyStop) {
        await this.stopAllPortfolioSessions(
          portfolioId,
          'Emergency stop triggered',
        );
        return;
      }

      // Get active rules for portfolio
      const rules = await this.ruleEngineService.getActiveRules(portfolioId);
      if (rules.length === 0) {
        return;
      }

      // Get portfolio information
      const portfolio =
        await this.paperTradingService.getPortfolio(portfolioId);
      if (!portfolio) {
        return;
      }

      // Get current stock data for evaluation
      const stocks = await this.stockService.getAllStocks();

      // Check for ML-generated signals for additional trading opportunities
      await this.checkMLSignals(portfolioId, portfolio, stocks);

      for (const stock of stocks) {
        const context = await this.buildTradingContext(stock.symbol, portfolio);
        const triggeredRules: TradingRule[] = [];

        for (const rule of rules) {
          const isTriggered = await this.ruleEngineService.evaluateRule(
            rule,
            context,
          );
          if (isTriggered) {
            triggeredRules.push(rule);
          }
        }

        if (triggeredRules.length > 0) {
          await this.handleTriggeredRules(triggeredRules, context);
        }
      }
    } catch (error) {
      this.logger.error(
        `Error evaluating rules for portfolio ${portfolioId}:`,
        error,
      );
    }
  }

  /**
   * Check for ML-generated trading signals
   */
  private async checkMLSignals(
    portfolioId: string,
    portfolio: any,
    stocks: any[],
  ): Promise<void> {
    try {
      // Get ML-generated signals for high-confidence trades
      // Signal generation will be implemented when the service method is available
      // const signals = await this.signalGenerationService.generateSignals({
      //   symbols: stocks.map(s => s.symbol),
      //   portfolioId,
      //   timeframe: '1h',
      //   minConfidence: 0.8, // Only high-confidence signals
      // });
      // for (const signal of signals) {
      //   if (signal.confidence > 0.85 && signal.signal !== 'HOLD') {
      //     this.logger.log(
      //       `High-confidence ML signal detected: ${signal.signal} ${signal.symbol} (confidence: ${signal.confidence})`,
      //     );
      //
      //     // Notify about ML signal
      //     await this.websocketGateway.notifyTradingRuleTriggered(portfolioId, {
      //       type: 'ML_SIGNAL',
      //       symbol: signal.symbol,
      //       signal: signal.signal,
      //       confidence: signal.confidence,
      //       reasoning: signal.reasoning,
      //     });
      //   }
      // }
    } catch (error) {
      this.logger.warn('Failed to check ML signals:', error);
    }
  }

  private async buildTradingContext(
    symbol: string,
    portfolio: any,
  ): Promise<TradingContext> {
    const stock = await this.stockService.getStockBySymbol(symbol);

    // Get ML-powered recommendation
    let recommendation = {
      type: 'HOLD',
      confidence: 0.5,
      reasoning: 'No specific recommendation available',
    };

    try {
      // Get intelligent recommendation from ML service
      const mlRecommendation =
        await this.intelligentRecommendationService.generateRecommendation({
          symbol,
          currentPrice: stock?.currentPrice || 0,
          timeHorizon: '1D',
        });
      if (mlRecommendation) {
        recommendation = {
          type: mlRecommendation.action,
          confidence: mlRecommendation.confidence,
          reasoning: Array.isArray(mlRecommendation.reasoning)
            ? mlRecommendation.reasoning.join(', ')
            : mlRecommendation.reasoning || 'ML-generated recommendation',
        };
      }
    } catch (error) {
      this.logger.warn(`Failed to get ML recommendation for ${symbol}:`, error);
    }

    // Get technical indicators and patterns
    const technicalIndicators = {
      rsi: undefined,
      macd: undefined,
      volume: stock?.volume || 0,
      volatility: undefined,
    };

    try {
      // Get pattern recognition signals
      // Pattern recognition will be implemented when the service method is available
      // const patterns = await this.patternRecognitionService.detectPatterns(symbol);
      // if (patterns && patterns.length > 0) {
      //   technicalIndicators = {
      //     ...technicalIndicators,
      //     patterns: patterns.map(p => p.pattern),
      //     patternConfidence: patterns[0]?.confidence || 0,
      //   };
      // }
    } catch (error) {
      this.logger.warn(
        `Failed to get pattern recognition for ${symbol}:`,
        error,
      );
    }

    // Get sentiment analysis
    const sentimentScore = 0;
    try {
      // Sentiment analysis will be implemented when the service method is available
      // const sentiment = await this.sentimentAnalysisService.analyzeSymbol(symbol);
      // if (sentiment) {
      //   sentimentScore = sentiment.score;
      //   technicalIndicators = {
      //     ...technicalIndicators,
      //     sentiment: sentimentScore,
      //   };
      // }
    } catch (error) {
      this.logger.warn(
        `Failed to get sentiment analysis for ${symbol}:`,
        error,
      );
    }

    return {
      symbol,
      currentPrice: stock?.currentPrice || 0,
      portfolioValue: portfolio.totalValue || 0,
      cashBalance: portfolio.currentCash || 0,
      positions: portfolio.positions || [],
      marketData: {
        volume: stock?.volume || 0,
        change: 0, // Would calculate from currentPrice - previousClose
        changePercent: stock?.changePercent || 0,
      },
      recommendation,
      technicalIndicators,
    };
  }

  private async handleTriggeredRules(
    rules: TradingRule[],
    context: TradingContext,
  ): Promise<void> {
    try {
      // Resolve conflicts between multiple rules
      const resolvedRules =
        await this.ruleEngineService.conflictResolution(rules);

      for (const rule of resolvedRules) {
        // Apply ML-powered risk management before execution
        const riskAssessment = await this.assessMLRisk(rule, context);
        if (!riskAssessment.approved) {
          this.logger.warn(
            `Trade blocked by ML risk management: ${riskAssessment.reason}`,
          );
          continue;
        }

        // Execute rule actions
        const actions = await this.ruleEngineService.executeActions(
          rule.actions,
          context,
        );

        for (const action of actions) {
          if (action.error) {
            this.logger.warn(`Action execution error: ${action.error}`);
            continue;
          }

          // Apply ML-powered position sizing
          const optimizedQuantity = await this.optimizePositionSize(
            action.quantity,
            rule.portfolio_id,
            context,
          );

          // Create and execute trade
          const tradeRequest: TradeRequest = {
            portfolioId: rule.portfolio_id,
            symbol: action.symbol,
            type: action.type,
            quantity: optimizedQuantity,
            price: action.price,
            ruleId: rule.id,
          };

          const result =
            await this.tradeExecutionService.executeTrade(tradeRequest);

          if (result.success) {
            this.logger.log(
              `Auto trade executed: ${action.type} ${optimizedQuantity} ${action.symbol} at $${result.executedPrice}`,
            );

            // Notify via WebSocket - TODO: Fix WebSocket method compilation issues
            // await this.websocketGateway.notifyTradeExecuted(rule.portfolio_id, {
            //   tradeId: result.tradeId,
            //   symbol: action.symbol,
            //   type: action.type,
            //   quantity: optimizedQuantity,
            //   price: result.executedPrice,
            //   rule: rule.name,
            // });
            this.logger.log(
              `Trade executed notification (WebSocket temporarily disabled): ${action.symbol}`,
            );
          } else {
            this.logger.warn(`Auto trade failed: ${result.error}`);
          }
        }
      }
    } catch (error) {
      this.logger.error('Error handling triggered rules:', error);
    }
  }

  /**
   * Assess ML-powered risk for a trade
   */
  private async assessMLRisk(
    rule: TradingRule,
    context: TradingContext,
  ): Promise<{ approved: boolean; reason?: string }> {
    try {
      // Use dynamic risk management service
      // Risk assessment will be implemented when the service method is available
      // const riskAssessment = await this.dynamicRiskManagementService.assessTradeRisk({
      //   symbol: context.symbol,
      //   portfolioId: rule.portfolio_id,
      //   tradeType: rule.actions[0]?.type || 'buy',
      //   quantity: rule.actions[0]?.quantity || 0,
      //   currentPrice: context.currentPrice,
      //   portfolioValue: context.portfolioValue,
      //   positions: context.positions,
      // });

      // return {
      //   approved: riskAssessment.approved,
      //   reason: riskAssessment.reason,
      // };

      // For now, default to approved until ML service is properly integrated
      return { approved: true };
    } catch (error) {
      this.logger.warn(
        'ML risk assessment failed, defaulting to approved:',
        error,
      );
      return { approved: true };
    }
  }

  /**
   * Optimize position size using ML
   */
  private async optimizePositionSize(
    originalQuantity: number,
    portfolioId: string,
    context: TradingContext,
  ): Promise<number> {
    try {
      // Use dynamic risk management for position sizing
      // Position optimization will be implemented when the service method is available
      // const optimization = await this.dynamicRiskManagementService.optimizePositionSize({
      //   symbol: context.symbol,
      //   portfolioId,
      //   originalQuantity,
      //   currentPrice: context.currentPrice,
      //   portfolioValue: context.portfolioValue,
      //   volatility: context.technicalIndicators?.volatility || 0.2,
      //   confidence: context.recommendation?.confidence || 0.5,
      // });

      // return optimization.optimizedQuantity || originalQuantity;

      // For now, return original quantity until ML service is properly integrated
      return originalQuantity;
    } catch (error) {
      this.logger.warn(
        'ML position sizing failed, using original quantity:',
        error,
      );
      return originalQuantity;
    }
  }

  private async stopAllPortfolioSessions(
    portfolioId: string,
    reason: string,
  ): Promise<void> {
    const sessions = await this.tradingSessionRepository.find({
      where: { portfolio_id: portfolioId, is_active: true },
    });

    for (const session of sessions) {
      await this.stopTradingSession(session.id, reason);
    }

    // Notify about emergency stop via WebSocket - TODO: Fix WebSocket method compilation issues
    // await this.websocketGateway.notifyEmergencyStopTriggered(portfolioId, reason);
    this.logger.warn(
      `Emergency stop notification (WebSocket temporarily disabled): ${portfolioId} - ${reason}`,
    );
  }

  // Trade Monitoring
  async getAutoTrades(portfolioId: string, filters?: any): Promise<any> {
    return await this.tradeExecutionService.getPortfolioTrades(
      portfolioId,
      filters,
    );
  }

  async getTradeDetails(tradeId: string): Promise<AutoTrade | null> {
    return await this.tradeExecutionService.getTradeDetails(tradeId);
  }

  async cancelTrade(tradeId: string): Promise<boolean> {
    return await this.tradeExecutionService.cancelTrade(tradeId);
  }

  // Session Performance
  async getActiveSessions(): Promise<TradingSession[]> {
    return await this.tradingSessionRepository.find({
      where: { is_active: true },
      relations: ['portfolio'],
    });
  }

  async getSessionPerformance(sessionId: string): Promise<any> {
    const session = await this.tradingSessionRepository.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error('Trading session not found');
    }

    const trades = await this.autoTradeRepository.find({
      where: { portfolio_id: session.portfolio_id },
    });

    const sessionTrades = trades.filter(
      (trade) =>
        trade.created_at >= session.start_time &&
        (!session.end_time || trade.created_at <= session.end_time),
    );

    const totalPnL = sessionTrades
      .filter((trade) => trade.executed_price && trade.status === 'executed')
      .reduce((sum, trade) => {
        const pnl =
          trade.trade_type === 'buy'
            ? -(trade.executed_price * trade.quantity)
            : trade.executed_price * trade.quantity;
        return sum + pnl;
      }, 0);

    return {
      session,
      trades: sessionTrades,
      totalTrades: sessionTrades.length,
      successfulTrades: sessionTrades.filter((t) => t.status === 'executed')
        .length,
      failedTrades: sessionTrades.filter((t) => t.status === 'failed').length,
      totalPnL,
      winRate:
        sessionTrades.length > 0
          ? (sessionTrades.filter((t) => t.status === 'executed').length /
              sessionTrades.length) *
            100
          : 0,
    };
  }

  async getTradingHistory(portfolioId: string): Promise<any> {
    const trades = await this.autoTradeRepository.find({
      where: { portfolio_id: portfolioId },
      order: { created_at: 'DESC' },
      relations: ['rule'],
    });

    return {
      trades,
      totalTrades: trades.length,
      successfulTrades: trades.filter((t) => t.status === 'executed').length,
      failedTrades: trades.filter((t) => t.status === 'failed').length,
      totalPnL: trades
        .filter((trade) => trade.executed_price && trade.status === 'executed')
        .reduce((sum, trade) => {
          const pnl =
            trade.trade_type === 'buy'
              ? -(trade.executed_price * trade.quantity)
              : trade.executed_price * trade.quantity;
          return sum + pnl;
        }, 0),
    };
  }

  // ============================================================================
  // AUTONOMOUS TRADING METHODS
  // ============================================================================

  /**
   * Deploy an autonomous trading strategy
   */
  async deployStrategy(
    userId: string,
    strategyId: string,
    config: DeploymentConfig,
  ): Promise<StrategyInstance> {
    return this.autonomousTradingService.deployStrategy(
      userId,
      strategyId,
      config,
    );
  }

  /**
   * Stop an autonomous trading strategy
   */
  async stopStrategy(userId: string, strategyId: string): Promise<void> {
    return this.autonomousTradingService.stopStrategy(userId, strategyId);
  }

  /**
   * Pause an autonomous trading strategy
   */
  async pauseStrategy(userId: string, strategyId: string): Promise<void> {
    return this.autonomousTradingService.pauseStrategy(userId, strategyId);
  }

  /**
   * Resume a paused autonomous trading strategy
   */
  async resumeStrategy(userId: string, strategyId: string): Promise<void> {
    return this.autonomousTradingService.resumeStrategy(userId, strategyId);
  }

  /**
   * Get all active strategy instances
   */
  async getActiveStrategies(userId: string): Promise<StrategyInstance[]> {
    return this.autonomousTradingService.getRunningStrategies(userId);
  }

  /**
   * Get strategy performance metrics
   */
  async getStrategyPerformance(
    userId: string,
    strategyId: string,
  ): Promise<InstancePerformance> {
    return this.autonomousTradingService.getStrategyPerformance(
      userId,
      strategyId,
    );
  }

  /**
   * Run strategy backtest
   */
  async runBacktest(
    strategyId: string,
    startDate: Date,
    endDate: Date,
    initialCapital: number,
  ): Promise<any> {
    // Create a mock strategy and params for backtesting
    const strategy = { id: strategyId, name: `Strategy ${strategyId}` };
    const params = {
      startDate,
      endDate,
      initialCapital,
    };
    return this.backtestingService.runBacktest(strategy as any, params as any);
  }

  /**
   * Get available strategy templates
   */
  async getStrategyTemplates(): Promise<any[]> {
    return this.strategyBuilderService.getStrategyTemplates();
  }

  /**
   * Create a new strategy from template
   */
  async createStrategyFromTemplate(
    userId: string,
    templateId: string,
    name: string,
    parameters: any,
  ): Promise<any> {
    return this.strategyBuilderService.createStrategyFromTemplate(
      templateId,
      userId,
      parameters,
    );
  }
}

// Export autonomous trading interfaces for use in controller
export {
  DeploymentConfig,
  InstancePerformance,
  NotificationConfig,
  RiskLimits,
  StrategyInstance,
} from './services/autonomous-trading.service';
