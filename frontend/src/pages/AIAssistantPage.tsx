import React from "react";
import { Psychology } from "@mui/icons-material";
import PageHeader from "../components/ui/PageHeader";
import TradingAssistantChat from "../components/TradingAssistantChat";
import "./AIAssistantPage.css";

const AIAssistantPage: React.FC = () => {
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
        actionButtons={actionButtons}
        statsValue="GPT-4 Enabled"
        className="ai-assistant-header"
      />
      <div className="chat-container">
        <TradingAssistantChat />
      </div>
    </div>
  );
};

export default AIAssistantPage;
