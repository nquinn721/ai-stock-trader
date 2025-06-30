import { AutoMode, Chat, Dashboard, Psychology } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import React from "react";
import { useNavigate } from "react-router-dom";
import TradingAssistantChat from "../components/TradingAssistantChat";
import PageHeader from "../components/ui/PageHeader";
import "./AIAssistantPage.css";

const AIAssistantPage: React.FC = observer(() => {
  const navigate = useNavigate();

  const actionButtons = [
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
      icon: <Psychology />,
      onClick: () => {
        // TODO: Add AI insights functionality
        console.log("AI insights clicked");
      },
      tooltip: "AI Insights",
      label: "Insights",
    },
  ];

  return (
    <div className="page-container">
      <PageHeader
        title="AI Trading Assistant"
        actionButtons={actionButtons}
        statsValue="GPT-4 Enabled"
        className="ai-assistant-header"
      />
      <div className="page-content">
        <div className="chat-container">
          <TradingAssistantChat />
        </div>
      </div>
    </div>
  );
});

export default AIAssistantPage;
