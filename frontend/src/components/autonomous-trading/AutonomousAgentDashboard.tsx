import {
  Add,
  Assessment,
  Pause,
  PlayArrow,
  Refresh,
  Settings,
  Stop,
  Visibility,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import autonomousTradingApi, {
  DeploymentConfig,
  StrategyInstance,
} from "../../services/autonomousTradingApi";
// import { StrategyBuilder } from "../strategy-builder/StrategyBuilder";

// Remove the duplicate interfaces since they're now imported from the API service

const AutonomousAgentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [runningStrategies, setRunningStrategies] = useState<
    StrategyInstance[]
  >([]);
  const [selectedStrategy, setSelectedStrategy] =
    useState<StrategyInstance | null>(null);
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
        ]);
      }
    } catch (err: any) {
      setError(err.message);
      // Fallback to demo data
      setRunningStrategies([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRunningStrategies();
  }, []);

  const handleStrategyAction = async (
    strategyId: string,
    action: "stop" | "pause" | "resume"
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      let response;
      switch (action) {
        case "stop":
          response = await autonomousTradingApi.stopStrategy(strategyId);
          break;
        case "pause":
          response = await autonomousTradingApi.pauseStrategy(strategyId);
          break;
        case "resume":
          response = await autonomousTradingApi.resumeStrategy(strategyId);
          break;
      }

      if (response.success) {
        // Refresh the strategies list to get updated status
        await loadRunningStrategies();
      } else {
        setError(response.error || `Failed to ${action} strategy`);
        // Fallback to local state update if API fails
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
      }
    } catch (err: any) {
      setError(err.message);
      // Fallback to local state update
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeployStrategy = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use a demo strategy ID since we don't have a strategy selection UI yet
      const demoStrategyId = "demo-strategy-" + Date.now();
      const response = await autonomousTradingApi.deployStrategy(
        demoStrategyId,
        deploymentConfig
      );

      if (response.success) {
        setIsDeployDialogOpen(false);
        await loadRunningStrategies();
      } else {
        setError(response.error || "Failed to deploy strategy");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadRunningStrategies();
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
        return <PlayArrow />;
      case "paused":
        return <Pause />;
      case "stopped":
        return <Stop />;
      case "error":
        return <Assessment />;
      default:
        return <Settings />;
    }
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

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" gutterBottom>
            Autonomous Trading System
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Build, deploy, and manage your automated trading strategies
          </Typography>
        </Box>
        {activeTab === 0 && (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleRefresh}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={() => setIsDeployDialogOpen(true)}
            >
              Deploy Strategy
            </Button>
          </Box>
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(event, newValue) => setActiveTab(newValue)}
          aria-label="autonomous trading tabs"
        >
          <Tab
            label="Running Strategies"
            icon={<Assessment />}
            iconPosition="start"
          />
          <Tab label="Strategy Builder" icon={<Add />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>
          {/* Current strategy management content */}

          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {/* Strategy Cards */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "1fr 1fr",
                lg: "1fr 1fr 1fr",
              },
              gap: 3,
              mb: 4,
            }}
          >
            {runningStrategies.map((strategy) => (
              <Card key={strategy.id}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {strategy.strategy?.name || "Unnamed Strategy"}
                      </Typography>
                      <Chip
                        icon={getStatusIcon(strategy.status)}
                        label={
                          strategy.status.charAt(0).toUpperCase() +
                          strategy.status.slice(1)
                        }
                        color={getStatusColor(strategy.status)}
                        size="small"
                      />
                    </Box>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSelectedStrategy(strategy);
                          setIsPerformanceDialogOpen(true);
                        }}
                      >
                        <Visibility />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Total Return
                    </Typography>
                    <Typography
                      variant="h5"
                      color={
                        strategy.performance.totalReturn >= 0
                          ? "success.main"
                          : "error.main"
                      }
                    >
                      {formatPercentage(strategy.performance.totalReturn)}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Current Value
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatCurrency(strategy.performance.currentValue)}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Win Rate
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {strategy.performance.winRate}%
                      </Typography>
                    </Box>
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={Math.abs(strategy.performance.currentDrawdown)}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Current Drawdown:{" "}
                    {formatPercentage(strategy.performance.currentDrawdown)}
                  </Typography>

                  {strategy.errorCount > 0 && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      {strategy.errorCount} error(s) detected
                    </Alert>
                  )}
                </CardContent>

                <CardActions>
                  {strategy.status === "running" && (
                    <Button
                      size="small"
                      startIcon={<Pause />}
                      onClick={() =>
                        handleStrategyAction(strategy.strategyId, "pause")
                      }
                      disabled={isLoading}
                    >
                      Pause
                    </Button>
                  )}
                  {strategy.status === "paused" && (
                    <Button
                      size="small"
                      startIcon={<PlayArrow />}
                      onClick={() =>
                        handleStrategyAction(strategy.strategyId, "resume")
                      }
                      disabled={isLoading}
                    >
                      Resume
                    </Button>
                  )}
                  <Button
                    size="small"
                    startIcon={<Stop />}
                    onClick={() =>
                      handleStrategyAction(strategy.strategyId, "stop")
                    }
                    disabled={isLoading}
                    color="error"
                  >
                    Stop
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Settings />}
                    disabled={isLoading}
                  >
                    Settings
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Box>

          {/* Recent Trades Table */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Trades
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Strategy</TableCell>
                    <TableCell>Symbol</TableCell>
                    <TableCell>Side</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>P&L</TableCell>
                    <TableCell>Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Mock trade data */}
                  <TableRow>
                    <TableCell>Momentum Breakout</TableCell>
                    <TableCell>AAPL</TableCell>
                    <TableCell>
                      <Chip label="BUY" color="success" size="small" />
                    </TableCell>
                    <TableCell>100</TableCell>
                    <TableCell>$150.25</TableCell>
                    <TableCell>
                      <Typography color="success.main">+$245.00</Typography>
                    </TableCell>
                    <TableCell>2 hours ago</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>RSI Mean Reversion</TableCell>
                    <TableCell>GOOGL</TableCell>
                    <TableCell>
                      <Chip label="SELL" color="error" size="small" />
                    </TableCell>
                    <TableCell>50</TableCell>
                    <TableCell>$2,850.75</TableCell>
                    <TableCell>
                      <Typography color="error.main">-$125.00</Typography>
                    </TableCell>
                    <TableCell>4 hours ago</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Performance Details Dialog */}
          <Dialog
            open={isPerformanceDialogOpen}
            onClose={() => setIsPerformanceDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              {selectedStrategy?.strategy?.name || "Strategy"} Performance
            </DialogTitle>
            <DialogContent>
              {selectedStrategy && (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    gap: 3,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Total Return
                    </Typography>
                    <Typography
                      variant="h4"
                      color={
                        selectedStrategy.performance.totalReturn >= 0
                          ? "success.main"
                          : "error.main"
                      }
                    >
                      {formatPercentage(
                        selectedStrategy.performance.totalReturn
                      )}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Sharpe Ratio
                    </Typography>
                    <Typography variant="h4">
                      {selectedStrategy.performance.sharpeRatio.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Max Drawdown
                    </Typography>
                    <Typography variant="h5" color="error.main">
                      {formatPercentage(
                        selectedStrategy.performance.maxDrawdown
                      )}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Win Rate
                    </Typography>
                    <Typography variant="h5">
                      {selectedStrategy.performance.winRate}%
                    </Typography>
                  </Box>
                  <Box sx={{ gridColumn: "1 / -1" }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Trade Summary
                    </Typography>
                    <Typography>
                      {selectedStrategy.performance.profitableTrades} profitable
                      out of {selectedStrategy.performance.totalTrades} total
                      trades
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
        </Box>
      )}

      {/* Strategy Builder Tab */}
      {activeTab === 1 && (
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Strategy Builder
          </Typography>
          <Typography variant="body1" color="text.secondary">
            The visual strategy builder will be available here. This will allow
            you to:
          </Typography>
          <Box component="ul" sx={{ mt: 2 }}>
            <li>Drag and drop trading components</li>
            <li>Connect indicators and conditions visually</li>
            <li>Set risk management rules</li>
            <li>Backtest your strategies</li>
            <li>Deploy strategies for live/paper trading</li>
          </Box>
          <Alert severity="info" sx={{ mt: 2 }}>
            The Strategy Builder is being enhanced with new features. Coming
            soon!
          </Alert>
        </Box>
      )}

      {/* Deploy Strategy Dialog */}
      <Dialog
        open={isDeployDialogOpen}
        onClose={() => setIsDeployDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Deploy Strategy</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
              mt: 1,
            }}
          >
            <FormControl fullWidth>
              <InputLabel>Mode</InputLabel>
              <Select
                value={deploymentConfig.mode}
                label="Mode"
                onChange={(e) =>
                  setDeploymentConfig((prev: DeploymentConfig) => ({
                    ...prev,
                    mode: e.target.value as "paper" | "live",
                  }))
                }
              >
                <MenuItem value="paper">Paper Trading</MenuItem>
                <MenuItem value="live">Live Trading</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Initial Capital"
              type="number"
              value={deploymentConfig.initialCapital}
              onChange={(e) =>
                setDeploymentConfig((prev: DeploymentConfig) => ({
                  ...prev,
                  initialCapital: Number(e.target.value),
                }))
              }
            />
            <TextField
              fullWidth
              label="Max Positions"
              type="number"
              value={deploymentConfig.maxPositions}
              onChange={(e) =>
                setDeploymentConfig((prev: DeploymentConfig) => ({
                  ...prev,
                  maxPositions: Number(e.target.value),
                }))
              }
            />
            <FormControl fullWidth>
              <InputLabel>Execution Frequency</InputLabel>
              <Select
                value={deploymentConfig.executionFrequency}
                label="Execution Frequency"
                onChange={(e) =>
                  setDeploymentConfig((prev: DeploymentConfig) => ({
                    ...prev,
                    executionFrequency: e.target.value as
                      | "minute"
                      | "hour"
                      | "daily",
                  }))
                }
              >
                <MenuItem value="minute">Every Minute</MenuItem>
                <MenuItem value="hour">Every Hour</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Max Drawdown (%)"
              type="number"
              value={deploymentConfig.riskLimits.maxDrawdown}
              onChange={(e) =>
                setDeploymentConfig((prev: DeploymentConfig) => ({
                  ...prev,
                  riskLimits: {
                    ...prev.riskLimits,
                    maxDrawdown: Number(e.target.value),
                  },
                }))
              }
            />
            <TextField
              fullWidth
              label="Daily Loss Limit ($)"
              type="number"
              value={deploymentConfig.riskLimits.dailyLossLimit}
              onChange={(e) =>
                setDeploymentConfig((prev: DeploymentConfig) => ({
                  ...prev,
                  riskLimits: {
                    ...prev.riskLimits,
                    dailyLossLimit: Number(e.target.value),
                  },
                }))
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeployDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeployStrategy}
            variant="contained"
            disabled={isLoading}
          >
            Deploy
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AutonomousAgentDashboard;
