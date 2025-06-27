<<<<<<< HEAD
import { useContext } from "react";
import { StoreContext } from "../stores/StoreContext";

export const useStores = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStores must be used within a StoreProvider");
  }
  return context;
};
=======
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
} from '../stores/StoreContext';

export const useStores = () => {
  const stockStore = useStockStore();
  const portfolioStore = usePortfolioStore();
  const tradeStore = useTradeStore();
  const autoTradingStore = useAutoTradingStore();
  const webSocketStore = useWebSocketStore();
  const apiStore = useApiStore();
  const recommendationStore = useRecommendationStore();
  const userStore = useUserStore();

  return {
    stockStore,
    portfolioStore,
    tradeStore,
    autoTradingStore,
    webSocketStore,
    apiStore,
    recommendationStore,
    userStore
  };
};
>>>>>>> 6ddc0fc (udpate)
