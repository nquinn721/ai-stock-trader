import {
  Analytics,
  AutoMode,
  Chat,
  ShowChart,
  Visibility,
  VolumeUp,
} from "@mui/icons-material";
import React from "react";

interface ActionPanelProps {
  onShowAutonomousAgents: () => void;
  onShowPortfolioAnalytics: () => void;
  onShowAIAssistant: () => void;
  onShowMarketScanner: () => void;
  onShowMultiAsset: () => void;
  onShowAIPortfolios: () => void;
}

/**
 * ActionPanel - Quick action buttons for different dashboard features
 */
const ActionPanel: React.FC<ActionPanelProps> = ({
  onShowAutonomousAgents,
  onShowPortfolioAnalytics,
  onShowAIAssistant,
  onShowMarketScanner,
  onShowMultiAsset,
  onShowAIPortfolios,
}) => {
  return (
    <div className="action-panel">
      <div className="action-panel-header">
        <h3>Quick Actions</h3>
        <span>Access advanced features</span>
      </div>

      <div className="action-buttons-grid">
        <button
          className="action-button autonomous"
          onClick={onShowAutonomousAgents}
        >
          <AutoMode className="action-icon" />
          <div className="action-content">
            <span className="action-title">Autonomous Trading</span>
            <span className="action-description">
              AI-powered trading agents
            </span>
          </div>
        </button>

        <button
          className="action-button analytics"
          onClick={onShowPortfolioAnalytics}
        >
          <Analytics className="action-icon" />
          <div className="action-content">
            <span className="action-title">Portfolio Analytics</span>
            <span className="action-description">
              Detailed performance analysis
            </span>
          </div>
        </button>

        <button className="action-button assistant" onClick={onShowAIAssistant}>
          <Chat className="action-icon" />
          <div className="action-content">
            <span className="action-title">AI Assistant</span>
            <span className="action-description">
              Trading guidance & insights
            </span>
          </div>
        </button>

        <button className="action-button scanner" onClick={onShowMarketScanner}>
          <VolumeUp className="action-icon" />
          <div className="action-content">
            <span className="action-title">Market Scanner</span>
            <span className="action-description">
              Find trading opportunities
            </span>
          </div>
        </button>

        <button
          className="action-button multi-asset"
          onClick={onShowMultiAsset}
        >
          <ShowChart className="action-icon" />
          <div className="action-content">
            <span className="action-title">Multi-Asset</span>
            <span className="action-description">Cross-asset analysis</span>
          </div>
        </button>

        <button
          className="action-button ai-portfolios"
          onClick={onShowAIPortfolios}
        >
          <Visibility className="action-icon" />
          <div className="action-content">
            <span className="action-title">AI Portfolios</span>
            <span className="action-description">AI-managed portfolios</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ActionPanel;
