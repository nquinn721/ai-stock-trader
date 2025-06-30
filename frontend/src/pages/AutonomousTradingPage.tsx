import {
  Assessment,
  Close,
  PlayArrow,
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
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
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
import { TradingSession } from "../types/autoTrading.types";
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
  activeSessions: TradingSession[];
  hasActiveSession: boolean;
  assignedStrategyName?: string;
  strategyAssignedAt?: Date;
  performance?: {
    totalReturn: number;
    dailyReturn: number;
    totalTrades: number;
  };
}

interface UnifiedPortfolioStatus {
  isActive: boolean;
  activeStrategiesCount: number;
  hasActiveSession: boolean;
  assignedStrategyName?: string;
  statusText: string;
  statusChip: {
    status: "success" | "warning" | "inactive";
    label: string;
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

    const createCompleteDeploymentConfig = (
      portfolioId: string | number
    ): DeploymentConfig => {
      return {
        mode: deploymentConfig.mode || "paper",
        portfolioId: String(portfolioId),
        initialCapital: deploymentConfig.initialCapital || 10000,
        maxPositions: deploymentConfig.maxPositions || 5,
        executionFrequency: deploymentConfig.executionFrequency || "hour",
        riskLimits: {
          maxDrawdown: deploymentConfig.riskLimits?.maxDrawdown || 10,
          maxPositionSize: deploymentConfig.riskLimits?.maxPositionSize || 20,
          dailyLossLimit: deploymentConfig.riskLimits?.dailyLossLimit || 5,
          correlationLimit:
            deploymentConfig.riskLimits?.correlationLimit || 0.7,
        },
        notifications: {
          enabled: deploymentConfig.notifications?.enabled ?? true,
          onTrade: deploymentConfig.notifications?.onTrade ?? true,
          onError: deploymentConfig.notifications?.onError ?? true,
          onRiskBreach: deploymentConfig.notifications?.onRiskBreach ?? true,
          email: deploymentConfig.notifications?.email,
          webhook: deploymentConfig.notifications?.webhook,
        },
      };
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
      setActiveTab(newValue);
    };

    // Unified portfolio status calculation - SINGLE SOURCE OF TRUTH
    const calculateUnifiedPortfolioStatus = (
      portfolio: Portfolio,
      status: PortfolioTradingStatus
    ): UnifiedPortfolioStatus => {
      const activeStrategiesCount = status.activeStrategies.length;
      const hasActiveSession = status.hasActiveSession;
      const isActive = status.isActive;
      const assignedStrategyName =
        status.assignedStrategyName || portfolio.assignedStrategyName;

      // Single source of truth for status determination
      let statusText: string;
      let chipStatus: "success" | "warning" | "inactive";
      let chipLabel: string;

      if (isActive && hasActiveSession && activeStrategiesCount > 0) {
        statusText = `Trading active with ${activeStrategiesCount} strategy${activeStrategiesCount > 1 ? "ies" : ""}`;
        chipStatus = "success";
        chipLabel = "Active Trading";
      } else if (assignedStrategyName && !isActive) {
        statusText = `Strategy "${assignedStrategyName}" assigned but not trading`;
        chipStatus = "warning";
        chipLabel = "Strategy Assigned";
      } else if (isActive && !hasActiveSession) {
        statusText = "Strategy running but no active session";
        chipStatus = "warning";
        chipLabel = "No Session";
      } else if (hasActiveSession && !isActive) {
        statusText = "Session active but no strategy running";
        chipStatus = "warning";
        chipLabel = "Session Only";
      } else {
        statusText = "No strategy assigned";
        chipStatus = "inactive";
        chipLabel = "Inactive";
      }

      return {
        isActive,
        activeStrategiesCount,
        hasActiveSession,
        assignedStrategyName,
        statusText,
        statusChip: {
          status: chipStatus,
          label: chipLabel,
        },
      };
    };

    // Load portfolios and their trading status
    useEffect(() => {
      loadPortfolios();
      loadActiveStrategies();

      const refreshInterval = setInterval(() => {
        loadActiveStrategies();
      }, 30000);

      return () => clearInterval(refreshInterval);
    }, []);

    useEffect(() => {
      if (portfolios.length > 0) {
        loadActiveStrategies();
      }
    }, [portfolios.length]);

    useEffect(() => {
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

          const statuses: Record<string, PortfolioTradingStatus> = {};
          response.data.forEach((portfolio) => {
            statuses[String(portfolio.id)] = {
              portfolioId: String(portfolio.id),
              isActive: false,
              activeStrategies: [],
              activeSessions: [],
              hasActiveSession: false,
            };
          });
          setPortfolioStatuses(statuses);
        } else {
          setError(response.error || "Failed to load portfolios");
        }
      } catch (err) {
        console.error("Error loading portfolios:", err);
        setError("Failed to load portfolios");
      } finally {
        setLoading(false);
      }
    };

