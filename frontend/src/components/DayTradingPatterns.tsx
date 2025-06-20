import React from "react";
import { DayTradingPattern } from "../types";
import "./DayTradingPatterns.css";

interface DayTradingPatternsProps {
  patterns: DayTradingPattern[];
  symbol: string;
}

const DayTradingPatterns: React.FC<DayTradingPatternsProps> = ({
  patterns,
  symbol,
}) => {
  const getPatternIcon = (type: string) => {
    switch (type) {
      case "flag":
        return "🏳️";
      case "pennant":
        return "🚩";
      case "double_top":
        return "⛰️";
      case "double_bottom":
        return "🏔️";
      case "head_shoulders":
        return "👤";
      case "inverse_head_shoulders":
        return "🙃";
      case "triangle":
        return "🔺";
      case "rectangle":
        return "⬜";
      case "wedge":
        return "🔸";
      default:
        return "📊";
    }
  };

  const getDirectionColor = (direction: string) => {
    switch (direction) {
      case "bullish":
        return "#00C851";
      case "bearish":
        return "#ff4444";
      default:
        return "#ffbb33";
    }
  };
  const formatPrice = (price: number | string | undefined) => {
    const numPrice =
      typeof price === "number" ? price : parseFloat(String(price || 0));
    return isNaN(numPrice) ? "0.00" : numPrice.toFixed(2);
  };

  const formatPatternName = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  if (!patterns || patterns.length === 0) {
    return (
      <div className="day-trading-patterns">
        <div className="patterns-header">Day Trading Patterns</div>
        <div className="no-patterns">No patterns detected</div>
      </div>
    );
  }

  const significantPatterns = patterns.filter(
    (p) => p.type !== "none" && p.confidence > 0.3
  );

  return (
    <div className="day-trading-patterns">
      <div className="patterns-header">
        <span>Day Trading Patterns</span>
        <span className="patterns-count">({significantPatterns.length})</span>
      </div>

      {significantPatterns.length === 0 ? (
        <div className="no-patterns">No significant patterns detected</div>
      ) : (
        <div className="patterns-list">
          {significantPatterns.map((pattern, index) => (
            <div key={index} className="pattern-item">
              <div className="pattern-header">
                <span className="pattern-icon">
                  {getPatternIcon(pattern.type)}
                </span>
                <span className="pattern-name">
                  {formatPatternName(pattern.type)}
                </span>
                <span
                  className="pattern-direction"
                  style={{ color: getDirectionColor(pattern.direction) }}
                >
                  {pattern.direction.toUpperCase()}
                </span>
              </div>

              <div className="pattern-details">
                <div className="pattern-confidence">
                  Confidence: {(pattern.confidence * 100).toFixed(1)}%
                </div>{" "}
                <div className="pattern-prices">
                  <span>Entry: ${formatPrice(pattern.entryPoint)}</span>
                  {pattern.targetPrice && (
                    <span>Target: ${formatPrice(pattern.targetPrice)}</span>
                  )}
                  {pattern.stopLoss && (
                    <span>Stop: ${formatPrice(pattern.stopLoss)}</span>
                  )}
                </div>
                <div className="pattern-timeframe">
                  Timeframe: {pattern.timeframe}
                </div>
              </div>

              <div className="pattern-description">{pattern.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DayTradingPatterns;
