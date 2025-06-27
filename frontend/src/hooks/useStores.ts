import { 
  useStore,
  useStockStore, 
  usePortfolioStore, 
  useTradeStore, 
  useAutoTradingStore, 
  useWebSocketStore, 
  useApiStore, 
  useRecommendationStore, 
  useUserStore 
} from '../stores/StoreContext';

export { 
  useStore,
  useStockStore, 
  usePortfolioStore, 
  useTradeStore, 
  useAutoTradingStore, 
  useWebSocketStore, 
  useApiStore, 
  useRecommendationStore, 
  useUserStore 
};

export const useStores = () => {
  const store = useStore();
  return {
    stockStore: store.stockStore,
    portfolioStore: store.portfolioStore,
    tradeStore: store.tradeStore,
    autoTradingStore: store.autoTradingStore,
    webSocketStore: store.webSocketStore,
    apiStore: store.apiStore,
    recommendationStore: store.recommendationStore,
    userStore: store.userStore
  };
};
