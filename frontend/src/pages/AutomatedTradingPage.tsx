import { observer } from "mobx-react-lite";
import React from "react";
import AutoTradingDashboard from "../components/automated-trading/AutoTradingDashboard";

const AutomatedTradingPage: React.FC = observer(() => {
  return <AutoTradingDashboard />;
});

export default AutomatedTradingPage;
