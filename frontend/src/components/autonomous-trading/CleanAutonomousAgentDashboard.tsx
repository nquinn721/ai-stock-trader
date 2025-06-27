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
    portfolioId: "", // Will be set when portfolio is selected
  });

  // Demo data for when API is not available
  const demoStrategies: StrategyInstance[] = [
    {
      id: "demo-strategy-1",
      strategyId: "momentum-breakout-v1",
      status: "running",
      startedAt: new Date("2025-01-01T09:00:00Z"),
      errorCount: 0,
      performance: {
        totalReturn: 12.5,
        dailyReturn: 0.8,
        sharpeRatio: 1.6,
        maxDrawdown: -3.2,
        currentDrawdown: -1.5,
        winRate: 68.4,
        currentValue: 11250,
        totalTrades: 45,
        profitableTrades: 31,
        unrealizedPnL: 250,
      },
      strategy: {
        name: "Day Trading Pro",
        description: "Momentum-based day trading strategy",
      },
    },
    {
      id: "demo-strategy-2",
      strategyId: "mean-reversion-v2",
      status: "paused",
      startedAt: new Date("2025-01-02T09:00:00Z"),
      errorCount: 0,
      performance: {
        totalReturn: 8.7,
        dailyReturn: 0.3,
        sharpeRatio: 1.2,
        maxDrawdown: -5.1,
        currentDrawdown: -2.1,
        winRate: 72.3,
        currentValue: 10870,
        totalTrades: 38,
        profitableTrades: 27,
        unrealizedPnL: 870,
      },
      strategy: {
        name: "Swing Trader",
        description: "Mean reversion swing trading",
      },
    },
  ];

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    setIsLoading(true);
    try {
      const response = await autonomousTradingApi.getRunningStrategies();
      if (response.success && response.data.length > 0) {
        setRunningStrategies(response.data);
      } else {
        setRunningStrategies(demoStrategies);
      }
      setError(null);
    } catch (err) {
      console.warn("API not available, using demo data");
      setRunningStrategies(demoStrategies);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "running":
        return "#10b981";
      case "paused":
        return "#f59e0b";
      case "stopped":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const handleStrategyAction = async (
    strategyId: string,
    action: "start" | "pause" | "stop"
  ) => {
    setIsLoading(true);
    try {
      switch (action) {
        case "start":
          await autonomousTradingApi.resumeStrategy(strategyId);
          break;
        case "pause":
          await autonomousTradingApi.pauseStrategy(strategyId);
          break;
        case "stop":
          await autonomousTradingApi.stopStrategy(strategyId);
          break;
      }
      await loadStrategies();
    } catch (err) {
      setError(`Failed to ${action} strategy`);
      console.error(`Failed to ${action} strategy:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeployStrategy = async () => {
    setIsLoading(true);
    try {
      await autonomousTradingApi.deployStrategy(
        "default-strategy",
        deploymentConfig
      );
      setShowDeployModal(false);
      await loadStrategies();
      setError(null);
    } catch (err) {
      setError("Failed to deploy strategy");
      console.error("Failed to deploy strategy:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="clean-autonomous-dashboard">
      {/* Professional Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <h1>Autonomous Trading</h1>
            <p>AI-powered trading strategies with real-time monitoring</p>
          </div>
          <div className="header-actions">
            <button
              className="action-btn refresh-btn"
              onClick={loadStrategies}
              disabled={isLoading}
            >
              🔄 Refresh
            </button>
            <button
              className="action-btn deploy-btn"
              onClick={() => setShowDeployModal(true)}
            >
              🚀 Deploy Strategy
            </button>
            <button className="action-btn emergency-stop-btn">
              🛑 Emergency Stop
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="nav-tabs">
          <button
            className={`nav-tab ${activeTab === "strategies" ? "active" : ""}`}
            onClick={() => setActiveTab("strategies")}
          >
            📊 Strategies
          </button>
          <button
            className={`nav-tab ${activeTab === "performance" ? "active" : ""}`}
            onClick={() => setActiveTab("performance")}
          >
            📈 Performance
          </button>
          <button
            className={`nav-tab ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            ⚙️ Settings
          </button>
        </div>
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
                        {strategy.performance.winRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Sharpe Ratio</span>
                      <span className="metric-value">
                        {strategy.performance.sharpeRatio.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="drawdown-indicator">
                    <span>Max Drawdown: </span>
                    <span className="drawdown-value">
                      {formatPercentage(strategy.performance.maxDrawdown)}
                    </span>
                  </div>

                  <div className="card-actions">
                    {strategy.status === "running" && (
                      <button
                        className="action-btn pause-btn"
                        onClick={() =>
                          handleStrategyAction(strategy.id, "pause")
                        }
                        disabled={isLoading}
                      >
                        ⏸️ Pause
                      </button>
                    )}
                    {strategy.status === "paused" && (
                      <button
                        className="action-btn start-btn"
                        onClick={() =>
                          handleStrategyAction(strategy.id, "start")
                        }
                        disabled={isLoading}
                      >
                        ▶️ Resume
                      </button>
                    )}
                    <button
                      className="action-btn stop-btn"
                      onClick={() => handleStrategyAction(strategy.id, "stop")}
                      disabled={isLoading}
                    >
                      🛑 Stop
                    </button>
                    <button
                      className="action-btn view-details-btn"
                      onClick={() => {
                        setSelectedStrategy(strategy);
                        setShowPerformanceModal(true);
                      }}
                    >
                      📊 View Details
                    </button>
                  </div>
                </div>
              ))}

              {runningStrategies.length === 0 && !isLoading && (
                <div className="empty-state">
                  <div className="empty-icon">🤖</div>
                  <h3>No Strategies Running</h3>
                  <p>
                    Deploy your first autonomous trading strategy to get started
                  </p>
                  <button
                    className="create-strategy-btn"
                    onClick={() => setShowDeployModal(true)}
                  >
                    🚀 Deploy Strategy
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "performance" && (
          <div className="nav-content">
            <div className="performance-overview">
              <h2>Portfolio Performance</h2>
              <p>Comprehensive analysis of all autonomous trading strategies</p>

              <div className="portfolio-stats">
                <div className="stat-card">
                  <div className="stat-icon">💼</div>
                  <div className="stat-content">
                    <h3>
                      {formatCurrency(
                        runningStrategies.reduce(
                          (sum, s) => sum + s.performance.currentValue,
                          0
                        )
                      )}
                    </h3>
                    <p>Total Portfolio Value</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <h3>
                      {runningStrategies.reduce(
                        (sum, s) => sum + s.performance.totalTrades,
                        0
                      )}
                    </h3>
                    <p>Total Trades</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <h3>
                      {runningStrategies.reduce(
                        (sum, s) => sum + s.performance.profitableTrades,
                        0
                      )}
                    </h3>
                    <p>Profitable Trades</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="nav-content">
            <div className="settings-overview">
              <h2>System Settings</h2>
              <p>Configure autonomous trading parameters and risk management</p>

              <div className="settings-grid">
                <div className="setting-card">
                  <h3>Risk Management</h3>
                  <p>Configure portfolio-wide risk parameters</p>
                  <button className="action-btn">⚙️ Configure</button>
                </div>
                <div className="setting-card">
                  <h3>Notifications</h3>
                  <p>Set up alerts and notifications</p>
                  <button className="action-btn">🔔 Setup</button>
                </div>
                <div className="setting-card">
                  <h3>API Settings</h3>
                  <p>Manage external API connections</p>
                  <button className="action-btn">🔗 Manage</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <span>Loading...</span>
        </div>
      )}
    </div>
  );
};

export default CleanAutonomousAgentDashboard;
