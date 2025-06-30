import {
  faArrowDown,
  faArrowUp,
  faBolt,
  faCalculator,
  faChartLine,
  faCogs,
  faHashtag,
  faSearch,
  faSpinner,
  faWallet,
  faZap,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { observer } from "mobx-react-lite";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { usePortfolioStore, useTradeStore } from "../stores/StoreContext";
import EmptyState from "./EmptyState";
import "./QuickTrade.css";
import StockAutocomplete from "./StockAutocomplete";
import { AdvancedOrderEntry } from "./order-management/AdvancedOrderEntry";

interface Notification {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  duration?: number;
}

interface CreateTradeRequest {
  portfolioId: number;
  symbol: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
}

const MAX_RETRIES = 3;

/**
 * QuickTradeContent - Contains only the inner content without container styling
 * Use this component when embedding QuickTrade inside another container
 */
const QuickTradeContent: React.FC = observer(() => {
  const { stocks } = useSocket();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const tradeStore = useTradeStore();
  const portfolioStore = usePortfolioStore();
  const [activeTab, setActiveTab] = useState<"basic" | "advanced">("basic");
  const [tradeForm, setTradeForm] = useState({
    symbol: "",
    type: "buy" as "buy" | "sell",
    quantity: "",
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioId, setPortfolioId] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [portfolio, setPortfolio] = useState<any>(null);

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

  // Portfolio retrieval function with retry
  const getOrCreatePortfolio = useCallback(
    async (retryAttempt = 0): Promise<{ id: number } | null> => {
      if (retryAttempt >= MAX_RETRIES) {
        console.error("Max retries reached for portfolio creation");
        addNotification({
          type: "error",
          message:
            "Failed to create/access portfolio after multiple attempts. Please try again.",
        });
        return null;
      }

      try {
        setPortfolioLoading(true);

        // First, check if there's already a portfolio
        await portfolioStore.fetchPortfolios();
        const existingPortfolio = portfolioStore.portfolios.find(
          (p) => p.name === "Default Portfolio"
        );

        if (existingPortfolio) {
          console.log("Using existing portfolio:", existingPortfolio.id);
          setPortfolioId(existingPortfolio.id);
          setPortfolio(existingPortfolio);
          return { id: existingPortfolio.id };
        }

        // Create new portfolio if none exists
        console.log("Creating new default portfolio...");
        const newPortfolio = await portfolioStore.createPortfolio({
          name: "Default Portfolio",
          initialCash: 10000,
        });

        if (newPortfolio) {
          console.log("Created new portfolio:", newPortfolio.id);
          setPortfolioId(newPortfolio.id);
          setPortfolio(newPortfolio);
          addNotification({
            type: "success",
            message: "Default portfolio created successfully!",
          });
          return { id: newPortfolio.id };
        } else {
          throw new Error("Portfolio creation returned null");
        }
      } catch (error) {
        console.error(
          `Portfolio creation error (attempt ${retryAttempt + 1}):`,
          error
        );

        // Increment retry count and try again
        const nextRetry = retryAttempt + 1;
        setRetryCount(nextRetry);

        if (nextRetry < MAX_RETRIES) {
          console.log(
            `Retrying portfolio creation (${nextRetry}/${MAX_RETRIES})...`
          );
          // Wait a bit before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000 * nextRetry));
          return getOrCreatePortfolio(nextRetry);
        } else {
          addNotification({
            type: "error",
            message:
              "Unable to create portfolio. Please refresh and try again.",
          });
          return null;
        }
      } finally {
        setPortfolioLoading(false);
      }
    },
    [portfolioStore, addNotification]
  );

  // Form handlers
  const handleInputChange = useCallback(
    (field: string, value: string | number) => {
      setTradeForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSymbolSelect = useCallback((symbol: string) => {
    setTradeForm((prev) => ({ ...prev, symbol }));
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setTradeForm({
      symbol: "",
      type: "buy",
      quantity: "",
    });
    setShowConfirmation(false);
    setExecuting(false);
  }, []);

  // Execute trade function
  const executeTrade = useCallback(async () => {
    if (!currentStock) {
      addNotification({
        type: "error",
        message: "Stock data not available",
      });
      return;
    }

    if (!portfolioId) {
      addNotification({
        type: "error",
        message: "No portfolio selected",
      });
      return;
    }

    setExecuting(true);

    try {
      const tradeData: CreateTradeRequest = {
        portfolioId: portfolioId,
        symbol: tradeForm.symbol,
        type: tradeForm.type,
        quantity: parseInt(tradeForm.quantity),
        price: currentStock.currentPrice,
      };

      console.log("Executing trade:", tradeData);

      // Adapt data to TradeRequest format
      const tradeRequest = {
        symbol: tradeData.symbol,
        type: tradeData.type,
        quantity: tradeData.quantity,
        price: tradeData.price,
        orderType: "market" as const,
      };

      const result = await tradeStore.executeTrade(1, tradeRequest);
      console.log("Trade executed successfully:", result);

      addNotification({
        type: "success",
        message: `${tradeForm.type.toUpperCase()} order executed: ${
          tradeForm.quantity
        } shares of ${tradeForm.symbol} at $${currentStock.currentPrice.toFixed(
          2
        )}`,
      });

      // Refresh portfolio data
      await portfolioStore.fetchPortfolios();

      // Reset form
      resetForm();
    } catch (error) {
      console.error("Trade execution failed:", error);
      addNotification({
        type: "error",
        message:
          error instanceof Error ? error.message : "Trade execution failed",
      });
    } finally {
      setExecuting(false);
    }
  }, [
    currentStock,
    portfolioId,
    tradeForm,
    addNotification,
    portfolioStore,
    resetForm,
  ]);

  // Validation
  const isValidTrade = useMemo(() => {
    const quantity = parseInt(tradeForm.quantity);
    return (
      tradeForm.symbol &&
      currentStock &&
      !isNaN(quantity) &&
      quantity > 0 &&
      portfolioId
    );
  }, [tradeForm, currentStock, portfolioId]);

  // Calculate trade value
  const tradeValue = useMemo(() => {
    if (!currentStock || !tradeForm.quantity) return 0;
    const quantity = parseInt(tradeForm.quantity);
    return isNaN(quantity) ? 0 : quantity * currentStock.currentPrice;
  }, [currentStock, tradeForm.quantity]);

  const handleTradeSubmit = async () => {
    if (!portfolioId) {
      console.log("No portfolio ID, attempting to get/create portfolio...");
      const portfolioResult = await getOrCreatePortfolio();
      if (!portfolioResult) {
        addNotification({
          type: "error",
          message: "Unable to access portfolio. Please try again.",
        });
        return;
      }
    }

    // Validate trade
    if (!isValidTrade) {
      addNotification({
        type: "error",
        message: "Please complete all trade fields",
      });
      return;
    }
    setShowConfirmation(true);
  };

  if (portfolioLoading) {
    return (
      <EmptyState
        title="Loading Portfolio"
        description="Setting up your trading portfolio..."
        type="loading"
        size="medium"
      />
    );
  }

  return (
    <>
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

      {/* Tab Navigation */}
      <div className="trade-tabs">
        <button
          className={`tab-btn ${activeTab === "basic" ? "active" : ""}`}
          onClick={() => setActiveTab("basic")}
        >
          <FontAwesomeIcon icon={faZap} className="tab-icon" />
          Quick Trade
        </button>
        <button
          className={`tab-btn ${activeTab === "advanced" ? "active" : ""}`}
          onClick={() => setActiveTab("advanced")}
        >
          <FontAwesomeIcon icon={faCogs} className="tab-icon" />
          Advanced
        </button>
      </div>

      {/* Trade Form Content */}
      {activeTab === "basic" && (
        <div className="trade-form">
          {/* Stock Selection */}
          <div className="form-group">
            <label className="form-label">
              <FontAwesomeIcon icon={faSearch} className="label-icon" />
              Select Stock
            </label>
            <StockAutocomplete
              stocks={stocks || []}
              onChange={handleSymbolSelect}
              placeholder="Search stocks..."
              value={tradeForm.symbol}
            />
            {currentStock && (
              <div className="selected-stock-info">
                <div className="stock-header">
                  <span className="stock-symbol">{currentStock.symbol}</span>
                  <span className="stock-name">{currentStock.name}</span>
                </div>
                <div className="stock-price">
                  <span className="current-price">
                    ${currentStock.currentPrice.toFixed(2)}
                  </span>
                  <span
                    className={`price-change ${
                      (currentStock.changePercent || 0) >= 0
                        ? "positive"
                        : "negative"
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={
                        (currentStock.changePercent || 0) >= 0
                          ? faArrowUp
                          : faArrowDown
                      }
                    />
                    {Math.abs(currentStock.changePercent || 0).toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Trade Type Selection */}
          <div className="form-group">
            <label className="form-label">
              <FontAwesomeIcon icon={faChartLine} className="label-icon" />
              Order Type
            </label>
            <div className="trade-type-buttons">
              <button
                className={`trade-type-btn buy ${
                  tradeForm.type === "buy" ? "active" : ""
                }`}
                onClick={() => handleInputChange("type", "buy")}
              >
                <FontAwesomeIcon icon={faArrowUp} />
                Buy
              </button>
              <button
                className={`trade-type-btn sell ${
                  tradeForm.type === "sell" ? "active" : ""
                }`}
                onClick={() => handleInputChange("type", "sell")}
              >
                <FontAwesomeIcon icon={faArrowDown} />
                Sell
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="form-group">
            <label className="form-label">
              <FontAwesomeIcon icon={faHashtag} className="label-icon" />
              Quantity
            </label>
            <input
              type="number"
              className="form-input"
              placeholder="Enter quantity"
              value={tradeForm.quantity}
              onChange={(e) => handleInputChange("quantity", e.target.value)}
              min="1"
            />
          </div>

          {/* Trade Summary */}
          {tradeValue > 0 && (
            <div className="trade-summary">
              <div className="summary-row">
                <span className="summary-label">
                  <FontAwesomeIcon icon={faCalculator} />
                  Total Value:
                </span>
                <span className="summary-value">${tradeValue.toFixed(2)}</span>
              </div>
              {portfolio && (
                <div className="summary-row">
                  <span className="summary-label">
                    <FontAwesomeIcon icon={faWallet} />
                    Available Cash:
                  </span>
                  <span className="summary-value">
                    ${portfolio.currentCash?.toFixed(2) || "0.00"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            className="trade-submit-btn"
            onClick={handleTradeSubmit}
            disabled={!isValidTrade || executing}
          >
            {executing ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin />
                Executing...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faBolt} />
                Execute {tradeForm.type?.toUpperCase()} Order
              </>
            )}
          </button>
        </div>
      )}

      {/* Advanced Trading Tab */}
      {activeTab === "advanced" && (
        <div className="advanced-trade-container">
          <AdvancedOrderEntry
            symbol={tradeForm.symbol}
            portfolioId={portfolioId || 0}
          />
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="confirmation-overlay">
          <div className="confirmation-modal">
            <div className="confirmation-header">
              <FontAwesomeIcon
                icon={faChartLine}
                className="confirmation-icon"
              />
              <h3>Confirm Trade</h3>
            </div>
            <div className="confirmation-details">
              <div className="detail-row">
                <span>Symbol:</span>
                <strong>{tradeForm.symbol}</strong>
              </div>
              <div className="detail-row">
                <span>Type:</span>
                <strong className={tradeForm.type}>
                  {tradeForm.type.toUpperCase()}
                </strong>
              </div>
              <div className="detail-row">
                <span>Quantity:</span>
                <strong>{tradeForm.quantity}</strong>
              </div>
              <div className="detail-row">
                <span>Price:</span>
                <strong>${currentStock?.currentPrice.toFixed(2)}</strong>
              </div>
              <div className="detail-row total">
                <span>Total:</span>
                <strong>${tradeValue.toFixed(2)}</strong>
              </div>
            </div>
            <div className="confirmation-actions">
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
    </>
  );
});

export default QuickTradeContent;
