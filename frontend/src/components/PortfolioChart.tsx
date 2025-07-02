import { observer } from "mobx-react-lite";
import React, { useCallback, useEffect, useState } from "react";
import { usePortfolioStore } from "../stores/StoreContext";
import "./PortfolioChart.css";

interface PortfolioChartProps {
  portfolioId?: number;
  timeframe?: "1D" | "1W" | "1M" | "3M" | "1Y";
  height?: number;
  onTimeframeChange?: (timeframe: "1D" | "1W" | "1M" | "3M" | "1Y") => void;
}

interface PerformancePoint {
  date: string;
  totalValue: number;
  cash: number;
  investedValue: number;
  profit: number;
  percentReturn: number;
}

interface ChartData {
  performanceHistory: PerformancePoint[];
  benchmarkData?: PerformancePoint[];
  metrics: {
    totalReturn: number;
    totalReturnPercent: number;
    maxDrawdown: number;
    volatility: number;
    sharpeRatio: number;
    bestDay: number;
    worstDay: number;
  };
}

const PortfolioChart: React.FC<PortfolioChartProps> = observer(
  ({
    portfolioId = 1,
    timeframe: propTimeframe = "1M",
    height = 300,
    onTimeframeChange,
  }: PortfolioChartProps) => {
    const portfolioStore = usePortfolioStore();
    const [chartData, setChartData] = useState<ChartData | null>(null);
    const [selectedMetric, setSelectedMetric] = useState<
      "value" | "return" | "profit"
    >("value");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [showBenchmark, setShowBenchmark] = useState(false);
    const [internalTimeframe, setInternalTimeframe] = useState(propTimeframe); // Use internal timeframe if no external handler provided
    const currentTimeframe = onTimeframeChange
      ? propTimeframe
      : internalTimeframe;

    const fetchPortfolioPerformance = useCallback(async () => {
      try {
        console.log("🔍 Fetching portfolio performance for ID:", portfolioId);
        // Fetch performance history from MobX store
        await portfolioStore.fetchPerformanceHistory(
          portfolioId,
          currentTimeframe
        );

        console.log(
          "📊 Performance history loaded:",
          portfolioStore.performanceHistory.length,
          "points"
        );

        // Transform MobX store data to chart format
        if (portfolioStore.performanceHistory.length > 0) {
          const transformedData: ChartData = {
            performanceHistory: portfolioStore.performanceHistory.map(
              (point) => ({
                date: point.date,
                totalValue: point.totalValue,
                cash: point.cash,
                investedValue: point.investedValue,
                profit: point.dayChange,
                percentReturn: point.dayChangePercent,
              })
            ),
            metrics: {
              totalReturn: portfolioStore.totalReturn,
              totalReturnPercent: portfolioStore.totalReturnPercent,
              maxDrawdown: 0, // Would need to calculate or fetch from backend
              volatility: 0, // Would need to calculate or fetch from backend
              sharpeRatio: 0, // Would need to calculate or fetch from backend
              bestDay: 0, // Would need to calculate or fetch from backend
              worstDay: 0, // Would need to calculate or fetch from backend
            },
          };
          console.log(
            "✅ Chart data transformed successfully:",
            transformedData
          );
          setChartData(transformedData);
        } else {
          console.log("📊 No performance history available");
          setChartData(null);
        }
      } catch (error) {
        console.error("⚠️ Portfolio Chart Error:", error);
        setChartData(null);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [portfolioId, currentTimeframe, portfolioStore]);

    useEffect(() => {
      fetchPortfolioPerformance();
    }, [fetchPortfolioPerformance]);

    const calculateVolatility = (returns: number[]): number => {
      if (returns.length < 2) return 0;
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance =
        returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) /
        returns.length;
      return Math.sqrt(variance);
    };

    const renderChart = () => {
      if (!chartData) return null;
      const { performanceHistory } = chartData;

      // Filter out invalid data points and ensure we have valid numbers
      const validHistory = performanceHistory.filter((p) => {
        const value =
          selectedMetric === "return"
            ? p.percentReturn
            : selectedMetric === "profit"
              ? p.profit
              : p.totalValue;
        return typeof value === "number" && !isNaN(value) && isFinite(value);
      });

      if (validHistory.length === 0) {
        return (
          <div className="chart-container">
            <div className="no-data-message">No valid chart data available</div>
          </div>
        );
      }

      const values = validHistory.map((p) => {
        switch (selectedMetric) {
          case "return":
            return p.percentReturn;
          case "profit":
            return p.profit;
          default:
            return p.totalValue;
        }
      });

      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      const valueRange = maxValue - minValue || 1;

      const points = validHistory
        .map((point, index) => {
          const x = (index / (validHistory.length - 1)) * 90 + 5; // 5% margin
          const value =
            selectedMetric === "return"
              ? point.percentReturn
              : selectedMetric === "profit"
                ? point.profit
                : point.totalValue;
          const y = ((maxValue - value) / valueRange) * 80 + 10; // 10% margin

          // Additional validation to ensure no NaN values
          if (!isFinite(x) || !isFinite(y)) {
            console.warn("Invalid chart coordinates:", { x, y, value, index });
            return null;
          }

          return `${x},${y}`;
        })
        .filter((point) => point !== null)
        .join(" ");

      const isPositive = values[values.length - 1] >= values[0];
      const chartColor = isPositive ? "#10b981" : "#ef4444";
      const fillColor = isPositive
        ? "rgba(16, 185, 129, 0.1)"
        : "rgba(239, 68, 68, 0.1)";

      return (
        <div className="chart-container">
          <svg
            width="100%"
            height="240"
            viewBox="0 0 100 100"
            className="portfolio-chart-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Grid lines */}
            <defs>
              <pattern
                id="portfolioGrid"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 10 0 L 0 0 0 10"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="0.2"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#portfolioGrid)" />
            {/* Area fill */}
            <path d={`M 5,90 L ${points} L 95,90 Z`} fill={fillColor} />{" "}
            {/* Main line */}
            <polyline
              fill="none"
              stroke={chartColor}
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
              filter="drop-shadow(0 0 2px rgba(0,0,0,0.3))"
            />
            {/* Data points */}
            {validHistory.map((point, index) => {
              const x = (index / (validHistory.length - 1)) * 90 + 5;
              const value =
                selectedMetric === "return"
                  ? point.percentReturn
                  : selectedMetric === "profit"
                    ? point.profit
                    : point.totalValue;
              const y = ((maxValue - value) / valueRange) * 80 + 10;

              // Skip rendering if coordinates are invalid
              if (!isFinite(x) || !isFinite(y)) {
                return null;
              }

              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="0.5"
                  fill={chartColor}
                  className="chart-point"
                  opacity={index === validHistory.length - 1 ? 1 : 0.7}
                />
              );
            })}
            {/* Current value indicator */}{" "}
            {validHistory.length > 0 && (
              <g>
                <circle
                  cx="95"
                  cy={
                    ((maxValue - values[values.length - 1]) / valueRange) * 80 +
                    10
                  }
                  r="1.2"
                  fill={chartColor}
                  stroke="#fff"
                  strokeWidth="0.3"
                  filter="drop-shadow(0 0 3px rgba(0,0,0,0.4))"
                />
                <circle
                  cx="95"
                  cy={
                    ((maxValue - values[values.length - 1]) / valueRange) * 80 +
                    10
                  }
                  r="2.0"
                  fill="none"
                  stroke={chartColor}
                  strokeWidth="0.3"
                  opacity="0.6"
                />
              </g>
            )}
          </svg>
        </div>
      );
    };
    const formatValue = (value: number | undefined) => {
      if (value === undefined || value === null || isNaN(value)) {
        return "$0.00";
      }

      if (selectedMetric === "return") {
        return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
      } else if (selectedMetric === "profit") {
        return `${value >= 0 ? "+" : ""}$${Math.abs(value).toLocaleString(
          undefined,
          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        )}`;
      } else {
        return `$${value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      }
    };

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    };

    if (portfolioStore.isLoading) {
      return (
        <div className="portfolio-chart-loading">
          <div className="chart-spinner"></div>
          <p>Loading performance data...</p>
        </div>
      );
    }

    if (!chartData) {
      return (
        <div className="portfolio-chart-container" style={{ height }}>
          <div className="portfolio-chart-error">
            <div className="no-data-message">
              <h4>No Performance Data Available</h4>
              <p>
                Portfolio performance data will appear here once you start
                trading. Add some stocks to your portfolio to see performance
                charts.
              </p>
            </div>
          </div>
        </div>
      );
    }
    const latestPoint =
      chartData.performanceHistory[chartData.performanceHistory.length - 1];

    // Safety check for latestPoint
    if (!latestPoint) {
      return (
        <div className="portfolio-chart-container" style={{ height }}>
          <div className="portfolio-chart-error">
            <div className="no-data-message">
              <h4>No Performance History</h4>
              <p>
                Performance history will be generated as you make trades. Start
                by adding positions to your portfolio.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="portfolio-chart-container" style={{ height }}>
        <div className="chart-header">
          <div className="chart-title">
            <h3>Portfolio Performance</h3>{" "}
            <div className="chart-value">
              {formatValue(
                selectedMetric === "return"
                  ? latestPoint?.percentReturn
                  : selectedMetric === "profit"
                    ? latestPoint?.profit
                    : latestPoint?.totalValue
              )}
            </div>
          </div>

          <div className="chart-controls">
            <div className="metric-selector">
              <button
                className={`metric-btn ${
                  selectedMetric === "value" ? "active" : ""
                }`}
                onClick={() => setSelectedMetric("value")}
              >
                Value
              </button>
              <button
                className={`metric-btn ${
                  selectedMetric === "return" ? "active" : ""
                }`}
                onClick={() => setSelectedMetric("return")}
              >
                Return %
              </button>
              <button
                className={`metric-btn ${
                  selectedMetric === "profit" ? "active" : ""
                }`}
                onClick={() => setSelectedMetric("profit")}
              >
                P&L
              </button>
            </div>
            <div className="timeframe-selector">
              {(["1D", "1W", "1M", "3M", "1Y"] as const).map((tf) => (
                <button
                  key={tf}
                  className={`timeframe-btn ${
                    currentTimeframe === tf ? "active" : ""
                  }`}
                  onClick={() => {
                    if (onTimeframeChange) {
                      onTimeframeChange(tf);
                    } else {
                      setInternalTimeframe(tf);
                    }
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {renderChart()}

        <div className="chart-metrics">
          <div className="metric-grid">
            <div className="metric-item">
              <span className="metric-label">Total Return</span>
              <span
                className={`metric-value ${
                  chartData.metrics.totalReturn >= 0 ? "positive" : "negative"
                }`}
              >
                {formatCurrency(chartData.metrics.totalReturn)} (
                {chartData.metrics.totalReturnPercent.toFixed(2)}%)
              </span>
            </div>

            <div className="metric-item">
              <span className="metric-label">Max Drawdown</span>
              <span className="metric-value negative">
                -{chartData.metrics.maxDrawdown.toFixed(2)}%
              </span>
            </div>

            <div className="metric-item">
              <span className="metric-label">Volatility</span>
              <span className="metric-value">
                {chartData.metrics.volatility.toFixed(2)}%
              </span>
            </div>

            <div className="metric-item">
              <span className="metric-label">Sharpe Ratio</span>
              <span
                className={`metric-value ${
                  chartData.metrics.sharpeRatio >= 0 ? "positive" : "negative"
                }`}
              >
                {chartData.metrics.sharpeRatio.toFixed(2)}
              </span>
            </div>

            <div className="metric-item">
              <span className="metric-label">Best Day</span>
              <span className="metric-value positive">
                +{chartData.metrics.bestDay.toFixed(2)}%
              </span>
            </div>

            <div className="metric-item">
              <span className="metric-label">Worst Day</span>
              <span className="metric-value negative">
                {chartData.metrics.worstDay.toFixed(2)}%
              </span>
            </div>
          </div>{" "}
        </div>
      </div>
    );
  }
);

export default PortfolioChart;
