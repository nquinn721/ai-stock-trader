import { observer } from "mobx-react-lite";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { usePortfolioStore, useTradeStore } from "../stores/StoreContext";
import "./QuickTrade.css";

interface Notification {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  duration?: number;
}

const QuickTrade: React.FC = observer(() => {
  const { stocks } = useSocket();
  const tradeStore = useTradeStore();
  const portfolioStore = usePortfolioStore();

  const [tradeForm, setTradeForm] = useState({
    symbol: "",
    type: "buy" as "buy" | "sell",
    quantity: "",
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    // Fetch portfolio data on component mount
    portfolioStore.fetchPortfolio(1);
  }, [portfolioStore]);

  useEffect(() => {
    // Listen for portfolio updates from other components
    const handlePortfolioUpdate = () => {
      portfolioStore.fetchPortfolio(1);
    };

    window.addEventListener("portfolio-updated", handlePortfolioUpdate);
    return () =>
      window.removeEventListener("portfolio-updated", handlePortfolioUpdate);
  }, [portfolioStore]);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id">) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newNotification = { ...notification, id };
      setNotifications((prev) => [...prev, newNotification]);

      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, notification.duration || 5000);
    },
    []
  );

  const currentStock = useMemo(() => {
    return stocks.find(
      (stock) => stock.symbol === tradeForm.symbol.toUpperCase()
    );
  }, [stocks, tradeForm.symbol]);

  const isValidTrade = useCallback(() => {
    const quantity = parseInt(tradeForm.quantity);
    return (
      tradeForm.symbol.trim() !== "" &&
      quantity > 0 &&
      currentStock &&
      portfolioStore.portfolio
    );
  }, [tradeForm, currentStock, portfolioStore.portfolio]);

  const estimatedTotal = useMemo(() => {
    const quantity = parseInt(tradeForm.quantity) || 0;
    const price = currentStock?.currentPrice || 0;
    return quantity * price;
  }, [currentStock, tradeForm.quantity]);

  const executeTrade = async () => {
    if (!isValidTrade() || !portfolioStore.portfolio) return;

    const quantity = parseInt(tradeForm.quantity);
    const estimatedPrice = currentStock?.currentPrice || 0;

    // Validate sufficient funds for buy orders
    if (tradeForm.type === "buy" && estimatedTotal > portfolioStore.totalCash) {
      addNotification({
        type: "error",
        message: `Insufficient funds. Need $${estimatedTotal.toFixed(
          2
        )}, have $${portfolioStore.totalCash.toFixed(2)}`,
      });
      return;
    }

    // Validate sufficient shares for sell orders
    if (tradeForm.type === "sell") {
      const position = portfolioStore.positions.find(
        (p) => p.symbol === tradeForm.symbol.toUpperCase()
      );
      if (!position || position.quantity < quantity) {
        addNotification({
          type: "error",
          message: `Insufficient shares. Need ${quantity}, have ${
            position?.quantity || 0
          }`,
        });
        return;
      }
    }

    try {
      const result = await tradeStore.executeTrade(
        portfolioStore.portfolio.userId,
        {
          symbol: tradeForm.symbol.toUpperCase(),
          type: tradeForm.type,
          quantity,
          orderType: "market",
        }
      );

      if (result.success) {
        addNotification({
          type: "success",
          message: `${tradeForm.type.toUpperCase()} order executed: ${quantity} shares of ${tradeForm.symbol.toUpperCase()}`,
        });

        // Reset form
        setTradeForm({
          symbol: "",
          type: "buy",
          quantity: "",
        });

        // Refresh portfolio
        portfolioStore.fetchPortfolio(portfolioStore.portfolio.userId);

        // Notify other components
        window.dispatchEvent(new CustomEvent("portfolio-updated"));
      } else {
        addNotification({
          type: "error",
          message: result.message || "Trade execution failed",
        });
      }
    } catch (error) {
      addNotification({
        type: "error",
        message: "Failed to execute trade. Please try again.",
      });
    }
  };

  const handleConfirmTrade = () => {
    setShowConfirmation(false);
    executeTrade();
  };

  const canAffordTrade = useMemo(() => {
    if (tradeForm.type === "sell") return true;
    return estimatedTotal <= portfolioStore.totalCash;
  }, [tradeForm.type, estimatedTotal, portfolioStore.totalCash]);

  return (
    <div className="quick-trade-container">
      <h3>Quick Trade</h3>

      {portfolioStore.isLoading && (
        <div className="loading-indicator">Loading portfolio...</div>
      )}

      {portfolioStore.error && (
        <div className="error-indicator">
          Error: {portfolioStore.error}
          <button onClick={() => portfolioStore.fetchPortfolio(1)}>
            Retry
          </button>
        </div>
      )}

      <div className="trade-form">
        <div className="form-group">
          <label htmlFor="symbol">Symbol</label>
          <input
            id="symbol"
            type="text"
            value={tradeForm.symbol}
            onChange={(e) =>
              setTradeForm((prev) => ({
                ...prev,
                symbol: e.target.value.toUpperCase(),
              }))
            }
            placeholder="e.g., AAPL"
            className="symbol-input"
          />
          {currentStock && (
            <div className="stock-info">
              <span className="stock-price">
                ${currentStock.currentPrice.toFixed(2)}
              </span>
              <span
                className={`stock-change ${
                  currentStock.changePercent >= 0 ? "positive" : "negative"
                }`}
              >
                {currentStock.changePercent >= 0 ? "+" : ""}
                {currentStock.changePercent.toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="type">Order Type</label>
          <select
            id="type"
            value={tradeForm.type}
            onChange={(e) =>
              setTradeForm((prev) => ({
                ...prev,
                type: e.target.value as "buy" | "sell",
              }))
            }
            className="type-select"
          >
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="quantity">Quantity</label>
          <input
            id="quantity"
            type="number"
            value={tradeForm.quantity}
            onChange={(e) =>
              setTradeForm((prev) => ({ ...prev, quantity: e.target.value }))
            }
            placeholder="Number of shares"
            min="1"
            className="quantity-input"
          />
        </div>

        {estimatedTotal > 0 && (
          <div className="trade-summary">
            <div className="summary-item">
              <span>Estimated Total:</span>
              <span className={canAffordTrade ? "" : "insufficient-funds"}>
                ${estimatedTotal.toFixed(2)}
              </span>
            </div>
            {portfolioStore.portfolio && (
              <div className="summary-item">
                <span>Available Cash:</span>
                <span>${portfolioStore.totalCash.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setShowConfirmation(true)}
          disabled={
            !isValidTrade() || tradeStore.isExecutingTrade || !canAffordTrade
          }
          className={`trade-button ${tradeForm.type}`}
        >
          {tradeStore.isExecutingTrade
            ? "Executing..."
            : `${tradeForm.type.toUpperCase()} ${tradeForm.symbol || "Stock"}`}
        </button>
      </div>

      {showConfirmation && (
        <div className="confirmation-modal">
          <div className="modal-content">
            <h4>Confirm Trade</h4>
            <p>
              {tradeForm.type.toUpperCase()} {tradeForm.quantity} shares of{" "}
              {tradeForm.symbol.toUpperCase()}
            </p>
            <p>Estimated Total: ${estimatedTotal.toFixed(2)}</p>
            <div className="modal-actions">
              <button
                onClick={() => setShowConfirmation(false)}
                className="cancel-button"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmTrade}
                className={`confirm-button ${tradeForm.type}`}
              >
                Confirm {tradeForm.type.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {notifications.length > 0 && (
        <div className="notifications">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`notification ${notification.type}`}
            >
              {notification.message}
              <button
                onClick={() =>
                  setNotifications((prev) =>
                    prev.filter((n) => n.id !== notification.id)
                  )
                }
                className="close-notification"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export default QuickTrade;
