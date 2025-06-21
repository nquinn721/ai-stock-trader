import React, { createContext, useContext } from "react";
import { RootStore } from "./RootStore";

export const StoreContext = createContext<RootStore | undefined>(undefined);

export const StoreProvider: React.FC<{
  children: React.ReactNode;
  store: RootStore;
}> = ({ children, store }) => {
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
};

export const useStore = () => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return store;
};

export const useStockStore = () => useStore().stockStore;
export const usePortfolioStore = () => useStore().portfolioStore;
export const useTradeStore = () => useStore().tradeStore;
export const useWebSocketStore = () => useStore().webSocketStore;
export const useApiStore = () => useStore().apiStore;
