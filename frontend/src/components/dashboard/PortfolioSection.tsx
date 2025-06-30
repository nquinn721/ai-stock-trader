import React from "react";
import { Portfolio } from "../../types";

interface PortfolioSectionProps {
  portfolio: Portfolio | null;
  isLoading: boolean;
  onCreatePortfolio: () => void;
  onViewDetails: (portfolio: Portfolio) => void;
  onSelectPortfolio: (portfolio: Portfolio) => void;
  showCreator: boolean;
  showDetails: boolean;
}

/**
 * PortfolioSection - Manages portfolio display and actions
 */
const PortfolioSection: React.FC<PortfolioSectionProps> = ({
  portfolio,
  isLoading,
  onCreatePortfolio,
  onViewDetails,
  onSelectPortfolio,
  showCreator,
  showDetails,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="portfolio-section loading">
        <div className="loading-spinner"></div>
        <span>Loading portfolio...</span>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="portfolio-section empty">
        <div className="empty-portfolio">
          <h3>No Portfolio Found</h3>
          <p>Create your first portfolio to start trading</p>
          <button className="create-portfolio-btn" onClick={onCreatePortfolio}>
            Create Portfolio
          </button>
        </div>
      </div>
    );
  }

  const totalValue = portfolio.totalValue || 0;
  const currentCash = portfolio.currentCash || 0;
  const totalReturn = totalValue - (portfolio.initialCash || 0);
  const returnPercent = portfolio.initialCash
    ? (totalReturn / portfolio.initialCash) * 100
    : 0;

  return (
    <div className="portfolio-section">
      <div className="portfolio-header">
        <h3>Portfolio Overview</h3>
        <div className="portfolio-actions">
          <button
            className="view-details-btn"
            onClick={() => onViewDetails(portfolio)}
          >
            View Details
          </button>
          <button
            className="create-portfolio-btn secondary"
            onClick={onCreatePortfolio}
          >
            + New Portfolio
          </button>
        </div>
      </div>

      <div className="portfolio-summary">
        <div className="portfolio-card">
          <div className="portfolio-identity">
            <h4>{portfolio.name}</h4>
            <span className="portfolio-id">ID: {portfolio.id}</span>
          </div>

          <div className="portfolio-metrics">
            <div className="metric-row">
              <div className="metric">
                <span className="metric-label">Total Value</span>
                <span className="metric-value primary">
                  {formatCurrency(totalValue)}
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">Cash Available</span>
                <span className="metric-value">
                  {formatCurrency(currentCash)}
                </span>
              </div>
            </div>

            <div className="metric-row">
              <div className="metric">
                <span className="metric-label">Total Return</span>
                <span
                  className={`metric-value ${totalReturn >= 0 ? "positive" : "negative"}`}
                >
                  {formatCurrency(totalReturn)}
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">Return %</span>
                <span
                  className={`metric-value ${returnPercent >= 0 ? "positive" : "negative"}`}
                >
                  {returnPercent >= 0 ? "+" : ""}
                  {returnPercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <div className="portfolio-progress">
            <div className="progress-label">
              <span>Portfolio Performance</span>
              <span className={returnPercent >= 0 ? "positive" : "negative"}>
                {returnPercent >= 0 ? "+" : ""}
                {returnPercent.toFixed(2)}%
              </span>
            </div>
            <div className="progress-bar">
              <div
                className={`progress-fill ${returnPercent >= 0 ? "positive" : "negative"}`}
                style={{ width: `${Math.min(Math.abs(returnPercent), 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioSection;
