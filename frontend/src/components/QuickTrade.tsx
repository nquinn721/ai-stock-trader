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

const QuickTrade: React.FC = observer(() => {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchPortfolioId = async () => {
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
        price: currentStock?.currentPrice || 0,
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
          )}, but only have $${Number(portfolio.currentCash || 0).toFixed(
            2
          )} available.`,
        });
        return;
      }

      await portfolioStore.executeTrade(tradeData);

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
      <div className="quick-trade-card">
        <EmptyState
          title="Loading Portfolio"
          description="Setting up your trading portfolio..."
          type="loading"
          size="medium"
        />
      </div>
    );
  }
  return (
    <div className="dashboard-card quick-trade-card">
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
      {/* Header with Portfolio Info */}
      <div className="trade-header">
        <div className="trade-title">
          <FontAwesomeIcon icon={faBolt} />
          <span>Quick Trading</span>
        </div>
        {portfolio && (
          <div className="portfolio-info">
            <div className="portfolio-metric">
              <FontAwesomeIcon icon={faWallet} />
              <div className="metric-content">
                <span className="metric-label">Cash</span>
                <span className="metric-value">
                  {formatCurrency(portfolio.currentCash)}
                </span>
              </div>
            </div>
            <div className="portfolio-metric">
              <FontAwesomeIcon icon={faChartLine} />
              <div className="metric-content">
                <span className="metric-label">Total</span>
                <span className="metric-value">
                  {formatCurrency(portfolio.totalValue)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Tab Navigation */}
      <div className="trade-tabs">
        <button
          className={`tab ${activeTab === "basic" ? "active" : ""}`}
          onClick={() => setActiveTab("basic")}
        >
          <FontAwesomeIcon icon={faZap} />
          Quick
        </button>
        <button
          className={`tab ${activeTab === "advanced" ? "active" : ""}`}
          onClick={() => setActiveTab("advanced")}
        >
          <FontAwesomeIcon icon={faCogs} />
          Advanced
        </button>
      </div>{" "}
      {/* Basic Trading Tab */}
      {activeTab === "basic" && (
        <div className="trading-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                <FontAwesomeIcon icon={faSearch} />
                Stock Symbol
              </label>
              <StockAutocomplete
                stocks={(stocks || []).map((stock) => ({
                  symbol: stock.symbol,
                  name: stock.name,
                }))}
                value={tradeForm.symbol}
                onChange={(symbol) => setTradeForm({ ...tradeForm, symbol })}
                placeholder="Search symbol or name..."
                disabled={executing}
                className="symbol-autocomplete"
              />
            </div>
            <div className="form-group quantity-group">
              <label className="form-label">
                <FontAwesomeIcon icon={faHashtag} />
                Quantity
              </label>
              <input
                type="number"
                placeholder="Shares"
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
          </div>

          {/* Stock Info Display */}
          {currentStock && (
            <div className="stock-info-card">
              <div className="stock-header">
                <div className="stock-identity">
                  <span className="stock-symbol">{currentStock.symbol}</span>
                  <span className="stock-name">{currentStock.name}</span>
                </div>
                <div className="stock-price">
                  <span className="current-price">
                    {formatCurrency(currentStock.currentPrice)}
                  </span>
                  <span
                    className={`price-change ${
                      currentStock.changePercent >= 0 ? "positive" : "negative"
                    }`}
                  >
                    <i
                      className={`fas fa-arrow-${
                        currentStock.changePercent >= 0 ? "up" : "down"
                      }`}
                    ></i>
                    {currentStock.changePercent >= 0 ? "+" : ""}
                    {currentStock.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              {tradeForm.quantity && parseInt(tradeForm.quantity) > 0 && (
                <div className="trade-estimate">
                  <div className="estimate-row">
                    <span className="estimate-label">
                      <FontAwesomeIcon icon={faCalculator} />
                      Estimated {tradeForm.type === "buy" ? "Cost" : "Proceeds"}
                    </span>
                    <span className="estimate-amount">
                      {formatCurrency(
                        currentStock.currentPrice * parseInt(tradeForm.quantity)
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trading Actions */}
          <div className="trading-actions">
            <div className="trade-type-buttons">
              <button
                className={`trade-type-btn buy ${
                  tradeForm.type === "buy" ? "active" : ""
                }`}
                onClick={() => setTradeForm({ ...tradeForm, type: "buy" })}
                disabled={executing}
              >
                <FontAwesomeIcon icon={faArrowUp} />
                BUY
              </button>
              <button
                className={`trade-type-btn sell ${
                  tradeForm.type === "sell" ? "active" : ""
                }`}
                onClick={() => setTradeForm({ ...tradeForm, type: "sell" })}
                disabled={executing}
              >
                <FontAwesomeIcon icon={faArrowDown} />
                SELL
              </button>
            </div>

            <button
              className="execute-trade-btn"
              onClick={handleTradeSubmit}
              disabled={executing || !isValidTrade() || !portfolioId}
            >
              {executing ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Executing...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faBolt} />
                  {`${tradeForm.type.toUpperCase()} ${
                    tradeForm.quantity || "0"
                  } ${tradeForm.symbol || "STOCK"}`}
                </>
              )}
            </button>
          </div>
        </div>
      )}
      {/* Advanced Trading Tab */}
      {activeTab === "advanced" && (
        <div className="advanced-trading-form">
          <AdvancedOrderEntry
            symbol={tradeForm.symbol}
            portfolioId={portfolio?.id || 0}
            onOrderSubmitted={(order) => {
              addNotification({
                type: "success",
                message: `Advanced order submitted successfully for ${order.symbol}`,
              });
            }}
            onClose={() => setActiveTab("basic")}
          />
        </div>
      )}
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
});

export default QuickTrade;
