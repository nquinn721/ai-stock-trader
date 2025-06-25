import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    private readonly websocketGateway: StockWebSocketGateway,
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

      // Notify via WebSocket - TODO: Add method to StockWebSocketGateway
      // this.websocketGateway.notifyTradingSessionStarted(portfolioId, savedSession);
      this.logger.log(`Trading session started notification: ${portfolioId}`);

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

      // Notify via WebSocket - TODO: Add method to StockWebSocketGateway
      // this.websocketGateway.notifyTradingSessionStopped(session.portfolio_id, sessionId, reason);
      this.logger.log(`Trading session stopped notification: ${sessionId}`);
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

  private async buildTradingContext(
    symbol: string,
    portfolio: any,
  ): Promise<TradingContext> {
    const stock = await this.stockService.getStockBySymbol(symbol);

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
      // Add recommendation data if available
      recommendation: {
        type: 'HOLD', // Default - would integrate with recommendation service
        confidence: 0.5,
        reasoning: 'No specific recommendation available',
      },
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

          // Create and execute trade
          const tradeRequest: TradeRequest = {
            portfolioId: rule.portfolio_id,
            symbol: action.symbol,
            type: action.type,
            quantity: action.quantity,
            price: action.price,
            ruleId: rule.id,
          };

          const result =
            await this.tradeExecutionService.executeTrade(tradeRequest);

          if (result.success) {
            this.logger.log(
              `Auto trade executed: ${action.type} ${action.quantity} ${action.symbol} at $${result.executedPrice}`,
            );

            // Notify via WebSocket - TODO: Add method to StockWebSocketGateway
            // this.websocketGateway.notifyTradeExecuted(rule.portfolio_id, {
            //   tradeId: result.tradeId,
            //   symbol: action.symbol,
            //   type: action.type,
            //   quantity: action.quantity,
            //   price: result.executedPrice,
            //   rule: rule.name,
            // });
            this.logger.log(`Trade executed notification: ${action.symbol}`);
          } else {
            this.logger.warn(`Auto trade failed: ${result.error}`);
          }
        }
      }
    } catch (error) {
      this.logger.error('Error handling triggered rules:', error);
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
            ? -(trade.executed_price! * trade.quantity)
            : trade.executed_price! * trade.quantity;
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
              ? -(trade.executed_price! * trade.quantity)
              : trade.executed_price! * trade.quantity;
          return sum + pnl;
        }, 0),
    };
  }
}
