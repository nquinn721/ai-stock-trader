import { observer } from "mobx-react-lite";
import React from "react";
import { MarketScannerDashboard } from "../components/MarketScanner/MarketScannerDashboard";
import PageHeader from "../components/ui/PageHeader";
import { useWebSocketConnection } from "../hooks/useWebSocketConnection";
import { useWebSocketStore } from "../stores/StoreContext";
import "./MarketScannerPage.css";

const MarketScannerPage: React.FC = observer(() => {
  const webSocketStore = useWebSocketStore();

  // Ensure WebSocket connection is established
  useWebSocketConnection();

  const handleStockSelect = (symbol: string) => {
    console.log("Stock selected:", symbol);
    // TODO: Navigate to stock details or add to watchlist
  };

  return (
    <div className="market-scanner-page">
      <PageHeader
        title="Market Scanner"
        showLiveIndicator={true}
        isConnected={webSocketStore.isConnected}
        sticky={true}
      />
      <MarketScannerDashboard onStockSelect={handleStockSelect} />
    </div>
  );
});

export default MarketScannerPage;
