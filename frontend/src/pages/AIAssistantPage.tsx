import React from "react";
import TradingAssistantChat from "../components/ai/TradingAssistantChat";
import "./AIAssistantPage.css";

const AIAssistantPage: React.FC = () => {
  return (
    <div className="ai-assistant-page">
      <div className="page-header">
        <h1>AI Trading Assistant</h1>
        <p>Get intelligent insights and trading recommendations</p>
      </div>
      <div className="chat-container">
        <TradingAssistantChat />
      </div>
    </div>
  );
};

export default AIAssistantPage;
