import { faChartLine, faWallet } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

interface Portfolio {
  id: number;
  currentCash: number;
  totalValue: number;
}

interface PortfolioHeaderProps {
  portfolio: Portfolio | null;
  formatCurrency: (amount: number) => string;
}

const PortfolioHeader: React.FC<PortfolioHeaderProps> = ({
  portfolio,
  formatCurrency,
}) => {
  if (!portfolio) return null;

  return (
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
  );
};

export default PortfolioHeader;
