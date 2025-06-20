import { Injectable } from '@nestjs/common';

// DTOs that the controller expects
export class CreatePortfolioDto {
  userId: string;
  initialBalance?: number;
}

export class CreateTradeDto {
  userId: string;
  symbol: string;
  type: 'buy' | 'sell';
  quantity: number;
}

@Injectable()
export class PaperTradingService {
  constructor() {}

  /**
   * Mock paper trading functionality
   */
  async createPortfolio(createPortfolioDto: CreatePortfolioDto): Promise<any> {
    const { userId, initialBalance = 100000 } = createPortfolioDto;
    return {
      id: `portfolio-${Date.now()}`,
      userId,
      balance: initialBalance,
      totalValue: initialBalance,
      positions: [],
      createdAt: new Date(),
    };
  }

  async getPortfolios(): Promise<any[]> {
    // Mock multiple portfolios
    return [
      {
        id: `portfolio-1`,
        userId: 'user1',
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
        ],
        trades: [],
        createdAt: new Date(),
      },
      {
        id: `portfolio-2`,
        userId: 'user2',
        balance: 98000,
        totalValue: 102000,
        positions: [
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
      },
    ];
  }

  async getPortfolio(id: string | number): Promise<any> {
    return {
      id: `portfolio-${id}`,
      userId: `user-${id}`,
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

  async deletePortfolio(id: string | number): Promise<void> {
    console.log(`Mock: Deleted portfolio ${id}`);
    // In mock mode, just log the operation
  }

  async executeTrade(createTradeDto: CreateTradeDto): Promise<any> {
    const { userId, symbol, type, quantity } = createTradeDto;
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

  async getPortfolioPerformance(id: string | number): Promise<any> {
    return {
      portfolioId: id,
      totalValue: 105000,
      totalGain: 5000,
      totalGainPercent: 5.0,
      dayGain: 250,
      dayGainPercent: 0.24,
      positions: [
        {
          symbol: 'AAPL',
          gain: 35.0,
          gainPercent: 2.0,
        },
        {
          symbol: 'GOOGL',
          gain: 13.75,
          gainPercent: 1.99,
        },
      ],
      performance: [
        { date: '2025-06-19', value: 104750 },
        { date: '2025-06-20', value: 105000 },
      ],
    };
  }
}
