import { observer } from "mobx-react-lite";
import React, { useEffect, useRef } from "react";
import { useAutoTradingStore } from "../../stores/StoreContext";
import "./TradingPerformanceChart.css";

interface TradingPerformanceChartProps {
  portfolioId?: string;
  timeRange?: "1d" | "1w" | "1m" | "3m" | "1y";
}

interface ChartDataPoint {
  timestamp: Date;
  value: number;
  trades?: number;
}

const TradingPerformanceChart: React.FC<TradingPerformanceChartProps> =
  observer(({ portfolioId, timeRange = "1w" }) => {
    const autoTradingStore = useAutoTradingStore();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Mock data generation for demonstration
    const generateMockData = (): ChartDataPoint[] => {
      const data: ChartDataPoint[] = [];
      const now = new Date();
      const days =
        timeRange === "1d"
          ? 1
          : timeRange === "1w"
          ? 7
          : timeRange === "1m"
          ? 30
          : timeRange === "3m"
          ? 90
          : 365;

      let value = 10000; // Starting portfolio value

      for (let i = days; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const change = (Math.random() - 0.5) * 200; // Random change ±$100
        value += change;

        data.push({
          timestamp,
          value: Math.max(value, 1000), // Ensure minimum value
          trades: Math.floor(Math.random() * 10),
        });
      }

      return data;
    };

    const drawChart = (data: ChartDataPoint[]) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const width = rect.width;
      const height = rect.height;
      const padding = 40;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      if (data.length === 0) return;

      // Calculate bounds
      const minValue = Math.min(...data.map((d) => d.value));
      const maxValue = Math.max(...data.map((d) => d.value));
      const valueRange = maxValue - minValue || 1;

      // Draw grid
      ctx.strokeStyle = "#e5e7eb";
      ctx.lineWidth = 1;

      // Horizontal grid lines
      for (let i = 0; i <= 4; i++) {
        const y = padding + ((height - 2 * padding) * i) / 4;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
      }

      // Vertical grid lines
      for (let i = 0; i <= 6; i++) {
        const x = padding + ((width - 2 * padding) * i) / 6;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();
      }

      // Draw performance line
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.beginPath();

      data.forEach((point, index) => {
        const x = padding + ((width - 2 * padding) * index) / (data.length - 1);
        const y =
          height -
          padding -
          ((height - 2 * padding) * (point.value - minValue)) / valueRange;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Draw fill area
      ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
      ctx.beginPath();
      data.forEach((point, index) => {
        const x = padding + ((width - 2 * padding) * index) / (data.length - 1);
        const y =
          height -
          padding -
          ((height - 2 * padding) * (point.value - minValue)) / valueRange;

        if (index === 0) {
          ctx.moveTo(x, height - padding);
          ctx.lineTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.lineTo(width - padding, height - padding);
      ctx.closePath();
      ctx.fill();

      // Draw data points
      ctx.fillStyle = "#3b82f6";
      data.forEach((point, index) => {
        const x = padding + ((width - 2 * padding) * index) / (data.length - 1);
        const y =
          height -
          padding -
          ((height - 2 * padding) * (point.value - minValue)) / valueRange;

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });

      // Draw Y-axis labels
      ctx.fillStyle = "#6b7280";
      ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "right";

      for (let i = 0; i <= 4; i++) {
        const value = minValue + (valueRange * (4 - i)) / 4;
        const y = padding + ((height - 2 * padding) * i) / 4;
        ctx.fillText(`$${value.toLocaleString()}`, padding - 10, y + 4);
      }

      // Draw X-axis labels
      ctx.textAlign = "center";
      const labelCount = Math.min(6, data.length);
      for (let i = 0; i < labelCount; i++) {
        const dataIndex = Math.floor(
          (i * (data.length - 1)) / (labelCount - 1)
        );
        const point = data[dataIndex];
        const x = padding + ((width - 2 * padding) * i) / (labelCount - 1);
        const label = point.timestamp.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        ctx.fillText(label, x, height - padding + 20);
      }
    };

    useEffect(() => {
      const data = generateMockData();
      drawChart(data);
    }, [timeRange, portfolioId]);

    const mockData = generateMockData();
    const currentValue = mockData[mockData.length - 1]?.value || 0;
    const startValue = mockData[0]?.value || 0;
    const totalChange = currentValue - startValue;
    const percentChange = startValue > 0 ? (totalChange / startValue) * 100 : 0;

    return (
      <div className="trading-performance-chart">
        <div className="chart-header">
          <div className="chart-title">
            <h3>Trading Performance</h3>
            {portfolioId && (
              <span className="portfolio-id">Portfolio: {portfolioId}</span>
            )}
          </div>
          <div className="chart-controls">
            <div className="time-range-selector">
              {["1d", "1w", "1m", "3m", "1y"].map((range) => (
                <button
                  key={range}
                  className={`time-range-btn ${
                    timeRange === range ? "active" : ""
                  }`}
                  onClick={() => {
                    // In a real implementation, this would update the timeRange prop
                    console.log(`Time range changed to: ${range}`);
                  }}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="chart-metrics">
          <div className="metric">
            <span className="metric-label">Current Value</span>
            <span className="metric-value">
              ${currentValue.toLocaleString()}
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Total Change</span>
            <span
              className={`metric-value ${
                totalChange >= 0 ? "positive" : "negative"
              }`}
            >
              {totalChange >= 0 ? "+" : ""}${totalChange.toLocaleString()}
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Change %</span>
            <span
              className={`metric-value ${
                percentChange >= 0 ? "positive" : "negative"
              }`}
            >
              {percentChange >= 0 ? "+" : ""}
              {Number(percentChange || 0).toFixed(2)}%
            </span>
          </div>
          <div className="metric">
            <span className="metric-label">Total Trades</span>
            <span className="metric-value">
              {mockData.reduce((sum, d) => sum + (d.trades || 0), 0)}
            </span>
          </div>
        </div>

        <div className="chart-container">
          <canvas ref={canvasRef} className="performance-canvas" />
        </div>

        {autoTradingStore.isLoading && (
          <div className="chart-loading">
            <div className="loading-spinner"></div>
            <span>Loading performance data...</span>
          </div>
        )}

        {autoTradingStore.error && (
          <div className="chart-error">
            <span>Error loading chart data: {autoTradingStore.error}</span>
          </div>
        )}
      </div>
    );
  });

export default TradingPerformanceChart;
