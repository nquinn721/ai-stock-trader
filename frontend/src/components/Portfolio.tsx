import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { CreateTradeRequest, Portfolio } from "../types";
import "./Portfolio.css";
import PortfolioChart from "./PortfolioChart";
import StockAutocomplete from "./StockAutocomplete";

interface PortfolioProps {
  portfolioId: number;
  onBack: () => void;
}

const PortfolioComponent: React.FC<PortfolioProps> = ({
  portfolioId,
  onBack,
}) => {
  const { stocks } = useSocket();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [tradeForm, setTradeForm] = useState({
    symbol: "",
    type: "buy" as "buy" | "sell",
    quantity: "",
  });
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    fetchPortfolio();
  }, [portfolioId]);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `http://localhost:8000/paper-trading/portfolios/${portfolioId}`
      );
      setPortfolio(response.data);
    } catch (error) {
      console.error("Error fetching portfolio:", error);
    } finally {
      setLoading(false);
    }
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

      await axios.post("http://localhost:8000/paper-trading/trade", tradeData);

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
      <div className="portfolio-header">
        {" "}
        <button className="back-button" onClick={onBack}>
          <FontAwesomeIcon icon="arrow-left" /> Back to Portfolios
        </button>
        <h1>{portfolio.name}</h1>
        <button className="trade-button" onClick={() => setShowTradeForm(true)}>
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
          </div>{" "}
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
                    <span className="quantity">{position.quantity} shares</span>
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
                          position.unrealizedPnL >= 0 ? "positive" : "negative"
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
                  onChange={(symbol) => setTradeForm({ ...tradeForm, symbol })}
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
                    : `${tradeForm.type.toUpperCase()} ${tradeForm.quantity} ${
                        tradeForm.symbol
                      }`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioComponent;
