import { makeAutoObservable, runInAction } from "mobx";
import { TradingSignal as BaseTradingSignal, Stock } from "../types";
import { apiStore } from "./ApiStore";
import { webSocketStore } from "./WebSocketStore";

// Extended TradingSignal interface that includes symbol for easier lookup
export interface TradingSignal extends BaseTradingSignal {
  symbol?: string; // Make symbol optional to extend the base interface
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
        // Map the API response to our Stock interface
        this.stocks = stocksWithSignals.map((stock) => ({
          id: stock.id,
          symbol: stock.symbol,
          name: stock.name,
          sector: stock.sector || "",
          description: stock.description || "",
          currentPrice: stock.currentPrice,
          previousClose: stock.previousClose || stock.currentPrice,
          changePercent: stock.changePercent,
          volume: stock.volume,
          marketCap: stock.marketCap,
          createdAt: stock.createdAt || stock.updatedAt,
          updatedAt: stock.updatedAt,
          sentiment: stock.sentiment,
          recentNews: stock.recentNews,
          breakoutStrategy: stock.breakoutStrategy,
        }));

        // Extract trading signals and add symbol for easier lookup
        const signals = stocksWithSignals
          .filter((stock) => stock.tradingSignal)
          .map((stock) => ({
            ...stock.tradingSignal!,
            symbol: stock.symbol, // Add symbol for easier lookup
          }));

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

  async fetchStockDetails(symbol: string): Promise<Stock | null> {
    try {
      const stockData = await apiStore.get<Stock>(`/stocks/${symbol}`);
      return stockData;
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error
            ? error.message
            : `Failed to fetch details for ${symbol}`;
      });
      return null;
    }
  }

  async fetchStockHistory(
    symbol: string,
    period: string = "1d",
    interval: string = "5m"
  ): Promise<any[]> {
    try {
      const historyData = await apiStore.get<any[]>(
        `/stocks/${symbol}/history?period=${period}&interval=${interval}`
      );
      return historyData || [];
    } catch (error) {
      runInAction(() => {
        this.error =
          error instanceof Error
            ? error.message
            : `Failed to fetch history for ${symbol}`;
      });
      return [];
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

  get stocksWithSignals(): (Stock & { tradingSignal: TradingSignal | null })[] {
    return this.stocks.map((stock) => {
      const signal = this.tradingSignals.find(
        (signal) => signal.symbol === stock.symbol && signal.isActive
      );
      return {
        ...stock,
        tradingSignal: signal || null,
      };
    });
  }
}

export const stockStore = new StockStore();
