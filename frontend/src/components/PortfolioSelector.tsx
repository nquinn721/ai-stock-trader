import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Portfolio } from "../types";
import EmptyState from "./EmptyState";
import "./PortfolioSelector.css";

interface PortfolioSelectorProps {
  selectedPortfolioId?: number;
  onPortfolioSelect: (portfolio: Portfolio) => void;
  onCreatePortfolio: () => void;
  onViewDetails?: (portfolio: Portfolio) => void;
}

const PortfolioSelector: React.FC<PortfolioSelectorProps> = ({
  selectedPortfolioId,
  onPortfolioSelect,
  onCreatePortfolio,
  onViewDetails,
}) => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPortfolios();
  }, []);

  const fetchPortfolios = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        "http://localhost:8000/paper-trading/portfolios"
      );
      setPortfolios(response.data);
    } catch (err) {
      console.error("Error fetching portfolios:", err);
      setError("Failed to load portfolios");
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

  if (loading) {
    return (
      <div className="portfolio-selector">
        <EmptyState
          type="loading"
          icon={<FontAwesomeIcon icon="clock" />}
          title="Loading Portfolios"
          description="Fetching your trading portfolios..."
          size="medium"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="portfolio-selector">
        <EmptyState
          type="error"
          icon={<FontAwesomeIcon icon="exclamation-triangle" />}
          title="Error Loading Portfolios"
          description={error}
          size="medium"
          action={{
            label: "Retry",
            onClick: fetchPortfolios,
          }}
        />
      </div>
    );
  }

  if (portfolios.length === 0) {
    return (
      <div className="portfolio-selector">
        <EmptyState
          type="no-data"
          icon={<FontAwesomeIcon icon="briefcase" />}
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
          <FontAwesomeIcon icon="plus" />
          New
        </button>
      </div>

      <div className="portfolios-grid">
        {portfolios.map((portfolio) => (
          <div
            key={portfolio.id}
            className={`portfolio-card ${
              selectedPortfolioId === portfolio.id ? "selected" : ""
            }`}
            onClick={() => onPortfolioSelect(portfolio)}
          >
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
            </div>            <div className="portfolio-status">
              <div className="status-indicator">
                <FontAwesomeIcon
                  icon={portfolio.isActive ? "circle" : "pause-circle"}
                  className={portfolio.isActive ? "active" : "inactive"}
                />
                {portfolio.isActive ? "Active" : "Inactive"}
              </div>

              {portfolio.dayTradingEnabled && (
                <div className="day-trading-badge">
                  <FontAwesomeIcon icon="bolt" />
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
                  <FontAwesomeIcon icon="chart-line" />
                  View Details
                </button>
              )}
            </div>

            {selectedPortfolioId === portfolio.id && (
              <div className="selected-indicator">
                <FontAwesomeIcon icon="check-circle" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortfolioSelector;
