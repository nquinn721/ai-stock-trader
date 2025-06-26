import { observer } from "mobx-react-lite";
import React from "react";
import AutoTradingDashboard from "../components/automated-trading/AutoTradingDashboard";
import { usePortfolioStore } from "../stores/StoreContext";
import "./AutoTradingPage.css";

const AutoTradingPage: React.FC = observer(() => {
  const portfolioStore = usePortfolioStore();

  return (
    <div className="auto-trading-page">
      <div className="page-header">
        <h1>Automated Trading</h1>
        <p>Configure and monitor your automated trading strategies</p>
      </div>
      <AutoTradingDashboard portfolios={portfolioStore.portfolios} />
    </div>
  );
});

export default AutoTradingPage;
