import { Injectable } from '@nestjs/common';

@Injectable()
export class PaperTradingService {
  constructor() {}

  /**
   * Mock paper trading functionality
   */
  async createPortfolio(
    userId: string,
    initialBalance: number = 100000,
  ): Promise<any> {
    return {
      id: `portfolio-${Date.now()}`,
      userId,
      balance: initialBalance,
      totalValue: initialBalance,
      positions: [],
      createdAt: new Date(),
    };
  }

  async getPortfolio(userId: string): Promise<any> {
    return {
      id: `portfolio-${userId}`,
      userId,
      balance: 95000,
      totalValue: 105000,
      positions: [
        {
          symbol: 'AAPL',
          quantity: 10,
          averagePrice: 175.0,
          currentPrice: 178.5,
          totalValue: 1785.0,
          unrealizedPnL: 35.0,
        },
        {
          symbol: 'GOOGL',
          quantity: 5,
          averagePrice: 138.0,
          currentPrice: 140.75,
          totalValue: 703.75,
          unrealizedPnL: 13.75,
        },
      ],
      trades: [],
      createdAt: new Date(),
    };
  }

  async executeTrade(
    userId: string,
    symbol: string,
    type: 'buy' | 'sell',
    quantity: number,
  ): Promise<any> {
    return {
      id: `trade-${Date.now()}`,
      userId,
      symbol,
      type,
      quantity,
      price: 150 + Math.random() * 100, // Mock price
      status: 'executed',
      executedAt: new Date(),
    };
  }
}