    const loadActiveStrategies = async () => {
      try {
        if (portfolios.length === 0) {
          return;
        }

        const response = await autoTradingService.getActiveStrategies();
        if (response.success && response.data) {
          const updatedStatuses = { ...portfolioStatuses };

          if (Object.keys(updatedStatuses).length === 0) {
            portfolios.forEach((portfolio) => {
              updatedStatuses[String(portfolio.id)] = {
                portfolioId: String(portfolio.id),
                isActive: false,
                activeStrategies: [],
                activeSessions: [],
                hasActiveSession: false,
                assignedStrategyName: portfolio.assignedStrategyName,
                strategyAssignedAt: portfolio.strategyAssignedAt,
              };
            });
          } else {
            // Sync assigned strategy names from portfolio data to status
            portfolios.forEach((portfolio) => {
              const portfolioId = String(portfolio.id);
              if (updatedStatuses[portfolioId]) {
                updatedStatuses[portfolioId].assignedStrategyName =
                  portfolio.assignedStrategyName;
                updatedStatuses[portfolioId].strategyAssignedAt =
                  portfolio.strategyAssignedAt;
              }
            });
          }

          // Reset all portfolios to inactive first
          Object.keys(updatedStatuses).forEach((portfolioId) => {
            updatedStatuses[portfolioId].isActive = false;
            updatedStatuses[portfolioId].activeStrategies = [];
            updatedStatuses[portfolioId].activeSessions = [];
            updatedStatuses[portfolioId].hasActiveSession = false;
          });

          // Mark portfolios with active strategies - improved ID parsing
          response.data.forEach((strategy: StrategyInstance) => {
            let portfolioId: string | null = null;

            if (strategy.id.includes("autonomous-strategy-")) {
              portfolioId = strategy.id.replace("autonomous-strategy-", "");
            } else if (strategy.strategyId.includes("autonomous-strategy-")) {
              portfolioId = strategy.strategyId.replace(
                "autonomous-strategy-",
                ""
              );
            } else if (strategy.id.includes("-")) {
              portfolioId = strategy.id.split("-").pop() || null;
            } else if (strategy.strategyId.includes("-")) {
              portfolioId = strategy.strategyId.split("-").pop() || null;
            } else {
              const portfolio = portfolios.find(
                (p) =>
                  p.assignedStrategyName === strategy.strategyId ||
                  String(p.id) === strategy.strategyId
              );
              if (portfolio) {
                portfolioId = String(portfolio.id);
              }
            }

            if (portfolioId && updatedStatuses[portfolioId]) {
              updatedStatuses[portfolioId].activeStrategies.push(strategy);
              updatedStatuses[portfolioId].isActive =
                strategy.status === "running";

              if (strategy.status === "running" && strategy.strategyId) {
                updatedStatuses[portfolioId].assignedStrategyName =
                  strategy.strategyId;
              }
            }
          });

          // Load active trading sessions for all portfolios
          await Promise.all(
            Object.keys(updatedStatuses).map(async (portfolioId) => {
              try {
                const sessions =
                  await autoTradingService.getTradingSessions(portfolioId);
                const activeSessions = sessions.filter(
                  (session) => session.is_active
                );

                updatedStatuses[portfolioId].activeSessions = activeSessions;
                updatedStatuses[portfolioId].hasActiveSession =
                  activeSessions.length > 0;

                if (
                  activeSessions.length > 0 &&
                  !updatedStatuses[portfolioId].isActive
                ) {
                  updatedStatuses[portfolioId].isActive = true;
                }
              } catch (err) {
                console.warn(
                  `Failed to load sessions for portfolio ${portfolioId}:`,
                  err
                );
                updatedStatuses[portfolioId].activeSessions = [];
                updatedStatuses[portfolioId].hasActiveSession = false;
              }
            })
          );

          setPortfolioStatuses(updatedStatuses);

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

        const sessionData = {
          sessionName: `Autonomous Trading - ${new Date().toLocaleString()}`,
          config: {
            max_daily_trades: 50,
            max_position_size:
              deploymentConfig.riskLimits?.maxPositionSize || 20,
            daily_loss_limit: deploymentConfig.riskLimits?.dailyLossLimit || 5,
            enable_risk_management: true,
            trading_hours: {
              start: "09:30",
              end: "16:00",
              timezone: "US/Eastern",
            },
            allowed_symbols: deploymentConfig.symbols || [],
            excluded_symbols: [],
          },
        };

        const session = await autoTradingService.startTradingSession(
          String(portfolioId),
          sessionData
        );

        const strategyConfig = createCompleteDeploymentConfig(portfolioId);
        strategyConfig.initialCapital =
          portfolios.find((p) => p.id === portfolioId)?.currentCash || 10000;

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
              activeSessions: [...prev[portfolioId].activeSessions, session],
              hasActiveSession: true,
              assignedStrategyName: strategyResponse.data.strategyId,
            },
          }));

          console.log(
            `Autonomous trading started for portfolio ${portfolioId}`
          );
        } else {
          const errorMsg =
            strategyResponse.error || "Failed to deploy strategy";
          setError(`Strategy deployment failed: ${errorMsg}`);

          if (session?.id) {
            await autoTradingService.stopTradingSession(
              session.id,
              "Strategy deployment failed"
            );
          }
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || err;
        setError(`Failed to start autonomous trading: ${errorMessage}`);
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

        for (const session of status.activeSessions) {
          try {
            await autoTradingService.stopTradingSession(
              session.id,
              "User requested stop"
            );
          } catch (err) {
            console.error(`Error stopping session ${session.id}:`, err);
          }
        }

        setPortfolioStatuses((prev) => ({
          ...prev,
          [portfolioId]: {
            ...prev[portfolioId],
            isActive: false,
            activeStrategies: [],
            activeSessions: [],
            hasActiveSession: false,
          },
        }));

        console.log(`Autonomous trading stopped for portfolio ${portfolioId}`);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || err;
        setError(`Failed to stop autonomous trading: ${errorMessage}`);
        console.error("Error stopping autonomous trading:", err);
      } finally {
        setLoading(false);
      }
    };

    const handleDeployStrategies = async () => {
      try {
        setLoading(true);
        setError(null);

        const deployments = selectedPortfolios.map(async (portfolioId) => {
          const config = createCompleteDeploymentConfig(portfolioId);
          return autoTradingService.deployStrategy(
            `autonomous-strategy-${portfolioId}`,
            config
          );
        });

        const results = await Promise.allSettled(deployments);
        const successful = results.filter(
          (result) => result.status === "fulfilled"
        ).length;
        const failed = results.length - successful;

        if (failed > 0) {
          setError(`${failed} deployments failed. ${successful} succeeded.`);
        }

        setDeployModalOpen(false);
        setSelectedPortfolios([]);
        await loadActiveStrategies();
      } catch (err: any) {
        setError(`Deployment failed: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    const renderPortfoliosTab = () => (
      <div className="portfolios-tab">
        <ContentCard
          title="Portfolio Management"
          subtitle="Manage autonomous trading for your portfolios"
          variant="gradient"
          padding="lg"
          className="portfolios-header"
          headerActions={
            <div className="header-actions">
              <StatusChip
                status={globalTradingActive ? "success" : "inactive"}
                label={`${Object.values(portfolioStatuses).filter((s) => s.isActive).length}/${portfolios.length} active`}
                animated={globalTradingActive}
              />
              <TradingButton
                variant="primary"
                size="sm"
                onClick={() => setDeployModalOpen(true)}
                disabled={loading}
                startIcon={<Shuffle />}
              >
                Deploy Strategies
              </TradingButton>
            </div>
          }
        >
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading && portfolios.length === 0 ? (
            <LoadingState
              variant="spinner"
              message="Loading portfolios..."
              size="lg"
            />
          ) : portfolios.length === 0 ? (
            <LoadingState
              variant="skeleton"
              message="No portfolios found. Create a portfolio to start autonomous trading."
              size="lg"
            />
          ) : (
            <div className="content-grid portfolio-grid">
              {portfolios.map((portfolio) => {
                const status = portfolioStatuses[String(portfolio.id)] || {
                  portfolioId: String(portfolio.id),
                  isActive: false,
                  activeStrategies: [],
                  activeSessions: [],
                  hasActiveSession: false,
                };

                // Use unified status calculation - SINGLE SOURCE OF TRUTH
                const unifiedStatus = calculateUnifiedPortfolioStatus(
                  portfolio,
                  status
                );

                return (
                  <ContentCard
                    key={portfolio.id}
                    title={portfolio.name}
                    subtitle={`$${portfolio.currentCash?.toLocaleString() || "0"} available`}
                    variant="default"
                    padding="md"
                    className="portfolio-card"
                    headerActions={
                      <StatusChip
                        status={unifiedStatus.statusChip.status}
                        label={unifiedStatus.statusChip.label}
                        animated={unifiedStatus.isActive}
                      />
                    }
                  >
                    <div className="portfolio-content">
                      <div className="status-section">
                        <Typography variant="body2" color="text.secondary">
                          {unifiedStatus.statusText}
                        </Typography>

                        {unifiedStatus.assignedStrategyName && (
                          <Box sx={{ mt: 1 }}>
                            <Chip
                              label={unifiedStatus.assignedStrategyName}
                              size="small"
                              variant="outlined"
                              color="primary"
                            />
                          </Box>
                        )}

                        {unifiedStatus.activeStrategiesCount > 0 && (
                          <Box
                            sx={{
                              mt: 1,
                              display: "flex",
                              gap: 1,
                              flexWrap: "wrap",
                            }}
                          >
                            {status.activeStrategies.map((strategy, index) => (
                              <Chip
                                key={index}
                                label={`${strategy.strategyId} (${strategy.status})`}
                                size="small"
                                color={
                                  strategy.status === "running"
                                    ? "success"
                                    : "default"
                                }
                              />
                            ))}
                          </Box>
                        )}
                      </div>

                      <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
                        {unifiedStatus.isActive ? (
                          <TradingButton
                            variant="danger"
                            size="sm"
                            onClick={() =>
                              handleStopTrading(String(portfolio.id))
                            }
                            disabled={loading}
                            startIcon={<Stop />}
                            fullWidth
                          >
                            Stop Trading
                          </TradingButton>
                        ) : (
                          <TradingButton
                            variant="success"
                            size="sm"
                            onClick={() =>
                              handleStartTrading(String(portfolio.id))
                            }
                            disabled={loading}
                            startIcon={<PlayArrow />}
                            fullWidth
                          >
                            Start Trading
                          </TradingButton>
                        )}
                      </Box>
                    </div>
                  </ContentCard>
                );
              })}
            </div>
          )}
        </ContentCard>
      </div>
    );

    const renderEconomicIntelligenceTab = () => (
      <div className="economic-intelligence-tab">
        <EconomicIntelligenceDashboard />
      </div>
    );

    const renderAnalyticsTab = () => (
      <ContentCard
        title="Performance Analytics"
        variant="gradient"
        padding="lg"
      >
        <Alert severity="info">
          Detailed performance analytics and trading metrics will be displayed
          here.
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
        <PageHeader
          title="Autonomous Trading System"
          statsValue={`${Object.values(portfolioStatuses).filter((s) => s.isActive).length}/${portfolios.length} active • ${Object.values(portfolioStatuses).reduce((acc, status) => acc + status.activeStrategies.length, 0)} strategies • ${Object.values(portfolioStatuses).filter((s) => s.hasActiveSession).length} sessions`}
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
              onClick: () =>
                setShowEconomicIntelligence(!showEconomicIntelligence),
              tooltip: "Toggle Economic Intelligence",
              className: showEconomicIntelligence ? "active" : "",
              label: "Economic Intelligence",
            },
          ]}
        />

        <div className="dashboard-content">
          <div className="main-content">
            <div className="trading-tabs">
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                className="dashboard-tabs"
              >
                <Tab label="Portfolios" {...a11yProps(0)} />
                <Tab label="Live Market Data" {...a11yProps(1)} />
                <Tab label="Economic Intelligence" {...a11yProps(2)} />
                <Tab label="Analytics" {...a11yProps(3)} />
                <Tab label="Settings" {...a11yProps(4)} />
              </Tabs>

              <TabPanel value={activeTab} index={0}>
                {renderPortfoliosTab()}
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                {renderLiveMarketDataTab()}
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                {renderEconomicIntelligenceTab()}
              </TabPanel>

              <TabPanel value={activeTab} index={3}>
                {renderAnalyticsTab()}
              </TabPanel>

              <TabPanel value={activeTab} index={4}>
                {renderSettingsTab()}
              </TabPanel>
            </div>
          </div>

          {showEconomicIntelligence && (
            <div className="sidebar">
              <EconomicIntelligenceDashboard />
            </div>
          )}
        </div>

        {/* Strategy Deployment Modal */}
        <Dialog
          open={deployModalOpen}
          onClose={() => setDeployModalOpen(false)}
          maxWidth="md"
          fullWidth
          className="deployment-modal"
        >
          <DialogTitle>
            Deploy Autonomous Trading Strategies
            <IconButton
              aria-label="close"
              onClick={() => setDeployModalOpen(false)}
              sx={{ position: "absolute", right: 8, top: 8 }}
            >
              <Close />
            </IconButton>
          </DialogTitle>

          <DialogContent>
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 3, mt: 2 }}
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
                      {(selected as string[]).map((value) => {
                        const portfolio = portfolios.find(
                          (p) => String(p.id) === value
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
                    <MenuItem key={portfolio.id} value={String(portfolio.id)}>
                      {portfolio.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ display: "flex", gap: 2 }}>
                <FormControl>
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

                <TextField
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
              </Box>
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setDeployModalOpen(false)}>Cancel</Button>
            <TradingButton
              variant="primary"
              onClick={handleDeployStrategies}
              disabled={selectedPortfolios.length === 0 || loading}
              loading={loading}
              startIcon={<PlayArrow />}
            >
              Deploy Strategies
            </TradingButton>
          </DialogActions>
        </Dialog>
      </div>
    );
  }
);

export default AutonomousTradingPage;
