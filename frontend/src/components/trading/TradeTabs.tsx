import { faCogs, faZap } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";

interface TradeTabsProps {
  activeTab: "basic" | "advanced";
  onTabChange: (tab: "basic" | "advanced") => void;
}

const TradeTabs: React.FC<TradeTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="trade-tabs">
      <button
        className={`tab ${activeTab === "basic" ? "active" : ""}`}
        onClick={() => onTabChange("basic")}
      >
        <FontAwesomeIcon icon={faZap} />
        Quick
      </button>
      <button
        className={`tab ${activeTab === "advanced" ? "active" : ""}`}
        onClick={() => onTabChange("advanced")}
      >
        <FontAwesomeIcon icon={faCogs} />
        Advanced
      </button>
    </div>
  );
};

export default TradeTabs;
