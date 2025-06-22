import React, { createContext, useContext, useEffect, useState } from "react";
import * as io from "socket.io-client";
import { News, PortfolioUpdate, Stock, TradingSignal } from "../types";

interface SocketContextType {
  socket: any;
  isConnected: boolean;
  stocks: Stock[];
  tradingSignals: TradingSignal[];
  news: News[];
  portfolioUpdates: Map<number, PortfolioUpdate>;
  subscribeToPortfolio: (portfolioId: number) => void;
  unsubscribeFromPortfolio: (portfolioId: number) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  stocks: [],
  tradingSignals: [],
  news: [],
  portfolioUpdates: new Map(),
  subscribeToPortfolio: () => {},
  unsubscribeFromPortfolio: () => {},
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [tradingSignals, setTradingSignals] = useState<TradingSignal[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [portfolioUpdates, setPortfolioUpdates] = useState<
    Map<number, PortfolioUpdate>
  >(new Map());

  const subscribeToPortfolio = (portfolioId: number) => {
    if (socket && isConnected) {
      console.log(`📈 Subscribing to portfolio ${portfolioId}`);
      socket.emit("subscribe_portfolio", { portfolioId });
    }
  };

  const unsubscribeFromPortfolio = (portfolioId: number) => {
    if (socket && isConnected) {
      console.log(`📉 Unsubscribing from portfolio ${portfolioId}`);
      socket.emit("unsubscribe_portfolio", { portfolioId });
    }
  };
  useEffect(() => {
    const newSocket = io.connect("http://localhost:8000", {
      transports: ["websocket", "polling"],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("✅ Connected to WebSocket server");
      setIsConnected(true);
      newSocket.emit("subscribe_stocks");
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from WebSocket server:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ WebSocket connection error:", error);
      setIsConnected(false);
    });

    newSocket.on("stock_updates", (data: Stock[]) => {
      console.log("📊 Received stock updates:", data.length, "stocks");
      setStocks(data);
    });

    newSocket.on(
      "stock_error",
      (error: { message: string; timestamp: string }) => {
        console.error("❌ Stock data error:", error);
      }
    );

    newSocket.on(
      "stock_update",
      ({ symbol, data }: { symbol: string; data: Stock }) => {
        console.log(`📈 Stock update for ${symbol}:`, data.currentPrice);
        setStocks((prev) =>
          prev.map((stock) =>
            stock.symbol === symbol ? { ...stock, ...data } : stock
          )
        );
      }
    );

    newSocket.on("trading_signal", (signal: TradingSignal) => {
      console.log("🔔 New trading signal:", signal);
      setTradingSignals((prev) => [signal, ...prev.slice(0, 9)]); // Keep last 10 signals
    });
    newSocket.on("news_update", (newsItem: News) => {
      console.log("📰 News update:", newsItem);
      setNews((prev) => [newsItem, ...prev.slice(0, 19)]); // Keep last 20 news items
    });

    newSocket.on("portfolio_update", (portfolioUpdate: PortfolioUpdate) => {
      console.log(
        `📈 Portfolio update for ${portfolioUpdate.portfolioId}:`,
        portfolioUpdate
      );
      setPortfolioUpdates((prev) => {
        const newMap = new Map(prev);
        newMap.set(portfolioUpdate.portfolioId, portfolioUpdate);
        return newMap;
      });
    });

    newSocket.on(
      "portfolio_error",
      (error: { portfolioId: number; message: string; timestamp: string }) => {
        console.error(`❌ Portfolio error for ${error.portfolioId}:`, error);
      }
    );

    setSocket(newSocket);

    return () => {
      console.log("🔌 Cleaning up WebSocket connection");
      newSocket.removeAllListeners();
      newSocket.close();
    };
  }, []);
  const value = {
    socket,
    isConnected,
    stocks,
    tradingSignals,
    news,
    portfolioUpdates,
    subscribeToPortfolio,
    unsubscribeFromPortfolio,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
