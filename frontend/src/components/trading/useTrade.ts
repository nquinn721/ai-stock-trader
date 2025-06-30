import { useCallback, useEffect, useMemo, useState } from "react";
import { useSocket } from "../../context/SocketContext";
import { usePortfolioStore, useTradeStore } from "../../stores/StoreContext";
import { Notification } from "./NotificationContainer";

export interface TradeFormData {
  symbol: string;
  type: "buy" | "sell";
  quantity: string;
}

export interface CreateTradeRequest {
  portfolioId: number;
  symbol: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
}

const MAX_RETRIES = 3;

export const useTrade = () => {
  const { stocks } = useSocket();
  const tradeStore = useTradeStore();
  const portfolioStore = usePortfolioStore();

  const [tradeForm, setTradeForm] = useState<TradeFormData>({
    symbol: "",
    type: "buy",
    quantity: "",
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [executing, setExecuting] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioId, setPortfolioId] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [portfolio, setPortfolio] = useState<any>(null);

  // Memoized current stock price
  const currentStock = useMemo(() => {
    return stocks?.find((stock) => stock.symbol === tradeForm.symbol);
  }, [stocks, tradeForm.symbol]);

  // Add notification helper
  const addNotification = useCallback(
    (notification: Omit<Notification, "id">) => {
      const id = Date.now().toString();
      const newNotification = { ...notification, id };
      setNotifications((prev) => [...prev, newNotification]);

      // Auto-remove notification after duration
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, notification.duration || 5000);
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const fetchPortfolioId = useCallback(async () => {
    try {
      setPortfolioLoading(true);
      await portfolioStore.fetchPortfolios();

      if (portfolioStore.portfolios.length > 0) {
        const portfolioId = portfolioStore.portfolios[0].id;
        setPortfolioId(portfolioId);
        await fetchPortfolioDetails(portfolioId);
      } else {
        // Create a default portfolio if none exists
        const newPortfolio = await portfolioStore.createPortfolio({
          name: "Quick Trade Portfolio",
          initialCash: 100000,
        });
        const newPortfolioId = newPortfolio.id;
        setPortfolioId(newPortfolioId);
        await fetchPortfolioDetails(newPortfolioId);

        addNotification({
          type: "info",
          message: "Created new portfolio with $100,000 initial cash",
        });
      }
      setRetryCount(0); // Reset retry count on success
    } catch (error: any) {
      console.error("Error fetching portfolio ID:", error);
      addNotification({
        type: "error",
        message: "Failed to load portfolio. Please refresh the page.",
      });

      // Retry logic
      if (retryCount < MAX_RETRIES) {
        setTimeout(
          () => {
            setRetryCount((prev) => prev + 1);
            fetchPortfolioId();
          },
          2000 * (retryCount + 1)
        ); // Exponential backoff
      }
    } finally {
      setPortfolioLoading(false);
    }
  }, [portfolioStore, retryCount, addNotification]);

  const fetchPortfolioDetails = useCallback(
    async (id?: number) => {
      const targetId = id || portfolioId;
      if (!targetId) return;

      try {
        await portfolioStore.fetchPortfolio(targetId);
        const portfolio = portfolioStore.portfolio;
        if (portfolio) {
          setPortfolio({
            id: portfolio.id,
            currentCash: portfolio.currentCash,
            totalValue: portfolio.totalValue,
          });
        }
      } catch (error) {
        console.error("Error fetching portfolio details:", error);
      }
    },
    [portfolioStore, portfolioId]
  );

  const isValidTrade = useCallback(() => {
    const quantity = parseInt(tradeForm.quantity);
    return (
      tradeForm.symbol &&
      tradeForm.quantity &&
      quantity > 0 &&
      quantity <= 10000 && // Max quantity validation
      currentStock // Ensure stock exists
    );
  }, [tradeForm, currentStock]);

  const getValidationErrors = useCallback(() => {
    const errors: string[] = [];
    const quantity = parseInt(tradeForm.quantity);

    if (!tradeForm.symbol) errors.push("Please select a stock symbol");
    if (!tradeForm.quantity) errors.push("Please enter quantity");
    if (tradeForm.quantity && (quantity <= 0 || isNaN(quantity)))
      errors.push("Quantity must be a positive number");
    if (quantity > 10000) errors.push("Maximum quantity is 10,000 shares");
    if (tradeForm.symbol && !currentStock)
      errors.push("Selected stock is not currently available");

    return errors;
  }, [tradeForm, currentStock]);

  const executeTrade = useCallback(async () => {
    if (!portfolioId || !isValidTrade()) return;

    try {
      setExecuting(true);
      const tradeData: CreateTradeRequest = {
        portfolioId,
        symbol: tradeForm.symbol.toUpperCase(),
        type: tradeForm.type,
        quantity: parseInt(tradeForm.quantity),
        price: currentStock?.currentPrice || 0,
      };

      // Calculate estimated cost/proceeds
      const estimatedPrice = currentStock?.currentPrice || 0;
      const estimatedTotal = estimatedPrice * parseInt(tradeForm.quantity);

      // Validate sufficient funds for buy orders
      if (
        tradeForm.type === "buy" &&
        portfolio &&
        estimatedTotal > portfolio.currentCash
      ) {
        addNotification({
          type: "error",
          message: `Insufficient funds. Need $${estimatedTotal.toFixed(
            2
          )}, but only have $${Number(portfolio.currentCash || 0).toFixed(
            2
          )} available.`,
        });
        return;
      }

      await portfolioStore.executeTrade(tradeData);

      // Reset form
      setTradeForm({ symbol: "", type: "buy", quantity: "" });

      // Show success message with details
      addNotification({
        type: "success",
        message: `${tradeForm.type.toUpperCase()} order for ${
          tradeForm.quantity
        } shares of ${tradeForm.symbol} executed successfully!`,
      });

      // Refresh portfolio data
      await fetchPortfolioDetails();

      // Trigger portfolio refresh for other components
      window.dispatchEvent(new CustomEvent("portfolio-updated"));
    } catch (error: any) {
      console.error("Error executing trade:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error executing trade. Please try again.";

      addNotification({
        type: "error",
        message: errorMessage,
      });
    } finally {
      setExecuting(false);
    }
  }, [
    portfolioId,
    isValidTrade,
    tradeForm,
    currentStock,
    portfolio,
    portfolioStore,
    addNotification,
    fetchPortfolioDetails,
  ]);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }, []);

  useEffect(() => {
    // Initialize default portfolio on component mount
    portfolioStore.initializeDefaultPortfolio();
  }, [portfolioStore]);

  useEffect(() => {
    // Listen for portfolio updates from other components
    const handlePortfolioUpdate = () => {
      portfolioStore.initializeDefaultPortfolio();
    };

    window.addEventListener("portfolio-updated", handlePortfolioUpdate);
    return () =>
      window.removeEventListener("portfolio-updated", handlePortfolioUpdate);
  }, [portfolioStore]);

  return {
    // State
    tradeForm,
    setTradeForm,
    notifications,
    executing,
    portfolioLoading,
    portfolioId,
    portfolio,
    currentStock,
    stocks: (stocks || []).map((stock) => ({
      symbol: stock.symbol,
      name: stock.name,
    })),

    // Actions
    addNotification,
    removeNotification,
    fetchPortfolioId,
    fetchPortfolioDetails,
    executeTrade,
    isValidTrade: isValidTrade(),
    getValidationErrors,
    formatCurrency,
  };
};
