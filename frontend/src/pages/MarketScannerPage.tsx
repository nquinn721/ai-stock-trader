import { AutoMode, Chat, Dashboard } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import React from "react";
import { useNavigate } from "react-router-dom";
import { MarketScannerDashboard } from "../components/MarketScanner/MarketScannerDashboard";
import PageHeader from "../components/ui/PageHeader";
import { useWebSocketConnection } from "../hooks/useWebSocketConnection";
import { useWebSocketStore } from "../stores/StoreContext";
import "./MarketScannerPage.css";

const MarketScannerPage: React.FC = observer(() => {
  const webSocketStore = useWebSocketStore();
  const navigate = useNavigate();

  // Ensure WebSocket connection is established
  useWebSocketConnection();

  const handleStockSelect = (symbol: string) => {
    console.log("Stock selected:", symbol);
    // TODO: Navigate to stock details or add to watchlist
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Market Scanner"
        showLiveIndicator={true}
        isConnected={webSocketStore.isConnected}
        sticky={true}
        statsValue="Live Market Data"
        actionButtons={[
          {
            icon: <Dashboard />,
            onClick: () => navigate("/dashboard"),
            tooltip: "Trading Dashboard",
            label: "Dashboard",
          },
          {
            icon: <AutoMode />,
            onClick: () => navigate("/autonomous-trading"),
            tooltip: "Autonomous Trading",
            label: "Auto Trade",
          },
          {
            icon: <Chat />,
            onClick: () => navigate("/ai-assistant"),
            tooltip: "AI Trading Assistant",
            label: "AI Chat",
          },
        ]}
      />
      <div className="page-content">
        <MarketScannerDashboard onStockSelect={handleStockSelect} />
      </div>
    </div>
  );
});

export default MarketScannerPage;
