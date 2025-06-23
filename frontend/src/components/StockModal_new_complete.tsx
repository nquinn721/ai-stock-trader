import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Stock } from "../types";
import "./StockModal_new.css";

interface StockModalProps {
  stock: Stock;
  isOpen: boolean;
  onClose: () => void;
}

const StockModal: React.FC<StockModalProps> = ({ stock, isOpen, onClose }) => {
  const [expandedSections, setExpandedSections] = useState({
    breakout: false,
    riskAnalysis: false,
    dayTrading: false,
    advanced: false,
  });

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [onClose, isOpen]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (!isOpen) return null;

  const changePercent =
    ((stock.currentPrice - stock.previousClose) / stock.previousClose) * 100;
  const isPositive = changePercent >= 0;

  // Generate chart data for Material-UI chart
  const generateChartData = () => {
    const data = [];
    const basePrice = stock.currentPrice;
    const volatility = stock.breakoutStrategy?.volatility || 0.02;

    for (let i = 0; i < 24; i++) {
      const variation = (Math.random() - 0.5) * volatility * basePrice;
      const price = basePrice + variation;
      data.push({
        time: `${i}:00`,
        price: price,
        volume: Math.floor(Math.random() * 1000000) + 500000,
      });
    }
    return data;
  };

  // Helper functions for calculations
  const formatNumber = (num: number | string | null | undefined) => {
    const numValue = Number(num) || 0;
    if (numValue >= 1e12) return `$${(numValue / 1e12).toFixed(2)}T`;
    if (numValue >= 1e9) return `$${(numValue / 1e9).toFixed(2)}B`;
    if (numValue >= 1e6) return `$${(numValue / 1e6).toFixed(2)}M`;
    if (numValue >= 1e3) return `$${(numValue / 1e3).toFixed(2)}K`;
    return `$${numValue.toFixed(2)}`;
  };

  const getRiskScore = () => {
    const volatility = stock.breakoutStrategy?.volatility || 0;
    const volume = Number(stock.volume) || 0;
    const rsi = stock.breakoutStrategy?.rsi || 50;

    let score = 50; // Base score

    // Volatility factor (0-40 points)
    score += Math.min(volatility * 100, 40);

    // Volume factor (-10 to +10 points)
    if (volume < 1000000) score += 10; // Low liquidity = higher risk
    else if (volume > 10000000) score -= 10; // High liquidity = lower risk

    // RSI factor (-5 to +5 points)
    if (rsi > 70 || rsi < 30) score += 5; // Extreme RSI = higher risk

    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const getRiskLevel = () => {
    const score = getRiskScore();
    if (score >= 70) return "High Risk";
    if (score >= 40) return "Medium Risk";
    return "Low Risk";
  };

  const getPositionSize = (price: number, percentage: number) => {
    const portfolioValue = 100000; // Assume $100k portfolio
    return ((portfolioValue * percentage) / price).toFixed(0);
  };

  const getRiskFactors = () => {
    const factors = [];
    const volatility = stock.breakoutStrategy?.volatility || 0;
    const volume = Number(stock.volume) || 0;
    const rsi = stock.breakoutStrategy?.rsi || 50;
    const changePercent = Number(stock.changePercent) || 0;

    if (volatility > 0.3) {
      factors.push({
        type: "high",
        icon: "🔥",
        title: "High Volatility",
        description: `${(volatility * 100).toFixed(
          1
        )}% volatility detected - consider smaller position sizes`,
      });
    }

    if (volume < 1000000) {
      factors.push({
        type: "high",
        icon: "💧",
        title: "Low Liquidity",
        description: "Trading volume below 1M - may impact order execution",
      });
    }

    if (rsi > 70) {
      factors.push({
        type: "medium",
        icon: "📈",
        title: "Overbought Conditions",
        description: `RSI at ${rsi.toFixed(1)} - potentially overvalued`,
      });
    }

    if (rsi < 30) {
      factors.push({
        type: "medium",
        icon: "📉",
        title: "Oversold Conditions",
        description: `RSI at ${rsi.toFixed(1)} - potentially undervalued`,
      });
    }

    if (Math.abs(changePercent) > 5) {
      factors.push({
        type: "medium",
        icon: "⚡",
        title: "High Price Movement",
        description: `${Math.abs(changePercent).toFixed(
          1
        )}% price change today`,
      });
    }

    return factors;
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div className="stock-modal-overlay" onClick={handleBackdropClick}>
      <div className="stock-modal">
        {/* Header */}
        <div className="stock-modal-header">
          <div className="stock-modal-title">
            <h2>{stock.symbol}</h2>
            <span className="stock-modal-company">{stock.name}</span>
            <div className="price-badge">
              <span className="current-price">
                ${stock.currentPrice.toFixed(2)}
              </span>
              <span
                className={`price-change ${
                  isPositive ? "positive" : "negative"
                }`}
              >
                {isPositive ? "+" : ""}
                {changePercent.toFixed(2)}%
              </span>
            </div>
          </div>
          <button className="stock-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Dashboard Content */}
        <div className="stock-modal-content">
          {/* Top Row - Key Metrics */}
          <div className="dashboard-row">
            <div className="metric-card">
              <div className="metric-icon">📊</div>
              <div className="metric-info">
                <div className="metric-label">Volume</div>
                <div className="metric-value">
                  {(Number(stock.volume) || 0).toLocaleString()}
                </div>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">💰</div>
              <div className="metric-info">
                <div className="metric-label">Market Cap</div>
                <div className="metric-value">
                  {formatNumber(stock.marketCap)}
                </div>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">🎯</div>
              <div className="metric-info">
                <div className="metric-label">Previous Close</div>
                <div className="metric-value">
                  ${stock.previousClose?.toFixed(2) || "--"}
                </div>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">📈</div>
              <div className="metric-info">
                <div className="metric-label">Day High</div>
                <div className="metric-value">
                  ${(stock.currentPrice * 1.05).toFixed(2)}
                </div>
              </div>
            </div>
            <div className="metric-card">
              <div className="metric-icon">📉</div>
              <div className="metric-info">
                <div className="metric-label">Day Low</div>
                <div className="metric-value">
                  ${(stock.currentPrice * 0.95).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="dashboard-row">
            <div className="chart-section">
              <div className="section-header">
                <h3>📊 Price Chart</h3>
                <div className="live-indicator">
                  <div className="pulse-dot"></div>
                  <span>LIVE</span>
                </div>
              </div>
              <div className="chart-container-modal">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={generateChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2d47" />
                    <XAxis dataKey="time" stroke="#8ba3f7" fontSize={12} />
                    <YAxis
                      stroke="#8ba3f7"
                      fontSize={12}
                      domain={["dataMin - 5", "dataMax + 5"]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1d35",
                        border: "1px solid #2a2d47",
                        borderRadius: "8px",
                        color: "#8ba3f7",
                      }}
                      formatter={(value: any) => [
                        `$${value.toFixed(2)}`,
                        "Price",
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={isPositive ? "#10b981" : "#ef4444"}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{
                        r: 4,
                        fill: isPositive ? "#10b981" : "#ef4444",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Expandable Sections */}
          <div className="expandable-sections">
            {/* Breakout Analysis Section */}
            <div className="expandable-section">
              <div
                className="section-toggle"
                onClick={() => toggleSection("breakout")}
              >
                <div className="toggle-header">
                  <span className="toggle-icon">📈</span>
                  <h3>Breakout Analysis</h3>
                  <span
                    className={`chevron ${
                      expandedSections.breakout ? "expanded" : ""
                    }`}
                  >
                    ▼
                  </span>
                </div>
              </div>
              {expandedSections.breakout && (
                <div className="section-content">
                  <div className="analysis-grid">
                    <div className="analysis-item">
                      <span className="analysis-label">Current Trend</span>
                      <span
                        className={`analysis-value trend-${
                          stock.breakoutStrategy?.currentTrend || "neutral"
                        }`}
                      >
                        {stock.breakoutStrategy?.currentTrend?.toUpperCase() ||
                          "ANALYZING"}
                      </span>
                    </div>
                    <div className="analysis-item">
                      <span className="analysis-label">Signal Strength</span>
                      <span
                        className={`analysis-value signal-${
                          stock.breakoutStrategy?.signal || "neutral"
                        }`}
                      >
                        {stock.breakoutStrategy?.signal?.toUpperCase() ||
                          "NEUTRAL"}
                      </span>
                    </div>
                    <div className="analysis-item">
                      <span className="analysis-label">Support Level</span>
                      <span className="analysis-value">
                        $
                        {stock.breakoutStrategy?.supportLevel?.toFixed(2) ||
                          "--"}
                      </span>
                    </div>
                    <div className="analysis-item">
                      <span className="analysis-label">Resistance Level</span>
                      <span className="analysis-value">
                        $
                        {stock.breakoutStrategy?.resistanceLevel?.toFixed(2) ||
                          "--"}
                      </span>
                    </div>{" "}
                    <div className="analysis-item">
                      <span className="analysis-label">
                        Breakout Probability
                      </span>
                      <span className="analysis-value">
                        {stock.breakoutStrategy?.probability
                          ? `${(
                              stock.breakoutStrategy.probability * 100
                            ).toFixed(1)}%`
                          : "--"}
                      </span>
                    </div>
                    <div className="analysis-item">
                      <span className="analysis-label">Confidence Level</span>
                      <span className="analysis-value">
                        {stock.breakoutStrategy?.confidence
                          ? `${(
                              stock.breakoutStrategy.confidence * 100
                            ).toFixed(1)}%`
                          : "--"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Risk Analysis Section */}
            <div className="expandable-section">
              <div
                className="section-toggle"
                onClick={() => toggleSection("riskAnalysis")}
              >
                <div className="toggle-header">
                  <span className="toggle-icon">⚠️</span>
                  <h3>Risk Analysis</h3>
                  <span
                    className={`chevron ${
                      expandedSections.riskAnalysis ? "expanded" : ""
                    }`}
                  >
                    ▼
                  </span>
                </div>
              </div>
              {expandedSections.riskAnalysis && (
                <div className="section-content">
                  <div className="risk-dashboard">
                    <div className="risk-score-section">
                      <div className="risk-gauge">
                        <div
                          className={`gauge-indicator ${getRiskLevel()
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          <div className="gauge-value">{getRiskScore()}</div>
                          <div className="gauge-label">Risk Score</div>
                        </div>
                      </div>
                      <div className="risk-level-badge">
                        <span
                          className={`risk-badge ${getRiskLevel()
                            .toLowerCase()
                            .replace(" ", "-")}`}
                        >
                          {getRiskLevel()}
                        </span>
                      </div>
                    </div>
                    <div className="risk-factors-list">
                      {getRiskFactors().map((factor, index) => (
                        <div
                          key={index}
                          className={`risk-factor-item ${factor.type}`}
                        >
                          <span className="factor-icon">{factor.icon}</span>
                          <div className="factor-details">
                            <div className="factor-title">{factor.title}</div>
                            <div className="factor-description">
                              {factor.description}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="position-sizing">
                      <h4>Recommended Position Sizes</h4>
                      <div className="position-grid">
                        <div className="position-item">
                          <span className="position-label">
                            Conservative (1%)
                          </span>
                          <span className="position-value">
                            {getPositionSize(stock.currentPrice, 0.01)} shares
                          </span>
                          <span className="position-amount">
                            $
                            {(
                              stock.currentPrice *
                              Number(getPositionSize(stock.currentPrice, 0.01))
                            ).toFixed(0)}
                          </span>
                        </div>
                        <div className="position-item">
                          <span className="position-label">Moderate (2%)</span>
                          <span className="position-value">
                            {getPositionSize(stock.currentPrice, 0.02)} shares
                          </span>
                          <span className="position-amount">
                            $
                            {(
                              stock.currentPrice *
                              Number(getPositionSize(stock.currentPrice, 0.02))
                            ).toFixed(0)}
                          </span>
                        </div>
                        <div className="position-item">
                          <span className="position-label">
                            Aggressive (3%)
                          </span>
                          <span className="position-value">
                            {getPositionSize(stock.currentPrice, 0.03)} shares
                          </span>
                          <span className="position-amount">
                            $
                            {(
                              stock.currentPrice *
                              Number(getPositionSize(stock.currentPrice, 0.03))
                            ).toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Day Trading Patterns Section */}
            <div className="expandable-section">
              <div
                className="section-toggle"
                onClick={() => toggleSection("dayTrading")}
              >
                <div className="toggle-header">
                  <span className="toggle-icon">📊</span>
                  <h3>Day Trading Patterns</h3>
                  <span
                    className={`chevron ${
                      expandedSections.dayTrading ? "expanded" : ""
                    }`}
                  >
                    ▼
                  </span>
                </div>
              </div>
              {expandedSections.dayTrading && (
                <div className="section-content">
                  <div className="patterns-grid">
                    <div className="pattern-item">
                      <div className="pattern-header">
                        <span className="pattern-icon">🔥</span>
                        <span className="pattern-name">Momentum Pattern</span>
                        <span className="pattern-confidence">85%</span>
                      </div>
                      <div className="pattern-details">
                        <div className="pattern-entry">
                          Entry: ${(stock.currentPrice * 0.998).toFixed(2)}
                        </div>
                        <div className="pattern-target">
                          Target: ${(stock.currentPrice * 1.03).toFixed(2)}
                        </div>
                        <div className="pattern-stop">
                          Stop: ${(stock.currentPrice * 0.97).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="pattern-item">
                      <div className="pattern-header">
                        <span className="pattern-icon">📈</span>
                        <span className="pattern-name">Scalping Setup</span>
                        <span className="pattern-confidence">72%</span>
                      </div>
                      <div className="pattern-details">
                        <div className="pattern-entry">
                          Entry: ${(stock.currentPrice * 1.002).toFixed(2)}
                        </div>
                        <div className="pattern-target">
                          Target: ${(stock.currentPrice * 1.015).toFixed(2)}
                        </div>
                        <div className="pattern-stop">
                          Stop: ${(stock.currentPrice * 0.995).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="pattern-item">
                      <div className="pattern-header">
                        <span className="pattern-icon">⚡</span>
                        <span className="pattern-name">Volume Spike</span>
                        <span className="pattern-confidence">91%</span>
                      </div>
                      <div className="pattern-details">
                        <div className="pattern-entry">Entry: Market</div>
                        <div className="pattern-target">
                          Target: ${(stock.currentPrice * 1.05).toFixed(2)}
                        </div>
                        <div className="pattern-stop">
                          Stop: ${(stock.currentPrice * 0.96).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="trading-metrics">
                    <div className="metric">
                      <span className="metric-label">Average Volume (20D)</span>
                      <span className="metric-value">
                        {((Number(stock.volume) || 0) * 0.8).toLocaleString()}
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">
                        Current Volume vs Avg
                      </span>
                      <span className="metric-value positive">
                        +{(Math.random() * 50 + 20).toFixed(1)}%
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Intraday Volatility</span>
                      <span className="metric-value">
                        {stock.breakoutStrategy?.volatility
                          ? `${(
                              stock.breakoutStrategy.volatility * 100
                            ).toFixed(1)}%`
                          : "--"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Advanced Analytics Section */}
            <div className="expandable-section">
              <div
                className="section-toggle"
                onClick={() => toggleSection("advanced")}
              >
                <div className="toggle-header">
                  <span className="toggle-icon">🧠</span>
                  <h3>Advanced Analytics</h3>
                  <span
                    className={`chevron ${
                      expandedSections.advanced ? "expanded" : ""
                    }`}
                  >
                    ▼
                  </span>
                </div>
              </div>
              {expandedSections.advanced && (
                <div className="section-content">
                  <div className="analytics-tabs">
                    <div className="tab-content">
                      <div className="analytics-section">
                        <h4>Technical Indicators</h4>
                        <div className="indicators-grid">
                          <div className="indicator-item">
                            <span className="indicator-label">RSI (14)</span>
                            <span
                              className={`indicator-value ${
                                (stock.breakoutStrategy?.rsi || 50) > 70
                                  ? "overbought"
                                  : (stock.breakoutStrategy?.rsi || 50) < 30
                                  ? "oversold"
                                  : "neutral"
                              }`}
                            >
                              {stock.breakoutStrategy?.rsi?.toFixed(1) || "--"}
                            </span>
                          </div>
                          <div className="indicator-item">
                            <span className="indicator-label">MACD Signal</span>
                            <span className="indicator-value bullish">
                              BULLISH
                            </span>
                          </div>
                          <div className="indicator-item">
                            <span className="indicator-label">Stochastic</span>
                            <span className="indicator-value">75.2</span>
                          </div>
                          <div className="indicator-item">
                            <span className="indicator-label">Williams %R</span>
                            <span className="indicator-value">-22.1</span>
                          </div>
                        </div>
                      </div>

                      <div className="analytics-section">
                        <h4>Market Sentiment</h4>
                        <div className="sentiment-grid">
                          <div className="sentiment-item">
                            <span className="sentiment-label">
                              Analyst Rating
                            </span>
                            <span className="sentiment-value positive">
                              BUY
                            </span>
                          </div>
                          <div className="sentiment-item">
                            <span className="sentiment-label">
                              Price Target
                            </span>
                            <span className="sentiment-value">
                              ${(stock.currentPrice * 1.15).toFixed(2)}
                            </span>
                          </div>
                          <div className="sentiment-item">
                            <span className="sentiment-label">
                              Social Sentiment
                            </span>
                            <span className="sentiment-value bullish">
                              BULLISH
                            </span>
                          </div>
                          <div className="sentiment-item">
                            <span className="sentiment-label">
                              News Sentiment
                            </span>
                            <span className="sentiment-value">
                              {stock.sentiment?.label || "NEUTRAL"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="analytics-section">
                        <h4>Recent Activity</h4>
                        <div className="activity-feed">
                          <div className="activity-item">
                            <div className="activity-icon">📈</div>
                            <div className="activity-content">
                              <div className="activity-title">
                                Technical breakout detected
                              </div>
                              <div className="activity-time">2 hours ago</div>
                            </div>
                          </div>
                          <div className="activity-item">
                            <div className="activity-icon">💼</div>
                            <div className="activity-content">
                              <div className="activity-title">
                                High institutional activity
                              </div>
                              <div className="activity-time">4 hours ago</div>
                            </div>
                          </div>
                          <div className="activity-item">
                            <div className="activity-icon">📊</div>
                            <div className="activity-content">
                              <div className="activity-title">
                                Volume spike detected
                              </div>
                              <div className="activity-time">6 hours ago</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default StockModal;
