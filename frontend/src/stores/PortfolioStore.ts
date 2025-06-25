import { makeAutoObservable, runInAction } from "mobx";
import { ApiStore } from "./ApiStore";
import { Portfolio, Position } from "../types";

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
  portfolios: Portfolio[] = []; // Add portfolios array
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

  async fetchPortfolioById(portfolioId: number) {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });
    try {
      const response = (await this.apiStore.get(
        `/paper-trading/portfolios/${portfolioId}`
      )) as Portfolio;
      runInAction(() => {
        this.portfolio = response;
        this.positions = response.positions || [];
        this.isLoading = false;
      });
      return response;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch portfolio";
        this.isLoading = false;
      });
      throw error;
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

  async fetchPortfolioPerformance(portfolioId: number) {
    try {
      const response = await this.apiStore.get(
        `/paper-trading/portfolios/${portfolioId}/performance`
      ) as any;
      return response;
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch portfolio performance");
    }
  }

  async fetchPortfolios() {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });
    try {
      const response = await this.apiStore.get('/paper-trading/portfolios') as Portfolio[];
      runInAction(() => {
        this.portfolios = response || [];
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch portfolios";
        this.isLoading = false;
      });
    }
  }

  async createPortfolio(portfolioData: { name: string; initialCash: number }) {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });
    try {
      const response = await this.apiStore.post('/paper-trading/portfolios', portfolioData) as Portfolio;
      runInAction(() => {
        this.isLoading = false;
      });
      // Refresh portfolios list
      await this.fetchPortfolios();
      return response;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to create portfolio";
        this.isLoading = false;
      });
      throw error;
    }
  }

  async executeTrade(tradeData: any) {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });
    try {
      const response = await this.apiStore.post('/paper-trading/trade', tradeData);
      runInAction(() => {
        this.isLoading = false;
      });
      return response;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to execute trade";
        this.isLoading = false;
      });
      throw error;
    }
  }

  updatePositionPrice(symbol: string, price: number) {
    runInAction(() => {
      const position = this.positions.find((p) => p.symbol === symbol);
      if (position) {
        // Add currentPrice to position (extend interface)
        (position as any).currentPrice = price;
        position.currentValue = position.quantity * price;
        position.unrealizedPnL =
          position.currentValue - position.quantity * position.averagePrice;
        (position as any).unrealizedPnlPercent =
          (position.unrealizedPnL /
            (position.quantity * position.averagePrice)) *
          100;
      } // Update portfolio totals
      if (this.portfolio) {
        const totalEquity = this.positions.reduce(
          (sum, pos) => sum + pos.currentValue,
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
    return this.positions.reduce((sum, pos) => sum + pos.currentValue, 0);
  }

  get dayChange() {
    // Calculate day change based on positions
    return this.positions.reduce((sum, pos) => {
      const dayChange = ((pos as any).currentPrice - pos.averagePrice) * pos.quantity;
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
      this.portfolios = []; // Reset portfolios array
      this.positions = [];
      this.performanceHistory = [];
      this.isLoading = false;
      this.error = null;
    });
  }
}
