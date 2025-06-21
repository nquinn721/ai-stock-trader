import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";
import { usePortfolioStore } from "../stores/StoreContext";
import "./PortfolioSummary.css";

const PortfolioSummary: React.FC = observer(() => {
  const portfolioStore = usePortfolioStore();

  useEffect(() => {
    // Fetch portfolio for test user (ID: 1)
    portfolioStore.fetchPortfolio(1);

    // Listen for portfolio updates from QuickTrade
    const handlePortfolioUpdate = () => {
      portfolioStore.fetchPortfolio(1);
    };

    window.addEventListener("portfolio-updated", handlePortfolioUpdate);

    return () => {
      window.removeEventListener("portfolio-updated", handlePortfolioUpdate);
    };
  }, [portfolioStore]);

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

  if (portfolioStore.isLoading) {
    return (
      <div className="portfolio-summary-loading">
        <div className="loading-spinner"></div>
        <p>Loading portfolio...</p>
      </div>
    );
  }

  if (portfolioStore.error) {
    return (
      <div className="portfolio-summary-error">
        <p>{portfolioStore.error}</p>
        <button
          onClick={() => portfolioStore.fetchPortfolio(1)}
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

  if (!portfolioStore.portfolio) {
    return (
      <div className="portfolio-summary-error">
        <p>No portfolio data available</p>
        <button
          onClick={() => portfolioStore.fetchPortfolio(1)}
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

  const { portfolio } = portfolioStore;

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
            {formatCurrency(portfolio.totalCash)}
          </span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">Day Change</span>
          <span
            className={`stat-value ${
              portfolioStore.isPositive ? "positive" : "negative"
            }`}
          >
            {formatCurrency(portfolio.dayChange)}
          </span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">Return</span>
          <span
            className={`stat-value ${
              portfolioStore.totalReturn >= 0 ? "positive" : "negative"
            }`}
          >
            {formatPercent(portfolio.totalReturnPercent)}
          </span>
        </div>
      </div>

      {portfolioStore.positions && portfolioStore.positions.length > 0 && (
        <div className="portfolio-positions">
          <h3>
            Current Holdings ({portfolioStore.positions.length} positions)
          </h3>
          <div className="positions-list">
            {portfolioStore.topPositions.map((position) => (
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
                      Number(position.unrealizedPnl) >= 0
                        ? "positive"
                        : "negative"
                    }`}
                  >
                    {formatCurrency(position.unrealizedPnl)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default PortfolioSummary;
