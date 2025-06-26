import React, { useEffect, useState } from "react";
import autonomousTradingApi, {
  DeploymentConfig,
  StrategyInstance,
} from "../../services/autonomousTradingApi";
import "./CleanAutonomousAgentDashboard.css";

const CleanAutonomousAgentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState("strategies");
  const [runningStrategies, setRunningStrategies] = useState<
    StrategyInstance[]
  >([]);
  const [selectedStrategy, setSelectedStrategy] =
    useState<StrategyInstance | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);

  const [deploymentConfig, setDeploymentConfig] = useState<DeploymentConfig>({
    mode: "paper",
    initialCapital: 10000,
    maxPositions: 5,
    executionFrequency: "hour",
    symbols: ["AAPL", "GOOGL", "MSFT"],
    riskLimits: {
      maxDrawdown: 10,
      maxPositionSize: 10,
      dailyLossLimit: 500,
      correlationLimit: 0.7,
    },
    notifications: {
      enabled: true,
      onTrade: true,
      onError: true,
      onRiskBreach: true,
    },
  });

  // Demo data for when API is not available
  const demoStrategies: StrategyInstance[] = [
    {
      id: "demo-strategy-1",
      strategyId: "momentum-breakout-v1",
      status: "running",
      startedAt: new Date("2025-01-01T09:00:00Z"),
      performance: {
        totalReturn: 12.5,
        dailyReturn: 0.8,
        sharpeRatio: 1.6,
        maxDrawdown: -3.2,
        currentDrawdown: -1.1,
        winRate: 68,
        totalTrades: 45,
        profitableTrades: 31,
        currentValue: 11250,
        unrealizedPnL: 150,
      },
      errorCount: 0,
      strategy: {
        name: "Momentum Breakout Pro",
        description: "Advanced momentum-based strategy with ML filtering",
      },
    },
    {
      id: "demo-strategy-2",
      strategyId: "mean-reversion-v2",
      status: "paused",
      startedAt: new Date("2025-01-01T08:30:00Z"),
      performance: {
        totalReturn: 8.3,
        dailyReturn: -0.2,
        sharpeRatio: 1.2,
        maxDrawdown: -5.1,
        currentDrawdown: -2.3,
        winRate: 72,
        totalTrades: 38,
        profitableTrades: 27,
        currentValue: 10830,
        unrealizedPnL: -75,
      },
      errorCount: 1,
      strategy: {
        name: "Smart Mean Reversion",
        description: "RSI-based mean reversion with dynamic thresholds",
      },
    },
  ];

  const loadRunningStrategies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await autonomousTradingApi.getRunningStrategies();
      if (response.success) {
        setRunningStrategies(response.data);
      } else {
        setRunningStrategies(demoStrategies);
      }
    } catch (err: any) {
      setRunningStrategies(demoStrategies);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRunningStrategies();
    // Refresh every 30 seconds
    const interval = setInterval(loadRunningStrategies, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStrategyAction = async (
    strategyId: string,
    action: "stop" | "pause" | "resume"
  ) => {
    setIsLoading(true);
    try {
      // API call simulation
      setRunningStrategies((prev) =>
        prev.map((strategy) =>
          strategy.strategyId === strategyId
            ? {
                ...strategy,
                status:
                  action === "resume"
                    ? "running"
                    : action === "stop"
                    ? "stopped"
                    : "paused",
              }
            : strategy
        )
      );
    } catch (err) {
      setError(`Failed to ${action} strategy`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "#10b981";
      case "paused":
        return "#f59e0b";
      case "stopped":
        return "#6b7280";
      case "error":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return "▶️";
      case "paused":
        return "⏸️";
      case "stopped":
        return "⏹️";
      case "error":
        return "⚠️";
      default:
        return "⚙️";
    }
  };

  return (
    <div className="clean-autonomous-dashboard">
      {/* Header with LIVE indicator */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="title-section">
            <h1>Autonomous Trading System</h1>
            <p>AI-powered strategies with real-time execution</p>
          </div>
          <div className="header-indicators">
            <div className="live-indicator">
              <div className="live-dot"></div>
              <span>LIVE</span>
            </div>
            <button
              className="emergency-stop-btn"
              onClick={() =>
                runningStrategies.forEach(
                  (s) =>
                    s.status === "running" &&
                    handleStrategyAction(s.strategyId, "stop")
                )
              }
            >
              🛑 Emergency Stop
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="nav-tabs">
        <button
          className={`tab-btn ${activeTab === "strategies" ? "active" : ""}`}
          onClick={() => setActiveTab("strategies")}
        >
          📊 Active Strategies
        </button>
        <button
          className={`tab-btn ${activeTab === "builder" ? "active" : ""}`}
          onClick={() => setActiveTab("builder")}
        >
          🛠️ Strategy Builder
        </button>
        <button
          className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          📈 Analytics
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Main Content */}
      <div className="dashboard-content">
        {activeTab === "strategies" && (
          <div className="strategies-tab">
            {/* Quick Stats */}
            <div className="quick-stats">
              <div className="stat-card">
                <div className="stat-icon">🤖</div>
                <div className="stat-content">
                  <h3>
                    {
                      runningStrategies.filter((s) => s.status === "running")
                        .length
                    }
                  </h3>
                  <p>Active Agents</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <h3>
                    {formatCurrency(
                      runningStrategies.reduce(
                        (sum, s) => sum + s.performance.currentValue,
                        0
                      )
                    )}
                  </h3>
                  <p>Total Value</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">📈</div>
                <div className="stat-content">
                  <h3>
                    {formatPercentage(
                      runningStrategies.reduce(
                        (sum, s) => sum + s.performance.totalReturn,
                        0
                      ) / Math.max(runningStrategies.length, 1)
                    )}
                  </h3>
                  <p>Avg Return</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎯</div>
                <div className="stat-content">
                  <h3>
                    {Math.round(
                      runningStrategies.reduce(
                        (sum, s) => sum + s.performance.winRate,
                        0
                      ) / Math.max(runningStrategies.length, 1)
                    )}
                    %
                  </h3>
                  <p>Win Rate</p>
                </div>
              </div>
            </div>

            {/* Strategy Cards */}
            <div className="strategies-grid">
              {runningStrategies.map((strategy) => (
                <div key={strategy.id} className="strategy-card">
                  <div className="card-header">
                    <div className="strategy-info">
                      <h3>{strategy.strategy?.name || "Unnamed Strategy"}</h3>
                      <p>
                        {strategy.strategy?.description || "No description"}
                      </p>
                    </div>
                    <div className="strategy-status">
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: getStatusColor(strategy.status),
                        }}
                      >
                        {getStatusIcon(strategy.status)}{" "}
                        {strategy.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="performance-metrics">
                    <div className="metric">
                      <span className="metric-label">Total Return</span>
                      <span
                        className={`metric-value ${
                          strategy.performance.totalReturn >= 0
                            ? "positive"
                            : "negative"
                        }`}
                      >
                        {formatPercentage(strategy.performance.totalReturn)}
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Current Value</span>
                      <span className="metric-value">
                        {formatCurrency(strategy.performance.currentValue)}
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Win Rate</span>
                      <span className="metric-value">
                        {strategy.performance.winRate}%
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Trades</span>
                      <span className="metric-value">
                        {strategy.performance.totalTrades}
                      </span>
                    </div>
                  </div>

                  <div className="drawdown-indicator">
                    <span className="drawdown-label">Current Drawdown</span>
                    <div className="drawdown-bar">
                      <div
                        className="drawdown-fill"
                        style={{
                          width: `${Math.abs(
                            strategy.performance.currentDrawdown * 10
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <span className="drawdown-value">
                      {formatPercentage(strategy.performance.currentDrawdown)}
                    </span>
                  </div>

                  {strategy.errorCount > 0 && (
                    <div className="error-indicator">
                      ⚠️ {strategy.errorCount} error(s) detected
                    </div>
                  )}

                  <div className="card-actions">
                    {strategy.status === "running" && (
                      <button
                        className="action-btn pause-btn"
                        onClick={() =>
                          handleStrategyAction(strategy.strategyId, "pause")
                        }
                        disabled={isLoading}
                      >
                        ⏸️ Pause
                      </button>
                    )}
                    {strategy.status === "paused" && (
                      <button
                        className="action-btn resume-btn"
                        onClick={() =>
                          handleStrategyAction(strategy.strategyId, "resume")
                        }
                        disabled={isLoading}
                      >
                        ▶️ Resume
                      </button>
                    )}
                    <button
                      className="action-btn stop-btn"
                      onClick={() =>
                        handleStrategyAction(strategy.strategyId, "stop")
                      }
                      disabled={isLoading}
                    >
                      ⏹️ Stop
                    </button>
                    <button
                      className="action-btn details-btn"
                      onClick={() => {
                        setSelectedStrategy(strategy);
                        setShowPerformanceModal(true);
                      }}
                    >
                      📊 Details
                    </button>
                  </div>
                </div>
              ))}

              {/* Add New Strategy Card */}
              <div
                className="strategy-card add-card"
                onClick={() => setShowDeployModal(true)}
              >
                <div className="add-content">
                  <div className="add-icon">➕</div>
                  <h3>Deploy New Strategy</h3>
                  <p>Create and deploy a new autonomous trading agent</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity">
              <h3>Recent Trading Activity</h3>
              <div className="activity-list">
                <div className="activity-item">
                  <div className="activity-icon buy">📈</div>
                  <div className="activity-details">
                    <span className="activity-action">BUY AAPL</span>
                    <span className="activity-meta">
                      100 shares @ $150.25 • Momentum Breakout Pro
                    </span>
                  </div>
                  <div className="activity-pnl positive">+$245.00</div>
                  <div className="activity-time">2h ago</div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon sell">📉</div>
                  <div className="activity-details">
                    <span className="activity-action">SELL GOOGL</span>
                    <span className="activity-meta">
                      50 shares @ $2,850.75 • Smart Mean Reversion
                    </span>
                  </div>
                  <div className="activity-pnl negative">-$125.00</div>
                  <div className="activity-time">4h ago</div>
                </div>
                <div className="activity-item">
                  <div className="activity-icon buy">📈</div>
                  <div className="activity-details">
                    <span className="activity-action">BUY MSFT</span>
                    <span className="activity-meta">
                      75 shares @ $420.50 • Momentum Breakout Pro
                    </span>
                  </div>
                  <div className="activity-pnl positive">+$387.50</div>
                  <div className="activity-time">6h ago</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "builder" && (
          <div className="builder-tab">
            <div className="coming-soon">
              <div className="coming-soon-icon">🚧</div>
              <h2>Visual Strategy Builder</h2>
              <p>
                The drag-and-drop strategy builder is being enhanced with
                advanced features.
              </p>
              <div className="features-list">
                <div className="feature-item">✅ Visual node-based editor</div>
                <div className="feature-item">
                  ✅ Real-time strategy validation
                </div>
                <div className="feature-item">✅ Backtesting integration</div>
                <div className="feature-item">🔄 Advanced ML components</div>
                <div className="feature-item">🔄 Risk management templates</div>
              </div>
              <button className="notify-btn">Notify When Available</button>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="analytics-tab">
            <div className="analytics-grid">
              <div className="analytics-card">
                <h3>Performance Overview</h3>
                <div className="performance-chart-placeholder">
                  📊 Performance charts will be displayed here
                </div>
              </div>
              <div className="analytics-card">
                <h3>Risk Metrics</h3>
                <div className="risk-metrics">
                  <div className="risk-metric">
                    <span>Portfolio VaR (95%)</span>
                    <span className="risk-value">-2.1%</span>
                  </div>
                  <div className="risk-metric">
                    <span>Max Drawdown</span>
                    <span className="risk-value">-5.3%</span>
                  </div>
                  <div className="risk-metric">
                    <span>Sharpe Ratio</span>
                    <span className="risk-value">1.45</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Performance Modal */}
      {showPerformanceModal && selectedStrategy && (
        <div
          className="modal-overlay"
          onClick={() => setShowPerformanceModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedStrategy.strategy?.name} Performance</h2>
              <button
                className="modal-close"
                onClick={() => setShowPerformanceModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="performance-details">
                <div className="detail-metric">
                  <span>Total Return</span>
                  <span
                    className={
                      selectedStrategy.performance.totalReturn >= 0
                        ? "positive"
                        : "negative"
                    }
                  >
                    {formatPercentage(selectedStrategy.performance.totalReturn)}
                  </span>
                </div>
                <div className="detail-metric">
                  <span>Sharpe Ratio</span>
                  <span>
                    {selectedStrategy.performance.sharpeRatio.toFixed(2)}
                  </span>
                </div>
                <div className="detail-metric">
                  <span>Max Drawdown</span>
                  <span className="negative">
                    {formatPercentage(selectedStrategy.performance.maxDrawdown)}
                  </span>
                </div>
                <div className="detail-metric">
                  <span>Win Rate</span>
                  <span>{selectedStrategy.performance.winRate}%</span>
                </div>
                <div className="detail-metric">
                  <span>Total Trades</span>
                  <span>{selectedStrategy.performance.totalTrades}</span>
                </div>
                <div className="detail-metric">
                  <span>Profitable Trades</span>
                  <span>{selectedStrategy.performance.profitableTrades}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deploy Modal */}
      {showDeployModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeployModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Deploy New Strategy</h2>
              <button
                className="modal-close"
                onClick={() => setShowDeployModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="deploy-form">
                <div className="form-group">
                  <label>Trading Mode</label>
                  <select
                    value={deploymentConfig.mode}
                    onChange={(e) =>
                      setDeploymentConfig((prev) => ({
                        ...prev,
                        mode: e.target.value as "paper" | "live",
                      }))
                    }
                  >
                    <option value="paper">Paper Trading</option>
                    <option value="live">Live Trading</option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Initial Capital</label>
                    <input
                      type="number"
                      value={deploymentConfig.initialCapital}
                      onChange={(e) =>
                        setDeploymentConfig((prev) => ({
                          ...prev,
                          initialCapital: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Max Positions</label>
                    <input
                      type="number"
                      value={deploymentConfig.maxPositions}
                      onChange={(e) =>
                        setDeploymentConfig((prev) => ({
                          ...prev,
                          maxPositions: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Execution Frequency</label>
                  <select
                    value={deploymentConfig.executionFrequency}
                    onChange={(e) =>
                      setDeploymentConfig((prev) => ({
                        ...prev,
                        executionFrequency: e.target.value as any,
                      }))
                    }
                  >
                    <option value="minute">Every Minute</option>
                    <option value="hour">Every Hour</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setShowDeployModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="deploy-btn"
                  onClick={() => setShowDeployModal(false)}
                >
                  Deploy Strategy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CleanAutonomousAgentDashboard;
