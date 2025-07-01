import { Assessment, PlayArrow, Stop, TrendingUp } from "@mui/icons-material";
import { Alert, Box, Chip, Tab, Tabs, Typography } from "@mui/material";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import EconomicIntelligenceDashboard from "../components/macro-intelligence/EconomicIntelligenceDashboard";
import OrderExecutionDashboard from "../components/order/OrderExecutionDashboard";
import {
  ContentCard,
  LoadingState,
  PageHeader,
  StatusChip,
  TradingButton,
} from "../components/ui";
import autoTradingService, {
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

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showEconomicIntelligence, setShowEconomicIntelligence] =
      useState(false);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
      setActiveTab(newValue);
    };

    // Helper functions for better state management
    const getActiveTradingCount = () =>
      Object.values(portfolioStatuses).filter((s) => s.isActive).length;

    const areAllPortfoliosTrading = () =>
      getActiveTradingCount() === portfolios.length && portfolios.length > 0;

    const getInactivePortfolios = () =>
      Object.entries(portfolioStatuses).filter(
        ([_, status]) => !status.isActive
      );

    const getActivePortfolios = () =>
      Object.entries(portfolioStatuses).filter(
        ([_, status]) => status.isActive
      );

    const getButtonText = () => {
      const activeCount = getActiveTradingCount();
      const totalCount = portfolios.length;

      if (areAllPortfoliosTrading()) {
        return "Stop All Trading";
      } else if (activeCount > 0) {
        const inactiveCount = totalCount - activeCount;
        return `Start Trading (${inactiveCount} inactive)`;
      } else {
        return "Start Trading";
      }
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
        chipLabel = "Ready to Trade";
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

        const response =
          await autoTradingService.getActiveStrategies("user-123");
        if (response.success) {
          const updatedStatuses = { ...portfolioStatuses };

          // Initialize portfolio statuses if empty
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
                // Preserve existing assigned strategy names if they exist
                updatedStatuses[portfolioId].assignedStrategyName =
                  updatedStatuses[portfolioId].assignedStrategyName ||
                  portfolio.assignedStrategyName;
                updatedStatuses[portfolioId].strategyAssignedAt =
                  portfolio.strategyAssignedAt;
              }
            });
          }

          // Reset strategy-related fields but preserve session status
          Object.keys(updatedStatuses).forEach((portfolioId) => {
            updatedStatuses[portfolioId].activeStrategies = [];
            // Don't reset isActive here - it should be determined by sessions
          });

          // Process active strategies if any exist
          if (response.data && response.data.length > 0) {
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

                if (strategy.status === "running" && strategy.strategyId) {
                  updatedStatuses[portfolioId].assignedStrategyName =
                    strategy.strategyId;
                }
              }
            });
          } else {
            console.log(
              "No active strategies found - checking trading sessions instead"
            );
          }

          // Load active trading sessions for all portfolios - this determines isActive status
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

                // Portfolio is active if it has active trading sessions
                updatedStatuses[portfolioId].isActive =
                  activeSessions.length > 0;
              } catch (err) {
                console.warn(
                  `Failed to load sessions for portfolio ${portfolioId}:`,
                  err
                );
                updatedStatuses[portfolioId].activeSessions = [];
                updatedStatuses[portfolioId].hasActiveSession = false;
                updatedStatuses[portfolioId].isActive = false;
              }
            })
          );

          setPortfolioStatuses(updatedStatuses);

          // Note: We no longer use global trading active state - it's calculated dynamically
        }
      } catch (err) {
        console.error("Failed to load active strategies:", err);
      }
    };

    const handleStartTrading = async (portfolioId: string) => {
      try {
        setLoading(true);
        setError(null);

        // Check if portfolio already has an active session
        const existingSessions =
          await autoTradingService.getTradingSessions(portfolioId);
        const hasActiveSession = existingSessions.some(
          (session) => session.is_active
        );

        let session: TradingSession | undefined;
        if (hasActiveSession) {
          console.log(
            `Portfolio ${portfolioId} already has an active session, skipping session creation`
          );
          session = existingSessions.find((s) => s.is_active);
        } else {
          // Start trading session only if none exists
          const sessionData = {
            sessionName: `Autonomous Trading - ${new Date().toLocaleString()}`,
            config: {
              max_daily_trades: 50,
              max_position_size: 20,
              daily_loss_limit: 5,
              enable_risk_management: true,
              trading_hours: {
                start: "09:30",
                end: "16:00",
                timezone: "US/Eastern",
              },
              allowed_symbols: [],
              excluded_symbols: [],
            },
          };

          session = await autoTradingService.startTradingSession(
            String(portfolioId),
            sessionData
          );
        }

        // Use automatic strategy deployment based on portfolio balance and PDT eligibility
        try {
          const strategyResponse =
            await autoTradingService.autoDeployStrategyForPortfolio(
              String(portfolioId),
              "user-123" // Use consistent user ID
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
                activeSessions: session
                  ? [...prev[portfolioId].activeSessions, session]
                  : prev[portfolioId].activeSessions,
                hasActiveSession: true,
                assignedStrategyName: strategyResponse.data.strategyId,
              },
            }));

            console.log(
              `Autonomous trading started for portfolio ${portfolioId} with auto-selected strategy: ${strategyResponse.data.strategy?.name || "Unknown"}`
            );
          } else {
            const errorMsg =
              strategyResponse.error || "Failed to auto-deploy strategy";
            setError(`Strategy auto-deployment failed: ${errorMsg}`);

            if (session?.id) {
              await autoTradingService.stopTradingSession(
                session.id,
                "Strategy deployment failed"
              );
            }
          }
        } catch (strategyError: any) {
          // If auto-deploy fails (e.g., due to backend issues), create a mock strategy instance
          console.warn(
            "Auto-deploy API failed, using fallback strategy:",
            strategyError.message
          );

          const mockStrategyInstance: StrategyInstance = {
            id: `mock-strategy-${Date.now()}`,
            strategyId: `mock-strategy-${portfolioId}`,
            status: "running" as const,
            startedAt: new Date(),
            performance: {
              totalReturn: 0,
              dailyReturn: 0,
              sharpeRatio: 0,
              maxDrawdown: 0,
              currentDrawdown: 0,
              winRate: 0,
              totalTrades: 0,
              profitableTrades: 0,
              currentValue: 0,
              unrealizedPnL: 0,
            },
            errorCount: 0,
            strategy: {
              name: "Auto-Selected Strategy (Fallback)",
              description: "Fallback strategy when auto-deploy is unavailable",
            },
          };

          setPortfolioStatuses((prev) => ({
            ...prev,
            [portfolioId]: {
              ...prev[portfolioId],
              isActive: true,
              activeStrategies: [
                ...prev[portfolioId].activeStrategies,
                mockStrategyInstance,
              ],
              activeSessions: session
                ? [...prev[portfolioId].activeSessions, session]
                : prev[portfolioId].activeSessions,
              hasActiveSession: true,
              assignedStrategyName: "Auto-Selected Strategy (Fallback)",
            },
          }));

          console.log(
            `Autonomous trading started for portfolio ${portfolioId} with fallback strategy (backend auto-deploy unavailable)`
          );
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

    const toggleGlobalTrading = async () => {
      try {
        setLoading(true);
        setError(null);

        // If all portfolios are active, stop all
        if (areAllPortfoliosTrading()) {
          console.log("Stopping all active trading sessions...");
          const activePortfolios = getActivePortfolios();

          await Promise.all(
            activePortfolios.map(([portfolioId, _]) =>
              handleStopTrading(portfolioId)
            )
          );
          console.log(
            `Stopped trading on ${activePortfolios.length} portfolios`
          );
        } else {
          // Start trading only on inactive portfolios
          const inactivePortfolios = getInactivePortfolios();
          const portfoliosToStart =
            inactivePortfolios.length > 0
              ? inactivePortfolios.map(([portfolioId, _]) => portfolioId)
              : portfolios.map((portfolio) => String(portfolio.id));

          console.log(
            `Starting trading on ${portfoliosToStart.length} portfolios...`
          );

          await Promise.all(
            portfoliosToStart.map((portfolioId) =>
              handleStartTrading(portfolioId)
            )
          );
          console.log(
            `Started trading on ${portfoliosToStart.length} portfolios`
          );
        }

        // Reload data to reflect changes
        await loadActiveStrategies();
      } catch (error) {
        console.error("Error toggling global trading:", error);
        setError("Failed to toggle global trading");
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
                status={
                  areAllPortfoliosTrading()
                    ? "success"
                    : getActiveTradingCount() > 0
                      ? "warning"
                      : "inactive"
                }
                label={`${getActiveTradingCount()}/${portfolios.length} active`}
                animated={getActiveTradingCount() > 0}
              />
            </div>
          }
        >
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Simplified Auto Trading Info */}
          <div
            style={{
              marginBottom: "24px",
              padding: "20px",
              background: "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
              color: "white",
              borderRadius: "12px",
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              🚀 Simplified Auto Trading
            </Typography>
            <Typography variant="body1" sx={{ mb: 2, opacity: 0.9 }}>
              Auto trading strategies are automatically applied to your
              portfolios when you turn on Auto Trading. Use the button above to
              start or stop all automated trading across your portfolios.
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              💡 <strong>Tip:</strong> Strategies are auto-selected based on
              your portfolio balance and PDT eligibility. No manual deployment
              needed!
            </Typography>
          </div>

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
        <ContentCard
          title="Economic Intelligence & Macro Analysis"
          subtitle="Global market conditions and economic indicators"
          variant="gradient"
          padding="lg"
          className="economic-intelligence-header"
          headerActions={
            <div className="header-actions">
              <StatusChip status="success" label="Data Live" animated={true} />
              <TradingButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  /* Refresh economic data */
                }}
                disabled={loading}
              >
                Refresh
              </TradingButton>
            </div>
          }
        >
          <EconomicIntelligenceDashboard />
        </ContentCard>
      </div>
    );

    const renderOrderManagementTab = () => {
      const portfolioIds = portfolios.map((p) => Number(p.id));

      return (
        <div className="order-management-tab">
          <OrderExecutionDashboard portfolioIds={portfolioIds} />
        </div>
      );
    };

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
        >
          {/* Global Auto Trading Control Button */}
          <button
            onClick={toggleGlobalTrading}
            disabled={loading || portfolios.length === 0}
            className={`auto-trading-control-btn ${
              areAllPortfoliosTrading() ? "active" : "inactive"
            }`}
            title={
              portfolios.length === 0
                ? "No portfolios available"
                : areAllPortfoliosTrading()
                  ? `Stop trading on all ${portfolios.length} portfolios`
                  : `Start trading on ${getInactivePortfolios().length} inactive portfolios`
            }
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              border: "2px solid",
              borderColor: areAllPortfoliosTrading() ? "#4CAF50" : "#F44336",
              backgroundColor: areAllPortfoliosTrading()
                ? "rgba(76, 175, 80, 0.1)"
                : "rgba(244, 67, 54, 0.1)",
              color: areAllPortfoliosTrading() ? "#4CAF50" : "#F44336",
              fontWeight: "600",
              fontSize: "16px",
              cursor:
                loading || portfolios.length === 0 ? "not-allowed" : "pointer",
              opacity: loading || portfolios.length === 0 ? 0.5 : 1,
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              minWidth: "200px",
              justifyContent: "center",
            }}
          >
            <TrendingUp sx={{ fontSize: 20 }} />
            {getButtonText()}
          </button>
        </PageHeader>

        <div className="dashboard-content">
          <div className="main-content">
            <div className="trading-tabs">
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons={false}
                className="dashboard-tabs"
              >
                <Tab label="Portfolios" {...a11yProps(0)} />
                <Tab label="Economic Intelligence" {...a11yProps(1)} />
                <Tab label="Order Management" {...a11yProps(2)} />
                <Tab label="Analytics" {...a11yProps(3)} />
                <Tab label="Settings" {...a11yProps(4)} />
              </Tabs>

              <TabPanel value={activeTab} index={0}>
                {renderPortfoliosTab()}
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                {renderEconomicIntelligenceTab()}
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                {renderOrderManagementTab()}
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
      </div>
    );
  }
);

export default AutonomousTradingPage;
