import { observer } from "mobx-react-lite";
import React from "react";
import CleanAutonomousAgentDashboard from "../components/autonomous-trading/CleanAutonomousAgentDashboard";
import "./AutonomousTradingPage.css";
import "./AutonomousTradingPageTextFix.css";

const AutonomousTradingPage: React.FC = observer(() => {
  return (
    <div className="autonomous-trading-page">
      <CleanAutonomousAgentDashboard />
    </div>
  );
});

export default AutonomousTradingPage;
