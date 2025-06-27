import {
  Add,
  Analytics,
  Assignment,
  AutoMode,
  Delete,
  Pause,
  PlayArrow,
  Psychology,
  Settings,
} from "@mui/icons-material";
import React, { useEffect, useState } from "react";
import { AutonomousAgent, Portfolio } from "../types";
import HybridSignalDashboard from "./HybridSignalDashboard";
import "./MultiAgentPortfolioManager.css";

interface AgentAllocation {
  agentId: string;
  allocation: number; // Percentage of portfolio
  maxAllocation: number;
  minAllocation: number;
  priority: number; // 1-10, higher = more priority
}

interface MultiAgentConfig {
  portfolioId: number;
  totalAIAllocation: number; // Total percentage managed by AI
  agentAllocations: AgentAllocation[];
  rebalanceFrequency: "realtime" | "hourly" | "daily" | "weekly";
  competitionMode: boolean; // Agents compete for allocation based on performance
  riskDistribution: "equal" | "performance" | "risk-parity" | "custom";
  emergencyStopEnabled: boolean;
  emergencyStopDrawdown: number; // Percentage drawdown to trigger emergency stop
}

interface MultiAgentPortfolioManagerProps {
  portfolio: Portfolio;
  availableAgents: AutonomousAgent[];
  onConfigUpdate: (config: MultiAgentConfig) => void;
  onAgentAdd: (portfolioId: number, agentType: string) => void;
  onAgentRemove: (portfolioId: number, agentId: string) => void;
}

