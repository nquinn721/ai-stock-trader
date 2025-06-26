import { makeAutoObservable, runInAction } from "mobx";
import { Portfolio, Position } from "../types";
import { ApiStore } from "./ApiStore";

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
  portfolios: Portfolio[] = [];
  selectedPortfolioId: number | null = null; // Track the currently selected portfolio
  positions: Position[] = [];
  performanceHistory: PerformanceData[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(private apiStore: ApiStore) {
    makeAutoObservable(this);
  }

  // Check if portfolio data has been initialized
  get isInitialized(): boolean {
    return this.portfolios.length > 0;
  }

  // Get the current portfolio (selected or first available)
  get currentPortfolio(): Portfolio | null {
    if (this.selectedPortfolioId && this.portfolios.length > 0) {
      return (
        this.portfolios.find((p) => p.id === this.selectedPortfolioId) ||
        this.portfolios[0]
      );
    }
    return this.portfolios.length > 0 ? this.portfolios[0] : null;
  }

  // Computed properties for portfolio metrics
  get totalReturn(): number {
    const value = this.currentPortfolio?.totalPnL;
    return typeof value === "number" && !isNaN(value) ? value : 0;
  }

  get totalReturnPercent(): number {
    const value = this.currentPortfolio?.totalReturn;
    return typeof value === "number" && !isNaN(value) ? value : 0;
  }

  // Set the selected portfolio
  setSelectedPortfolio(portfolioId: number) {
    runInAction(() => {
      this.selectedPortfolioId = portfolioId;
      // Update the current portfolio object
      this.portfolio =
        this.portfolios.find((p) => p.id === portfolioId) || null;
    });
  }

  // Initialize with first available portfolio or create default
  async initializeDefaultPortfolio() {
    // Skip if already initialized to prevent redundant API calls
    if (this.isInitialized) {
      console.log("PortfolioStore: Already initialized, skipping fetch");
      return;
    }

    try {
      console.log("PortfolioStore: Initializing portfolios...");
      await this.fetchPortfolios();
      if (this.portfolios.length > 0) {
        // Select the first portfolio
        this.setSelectedPortfolio(this.portfolios[0].id);
        await this.fetchPortfolioById(this.portfolios[0].id);
        console.log("PortfolioStore: Successfully initialized with existing portfolio");
      } else {
        // No portfolios exist, the backend will create a default one
        console.log(
          "PortfolioStore: No portfolios found, backend will create default portfolio"
        );
      }
    } catch (error) {
      console.error("Error initializing portfolio:", error);
    }
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

  async fetchPerformanceHistory(portfolioId: number, period: string = "1M") {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });
    try {
      const response = (await this.apiStore.get(
        `/paper-trading/portfolios/${portfolioId}/performance?period=${period}`
      )) as any;
      runInAction(() => {
        // Handle different possible response structures
        let performanceData = [];
        if (Array.isArray(response)) {
          // Direct array response
          performanceData = response;
        } else if (
          response.performance &&
          Array.isArray(response.performance)
        ) {
          // Wrapped in performance property
          performanceData = response.performance;
        } else if (response.data && Array.isArray(response.data)) {
          // Wrapped in data property
          performanceData = response.data;
        }

        // Transform the performance data to ensure numbers are numbers
        this.performanceHistory = performanceData.map((point: any) => ({
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
        }));
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
      const response = (await this.apiStore.get(
        `/paper-trading/portfolios/${portfolioId}/performance`
      )) as any;
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
      const response = (await this.apiStore.get(
        "/paper-trading/portfolios"
      )) as any;
      runInAction(() => {
        // Handle different possible response structures
        let portfoliosData = [];
        if (Array.isArray(response)) {
          // Direct array response
          portfoliosData = response;
        } else if (response.data && Array.isArray(response.data)) {
          // Wrapped in data property
          portfoliosData = response.data;
        } else if (response.portfolios && Array.isArray(response.portfolios)) {
          // Wrapped in portfolios property
          portfoliosData = response.portfolios;
        }

        this.portfolios = portfoliosData;
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
      const response = (await this.apiStore.post(
        "/paper-trading/portfolios",
        portfolioData
      )) as Portfolio;
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
      const response = await this.apiStore.post(
        "/paper-trading/trade",
        tradeData
      );
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

  async deletePortfolio(portfolioId: number) {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });
    try {
      await this.apiStore.delete(`/paper-trading/portfolios/${portfolioId}`);
      runInAction(() => {
        this.isLoading = false;
        // Remove from local portfolios array
        this.portfolios = this.portfolios.filter((p) => p.id !== portfolioId);
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to delete portfolio";
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

  get totalPortfolioValue(): number {
    const value = this.portfolio?.totalValue;
    return typeof value === "number" && !isNaN(value) ? value : 0;
  }

  get totalCash(): number {
    const value = this.portfolio?.currentCash;
    return typeof value === "number" && !isNaN(value) ? value : 0;
  }

  get totalEquity(): number {
    return this.positions.reduce((sum, pos) => {
      const currentValue =
        typeof pos.currentValue === "number" && !isNaN(pos.currentValue)
          ? pos.currentValue
          : 0;
      return sum + currentValue;
    }, 0);
  }

  get dayChange(): number {
    // Calculate day change based on positions
    return this.positions.reduce((sum, pos) => {
      const currentPrice = (pos as any).currentPrice;
      const avgPrice = pos.averagePrice;
      const quantity = pos.quantity;

      if (
        typeof currentPrice === "number" &&
        !isNaN(currentPrice) &&
        typeof avgPrice === "number" &&
        !isNaN(avgPrice) &&
        typeof quantity === "number" &&
        !isNaN(quantity)
      ) {
        const dayChange = (currentPrice - avgPrice) * quantity;
        return sum + dayChange;
      }
      return sum;
    }, 0);
  }

  get dayChangePercent(): number {
    const totalInvested = this.positions.reduce((sum, pos) => {
      const avgPrice = pos.averagePrice;
      const quantity = pos.quantity;

      if (
        typeof avgPrice === "number" &&
        !isNaN(avgPrice) &&
        typeof quantity === "number" &&
        !isNaN(quantity)
      ) {
        return sum + avgPrice * quantity;
      }
      return sum;
    }, 0);

    const dayChangeValue = this.dayChange;
    return totalInvested > 0 &&
      typeof dayChangeValue === "number" &&
      !isNaN(dayChangeValue)
      ? (dayChangeValue / totalInvested) * 100
      : 0;
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
