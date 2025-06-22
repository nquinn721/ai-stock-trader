import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";
import { usePortfolioStore } from "../stores/StoreContext";
import EmptyState from "./EmptyState";
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
      <EmptyState
        icon="⏳"
        title="Loading Portfolio"
        description="Fetching your portfolio data..."
        type="loading"
      />
    );
  }
  if (portfolioStore.error) {
    return (
      <EmptyState
        title="Portfolio Error"
        description={portfolioStore.error}
        type="error"
        size="medium"
        action={{
          label: "Retry",
          onClick: () => portfolioStore.fetchPortfolio(1),
          variant: "primary",
        }}
      />
    );
  }
  if (!portfolioStore.portfolio) {
    return (
      <EmptyState
        title="No Portfolio Data"
        description="Portfolio information is not available at the moment."
        type="portfolio"
        size="medium"
        action={{
          label: "Load Portfolio",
          onClick: () => portfolioStore.fetchPortfolio(1),
          variant: "primary",
        }}
      />
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
        </div>{" "}
        <div className="summary-stat">
          <span className="stat-label">Cash</span>
          <span className="stat-value">
            {formatCurrency(portfolio.currentCash)}
          </span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">Day Change</span>
          <span
            className={`stat-value ${
              portfolioStore.isPositive ? "positive" : "negative"
            }`}
          >
            {formatCurrency(portfolioStore.dayChange)}
          </span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">Return</span>
          <span
            className={`stat-value ${
              portfolioStore.totalReturn >= 0 ? "positive" : "negative"
            }`}
          >
            {formatPercent(portfolioStore.totalReturnPercent)}
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
