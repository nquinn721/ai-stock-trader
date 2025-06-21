import React, { createContext, useContext, useEffect, useState } from "react";
import * as io from "socket.io-client";
import { News, Stock, TradingSignal } from "../types";

interface SocketContextType {
  socket: any;
  isConnected: boolean;
  stocks: Stock[];
  tradingSignals: TradingSignal[];
  news: News[];
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  stocks: [],
  tradingSignals: [],
  news: [],
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
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
