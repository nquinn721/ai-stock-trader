import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Portfolio } from '../../entities/portfolio.entity';
import { Position } from '../../entities/position.entity';
import { Stock } from '../../entities/stock.entity';
import { Trade, TradeStatus, TradeType } from '../../entities/trade.entity';
import { StockService } from '../stock/stock.service';

export interface CreateTradeDto {
  portfolioId: number;
  symbol: string;
  type: TradeType;
  quantity: number;
}

export interface CreatePortfolioDto {
  name: string;
  initialCash?: number;
}

@Injectable()
export class PaperTradingService {
  constructor(
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(Position)
    private positionRepository: Repository<Position>,
    @InjectRepository(Trade)
    private tradeRepository: Repository<Trade>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    private stockService: StockService,
  ) {}

  async createPortfolio(
    createPortfolioDto: CreatePortfolioDto,
  ): Promise<Portfolio> {
    const portfolio = this.portfolioRepository.create({
      name: createPortfolioDto.name,
      initialCash: createPortfolioDto.initialCash || 100000,
      currentCash: createPortfolioDto.initialCash || 100000,
    });

    return this.portfolioRepository.save(portfolio);
  }

  async getPortfolios(): Promise<Portfolio[]> {
    return this.portfolioRepository.find({
      relations: ['positions', 'positions.stock', 'trades'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPortfolio(id: number): Promise<Portfolio> {
    const portfolio = await this.portfolioRepository.findOne({
      where: { id },
      relations: ['positions', 'positions.stock', 'trades', 'trades.stock'],
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    await this.updatePortfolioValue(portfolio);
    return portfolio;
  }

  async executeTrade(createTradeDto: CreateTradeDto): Promise<Trade> {
    const { portfolioId, symbol, type, quantity } = createTradeDto;

    // Get portfolio
    const portfolio = await this.portfolioRepository.findOne({
      where: { id: portfolioId },
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    // Get stock
    const stock = await this.stockRepository.findOne({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!stock) {
      throw new NotFoundException('Stock not found');
    } // Update stock price before trading
    await this.stockService.updateStockPrice(symbol);
    const updatedStock = await this.stockRepository.findOne({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!updatedStock) {
      throw new NotFoundException('Updated stock not found');
    }

    const currentPrice = updatedStock.currentPrice || 0;
    const totalValue = currentPrice * quantity;
    const commission = this.calculateCommission(totalValue);
    const totalCost = totalValue + commission;

    // Validate trade
    if (type === TradeType.BUY) {
      if (portfolio.currentCash < totalCost) {
        throw new BadRequestException('Insufficient funds');
      }
    } else if (type === TradeType.SELL) {
      const position = await this.getPosition(portfolioId, stock.id);
      if (!position || position.quantity < quantity) {
        throw new BadRequestException('Insufficient shares to sell');
      }
    }

    // Create trade record
    const trade = this.tradeRepository.create({
      portfolioId,
      stockId: stock.id,
      symbol: symbol.toUpperCase(),
      type,
      quantity,
      price: currentPrice,
      totalValue,
      commission,
      status: TradeStatus.EXECUTED,
    });

    const savedTrade = await this.tradeRepository.save(trade);

    // Update portfolio and positions
    await this.updatePortfolioAfterTrade(portfolio, savedTrade, stock);

    return savedTrade;
  }

  private async updatePortfolioAfterTrade(
    portfolio: Portfolio,
    trade: Trade,
    stock: Stock,
  ): Promise<void> {
    if (trade.type === TradeType.BUY) {
      await this.processBuyTrade(portfolio, trade, stock);
    } else {
      await this.processSellTrade(portfolio, trade, stock);
    }

    await this.updatePortfolioValue(portfolio);
  }

  private async processBuyTrade(
    portfolio: Portfolio,
    trade: Trade,
    stock: Stock,
  ): Promise<void> {
    // Update cash
    const totalCost = trade.totalValue + trade.commission;
    portfolio.currentCash -= totalCost;
    await this.portfolioRepository.save(portfolio);

    // Update or create position
    let position = await this.getPosition(portfolio.id, stock.id);

    if (position) {
      // Update existing position
      const newQuantity = position.quantity + trade.quantity;
      const newTotalCost = position.totalCost + trade.totalValue;
      position.quantity = newQuantity;
      position.averagePrice = newTotalCost / newQuantity;
      position.totalCost = newTotalCost;
    } else {
      // Create new position
      position = this.positionRepository.create({
        portfolioId: portfolio.id,
        stockId: stock.id,
        symbol: stock.symbol,
        quantity: trade.quantity,
        averagePrice: trade.price,
        totalCost: trade.totalValue,
      });
    }

    await this.positionRepository.save(position);
  }

  private async processSellTrade(
    portfolio: Portfolio,
    trade: Trade,
    stock: Stock,
  ): Promise<void> {
    // Update cash
    const totalReceived = trade.totalValue - trade.commission;
    portfolio.currentCash += totalReceived;
    await this.portfolioRepository.save(portfolio);

    // Update position
    const position = await this.getPosition(portfolio.id, stock.id);

    if (position) {
      position.quantity -= trade.quantity;

      if (position.quantity === 0) {
        // Remove position if no shares left
        await this.positionRepository.remove(position);
      } else {
        // Update position
        position.totalCost = position.averagePrice * position.quantity;
        await this.positionRepository.save(position);
      }
    }
  }

  private async getPosition(
    portfolioId: number,
    stockId: number,
  ): Promise<Position | null> {
    return this.positionRepository.findOne({
      where: { portfolioId, stockId },
    });
  }

  private async updatePortfolioValue(portfolio: Portfolio): Promise<void> {
    const positions = await this.positionRepository.find({
      where: { portfolioId: portfolio.id },
      relations: ['stock'],
    });

    let totalPositionValue = 0;

    for (const position of positions) {
      const currentPrice = position.stock.currentPrice || 0;
      position.currentValue = currentPrice * position.quantity;
      position.unrealizedPnL = position.currentValue - position.totalCost;
      position.unrealizedReturn =
        position.totalCost > 0
          ? (position.unrealizedPnL / position.totalCost) * 100
          : 0;

      await this.positionRepository.save(position);
      totalPositionValue += position.currentValue;
    }

    portfolio.totalValue = portfolio.currentCash + totalPositionValue;
    portfolio.totalPnL = portfolio.totalValue - portfolio.initialCash;
    portfolio.totalReturn =
      portfolio.initialCash > 0
        ? (portfolio.totalPnL / portfolio.initialCash) * 100
        : 0;

    await this.portfolioRepository.save(portfolio);
  }

  private calculateCommission(tradeValue: number): number {
    // Simple commission structure: $0.005 per share with minimum $1
    return Math.max(1, tradeValue * 0.0005);
  }

  async getPortfolioPerformance(portfolioId: number): Promise<any> {
    const portfolio = await this.getPortfolio(portfolioId);

    const trades = await this.tradeRepository.find({
      where: { portfolioId },
      relations: ['stock'],
      order: { executedAt: 'ASC' },
    });

    // Calculate daily portfolio values for performance chart
    const performanceData = await this.calculateDailyPerformance(
      portfolio,
      trades,
    );

    return {
      portfolio,
      performanceData,
      summary: {
        totalReturn: portfolio.totalReturn,
        totalPnL: portfolio.totalPnL,
        totalTrades: trades.length,
        winningTrades: trades.filter((t) => t.type === TradeType.SELL).length,
        currentPositions: portfolio.positions?.length || 0,
      },
    };
  }
  private async calculateDailyPerformance(
    portfolio: Portfolio,
    trades: Trade[],
  ): Promise<any[]> {
    // Simplified daily performance calculation
    // In a real implementation, you'd calculate portfolio value for each day
    const data: Array<{
      date: Date;
      value: number;
      cumulativeReturn: number;
    }> = [];
    let runningValue = portfolio.initialCash;

    trades.forEach((trade, index) => {
      if (trade.type === TradeType.SELL) {
        const pnl = trade.totalValue - trade.quantity * trade.price;
        runningValue += pnl;
      }

      data.push({
        date: trade.executedAt,
        value: runningValue,
        cumulativeReturn:
          ((runningValue - portfolio.initialCash) / portfolio.initialCash) *
          100,
      });
    });

    return data;
  }

  async deletePortfolio(id: number): Promise<void> {
    const portfolio = await this.portfolioRepository.findOne({ where: { id } });

    if (!portfolio) {
      throw new NotFoundException('Portfolio not found');
    }

    await this.portfolioRepository.remove(portfolio);
  }
}
