import { makeAutoObservable, runInAction } from "mobx";
import { buildFrontendApiUrl, FRONTEND_API_CONFIG } from "../config/api.config";
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

  // Add cleanup method
  cleanup() {
    webSocketStore.removeListener("stock_updates", this.handleStockUpdates);
    webSocketStore.removeListener("stock_update", this.handleSingleStockUpdate);
    webSocketStore.removeListener("trading_signal", this.handleTradingSignal);
  }

  private handleStockUpdates = (data: Stock[]) => {
    console.log("StockStore: Received stock updates via WebSocket");
    this.updateStocksFromWebSocket(data);
  };

  private handleSingleStockUpdate = (data: Stock) => {
    console.log("StockStore: Received single stock update via WebSocket");
    this.updateStocksFromWebSocket([data]);
  };

  private handleTradingSignal = (data: TradingSignal) => {
    console.log("StockStore: Received trading signal via WebSocket");
    this.addTradingSignal(data);
  };

  private setupWebSocketListeners() {
    // Use proper WebSocket event listeners instead of polling
    webSocketStore.addListener("stock_updates", this.handleStockUpdates);
    webSocketStore.addListener("stock_update", this.handleSingleStockUpdate);
    webSocketStore.addListener("trading_signal", this.handleTradingSignal);
  }

  async fetchStocks(): Promise<void> {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      const stocks = await apiStore.get<Stock[]>(
        FRONTEND_API_CONFIG.backend.endpoints.stocks
      );

      runInAction(() => {
        this.stocks = stocks.map((stock) => ({
          ...stock,
          favorite: stock.favorite || false, // Ensure favorite property exists
        }));
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
      >(FRONTEND_API_CONFIG.backend.endpoints.stocksWithSignals);

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
          favorite: stock.favorite || false, // Add favorite property with default
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
      const signals = await apiStore.get<TradingSignal[]>(
        FRONTEND_API_CONFIG.backend.endpoints.tradingSignals
      );

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
      const stockData = await apiStore.get<Stock>(
        `${FRONTEND_API_CONFIG.backend.endpoints.stocks}/${symbol}`
      );
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
        buildFrontendApiUrl("stockHistory", { symbol }) +
          `?period=${period}&interval=${interval}`
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
        const existingIndex = this.stocks.findIndex(
          (stock) => stock.symbol === updatedStock.symbol
        );

        if (existingIndex !== -1) {
          // Update existing stock with new data (even if price is 0 or undefined)
          this.stocks[existingIndex] = {
            ...this.stocks[existingIndex],
            currentPrice:
              updatedStock.currentPrice ||
              this.stocks[existingIndex].currentPrice,
            previousClose:
              updatedStock.previousClose ||
              this.stocks[existingIndex].previousClose,
            changePercent:
              updatedStock.changePercent !== undefined
                ? updatedStock.changePercent
                : this.stocks[existingIndex].changePercent,
            volume: updatedStock.volume || this.stocks[existingIndex].volume,
            marketCap:
              updatedStock.marketCap || this.stocks[existingIndex].marketCap,
          };
        } else if (updatedStock.currentPrice > 0) {
          // Only add new stocks if they have valid price data
          this.stocks.push(updatedStock);
        }
      });
      this.lastUpdated = new Date();
    });
  }

  updateStockFavorite(symbol: string, favorite: boolean): void {
    runInAction(() => {
      const stockIndex = this.stocks.findIndex(
        (stock) => stock.symbol === symbol
      );
      if (stockIndex !== -1) {
        this.stocks[stockIndex] = {
          ...this.stocks[stockIndex],
          favorite: favorite,
        };
      }
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

  // Check if the store has been initialized with data
  get isInitialized(): boolean {
    return this.stocks.length > 0 || this.lastUpdated !== null;
  }

  // Check if we need fresh data (haven't loaded in the last 5 minutes)
  get needsFreshData(): boolean {
    if (!this.lastUpdated) return true;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.lastUpdated < fiveMinutesAgo;
  }

  clearError(): void {
    this.error = null;
  }

  // Get stocks that have valid price data (ready for display)
  get readyStocks(): Stock[] {
    return this.stocks.filter((stock) => stock.currentPrice > 0);
  }

  // Computed properties
  get topPerformers(): Stock[] {
    return [...this.readyStocks]
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5);
  }

  get worstPerformers(): Stock[] {
    return [...this.readyStocks]
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5);
  }

  get totalMarketCap(): number {
    return this.readyStocks.reduce((sum, stock) => sum + stock.marketCap, 0);
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

  get stocksWithSignalsSorted(): (Stock & { tradingSignal: TradingSignal | null })[] {
    return this.stocksWithSignals.sort((a, b) => {
      // Sort by favorite first (favorites at top), then by symbol alphabetically
      if (a.favorite !== b.favorite) {
        return b.favorite ? 1 : -1; // favorites first
      }
      return a.symbol.localeCompare(b.symbol); // alphabetical by symbol
    });
  }
}

export const stockStore = new StockStore();
