import {
  Analytics,
  AutoMode,
  Pause,
  PlayArrow,
  Settings,
  TrendingDown,
  TrendingUp,
} from "@mui/icons-material";
import React from "react";
import { AutonomousAgent, Portfolio } from "../types";
import "./PortfolioAICard.css";

interface PortfolioAICardProps {
  portfolio: Portfolio;
  assignedAgents: AutonomousAgent[];
  onAssignAgent: (portfolioId: number) => void;
  onViewPerformance: (portfolioId: number) => void;
  onToggleAgent: (portfolioId: number, agentId: string) => void;
}

const PortfolioAICard: React.FC<PortfolioAICardProps> = ({
  portfolio,
  assignedAgents,
  onAssignAgent,
  onViewPerformance,
  onToggleAgent,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const hasActiveAgents = assignedAgents.some(
    (agent) => agent.status === "running"
  );
  const totalAgentAllocation = assignedAgents.reduce(
    (sum, agent) => sum + agent.allocation,
    0
  );

  const getOverallPerformance = () => {
    if (!portfolio.performanceComparison?.combined) {
      return {
        totalReturn: portfolio.totalReturn,
        dailyReturn: 0,
        trend: portfolio.totalReturn >= 0 ? "positive" : "negative",
      };
    }

    const { combined } = portfolio.performanceComparison;
    return {
      totalReturn: combined.totalReturn,
      dailyReturn: combined.dailyReturn,
      trend: combined.totalReturn >= 0 ? "positive" : "negative",
    };
  };

  const performance = getOverallPerformance();

  return (
    <div className="portfolio-ai-card">
      {/* Portfolio Header */}
      <div className="portfolio-header">
        <div className="portfolio-info">
          <h3 className="portfolio-name">{portfolio.name}</h3>
          <div className="portfolio-type">
            {portfolio.portfolioType || "Standard Portfolio"}
          </div>
        </div>
        <div className="portfolio-value">
          <div className="total-value">
            {formatCurrency(portfolio.totalValue)}
          </div>
          <div className={`return-value ${performance.trend}`}>
            {performance.trend === "positive" ? (
              <TrendingUp />
            ) : (
              <TrendingDown />
            )}
            {formatPercentage(performance.totalReturn)}
          </div>
        </div>
      </div>

      {/* AI Status Section */}
      <div className="ai-status-section">
        <div className="ai-strategy-info">
          <div className="ai-strategy-type">
            <AutoMode />
            <span>AI Strategy: {portfolio.aiStrategy || "None"}</span>
          </div>
          {portfolio.agentAllocation && (
            <div className="agent-allocation">
              AI Managing: {portfolio.agentAllocation}% of portfolio
            </div>
          )}
        </div>

        {/* Agent List */}
        {assignedAgents.length > 0 ? (
          <div className="assigned-agents">
            <div className="agents-header">
              <span>Active Agents ({assignedAgents.length})</span>
              <span className="total-allocation">{totalAgentAllocation}%</span>
            </div>
            <div className="agents-list">
              {assignedAgents.map((agent) => (
                <div key={agent.id} className={`agent-item ${agent.status}`}>
                  <div className="agent-info">
                    <span className="agent-name">{agent.name}</span>
                    <span className="agent-type">
                      {agent.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="agent-controls">
                    <span className="agent-allocation">
                      {agent.allocation}%
                    </span>
                    <button
                      className="agent-toggle"
                      onClick={() => onToggleAgent(portfolio.id, agent.id)}
                      title={
                        agent.status === "running"
                          ? "Pause Agent"
                          : "Start Agent"
                      }
                    >
                      {agent.status === "running" ? <Pause /> : <PlayArrow />}
                    </button>
                  </div>
                  {agent.performance && (
                    <div className="agent-performance">
                      <span
                        className={`agent-return ${agent.performance.totalReturn >= 0 ? "positive" : "negative"}`}
                      >
                        {formatPercentage(agent.performance.totalReturn)}
                      </span>
                      <span className="agent-trades">
                        {agent.performance.totalTrades} trades
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="no-agents">
            <div className="no-agents-message">
              <AutoMode />
              <span>No AI agents assigned</span>
            </div>
          </div>
        )}
      </div>

      {/* Performance Comparison */}
      {portfolio.performanceComparison && (
        <div className="performance-comparison">
          <div className="comparison-title">Human vs AI Performance</div>
          <div className="comparison-grid">
            <div className="performance-item">
              <span className="label">Human Trading</span>
              <span
                className={`value ${portfolio.performanceComparison.humanTrading.totalReturn >= 0 ? "positive" : "negative"}`}
              >
                {formatPercentage(
                  portfolio.performanceComparison.humanTrading.totalReturn
                )}
              </span>
            </div>
            <div className="performance-item">
              <span className="label">AI Trading</span>
              <span
                className={`value ${portfolio.performanceComparison.aiTrading.totalReturn >= 0 ? "positive" : "negative"}`}
              >
                {formatPercentage(
                  portfolio.performanceComparison.aiTrading.totalReturn
                )}
              </span>
            </div>
            <div className="performance-item">
              <span className="label">Combined</span>
              <span
                className={`value ${portfolio.performanceComparison.combined.totalReturn >= 0 ? "positive" : "negative"}`}
              >
                {formatPercentage(
                  portfolio.performanceComparison.combined.totalReturn
                )}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="portfolio-actions">
        <button
          className="action-btn assign-agent"
          onClick={() => onAssignAgent(portfolio.id)}
        >
          <Settings />
          {assignedAgents.length > 0 ? "Manage Agents" : "Assign AI Agent"}
        </button>
        <button
          className="action-btn view-performance"
          onClick={() => onViewPerformance(portfolio.id)}
        >
          <Analytics />
          View Performance
        </button>
      </div>

      {/* Status Indicators */}
      <div className="status-indicators">
        <div
          className={`status-indicator ${hasActiveAgents ? "active" : "inactive"}`}
        >
          <span className="status-dot"></span>
          {hasActiveAgents ? "AI Active" : "Manual Only"}
        </div>
        {portfolio.lastAgentUpdate && (
          <div className="last-update">
            Last AI Update:{" "}
            {new Date(portfolio.lastAgentUpdate).toLocaleTimeString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioAICard;
