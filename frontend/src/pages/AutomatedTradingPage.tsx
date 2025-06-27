import { observer } from "mobx-react-lite";
import React from "react";
import AutoTradingDashboard from "../components/automated-trading/AutoTradingDashboard";
import "./AutomatedTradingPage.css";

const AutomatedTradingPage: React.FC = observer(() => {
  return (
    <div className="automated-trading-page">
      <AutoTradingDashboard />
    </div>
  );
});

export default AutomatedTradingPage;
