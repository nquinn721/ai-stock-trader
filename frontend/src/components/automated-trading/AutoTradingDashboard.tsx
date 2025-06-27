import {
  Assessment,
  Emergency,
  History,
  Home,
  PlayArrow,
  Psychology,
  Settings,
  TrendingUp,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  LinearProgress,
  Switch,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import autonomousTradingApi, {
  DeploymentConfig,
  Portfolio,
} from "../../services/autonomousTradingApi";
import { PageHeader } from "../ui";
import { BehavioralAnalyticsDashboard } from "../behavioral-analytics/BehavioralAnalyticsDashboard";
import { AutoTradeHistory } from "./AutoTradeHistory";
import "./AutoTradingDashboard.css";
import { RuleBuilder } from "./RuleBuilder";
import { TradingControlPanel } from "./TradingControlPanel";
import { TradingPerformanceChart } from "./TradingPerformanceChart";
import TradingRulesManager from "./TradingRulesManager";
import { TradingSessionMonitor } from "./TradingSessionMonitor";

interface TradingSession {
  id: string;
  portfolioId: string;
  portfolioName: string;
  status: "active" | "paused" | "stopped";
  startTime: Date;
  profitLoss: number;
  tradesExecuted: number;
  activeRules: number;
}

interface TradingRule {
  id: string;
  name: string;
  strategy: string;
  isActive: boolean;
  conditions: any[];
  actions: any[];
  performance: {
    totalTrades: number;
    winRate: number;
    profitLoss: number;
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auto-trading-tabpanel-${index}`}
      aria-labelledby={`auto-trading-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const AutoTradingDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isGlobalTradingActive, setIsGlobalTradingActive] = useState(false);
  const [tradingSessions, setTradingSessions] = useState<TradingSession[]>([]);
  const [tradingRules, setTradingRules] = useState<TradingRule[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load available portfolios
      const portfoliosResult =
        await autonomousTradingApi.getAvailablePortfolios();
      if (portfoliosResult.success && portfoliosResult.data) {
        setPortfolios(portfoliosResult.data);

        // Create trading sessions based on actual portfolios
        const sessions = await Promise.all(
          portfoliosResult.data.map(async (portfolio) => {
            try {
              // Try to get performance data for each portfolio
              const performanceResult =
                await autonomousTradingApi.getPortfolioPerformance(
                  portfolio.id
                );
              const performance = performanceResult.success
                ? performanceResult.data
                : null;

              return {
                id: portfolio.id,
                portfolioId: portfolio.id,
                portfolioName: portfolio.name,
                status: "stopped" as const, // Start with all sessions stopped
                startTime: new Date(),
                profitLoss:
                  performance?.totalReturn ||
                  portfolio.totalValue -
                    parseFloat(portfolio.currentCash.toString()),
                tradesExecuted: performance?.dayTradeCount || 0,
                activeRules: 0, // Will be updated when rules are loaded
              };
            } catch (error) {
              console.warn(
                `Failed to load performance for portfolio ${portfolio.id}:`,
                error
              );
              return {
                id: portfolio.id,
                portfolioId: portfolio.id,
                portfolioName: portfolio.name,
                status: "stopped" as const,
                startTime: new Date(),
                profitLoss:
                  portfolio.totalValue -
                  parseFloat(portfolio.currentCash.toString()),
                tradesExecuted: 0,
                activeRules: 0,
              };
            }
          })
        );
        setTradingSessions(sessions);
      }

      // Load active trading strategies from backend
      try {
        const strategiesResult =
          await autonomousTradingApi.getActiveStrategies();
        if (strategiesResult.success && strategiesResult.data) {
          const rules = strategiesResult.data.map((instance) => ({
            id: instance.id,
            name: instance.strategy?.name || `Strategy ${instance.strategyId}`,
            strategy: instance.strategy?.description || "Auto Trading Strategy",
            isActive: instance.status === "running",
            conditions: [], // These would come from strategy definition
            actions: [], // These would come from strategy definition
            performance: {
              totalTrades: instance.performance?.totalTrades || 0,
              winRate: instance.performance?.winRate || 0,
              profitLoss: instance.performance?.totalReturn || 0,
            },
          }));
          setTradingRules(rules);

          // Update session active rules count
          setTradingSessions((prev) =>
            prev.map((session) => ({
              ...session,
              activeRules: rules.filter((rule) => rule.isActive).length,
            }))
          );
        }
      } catch (error) {
        console.warn("Failed to load trading strategies:", error);
        // Fallback to basic rules for demo purposes
        setTradingRules([
          {
            id: "1",
            name: "RSI Oversold Strategy",
            strategy: "Mean Reversion",
            isActive: false,
            conditions: [],
            actions: [],
            performance: {
              totalTrades: 0,
              winRate: 0,
              profitLoss: 0,
            },
          },
          {
            id: "2",
            name: "Moving Average Crossover",
            strategy: "Trend Following",
            isActive: false,
            conditions: [],
            actions: [],
            performance: {
              totalTrades: 0,
              winRate: 0,
              profitLoss: 0,
            },
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading auto trading data:", error);
    }
    setLoading(false);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleEmergencyStop = async () => {
    try {
      // Stop all active strategies
      const activeStrategies = tradingRules.filter((rule) => rule.isActive);
      await Promise.all(
        activeStrategies.map((strategy) =>
          autonomousTradingApi.stopStrategy(strategy.id)
        )
      );

      setIsGlobalTradingActive(false);
      setTradingSessions((prev) =>
        prev.map((session) => ({ ...session, status: "stopped" as const }))
      );

      // Reload data to reflect changes
      await loadData();
    } catch (error) {
      console.error("Error during emergency stop:", error);
    }
  };

  const toggleGlobalTrading = async () => {
    if (isGlobalTradingActive) {
      await handleEmergencyStop();
    } else {
      setIsGlobalTradingActive(true);
      // Note: Individual strategies would need to be started manually
      // This just enables the global trading flag
    }
  };

  const deployStrategy = async (
    strategyId: string,
    deploymentConfig: DeploymentConfig,
    portfolioId: string
  ) => {
    try {
      const configWithPortfolio = {
        ...deploymentConfig,
        portfolioId,
      };

      const result = await autonomousTradingApi.deployStrategy(
        strategyId,
        configWithPortfolio
      );

      if (result.success) {
        // Reload data to reflect the new strategy
        await loadData();
        return result;
      } else {
        throw new Error(result.error || "Failed to deploy strategy");
      }
    } catch (error) {
      console.error("Error deploying strategy:", error);
      throw error;
    }
  };

  const stopStrategy = async (strategyId: string) => {
    try {
      const result = await autonomousTradingApi.stopStrategy(strategyId);
      if (result.success) {
        await loadData();
        return result;
      } else {
        throw new Error(result.error || "Failed to stop strategy");
      }
    } catch (error) {
      console.error("Error stopping strategy:", error);
      throw error;
    }
  };

  const pauseStrategy = async (strategyId: string) => {
    try {
      const result = await autonomousTradingApi.pauseStrategy(strategyId);
      if (result.success) {
        await loadData();
        return result;
      } else {
        throw new Error(result.error || "Failed to pause strategy");
      }
    } catch (error) {
      console.error("Error pausing strategy:", error);
      throw error;
    }
  };

  const resumeStrategy = async (strategyId: string) => {
    try {
      const result = await autonomousTradingApi.resumeStrategy(strategyId);
      if (result.success) {
        await loadData();
        return result;
      } else {
        throw new Error(result.error || "Failed to resume strategy");
      }
    } catch (error) {
      console.error("Error resuming strategy:", error);
      throw error;
    }
  };

  // Calculate aggregated metrics from real data
  const calculateTotalPnL = () => {
    return tradingSessions.reduce(
      (total, session) => total + session.profitLoss,
      0
    );
  };

  const calculateTotalTrades = () => {
    return tradingSessions.reduce(
      (total, session) => total + session.tradesExecuted,
      0
    );
  };

  const calculateWinRate = () => {
    const totalTrades = tradingRules.reduce(
      (total, rule) => total + rule.performance.totalTrades,
      0
    );
    if (totalTrades === 0) return 0;

    const totalWins = tradingRules.reduce(
      (total, rule) =>
        total + (rule.performance.totalTrades * rule.performance.winRate) / 100,
      0
    );

    return (totalWins / totalTrades) * 100;
  };

  if (loading) {
    return (
      <div className="page-container">
        <PageHeader
          title="Auto Trading Dashboard"
          currentTime={new Date()}
          isConnected={false}
          showLiveIndicator={true}
          sticky={true}
          statsValue="Loading..."
          actionButtons={[
            {
              icon: <Home />,
              onClick: () => window.location.href = "/",
              tooltip: "Back to Dashboard",
              className: "nav-btn",
              label: "Dashboard",
            },
          ]}
        />
        <div className="page-content">
          <LinearProgress />
          <Typography variant="h6" sx={{ mt: 2, textAlign: "center" }}>
            Loading Automated Trading Dashboard...
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Standardized Header */}
      <PageHeader
        title="Auto Trading Dashboard"
        currentTime={new Date()}
        isConnected={isGlobalTradingActive}
        showLiveIndicator={true}
        sticky={true}
        statsValue={`${tradingSessions.filter((s) => s.status === "active").length} active sessions • ${tradingSessions.reduce((acc, session) => acc + session.tradesExecuted, 0)} trades`}
        actionButtons={[
          {
            icon: <Home />,
            onClick: () => window.location.href = "/",
            tooltip: "Back to Dashboard",
            className: "nav-btn",
            label: "Dashboard",
          },
          {
            icon: <Emergency />,
            onClick: handleEmergencyStop,
            tooltip: "Emergency Stop All Trading",
            className: "emergency-btn",
            label: "Emergency Stop",
          },
        ]}
      >
        {/* Global Trading Control */}
        <FormControlLabel
          control={
            <Switch
              checked={isGlobalTradingActive}
              onChange={toggleGlobalTrading}
              color="primary"
            />
          }
          label="Global Trading"
          sx={{ ml: 2 }}
        />
      </PageHeader>

      <div className="page-content">
        {/* Status Overview Cards with Modern Design */}
        <div className="status-overview">
          <div className="status-card">
            <div className="status-card-header">
              <div className="status-card-title">
                <Assessment className="status-card-icon" />
                Active Sessions
              </div>
            </div>
            <div className="status-card-value">
              {tradingSessions.filter((s) => s.status === "active").length}
            </div>
            <div className="status-card-subtitle">
              {isGlobalTradingActive ? "Trading Active" : "Trading Paused"}
            </div>
          </div>

          <div className="status-card">
            <div className="status-card-header">
              <div className="status-card-title">
                <TrendingUp className="status-card-icon" />
                Total P&L
              </div>
            </div>
            <div className={`status-card-value ${calculateTotalPnL() >= 0 ? 'performance-positive' : 'performance-negative'}`}>
              ${calculateTotalPnL().toFixed(2)}
            </div>
            <div className="status-card-subtitle">
              Today's Performance
            </div>
          </div>

          <div className="status-card">
            <div className="status-card-header">
              <div className="status-card-title">
                <Psychology className="status-card-icon" />
                Total Trades
              </div>
            </div>
            <div className="status-card-value">
              {calculateTotalTrades()}
            </div>
            <div className="status-card-subtitle">
              All Sessions Combined
            </div>
          </div>

          <div className="status-card">
            <div className="status-card-header">
              <div className="status-card-title">
                <Assessment className="status-card-icon" />
                Win Rate
              </div>
            </div>
            <div className="status-card-value">
              {calculateWinRate().toFixed(1)}%
            </div>
            <div className="status-card-subtitle">
              Success Rate
            </div>
          </div>
        </div>

        {/* Tab Navigation with Modern Design */}
        <div className="ai-trading-tabs">
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            className="main-tabs"
          >
            <Tab icon={<TrendingUp />} label="Live Sessions" />
            <Tab icon={<Settings />} label="Trading Rules" />
            <Tab icon={<History />} label="Trade History" />
            <Tab icon={<Psychology />} label="Behavioral Analysis" />
          </Tabs>
        </div>

        {/* Tab Panels with Modern Styling */}
        <div className="tab-panel-content">
          <TabPanel value={activeTab} index={0}>
            <TradingSessionMonitor
              sessions={tradingSessions}
              isGlobalActive={isGlobalTradingActive}
            />
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <TradingRulesManager portfolioId={portfolios[0]?.id} />
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <AutoTradeHistory />
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            <BehavioralAnalyticsDashboard symbol="SPY" />
          </TabPanel>
        </div>
      </div>
    </div>
  );
};

export default AutoTradingDashboard;
