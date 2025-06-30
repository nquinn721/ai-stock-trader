import { faBolt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { observer } from "mobx-react-lite";
import React from "react";
import "./QuickTrade.css";
import QuickTradeContent from "./QuickTradeContent";

/**
 * QuickTrade - A standalone wrapper component with container styling
 * Use this when you need QuickTrade as a standalone card with its own container
 * For embedding in existing containers, use QuickTradeContent directly
 */
const QuickTrade: React.FC = observer(() => {
  return (
    <div className="dashboard-card quick-trade-card">
      <div className="card-header">
        <div className="card-title">
          <FontAwesomeIcon icon={faBolt} className="card-title-icon" />
          Quick Trade
        </div>
        <div className="status-indicator connected"></div>
      </div>
      <QuickTradeContent />
    </div>
  );
});

export default QuickTrade;
