import { observer } from "mobx-react-lite";
import React from "react";
import EnhancedPortfolioAnalyticsDashboard from "../components/EnhancedPortfolioAnalyticsDashboard";
import { usePortfolioStore } from "../stores/StoreContext";
import "./AnalyticsPage.css";

const AnalyticsPage: React.FC = observer(() => {
  const portfolioStore = usePortfolioStore();

  if (!portfolioStore.currentPortfolio) {
    return (
      <div className="analytics-page">
        <div className="page-header">
          <h1>Portfolio Analytics</h1>
          <p>Advanced analytics and insights for your portfolios</p>
        </div>
        <div className="no-portfolio-message">
          <h3>No Portfolio Selected</h3>
          <p>Please select a portfolio from the dashboard to view analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>Portfolio Analytics</h1>
        <p>Advanced analytics and insights for your portfolios</p>
      </div>
      <EnhancedPortfolioAnalyticsDashboard
        portfolioId={portfolioStore.currentPortfolio.id}
      />
    </div>
  );
});

export default AnalyticsPage;
