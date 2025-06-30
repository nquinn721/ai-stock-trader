import {
  faChartLine,
  faClock,
  faExchangeAlt,
  faPause,
  faPlay,
  faRobot,
  faStop,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AutoMode, Chat, Dashboard } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import { FRONTEND_API_CONFIG } from "../config/api.config";
import autoTradingService, {
  StrategyInstance,
} from "../services/autoTradingService";
import { usePortfolioStore } from "../stores/StoreContext";
import "./AnalyticsPage.css";

interface PortfolioAnalytics {
  portfolioId: number;
  portfolioName: string;
  timestamp: string;
  totalValue: number;
  performanceSummary: {
    totalReturn: number;
    dayReturn: number;
    weekReturn: number;
    monthReturn: number;
    yearReturn: number;
    annualizedReturn: number;
    volatility: number;
    sharpeRatio: number;
  };
  sectorAllocation: Array<{
    sector: string;
    value: number;
    percentage: number;
    positions: number;
    averageReturn: number;
    topPerformer: string;
    worstPerformer: string;
  }>;
  topHoldings: Array<{
    symbol: string;
    weight: number;
    value: number;
    return: number;
    contribution: number;
  }>;
  riskMetrics: {
    portfolioVolatility: number;
    beta: number;
    sharpeRatio: number;
    maxDrawdown: number;
    valueAtRisk: number;
    correlationMatrix: { [symbol: string]: { [symbol2: string]: number } };
  };
}

interface AggregatedAnalytics {
  totalPortfolioValue: number;
  totalDayChange: number;
  totalDayChangePercent: number;
  overallPerformance: {
    totalReturn: number;
    annualizedReturn: number;
    sharpeRatio: number;
    volatility: number;
  };
  aggregatedSectors: {
    [sector: string]: { value: number; percentage: number };
  };
  topPerformingPortfolios: Array<{
    name: string;
    return: number;
    value: number;
  }>;
  riskOverview: {
    averageVolatility: number;
    portfolioCount: number;
    totalValueAtRisk: number;
  };
}

interface StrategyAnalytics {
  runningStrategies: StrategyInstance[];
  totalActiveStrategies: number;
  totalTradesToday: number;
  totalAutonomousReturn: number;
  averagePerformance: {
    totalReturn: number;
    sharpeRatio: number;
    winRate: number;
    dailyReturn: number;
  };
  strategyBreakdown: Array<{
    strategyId: string;
    status: string;
    performance: any;
    errorCount: number;
    uptime: number;
  }>;
}

