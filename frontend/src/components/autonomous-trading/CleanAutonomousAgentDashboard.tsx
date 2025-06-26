import React, { useEffect, useState } from "react";
import autonomousTradingApi, {
  DeploymentConfig,
  StrategyInstance,
} from "../../services/autonomousTradingApi";
import SimpleStrategyBuilder from "../strategy-builder/SimpleStrategyBuilder";
import "./CleanAutonomousAgentDashboard.css";

const AutonomousAgentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [runningStrategies, setRunningStrategies] = useState<StrategyInstance[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyInstance | null>(null);
  const [isPerformanceDialogOpen, setIsPerformanceDialogOpen] = useState(false);
  const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Load running strategies from API
  const loadRunningStrategies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await autonomousTradingApi.getRunningStrategies();
      if (response.success) {
        setRunningStrategies(response.data);
      } else {
        setError(response.error || "Failed to load running strategies");
        // Fallback to demo data if API is not available
        setRunningStrategies([
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
              name: "Momentum Breakout Strategy (Demo)",
              description: "Demo strategy - Backend not connected",
            },
          },
          {
            id: "demo-strategy-2",
            strategyId: "mean-reversion-v2",
            status: "paused",
            startedAt: new Date("2024-12-28T14:30:00Z"),
            performance: {
              totalReturn: -2.1,
              dailyReturn: -0.3,
              sharpeRatio: 0.8,
              maxDrawdown: -5.8,
              currentDrawdown: -2.1,
              winRate: 45,
              totalTrades: 23,
              profitableTrades: 10,
              currentValue: 9790,
              unrealizedPnL: -50,
            },
            errorCount: 2,
            strategy: {
              name: "Mean Reversion Strategy (Demo)",
              description: "Demo strategy - Backend not connected",
            },
          },
        ]);
      }
    } catch (err: any) {
      setError(err.message);
      setRunningStrategies([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 0) {
      loadRunningStrategies();
    }
  }, [activeTab]);

  const handleRefresh = () => {
    loadRunningStrategies();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "success";
      case "paused":
        return "warning";
      case "stopped":
        return "default";
      case "error":
        return "error";
      default:
        return "default";
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
        return "❌";
      default:
        return "❓";
    }
  };

  const handleStrategyAction = (action: string, strategy: StrategyInstance) => {
    console.log(`${action} strategy:`, strategy.id);
    // TODO: Implement strategy control actions
  };

  return (
    <div className="autonomous-trading-dashboard">
      {/* Header with Live Indicator */}
      <header className="autonomous-header">
        <div className="header-left">
          <div className="header-title">
            <h1>Autonomous Trading System</h1>
            <div className="live-indicator">
              <span className="live-dot"></span>
              <span className="live-text">LIVE</span>
            </div>
          </div>
          <p className="header-subtitle">
            Build, deploy, and manage your automated trading strategies
          </p>
        </div>
        {activeTab === 0 && (
          <div className="header-actions">
            <button
              className="refresh-btn"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              🔄 Refresh
            </button>
            <button
              className="deploy-btn primary"
              onClick={() => setIsDeployDialogOpen(true)}
            >
              ▶️ Deploy Strategy
            </button>
          </div>
        )}
      </header>

      {/* Navigation Tabs */}
      <div className="tab-navigation">
        <div className="tab-list">
          <button
            className={`tab-button ${activeTab === 0 ? "active" : ""}`}
            onClick={() => setActiveTab(0)}
          >
            📊 Active Strategies
          </button>
          <button
            className={`tab-button ${activeTab === 1 ? "active" : ""}`}
            onClick={() => setActiveTab(1)}
          >
            🔨 Strategy Builder
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Active Strategies Tab */}
        {activeTab === 0 && (
          <div className="strategies-tab">
            {error && (
              <div className="error-alert">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {isLoading && (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <span>Loading strategies...</span>
              </div>
            )}

            {/* Strategy Cards */}
            <div className="strategies-grid">
              {runningStrategies.map((strategy) => (
                <div key={strategy.id} className="strategy-card">
                  <div className="card-header">
                    <div className="strategy-info">
                      <h3 className="strategy-name">
                        {strategy.strategy?.name || `Strategy ${strategy.id}`}
                      </h3>
                      <div className={`status-badge ${getStatusColor(strategy.status)}`}>
                        <span className="status-icon">{getStatusIcon(strategy.status)}</span>
                        <span className="status-text">{strategy.status.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button
                        className="action-btn"
                        onClick={() => {
                          setSelectedStrategy(strategy);
                          setIsPerformanceDialogOpen(true);
                        }}
                        title="View Performance"
                      >
                        👁️
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => handleStrategyAction("pause", strategy)}
                        disabled={strategy.status !== "running"}
                        title="Pause Strategy"
                      >
                        ⏸️
                      </button>
                      <button
                        className="action-btn danger"
                        onClick={() => handleStrategyAction("stop", strategy)}
                        title="Stop Strategy"
                      >
                        ⏹️
                      </button>
                    </div>
                  </div>

                  <div className="card-content">
                    <p className="strategy-description">
                      {strategy.strategy?.description || "No description available"}
                    </p>

                    {/* Performance Metrics Grid */}
                    <div className="metrics-grid">
                      <div className="metric-item">
                        <span className="metric-label">Total Return</span>
                        <span className={`metric-value ${strategy.performance.totalReturn >= 0 ? "positive" : "negative"}`}>
                          {formatPercentage(strategy.performance.totalReturn)}
                        </span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Current Value</span>
                        <span className="metric-value">
                          {formatCurrency(strategy.performance.currentValue)}
                        </span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Win Rate</span>
                        <span className="metric-value">
                          {strategy.performance.winRate}%
                        </span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Total Trades</span>
                        <span className="metric-value">
                          {strategy.performance.totalTrades}
                        </span>
                      </div>
                    </div>

                    <div className="strategy-footer">
                      <span className="started-at">
                        Started: {strategy.startedAt.toLocaleDateString()}
                      </span>
                      {strategy.errorCount > 0 && (
                        <span className="error-count">
                          ⚠️ {strategy.errorCount} errors
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {runningStrategies.length === 0 && !isLoading && (
              <div className="empty-state">
                <div className="empty-icon">🤖</div>
                <h3>No Active Strategies</h3>
                <p>Deploy your first autonomous trading strategy to get started</p>
                <button
                  className="primary-btn"
                  onClick={() => setActiveTab(1)}
                >
                  Create Strategy
                </button>
              </div>
            )}
          </div>
        )}

        {/* Strategy Builder Tab */}
        {activeTab === 1 && (
          <div className="builder-tab">
            <SimpleStrategyBuilder />
          </div>
        )}
      </div>

      {/* Performance Dialog */}
      {isPerformanceDialogOpen && selectedStrategy && (
        <div className="modal-overlay" onClick={() => setIsPerformanceDialogOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Strategy Performance</h2>
              <button
                className="modal-close"
                onClick={() => setIsPerformanceDialogOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <h3>{selectedStrategy.strategy?.name}</h3>
              <div className="performance-grid">
                <div className="perf-item">
                  <span className="perf-label">Total Return</span>
                  <span className={`perf-value ${selectedStrategy.performance.totalReturn >= 0 ? "positive" : "negative"}`}>
                    {formatPercentage(selectedStrategy.performance.totalReturn)}
                  </span>
                </div>
                <div className="perf-item">
                  <span className="perf-label">Daily Return</span>
                  <span className={`perf-value ${selectedStrategy.performance.dailyReturn >= 0 ? "positive" : "negative"}`}>
                    {formatPercentage(selectedStrategy.performance.dailyReturn)}
                  </span>
                </div>
                <div className="perf-item">
                  <span className="perf-label">Sharpe Ratio</span>
                  <span className="perf-value">{selectedStrategy.performance.sharpeRatio.toFixed(2)}</span>
                </div>
                <div className="perf-item">
                  <span className="perf-label">Max Drawdown</span>
                  <span className="perf-value negative">
                    {formatPercentage(selectedStrategy.performance.maxDrawdown)}
                  </span>
                </div>
                <div className="perf-item">
                  <span className="perf-label">Current Value</span>
                  <span className="perf-value">
                    {formatCurrency(selectedStrategy.performance.currentValue)}
                  </span>
                </div>
                <div className="perf-item">
                  <span className="perf-label">Unrealized P&L</span>
                  <span className={`perf-value ${selectedStrategy.performance.unrealizedPnL >= 0 ? "positive" : "negative"}`}>
                    {formatCurrency(selectedStrategy.performance.unrealizedPnL)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deploy Dialog */}
      {isDeployDialogOpen && (
        <div className="modal-overlay" onClick={() => setIsDeployDialogOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Deploy Strategy</h2>
              <button
                className="modal-close"
                onClick={() => setIsDeployDialogOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>Strategy deployment configuration will be implemented in the next iteration.</p>
              <div className="config-preview">
                <h4>Current Configuration:</h4>
                <ul>
                  <li>Mode: {deploymentConfig.mode}</li>
                  <li>Initial Capital: {formatCurrency(deploymentConfig.initialCapital)}</li>
                  <li>Max Positions: {deploymentConfig.maxPositions}</li>
                  <li>Execution Frequency: {deploymentConfig.executionFrequency}</li>
                </ul>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => setIsDeployDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                className="primary-btn"
                onClick={() => {
                  console.log("Deploy strategy with config:", deploymentConfig);
                  setIsDeployDialogOpen(false);
                }}
              >
                Deploy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutonomousAgentDashboard;
            className={`tab-btn ${activeTab === 0 ? 'active' : ''}`}
            onClick={() => setActiveTab(0)}
          >
            <Assessment />
            Running Strategies
          </button>
          <button
            className={`tab-btn ${activeTab === 1 ? 'active' : ''}`}
            onClick={() => setActiveTab(1)}
          >
            <Add />
            Strategy Builder
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 0 && (
          <div className="strategies-tab">
            {error && (
              <div className="error-alert">
                <span className="error-icon">⚠️</span>
                <span className="error-message">{error}</span>
                <button className="error-close" onClick={() => setError(null)}>×</button>
              </div>
            )}

            {isLoading && (
              <div className="loading-bar">
                <div className="loading-progress"></div>
              </div>
            )}

            {/* Strategy Cards */}
            <div className="strategy-grid">
              {runningStrategies.map((strategy) => (
                <div key={strategy.id} className="strategy-card">
                  <div className="card-header">
                    <div className="strategy-info">
                      <h3 className="strategy-name">{strategy.strategy?.name || "Unknown Strategy"}</h3>
                      <div className={`status-badge ${strategy.status}`}>
                        <span className="status-dot"></span>
                        {strategy.status.toUpperCase()}
                      </div>
                    </div>
                    <div className="card-actions">
                      <button 
                        className="action-btn"
                        onClick={() => {
                          setSelectedStrategy(strategy);
                          setIsPerformanceDialogOpen(true);
                        }}
                        title="View Performance"
                      >
                        <Visibility />
                      </button>
                      <button className="action-btn" title="Settings">
                        <Settings />
                      </button>
                    </div>
                  </div>

                  <div className="card-content">
                    <div className="performance-summary">
                      <div className="perf-item">
                        <span className="perf-label">Total Return</span>
                        <span className={`perf-value ${strategy.performance.totalReturn >= 0 ? 'positive' : 'negative'}`}>
                          {formatPercentage(strategy.performance.totalReturn)}
                        </span>
                      </div>
                      <div className="perf-item">
                        <span className="perf-label">Current Value</span>
                        <span className="perf-value">
                          {formatCurrency(strategy.performance.currentValue)}
                        </span>
                      </div>
                      <div className="perf-item">
                        <span className="perf-label">Win Rate</span>
                        <span className="perf-value">
                          {strategy.performance.winRate}%
                        </span>
                      </div>
                      <div className="perf-item">
                        <span className="perf-label">Max Drawdown</span>
                        <span className="perf-value negative">
                          {formatPercentage(strategy.performance.maxDrawdown)}
                        </span>
                      </div>
                    </div>

                    <div className="strategy-controls">
                      {strategy.status === "running" && (
                        <button className="control-btn pause">
                          <Pause />
                          Pause
                        </button>
                      )}
                      {strategy.status === "paused" && (
                        <button className="control-btn resume">
                          <PlayArrow />
                          Resume
                        </button>
                      )}
                      <button className="control-btn stop">
                        <Stop />
                        Stop
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {runningStrategies.length === 0 && !isLoading && (
                <div className="empty-state">
                  <div className="empty-icon">🤖</div>
                  <h3>No Running Strategies</h3>
                  <p>Deploy your first autonomous trading strategy to get started</p>
                  <button 
                    className="deploy-btn primary"
                    onClick={() => setIsDeployDialogOpen(true)}
                  >
                    <PlayArrow />
                    Deploy Strategy
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="builder-tab">
            <SimpleStrategyBuilder />
          </div>
        )}
      </div>
                        <Chip
                          label={strategy.status}
                          color={getStatusColor(strategy.status) as any}
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {strategy.strategy?.description || "No description"}
                      </Typography>

                      {/* Performance Metrics */}
                      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 2 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Total Return
                          </Typography>
                          <Typography 
                            variant="body2" 
                            fontWeight="bold"
                            color={strategy.performance.totalReturn >= 0 ? "success.main" : "error.main"}
                          >
                            {formatPercentage(strategy.performance.totalReturn)}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Current Value
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {formatCurrency(strategy.performance.currentValue)}
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Win Rate
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {strategy.performance.winRate}%
                          </Typography>
                        </Box>
                        
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Total Trades
                          </Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {strategy.performance.totalTrades}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {/* Action Buttons */}
                    <Box sx={{ display: "flex", gap: 1, ml: 2 }}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedStrategy(strategy);
                          setIsPerformanceDialogOpen(true);
                        }}
                        title="View Performance"
                      >
                        <Visibility />
                      </IconButton>
                      
                      <IconButton
                        size="small"
                        title="Pause Strategy"
                        disabled={strategy.status !== "running"}
                      >
                        <Pause />
                      </IconButton>
                      
                      <IconButton
                        size="small"
                        title="Stop Strategy"
                        color="error"
                      >
                        <Stop />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}

            {runningStrategies.length === 0 && !isLoading && (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No Running Strategies
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Create and deploy your first autonomous trading strategy
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setActiveTab(1)}
                >
                  Create Strategy
                </Button>
              </Paper>
            )}
          </Box>
        </Box>
      )}

      {/* Strategy Builder Tab */}
      {activeTab === 1 && (
        <SimpleStrategyBuilder />
      )}

      {/* Performance Dialog */}
      <Dialog
        open={isPerformanceDialogOpen}
        onClose={() => setIsPerformanceDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Strategy Performance Details</DialogTitle>
        <DialogContent>
          {selectedStrategy && (
            <Box sx={{ display: "grid", gap: 3 }}>
              <Typography variant="h6">{selectedStrategy.strategy?.name}</Typography>
              
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Total Return</Typography>
                  <Typography variant="h6" color={selectedStrategy.performance.totalReturn >= 0 ? "success.main" : "error.main"}>
                    {formatPercentage(selectedStrategy.performance.totalReturn)}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary">Sharpe Ratio</Typography>
                  <Typography variant="h6">{selectedStrategy.performance.sharpeRatio}</Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary">Max Drawdown</Typography>
                  <Typography variant="h6" color="error.main">
                    {formatPercentage(selectedStrategy.performance.maxDrawdown)}
                  </Typography>
                </Box>
                
                <Box>
                  <Typography variant="caption" color="text.secondary">Win Rate</Typography>
                  <Typography variant="h6">{selectedStrategy.performance.winRate}%</Typography>
                </Box>
              </Box>
              
              <Box>
                <Typography variant="subtitle2" gutterBottom>Trade Summary</Typography>
                <Typography>
                  {selectedStrategy.performance.profitableTrades} profitable out of {selectedStrategy.performance.totalTrades} total trades
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsPerformanceDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deploy Strategy Dialog */}
      <Dialog
        open={isDeployDialogOpen}
        onClose={() => setIsDeployDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Deploy Strategy</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Strategy deployment will be available once you create a strategy using the Strategy Builder.
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Build your strategy first, then deploy it for autonomous trading.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeployDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setIsDeployDialogOpen(false);
              setActiveTab(1);
            }}
          >
            Go to Builder
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AutonomousAgentDashboard;
