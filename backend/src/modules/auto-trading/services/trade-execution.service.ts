import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaperTradingService } from '../../paper-trading/paper-trading.service';
import { StockService } from '../../stock/stock.service';
import {
  AutoTrade,
  AutoTradeStatus,
  TradeType,
} from '../entities/auto-trade.entity';
import { RiskManagementService } from './risk-management.service';

export interface TradeRequest {
  portfolioId: string;
  symbol: string;
  type: TradeType;
  quantity: number;
  price?: number;
  ruleId?: string;
  recommendationId?: string;
}

export interface TradeResult {
  success: boolean;
  tradeId?: string;
  executedPrice?: number;
  executedQuantity?: number;
  error?: string;
  details?: any;
}

@Injectable()
export class TradeExecutionService {
  private readonly logger = new Logger(TradeExecutionService.name);

  constructor(
    @InjectRepository(AutoTrade)
    private readonly autoTradeRepository: Repository<AutoTrade>,
    private readonly paperTradingService: PaperTradingService,
    private readonly stockService: StockService,
    private readonly riskManagementService: RiskManagementService,
  ) {}

  /**
   * Execute a trade based on the trade request
   */
  async executeTrade(request: TradeRequest): Promise<TradeResult> {
    const tradeId = await this.createPendingTrade(request);

    try {
      this.logger.log(
        `Executing trade ${tradeId}: ${request.type} ${request.quantity} ${request.symbol}`,
      );

      // Update status to executing
      await this.updateTradeStatus(tradeId, AutoTradeStatus.EXECUTING);

      // Validate trade
      const validation = await this.validateTrade(request);
      if (!validation.isValid) {
        await this.failTrade(tradeId, validation.reason || 'Validation failed');
        return {
          success: false,
          error: validation.reason || 'Validation failed',
        };
      }

      // Get current market price
      const currentPrice = await this.getCurrentPrice(request.symbol);
      const executionPrice = request.price || currentPrice;

      // Execute trade through paper trading service
      const result = await this.executeTradeAction(request, executionPrice);

      if (result.success) {
        // Update trade as executed
        await this.updateTradeAsExecuted(
          tradeId,
          executionPrice,
          result.executedQuantity || request.quantity,
        );

        this.logger.log(
          `Trade ${tradeId} executed successfully at $${executionPrice}`,
        );

        return {
          success: true,
          tradeId,
          executedPrice: executionPrice,
          executedQuantity: result.executedQuantity,
          details: result.details,
        };
      } else {
        await this.failTrade(tradeId, result.error || 'Execution failed');
        return {
          success: false,
          tradeId,
          error: result.error,
        };
      }
    } catch (error) {
      this.logger.error(`Error executing trade ${tradeId}:`, error);
      await this.failTrade(tradeId, error.message);
      return {
        success: false,
        tradeId,
        error: error.message,
      };
    }
  }

  /**
   * Validate trade before execution
   */
  async validateTrade(
    request: TradeRequest,
  ): Promise<{ isValid: boolean; reason?: string }> {
    try {
      // Check if portfolio exists and has sufficient funds
      const portfolio = await this.paperTradingService.getPortfolio(
        request.portfolioId,
      );
      if (!portfolio) {
        return { isValid: false, reason: 'Portfolio not found' };
      }

      // Risk management validation
      const riskCheck = await this.riskManagementService.validateTrade(request);
      if (!riskCheck.isAllowed) {
        return { isValid: false, reason: riskCheck.reason };
      }

      // For buy orders, check cash balance
      if (request.type === TradeType.BUY) {
        const currentPrice = await this.getCurrentPrice(request.symbol);
        const totalCost = currentPrice * request.quantity;

        if (portfolio.currentCash < totalCost) {
          return {
            isValid: false,
            reason: `Insufficient funds. Required: $${totalCost.toFixed(2)}, Available: $${portfolio.currentCash.toFixed(2)}`,
          };
        }
      }

      // For sell orders, check position
      if (request.type === TradeType.SELL) {
        const positions = await this.getPortfolioPositions(request.portfolioId);
        const position = positions.find((p) => p.symbol === request.symbol);

        if (!position || position.quantity < request.quantity) {
          return {
            isValid: false,
            reason: `Insufficient position. Required: ${request.quantity}, Available: ${position?.quantity || 0}`,
          };
        }
      }

      return { isValid: true };
    } catch (error) {
      this.logger.error('Error validating trade:', error);
      return { isValid: false, reason: 'Validation error' };
    }
  }

