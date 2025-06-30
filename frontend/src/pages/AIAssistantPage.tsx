import { Psychology } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import React from "react";
import TradingAssistantChat from "../components/TradingAssistantChat";
import PageHeader from "../components/ui/PageHeader";
import { useWebSocketConnection } from "../hooks/useWebSocketConnection";
import { useWebSocketStore } from "../stores/StoreContext";
import "./AIAssistantPage.css";

const AIAssistantPage: React.FC = observer(() => {
  const webSocketStore = useWebSocketStore();

  // Ensure WebSocket connection is established
  useWebSocketConnection();

  const actionButtons = [
    {
      icon: <Psychology />,
      onClick: () => {
        // TODO: Add AI insights functionality
        console.log("AI insights clicked");
      },
      tooltip: "AI Insights",
      label: "Insights",
      className: "nav-btn",
    },
  ];

  return (
    <div className="ai-assistant-page">
      <PageHeader
        title="AI Trading Assistant"
        showLiveIndicator={true}
        isConnected={webSocketStore.isConnected}
        sticky={true}
        actionButtons={actionButtons}
        statsValue="GPT-4 Enabled"
        className="ai-assistant-header"
      />
      <div className="chat-container">
        <TradingAssistantChat />
      </div>
    </div>
  );
});

export default AIAssistantPage;
