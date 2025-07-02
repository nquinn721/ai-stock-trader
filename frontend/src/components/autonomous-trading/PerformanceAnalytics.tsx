import { Assessment, Download, Refresh, TrendingUp } from "@mui/icons-material";
import {
  Alert,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ContentCard, LoadingState, TradingButton } from "../ui";
import "./PerformanceAnalytics.css";

interface PerformanceMetrics {
  totalReturn: number;
  totalReturnPercent: number;
  dailyReturn: number;
  dailyReturnPercent: number;
  totalTrades: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  volatility: number;
  profitFactor: number;
}

interface PerformanceData {
  date: string;
  portfolioValue: number;
  dailyReturn: number;
  cumulativeReturn: number;
  drawdown: number;
}

interface StrategyPerformance {
  strategyId: string;
  strategyName: string;
  performance: PerformanceMetrics;
  isActive: boolean;
}

interface PerformanceAnalyticsProps {
  portfolioIds: string[];
  onExport?: () => void;
}

const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({
  portfolioIds,
  onExport,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>("30d");
  const [selectedMetric, setSelectedMetric] =
    useState<string>("cumulativeReturn");

  const [overallMetrics, setOverallMetrics] =
    useState<PerformanceMetrics | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [strategyPerformances, setStrategyPerformances] = useState<
    StrategyPerformance[]
  >([]);

  const timeRangeOptions = [
    { value: "1d", label: "1 Day" },
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
    { value: "1y", label: "1 Year" },
    { value: "all", label: "All Time" },
  ];

  const metricOptions = [
    { value: "cumulativeReturn", label: "Cumulative Return" },
    { value: "dailyReturn", label: "Daily Return" },
    { value: "portfolioValue", label: "Portfolio Value" },
    { value: "drawdown", label: "Drawdown" },
  ];

  useEffect(() => {
    loadPerformanceData();
  }, [portfolioIds, timeRange]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPerformanceData = async () => {
    if (!portfolioIds || portfolioIds.length === 0) {
      setError("No portfolios available for performance analysis");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load overall performance metrics
      await loadOverallMetrics();

      // Load historical performance data
      await loadHistoricalData();

      // Load strategy-specific performance
      await loadStrategyPerformances();
    } catch (err) {
      console.error("Error loading performance data:", err);
      setError("Failed to load performance data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadOverallMetrics = async () => {
    // Mock implementation - replace with actual API calls
    const mockMetrics: PerformanceMetrics = {
      totalReturn: 2450.75,
      totalReturnPercent: 4.58,
      dailyReturn: 125.3,
      dailyReturnPercent: 0.23,
      totalTrades: 847,
      winRate: 68.5,
      maxDrawdown: -3.2,
      sharpeRatio: 1.42,
      volatility: 12.8,
      profitFactor: 1.85,
    };

    setOverallMetrics(mockMetrics);
  };

  const loadHistoricalData = async () => {
    // Mock historical data - replace with actual API calls
    const mockData: PerformanceData[] = [
      {
        date: "2025-06-01",
        portfolioValue: 50000,
        dailyReturn: 0,
        cumulativeReturn: 0,
        drawdown: 0,
      },
      {
        date: "2025-06-15",
        portfolioValue: 51200,
        dailyReturn: 80,
        cumulativeReturn: 2.4,
        drawdown: 0,
      },
      {
        date: "2025-06-30",
        portfolioValue: 52450,
        dailyReturn: 125,
        cumulativeReturn: 4.9,
        drawdown: -0.5,
      },
      {
        date: "2025-07-02",
        portfolioValue: 52576,
        dailyReturn: 126,
        cumulativeReturn: 5.15,
        drawdown: 0,
      },
    ];

    setPerformanceData(mockData);
  };

  const loadStrategyPerformances = async () => {
    // Mock strategy data - replace with actual API calls
    const mockStrategies: StrategyPerformance[] = [
      {
        strategyId: "day-trading-aggressive",
        strategyName: "Day Trading Aggressive",
        isActive: true,
        performance: {
          totalReturn: 1250.3,
          totalReturnPercent: 2.4,
          dailyReturn: 85.2,
          dailyReturnPercent: 0.16,
          totalTrades: 523,
          winRate: 72.1,
          maxDrawdown: -2.1,
          sharpeRatio: 1.68,
          volatility: 15.2,
          profitFactor: 2.1,
        },
      },
      {
        strategyId: "swing-trading-growth",
        strategyName: "Swing Trading Growth",
        isActive: true,
        performance: {
          totalReturn: 1200.45,
          totalReturnPercent: 2.18,
          dailyReturn: 40.1,
          dailyReturnPercent: 0.07,
          totalTrades: 324,
          winRate: 65.4,
          maxDrawdown: -1.8,
          sharpeRatio: 1.24,
          volatility: 9.8,
          profitFactor: 1.72,
        },
      },
    ];

    setStrategyPerformances(mockStrategies);
  };

  const handleTimeRangeChange = (event: SelectChangeEvent<string>) => {
    setTimeRange(event.target.value);
  };

  const handleMetricChange = (event: SelectChangeEvent<string>) => {
    setSelectedMetric(event.target.value);
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

  if (loading) {
    return <LoadingState message="Loading performance analytics..." />;
  }

  return (
    <div className="performance-analytics">
      {error && (
        <Alert severity="error" className="error-alert">
          {error}
        </Alert>
      )}

      {/* Controls */}
      <div className="analytics-controls">
        <Box className="control-group">
          <FormControl size="small" className="time-range-selector">
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={handleTimeRangeChange}
              label="Time Range"
            >
              {timeRangeOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" className="metric-selector">
            <InputLabel>Metric</InputLabel>
            <Select
              value={selectedMetric}
              onChange={handleMetricChange}
              label="Metric"
            >
              {metricOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box className="action-buttons">
          <TradingButton
            variant="secondary"
            size="sm"
            onClick={loadPerformanceData}
            disabled={loading}
            className="refresh-btn"
          >
            <Refresh className="btn-icon" />
            Refresh
          </TradingButton>

          {onExport && (
            <TradingButton
              variant="secondary"
              size="sm"
              onClick={onExport}
              disabled={loading}
              className="export-btn"
            >
              <Download className="btn-icon" />
              Export
            </TradingButton>
          )}
        </Box>
      </div>

      {/* Overall Performance Metrics */}
      {overallMetrics && (
        <ContentCard
          title="Performance Overview"
          variant="gradient"
          className="metrics-overview"
        >
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Total Return</div>
              <div className="metric-value primary">
                {formatCurrency(overallMetrics.totalReturn)}
              </div>
              <div
                className={`metric-change ${overallMetrics.totalReturnPercent >= 0 ? "positive" : "negative"}`}
              >
                {formatPercentage(overallMetrics.totalReturnPercent)}
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Daily Return</div>
              <div className="metric-value">
                {formatCurrency(overallMetrics.dailyReturn)}
              </div>
              <div
                className={`metric-change ${overallMetrics.dailyReturnPercent >= 0 ? "positive" : "negative"}`}
              >
                {formatPercentage(overallMetrics.dailyReturnPercent)}
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Total Trades</div>
              <div className="metric-value">
                {overallMetrics.totalTrades.toLocaleString()}
              </div>
              <div className="metric-subtext">trades executed</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Win Rate</div>
              <div className="metric-value">
                {overallMetrics.winRate.toFixed(1)}%
              </div>
              <div className="metric-subtext">successful trades</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Max Drawdown</div>
              <div className="metric-value negative">
                {formatPercentage(overallMetrics.maxDrawdown)}
              </div>
              <div className="metric-subtext">peak to trough</div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Sharpe Ratio</div>
              <div className="metric-value">
                {overallMetrics.sharpeRatio.toFixed(2)}
              </div>
              <div className="metric-subtext">risk-adjusted return</div>
            </div>
          </div>
        </ContentCard>
      )}

      {/* Performance Chart */}
      <ContentCard
        title="Performance Chart"
        variant="gradient"
        className="performance-chart"
      >
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
              />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.7)"
                fontSize={12}
              />
              <YAxis stroke="rgba(255,255,255,0.7)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(0,0,0,0.8)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey={selectedMetric}
                stroke="#00ff88"
                strokeWidth={2}
                dot={{ fill: "#00ff88", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "#00ff88" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </ContentCard>

      {/* Strategy Performance Comparison */}
      <ContentCard
        title="Strategy Performance"
        variant="gradient"
        className="strategy-performance"
      >
        <div className="strategy-table">
          <div className="table-header">
            <div className="header-cell">Strategy</div>
            <div className="header-cell">Status</div>
            <div className="header-cell">Total Return</div>
            <div className="header-cell">Daily Return</div>
            <div className="header-cell">Trades</div>
            <div className="header-cell">Win Rate</div>
            <div className="header-cell">Sharpe</div>
          </div>

          {strategyPerformances.map((strategy) => (
            <div key={strategy.strategyId} className="table-row">
              <div className="table-cell strategy-name">
                <Assessment className="strategy-icon" />
                {strategy.strategyName}
              </div>
              <div className="table-cell">
                <span
                  className={`status-badge ${strategy.isActive ? "active" : "inactive"}`}
                >
                  {strategy.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="table-cell">
                <div className="return-cell">
                  <span className="currency">
                    {formatCurrency(strategy.performance.totalReturn)}
                  </span>
                  <span
                    className={`percentage ${strategy.performance.totalReturnPercent >= 0 ? "positive" : "negative"}`}
                  >
                    {formatPercentage(strategy.performance.totalReturnPercent)}
                  </span>
                </div>
              </div>
              <div className="table-cell">
                <div className="return-cell">
                  <span className="currency">
                    {formatCurrency(strategy.performance.dailyReturn)}
                  </span>
                  <span
                    className={`percentage ${strategy.performance.dailyReturnPercent >= 0 ? "positive" : "negative"}`}
                  >
                    {formatPercentage(strategy.performance.dailyReturnPercent)}
                  </span>
                </div>
              </div>
              <div className="table-cell">
                {strategy.performance.totalTrades}
              </div>
              <div className="table-cell">
                {strategy.performance.winRate.toFixed(1)}%
              </div>
              <div className="table-cell">
                {strategy.performance.sharpeRatio.toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        {strategyPerformances.length === 0 && (
          <div className="no-strategies">
            <TrendingUp className="no-data-icon" />
            <div className="no-data-text">No active strategies found</div>
            <div className="no-data-subtext">
              Deploy strategies to see performance data
            </div>
          </div>
        )}
      </ContentCard>
    </div>
  );
};

export default PerformanceAnalytics;
