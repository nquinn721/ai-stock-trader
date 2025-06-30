import {
  Assessment,
  Close,
  PlayArrow,
  Settings,
  Shuffle,
  Stop,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import StockCard from "../components/StockCard";
import EconomicIntelligenceDashboard from "../components/macro-intelligence/EconomicIntelligenceDashboard";
import {
  ContentCard,
  LoadingState,
  PageHeader,
  StatusChip,
  TradingButton,
} from "../components/ui";
import autoTradingService, {
  DeploymentConfig,
  Portfolio,
  StrategyInstance,
} from "../services/autoTradingService";
import { stockStore } from "../stores/StockStore";
import "./AutonomousTradingPage.css";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`autonomous-trading-tabpanel-${index}`}
      aria-labelledby={`autonomous-trading-tab-${index}`}
      {...other}
    >
      {value === index && <div className="tab-content">{children}</div>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `autonomous-trading-tab-${index}`,
    "aria-controls": `autonomous-trading-tabpanel-${index}`,
  };
}

interface PortfolioTradingStatus {
  portfolioId: string;
  isActive: boolean;
  activeStrategies: StrategyInstance[];
  performance?: {
    totalReturn: number;
    dailyReturn: number;
    totalTrades: number;
  };
}

interface AutonomousTradingPageProps {
  onNavigateBack?: () => void;
}

