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
    const portfolio = await this.getPortfolio(id);
    const now = new Date();
    const days = 30; // Last 30 days

    // Generate realistic historical performance data
    const performanceHistory: any[] = [];
    let baseValue = 100000; // Starting value
    let currentValue = baseValue;

    for (let i = days; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);

      // Simulate market movement with slight upward bias
      const dailyChange = (Math.random() - 0.48) * 0.02; // Slight positive bias
      currentValue *= 1 + dailyChange;

      // Add some volatility on certain days
      if (i % 7 === 0) {
        // Weekly volatility
        const weeklyVolatility = (Math.random() - 0.5) * 0.05;
        currentValue *= 1 + weeklyVolatility;
      }

      const prevValue =
        performanceHistory.length > 0
          ? performanceHistory[performanceHistory.length - 1].totalValue
          : baseValue;
      const dayChange = i === days ? 0 : currentValue - prevValue;
      const dayChangePercent =
        i === days ? 0 : ((currentValue - prevValue) / prevValue) * 100;

      performanceHistory.push({
        date: date.toISOString().split('T')[0],
        timestamp: date.getTime(),
        totalValue: Math.round(currentValue * 100) / 100,
        cash: Math.round(currentValue * 0.2 * 100) / 100, // 20% cash
        investedValue: Math.round(currentValue * 0.8 * 100) / 100, // 80% invested
        dayChange: Math.round(dayChange * 100) / 100,
        dayChangePercent: Math.round(dayChangePercent * 100) / 100,
      });
    }

    const totalGain = currentValue - baseValue;
    const totalGainPercent = (totalGain / baseValue) * 100;
    const latestDay = performanceHistory[performanceHistory.length - 1];
    const dayGain = latestDay?.dayChange || 0;
    const dayGainPercent = latestDay?.dayChangePercent || 0;

    // Calculate portfolio metrics
    const returns = performanceHistory.slice(1).map((point, index) => {
      const prevValue = performanceHistory[index].totalValue;
      return ((point.totalValue - prevValue) / prevValue) * 100;
    });

    const maxDrawdown = this.calculateMaxDrawdown(
      performanceHistory.map((p) => p.totalValue),
    );
    const volatility = this.calculateVolatility(returns);
    const sharpeRatio = this.calculateSharpeRatio(returns);

    return {
      portfolioId: id,
      totalValue: Math.round(currentValue * 100) / 100,
      totalGain: Math.round(totalGain * 100) / 100,
      totalGainPercent: Math.round(totalGainPercent * 100) / 100,
      dayGain: Math.round(dayGain * 100) / 100,
      dayGainPercent: Math.round(dayGainPercent * 100) / 100,
      positions: portfolio.positions.map((pos) => ({
        symbol: pos.symbol,
        gain: pos.unrealizedPnL,
        gainPercent:
          (pos.unrealizedPnL / (pos.averagePrice * pos.quantity)) * 100,
        quantity: pos.quantity,
        currentValue: pos.totalValue,
      })),
      performance: performanceHistory,
      metrics: {
        maxDrawdown: Math.round(maxDrawdown * 100) / 100,
        volatility: Math.round(volatility * 100) / 100,
        sharpeRatio: Math.round(sharpeRatio * 100) / 100,
        bestDay: Math.max(...returns),
        worstDay: Math.min(...returns),
        totalReturn: totalGainPercent,
        annualizedReturn: (totalGainPercent * 365) / days, // Rough annualization
      },
    };
  }

  private calculateMaxDrawdown(values: number[]): number {
    let maxDrawdown = 0;
    let peak = values[0];

    for (let i = 1; i < values.length; i++) {
      if (values[i] > peak) {
        peak = values[i];
      }
      const drawdown = ((peak - values[i]) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  private calculateVolatility(returns: number[]): number {
    if (returns.length < 2) return 0;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) /
      returns.length;
    return Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility
  }

  private calculateSharpeRatio(returns: number[]): number {
    if (returns.length < 2) return 0;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const std = Math.sqrt(
      returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) /
        returns.length,
    );
    const riskFreeRate = 0.02 / 252; // 2% annual risk-free rate, daily
    return std === 0 ? 0 : ((mean - riskFreeRate) / std) * Math.sqrt(252); // Annualized
  }
}
