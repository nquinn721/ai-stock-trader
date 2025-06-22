import { makeAutoObservable, runInAction } from "mobx";
import { ApiStore } from "./ApiStore";

export interface Position {
  id: number;
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  marketValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
}

export interface Portfolio {
  id: number;
  name: string;
  initialCash: number;
  currentCash: number;
  totalValue: number;
  totalPnL: number;
  totalReturn: number;
  isActive: boolean;
  positions: Position[];
  trades: any[];
  createdAt: string;
  updatedAt: string;
}

export interface PerformanceData {
  date: string;
  timestamp: number;
  totalValue: number;
  cash: number;
  investedValue: number;
  dayChange: number;
  dayChangePercent: number;
}

export class PortfolioStore {
  portfolio: Portfolio | null = null;
  positions: Position[] = [];
  performanceHistory: PerformanceData[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(private apiStore: ApiStore) {
    makeAutoObservable(this);
  }

  async fetchPortfolio(userId: number) {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });
    try {
      const response = (await this.apiStore.get(
        `/paper-trading/portfolios/${userId}`
      )) as Portfolio;
      runInAction(() => {
        this.portfolio = response;
        this.positions = response.positions || [];
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch portfolio";
        this.isLoading = false;
      });
    }
  }
  async fetchPositions(userId: number) {
    // Positions are included in the portfolio data, so just fetch the portfolio
    await this.fetchPortfolio(userId);
  }

  async fetchPerformanceHistory(userId: number, period: string = "1M") {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });
    try {
      const response = (await this.apiStore.get(
        `/paper-trading/portfolios/${userId}/performance?period=${period}`
      )) as any;
      runInAction(() => {
        // Transform the performance data to ensure numbers are numbers
        this.performanceHistory = (response.performance || []).map(
          (point: any) => ({
            date: point.date,
            timestamp: point.timestamp,
            totalValue:
              typeof point.totalValue === "string"
                ? parseFloat(point.totalValue)
                : point.totalValue,
            cash:
              typeof point.cash === "string"
                ? parseFloat(point.cash)
                : point.cash,
            investedValue: point.investedValue,
            dayChange: point.dayChange,
            dayChangePercent: point.dayChangePercent,
          })
        );
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch performance history";
        this.isLoading = false;
      });
    }
  }

  updatePositionPrice(symbol: string, price: number) {
    runInAction(() => {
      const position = this.positions.find((p) => p.symbol === symbol);
      if (position) {
        position.currentPrice = price;
        position.marketValue = position.quantity * price;
        position.unrealizedPnl =
          position.marketValue - position.quantity * position.averagePrice;
        position.unrealizedPnlPercent =
          (position.unrealizedPnl /
            (position.quantity * position.averagePrice)) *
          100;
      } // Update portfolio totals
      if (this.portfolio) {
        const totalEquity = this.positions.reduce(
          (sum, pos) => sum + pos.marketValue,
          0
        );
        this.portfolio.totalValue = this.portfolio.currentCash + totalEquity;
      }
    });
  }

  get totalPortfolioValue() {
    return this.portfolio?.totalValue || 0;
  }
  get totalCash() {
    return this.portfolio?.currentCash || 0;
  }

  get totalEquity() {
    return this.positions.reduce((sum, pos) => sum + pos.marketValue, 0);
  }

  get dayChange() {
    // Calculate day change based on positions
    return this.positions.reduce((sum, pos) => {
      const dayChange = (pos.currentPrice - pos.averagePrice) * pos.quantity;
      return sum + dayChange;
    }, 0);
  }

  get dayChangePercent() {
    const totalInvested = this.positions.reduce(
      (sum, pos) => sum + pos.averagePrice * pos.quantity,
      0
    );
    return totalInvested > 0 ? (this.dayChange / totalInvested) * 100 : 0;
  }

  get totalReturn() {
    return this.portfolio?.totalReturn || 0;
  }

  get totalReturnPercent() {
    const initialValue = this.portfolio?.initialCash || 0;
    return initialValue > 0 ? (this.totalReturn / initialValue) * 100 : 0;
  }

  get topPositions() {
    return this.positions.slice(0, 5);
  }

  get isPositive() {
    return this.dayChange >= 0;
  }

  clearError() {
    runInAction(() => {
      this.error = null;
    });
  }

  reset() {
    runInAction(() => {
      this.portfolio = null;
      this.positions = [];
      this.performanceHistory = [];
      this.isLoading = false;
      this.error = null;
    });
  }
}
