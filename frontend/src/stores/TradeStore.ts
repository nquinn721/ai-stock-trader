import { makeAutoObservable, runInAction } from "mobx";
import { ApiStore } from "./ApiStore";

export interface TradeRequest {
  symbol: string;
  type: "buy" | "sell";
  quantity: number;
  price?: number;
  orderType: "market" | "limit";
}

export interface Trade {
  id: number;
  userId: number;
  symbol: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  totalValue: number;
  timestamp: string;
  status: "pending" | "completed" | "cancelled";
}

export interface TradeResult {
  success: boolean;
  trade?: Trade;
  message: string;
}

export class TradeStore {
  trades: Trade[] = [];
  recentTrades: Trade[] = [];
  isExecutingTrade = false;
  error: string | null = null;
  isLoading = false;

  constructor(private apiStore: ApiStore) {
    makeAutoObservable(this);
  }

  async executeTrade(
    userId: number,
    tradeRequest: TradeRequest
  ): Promise<TradeResult> {
    runInAction(() => {
      this.isExecutingTrade = true;
      this.error = null;
    });

    try {
      const response = (await this.apiStore.post(`/api/paper-trading/trade`, {
        userId,
        ...tradeRequest,
      })) as { data: TradeResult };

      runInAction(() => {
        this.isExecutingTrade = false;
        if (response.data.success && response.data.trade) {
          this.trades.unshift(response.data.trade);
          this.recentTrades.unshift(response.data.trade);
          // Keep only last 10 recent trades
          if (this.recentTrades.length > 10) {
            this.recentTrades = this.recentTrades.slice(0, 10);
          }
        }
      });

      return response.data;
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to execute trade";
        this.isExecutingTrade = false;
      });
      return {
        success: false,
        message: error.message || "Failed to execute trade",
      };
    }
  }

  async fetchTrades(userId: number, limit: number = 50) {
    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      const response = (await this.apiStore.get(
        `/api/paper-trading/trades/${userId}?limit=${limit}`
      )) as { data: Trade[] };
      runInAction(() => {
        this.trades = response.data;
        this.recentTrades = response.data.slice(0, 10);
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = error.message || "Failed to fetch trades";
        this.isLoading = false;
      });
    }
  }

  async buyStock(
    userId: number,
    symbol: string,
    quantity: number,
    orderType: "market" | "limit" = "market",
    price?: number
  ): Promise<TradeResult> {
    return this.executeTrade(userId, {
      symbol,
      type: "buy",
      quantity,
      orderType,
      price,
    });
  }

  async sellStock(
    userId: number,
    symbol: string,
    quantity: number,
    orderType: "market" | "limit" = "market",
    price?: number
  ): Promise<TradeResult> {
    return this.executeTrade(userId, {
      symbol,
      type: "sell",
      quantity,
      orderType,
      price,
    });
  }

  get latestTrade() {
    return this.trades[0] || null;
  }

  get todaysTrades() {
    const today = new Date().toDateString();
    return this.trades.filter(
      (trade) => new Date(trade.timestamp).toDateString() === today
    );
  }

  get totalTradesCount() {
    return this.trades.length;
  }

  get completedTrades() {
    return this.trades.filter((trade) => trade.status === "completed");
  }

  get pendingTrades() {
    return this.trades.filter((trade) => trade.status === "pending");
  }

  clearError() {
    runInAction(() => {
      this.error = null;
    });
  }

  reset() {
    runInAction(() => {
      this.trades = [];
      this.recentTrades = [];
      this.isExecutingTrade = false;
      this.error = null;
      this.isLoading = false;
    });
  }

  addTrade(trade: Trade) {
    runInAction(() => {
      this.trades.unshift(trade);
      this.recentTrades.unshift(trade);
      if (this.recentTrades.length > 10) {
        this.recentTrades = this.recentTrades.slice(0, 10);
      }
    });
  }

  updateTradeStatus(tradeId: number, status: Trade["status"]) {
    runInAction(() => {
      const trade = this.trades.find((t) => t.id === tradeId);
      if (trade) {
        trade.status = status;
      }
      const recentTrade = this.recentTrades.find((t) => t.id === tradeId);
      if (recentTrade) {
        recentTrade.status = status;
      }
    });
  }
}
