import {
  faArrowLeft,
  faBroadcastTower,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { usePortfolioStore } from "../stores/StoreContext";
import { CreateTradeRequest, Portfolio } from "../types";
import EnhancedPortfolioAnalyticsDashboard from "./EnhancedPortfolioAnalyticsDashboard";
import OrderManagement from "./OrderManagement";
import "./Portfolio.css";
import PortfolioChart from "./PortfolioChart";
import StockAutocomplete from "./StockAutocomplete";

interface PortfolioProps {
  portfolioId: number;
  onBack: () => void;
}

const PortfolioComponent: React.FC<PortfolioProps> = observer(
  ({ portfolioId, onBack }) => {
    const portfolioStore = usePortfolioStore();
    const {
      stocks,
      subscribeToPortfolio,
      unsubscribeFromPortfolio,
      portfolioUpdates,
      getPortfolioPerformance,
      getPositionDetails,
    } = useSocket();
    const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
    const [enhancedPerformance, setEnhancedPerformance] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [tradeForm, setTradeForm] = useState({
      symbol: "",
      type: "buy" as "buy" | "sell",
      quantity: "",
    });
    const [showTradeForm, setShowTradeForm] = useState(false);
    const [executing, setExecuting] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState<any>(null);
    const [positionDetails, setPositionDetails] = useState<any>(null);

    useEffect(() => {
      fetchPortfolio();
      fetchEnhancedPerformance();
      // Subscribe to real-time portfolio updates
      subscribeToPortfolio(portfolioId);

      return () => {
        // Unsubscribe when component unmounts
        unsubscribeFromPortfolio(portfolioId);
      };
    }, [portfolioId, subscribeToPortfolio, unsubscribeFromPortfolio]);
    // Update portfolio with real-time data when available
    useEffect(() => {
      const portfolioUpdate = portfolioUpdates.get(portfolioId);
      if (portfolioUpdate && portfolio) {
        // Enhanced real-time update with more detailed data
        setEnhancedPerformance(portfolioUpdate);
        setPortfolio((prev) =>
          prev
            ? {
                ...prev,
                totalValue: portfolioUpdate.totalValue || prev.totalValue,
                totalPnL: portfolioUpdate.totalPnL || prev.totalPnL,
                totalReturn: portfolioUpdate.totalReturn || prev.totalReturn,
                currentCash: portfolioUpdate.currentCash || prev.currentCash,
                // Convert EnhancedPosition to Position for compatibility
                positions:
                  portfolioUpdate.positions?.map((pos) => ({
                    id:
                      prev.positions?.find((p) => p.symbol === pos.symbol)
                        ?.id || 0,
                    portfolioId: portfolioId,
                    stockId:
                      prev.positions?.find((p) => p.symbol === pos.symbol)
                        ?.stockId || 0,
                    symbol: pos.symbol,
                    quantity: pos.quantity,
                    averagePrice: pos.averagePrice,
                    totalCost: pos.totalCost,
                    currentValue: pos.currentValue,
                    unrealizedPnL: pos.unrealizedPnL,
                    unrealizedReturn: pos.unrealizedReturn,
                    createdAt:
                      prev.positions?.find((p) => p.symbol === pos.symbol)
                        ?.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  })) || prev.positions,
              }
            : prev
        );
      }
    }, [portfolioUpdates, portfolioId, portfolio]);

    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        const data = await portfolioStore.fetchPortfolioById(portfolioId);
        setPortfolio(data);
      } catch (error) {
        console.error("Error fetching portfolio:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchEnhancedPerformance = async () => {
      try {
        const performanceData = await getPortfolioPerformance(portfolioId);
        setEnhancedPerformance(performanceData);
        console.log(
          "📊 Enhanced portfolio performance loaded:",
          performanceData
        );
      } catch (error) {
        console.error("Error fetching enhanced performance:", error);
      }
    };

    const handlePositionClick = async (symbol: string) => {
      try {
        setSelectedPosition(symbol);
        const details = await getPositionDetails(portfolioId, symbol);
        setPositionDetails(details);
        console.log(`📈 Position details for ${symbol}:`, details);
      } catch (error) {
        console.error(`Error fetching position details for ${symbol}:`, error);
      }
    };

    const closePositionDetails = () => {
      setSelectedPosition(null);
      setPositionDetails(null);
    };

    const executeTrade = async () => {
      try {
        setExecuting(true);
        const tradeData: CreateTradeRequest = {
          portfolioId,
          symbol: tradeForm.symbol.toUpperCase(),
          type: tradeForm.type,
          quantity: parseInt(tradeForm.quantity),
        };

        await portfolioStore.executeTrade(tradeData);

        // Reset form and refresh portfolio
        setTradeForm({ symbol: "", type: "buy", quantity: "" });
        setShowTradeForm(false);
        await fetchPortfolio();
      } catch (error: any) {
        console.error("Error executing trade:", error);
        window.alert(error.response?.data?.message || "Error executing trade");
      } finally {
        setExecuting(false);
      }
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    };

    const formatPercent = (percent: number) => {
      return `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%`;
    };

    if (loading) {
      return (
        <div className="portfolio-loading">
          <div className="loading-spinner"></div>
          <p>Loading portfolio...</p>
        </div>
      );
    }

    if (!portfolio) {
      return (
        <div className="portfolio-error">
          <p>Portfolio not found</p>
          <button onClick={onBack}>Back to Portfolios</button>
        </div>
      );
    }

    return (
      <div className="portfolio-container">
        {" "}
        <div className="portfolio-header">
          <button className="back-button" onClick={onBack}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Portfolios
          </button>
          <div className="header-content">
            <h1>{portfolio.name}</h1>
            {portfolioUpdates.get(portfolioId) && (
              <span className="real-time-indicator">
                <FontAwesomeIcon icon={faBroadcastTower} className="pulse" />
                Live
              </span>
            )}
          </div>
          <button
            className="trade-button"
            onClick={() => setShowTradeForm(true)}
          >
            New Trade
          </button>
        </div>
        <div className="portfolio-summary">
          <div className="summary-card">
            <h3>Portfolio Value</h3>
            <div className="value">{formatCurrency(portfolio.totalValue)}</div>
          </div>
          <div className="summary-card">
            <h3>Cash</h3>
            <div className="value">{formatCurrency(portfolio.currentCash)}</div>
          </div>
          <div className="summary-card">
            <h3>Total P&L</h3>
            <div
              className={`value ${
                portfolio.totalPnL >= 0 ? "positive" : "negative"
              }`}
            >
              {formatCurrency(portfolio.totalPnL)}
            </div>
          </div>
          <div className="summary-card">
            <h3>Total Return</h3>
            <div
              className={`value ${
                portfolio.totalReturn >= 0 ? "positive" : "negative"
              }`}
            >
              {formatPercent(portfolio.totalReturn)}
            </div>
          </div>
          <div className="summary-card">
            <h3>Day P&L</h3>
            <div
              className={`value ${
                (portfolioUpdates.get(portfolioId)?.dayGain || 0) >= 0
                  ? "positive"
                  : "negative"
              }`}
            >
              {formatCurrency(portfolioUpdates.get(portfolioId)?.dayGain || 0)}
              <span className="percentage">
                {formatPercent(
                  portfolioUpdates.get(portfolioId)?.dayGainPercent || 0
                )}
              </span>
            </div>
          </div>
        </div>
        {/* Portfolio Performance Chart */}
        <div className="portfolio-chart-section">
          <h2>Portfolio Performance</h2>
          <PortfolioChart portfolioId={portfolioId} height={350} />
        </div>
        <div className="portfolio-content">
          <div className="positions-section">
            <h2>Positions</h2>
            {portfolio.positions && portfolio.positions.length > 0 ? (
              <div className="positions-grid">
                {portfolio.positions.map((position) => (
                  <div key={position.id} className="position-card">
                    <div className="position-header">
                      <h3>{position.symbol}</h3>
                      <span className="quantity">
                        {position.quantity} shares
                      </span>
                    </div>
                    <div className="position-details">
                      <div className="detail-row">
                        <span>Avg Price:</span>
                        <span>{formatCurrency(position.averagePrice)}</span>
                      </div>
                      <div className="detail-row">
                        <span>Current Value:</span>
                        <span>{formatCurrency(position.currentValue)}</span>
                      </div>
                      <div className="detail-row">
                        <span>P&L:</span>
                        <span
                          className={
                            position.unrealizedPnL >= 0
                              ? "positive"
                              : "negative"
                          }
                        >
                          {formatCurrency(position.unrealizedPnL)}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span>Return:</span>
                        <span
                          className={
                            position.unrealizedReturn >= 0
                              ? "positive"
                              : "negative"
                          }
                        >
                          {formatPercent(position.unrealizedReturn)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-positions">
                No positions yet. Start trading to see your positions here.
              </p>
            )}
          </div>
          <div className="trades-section">
            <h2>Recent Trades</h2>
            {portfolio.trades && portfolio.trades.length > 0 ? (
              <div className="trades-list">
                {portfolio.trades.slice(0, 10).map((trade) => (
                  <div key={trade.id} className="trade-item">
                    <div className="trade-info">
                      <span className={`trade-type ${trade.type}`}>
                        {trade.type.toUpperCase()}
                      </span>
                      <span className="trade-symbol">{trade.symbol}</span>
                      <span className="trade-quantity">
                        {trade.quantity} shares
                      </span>
                      <span className="trade-price">
                        @ {formatCurrency(trade.price)}
                      </span>
                    </div>
                    <div className="trade-meta">
                      <span className="trade-total">
                        {formatCurrency(trade.totalValue)}
                      </span>
                      <span className="trade-date">
                        {new Date(trade.executedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-trades">
                No trades yet. Execute your first trade to get started.
              </p>
            )}
          </div>{" "}
          {/* Portfolio Analytics Dashboard */}
          <div className="analytics-section">
            <h2>Portfolio Analytics</h2>
            <EnhancedPortfolioAnalyticsDashboard portfolioId={portfolioId} />
          </div>
          {/* Order Management Section */}
          <div className="order-management-section">
            <OrderManagement
              portfolios={portfolio ? [portfolio] : []}
              selectedPortfolioId={portfolioId}
            />
          </div>
        </div>
        {showTradeForm && (
          <div className="trade-modal">
            <div className="trade-modal-content">
              <div className="trade-modal-header">
                <h2>New Trade</h2>
                <button
                  className="close-button"
                  onClick={() => setShowTradeForm(false)}
                >
                  ×
                </button>
              </div>{" "}
              <div className="trade-form">
                <div className="form-group">
                  <label>Symbol:</label>
                  <StockAutocomplete
                    stocks={stocks.map((stock) => ({
                      symbol: stock.symbol,
                      name: stock.name,
                    }))}
                    value={tradeForm.symbol}
                    onChange={(symbol) =>
                      setTradeForm({ ...tradeForm, symbol })
                    }
                    placeholder="Search stock symbol or name..."
                    disabled={executing}
                    className="symbol-autocomplete"
                  />
                </div>
                <div className="form-group">
                  <label>Type:</label>
                  <select
                    value={tradeForm.type}
                    onChange={(e) =>
                      setTradeForm({
                        ...tradeForm,
                        type: e.target.value as "buy" | "sell",
                      })
                    }
                  >
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity:</label>
                  <input
                    type="number"
                    value={tradeForm.quantity}
                    onChange={(e) =>
                      setTradeForm({ ...tradeForm, quantity: e.target.value })
                    }
                    min="1"
                    placeholder="Number of shares"
                  />
                </div>
                <div className="form-actions">
                  <button
                    className="cancel-button"
                    onClick={() => setShowTradeForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="execute-button"
                    onClick={executeTrade}
                    disabled={
                      executing || !tradeForm.symbol || !tradeForm.quantity
                    }
                  >
                    {executing
                      ? "Executing..."
                      : `${tradeForm.type.toUpperCase()} ${
                          tradeForm.quantity
                        } ${tradeForm.symbol}`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default PortfolioComponent;
