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
  userId: number;
  totalValue: number;
  totalCash: number;
  totalEquity: number;
  dayChange: number;
  dayChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  positions: Position[];
}

export interface PerformanceData {
  date: string;
  value: number;
  return: number;
  returnPercent: number;
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
        `/api/portfolio/${userId}`
      )) as { data: Portfolio };
      runInAction(() => {
        this.portfolio = response.data;
        this.positions = response.data.positions || [];
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
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });
    try {
      const response = (await this.apiStore.get(
        `/api/portfolio/${userId}/positions`
      )) as { data: Position[] };
      runInAction(() => {
        this.positions = response.data;
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch positions";
        this.isLoading = false;
      });
    }
  }

  async fetchPerformanceHistory(userId: number, period: string = "1M") {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });
    try {
      const response = (await this.apiStore.get(
        `/api/portfolio/${userId}/performance?period=${period}`
      )) as { data: PerformanceData[] };
      runInAction(() => {
        this.performanceHistory = response.data;
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
      }

      // Update portfolio totals
      if (this.portfolio) {
        this.portfolio.totalEquity = this.positions.reduce(
          (sum, pos) => sum + pos.marketValue,
          0
        );
        this.portfolio.totalValue =
          this.portfolio.totalCash + this.portfolio.totalEquity;
      }
    });
  }

  get totalPortfolioValue() {
    return this.portfolio?.totalValue || 0;
  }

  get totalCash() {
    return this.portfolio?.totalCash || 0;
  }

  get totalEquity() {
    return this.portfolio?.totalEquity || 0;
  }

  get dayChange() {
    return this.portfolio?.dayChange || 0;
  }

  get dayChangePercent() {
    return this.portfolio?.dayChangePercent || 0;
  }

  get totalReturn() {
    return this.portfolio?.totalReturn || 0;
  }

  get totalReturnPercent() {
    return this.portfolio?.totalReturnPercent || 0;
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
