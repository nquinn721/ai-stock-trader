import axios from "axios";
import { observer } from "mobx-react-lite";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { usePortfolioStore, useTradeStore } from "../stores/StoreContext";
import EmptyState from "./EmptyState";
import "./QuickTrade.css";
import StockAutocomplete from "./StockAutocomplete";

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
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');
  const [tradeForm, setTradeForm] = useState({
    symbol: "",
    type: "buy" as "buy" | "sell",
    quantity: "",
  });
  const [advancedForm, setAdvancedForm] = useState({
    symbol: "",
    orderType: "market" as "market" | "limit" | "stop" | "stop-limit" | "trailing-stop",
    side: "buy" as "buy" | "sell",
    quantity: "",
    limitPrice: "",
    stopPrice: "",
    trailAmount: "",
    timeInForce: "day" as "day" | "gtc" | "ioc" | "fok",
    riskPercent: "2",
    stopLossPercent: "",
    takeProfitPercent: "",
    bracket: false,
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [portfolioId, setPortfolioId] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [portfolio, setPortfolio] = useState<any>(null);

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      );
      setPortfolio({
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

      {/* Tab Navigation */}
      <div className="trade-tabs">
        <button
          className={`tab ${activeTab === 'basic' ? 'active' : ''}`}
          onClick={() => setActiveTab('basic')}
        >
          Quick Trade
        </button>
        <button
          className={`tab ${activeTab === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveTab('advanced')}
        >
          Advanced Trading
        </button>
      </div>

      {/* Portfolio Summary */}
      {portfolio && (
        <div className="portfolio-summary">
          <div className="portfolio-stat">
            <span className="stat-label">Available Cash</span>
            <span className="stat-value">
              {formatCurrency(portfolio.currentCash)}
            </span>
          </div>
          <div className="portfolio-stat">
            <span className="stat-label">Total Value</span>
            <span className="stat-value">
              {formatCurrency(portfolio.totalValue)}
            </span>
          </div>
        </div>
      )}

      {/* Basic Trading Tab */}
      {activeTab === 'basic' && (
        <div className="basic-trading-form">
          <h2>Quick Trade</h2>
      <div className="quick-trade-form">
        <div className="trade-input-group">
          <StockAutocomplete
            stocks={stocks.map((stock) => ({
              symbol: stock.symbol,
              name: stock.name,
            }))}
            value={tradeForm.symbol}
            onChange={(symbol) => setTradeForm({ ...tradeForm, symbol })}
            placeholder="Search stock symbol or name..."
            disabled={executing}
            className="symbol-autocomplete"
          />
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
        </div>        <button
          className="execute-trade-btn"
          onClick={handleTradeSubmit}
          disabled={executing || !isValidTrade() || !portfolioId}
        >
          {executing
            ? "Executing..."
            : `${tradeForm.type.toUpperCase()} ${tradeForm.quantity || "0"} ${
                tradeForm.symbol || "Stock"              }`}
        </button>
        </div>
      </div>
      )}

      {/* Advanced Trading Tab */}
      {activeTab === 'advanced' && (
        <div className="advanced-trading-form">
          <h2>Advanced Trading</h2>
          
          {/* Stock Selection */}
          <div className="advanced-input-section">
            <label>Stock Symbol</label>
            <StockAutocomplete
              stocks={stocks.map((stock) => ({
                symbol: stock.symbol,
                name: stock.name,
              }))}
              value={advancedForm.symbol}
              onChange={(symbol) => setAdvancedForm({ ...advancedForm, symbol })}
              placeholder="Search stock symbol or name..."
              disabled={executing}
              className="symbol-autocomplete"
            />
          </div>

          {/* Order Type Selection */}
          <div className="advanced-input-section">
            <label>Order Type</label>
            <select
              value={advancedForm.orderType}
              onChange={(e) => setAdvancedForm({ ...advancedForm, orderType: e.target.value as any })}
              className="order-type-select"
            >
              <option value="market">Market Order</option>
              <option value="limit">Limit Order</option>
              <option value="stop">Stop Order</option>
              <option value="stop-limit">Stop-Limit Order</option>
              <option value="trailing-stop">Trailing Stop</option>
            </select>
          </div>

          {/* Side and Quantity */}
          <div className="advanced-input-row">
            <div className="advanced-input-section">
              <label>Side</label>
              <div className="side-buttons">
                <button
                  className={`side-btn buy ${advancedForm.side === 'buy' ? 'active' : ''}`}
                  onClick={() => setAdvancedForm({ ...advancedForm, side: 'buy' })}
                >
                  BUY
                </button>
                <button
                  className={`side-btn sell ${advancedForm.side === 'sell' ? 'active' : ''}`}
                  onClick={() => setAdvancedForm({ ...advancedForm, side: 'sell' })}
                >
                  SELL
                </button>
              </div>
            </div>
            <div className="advanced-input-section">
              <label>Quantity</label>
              <input
                type="number"
                value={advancedForm.quantity}
                onChange={(e) => setAdvancedForm({ ...advancedForm, quantity: e.target.value })}
                placeholder="Shares"
                min="1"
                max="10000"
              />
            </div>
          </div>

          {/* Price Fields (conditional based on order type) */}
          {(advancedForm.orderType === 'limit' || advancedForm.orderType === 'stop-limit') && (
            <div className="advanced-input-section">
              <label>Limit Price</label>
              <input
                type="number"
                value={advancedForm.limitPrice}
                onChange={(e) => setAdvancedForm({ ...advancedForm, limitPrice: e.target.value })}
                placeholder="$0.00"
                step="0.01"
              />
            </div>
          )}

          {(advancedForm.orderType === 'stop' || advancedForm.orderType === 'stop-limit') && (
            <div className="advanced-input-section">
              <label>Stop Price</label>
              <input
                type="number"
                value={advancedForm.stopPrice}
                onChange={(e) => setAdvancedForm({ ...advancedForm, stopPrice: e.target.value })}
                placeholder="$0.00"
                step="0.01"
              />
            </div>
          )}

          {advancedForm.orderType === 'trailing-stop' && (
            <div className="advanced-input-section">
              <label>Trail Amount ($)</label>
              <input
                type="number"
                value={advancedForm.trailAmount}
                onChange={(e) => setAdvancedForm({ ...advancedForm, trailAmount: e.target.value })}
                placeholder="$0.00"
                step="0.01"
              />
            </div>
          )}

          {/* Time in Force */}
          <div className="advanced-input-section">
            <label>Time in Force</label>
            <select
              value={advancedForm.timeInForce}
              onChange={(e) => setAdvancedForm({ ...advancedForm, timeInForce: e.target.value as any })}
            >
              <option value="day">Day</option>
              <option value="gtc">Good Till Canceled (GTC)</option>
              <option value="ioc">Immediate or Cancel (IOC)</option>
              <option value="fok">Fill or Kill (FOK)</option>
            </select>
          </div>

          {/* Risk Management */}
          <div className="risk-management-section">
            <h3>Risk Management</h3>
            
            <div className="advanced-input-row">
              <div className="advanced-input-section">
                <label>Position Size (% of Portfolio)</label>
                <input
                  type="number"
                  value={advancedForm.riskPercent}
                  onChange={(e) => setAdvancedForm({ ...advancedForm, riskPercent: e.target.value })}
                  placeholder="2"
                  min="0.1"
                  max="100"
                  step="0.1"
                />
              </div>
              <div className="advanced-input-section">
                <label>Stop Loss (%)</label>
                <input
                  type="number"
                  value={advancedForm.stopLossPercent}
                  onChange={(e) => setAdvancedForm({ ...advancedForm, stopLossPercent: e.target.value })}
                  placeholder="5"
                  min="0.1"
                  max="50"
                  step="0.1"
                />
              </div>
            </div>

            <div className="advanced-input-row">
              <div className="advanced-input-section">
                <label>Take Profit (%)</label>
                <input
                  type="number"
                  value={advancedForm.takeProfitPercent}
                  onChange={(e) => setAdvancedForm({ ...advancedForm, takeProfitPercent: e.target.value })}
                  placeholder="10"
                  min="0.1"
                  max="100"
                  step="0.1"
                />
              </div>
              <div className="advanced-input-section">
                <label>
                  <input
                    type="checkbox"
                    checked={advancedForm.bracket}
                    onChange={(e) => setAdvancedForm({ ...advancedForm, bracket: e.target.checked })}
                  />
                  Bracket Order (Stop Loss + Take Profit)
                </label>
              </div>
            </div>
          </div>

          {/* Position Sizing Calculator */}
          {advancedForm.symbol && advancedForm.riskPercent && portfolio && (
            <div className="position-calculator">
              <h4>Position Size Calculator</h4>
              <div className="calculator-results">
                <div className="calc-item">
                  <span>Recommended Position Size:</span>
                  <span>{Math.floor((portfolio.totalValue * parseFloat(advancedForm.riskPercent)) / 100 / (stocks.find(s => s.symbol === advancedForm.symbol)?.currentPrice || 1))} shares</span>
                </div>
                <div className="calc-item">
                  <span>Maximum Investment:</span>
                  <span>{formatCurrency((portfolio.totalValue * parseFloat(advancedForm.riskPercent)) / 100)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Execute Button */}
          <button
            className="execute-advanced-trade-btn"
            onClick={() => {
              addNotification({
                type: "info",
                message: "Advanced trading features are in development. Please use Quick Trade for now.",
              });
            }}
            disabled={executing}
          >
            {executing ? "Executing..." : "Execute Advanced Trade"}
          </button>
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