const MultiAgentPortfolioManager: React.FC<MultiAgentPortfolioManagerProps> = ({
  portfolio,
  availableAgents,
  onConfigUpdate,
  onAgentAdd,
  onAgentRemove,
}) => {
  const [config, setConfig] = useState<MultiAgentConfig>({
    portfolioId: portfolio.id,
    totalAIAllocation: portfolio.agentAllocation || 0,
    agentAllocations: [],
    rebalanceFrequency: "hourly",
    competitionMode: false,
    riskDistribution: "performance",
    emergencyStopEnabled: true,
    emergencyStopDrawdown: 15,
  });

  const [showAddAgent, setShowAddAgent] = useState(false);
  const [showHybridSignals, setShowHybridSignals] = useState(false);
  const [selectedAgentType, setSelectedAgentType] = useState<string>("");

  useEffect(() => {
    // Initialize agent allocations from portfolio
    if (portfolio.assignedAgents) {
      const allocations: AgentAllocation[] = portfolio.assignedAgents.map(
        (agent, index) => ({
          agentId: agent.id,
          allocation: agent.allocation,
          maxAllocation: 40, // Default max 40% per agent
          minAllocation: 5, // Default min 5% per agent
          priority: index + 1,
        })
      );

      setConfig((prev) => ({
        ...prev,
        agentAllocations: allocations,
        totalAIAllocation: allocations.reduce(
          (sum, alloc) => sum + alloc.allocation,
          0
        ),
      }));
    }
  }, [portfolio]);

  const handleAllocationChange = (agentId: string, newAllocation: number) => {
    const newAllocations = config.agentAllocations.map((alloc) =>
      alloc.agentId === agentId
        ? { ...alloc, allocation: newAllocation }
        : alloc
    );

    const totalAI = newAllocations.reduce(
      (sum, alloc) => sum + alloc.allocation,
      0
    );

    if (totalAI <= 100) {
      const newConfig = {
        ...config,
        agentAllocations: newAllocations,
        totalAIAllocation: totalAI,
      };
      setConfig(newConfig);
      onConfigUpdate(newConfig);
    }
  };

  const handleAddAgent = () => {
    if (selectedAgentType) {
      onAgentAdd(portfolio.id, selectedAgentType);
      setSelectedAgentType("");
      setShowAddAgent(false);
    }
  };

  const handleRemoveAgent = (agentId: string) => {
    const newAllocations = config.agentAllocations.filter(
      (alloc) => alloc.agentId !== agentId
    );
    const newConfig = {
      ...config,
      agentAllocations: newAllocations,
      totalAIAllocation: newAllocations.reduce(
        (sum, alloc) => sum + alloc.allocation,
        0
      ),
    };
    setConfig(newConfig);
    onConfigUpdate(newConfig);
    onAgentRemove(portfolio.id, agentId);
  };

  const handleRebalanceStrategy = () => {
    if (config.competitionMode) {
      // Performance-based rebalancing
      const agents = portfolio.assignedAgents || [];
      const totalPerformance = agents.reduce(
        (sum, agent) => Math.max(0, agent.performance.totalReturn),
        0
      );

      if (totalPerformance > 0) {
        const newAllocations = config.agentAllocations.map((alloc) => {
          const agent = agents.find((a) => a.id === alloc.agentId);
          if (agent && agent.performance.totalReturn > 0) {
            const performanceRatio =
              agent.performance.totalReturn / totalPerformance;
            const newAllocation = Math.min(
              alloc.maxAllocation,
              Math.max(
                alloc.minAllocation,
                performanceRatio * config.totalAIAllocation
              )
            );
            return { ...alloc, allocation: newAllocation };
          }
          return { ...alloc, allocation: alloc.minAllocation };
        });

        const newConfig = {
          ...config,
          agentAllocations: newAllocations,
        };
        setConfig(newConfig);
        onConfigUpdate(newConfig);
      }
    }
  };

  const getAgentById = (agentId: string) => {
    return portfolio.assignedAgents?.find((agent) => agent.id === agentId);
  };

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

  const getAgentTypeOptions = () => {
    return [
      {
        value: "dqn",
        label: "DQN Agent (Deep Q-Learning)",
        description: "Best for trend following",
      },
      {
        value: "ppo",
        label: "PPO Agent (Proximal Policy)",
        description: "Balanced risk/reward",
      },
      {
        value: "rule-based",
        label: "Rule-Based Agent",
        description: "Traditional indicators",
      },
      {
        value: "hybrid",
        label: "Hybrid Agent",
        description: "AI + Traditional combined",
      },
    ];
  };

  return (
    <div className="multi-agent-portfolio-manager">
      {/* Portfolio Header */}
      <div className="portfolio-header">
        <div className="portfolio-info">
          <h2>{portfolio.name}</h2>
          <div className="portfolio-stats">
            <span className="total-value">
              {formatCurrency(portfolio.totalValue)}
            </span>
            <span
              className={`total-return ${portfolio.totalReturn >= 0 ? "positive" : "negative"}`}
            >
              {formatPercentage(portfolio.totalReturn)}
            </span>
          </div>
        </div>
        <div className="portfolio-actions">
          <button
            className="action-btn hybrid-signals"
            onClick={() => setShowHybridSignals(!showHybridSignals)}
          >
            <Analytics />
            Hybrid Signals
          </button>
          <button
            className="action-btn rebalance"
            onClick={handleRebalanceStrategy}
            disabled={!config.competitionMode}
          >
            <Assignment />
            Rebalance
          </button>
        </div>
      </div>

      {/* AI Allocation Overview */}
      <div className="allocation-overview">
        <div className="allocation-header">
          <h3>AI Allocation Overview</h3>
          <div className="total-allocation">
            <span className="label">Total AI Control:</span>
            <span className="value">
              {config.totalAIAllocation.toFixed(1)}%
            </span>
            <span className="human-control">
              Human: {(100 - config.totalAIAllocation).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="allocation-bar">
          <div className="allocation-segments">
            {config.agentAllocations.map((alloc, index) => {
              const agent = getAgentById(alloc.agentId);
              return (
                <div
                  key={alloc.agentId}
                  className={`allocation-segment agent-${agent?.type || "unknown"}`}
                  style={{ width: `${alloc.allocation}%` }}
                  title={`${agent?.name}: ${alloc.allocation}%`}
                />
              );
            })}
            <div
              className="allocation-segment human"
              style={{ width: `${100 - config.totalAIAllocation}%` }}
              title={`Human Control: ${(100 - config.totalAIAllocation).toFixed(1)}%`}
            />
          </div>
        </div>
      </div>

      {/* Hybrid Signals Panel */}
      {showHybridSignals && (
        <div className="hybrid-signals-panel">
          <HybridSignalDashboard
            onSignalSelect={(signal) => console.log("Signal selected:", signal)}
            onConfigUpdate={(config) =>
              console.log("Hybrid config updated:", config)
            }
          />
        </div>
      )}

      {/* Agent Management */}
      <div className="agent-management">
        <div className="section-header">
          <h3>
            <AutoMode />
            Agent Management ({config.agentAllocations.length}/5)
          </h3>
          <button
            className="add-agent-btn"
            onClick={() => setShowAddAgent(true)}
            disabled={config.agentAllocations.length >= 5}
          >
            <Add />
            Add Agent
          </button>
        </div>

        {/* Agent List */}
        <div className="agents-list">
          {config.agentAllocations.map((allocation) => {
            const agent = getAgentById(allocation.agentId);
            if (!agent) return null;

            return (
              <div key={agent.id} className={`agent-card ${agent.status}`}>
                <div className="agent-header">
                  <div className="agent-info">
                    <span className="agent-name">{agent.name}</span>
                    <span className="agent-type">
                      {agent.type.toUpperCase()}
                    </span>
                    <span className={`agent-status ${agent.status}`}>
                      {agent.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="agent-actions">
                    <button
                      className="action-btn"
                      onClick={() =>
                        console.log("Pause/Resume agent:", agent.id)
                      }
                    >
                      {agent.status === "running" ? <Pause /> : <PlayArrow />}
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleRemoveAgent(agent.id)}
                    >
                      <Delete />
                    </button>
                  </div>
                </div>

                <div className="agent-allocation">
                  <label>Allocation: {allocation.allocation.toFixed(1)}%</label>
                  <input
                    type="range"
                    min={allocation.minAllocation}
                    max={allocation.maxAllocation}
                    step="0.5"
                    value={allocation.allocation}
                    onChange={(e) =>
                      handleAllocationChange(
                        agent.id,
                        parseFloat(e.target.value)
                      )
                    }
                    className="allocation-slider"
                  />
                  <div className="allocation-limits">
                    <span>Min: {allocation.minAllocation}%</span>
                    <span>Max: {allocation.maxAllocation}%</span>
                  </div>
                </div>

                <div className="agent-performance">
                  <div className="performance-item">
                    <span className="label">Return:</span>
                    <span
                      className={`value ${agent.performance.totalReturn >= 0 ? "positive" : "negative"}`}
                    >
                      {formatPercentage(agent.performance.totalReturn)}
                    </span>
                  </div>
                  <div className="performance-item">
                    <span className="label">Sharpe:</span>
                    <span className="value">
                      {agent.performance.sharpeRatio.toFixed(2)}
                    </span>
                  </div>
                  <div className="performance-item">
                    <span className="label">Win Rate:</span>
                    <span className="value">
                      {agent.performance.winRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="performance-item">
                    <span className="label">Trades:</span>
                    <span className="value">
                      {agent.performance.totalTrades}
                    </span>
                  </div>
                </div>

                <div className="allocation-value">
                  <span className="label">Portfolio Value:</span>
                  <span className="value">
                    {formatCurrency(
                      (portfolio.totalValue * allocation.allocation) / 100
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {config.agentAllocations.length === 0 && (
          <div className="no-agents">
            <Psychology className="no-agents-icon" />
            <h4>No AI Agents Assigned</h4>
            <p>Add AI agents to start automated portfolio management</p>
            <button
              className="add-first-agent-btn"
              onClick={() => setShowAddAgent(true)}
            >
              <Add />
              Add Your First Agent
            </button>
          </div>
        )}
      </div>

      {/* Configuration Panel */}
      <div className="config-panel">
        <h3>
          <Settings />
          Multi-Agent Configuration
        </h3>
        <div className="config-grid">
          <div className="config-item">
            <label>Rebalance Frequency</label>
            <select
              value={config.rebalanceFrequency}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  rebalanceFrequency: e.target.value as any,
                }))
              }
            >
              <option value="realtime">Real-time</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          <div className="config-item">
            <label>Competition Mode</label>
            <div className="toggle-container">
              <input
                type="checkbox"
                checked={config.competitionMode}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    competitionMode: e.target.checked,
                  }))
                }
              />
              <span>Agents compete for allocation</span>
            </div>
          </div>

          <div className="config-item">
            <label>Risk Distribution</label>
            <select
              value={config.riskDistribution}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  riskDistribution: e.target.value as any,
                }))
              }
            >
              <option value="equal">Equal Risk</option>
              <option value="performance">Performance-Based</option>
              <option value="risk-parity">Risk Parity</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="config-item">
            <label>Emergency Stop</label>
            <div className="emergency-stop">
              <input
                type="checkbox"
                checked={config.emergencyStopEnabled}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    emergencyStopEnabled: e.target.checked,
                  }))
                }
              />
              <span>Enable at</span>
              <input
                type="number"
                min="5"
                max="50"
                value={config.emergencyStopDrawdown}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    emergencyStopDrawdown: parseFloat(e.target.value),
                  }))
                }
                disabled={!config.emergencyStopEnabled}
              />
              <span>% drawdown</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Agent Modal */}
      {showAddAgent && (
        <div className="modal-overlay">
          <div className="add-agent-modal">
            <div className="modal-header">
              <h3>Add AI Agent</h3>
              <button
                className="close-btn"
                onClick={() => setShowAddAgent(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <label>Select Agent Type:</label>
              <div className="agent-type-options">
                {getAgentTypeOptions().map((option) => (
                  <div
                    key={option.value}
                    className={`agent-type-option ${selectedAgentType === option.value ? "selected" : ""}`}
                    onClick={() => setSelectedAgentType(option.value)}
                  >
                    <div className="option-header">
                      <span className="option-label">{option.label}</span>
                    </div>
                    <div className="option-description">
                      {option.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowAddAgent(false)}
              >
                Cancel
              </button>
              <button
                className="add-btn"
                onClick={handleAddAgent}
                disabled={!selectedAgentType}
              >
                Add Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiAgentPortfolioManager;
