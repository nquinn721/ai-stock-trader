import { AIStore } from "./AIStore";
import { ApiStore } from "./ApiStore";
import { AutoTradingStore } from "./AutoTradingStore";
import { MacroIntelligenceStore } from "./MacroIntelligenceStore";
import { MultiAssetStore } from "./MultiAssetStore";
import { NotificationStore } from "./NotificationStore";
import { OrderManagementStore } from "./OrderManagementStore";
import { PortfolioStore } from "./PortfolioStore";
import { RecommendationStore } from "./RecommendationStore";
import { StockStore } from "./StockStore";
import { TradeStore } from "./TradeStore";
import { TradingAssistantStore } from "./TradingAssistantStore";
import { UserStore } from "./UserStore";
import { WebSocketStore } from "./WebSocketStore";

export class RootStore {
  apiStore: ApiStore;
  webSocketStore: WebSocketStore;
  stockStore: StockStore;
  portfolioStore: PortfolioStore;
  tradeStore: TradeStore;
  autoTradingStore: AutoTradingStore;
  recommendationStore: RecommendationStore;
  userStore: UserStore;
  aiStore: AIStore;
  notificationStore: NotificationStore;
  macroIntelligenceStore: MacroIntelligenceStore;
  multiAssetStore: MultiAssetStore;
  orderManagementStore: OrderManagementStore;
  tradingAssistantStore: TradingAssistantStore;

  constructor() {
    this.apiStore = new ApiStore();
    this.webSocketStore = new WebSocketStore();
    this.stockStore = new StockStore();
    this.portfolioStore = new PortfolioStore(this.apiStore);
    this.tradeStore = new TradeStore(this.apiStore);
    this.autoTradingStore = new AutoTradingStore(this.apiStore);
    this.recommendationStore = new RecommendationStore();
    this.userStore = new UserStore();
    this.aiStore = new AIStore();
    this.notificationStore = new NotificationStore();
    this.macroIntelligenceStore = new MacroIntelligenceStore(this.apiStore);
    this.multiAssetStore = new MultiAssetStore(this.apiStore);
    this.orderManagementStore = new OrderManagementStore(this.apiStore);
    this.tradingAssistantStore = new TradingAssistantStore(this.apiStore);

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
