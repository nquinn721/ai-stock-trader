import { observer } from "mobx-react-lite";
import React from "react";
import AutonomousAgentDashboard from "../components/autonomous-trading/AutonomousAgentDashboard";
import "./AutonomousTradingPage.css";

const AutonomousTradingPage: React.FC = observer(() => {
  return (
    <div className="autonomous-trading-page">
      <div className="page-header">
        <h1>Autonomous Trading Agents</h1>
        <p>
          AI-powered trading agents that learn and adapt to market conditions
        </p>
      </div>
      <AutonomousAgentDashboard />
    </div>
  );
});

export default AutonomousTradingPage;
