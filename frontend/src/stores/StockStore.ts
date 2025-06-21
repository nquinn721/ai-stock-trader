import { makeAutoObservable, runInAction } from "mobx";
import { apiStore } from "./ApiStore";
import { webSocketStore } from "./WebSocketStore";

export interface Stock {
  id: number;
  symbol: string;
  name: string;
  currentPrice: number;
  changeAmount: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  peRatio: number;
  updatedAt: string;
}

export interface TradingSignal {
  id: number;
  symbol: string;
  signal: "buy" | "sell" | "hold";
  confidence: number;
  reasoning: string;
  isActive: boolean;
  createdAt: string;
}

export class StockStore {
  stocks: Stock[] = [];
  tradingSignals: TradingSignal[] = [];
  selectedStock: Stock | null = null;
  isLoading = false;
  error: string | null = null;
  lastUpdated: Date | null = null;

  constructor() {
    makeAutoObservable(this);
    this.setupWebSocketListeners();
  }

  private setupWebSocketListeners() {
    // React to WebSocket events
    setInterval(() => {
      const stockUpdates = webSocketStore.getEventsByType("stock_updates");
      const latestUpdate = stockUpdates[0];

      if (
        latestUpdate &&
        latestUpdate.timestamp > (this.lastUpdated?.getTime() || 0)
      ) {
        this.updateStocksFromWebSocket(latestUpdate.data);
      }

      const signalUpdates = webSocketStore.getEventsByType("trading_signal");
      const latestSignal = signalUpdates[0];

      if (
        latestSignal &&
        latestSignal.timestamp > (this.lastUpdated?.getTime() || 0)
      ) {
        this.addTradingSignal(latestSignal.data);
      }
    }, 1000); // Check every second
  }

  async fetchStocks(): Promise<void> {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      const stocks = await apiStore.get<Stock[]>("/stocks");

      runInAction(() => {
        this.stocks = stocks;
        this.lastUpdated = new Date();
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error ? error.message : "Failed to fetch stocks";
        this.isLoading = false;
      });
    }
  }

  async fetchStocksWithSignals(): Promise<void> {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      const stocksWithSignals = await apiStore.get<
        (Stock & { tradingSignal?: TradingSignal })[]
      >("/stocks/with-signals/all");

      runInAction(() => {
        this.stocks = stocksWithSignals.map((stock) => ({
          id: stock.id,
          symbol: stock.symbol,
          name: stock.name,
          currentPrice: stock.currentPrice,
          changeAmount: stock.changeAmount,
          changePercent: stock.changePercent,
          volume: stock.volume,
          marketCap: stock.marketCap,
          peRatio: stock.peRatio,
          updatedAt: stock.updatedAt,
        }));

        // Extract trading signals
        const signals = stocksWithSignals
          .filter((stock) => stock.tradingSignal)
          .map((stock) => stock.tradingSignal!);

        this.tradingSignals = signals;
        this.lastUpdated = new Date();
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error
            ? error.message
            : "Failed to fetch stocks with signals";
        this.isLoading = false;
      });
    }
  }

  async fetchTradingSignals(): Promise<void> {
    try {
      const signals = await apiStore.get<TradingSignal[]>("/trading/signals");

      runInAction(() => {
        this.tradingSignals = signals;
      });
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error
            ? error.message
            : "Failed to fetch trading signals";
      });
    }
  }

  private updateStocksFromWebSocket(stockUpdates: Stock[]): void {
    runInAction(() => {
      stockUpdates.forEach((updatedStock) => {
        const index = this.stocks.findIndex(
          (stock) => stock.symbol === updatedStock.symbol
        );
        if (index !== -1) {
          this.stocks[index] = { ...this.stocks[index], ...updatedStock };
        }
      });
      this.lastUpdated = new Date();
    });
  }

  private addTradingSignal(signal: TradingSignal): void {
    runInAction(() => {
      const existingIndex = this.tradingSignals.findIndex(
        (s) => s.symbol === signal.symbol
      );
      if (existingIndex !== -1) {
        this.tradingSignals[existingIndex] = signal;
      } else {
        this.tradingSignals.unshift(signal);
      }
    });
  }

  setSelectedStock(stock: Stock | null): void {
    this.selectedStock = stock;
  }

  getStockBySymbol(symbol: string): Stock | undefined {
    return this.stocks.find((stock) => stock.symbol === symbol);
  }

  getSignalsBySymbol(symbol: string): TradingSignal[] {
    return this.tradingSignals.filter((signal) => signal.symbol === symbol);
  }

  getActiveSignals(): TradingSignal[] {
    return this.tradingSignals.filter((signal) => signal.isActive);
  }

  clearError(): void {
    this.error = null;
  }

  // Computed properties
  get topPerformers(): Stock[] {
    return [...this.stocks]
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5);
  }

  get worstPerformers(): Stock[] {
    return [...this.stocks]
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5);
  }

  get totalMarketCap(): number {
    return this.stocks.reduce((sum, stock) => sum + stock.marketCap, 0);
  }
}

export const stockStore = new StockStore();
