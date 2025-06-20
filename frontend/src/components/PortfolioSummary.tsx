import axios from "axios";
import React, { useEffect, useState } from "react";
import { Portfolio } from "../types";
import "./PortfolioSummary.css";

const PortfolioSummary: React.FC = () => {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTestPortfolio();

    // Listen for portfolio updates from QuickTrade
    const handlePortfolioUpdate = () => {
      fetchTestPortfolio();
    };

    window.addEventListener("portfolio-updated", handlePortfolioUpdate);

    return () => {
      window.removeEventListener("portfolio-updated", handlePortfolioUpdate);
    };
  }, []);

  const fetchTestPortfolio = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching portfolios...");
      const response = await axios.get(
        "http://localhost:8000/paper-trading/portfolios",
        { timeout: 10000 } // 10 second timeout
      );
      const portfolios = response.data;
      console.log("Portfolios received:", portfolios);

      if (portfolios.length > 0) {
        // Get the first portfolio or create one if none exists
        const testPortfolio = portfolios[0];
        console.log("Fetching portfolio details for:", testPortfolio.id);
        const detailResponse = await axios.get(
          `http://localhost:8000/paper-trading/portfolios/${testPortfolio.id}`,
          { timeout: 10000 }
        );
        console.log("Portfolio details received:", detailResponse.data);
        setPortfolio(detailResponse.data);
      } else {
        // Create a default test portfolio
        console.log("Creating new portfolio...");
        const createResponse = await axios.post(
          "http://localhost:8000/paper-trading/portfolios",
          {
            name: "Test Portfolio",
            initialCash: 100000,
          },
          { timeout: 10000 }
        );
        console.log("New portfolio created:", createResponse.data);
        setPortfolio(createResponse.data);
      }
    } catch (error) {
      console.error("Error fetching test portfolio:", error);
      setError(
        `Failed to load portfolio: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    const numValue = Number(amount) || 0;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numValue);
  };

  const formatPercent = (percent: number | string | null | undefined) => {
    const numValue = Number(percent) || 0;
    return `${numValue >= 0 ? "+" : ""}${numValue.toFixed(2)}%`;
  };
  if (loading) {
    return (
      <div className="portfolio-summary-loading">
        <div className="loading-spinner"></div>
        <p>Loading portfolio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="portfolio-summary-error">
        <p>{error}</p>
        <button
          onClick={() => fetchTestPortfolio()}
          style={{
            marginTop: "10px",
            padding: "8px 16px",
            backgroundColor: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="portfolio-summary-error">
        <p>No portfolio data available</p>
        <button
          onClick={() => fetchTestPortfolio()}
          style={{
            marginTop: "10px",
            padding: "8px 16px",
            backgroundColor: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Load Portfolio
        </button>
      </div>
    );
  }

  return (
    <div className="portfolio-summary-container">
      <h2>Paper Trading Portfolio</h2>
      <div className="portfolio-summary-stats">
        <div className="summary-stat">
          <span className="stat-label">Portfolio Value</span>
          <span className="stat-value">
            {formatCurrency(portfolio.totalValue)}
          </span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">Cash</span>
          <span className="stat-value">
            {formatCurrency(portfolio.currentCash)}
          </span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">P&L</span>
          <span
            className={`stat-value ${
              Number(portfolio.totalPnL) >= 0 ? "positive" : "negative"
            }`}
          >
            {formatCurrency(portfolio.totalPnL)}
          </span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">Return</span>
          <span
            className={`stat-value ${
              Number(portfolio.totalReturn) >= 0 ? "positive" : "negative"
            }`}
          >
            {formatPercent(portfolio.totalReturn)}
          </span>
        </div>
      </div>{" "}
      {portfolio.positions && portfolio.positions.length > 0 && (
        <div className="portfolio-positions">
          <h3>Current Holdings ({portfolio.positions.length} positions)</h3>
          <div className="positions-list">
            {portfolio.positions.map((position) => (
              <div key={position.id} className="position-item">
                <div className="position-main">
                  <span className="position-symbol">{position.symbol}</span>
                  <span className="position-quantity">
                    {position.quantity} shares
                  </span>
                </div>
                <div className="position-details">
                  <span className="position-avg-price">
                    Avg: {formatCurrency(position.averagePrice)}
                  </span>
                  <span
                    className={`position-pnl ${
                      Number(position.unrealizedPnL) >= 0
                        ? "positive"
                        : "negative"
                    }`}
                  >
                    {formatCurrency(position.unrealizedPnL)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {portfolio.trades && portfolio.trades.length > 0 && (
        <div className="portfolio-history">
          <h3>Recent Trades ({portfolio.trades.length} total)</h3>
          <div className="trades-list">
            {portfolio.trades
              .slice()
              .reverse()
              .slice(0, 5)
              .map((trade) => (
                <div key={trade.id} className="trade-item">
                  <div className="trade-main">
                    <span className={`trade-type ${trade.type}`}>
                      {trade.type.toUpperCase()}
                    </span>
                    <span className="trade-symbol">{trade.symbol}</span>
                    <span className="trade-quantity">{trade.quantity}</span>
                  </div>
                  <div className="trade-details">
                    <span className="trade-price">
                      @ {formatCurrency(trade.price)}
                    </span>
                    <span className="trade-date">
                      {new Date(trade.executedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PortfolioSummary;
