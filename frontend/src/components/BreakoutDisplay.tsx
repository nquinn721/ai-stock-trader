import React from "react";
import { BreakoutStrategy } from "../types";
import "./BreakoutDisplay.css";

interface BreakoutDisplayProps {
  breakoutStrategy: BreakoutStrategy;
  symbol: string;
}

const BreakoutDisplay: React.FC<BreakoutDisplayProps> = ({
  breakoutStrategy,
  symbol,
}) => {
  const getSignalColor = (signal: string) => {
    switch (signal) {
      case "bullish":
        return "#00C851";
      case "bearish":
        return "#ff4444";
      case "neutral":
        return "#ffbb33";
      default:
        return "#666";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "upward":
        return "↗️";
      case "downward":
        return "↘️";
      case "sideways":
        return "➡️";
      default:
        return "➡️";
    }
  };

  const getBollingerColor = (position: string) => {
    switch (position) {
      case "upper":
        return "#ff4444";
      case "lower":
        return "#00C851";
      case "middle":
        return "#ffbb33";
      default:
        return "#666";
    }
  };

  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  const formatPercent = (value: number) => {
    return (value * 100).toFixed(1);
  };

  return (
    <div className="breakout-display">
      <div className="breakout-header">
        <span className="breakout-title">📈 Breakout Analysis</span>
        <span className="breakout-timestamp">
          {new Date(breakoutStrategy.lastCalculated).toLocaleTimeString()}
        </span>
      </div>

      <div className="breakout-signal">
        <div
          className="signal-badge"
          style={{ backgroundColor: getSignalColor(breakoutStrategy.signal) }}
        >
          {breakoutStrategy.signal.toUpperCase()}
        </div>
        <div className="signal-probability">
          {formatPercent(breakoutStrategy.probability)}% confidence
        </div>
      </div>

      <div className="breakout-metrics">
        <div className="metric-row">
          <span className="metric-label">Trend:</span>
          <span className="metric-value">
            {getTrendIcon(breakoutStrategy.currentTrend)}{" "}
            {breakoutStrategy.currentTrend}
          </span>
        </div>

        <div className="metric-row">
          <span className="metric-label">RSI:</span>
          <span
            className="metric-value"
            style={{
              color:
                breakoutStrategy.rsi > 70
                  ? "#ff4444"
                  : breakoutStrategy.rsi < 30
                  ? "#00C851"
                  : "#ffbb33",
            }}
          >
            {breakoutStrategy.rsi.toFixed(1)}
          </span>
        </div>

        <div className="metric-row">
          <span className="metric-label">Bollinger:</span>
          <span
            className="metric-value"
            style={{
              color: getBollingerColor(breakoutStrategy.bollingerPosition),
            }}
          >
            {breakoutStrategy.bollingerPosition}
          </span>
        </div>

        <div className="metric-row">
          <span className="metric-label">Volatility:</span>
          <span className="metric-value">
            {formatPercent(breakoutStrategy.volatility)}%
          </span>
        </div>
      </div>

      <div className="support-resistance">
        <div className="sr-level support">
          <span className="sr-label">Support:</span>
          <span className="sr-value">
            ${formatPrice(breakoutStrategy.supportLevel)}
          </span>
        </div>
        <div className="sr-level resistance">
          <span className="sr-label">Resistance:</span>
          <span className="sr-value">
            ${formatPrice(breakoutStrategy.resistanceLevel)}
          </span>
        </div>
      </div>

      <div className="breakout-recommendation">
        <div className="recommendation-text">
          {breakoutStrategy.recommendation}
        </div>
      </div>
    </div>
  );
};

export default BreakoutDisplay;