const AutonomousTradingPage: React.FC<AutonomousTradingPageProps> = observer(
  ({ onNavigateBack }) => {
    const [activeTab, setActiveTab] = useState(0);
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [portfolioStatuses, setPortfolioStatuses] = useState<
      Record<string, PortfolioTradingStatus>
    >({});

    // Get real connection status from WebSocket store
    const [globalTradingActive, setGlobalTradingActive] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showEconomicIntelligence, setShowEconomicIntelligence] =
      useState(false);

    // Strategy deployment modal
    const [deployModalOpen, setDeployModalOpen] = useState(false);
    const [selectedPortfolios, setSelectedPortfolios] = useState<string[]>([]);
    const [deploymentConfig, setDeploymentConfig] = useState<
      Partial<DeploymentConfig>
    >({
      mode: "paper",
      initialCapital: 10000,
      maxPositions: 5,
      executionFrequency: "hour",
      riskLimits: {
        maxDrawdown: 10,
        maxPositionSize: 20,
        dailyLossLimit: 5,
        correlationLimit: 0.7,
      },
      notifications: {
        enabled: true,
        onTrade: true,
        onError: true,
        onRiskBreach: true,
      },
    });

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
      setActiveTab(newValue);
    };

    // Load portfolios and their trading status
    useEffect(() => {
      loadPortfolios();
      loadActiveStrategies();

      // Set up periodic refresh of active strategies
      const refreshInterval = setInterval(() => {
        loadActiveStrategies();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(refreshInterval);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Load active strategies when portfolios change
    useEffect(() => {
      if (portfolios.length > 0 && Object.keys(portfolioStatuses).length > 0) {
        loadActiveStrategies();
      }
    }, [portfolios.length]); // eslint-disable-line react-hooks/exhaustive-deps

    // Load stock data for live market data tab
    useEffect(() => {
      // Fetch initial stock data if not already loaded
      if (!stockStore.isInitialized) {
        stockStore.fetchStocksWithSignals();
      }
    }, []);

    const loadPortfolios = async () => {
      setLoading(true);
      try {
        const response = await autoTradingService.getAvailablePortfolios();
        if (response.success && response.data) {
          setPortfolios(response.data);

          // Initialize portfolio statuses
          const statuses: Record<string, PortfolioTradingStatus> = {};
          response.data.forEach((portfolio) => {
            statuses[portfolio.id] = {
              portfolioId: portfolio.id,
              isActive: false,
              activeStrategies: [],
            };
          });
          setPortfolioStatuses(statuses);
        } else {
          setError(response.error || "Failed to load portfolios");
        }
      } catch (err) {
        setError("Failed to load portfolios");
      } finally {
        setLoading(false);
      }
    };

    const loadActiveStrategies = async () => {
      try {
        const response = await autoTradingService.getActiveStrategies();
        if (response.success && response.data) {
          // Update portfolio statuses based on active strategies
          const updatedStatuses = { ...portfolioStatuses };

          // Reset all portfolios to inactive first
          Object.keys(updatedStatuses).forEach((portfolioId) => {
            updatedStatuses[portfolioId].isActive = false;
            updatedStatuses[portfolioId].activeStrategies = [];
          });

          // Mark portfolios with active strategies
          response.data.forEach((strategy: StrategyInstance) => {
            // Extract portfolio ID from strategy configuration or ID
            const portfolioId = strategy.id.includes("-")
              ? strategy.id.split("-").pop()
              : strategy.strategyId.includes("-")
                ? strategy.strategyId.split("-").pop()
                : null;

            if (portfolioId && updatedStatuses[portfolioId]) {
              updatedStatuses[portfolioId].activeStrategies.push(strategy);
              updatedStatuses[portfolioId].isActive =
                strategy.status === "running";
            }
          });

          setPortfolioStatuses(updatedStatuses);

          // Update global trading status
          const activePortfolios = Object.values(updatedStatuses).filter(
            (status) => status.isActive
          );
          setGlobalTradingActive(activePortfolios.length > 0);
        }
      } catch (err) {
        console.error("Failed to load active strategies:", err);
      }
    };

    const handleStartTrading = async (portfolioId: string) => {
      try {
        setLoading(true);
        setError(null);

        // First, start a trading session for the portfolio
        const sessionData = {
          sessionName: `Autonomous Trading - ${new Date().toLocaleString()}`,
          config: {
            autoTrading: true,
            riskLimits: deploymentConfig.riskLimits,
            maxPositions: deploymentConfig.maxPositions,
            executionFrequency: deploymentConfig.executionFrequency,
            notifications: deploymentConfig.notifications,
          },
        };

        const session = await autoTradingService.startTradingSession(
          portfolioId,
          sessionData
        );

        // Then deploy the autonomous strategy
        const strategyConfig: DeploymentConfig = {
          ...deploymentConfig,
          portfolioId,
          mode: "paper", // Start with paper trading for safety
          initialCapital:
            portfolios.find((p) => p.id === portfolioId)?.currentCash || 10000,
        } as DeploymentConfig;

        const strategyResponse = await autoTradingService.deployStrategy(
          `autonomous-strategy-${portfolioId}`,
          strategyConfig
        );

        if (strategyResponse.success) {
          setPortfolioStatuses((prev) => ({
            ...prev,
            [portfolioId]: {
              ...prev[portfolioId],
              isActive: true,
              activeStrategies: [
                ...prev[portfolioId].activeStrategies,
                strategyResponse.data,
              ],
            },
          }));

          // Show success message
          console.log(
            `Autonomous trading started for portfolio ${portfolioId}`
          );
          console.log(`Strategy deployed: ${strategyResponse.data.strategyId}`);
          console.log(`Trading session: ${session.id}`);
        } else {
          setError(strategyResponse.error || "Failed to deploy strategy");
          // Clean up session if strategy deployment failed
          if (session?.id) {
            await autoTradingService.stopTradingSession(
              session.id,
              "Strategy deployment failed"
            );
          }
        }
      } catch (err: any) {
        setError(`Failed to start autonomous trading: ${err.message || err}`);
        console.error("Error starting autonomous trading:", err);
      } finally {
        setLoading(false);
      }
    };

    const handleStopTrading = async (portfolioId: string) => {
      try {
        setLoading(true);
        setError(null);
        const status = portfolioStatuses[portfolioId];

        if (!status?.activeStrategies?.length) {
          console.warn(
            `No active strategies found for portfolio ${portfolioId}`
          );
          return;
        }

        // Stop all active strategies for this portfolio
        for (const strategy of status.activeStrategies) {
          try {
            const stopResponse = await autoTradingService.stopStrategy(
              strategy.strategyId
            );
            if (!stopResponse.success) {
              console.error(
                `Failed to stop strategy ${strategy.strategyId}:`,
                stopResponse.error
              );
            }
          } catch (err) {
            console.error(
              `Error stopping strategy ${strategy.strategyId}:`,
              err
            );
          }
        }

        // Stop any active trading sessions for this portfolio
        try {
          const activeSessions =
            await autoTradingService.getTradingSessions(portfolioId);
          for (const session of activeSessions) {
            if (session.is_active) {
              await autoTradingService.stopTradingSession(
                session.id,
                "User requested stop"
              );
            }
          }
        } catch (err) {
          console.warn("Could not stop trading sessions:", err);
        }

        // Update UI state
        setPortfolioStatuses((prev) => ({
          ...prev,
          [portfolioId]: {
            ...prev[portfolioId],
            isActive: false,
            activeStrategies: [],
          },
        }));

        console.log(`Autonomous trading stopped for portfolio ${portfolioId}`);
      } catch (err: any) {
        setError(`Failed to stop autonomous trading: ${err.message || err}`);
        console.error("Error stopping autonomous trading:", err);
      } finally {
        setLoading(false);
      }
    };

    const handleGlobalTradingToggle = async () => {
      const newState = !globalTradingActive;
      setGlobalTradingActive(newState);
      setLoading(true);
      setError(null);

      try {
        if (newState) {
          // Start autonomous trading on all portfolios
          let successCount = 0;
          let failCount = 0;

          for (const portfolio of portfolios) {
            if (!portfolioStatuses[portfolio.id]?.isActive) {
              try {
                await handleStartTrading(portfolio.id);
                successCount++;
              } catch (err) {
                failCount++;
                console.error(
                  `Failed to start trading for portfolio ${portfolio.id}:`,
                  err
                );
              }
            }
          }

          if (failCount > 0) {
            setError(
              `Started trading for ${successCount} portfolios, but ${failCount} failed`
            );
          } else {
            console.log(
              `Successfully started autonomous trading for ${successCount} portfolios`
            );
          }
        } else {
          // Stop autonomous trading on all portfolios
          let successCount = 0;
          let failCount = 0;

          for (const portfolio of portfolios) {
            if (portfolioStatuses[portfolio.id]?.isActive) {
              try {
                await handleStopTrading(portfolio.id);
                successCount++;
              } catch (err) {
                failCount++;
                console.error(
                  `Failed to stop trading for portfolio ${portfolio.id}:`,
                  err
                );
              }
            }
          }

          if (failCount > 0) {
            setError(
              `Stopped trading for ${successCount} portfolios, but ${failCount} failed`
            );
          } else {
            console.log(
              `Successfully stopped autonomous trading for ${successCount} portfolios`
            );
          }
        }
      } catch (err: any) {
        setError(`Global trading toggle failed: ${err.message || err}`);
        setGlobalTradingActive(!newState); // Revert state
      } finally {
        setLoading(false);
      }
    };

    const handleAssignRandomStrategy = async (portfolioId: string) => {
      try {
        setLoading(true);
        const response =
          await autoTradingService.assignRandomStrategy(portfolioId);

        if (response.success) {
          // Reload portfolios to show the updated assigned strategy
          await loadPortfolios();

          // Show success message could be added here
          console.log(
            `Random strategy assigned: ${response.data.assignedStrategyName}`
          );
        } else {
          setError(response.error || "Failed to assign random strategy");
        }
      } catch (err) {
        setError("Failed to assign random strategy");
      } finally {
        setLoading(false);
      }
    };

    const handleDeployStrategy = async () => {
      try {
        setLoading(true);
        for (const portfolioId of selectedPortfolios) {
          const config: DeploymentConfig = {
            ...deploymentConfig,
            portfolioId,
          } as DeploymentConfig;

          await autoTradingService.deployStrategy("custom-strategy", config);
        }
        setDeployModalOpen(false);
        setSelectedPortfolios([]);
        await loadActiveStrategies();
      } catch (err) {
        setError("Failed to deploy strategy");
      } finally {
        setLoading(false);
      }
    };

    const renderOverviewTab = () => (
      <div className="overview-tab">
        {/* Global Controls */}
        <ContentCard
          title="Global Autonomous Trading Control"
          variant="gradient"
          padding="lg"
          className="global-controls"
        >
          <div className="control-content">
            <div className="control-left">
              <div className="status-switch">
                <Typography variant="body2">
                  {globalTradingActive
                    ? "Autonomous Trading Active"
                    : "Autonomous Trading Stopped"}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 0.5 }}
                >
                  {globalTradingActive
                    ? "AI is actively buying/selling across all active portfolios"
                    : "Click to start autonomous trading on all portfolios"}
                </Typography>
                <Switch
                  checked={globalTradingActive}
                  onChange={handleGlobalTradingToggle}
                  disabled={loading}
                  color="primary"
                />
              </div>
            </div>
            <div className="control-right">
              <div className="control-stats">
                <Typography variant="body2">
                  Active Portfolios:{" "}
                  {
                    Object.values(portfolioStatuses).filter(
                      (status) => status.isActive
                    ).length
                  }{" "}
                  / {portfolios.length}
                </Typography>
                <Typography variant="body2">
                  Total Active Strategies:{" "}
                  {Object.values(portfolioStatuses).reduce(
                    (total, status) => total + status.activeStrategies.length,
                    0
                  )}
                </Typography>
                <TradingButton
                  variant="primary"
                  onClick={() => setDeployModalOpen(true)}
                  startIcon={<Settings />}
                  size="md"
                  sx={{ mt: 1 }}
                >
                  Deploy Strategy
                </TradingButton>
              </div>
            </div>
          </div>
        </ContentCard>

        {/* Portfolio Cards */}
        <div className="content-grid">
          {portfolios.map((portfolio) => {
            const status = portfolioStatuses[portfolio.id];
            return (
              <ContentCard
                key={portfolio.id}
                title={portfolio.name}
                subtitle={`Total Value: $${portfolio.totalValue.toLocaleString()}`}
                variant="default"
                padding="lg"
                className="portfolio-card"
                headerActions={
                  <StatusChip
                    status={status?.isActive ? "success" : "inactive"}
                    label={status?.isActive ? "Active" : "Inactive"}
                    animated={status?.isActive}
                  />
                }
              >
                <div className="card-content">
                  <div className="info-row">
                    <Typography variant="body2">Cash Available</Typography>
                    <Typography variant="body2">
                      ${portfolio.currentCash.toLocaleString()}
                    </Typography>
                  </div>

                  <div className="info-row">
                    <Typography variant="body2">Active Strategies</Typography>
                    <Typography variant="body2">
                      {status?.activeStrategies.length || 0}
                    </Typography>
                  </div>

                  {status?.isActive && status?.activeStrategies.length > 0 && (
                    <div className="info-row">
                      <Typography variant="body2">Strategy Status</Typography>
                      <StatusChip
                        status={
                          status.activeStrategies[0].status === "running"
                            ? "success"
                            : "warning"
                        }
                        label={status.activeStrategies[0].status.toUpperCase()}
                        size="sm"
                      />
                    </div>
                  )}

                  <div className="strategy-row">
                    <Typography variant="body2">Assigned Strategy</Typography>
                    <TradingButton
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAssignRandomStrategy(portfolio.id)}
                      disabled={loading || status?.isActive}
                      startIcon={<Shuffle />}
                    >
                      {status?.isActive ? "Trading Active" : "Random"}
                    </TradingButton>
                  </div>

                  {portfolio.assignedStrategyName ? (
                    <div className="assigned-strategy">
                      <Typography variant="body2" fontWeight="medium">
                        {portfolio.assignedStrategyName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Assigned{" "}
                        {portfolio.strategyAssignedAt
                          ? new Date(
                              portfolio.strategyAssignedAt
                            ).toLocaleDateString()
                          : "recently"}
                      </Typography>
                    </div>
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontStyle="italic"
                    >
                      No strategy assigned
                    </Typography>
                  )}

                  <Divider />

                  <div className="card-actions">
                    {status?.isActive ? (
                      <TradingButton
                        variant="danger"
                        onClick={() => handleStopTrading(portfolio.id)}
                        disabled={loading}
                        startIcon={<Stop />}
                        fullWidth
                      >
                        Stop Autonomous Trading
                      </TradingButton>
                    ) : (
                      <TradingButton
                        variant="success"
                        onClick={() => handleStartTrading(portfolio.id)}
                        disabled={loading}
                        startIcon={<PlayArrow />}
                        fullWidth
                      >
                        Start Autonomous Trading
                      </TradingButton>
                    )}

                    {status?.isActive && (
                      <Typography
                        variant="caption"
                        sx={{ mt: 1, display: "block", textAlign: "center" }}
                      >
                        AI system is actively buying/selling stocks
                      </Typography>
                    )}
                  </div>
                </div>
              </ContentCard>
            );
          })}
        </div>
      </div>
    );

    const renderPerformanceTab = () => (
      <ContentCard title="Performance Overview" variant="gradient" padding="lg">
        <Alert severity="info">
          Performance metrics will be displayed here once trading sessions are
          active.
        </Alert>
      </ContentCard>
    );

    const renderHistoryTab = () => (
      <ContentCard title="Trading History" variant="gradient" padding="lg">
        <Alert severity="info">
          Trading history and logs will be displayed here.
        </Alert>
      </ContentCard>
    );

    const renderSettingsTab = () => (
      <ContentCard title="Trading Settings" variant="gradient" padding="lg">
        <Alert severity="info">
          Global trading settings and risk management parameters will be
          configured here.
        </Alert>
      </ContentCard>
    );

    const renderLiveMarketDataTab = () => {
      const { stocksWithSignals, isLoading, readyStocks } = stockStore;

      return (
        <div className="live-market-tab">
          <ContentCard
            title="Live Market Data"
            subtitle="Real-time stock prices and trading signals"
            variant="gradient"
            padding="lg"
            className="live-market-header"
            headerActions={
              <div className="header-actions">
                <StatusChip
                  status={readyStocks.length > 0 ? "success" : "inactive"}
                  label={`${readyStocks.length} stocks ready`}
                  animated={readyStocks.length > 0}
                />
                <TradingButton
                  variant="secondary"
                  size="sm"
                  onClick={() => stockStore.fetchStocksWithSignals()}
                  disabled={isLoading}
                  loading={isLoading}
                >
                  Refresh
                </TradingButton>
              </div>
            }
          >
            {isLoading && readyStocks.length === 0 ? (
              <LoadingState
                variant="spinner"
                message="Loading market data..."
                size="lg"
              />
            ) : readyStocks.length === 0 ? (
              <LoadingState
                variant="skeleton"
                message="Waiting for stocks with valid price data. Live updates will appear here automatically."
                size="lg"
              />
            ) : (
              <div className="content-grid stock-grid">
                {stocksWithSignals.slice(0, 20).map((stock) => (
                  <StockCard
                    key={stock.symbol}
                    stock={stock}
                    signal={stock.tradingSignal || undefined}
                  />
                ))}
              </div>
            )}
          </ContentCard>
        </div>
      );
    };

    return (
      <div className="dashboard-page">
        {/* Standardized Page Header */}
        <PageHeader
          title="Autonomous Trading System"
          statsValue={`${Object.values(portfolioStatuses).filter((s) => s.isActive).length}/${portfolios.length} active • ${Object.values(portfolioStatuses).reduce((acc, status) => acc + status.activeStrategies.length, 0)} strategies running`}
          actionButtons={[
            {
              icon: <span>←</span>,
              onClick: () =>
                onNavigateBack
                  ? onNavigateBack()
                  : (window.location.href = "/"),
              tooltip: "Back to Dashboard",
              className: "back-button",
              label: "Back to Dashboard",
            },
            {
              icon: <Assessment />,
              onClick: () => setShowEconomicIntelligence(true),
              tooltip: "Economic Intelligence & Macro Analysis",
              className: "action-btn",
              label: "Economic Intel",
            },
            {
              icon: <Settings />,
              onClick: () => setDeployModalOpen(true),
              tooltip: "Deploy New Strategy",
              className: "action-btn",
              label: "Deploy",
            },
          ]}
        />

        <div className="page-content">
          {/* Enhanced Error Display */}
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
              onClose={() => setError(null)}
            >
              <Typography variant="body2" fontWeight="medium">
                Autonomous Trading Error
              </Typography>
              {error}
            </Alert>
          )}

          {/* Loading State */}
          {loading && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Managing autonomous trading systems... Please wait.
              </Typography>
            </Alert>
          )}

          <ContentCard variant="glass" padding="sm" className="tabs-container">
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="autonomous trading tabs"
              className="main-tabs"
            >
              <Tab label="Overview" {...a11yProps(0)} />
              <Tab label="Live Market Data" {...a11yProps(1)} />
              <Tab label="Performance" {...a11yProps(2)} />
              <Tab label="History" {...a11yProps(3)} />
              <Tab label="Settings" {...a11yProps(4)} />
            </Tabs>
          </ContentCard>

          {loading && (
            <LoadingState
              variant="spinner"
              message="Loading autonomous trading data..."
              size="lg"
              fullHeight={false}
            />
          )}

          <TabPanel value={activeTab} index={0}>
            {renderOverviewTab()}
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {renderLiveMarketDataTab()}
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            {renderPerformanceTab()}
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            {renderHistoryTab()}
          </TabPanel>

          <TabPanel value={activeTab} index={4}>
            {renderSettingsTab()}
          </TabPanel>
        </div>

        {/* Strategy Deployment Modal */}
        <Dialog
          open={deployModalOpen}
          onClose={() => setDeployModalOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              Deploy Trading Strategy
              <IconButton onClick={() => setDeployModalOpen(false)}>
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 1 }}
            >
              <FormControl fullWidth>
                <InputLabel>Select Portfolios</InputLabel>
                <Select
                  multiple
                  value={selectedPortfolios}
                  onChange={(e) =>
                    setSelectedPortfolios(e.target.value as string[])
                  }
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => {
                        const portfolio = portfolios.find(
                          (p) => p.id === value
                        );
                        return (
                          <Chip
                            key={value}
                            label={portfolio?.name || value}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {portfolios.map((portfolio) => (
                    <MenuItem key={portfolio.id} value={portfolio.id}>
                      {portfolio.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ display: "flex", gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Trading Mode</InputLabel>
                  <Select
                    value={deploymentConfig.mode}
                    onChange={(e) =>
                      setDeploymentConfig((prev) => ({
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
                    setDeploymentConfig((prev) => ({
                      ...prev,
                      initialCapital: Number(e.target.value),
                    }))
                  }
                />
              </Box>

              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  fullWidth
                  label="Max Positions"
                  type="number"
                  value={deploymentConfig.maxPositions}
                  onChange={(e) =>
                    setDeploymentConfig((prev) => ({
                      ...prev,
                      maxPositions: Number(e.target.value),
                    }))
                  }
                />

                <FormControl fullWidth>
                  <InputLabel>Execution Frequency</InputLabel>
                  <Select
                    value={deploymentConfig.executionFrequency}
                    onChange={(e) =>
                      setDeploymentConfig((prev) => ({
                        ...prev,
                        executionFrequency: e.target.value as
                          | "minute"
                          | "hour"
                          | "daily",
                      }))
                    }
                  >
                    <MenuItem value="minute">Every Minute</MenuItem>
                    <MenuItem value="hour">Hourly</MenuItem>
                    <MenuItem value="daily">Daily</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeployModalOpen(false)}>Cancel</Button>
            <Button
              onClick={handleDeployStrategy}
              variant="contained"
              disabled={selectedPortfolios.length === 0 || loading}
            >
              Deploy Strategy
            </Button>
          </DialogActions>
        </Dialog>

        {/* Economic Intelligence Dashboard Modal */}
        {showEconomicIntelligence && (
          <Dialog
            open={showEconomicIntelligence}
            onClose={() => setShowEconomicIntelligence(false)}
            maxWidth="xl"
            fullWidth
            fullScreen
          >
            <EconomicIntelligenceDashboard
              onNavigateBack={() => setShowEconomicIntelligence(false)}
            />
          </Dialog>
        )}
      </div>
    );
  }
);

export default AutonomousTradingPage;
