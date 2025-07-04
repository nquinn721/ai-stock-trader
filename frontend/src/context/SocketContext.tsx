import React, { createContext, useContext, useEffect, useState } from "react";
import * as io from "socket.io-client";
import { FRONTEND_API_CONFIG } from "../config/api.config";
import {
  BenchmarkComparison,
  CreateOrderDto,
  News,
  PerformanceAttribution,
  PortfolioAnalytics,
  PortfolioUpdate,
  RiskMetrics,
  SectorAllocation,
  Stock,
  TradingSignal,
} from "../types";

interface SocketContextType {
  socket: any;
  isConnected: boolean;
  stocks: Stock[];
  tradingSignals: TradingSignal[];
  news: News[];
  portfolioUpdates: Map<number, PortfolioUpdate>;
  allPortfolios: any[];
  subscribeToPortfolio: (portfolioId: number) => void;
  unsubscribeFromPortfolio: (portfolioId: number) => void;
  requestAllPortfolios: () => void;
  subscribeToSelectiveStocks: (symbols: string[]) => void;
  getPortfolioPerformance: (portfolioId: number) => Promise<any>;
  getPositionDetails: (portfolioId: number, symbol: string) => Promise<any>;
  getPortfolioAnalytics: (portfolioId: number) => Promise<PortfolioAnalytics>;
  getSectorAllocation: (portfolioId: number) => Promise<SectorAllocation[]>;
  getPerformanceAttribution: (
    portfolioId: number
  ) => Promise<PerformanceAttribution>;
  getRiskMetrics: (portfolioId: number) => Promise<RiskMetrics>;
  getBenchmarkComparison: (
    portfolioId: number
  ) => Promise<BenchmarkComparison[]>;
  getRebalancingSuggestions: (portfolioId: number) => Promise<any>;
  // Order management methods
  createOrder: (orderData: CreateOrderDto) => void;
  cancelOrder: (orderId: number) => void;
  getOrderBook: () => void;
  // Connection health information
  connectionAttempts: number;
  messageQueueSize: number;
  lastHeartbeat: number;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  stocks: [],
  tradingSignals: [],
  news: [],
  portfolioUpdates: new Map(),
  allPortfolios: [],
  subscribeToPortfolio: () => {},
  unsubscribeFromPortfolio: () => {},
  requestAllPortfolios: () => {},
  subscribeToSelectiveStocks: () => {},
  getPortfolioPerformance: async () => null,
  getPositionDetails: async () => null,
  getPortfolioAnalytics: async () => ({}) as PortfolioAnalytics,
  getSectorAllocation: async () => [],
  getPerformanceAttribution: async () => ({}) as PerformanceAttribution,
  getRiskMetrics: async () => ({}) as RiskMetrics,
  getBenchmarkComparison: async () => [],
  getRebalancingSuggestions: async () => [],
  // Order management defaults
  createOrder: () => {},
  cancelOrder: () => {},
  getOrderBook: () => {},
  // Connection health defaults
  connectionAttempts: 0,
  messageQueueSize: 0,
  lastHeartbeat: 0,
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
  const [allPortfolios, setAllPortfolios] = useState<any[]>([]);

