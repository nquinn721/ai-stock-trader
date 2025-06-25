import { ApiStore } from "./ApiStore";
import { PortfolioStore } from "./PortfolioStore";
import { RecommendationStore } from "./RecommendationStore";
import { StockStore } from "./StockStore";
import { TradeStore } from "./TradeStore";
import { UserStore } from "./UserStore";
import { WebSocketStore } from "./WebSocketStore";

export class RootStore {
  apiStore: ApiStore;
  webSocketStore: WebSocketStore;
  stockStore: StockStore;
  portfolioStore: PortfolioStore;
  tradeStore: TradeStore;
  recommendationStore: RecommendationStore;
  userStore: UserStore;
  
  constructor() {
    this.apiStore = new ApiStore();
    this.webSocketStore = new WebSocketStore();
    this.stockStore = new StockStore();
    this.portfolioStore = new PortfolioStore(this.apiStore);
    this.tradeStore = new TradeStore(this.apiStore);
    this.recommendationStore = new RecommendationStore();
    this.userStore = new UserStore();

    // Set up real-time price updates for portfolio
    this.setupPortfolioUpdates();
  }

  private setupPortfolioUpdates() {
    // Listen for stock price updates and update portfolio positions
    this.webSocketStore.addListener(
      "stockPrice",
      (data: { symbol: string; price: number }) => {
        this.portfolioStore.updatePositionPrice(data.symbol, data.price);
      }
    );

    // Listen for trade confirmations
    this.webSocketStore.addListener("tradeConfirmed", (trade: any) => {
      this.tradeStore.addTrade(trade); // Refresh portfolio after trade
      if (this.portfolioStore.portfolio) {
        this.portfolioStore.fetchPortfolio(this.portfolioStore.portfolio.id);
      }
    });
  }

  cleanup() {
    this.webSocketStore.disconnect();
  }
}

export const rootStore = new RootStore();
