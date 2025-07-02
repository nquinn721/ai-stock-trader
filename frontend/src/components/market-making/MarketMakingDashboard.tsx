import {
  AccountBalance as AccountBalanceIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  ShowChart as ShowChartIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
} from "@mui/icons-material";
import {
  Alert,
  AlertTitle,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import { FRONTEND_API_CONFIG } from "../../config/api.config";
import "./MarketMakingDashboard.css";

// ===================================
// PHASE 2: REAL-TIME DATA INTERFACES
// ===================================

interface ExchangeOrderBook {
  symbol: string;
  exchange: string;
  timestamp: Date;
  bids: [number, number][];
  asks: [number, number][];
}

interface ExchangeTicker {
  symbol: string;
  exchange: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
}

interface WebSocketSubscription {
  id: string;
  exchange: string;
  symbol: string;
  type: "orderbook" | "ticker" | "trades";
  active: boolean;
  lastUpdate: Date;
}

interface ExchangeStatus {
  exchange: string;
  connected: boolean;
  rateLimitUsed?: number;
  rateLimitRemaining?: number;
  lastError?: string;
}

interface TradingSession {
  id: string;
  exchange: string;
  symbol: string;
  strategyId: string;
  startTime: Date;
  endTime?: Date;
  totalVolume: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalTrades: number;
  profitableTrades: number;
}

// ===================================
// PHASE 1: DASHBOARD INTERFACES
// ===================================

interface MarketMakingStrategy {
  id: string;
  name: string;
  type: "CONSERVATIVE" | "AGGRESSIVE" | "BALANCED" | "SCALPING";
  status: "ACTIVE" | "INACTIVE" | "PAUSED" | "ERROR";
  totalPnl: number;
  sharpeRatio: number;
  maxDrawdown: number;
  totalTrades: number;
  winRate: number;
}

interface ArbitrageOpportunity {
  id: string;
  type: "SPATIAL" | "TEMPORAL" | "STATISTICAL" | "TRIANGULAR";
  profitPotential: number;
  riskScore: number;
  requiredCapital: number;
  confidence: number;
  status: "DETECTED" | "EXECUTING" | "EXECUTED" | "EXPIRED" | "FAILED";
}

interface RiskMetrics {
  var95: number;
  var99: number;
  exposureUtilization: number;
  concentrationRisk: number;
  liquidityRisk: number;
}

interface SystemStatus {
  activeStrategies: number;
  totalVolume24h: number;
  profitToday: number;
  riskUtilization: number;
  arbitrageOpportunities: number;
  lastUpdate: string;
}

const MarketMakingDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [strategies, setStrategies] = useState<MarketMakingStrategy[]>([]);
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<
    ArbitrageOpportunity[]
  >([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ===================================
  // PHASE 2: REAL-TIME DATA STATE
  // ===================================
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const [exchangeStatuses, setExchangeStatuses] = useState<ExchangeStatus[]>(
    []
  );
  const [webSocketSubscriptions, setWebSocketSubscriptions] = useState<
    WebSocketSubscription[]
  >([]);
  const [orderBooks, setOrderBooks] = useState<Map<string, ExchangeOrderBook>>(
    new Map()
  );
  const [tickers, setTickers] = useState<Map<string, ExchangeTicker>>(
    new Map()
  );
  const [tradingSessions, setTradingSessions] = useState<TradingSession[]>([]);
  const [subscriptionDialog, setSubscriptionDialog] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState("");
  const [selectedSymbol, setSelectedSymbol] = useState("");

  useEffect(() => {
    loadDashboardData();
    if (realTimeEnabled) {
      loadExchangeStatus();
      loadWebSocketStatus();
    }
    const interval = setInterval(() => {
      loadDashboardData();
      if (realTimeEnabled) {
        loadExchangeStatus();
        loadWebSocketStatus();
      }
    }, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [realTimeEnabled]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API calls with mock data (replace with actual API calls)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock data - replace with actual API integration
      setStrategies([
        {
          id: "1",
          name: "Conservative MM Strategy",
          type: "CONSERVATIVE",
          status: "ACTIVE",
          totalPnl: 15420.75,
          sharpeRatio: 2.1,
          maxDrawdown: 0.025,
          totalTrades: 1247,
          winRate: 0.68,
        },
        {
          id: "2",
          name: "Aggressive Scalping",
          type: "AGGRESSIVE",
          status: "ACTIVE",
          totalPnl: 8932.4,
          sharpeRatio: 1.8,
          maxDrawdown: 0.045,
          totalTrades: 3421,
          winRate: 0.64,
        },
      ]);

      setArbitrageOpportunities([
        {
          id: "1",
          type: "SPATIAL",
          profitPotential: 0.012,
          riskScore: 0.3,
          requiredCapital: 25000,
          confidence: 0.85,
          status: "DETECTED",
        },
        {
          id: "2",
          type: "STATISTICAL",
          profitPotential: 0.008,
          riskScore: 0.4,
          requiredCapital: 15000,
          confidence: 0.72,
          status: "EXECUTING",
        },
      ]);

      setRiskMetrics({
        var95: 12500,
        var99: 18750,
        exposureUtilization: 0.65,
        concentrationRisk: 0.28,
        liquidityRisk: 0.15,
      });

      setSystemStatus({
        activeStrategies: 5,
        totalVolume24h: 1250000,
        profitToday: 2847.35,
        riskUtilization: 0.65,
        arbitrageOpportunities: 12,
        lastUpdate: new Date().toISOString(),
      });
    } catch (err) {
      setError("Failed to load market making dashboard data");
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "success";
      case "INACTIVE":
        return "default";
      case "PAUSED":
        return "warning";
      case "ERROR":
        return "error";
      case "DETECTED":
        return "info";
      case "EXECUTING":
        return "warning";
      case "EXECUTED":
        return "success";
      case "EXPIRED":
        return "default";
      case "FAILED":
        return "error";
      default:
        return "default";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const loadExchangeStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `${FRONTEND_API_CONFIG.backend.baseUrl}/market-making/exchanges/status`
      );
      const result = await response.json();

      if (result.success) {
        const statuses: ExchangeStatus[] = Object.entries(
          result.data.status
        ).map(([exchange, status]: [string, any]) => ({
          exchange,
          connected: status.connected,
          rateLimitUsed: status.rateLimitUsed,
          rateLimitRemaining: status.rateLimitRemaining,
          lastError: status.lastError,
        }));

        setExchangeStatuses(statuses);
      }
    } catch (error) {
      console.error("Failed to load exchange status:", error);
    }
  }, []);

  const loadWebSocketStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `${FRONTEND_API_CONFIG.backend.baseUrl}/market-making/websocket/status`
      );
      const result = await response.json();

      if (result.success) {
        setWebSocketSubscriptions(result.data.activeSubscriptions);
      }
    } catch (error) {
      console.error("Failed to load WebSocket status:", error);
    }
  }, []);

  const subscribeToOrderBook = async (exchange: string, symbol: string) => {
    try {
      const response = await fetch(
        `${FRONTEND_API_CONFIG.backend.baseUrl}/market-making/websocket/subscribe/orderbook`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ exchange, symbol }),
        }
      );

      const result = await response.json();

      if (result.success) {
        console.log(`Subscribed to order book: ${exchange}:${symbol}`);
        loadWebSocketStatus(); // Refresh subscription list
      }
    } catch (error) {
      console.error("Failed to subscribe to order book:", error);
    }
  };

  const subscribeToTicker = async (exchange: string, symbol: string) => {
    try {
      const response = await fetch(
        `${FRONTEND_API_CONFIG.backend.baseUrl}/market-making/websocket/subscribe/ticker`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ exchange, symbol }),
        }
      );

      const result = await response.json();

      if (result.success) {
        console.log(`Subscribed to ticker: ${exchange}:${symbol}`);
        loadWebSocketStatus(); // Refresh subscription list
      }
    } catch (error) {
      console.error("Failed to subscribe to ticker:", error);
    }
  };

  const unsubscribeFromStream = async (subscriptionId: string) => {
    try {
      const response = await fetch(
        `${FRONTEND_API_CONFIG.backend.baseUrl}/market-making/websocket/subscribe/${subscriptionId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (result.success) {
        console.log(`Unsubscribed from stream: ${subscriptionId}`);
        loadWebSocketStatus(); // Refresh subscription list
      }
    } catch (error) {
      console.error("Failed to unsubscribe:", error);
    }
  };

  const getAggregatedBalances = async () => {
    try {
      const response = await fetch(
        `${FRONTEND_API_CONFIG.backend.baseUrl}/market-making/exchanges/balances`
      );
      const result = await response.json();

      if (result.success) {
        console.log("Aggregated balances:", result.data);
        return result.data;
      }
    } catch (error) {
      console.error("Failed to get aggregated balances:", error);
    }
  };

  const getBestQuotes = async (symbol: string) => {
    try {
      const response = await fetch(
        `${FRONTEND_API_CONFIG.backend.baseUrl}/market-making/exchanges/quotes/${symbol}`
      );
      const result = await response.json();

      if (result.success) {
        return result.data;
      }
    } catch (error) {
      console.error("Failed to get best quotes:", error);
    }
  };

  const startTradingSession = async (
    exchange: string,
    symbol: string,
    strategyId: string
  ) => {
    try {
      const response = await fetch(
        `${FRONTEND_API_CONFIG.backend.baseUrl}/market-making/data/trading-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ exchange, symbol, strategyId }),
        }
      );

      const result = await response.json();

      if (result.success) {
        console.log(`Started trading session: ${result.data.sessionId}`);
        loadTradingSessions(); // Refresh sessions list
      }
    } catch (error) {
      console.error("Failed to start trading session:", error);
    }
  };

  const loadTradingSessions = async () => {
    try {
      const response = await fetch(
        `${FRONTEND_API_CONFIG.backend.baseUrl}/market-making/data/trading-sessions`
      );
      const result = await response.json();

      if (result.success) {
        setTradingSessions(result.data);
      }
    } catch (error) {
      console.error("Failed to load trading sessions:", error);
    }
  };

  const handleSubscriptionSubmit = () => {
    if (selectedExchange && selectedSymbol) {
      Promise.all([
        subscribeToOrderBook(selectedExchange, selectedSymbol),
        subscribeToTicker(selectedExchange, selectedSymbol),
      ]);
      setSubscriptionDialog(false);
      setSelectedExchange("");
      setSelectedSymbol("");
    }
  };

  if (loading) {
    return (
      <Box className="market-making-dashboard loading">
        <Typography variant="h5" gutterBottom>
          Market Making Dashboard
        </Typography>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading market making data...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="market-making-dashboard error">
        <Alert severity="error">
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadDashboardData} sx={{ mt: 2 }}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box className="market-making-dashboard">
      <Typography variant="h4" gutterBottom className="dashboard-title">
        Autonomous Market Making Engine
      </Typography>

      {/* System Status Overview */}
      {systemStatus && (
        <Box
          className="status-overview"
          sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}
        >
          <Card
            className="status-card"
            sx={{ flex: "1 1 200px", minWidth: "200px" }}
          >
            <CardContent>
              <Box className="status-metric">
                <AccountBalanceIcon className="status-icon" />
                <Typography variant="h6">
                  {systemStatus.activeStrategies}
                </Typography>
                <Typography variant="body2">Active Strategies</Typography>
              </Box>
            </CardContent>
          </Card>
          <Card
            className="status-card"
            sx={{ flex: "1 1 200px", minWidth: "200px" }}
          >
            <CardContent>
              <Box className="status-metric">
                <ShowChartIcon className="status-icon" />
                <Typography variant="h6">
                  {formatCurrency(systemStatus.totalVolume24h)}
                </Typography>
                <Typography variant="body2">24h Volume</Typography>
              </Box>
            </CardContent>
          </Card>
          <Card
            className="status-card profit"
            sx={{ flex: "1 1 200px", minWidth: "200px" }}
          >
            <CardContent>
              <Box className="status-metric">
                <TrendingUpIcon className="status-icon" />
                <Typography variant="h6">
                  {formatCurrency(systemStatus.profitToday)}
                </Typography>
                <Typography variant="body2">Today's P&L</Typography>
              </Box>
            </CardContent>
          </Card>
          <Card
            className="status-card"
            sx={{ flex: "1 1 200px", minWidth: "200px" }}
          >
            <CardContent>
              <Box className="status-metric">
                <SecurityIcon className="status-icon" />
                <Typography variant="h6">
                  {formatPercentage(systemStatus.riskUtilization)}
                </Typography>
                <Typography variant="body2">Risk Utilization</Typography>
              </Box>
            </CardContent>
          </Card>
          <Card
            className="status-card"
            sx={{ flex: "1 1 200px", minWidth: "200px" }}
          >
            <CardContent>
              <Box className="status-metric">
                <SpeedIcon className="status-icon" />
                <Typography variant="h6">
                  {systemStatus.arbitrageOpportunities}
                </Typography>
                <Typography variant="body2">Arb Opportunities</Typography>
              </Box>
            </CardContent>
          </Card>
          <Card
            className="status-card"
            sx={{ flex: "1 1 200px", minWidth: "200px" }}
          >
            <CardContent>
              <Box className="status-metric">
                <TimelineIcon className="status-icon" />
                <Typography variant="h6">
                  {new Date(systemStatus.lastUpdate).toLocaleTimeString()}
                </Typography>
                <Typography variant="body2">Last Update</Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Main Content Tabs */}
      <Box className="dashboard-content">
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          className="dashboard-tabs"
        >
          <Tab label="Active Strategies" />
          <Tab label="Arbitrage Opportunities" />
          <Tab label="Risk Management" />
          <Tab label="Performance Analytics" />
          <Tab label="Real-Time Data" />
        </Tabs>

        {/* Strategies Tab */}
        {tabValue === 0 && (
          <Box className="tab-content">
            <Typography variant="h6" gutterBottom>
              Market Making Strategies
            </Typography>
            <TableContainer component={Paper} className="strategies-table">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Strategy Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Total P&L</TableCell>
                    <TableCell align="right">Sharpe Ratio</TableCell>
                    <TableCell align="right">Max Drawdown</TableCell>
                    <TableCell align="right">Win Rate</TableCell>
                    <TableCell align="right">Total Trades</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {strategies.map((strategy) => (
                    <TableRow key={strategy.id}>
                      <TableCell>{strategy.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={strategy.type}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={strategy.status}
                          size="small"
                          color={getStatusColor(strategy.status) as any}
                        />
                      </TableCell>
                      <TableCell
                        align="right"
                        className={strategy.totalPnl >= 0 ? "profit" : "loss"}
                      >
                        {formatCurrency(strategy.totalPnl)}
                      </TableCell>
                      <TableCell align="right">
                        {strategy.sharpeRatio.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        {formatPercentage(strategy.maxDrawdown)}
                      </TableCell>
                      <TableCell align="right">
                        {formatPercentage(strategy.winRate)}
                      </TableCell>
                      <TableCell align="right">
                        {strategy.totalTrades.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Arbitrage Tab */}
        {tabValue === 1 && (
          <Box className="tab-content">
            <Typography variant="h6" gutterBottom>
              Arbitrage Opportunities
            </Typography>
            <TableContainer component={Paper} className="arbitrage-table">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Profit Potential</TableCell>
                    <TableCell align="right">Risk Score</TableCell>
                    <TableCell align="right">Required Capital</TableCell>
                    <TableCell align="right">Confidence</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {arbitrageOpportunities.map((opportunity) => (
                    <TableRow key={opportunity.id}>
                      <TableCell>{opportunity.id}</TableCell>
                      <TableCell>
                        <Chip
                          label={opportunity.type}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={opportunity.status}
                          size="small"
                          color={getStatusColor(opportunity.status) as any}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {formatPercentage(opportunity.profitPotential)}
                      </TableCell>
                      <TableCell align="right">
                        {formatPercentage(opportunity.riskScore)}
                      </TableCell>
                      <TableCell align="right">
                        {formatCurrency(opportunity.requiredCapital)}
                      </TableCell>
                      <TableCell align="right">
                        {formatPercentage(opportunity.confidence)}
                      </TableCell>
                      <TableCell>
                        {opportunity.status === "DETECTED" && (
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() =>
                              console.log("Execute arbitrage:", opportunity.id)
                            }
                          >
                            Execute
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Risk Management Tab */}
        {tabValue === 2 && riskMetrics && (
          <Box className="tab-content">
            <Typography variant="h6" gutterBottom>
              Risk Management Dashboard
            </Typography>
            <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
              <Card
                className="risk-card"
                sx={{ flex: "1 1 300px", minWidth: "300px" }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Value at Risk (VaR)
                  </Typography>
                  <Typography variant="body1">
                    95% VaR: {formatCurrency(riskMetrics.var95)}
                  </Typography>
                  <Typography variant="body1">
                    99% VaR: {formatCurrency(riskMetrics.var99)}
                  </Typography>
                </CardContent>
              </Card>
              <Card
                className="risk-card"
                sx={{ flex: "1 1 300px", minWidth: "300px" }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Risk Utilization
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={riskMetrics.exposureUtilization * 100}
                    className="risk-progress"
                  />
                  <Typography variant="body1">
                    {formatPercentage(riskMetrics.exposureUtilization)} of limit
                  </Typography>
                </CardContent>
              </Card>
              <Card
                className="risk-card"
                sx={{ flex: "1 1 300px", minWidth: "300px" }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Concentration Risk
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={riskMetrics.concentrationRisk * 100}
                    color={
                      riskMetrics.concentrationRisk > 0.5 ? "error" : "primary"
                    }
                    className="risk-progress"
                  />
                  <Typography variant="body1">
                    {formatPercentage(riskMetrics.concentrationRisk)}
                  </Typography>
                </CardContent>
              </Card>
              <Card
                className="risk-card"
                sx={{ flex: "1 1 300px", minWidth: "300px" }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Liquidity Risk
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={riskMetrics.liquidityRisk * 100}
                    color={
                      riskMetrics.liquidityRisk > 0.3 ? "warning" : "primary"
                    }
                    className="risk-progress"
                  />
                  <Typography variant="body1">
                    {formatPercentage(riskMetrics.liquidityRisk)}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>
        )}

        {/* Performance Analytics Tab */}
        {tabValue === 3 && (
          <Box className="tab-content">
            <Typography variant="h6" gutterBottom>
              Performance Analytics
            </Typography>
            <Alert severity="info">
              <AlertTitle>Coming Soon</AlertTitle>
              Advanced performance analytics and strategy optimization tools
              will be available here. Features will include:
              <ul>
                <li>Real-time P&L tracking and attribution</li>
                <li>Strategy performance comparison</li>
                <li>Risk-adjusted return analysis</li>
                <li>Market impact assessment</li>
                <li>Backtesting and scenario analysis</li>
              </ul>
            </Alert>
          </Box>
        )}

        {/* Real-Time Data Tab - PHASE 2 */}
        {tabValue === 4 && (
          <Box className="tab-content">
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h6" gutterBottom>
                Real-Time Market Data & Exchange Integration
              </Typography>
              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={realTimeEnabled}
                      onChange={(e) => setRealTimeEnabled(e.target.checked)}
                    />
                  }
                  label="Enable Real-Time Data"
                />
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => {
                    loadExchangeStatus();
                    loadWebSocketStatus();
                  }}
                >
                  Refresh
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setSubscriptionDialog(true)}
                  disabled={!realTimeEnabled}
                >
                  Subscribe to Data
                </Button>
              </Box>
            </Box>

            {!realTimeEnabled && (
              <Alert severity="info" sx={{ mb: 3 }}>
                <AlertTitle>Real-Time Data Disabled</AlertTitle>
                Enable real-time data to view live market feeds, WebSocket
                subscriptions, and exchange connectivity status.
              </Alert>
            )}

            {realTimeEnabled && (
              <>
                {/* Exchange Status Cards */}
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Exchange Connectivity Status
                </Typography>
                <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
                  {exchangeStatuses.map((status) => (
                    <Card key={status.exchange} sx={{ minWidth: 250 }}>
                      <CardContent>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          {status.connected ? (
                            <WifiIcon color="success" />
                          ) : (
                            <WifiOffIcon color="error" />
                          )}
                          <Typography
                            variant="h6"
                            sx={{ textTransform: "capitalize" }}
                          >
                            {status.exchange}
                          </Typography>
                          <Chip
                            label={
                              status.connected ? "Connected" : "Disconnected"
                            }
                            color={status.connected ? "success" : "error"}
                            size="small"
                          />
                        </Box>
                        {status.connected && (
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Rate Limit: {status.rateLimitUsed || 0}/
                              {status.rateLimitRemaining || 1000}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={
                                ((status.rateLimitUsed || 0) /
                                  (status.rateLimitRemaining || 1000)) *
                                100
                              }
                              sx={{ mt: 1 }}
                            />
                          </Box>
                        )}
                        {status.lastError && (
                          <Typography
                            variant="body2"
                            color="error"
                            sx={{ mt: 1 }}
                          >
                            Last Error: {status.lastError}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Box>

                {/* WebSocket Subscriptions */}
                <Typography variant="h6" gutterBottom>
                  Active WebSocket Subscriptions
                </Typography>
                <TableContainer component={Paper} sx={{ mb: 3 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Exchange</TableCell>
                        <TableCell>Symbol</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Last Update</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {webSocketSubscriptions.map((subscription) => (
                        <TableRow key={subscription.id}>
                          <TableCell>{subscription.exchange}</TableCell>
                          <TableCell>{subscription.symbol}</TableCell>
                          <TableCell>
                            <Chip
                              label={subscription.type}
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                subscription.active ? "Active" : "Inactive"
                              }
                              color={
                                subscription.active ? "success" : "default"
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(
                              subscription.lastUpdate
                            ).toLocaleTimeString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              color="error"
                              onClick={() =>
                                unsubscribeFromStream(subscription.id)
                              }
                            >
                              Unsubscribe
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {webSocketSubscriptions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            No active subscriptions. Click "Subscribe to Data"
                            to start receiving real-time updates.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Trading Sessions */}
                <Typography variant="h6" gutterBottom>
                  Active Trading Sessions
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Session ID</TableCell>
                        <TableCell>Exchange</TableCell>
                        <TableCell>Symbol</TableCell>
                        <TableCell>Strategy</TableCell>
                        <TableCell>Start Time</TableCell>
                        <TableCell>Volume</TableCell>
                        <TableCell>Realized P&L</TableCell>
                        <TableCell>Trades</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tradingSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>{session.id.substring(0, 8)}...</TableCell>
                          <TableCell>{session.exchange}</TableCell>
                          <TableCell>{session.symbol}</TableCell>
                          <TableCell>{session.strategyId}</TableCell>
                          <TableCell>
                            {new Date(session.startTime).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            ${session.totalVolume.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Typography
                              color={
                                session.realizedPnl >= 0
                                  ? "success.main"
                                  : "error.main"
                              }
                            >
                              ${session.realizedPnl.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {session.totalTrades} ({session.profitableTrades}{" "}
                            profitable)
                          </TableCell>
                        </TableRow>
                      ))}
                      {tradingSessions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} align="center">
                            No active trading sessions.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Box>
        )}

        {/* Subscription Dialog */}
        <Dialog
          open={subscriptionDialog}
          onClose={() => setSubscriptionDialog(false)}
        >
          <DialogTitle>Subscribe to Real-Time Data</DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}
            >
              <FormControl fullWidth>
                <InputLabel>Exchange</InputLabel>
                <Select
                  value={selectedExchange}
                  onChange={(e) => setSelectedExchange(e.target.value)}
                  label="Exchange"
                >
                  <MenuItem value="binance">Binance</MenuItem>
                  <MenuItem value="coinbase">Coinbase Pro</MenuItem>
                  <MenuItem value="kraken">Kraken</MenuItem>
                  <MenuItem value="bitfinex">Bitfinex</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Symbol"
                placeholder="e.g., BTCUSDT, ETHUSDT"
                value={selectedSymbol}
                onChange={(e) =>
                  setSelectedSymbol(e.target.value.toUpperCase())
                }
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSubscriptionDialog(false)}>Cancel</Button>
            <Button
              onClick={handleSubscriptionSubmit}
              variant="contained"
              disabled={!selectedExchange || !selectedSymbol}
            >
              Subscribe
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default MarketMakingDashboard;