  // Message queuing for offline scenarios
  const [messageQueue, setMessageQueue] = useState<
    Array<{ event: string; data: any }>
  >([]);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastHeartbeat, setLastHeartbeat] = useState(Date.now());

  // Connection health monitoring
  const checkConnectionHealth = () => {
    const now = Date.now();
    const timeSinceLastHeartbeat = now - lastHeartbeat;

    // If no heartbeat for 2 minutes, consider connection stale
    if (timeSinceLastHeartbeat > 120000 && isConnected) {
      console.warn("⚠️ Connection appears stale, attempting reconnection");
      socket?.disconnect();
      socket?.connect();
    }
  };

  // Queue message when offline
  const queueMessage = (event: string, data: any) => {
    setMessageQueue((prev) => [...prev, { event, data }]);
  };

  // Process queued messages when connection is restored
  const processQueuedMessages = () => {
    if (socket && isConnected && messageQueue.length > 0) {
      console.log(`📤 Processing ${messageQueue.length} queued messages`);
      messageQueue.forEach(({ event, data }) => {
        socket.emit(event, data);
      });
      setMessageQueue([]);
    }
  };

  const subscribeToPortfolio = (portfolioId: number) => {
    if (socket && isConnected) {
      console.log(`📈 Subscribing to portfolio ${portfolioId}`);
      socket.emit("subscribe_portfolio", { portfolioId });
    } else {
      queueMessage("subscribe_portfolio", { portfolioId });
    }
  };
  const unsubscribeFromPortfolio = (portfolioId: number) => {
    if (socket && isConnected) {
      console.log(`📉 Unsubscribing from portfolio ${portfolioId}`);
      socket.emit("unsubscribe_portfolio", { portfolioId });
    } else {
      queueMessage("unsubscribe_portfolio", { portfolioId });
    }
  };

  const requestAllPortfolios = () => {
    if (socket && isConnected) {
      console.log("📊 Requesting all portfolios");
      socket.emit("subscribe_all_portfolios");
    } else {
      queueMessage("subscribe_all_portfolios", {});
    }
  };

  const subscribeToSelectiveStocks = (symbols: string[]) => {
    if (socket && isConnected) {
      console.log("📊 Subscribing to selective stocks:", symbols);
      socket.emit("subscribe_selective_stocks", { symbols });
    } else {
      queueMessage("subscribe_selective_stocks", { symbols });
    }
  };
  const getPortfolioPerformance = async (portfolioId: number): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!socket || !isConnected) {
        reject(new Error("WebSocket not connected"));
        return;
      }

      const timeoutId = setTimeout(() => {
        socket.off("portfolio_performance_data");
        socket.off("portfolio_error");
        reject(new Error("Request timeout"));
      }, 10000);

      const handleResponse = (data: any) => {
        clearTimeout(timeoutId);
        socket.off("portfolio_performance_data");
        socket.off("portfolio_error");
        resolve(data);
      };

      const handleError = (error: any) => {
        clearTimeout(timeoutId);
        socket.off("portfolio_performance_data");
        socket.off("portfolio_error");
        reject(
          new Error(error.message || "Failed to fetch portfolio performance")
        );
      };

      socket.once("portfolio_performance_data", handleResponse);
      socket.once("portfolio_error", handleError);
      socket.emit("get_portfolio_performance", { portfolioId });
    });
  };

  const getPositionDetails = async (
    portfolioId: number,
    symbol: string
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!socket || !isConnected) {
        reject(new Error("WebSocket not connected"));
        return;
      }

      const timeoutId = setTimeout(() => {
        socket.off("position_details");
        socket.off("position_error");
        reject(new Error("Request timeout"));
      }, 10000);

      const handleResponse = (data: any) => {
        clearTimeout(timeoutId);
        socket.off("position_details");
        socket.off("position_error");
        resolve(data);
      };

      const handleError = (error: any) => {
        clearTimeout(timeoutId);
        socket.off("position_details");
        socket.off("position_error");
        reject(new Error(error.message || "Failed to fetch position details"));
      };

      socket.once("position_details", handleResponse);
      socket.once("position_error", handleError);
      socket.emit("get_position_details", { portfolioId, symbol });
    });
  };

  const getPortfolioAnalytics = async (
    portfolioId: number
  ): Promise<PortfolioAnalytics> => {
    return new Promise((resolve, reject) => {
      if (!socket || !isConnected) {
        reject(new Error("WebSocket not connected"));
        return;
      }

      const timeoutId = setTimeout(() => {
        socket.off("portfolio_analytics");
        socket.off("portfolio_analytics_error");
        reject(new Error("Request timeout"));
      }, 10000);

      const handleResponse = (data: any) => {
        clearTimeout(timeoutId);
        socket.off("portfolio_analytics");
        socket.off("portfolio_analytics_error");
        resolve(data.analytics);
      };

      const handleError = (error: any) => {
        clearTimeout(timeoutId);
        socket.off("portfolio_analytics");
        socket.off("portfolio_analytics_error");
        reject(
          new Error(error.message || "Failed to fetch portfolio analytics")
        );
      };

      socket.once("portfolio_analytics", handleResponse);
      socket.once("portfolio_analytics_error", handleError);
      socket.emit("get_portfolio_analytics", { portfolioId });
    });
  };

  const getSectorAllocation = async (
    portfolioId: number
  ): Promise<SectorAllocation[]> => {
    return new Promise((resolve, reject) => {
      if (!socket || !isConnected) {
        reject(new Error("WebSocket not connected"));
        return;
      }

      const timeoutId = setTimeout(() => {
        socket.off("sector_allocation");
        socket.off("sector_allocation_error");
        reject(new Error("Request timeout"));
      }, 10000);

      const handleResponse = (data: any) => {
        clearTimeout(timeoutId);
        socket.off("sector_allocation");
        socket.off("sector_allocation_error");
        resolve(data.sectorAllocation);
      };

      const handleError = (error: any) => {
        clearTimeout(timeoutId);
        socket.off("sector_allocation");
        socket.off("sector_allocation_error");
        reject(new Error(error.message || "Failed to fetch sector allocation"));
      };

      socket.once("sector_allocation", handleResponse);
      socket.once("sector_allocation_error", handleError);
      socket.emit("get_sector_allocation", { portfolioId });
    });
  };

  const getPerformanceAttribution = async (
    portfolioId: number
  ): Promise<PerformanceAttribution> => {
    return new Promise((resolve, reject) => {
      if (!socket || !isConnected) {
        reject(new Error("WebSocket not connected"));
        return;
      }

      const timeoutId = setTimeout(() => {
        socket.off("performance_attribution");
        socket.off("performance_attribution_error");
        reject(new Error("Request timeout"));
      }, 10000);

      const handleResponse = (data: any) => {
        clearTimeout(timeoutId);
        socket.off("performance_attribution");
        socket.off("performance_attribution_error");
        resolve(data.performanceAttribution);
      };

      const handleError = (error: any) => {
        clearTimeout(timeoutId);
        socket.off("performance_attribution");
        socket.off("performance_attribution_error");
        reject(
          new Error(error.message || "Failed to fetch performance attribution")
        );
      };

      socket.once("performance_attribution", handleResponse);
      socket.once("performance_attribution_error", handleError);
      socket.emit("get_performance_attribution", { portfolioId });
    });
  };

  const getRiskMetrics = async (portfolioId: number): Promise<RiskMetrics> => {
    return new Promise((resolve, reject) => {
      if (!socket || !isConnected) {
        reject(new Error("WebSocket not connected"));
        return;
      }

      const timeoutId = setTimeout(() => {
        socket.off("risk_metrics");
        socket.off("risk_metrics_error");
        reject(new Error("Request timeout"));
      }, 10000);

      const handleResponse = (data: any) => {
        clearTimeout(timeoutId);
        socket.off("risk_metrics");
        socket.off("risk_metrics_error");
        resolve(data.riskMetrics);
      };

      const handleError = (error: any) => {
        clearTimeout(timeoutId);
        socket.off("risk_metrics");
        socket.off("risk_metrics_error");
        reject(new Error(error.message || "Failed to fetch risk metrics"));
      };

      socket.once("risk_metrics", handleResponse);
      socket.once("risk_metrics_error", handleError);
      socket.emit("get_risk_metrics", { portfolioId });
    });
  };

  const getBenchmarkComparison = async (
    portfolioId: number
  ): Promise<BenchmarkComparison[]> => {
    return new Promise((resolve, reject) => {
      if (!socket || !isConnected) {
        reject(new Error("WebSocket not connected"));
        return;
      }

      const timeoutId = setTimeout(() => {
        socket.off("benchmark_comparison");
        socket.off("benchmark_comparison_error");
        reject(new Error("Request timeout"));
      }, 10000);

      const handleResponse = (data: any) => {
        clearTimeout(timeoutId);
        socket.off("benchmark_comparison");
        socket.off("benchmark_comparison_error");
        resolve(data.benchmarkComparison);
      };

      const handleError = (error: any) => {
        clearTimeout(timeoutId);
        socket.off("benchmark_comparison");
        socket.off("benchmark_comparison_error");
        reject(
          new Error(error.message || "Failed to fetch benchmark comparison")
        );
      };

      socket.once("benchmark_comparison", handleResponse);
      socket.once("benchmark_comparison_error", handleError);
      socket.emit("get_benchmark_comparison", { portfolioId });
    });
  };

  const getRebalancingSuggestions = async (
    portfolioId: number
  ): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!socket || !isConnected) {
        reject(new Error("WebSocket not connected"));
        return;
      }

      const timeoutId = setTimeout(() => {
        socket.off("rebalancing_suggestions");
        socket.off("rebalancing_suggestions_error");
        reject(new Error("Request timeout"));
      }, 10000);

      const handleResponse = (data: any) => {
        clearTimeout(timeoutId);
        socket.off("rebalancing_suggestions");
        socket.off("rebalancing_suggestions_error");
        resolve(data.rebalancingSuggestions);
      };

      const handleError = (error: any) => {
        clearTimeout(timeoutId);
        socket.off("rebalancing_suggestions");
        socket.off("rebalancing_suggestions_error");
        reject(
          new Error(error.message || "Failed to fetch rebalancing suggestions")
        );
      };

      socket.once("rebalancing_suggestions", handleResponse);
      socket.once("rebalancing_suggestions_error", handleError);
      socket.emit("get_rebalancing_suggestions", { portfolioId });
    });
  };

  useEffect(() => {
    const newSocket = io.connect(FRONTEND_API_CONFIG.backend.wsUrl, {
      transports: ["websocket", "polling"],
      timeout: 20000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      reconnectionAttempts: 10,
      // Enhanced connection optimization
      forceNew: true,
      upgrade: true,
      rememberUpgrade: true,
    });
    newSocket.on("connect", () => {
      console.log("✅ Connected to WebSocket server");
      setIsConnected(true);
      setConnectionAttempts(0);
      setLastHeartbeat(Date.now());

      // Process any queued messages
      processQueuedMessages();

      newSocket.emit("subscribe_stocks");
      // Request all portfolios on connection
      newSocket.emit("subscribe_all_portfolios");
    });

    newSocket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from WebSocket server:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ WebSocket connection error:", error);
      setIsConnected(false);
      setConnectionAttempts((prev) => prev + 1);
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
      setConnectionAttempts(0);
      setLastHeartbeat(Date.now());
    });

    newSocket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`🔄 Reconnection attempt ${attemptNumber}`);
      setConnectionAttempts(attemptNumber);
    });

    newSocket.on("reconnect_error", (error) => {
      console.error("❌ Reconnection error:", error);
    });

    newSocket.on("reconnect_failed", () => {
      console.error("❌ Reconnection failed after all attempts");
    });

    // Connection health monitoring
    newSocket.on("pong", () => {
      setLastHeartbeat(Date.now());
    });

    // Set up periodic connection health check
    const healthCheckInterval = setInterval(checkConnectionHealth, 30000); // Check every 30 seconds

    newSocket.on("stock_updates", (data: Stock[]) => {
      console.log("📊 Received stock updates:", data.length, "stocks");
      setStocks(data);
    });

    // Handle batched stock updates
    newSocket.on(
      "stock_updates_batch",
      (data: { updates: Stock[][]; count: number; timestamp: string }) => {
        console.log(
          "📊 Received batched stock updates:",
          data.count,
          "batches"
        );
        // Flatten all batched updates
        const allStocks = data.updates.flat();
        // Remove duplicates by symbol (keep latest)
        const stocksMap = new Map();
        allStocks.forEach((stock) => stocksMap.set(stock.symbol, stock));
        setStocks(Array.from(stocksMap.values()));
      }
    );

    // Handle selective stock updates
    newSocket.on(
      "selective_stock_updates",
      (data: { stocks: Stock[]; timestamp: string; initial?: boolean }) => {
        console.log(
          "📊 Received selective stock updates:",
          data.stocks.length,
          "stocks",
          data.initial ? "(initial)" : ""
        );
        if (data.initial) {
          setStocks(data.stocks);
        } else {
          setStocks((prev) => {
            const stocksMap = new Map(prev.map((s) => [s.symbol, s]));
            data.stocks.forEach((stock) => stocksMap.set(stock.symbol, stock));
            return Array.from(stocksMap.values());
          });
        }
      }
    );

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

    // Handle batched stock updates
    newSocket.on(
      "stock_update_batch",
      (data: {
        updates: Array<{ symbol: string; data: Stock }>;
        count: number;
        timestamp: string;
      }) => {
        console.log(
          "📈 Received batched stock updates:",
          data.count,
          "updates"
        );
        setStocks((prev) => {
          const stocksMap = new Map(prev.map((s) => [s.symbol, s]));
          data.updates.forEach(({ symbol, data: stockData }) => {
            const existing = stocksMap.get(symbol);
            if (existing) {
              stocksMap.set(symbol, { ...existing, ...stockData });
            }
          });
          return Array.from(stocksMap.values());
        });
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

    // Handle new portfolio events
    newSocket.on("portfolios_update", (data: any[]) => {
      console.log(
        "📊 Received all portfolios update:",
        data.length,
        "portfolios"
      );
      setAllPortfolios(data);
    });

    newSocket.on("portfolios_performance_update", (data: any[]) => {
      console.log(
        "📈 Received all portfolios performance update:",
        data.length,
        "portfolios"
      );
      setAllPortfolios(data);
    });

    setSocket(newSocket);
    return () => {
      console.log("🔌 Cleaning up WebSocket connection");
      clearInterval(healthCheckInterval);
      newSocket.removeAllListeners();
      newSocket.close();
    };
  }, []);

  // Order management methods
  const createOrder = (orderData: CreateOrderDto) => {
    if (socket && isConnected) {
      console.log("📝 Creating order:", orderData);
      socket.emit("create_order", orderData);
    } else {
      queueMessage("create_order", orderData);
    }
  };

  const cancelOrder = (orderId: number) => {
    if (socket && isConnected) {
      console.log("❌ Canceling order:", orderId);
      socket.emit("cancel_order", { orderId });
    } else {
      queueMessage("cancel_order", { orderId });
    }
  };

  const getOrderBook = () => {
    if (socket && isConnected) {
      console.log("📊 Requesting order book");
      socket.emit("get_order_book");
    } else {
      queueMessage("get_order_book", {});
    }
  };
  const value = {
    socket,
    isConnected,
    stocks,
    tradingSignals,
    news,
    portfolioUpdates,
    allPortfolios,
    subscribeToPortfolio,
    unsubscribeFromPortfolio,
    requestAllPortfolios,
    subscribeToSelectiveStocks,
    getPortfolioPerformance,
    getPositionDetails,
    getPortfolioAnalytics,
    getSectorAllocation,
    getPerformanceAttribution,
    getRiskMetrics,
    getBenchmarkComparison,
    getRebalancingSuggestions,
    // Order management methods
    createOrder,
    cancelOrder,
    getOrderBook,
    // Connection health information
    connectionAttempts,
    messageQueueSize: messageQueue.length,
    lastHeartbeat,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