  /**
   * Execute the actual trade action
   */
  private async executeTradeAction(
    request: TradeRequest,
    price: number,
  ): Promise<{
    success: boolean;
    executedQuantity?: number;
    error?: string;
    details?: any;
  }> {
    try {
      // Use the executeTrade method from PaperTradingService
      const createTradeDto = {
        userId: request.portfolioId, // Using portfolioId as userId for simplicity
        symbol: request.symbol,
        type: request.type,
        quantity: request.quantity,
      };

      const result =
        await this.paperTradingService.executeTrade(createTradeDto);
      return {
        success: true,
        executedQuantity: request.quantity,
        details: result,
      };
    } catch (error) {
      this.logger.error('Error executing trade action:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get current market price for a symbol
   */
  private async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const stock = await this.stockService.getStockBySymbol(symbol);
      return stock?.currentPrice || 0;
    } catch (error) {
      this.logger.error(`Error getting price for ${symbol}:`, error);
      throw new Error(`Unable to get current price for ${symbol}`);
    }
  }

  /**
   * Get portfolio positions
   */
  private async getPortfolioPositions(portfolioId: string): Promise<any[]> {
    try {
      // Get portfolio with positions
      const portfolio =
        await this.paperTradingService.getPortfolio(portfolioId);
      return portfolio?.positions || [];
    } catch (error) {
      this.logger.error(
        `Error getting positions for portfolio ${portfolioId}:`,
        error,
      );
      return [];
    }
  }

  /**
   * Create a pending trade record
   */
  private async createPendingTrade(request: TradeRequest): Promise<string> {
    const trade = this.autoTradeRepository.create({
      portfolio_id: request.portfolioId,
      symbol: request.symbol,
      trade_type: request.type,
      quantity: request.quantity,
      trigger_price: request.price,
      status: AutoTradeStatus.PENDING,
      rule_id: request.ruleId,
      recommendation_id: request.recommendationId,
    });

    const savedTrade = await this.autoTradeRepository.save(trade);
    return savedTrade.id;
  }

  /**
   * Update trade status
   */
  private async updateTradeStatus(
    tradeId: string,
    status: AutoTradeStatus,
  ): Promise<void> {
    await this.autoTradeRepository.update(tradeId, {
      status,
      updated_at: new Date(),
    });
  }

  /**
   * Update trade as executed
   */
  private async updateTradeAsExecuted(
    tradeId: string,
    executedPrice: number,
    executedQuantity: number,
  ): Promise<void> {
    await this.autoTradeRepository.update(tradeId, {
      status: AutoTradeStatus.EXECUTED,
      executed_price: executedPrice,
      quantity: executedQuantity,
      executed_at: new Date(),
      updated_at: new Date(),
    });
  }

  /**
   * Mark trade as failed
   */
  private async failTrade(tradeId: string, reason: string): Promise<void> {
    await this.autoTradeRepository.update(tradeId, {
      status: AutoTradeStatus.FAILED,
      failure_reason: reason,
      updated_at: new Date(),
    });
  }

  /**
   * Cancel a pending trade
   */
  async cancelTrade(tradeId: string): Promise<boolean> {
    try {
      const trade = await this.autoTradeRepository.findOne({
        where: { id: tradeId },
      });

      if (!trade) {
        return false;
      }

      if (trade.status !== AutoTradeStatus.PENDING) {
        throw new Error(`Cannot cancel trade with status: ${trade.status}`);
      }

      await this.autoTradeRepository.update(tradeId, {
        status: AutoTradeStatus.CANCELLED,
        updated_at: new Date(),
      });

      this.logger.log(`Trade ${tradeId} cancelled`);
      return true;
    } catch (error) {
      this.logger.error(`Error cancelling trade ${tradeId}:`, error);
      return false;
    }
  }

  /**
   * Get trade details
   */
  async getTradeDetails(tradeId: string): Promise<AutoTrade | null> {
    return await this.autoTradeRepository.findOne({
      where: { id: tradeId },
      relations: ['portfolio', 'rule'],
    });
  }

  /**
   * Get trades for a portfolio
   */
  async getPortfolioTrades(
    portfolioId: string,
    filters?: {
      status?: AutoTradeStatus;
      symbol?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ trades: AutoTrade[]; total: number }> {
    const queryBuilder = this.autoTradeRepository
      .createQueryBuilder('trade')
      .leftJoinAndSelect('trade.rule', 'rule')
      .where('trade.portfolio_id = :portfolioId', { portfolioId });

    if (filters?.status) {
      queryBuilder.andWhere('trade.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.symbol) {
      queryBuilder.andWhere('trade.symbol = :symbol', {
        symbol: filters.symbol,
      });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('trade.created_at >= :startDate', {
        startDate: filters.startDate,
      });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('trade.created_at <= :endDate', {
        endDate: filters.endDate,
      });
    }

    queryBuilder.orderBy('trade.created_at', 'DESC');

    const total = await queryBuilder.getCount();

    if (filters?.limit) {
      queryBuilder.limit(filters.limit);
    }

    if (filters?.offset) {
      queryBuilder.offset(filters.offset);
    }

    const trades = await queryBuilder.getMany();

    return { trades, total };
  }
}
