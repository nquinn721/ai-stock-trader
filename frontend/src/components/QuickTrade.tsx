import axios from "axios";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { CreateTradeRequest } from "../types";
import "./QuickTrade.css";

interface Notification {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  duration?: number;
}

interface Portfolio {
  id: number;
  currentCash: number;
  totalValue: number;
}

const QuickTrade: React.FC = () => {
  const { stocks } = useSocket();
  const [portfolioId, setPortfolioId] = useState<number | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [tradeForm, setTradeForm] = useState({
    symbol: "",
    type: "buy" as "buy" | "sell",
    quantity: "",
  });
  const [executing, setExecuting] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  useEffect(() => {
    fetchPortfolioId();
  }, []);

  useEffect(() => {
    // Listen for portfolio updates from other components
    const handlePortfolioUpdate = () => {
      if (portfolioId) {
        fetchPortfolioDetails();
      }
    };

    window.addEventListener("portfolio-updated", handlePortfolioUpdate);
    return () =>
      window.removeEventListener("portfolio-updated", handlePortfolioUpdate);
  }, [portfolioId]);

  // Memoized current stock price
  const currentStock = useMemo(() => {
    return stocks.find((stock) => stock.symbol === tradeForm.symbol);
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

  const fetchPortfolioId = async () => {
    try {
      setPortfolioLoading(true);
      const response = await axios.get(
        "http://localhost:8000/paper-trading/portfolios",
        { timeout: 10000 }
      );
      const portfolios = response.data;

      if (portfolios.length > 0) {
        const portfolioId = portfolios[0].id;
        setPortfolioId(portfolioId);
        await fetchPortfolioDetails(portfolioId);
      } else {
        // Create a default portfolio if none exists
        const createResponse = await axios.post(
          "http://localhost:8000/paper-trading/portfolios",
          {
            name: "Quick Trade Portfolio",
            initialCash: 100000,
          },
          { timeout: 10000 }
        );
        const newPortfolioId = createResponse.data.id;
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
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          fetchPortfolioId();
        }, 2000 * (retryCount + 1)); // Exponential backoff
      }
    } finally {
      setPortfolioLoading(false);
    }
  };

  const fetchPortfolioDetails = async (id?: number) => {
    const targetId = id || portfolioId;
    if (!targetId) return;

    try {
      const response = await axios.get(
        `http://localhost:8000/paper-trading/portfolios/${targetId}`,
        { timeout: 10000 }
      );        setPortfolio({
          id: response.data.id,
          currentCash: response.data.currentCash,
          totalValue: response.data.totalValue,
        });
    } catch (error) {
      console.error("Error fetching portfolio details:", error);
    }
  };
  const executeTrade = async () => {
    if (!portfolioId || !isValidTrade()) return;

    try {
      setExecuting(true);
      const tradeData: CreateTradeRequest = {
        portfolioId,
        symbol: tradeForm.symbol.toUpperCase(),
        type: tradeForm.type,
        quantity: parseInt(tradeForm.quantity),
      }; // Calculate estimated cost/proceeds
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
          )}, but only have $${portfolio.currentCash.toFixed(2)} available.`,
        });
        return;
      }

      await axios.post("http://localhost:8000/paper-trading/trade", tradeData, {
        timeout: 15000,
      });

      // Reset form and hide confirmation
      setTradeForm({ symbol: "", type: "buy", quantity: "" });
      setShowConfirmation(false);

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
  };
  const isValidTrade = () => {
    const quantity = parseInt(tradeForm.quantity);
    return (
      tradeForm.symbol &&
      tradeForm.quantity &&
      quantity > 0 &&
      quantity <= 10000 && // Max quantity validation
      currentStock // Ensure stock exists
    );
  };

  const getValidationErrors = () => {
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
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleTradeSubmit = () => {
    if (!isValidTrade()) {
      const errors = getValidationErrors();
      addNotification({
        type: "error",
        message: errors.join(". "),
      });
      return;
    }
    setShowConfirmation(true);
  };
  if (portfolioLoading) {
    return (
      <div className="quick-trade-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quick-trade-container">
      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="notifications-container">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification notification-${notification.type}`}
            >
              <span>{notification.message}</span>
              <button
                className="notification-close"
                onClick={() =>
                  setNotifications((prev) =>
                    prev.filter((n) => n.id !== notification.id)
                  )
                }
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <h2>Quick Trade</h2>

      {/* Portfolio Summary */}
      {portfolio && (
        <div className="portfolio-summary">
          <div className="portfolio-stat">
            <span className="stat-label">Available Cash</span>
            <span className="stat-value">{formatCurrency(portfolio.currentCash)}</span>
          </div>
          <div className="portfolio-stat">
            <span className="stat-label">Total Value</span>
            <span className="stat-value">
              {formatCurrency(portfolio.totalValue)}
            </span>
          </div>
        </div>
      )}

      <div className="quick-trade-form">
        <div className="trade-input-group">
          <select
            value={tradeForm.symbol}
            onChange={(e) =>
              setTradeForm({ ...tradeForm, symbol: e.target.value })
            }
            className="symbol-select"
            disabled={executing}
          >
            <option value="">Select Symbol</option>
            {stocks.map((stock) => (
              <option key={stock.symbol} value={stock.symbol}>
                {stock.symbol} - {stock.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Qty"
            value={tradeForm.quantity}
            onChange={(e) =>
              setTradeForm({ ...tradeForm, quantity: e.target.value })
            }
            min="1"
            max="10000"
            className="quantity-input"
            disabled={executing}
          />
        </div>

        {/* Stock Price Display */}
        {currentStock && (
          <div className="stock-price-display">
            <div className="price-info">
              <span className="stock-symbol">{currentStock.symbol}</span>
              <span className="stock-price">
                {formatCurrency(currentStock.currentPrice)}
              </span>
              <span
                className={`price-change ${
                  currentStock.changePercent >= 0 ? "positive" : "negative"
                }`}
              >
                {currentStock.changePercent >= 0 ? "+" : ""}
                {currentStock.changePercent.toFixed(2)}%
              </span>
            </div>
            {tradeForm.quantity && parseInt(tradeForm.quantity) > 0 && (
              <div className="trade-estimate">
                <span>
                  Estimated {tradeForm.type === "buy" ? "Cost" : "Proceeds"}:{" "}
                </span>
                <span className="estimate-amount">
                  {formatCurrency(
                    currentStock.currentPrice * parseInt(tradeForm.quantity)
                  )}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="trade-type-buttons">
          <button
            className={`trade-type-btn buy ${
              tradeForm.type === "buy" ? "active" : ""
            }`}
            onClick={() => setTradeForm({ ...tradeForm, type: "buy" })}
            disabled={executing}
          >
            BUY
          </button>
          <button
            className={`trade-type-btn sell ${
              tradeForm.type === "sell" ? "active" : ""
            }`}
            onClick={() => setTradeForm({ ...tradeForm, type: "sell" })}
            disabled={executing}
          >
            SELL
          </button>
        </div>

        <button
          className="execute-trade-btn"
          onClick={handleTradeSubmit}
          disabled={executing || !isValidTrade() || !portfolioId}
        >
          {executing
            ? "Executing..."
            : `${tradeForm.type.toUpperCase()} ${tradeForm.quantity || "0"} ${
                tradeForm.symbol || "Stock"
              }`}
        </button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && currentStock && (
        <div className="confirmation-overlay">
          <div className="confirmation-dialog">
            <h3>Confirm Trade</h3>
            <div className="confirmation-details">
              <p>
                <strong>Action:</strong> {tradeForm.type.toUpperCase()}
              </p>
              <p>
                <strong>Symbol:</strong> {tradeForm.symbol}
              </p>
              <p>
                <strong>Quantity:</strong> {tradeForm.quantity} shares
              </p>
              <p>
                <strong>Price:</strong>{" "}
                {formatCurrency(currentStock.currentPrice)} per share
              </p>
              <p>
                <strong>
                  Estimated {tradeForm.type === "buy" ? "Cost" : "Proceeds"}:
                </strong>{" "}
                {formatCurrency(
                  currentStock.currentPrice * parseInt(tradeForm.quantity)
                )}
              </p>
            </div>
            <div className="confirmation-buttons">
              <button
                className="confirm-btn"
                onClick={executeTrade}
                disabled={executing}
              >
                {executing ? "Executing..." : "Confirm Trade"}
              </button>
              <button
                className="cancel-btn"
                onClick={() => setShowConfirmation(false)}
                disabled={executing}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickTrade;
