import React from "react";
import { MarketScannerDashboard } from "../components/MarketScanner/MarketScannerDashboard";

const MarketScannerPage: React.FC = () => {
  const handleStockSelect = (symbol: string) => {
    console.log("Stock selected:", symbol);
    // TODO: Navigate to stock details or add to watchlist
  };

  return <MarketScannerDashboard onStockSelect={handleStockSelect} />;
};

export default MarketScannerPage;
