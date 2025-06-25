import {
  faBolt,
  faBriefcase,
  faChartLine,
  faCircle,
  faClock,
  faExclamationTriangle,
  faPauseCircle,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { observer } from "mobx-react-lite";
import React, { useEffect } from "react";
import { Portfolio } from "../types";
import { usePortfolioStore } from "../stores/StoreContext";
import EmptyState from "./EmptyState";
import "./PortfolioSelector.css";

interface PortfolioSelectorProps {
  selectedPortfolioId?: number;
  onPortfolioSelect?: (portfolio: Portfolio) => void;
  onCreatePortfolio: () => void;
  onViewDetails?: (portfolio: Portfolio) => void;
}

const PortfolioSelector: React.FC<PortfolioSelectorProps> = observer(({
  selectedPortfolioId,
  onPortfolioSelect,
  onCreatePortfolio,
  onViewDetails,
}) => {
  const portfolioStore = usePortfolioStore();

  useEffect(() => {
    portfolioStore.fetchPortfolios();
  }, [portfolioStore]);

  // Remove the old fetchPortfolios function - using store method instead

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

  const getPortfolioTypeIcon = (portfolioType: string) => {
    switch (portfolioType) {
      case "DAY_TRADING_PRO":
        return "rocket";
      case "DAY_TRADING_STANDARD":
        return "chart-line";
      case "SMALL_ACCOUNT_BASIC":
        return "seedling";
      case "MICRO_ACCOUNT_STARTER":
        return "coins";
      default:
        return "wallet";
    }
  };

  const getPortfolioTypeLabel = (portfolioType: string) => {
    switch (portfolioType) {
      case "DAY_TRADING_PRO":
        return "Day Trading Pro";
      case "DAY_TRADING_STANDARD":
        return "Day Trading Standard";
      case "SMALL_ACCOUNT_BASIC":
        return "Small Account Basic";
      case "MICRO_ACCOUNT_STARTER":
        return "Micro Account Starter";
      default:
        return portfolioType;
    }
  };

  if (portfolioStore.isLoading) {
    return (
      <div className="portfolio-selector">
        <EmptyState
          type="loading"
          icon={<FontAwesomeIcon icon={faClock} />}
          title="Loading Portfolios"
          description="Fetching your trading portfolios..."
          size="medium"
        />
      </div>
    );
  }

  if (portfolioStore.error) {
    return (
      <div className="portfolio-selector">
        <EmptyState
          type="error"
          icon={<FontAwesomeIcon icon={faExclamationTriangle} />}
          title="Error Loading Portfolios"
          description={portfolioStore.error}
          size="medium"
          action={{
            label: "Retry",
            onClick: () => portfolioStore.fetchPortfolios(),
          }}
        />
      </div>
    );
  }

  if (portfolioStore.portfolios.length === 0) {
    return (
      <div className="portfolio-selector">
        <EmptyState
          type="no-data"
          icon={<FontAwesomeIcon icon={faBriefcase} />}
          title="No Portfolios Found"
          description="Create your first portfolio to start paper trading"
          size="medium"
          action={{
            label: "Create Portfolio",
            onClick: onCreatePortfolio,
          }}
        />
      </div>
    );
  }

  return (
    <div className="portfolio-selector">
      <div className="portfolio-selector-header">
        <h3>Your Portfolios</h3>
        <button
          className="create-portfolio-btn-small"
          onClick={onCreatePortfolio}
          title="Create a new portfolio"
        >
          <FontAwesomeIcon icon={faPlus} />
          New
        </button>
      </div>

      <div className="portfolios-grid">
        {" "}
        {portfolioStore.portfolios.map((portfolio: Portfolio) => (
          <div key={portfolio.id} className="portfolio-card">
            <div className="portfolio-card-header">
              <div className="portfolio-icon">
                <FontAwesomeIcon
                  icon={getPortfolioTypeIcon(
                    portfolio.portfolioType || "BASIC"
                  )}
                />
              </div>
              <div className="portfolio-info">
                <h4 className="portfolio-name">{portfolio.name}</h4>
                <span className="portfolio-type">
                  {getPortfolioTypeLabel(portfolio.portfolioType || "BASIC")}
                </span>
              </div>
            </div>
            <div className="portfolio-metrics">
              <div className="metric">
                <span className="metric-label">Total Value</span>
                <span className="metric-value">
                  {formatCurrency(portfolio.totalValue)}
                </span>
              </div>

              <div className="metric">
                <span className="metric-label">P&L</span>
                <span
                  className={`metric-value ${
                    portfolio.totalPnL >= 0 ? "positive" : "negative"
                  }`}
                >
                  {formatCurrency(portfolio.totalPnL)}
                </span>
              </div>

              <div className="metric">
                <span className="metric-label">Return</span>
                <span
                  className={`metric-value ${
                    portfolio.totalReturn >= 0 ? "positive" : "negative"
                  }`}
                >
                  {formatPercent(portfolio.totalReturn)}
                </span>
              </div>
            </div>{" "}
            <div className="portfolio-status">
              <div className="status-indicator">
                <FontAwesomeIcon
                  icon={portfolio.isActive ? faCircle : faPauseCircle}
                  className={portfolio.isActive ? "active" : "inactive"}
                />
                {portfolio.isActive ? "Active" : "Inactive"}
              </div>

              {portfolio.dayTradingEnabled && (
                <div className="day-trading-badge">
                  <FontAwesomeIcon icon={faBolt} />
                  Day Trading
                </div>
              )}
            </div>
            {/* Portfolio Actions */}
            <div className="portfolio-actions">
              {onViewDetails && (
                <button
                  className="details-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails(portfolio);
                  }}
                  title="View detailed portfolio performance and positions"
                >
                  <FontAwesomeIcon icon={faChartLine} />
                  View Details
                </button>
              )}{" "}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default PortfolioSelector;
