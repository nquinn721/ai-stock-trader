import React, { useEffect, useState } from "react";
import "./PortfolioChart.css";

interface PortfolioChartProps {
  portfolioId: number;
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

const PortfolioChart: React.FC<PortfolioChartProps> = ({
  portfolioId,
  timeframe: propTimeframe = "1M",
  height = 300,
  onTimeframeChange,
}) => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<
    "value" | "return" | "profit"
  >("value");
  const [showBenchmark, setShowBenchmark] = useState(false);
  const [internalTimeframe, setInternalTimeframe] = useState(propTimeframe);

  // Use internal timeframe if no external handler provided
  const currentTimeframe = onTimeframeChange
    ? propTimeframe
    : internalTimeframe;

  useEffect(() => {
    fetchPortfolioPerformance();
  }, [portfolioId, currentTimeframe]);
  const fetchPortfolioPerformance = async () => {
    setIsLoading(true);
    try {
      // First try to get portfolio list to ensure backend is running
      const listResponse = await fetch(
        `http://localhost:8000/paper-trading/portfolios`
      );
      if (!listResponse.ok) {
        throw new Error("Backend not available");
      }

      // Then call the actual portfolio performance API
      const response = await fetch(
        `http://localhost:8000/paper-trading/portfolios/${portfolioId}/performance`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch portfolio performance");
      }

      const data = await response.json();

      // Transform API data to match our component interface
      const transformedData: ChartData = {
        performanceHistory: data.performance.map((point: any) => ({
          date: point.date,
          totalValue: point.totalValue,
          cash: point.cash,
          investedValue: point.investedValue,
          profit: point.totalValue - 100000, // Assuming 100k base
          percentReturn: ((point.totalValue - 100000) / 100000) * 100,
        })),
        metrics: {
          totalReturn: data.totalGain,
          totalReturnPercent: data.totalGainPercent,
          maxDrawdown: data.metrics.maxDrawdown,
          volatility: data.metrics.volatility,
          sharpeRatio: data.metrics.sharpeRatio,
          bestDay: data.metrics.bestDay,
          worstDay: data.metrics.worstDay,
        },
      };
      setChartData(transformedData);
      console.log("✅ Portfolio data loaded successfully from API");
    } catch (error) {
      console.error("⚠️ Portfolio Chart API Error:", error);
      // Fallback to mock data
      const mockData: ChartData = generateMockPerformanceData();
      console.log("📊 Using mock portfolio data");
      setChartData(mockData);
    } finally {
      setIsLoading(false);
    }
  };
  const generateMockPerformanceData = (): ChartData => {
    const points: PerformancePoint[] = [];
    const now = new Date();
    const days =
      currentTimeframe === "1D"
        ? 1
        : currentTimeframe === "1W"
        ? 7
        : currentTimeframe === "1M"
        ? 30
        : currentTimeframe === "3M"
        ? 90
        : 365;

    let baseValue = 100000;
    let currentValue = baseValue;
    let cumulative = 0;

    for (let i = days; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dailyChange = (Math.random() - 0.48) * 0.02; // Slight positive bias

      currentValue *= 1 + dailyChange;
      const investedValue = currentValue * 0.8; // 80% invested
      const cash = currentValue * 0.2;
      const profit = currentValue - baseValue;
      const percentReturn = (profit / baseValue) * 100;

      points.push({
        date: date.toISOString().split("T")[0],
        totalValue: currentValue,
        cash,
        investedValue,
        profit,
        percentReturn,
      });
    }

    const returns = points.map((p) => p.percentReturn);
    const drawdowns = [];
    let peak = 0;

    for (let i = 0; i < points.length; i++) {
      if (points[i].totalValue > peak) {
        peak = points[i].totalValue;
      }
      const drawdown = ((peak - points[i].totalValue) / peak) * 100;
      drawdowns.push(drawdown);
    }

    return {
      performanceHistory: points,
      metrics: {
        totalReturn: currentValue - baseValue,
        totalReturnPercent: ((currentValue - baseValue) / baseValue) * 100,
        maxDrawdown: Math.max(...drawdowns),
        volatility: calculateVolatility(returns),
        sharpeRatio: calculateSharpeRatio(returns),
        bestDay: Math.max(...returns.slice(1).map((r, i) => r - returns[i])),
        worstDay: Math.min(...returns.slice(1).map((r, i) => r - returns[i])),
      },
    };
  };

  const calculateVolatility = (returns: number[]): number => {
    if (returns.length < 2) return 0;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance =
      returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) /
      returns.length;
    return Math.sqrt(variance);
  };

  const calculateSharpeRatio = (returns: number[]): number => {
    if (returns.length < 2) return 0;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const std = calculateVolatility(returns);
    return std === 0 ? 0 : mean / std;
  };

  const renderChart = () => {
    if (!chartData) return null;

    const { performanceHistory } = chartData;
    const width = 100; // Percentage
    const chartHeight = height - 60; // Leave space for axes

    const values = performanceHistory.map((p) => {
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

    const points = performanceHistory
      .map((point, index) => {
        const x = (index / (performanceHistory.length - 1)) * 90 + 5; // 5% margin
        const value =
          selectedMetric === "return"
            ? point.percentReturn
            : selectedMetric === "profit"
            ? point.profit
            : point.totalValue;
        const y = ((maxValue - value) / valueRange) * 80 + 10; // 10% margin
        return `${x},${y}`;
      })
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
          height={chartHeight}
          viewBox="0 0 100 100"
          className="portfolio-chart-svg"
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
          {performanceHistory.map((point, index) => {
            const x = (index / (performanceHistory.length - 1)) * 90 + 5;
            const value =
              selectedMetric === "return"
                ? point.percentReturn
                : selectedMetric === "profit"
                ? point.profit
                : point.totalValue;
            const y = ((maxValue - value) / valueRange) * 80 + 10;

            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="0.5"
                fill={chartColor}
                className="chart-point"
                opacity={index === performanceHistory.length - 1 ? 1 : 0.7}
              />
            );
          })}
          {/* Current value indicator */}{" "}
          {performanceHistory.length > 0 && (
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

  const formatValue = (value: number) => {
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

  if (isLoading) {
    return (
      <div className="portfolio-chart-loading">
        <div className="chart-spinner"></div>
        <p>Loading performance data...</p>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="portfolio-chart-error">
        <p>Failed to load portfolio performance data</p>
      </div>
    );
  }

  const latestPoint =
    chartData.performanceHistory[chartData.performanceHistory.length - 1];

  return (
    <div className="portfolio-chart-container" style={{ height }}>
      <div className="chart-header">
        <div className="chart-title">
          <h3>Portfolio Performance</h3>
          <div className="chart-value">
            {formatValue(
              selectedMetric === "return"
                ? latestPoint.percentReturn
                : selectedMetric === "profit"
                ? latestPoint.profit
                : latestPoint.totalValue
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
        </div>
      </div>
    </div>
  );
};

export default PortfolioChart;
