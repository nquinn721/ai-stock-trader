import React from "react";
import { MarketScannerDashboard } from "../components/MarketScanner/MarketScannerDashboard";
import "./MarketScannerPage.css";

const MarketScannerPage: React.FC = () => {
  const handleStockSelect = (symbol: string) => {
    console.log("Stock selected:", symbol);
    // TODO: Navigate to stock details or add to watchlist
  };

  return (
    <div className="market-scanner-page">
      <MarketScannerDashboard onStockSelect={handleStockSelect} />
    </div>
  );
};

export default MarketScannerPage;