const AnalyticsPage: React.FC = observer(() => {
  const portfolioStore = usePortfolioStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolioAnalytics, setPortfolioAnalytics] = useState<
    PortfolioAnalytics[]
  >([]);
  const [aggregatedData, setAggregatedData] =
    useState<AggregatedAnalytics | null>(null);
  const [strategyAnalytics, setStrategyAnalytics] =
    useState<StrategyAnalytics | null>(null);
  const [strategyLoading, setStrategyLoading] = useState(false);

  // Fetch analytics for all portfolios
  useEffect(() => {
    const fetchAllPortfolioAnalytics = async () => {
      setLoading(true);
      setError(null);

      try {
        // Ensure portfolios are loaded
        if (!portfolioStore.isInitialized) {
          await portfolioStore.initializeDefaultPortfolio();
        }

        if (portfolioStore.portfolios.length === 0) {
          setError("No portfolios available for analysis");
          setLoading(false);
          return;
        }

        const analyticsPromises = portfolioStore.portfolios.map(
          async (portfolio) => {
            try {
              const response = await fetch(
                `${FRONTEND_API_CONFIG.backend.baseUrl}/api/portfolio-analytics/${portfolio.id}`
              );
              if (!response.ok) {
                throw new Error(
                  `Failed to fetch analytics for portfolio ${portfolio.id}`
                );
              }
              const analytics = await response.json();
              return {
                ...analytics,
                portfolioName: portfolio.name,
              };
            } catch (err) {
              console.error(
                `Error fetching analytics for portfolio ${portfolio.id}:`,
                err
              );
              // Return basic data structure if API fails
              return {
                portfolioId: portfolio.id,
                portfolioName: portfolio.name,
                timestamp: new Date().toISOString(),
                totalValue: portfolio.totalValue || 0,
                performanceSummary: {
                  totalReturn: portfolio.totalPnL || 0,
                  dayReturn: 0, // Will be calculated from real data if available
                  weekReturn: 0,
                  monthReturn: 0,
                  yearReturn: 0,
                  annualizedReturn: 0,
                  volatility: 0,
                  sharpeRatio: 0,
                },
                sectorAllocation: [],
                topHoldings: [],
                riskMetrics: {
                  portfolioVolatility: 0,
                  beta: 1,
                  sharpeRatio: 0,
                  maxDrawdown: 0,
                  valueAtRisk: 0,
                  correlationMatrix: {},
                },
              };
            }
          }
        );

        const allAnalytics = await Promise.all(analyticsPromises);
        setPortfolioAnalytics(allAnalytics);

        // Calculate aggregated data
        const aggregated = calculateAggregatedAnalytics(allAnalytics);
        setAggregatedData(aggregated);
      } catch (err) {
        setError("Failed to fetch portfolio analytics");
        console.error("Error fetching analytics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllPortfolioAnalytics();
    fetchStrategyAnalytics();
  }, [portfolioStore]);

  // Fetch autonomous trading strategy analytics
  const fetchStrategyAnalytics = async () => {
    setStrategyLoading(true);
    try {
      const response = await autoTradingService.getRunningStrategies();

      if (response.success && response.data) {
        const strategies = response.data;

        // Calculate aggregated strategy metrics
        const totalReturn = strategies.reduce(
          (sum, strategy) => sum + (strategy.performance?.totalReturn || 0),
          0
        );

        const averageReturn =
          strategies.length > 0 ? totalReturn / strategies.length : 0;

        const averageSharpe =
          strategies.length > 0
            ? strategies.reduce(
                (sum, strategy) =>
                  sum + (strategy.performance?.sharpeRatio || 0),
                0
              ) / strategies.length
            : 0;

        const averageWinRate =
          strategies.length > 0
            ? strategies.reduce(
                (sum, strategy) => sum + (strategy.performance?.winRate || 0),
                0
              ) / strategies.length
            : 0;

        const averageDailyReturn =
          strategies.length > 0
            ? strategies.reduce(
                (sum, strategy) =>
                  sum + (strategy.performance?.dailyReturn || 0),
                0
              ) / strategies.length
            : 0;

        const totalTrades = strategies.reduce(
          (sum, strategy) => sum + (strategy.performance?.totalTrades || 0),
          0
        );

        const strategyBreakdown = strategies.map((strategy) => ({
          strategyId: strategy.strategyId,
          status: strategy.status,
          performance: strategy.performance,
          errorCount: strategy.errorCount || 0,
          uptime: strategy.startedAt
            ? Math.floor(
                (Date.now() - new Date(strategy.startedAt).getTime()) /
                  (1000 * 60 * 60)
              )
            : 0, // hours
        }));

        setStrategyAnalytics({
          runningStrategies: strategies,
          totalActiveStrategies: strategies.filter(
            (s) => s.status === "running"
          ).length,
          totalTradesToday: totalTrades,
          totalAutonomousReturn: totalReturn,
          averagePerformance: {
            totalReturn: averageReturn,
            sharpeRatio: averageSharpe,
            winRate: averageWinRate,
            dailyReturn: averageDailyReturn,
          },
          strategyBreakdown,
        });
      } else {
        // No strategies running
        setStrategyAnalytics({
          runningStrategies: [],
          totalActiveStrategies: 0,
          totalTradesToday: 0,
          totalAutonomousReturn: 0,
          averagePerformance: {
            totalReturn: 0,
            sharpeRatio: 0,
            winRate: 0,
            dailyReturn: 0,
          },
          strategyBreakdown: [],
        });
      }
    } catch (error) {
      console.error("Error fetching strategy analytics:", error);
      setStrategyAnalytics({
        runningStrategies: [],
        totalActiveStrategies: 0,
        totalTradesToday: 0,
        totalAutonomousReturn: 0,
        averagePerformance: {
          totalReturn: 0,
          sharpeRatio: 0,
          winRate: 0,
          dailyReturn: 0,
        },
        strategyBreakdown: [],
      });
    } finally {
      setStrategyLoading(false);
    }
  };

  const calculateAggregatedAnalytics = (
    analytics: PortfolioAnalytics[]
  ): AggregatedAnalytics => {
    const totalValue = analytics.reduce((sum, p) => sum + p.totalValue, 0);
    const totalDayChange = analytics.reduce(
      (sum, p) => sum + (p.performanceSummary.dayReturn * p.totalValue) / 100,
      0
    );
    const totalReturn = analytics.reduce(
      (sum, p) => sum + p.performanceSummary.totalReturn,
      0
    );

    // Aggregate sectors
    const sectors: { [sector: string]: { value: number; percentage: number } } =
      {};
    analytics.forEach((portfolio) => {
      portfolio.sectorAllocation.forEach((sector) => {
        if (!sectors[sector.sector]) {
          sectors[sector.sector] = { value: 0, percentage: 0 };
        }
        sectors[sector.sector].value += sector.value;
      });
    });

    // Calculate sector percentages
    Object.keys(sectors).forEach((sector) => {
      sectors[sector].percentage = (sectors[sector].value / totalValue) * 100;
    });

    // Top performing portfolios
    const topPerforming = analytics
      .map((p) => ({
        name: p.portfolioName,
        return: p.performanceSummary.totalReturn,
        value: p.totalValue,
      }))
      .sort((a, b) => b.return - a.return)
      .slice(0, 5);

    // Risk overview
    const avgVolatility =
      analytics.reduce((sum, p) => sum + p.riskMetrics.portfolioVolatility, 0) /
      analytics.length;
    const totalVar = analytics.reduce(
      (sum, p) => sum + Math.abs(p.riskMetrics.valueAtRisk),
      0
    );

    return {
      totalPortfolioValue: totalValue,
      totalDayChange,
      totalDayChangePercent:
        totalValue > 0 ? (totalDayChange / totalValue) * 100 : 0,
      overallPerformance: {
        totalReturn,
        annualizedReturn:
          analytics.reduce(
            (sum, p) => sum + p.performanceSummary.annualizedReturn,
            0
          ) / analytics.length,
        sharpeRatio:
          analytics.reduce((sum, p) => sum + p.riskMetrics.sharpeRatio, 0) /
          analytics.length,
        volatility: avgVolatility,
      },
      aggregatedSectors: sectors,
      topPerformingPortfolios: topPerforming,
      riskOverview: {
        averageVolatility: avgVolatility,
        portfolioCount: analytics.length,
        totalValueAtRisk: totalVar,
      },
    };
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <PageHeader
          title="Portfolio Analytics"
          statsValue="Loading..."
          actionButtons={[
            {
              icon: <Dashboard />,
              onClick: () => navigate("/dashboard"),
              tooltip: "Trading Dashboard",
              label: "Dashboard",
            },
            {
              icon: <AutoMode />,
              onClick: () => navigate("/autonomous-trading"),
              tooltip: "Autonomous Trading",
              label: "Auto Trade",
            },
            {
              icon: <Chat />,
              onClick: () => navigate("/ai-assistant"),
              tooltip: "AI Trading Assistant",
              label: "AI Chat",
            },
          ]}
        />
        <div className="page-content">
          <EmptyState
            type="loading"
            icon={<FontAwesomeIcon icon={faClock} />}
            title="Loading Analytics"
            description="Compiling comprehensive portfolio analytics from all your portfolios..."
            size="large"
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <PageHeader
          title="Portfolio Analytics"
          statsValue="Error"
          actionButtons={[
            {
              icon: <Dashboard />,
              onClick: () => navigate("/dashboard"),
              tooltip: "Trading Dashboard",
              label: "Dashboard",
            },
            {
              icon: <AutoMode />,
              onClick: () => navigate("/autonomous-trading"),
              tooltip: "Autonomous Trading",
              label: "Auto Trade",
            },
            {
              icon: <Chat />,
              onClick: () => navigate("/ai-assistant"),
              tooltip: "AI Trading Assistant",
              label: "AI Chat",
            },
          ]}
        />
        <div className="page-content">
          <EmptyState
            type="error"
            icon={<FontAwesomeIcon icon={faChartLine} />}
            title="Analytics Unavailable"
            description={error}
            action={{
              label: "Retry",
              onClick: () => window.location.reload(),
            }}
          />
        </div>
      </div>
    );
  }

  if (!portfolioStore.isInitialized || portfolioStore.portfolios.length === 0) {
    return (
      <div className="dashboard-page">
        <PageHeader
          title="Portfolio Analytics"
          statsValue="0 portfolios"
          actionButtons={[
            {
              icon: <Dashboard />,
              onClick: () => navigate("/dashboard"),
              tooltip: "Trading Dashboard",
              label: "Dashboard",
            },
            {
              icon: <AutoMode />,
              onClick: () => navigate("/autonomous-trading"),
              tooltip: "Autonomous Trading",
              label: "Auto Trade",
            },
            {
              icon: <Chat />,
              onClick: () => navigate("/ai-assistant"),
              tooltip: "AI Trading Assistant",
              label: "AI Chat",
            },
          ]}
        />
        <div className="page-content">
          <EmptyState
            type="no-data"
            icon={<FontAwesomeIcon icon={faExchangeAlt} />}
            title="No Portfolios Available"
            description="Create your first portfolio to start viewing comprehensive analytics."
            action={{
              label: "Go to Dashboard",
              onClick: () => (window.location.href = "/"),
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Page Header */}
      <PageHeader
        title="Portfolio Analytics"
        statsValue={`${portfolioStore.portfolios.length} portfolios`}
        actionButtons={[
          {
            icon: <Dashboard />,
            onClick: () => navigate("/dashboard"),
            tooltip: "Trading Dashboard",
            label: "Dashboard",
          },
          {
            icon: <AutoMode />,
            onClick: () => navigate("/autonomous-trading"),
            tooltip: "Autonomous Trading",
            label: "Auto Trade",
          },
          {
            icon: <Chat />,
            onClick: () => navigate("/ai-assistant"),
            tooltip: "AI Trading Assistant",
            label: "AI Chat",
          },
        ]}
      />
      {/* Page Content */}
      <div className="page-content">
        {/* Overview Cards */}
        {aggregatedData && (
          <div className="analytics-overview">
            <div className="overview-cards">
              <div className="overview-card">
                <div className="card-header">
                  <h3>Total Portfolio Value</h3>
                  <FontAwesomeIcon icon={faChartLine} className="card-icon" />
                </div>
                <div className="card-value">
                  $
                  {aggregatedData.totalPortfolioValue.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div
                  className={`card-change ${aggregatedData.totalDayChangePercent >= 0 ? "positive" : "negative"}`}
                >
                  {aggregatedData.totalDayChangePercent >= 0 ? "+" : ""}
                  {aggregatedData.totalDayChangePercent.toFixed(2)}% today
                </div>
              </div>

              <div className="overview-card">
                <div className="card-header">
                  <h3>Total Return</h3>
                  <FontAwesomeIcon icon={faExchangeAlt} className="card-icon" />
                </div>
                <div className="card-value">
                  $
                  {aggregatedData.overallPerformance.totalReturn.toLocaleString(
                    "en-US",
                    { maximumFractionDigits: 2 }
                  )}
                </div>
                <div
                  className={`card-change ${aggregatedData.overallPerformance.totalReturn >= 0 ? "positive" : "negative"}`}
                >
                  Annualized:{" "}
                  {aggregatedData.overallPerformance.annualizedReturn.toFixed(
                    2
                  )}
                  %
                </div>
              </div>

              <div className="overview-card">
                <div className="card-header">
                  <h3>Portfolio Count</h3>
                  <FontAwesomeIcon icon={faExchangeAlt} className="card-icon" />
                </div>
                <div className="card-value">
                  {aggregatedData.riskOverview.portfolioCount}
                </div>
                <div className="card-change">Active portfolios</div>
              </div>

              <div className="overview-card">
                <div className="card-header">
                  <h3>Risk Level</h3>
                  <FontAwesomeIcon icon={faChartLine} className="card-icon" />
                </div>
                <div className="card-value">
                  {aggregatedData.riskOverview.averageVolatility.toFixed(1)}%
                </div>
                <div className="card-change">Average volatility</div>
              </div>
            </div>
          </div>
        )}

        {/* Autonomous Trading Strategy Analytics */}
        {strategyAnalytics && (
          <div className="analytics-section">
            <h2>
              <FontAwesomeIcon
                icon={faRobot}
                style={{ marginRight: "0.5rem" }}
              />
              Autonomous Trading Strategies
            </h2>

            {/* Strategy Overview Cards */}
            <div className="analytics-overview">
              <div className="overview-cards">
                <div className="overview-card">
                  <div className="card-header">
                    <h3>Active Strategies</h3>
                    <FontAwesomeIcon icon={faPlay} className="card-icon" />
                  </div>
                  <div className="card-value">
                    {strategyAnalytics.totalActiveStrategies}
                  </div>
                  <div className="card-change">
                    {strategyAnalytics.runningStrategies.length} total deployed
                  </div>
                </div>

                <div className="overview-card">
                  <div className="card-header">
                    <h3>Total Trades Today</h3>
                    <FontAwesomeIcon
                      icon={faExchangeAlt}
                      className="card-icon"
                    />
                  </div>
                  <div className="card-value">
                    {strategyAnalytics.totalTradesToday}
                  </div>
                  <div className="card-change">Automated executions</div>
                </div>

                <div className="overview-card">
                  <div className="card-header">
                    <h3>Autonomous Returns</h3>
                    <FontAwesomeIcon icon={faChartLine} className="card-icon" />
                  </div>
                  <div className="card-value">
                    $
                    {strategyAnalytics.totalAutonomousReturn.toLocaleString(
                      "en-US",
                      {
                        maximumFractionDigits: 2,
                      }
                    )}
                  </div>
                  <div
                    className={`card-change ${strategyAnalytics.totalAutonomousReturn >= 0 ? "positive" : "negative"}`}
                  >
                    {strategyAnalytics.totalAutonomousReturn >= 0 ? "+" : ""}
                    {(
                      (strategyAnalytics.totalAutonomousReturn / 10000) *
                      100
                    ).toFixed(2)}
                    % of capital
                  </div>
                </div>

                <div className="overview-card">
                  <div className="card-header">
                    <h3>Average Win Rate</h3>
                    <FontAwesomeIcon icon={faChartLine} className="card-icon" />
                  </div>
                  <div className="card-value">
                    {(
                      strategyAnalytics.averagePerformance.winRate * 100
                    ).toFixed(1)}
                    %
                  </div>
                  <div className="card-change">
                    Sharpe:{" "}
                    {strategyAnalytics.averagePerformance.sharpeRatio.toFixed(
                      2
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Strategy Breakdown */}
            {strategyAnalytics.runningStrategies.length > 0 ? (
              <div className="strategy-grid">
                {strategyAnalytics.runningStrategies.map((strategy) => (
                  <div key={strategy.id} className="strategy-card">
                    <div className="strategy-card-header">
                      <h3>{strategy.strategyId}</h3>
                      <div
                        className={`strategy-status strategy-status-${strategy.status}`}
                      >
                        <FontAwesomeIcon
                          icon={
                            strategy.status === "running"
                              ? faPlay
                              : strategy.status === "paused"
                                ? faPause
                                : faStop
                          }
                        />
                        {strategy.status}
                      </div>
                    </div>

                    <div className="strategy-metrics">
                      <div className="metric-row">
                        <span className="metric-label">Total Return:</span>
                        <span
                          className={`metric-value ${(strategy.performance?.totalReturn || 0) >= 0 ? "positive" : "negative"}`}
                        >
                          $
                          {(
                            strategy.performance?.totalReturn || 0
                          ).toLocaleString("en-US", {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>

                      <div className="metric-row">
                        <span className="metric-label">Daily Return:</span>
                        <span
                          className={`metric-value ${(strategy.performance?.dailyReturn || 0) >= 0 ? "positive" : "negative"}`}
                        >
                          {(
                            (strategy.performance?.dailyReturn || 0) * 100
                          ).toFixed(2)}
                          %
                        </span>
                      </div>

                      <div className="metric-row">
                        <span className="metric-label">Total Trades:</span>
                        <span className="metric-value">
                          {strategy.performance?.totalTrades || 0}
                        </span>
                      </div>

                      <div className="metric-row">
                        <span className="metric-label">Win Rate:</span>
                        <span className="metric-value">
                          {((strategy.performance?.winRate || 0) * 100).toFixed(
                            1
                          )}
                          %
                        </span>
                      </div>

                      <div className="metric-row">
                        <span className="metric-label">Sharpe Ratio:</span>
                        <span className="metric-value">
                          {(strategy.performance?.sharpeRatio || 0).toFixed(2)}
                        </span>
                      </div>

                      <div className="metric-row">
                        <span className="metric-label">Max Drawdown:</span>
                        <span className="metric-value negative">
                          {(
                            (strategy.performance?.maxDrawdown || 0) * 100
                          ).toFixed(2)}
                          %
                        </span>
                      </div>

                      <div className="metric-row">
                        <span className="metric-label">Uptime:</span>
                        <span className="metric-value">
                          {strategyAnalytics.strategyBreakdown.find(
                            (s) => s.strategyId === strategy.strategyId
                          )?.uptime || 0}
                          h
                        </span>
                      </div>

                      <div className="metric-row">
                        <span className="metric-label">Errors:</span>
                        <span
                          className={`metric-value ${strategy.errorCount > 0 ? "negative" : ""}`}
                        >
                          {strategy.errorCount}
                        </span>
                      </div>
                    </div>

                    {strategy.performance && (
                      <div className="strategy-performance">
                        <h4>Performance Summary</h4>
                        <div className="performance-row">
                          <span>Current Value:</span>
                          <span className="performance-value">
                            $
                            {(
                              strategy.performance.currentValue || 0
                            ).toLocaleString("en-US", {
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="performance-row">
                          <span>Unrealized P&L:</span>
                          <span
                            className={`performance-value ${(strategy.performance.unrealizedPnL || 0) >= 0 ? "positive" : "negative"}`}
                          >
                            $
                            {(
                              strategy.performance.unrealizedPnL || 0
                            ).toLocaleString("en-US", {
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="performance-row">
                          <span>Profitable Trades:</span>
                          <span className="performance-value">
                            {strategy.performance.profitableTrades || 0} /{" "}
                            {strategy.performance.totalTrades || 0}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-strategies">
                <FontAwesomeIcon
                  icon={faRobot}
                  size="3x"
                  style={{ color: "#6b7280", marginBottom: "1rem" }}
                />
                <h3>No Active Strategies</h3>
                <p>Start autonomous trading to see strategy analytics here.</p>
              </div>
            )}
          </div>
        )}

        {/* Portfolio Breakdown */}
        <div className="analytics-section">
          <h2>Portfolio Breakdown</h2>
          <div className="portfolio-grid">
            {portfolioAnalytics.map((portfolio) => (
              <div key={portfolio.portfolioId} className="portfolio-card">
                <div className="portfolio-card-header">
                  <h3>{portfolio.portfolioName}</h3>
                  <div className="portfolio-value">
                    $
                    {portfolio.totalValue.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>

                <div className="portfolio-metrics">
                  <div className="metric-row">
                    <span className="metric-label">Total Return:</span>
                    <span
                      className={`metric-value ${portfolio.performanceSummary.totalReturn >= 0 ? "positive" : "negative"}`}
                    >
                      $
                      {portfolio.performanceSummary.totalReturn.toLocaleString(
                        "en-US",
                        { maximumFractionDigits: 2 }
                      )}
                    </span>
                  </div>

                  <div className="metric-row">
                    <span className="metric-label">Day Return:</span>
                    <span
                      className={`metric-value ${portfolio.performanceSummary.dayReturn >= 0 ? "positive" : "negative"}`}
                    >
                      {portfolio.performanceSummary.dayReturn.toFixed(2)}%
                    </span>
                  </div>

                  <div className="metric-row">
                    <span className="metric-label">Volatility:</span>
                    <span className="metric-value">
                      {portfolio.riskMetrics.portfolioVolatility.toFixed(1)}%
                    </span>
                  </div>

                  <div className="metric-row">
                    <span className="metric-label">Sharpe Ratio:</span>
                    <span className="metric-value">
                      {portfolio.riskMetrics.sharpeRatio.toFixed(2)}
                    </span>
                  </div>
                </div>

                {portfolio.topHoldings.length > 0 && (
                  <div className="top-holdings">
                    <h4>Top Holdings</h4>
                    {portfolio.topHoldings.slice(0, 3).map((holding, index) => (
                      <div key={index} className="holding-item">
                        <span className="holding-symbol">{holding.symbol}</span>
                        <span className="holding-weight">
                          {holding.weight.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sector Allocation */}
        {aggregatedData &&
          Object.keys(aggregatedData.aggregatedSectors).length > 0 && (
            <div className="analytics-section">
              <h2>Aggregated Sector Allocation</h2>
              <div className="sector-allocation">
                {Object.entries(aggregatedData.aggregatedSectors)
                  .sort(([, a], [, b]) => b.value - a.value)
                  .map(([sector, data]) => (
                    <div key={sector} className="sector-item">
                      <div className="sector-info">
                        <span className="sector-name">{sector}</span>
                        <span className="sector-value">
                          $
                          {data.value.toLocaleString("en-US", {
                            maximumFractionDigits: 0,
                          })}
                        </span>
                      </div>
                      <div className="sector-bar">
                        <div
                          className="sector-fill"
                          style={{
                            width: `${Math.min(data.percentage, 100)}%`,
                          }}
                        ></div>
                      </div>
                      <span className="sector-percentage">
                        {data.percentage.toFixed(1)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

        {/* Top Performing Portfolios */}
        {aggregatedData &&
          aggregatedData.topPerformingPortfolios.length > 0 && (
            <div className="analytics-section">
              <h2>Top Performing Portfolios</h2>
              <div className="top-performers">
                {aggregatedData.topPerformingPortfolios.map(
                  (portfolio, index) => (
                    <div key={index} className="performer-item">
                      <div className="performer-rank">#{index + 1}</div>
                      <div className="performer-info">
                        <div className="performer-name">{portfolio.name}</div>
                        <div className="performer-value">
                          $
                          {portfolio.value.toLocaleString("en-US", {
                            maximumFractionDigits: 0,
                          })}
                        </div>
                      </div>
                      <div
                        className={`performer-return ${portfolio.return >= 0 ? "positive" : "negative"}`}
                      >
                        {portfolio.return >= 0 ? "+" : ""}$
                        {portfolio.return.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
      </div>{" "}
      {/* Close page-content */}
    </div>
  );
});

export default AnalyticsPage;
