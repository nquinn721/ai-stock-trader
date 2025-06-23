import React, { useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Stock, TradingSignal } from "../types";
import "./StockCard.css";
import StockModal from "./StockModal";

interface StockCardProps {
  stock: Stock;
  signal?: TradingSignal;
}

const StockCard: React.FC<StockCardProps> = ({ stock, signal }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const getChangeColor = (changePercent: number) => {
    if (changePercent > 0) return "#00C851";
    if (changePercent < 0) return "#ff4444";
    return "#666";
  };

  const formatPrice = (price: number | string | null | undefined) => {
    const numValue = Number(price) || 0;
    return numValue.toFixed(2);
  };

  const formatPercent = (percent: number | string | null | undefined) => {
    const numValue = Number(percent) || 0;
    return numValue.toFixed(2);
  };

  const getRSILevel = (rsi: number | undefined) => {
    if (!rsi) return "neutral";
    if (rsi > 70) return "overbought";
    if (rsi < 30) return "oversold";
    return "neutral";
  };
  // Generate sample chart data for mini chart
  const generateMiniChartData = () => {
    const data = [];
    const basePrice = Number(stock.currentPrice) || 100;
    const volatility = stock.breakoutStrategy?.volatility || 0.02;
    const now = new Date();

    for (let i = 0; i < 12; i++) {
      const timeHour = (now.getHours() - 11 + i) % 24;
      const variation = (Math.random() - 0.5) * volatility * basePrice;
      const price = Math.max(basePrice + variation, basePrice * 0.9); // Prevent too low prices

      data.push({
        time: `${timeHour.toString().padStart(2, "0")}h`,
        price: Number(price.toFixed(2)),
      });
    }
    return data;
  };
  return (
    <div className="stock-card compact">
      {/* Stock Header - Always Visible Summary */}
      <div className="stock-header">
        <div className="stock-info">
          <div className="stock-symbol">{stock.symbol}</div>
          <div className="stock-name">{stock.name}</div>
        </div>
        <div className="stock-price-section">
          <div className="current-price">
            ${formatPrice(stock.currentPrice)}
          </div>
          <div
            className="price-change"
            style={{ color: getChangeColor(Number(stock.changePercent) || 0) }}
          >
            {(Number(stock.changePercent) || 0) >= 0 ? "+" : ""}
            {formatPercent(stock.changePercent)}%
          </div>
        </div>
      </div>
      {/* Mini Chart - Compact Version */}
      <div className="mini-chart compact">
        <ResponsiveContainer width="100%" height={100}>
          <LineChart
            data={generateMiniChartData()}
            margin={{ top: 5, right: 8, left: 25, bottom: 15 }}
          >
            <XAxis
              dataKey="time"
              tick={{ fontSize: 8, fill: "#8ba3f7" }}
              axisLine={{ stroke: "#8ba3f7", strokeWidth: 1 }}
              tickLine={{ stroke: "#8ba3f7" }}
              interval="preserveStartEnd"
              tickCount={3}
              label={{
                value: "Time",
                position: "insideBottom",
                offset: -8,
                style: {
                  textAnchor: "middle",
                  fill: "#8ba3f7",
                  fontSize: "8px",
                },
              }}
            />
            <YAxis
              tick={{ fontSize: 8, fill: "#8ba3f7" }}
              axisLine={{ stroke: "#8ba3f7", strokeWidth: 1 }}
              tickLine={{ stroke: "#8ba3f7" }}
              tickFormatter={(value) => `$${Number(value).toFixed(0)}`}
              width={22}
              domain={["dataMin - 1", "dataMax + 1"]}
              label={{
                value: "$",
                angle: -90,
                position: "insideLeft",
                style: {
                  textAnchor: "middle",
                  fill: "#8ba3f7",
                  fontSize: "8px",
                },
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0d1117",
                border: "1px solid #30363d",
                borderRadius: "4px",
                color: "#f0f6fc",
                fontSize: "10px",
              }}
              formatter={(value: any) => [
                `$${Number(value).toFixed(2)}`,
                "Price",
              ]}
              labelFormatter={(label) => `Time: ${label}`}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={getChangeColor(Number(stock.changePercent) || 0)}
              strokeWidth={1.5}
              dot={false}
              activeDot={{
                r: 2,
                fill: getChangeColor(Number(stock.changePercent) || 0),
                stroke: "#fff",
                strokeWidth: 1,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {/* Compact Technical Summary */}
      <div className="technical-summary compact">
        <div className="technical-indicators compact">
          <div className="indicator-badge">
            <span className="badge-label">Trend</span>
            <span
              className={`badge-value trend-${
                stock.breakoutStrategy?.currentTrend || "neutral"
              }`}
            >
              {stock.breakoutStrategy?.currentTrend?.charAt(0).toUpperCase() ||
                "?"}
            </span>
          </div>
          <div className="indicator-badge">
            <span className="badge-label">RSI</span>
            <span
              className={`badge-value rsi-${getRSILevel(
                stock.breakoutStrategy?.rsi
              )}`}
            >
              {stock.breakoutStrategy?.rsi?.toFixed(0) || "--"}
            </span>
          </div>
          <div className="indicator-badge">
            <span className="badge-label">Signal</span>
            <span
              className={`badge-value signal-${
                stock.breakoutStrategy?.signal || "neutral"
              }`}
            >
              {stock.breakoutStrategy?.signal?.charAt(0).toUpperCase() || "?"}
            </span>
          </div>
        </div>

        <div className="view-full-details compact">
          <button
            className="full-details-btn compact"
            onClick={() => setIsModalOpen(true)}
          >
            📊 Full Analysis
          </button>
        </div>
      </div>{" "}
      {/* Stock Modal */}
      <StockModal
        stock={stock}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default StockCard;
