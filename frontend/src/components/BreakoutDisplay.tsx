import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
        return (
          <FontAwesomeIcon
            icon="long-arrow-alt-up"
            style={{ color: "#00C851" }}
          />
        );
      case "downward":
        return (
          <FontAwesomeIcon
            icon="long-arrow-alt-down"
            style={{ color: "#ff4444" }}
          />
        );
      case "sideways":
        return (
          <FontAwesomeIcon icon="arrow-right" style={{ color: "#ffbb33" }} />
        );
      default:
        return <FontAwesomeIcon icon="arrow-right" style={{ color: "#666" }} />;
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

  const getVolumeRatioColor = (ratio: number) => {
    if (ratio >= 2.0) return "#00C851"; // High volume - green
    if (ratio >= 1.5) return "#ffbb33"; // Medium volume - yellow
    if (ratio >= 0.8) return "#666"; // Normal volume - gray
    return "#ff4444"; // Low volume - red
  };

  const getVolumeTrendColor = (trend: string) => {
    switch (trend) {
      case "increasing":
        return "#00C851";
      case "decreasing":
        return "#ff4444";
      case "stable":
        return "#ffbb33";
      default:
        return "#666";
    }
  };

  const getVolumeTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <FontAwesomeIcon icon="long-arrow-alt-up" />;
      case "decreasing":
        return <FontAwesomeIcon icon="long-arrow-alt-down" />;
      case "stable":
        return <FontAwesomeIcon icon="arrow-right" />;
      default:
        return <FontAwesomeIcon icon="arrow-right" />;
    }
  };

  const getVolumeStrengthColor = (strength: string) => {
    switch (strength) {
      case "high":
        return "#00C851";
      case "medium":
        return "#ffbb33";
      case "low":
        return "#ff4444";
      default:
        return "#666";
    }
  };

  const getSpikeSignificanceColor = (significance: string) => {
    switch (significance) {
      case "high":
        return "#00C851";
      case "medium":
        return "#ffbb33";
      case "low":
        return "#ff4444";
      default:
        return "#666";
    }
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toLocaleString();
  };

  return (
    <div className="breakout-display">
      {" "}
      <div className="breakout-header">
        <span className="breakout-title">
          <FontAwesomeIcon icon="chart-line" /> Breakout Analysis
        </span>
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
        </div>        <div className="metric-row">
          <span className="metric-label">Volatility:</span>
          <span className="metric-value">
            {formatPercent(breakoutStrategy.volatility)}%
          </span>
        </div>

        {/* MACD Indicator */}
        {breakoutStrategy.technicalIndicators?.macd && (
          <div className="metric-row">
            <span className="metric-label">MACD:</span>
            <span 
              className="metric-value"
              style={{
                color: breakoutStrategy.technicalIndicators.macd.histogram > 0 ? "#00C851" : "#ff4444"
              }}
            >
              {breakoutStrategy.technicalIndicators.macd.macd.toFixed(4)}
              <span className="macd-histogram" style={{ fontSize: "0.8em", marginLeft: "4px" }}>
                ({breakoutStrategy.technicalIndicators.macd.histogram > 0 ? "+" : ""}{breakoutStrategy.technicalIndicators.macd.histogram.toFixed(4)})
              </span>
            </span>
          </div>
        )}

        {/* Moving Averages */}
        {breakoutStrategy.technicalIndicators?.ema12 && breakoutStrategy.technicalIndicators?.ema26 && (
          <div className="metric-row">
            <span className="metric-label">EMA Cross:</span>
            <span 
              className="metric-value"
              style={{
                color: breakoutStrategy.technicalIndicators.ema12 > breakoutStrategy.technicalIndicators.ema26 ? "#00C851" : "#ff4444"
              }}
            >
              {breakoutStrategy.technicalIndicators.ema12 > breakoutStrategy.technicalIndicators.ema26 ? "Bullish" : "Bearish"}
              <FontAwesomeIcon 
                icon={breakoutStrategy.technicalIndicators.ema12 > breakoutStrategy.technicalIndicators.ema26 ? "arrow-up" : "arrow-down"} 
                style={{ marginLeft: "4px" }}
              />
            </span>
          </div>
        )}
      </div>

      {/* Technical Indicators Section */}
      {breakoutStrategy.technicalIndicators && (
        <div className="technical-indicators">
          <h4 className="indicators-title">
            <FontAwesomeIcon icon="chart-line" /> Technical Indicators
          </h4>
          <div className="indicators-grid">
            {breakoutStrategy.technicalIndicators.sma20 && (
              <div className="indicator-item">
                <span className="indicator-label">SMA 20:</span>
                <span className="indicator-value">${formatPrice(breakoutStrategy.technicalIndicators.sma20)}</span>
              </div>
            )}
            {breakoutStrategy.technicalIndicators.sma50 && (
              <div className="indicator-item">
                <span className="indicator-label">SMA 50:</span>
                <span className="indicator-value">${formatPrice(breakoutStrategy.technicalIndicators.sma50)}</span>
              </div>
            )}
            {breakoutStrategy.technicalIndicators.ema12 && (
              <div className="indicator-item">
                <span className="indicator-label">EMA 12:</span>
                <span className="indicator-value">${formatPrice(breakoutStrategy.technicalIndicators.ema12)}</span>
              </div>
            )}
            {breakoutStrategy.technicalIndicators.ema26 && (
              <div className="indicator-item">
                <span className="indicator-label">EMA 26:</span>
                <span className="indicator-value">${formatPrice(breakoutStrategy.technicalIndicators.ema26)}</span>
              </div>
            )}
            {breakoutStrategy.technicalIndicators.bollingerBands && (
              <>
                <div className="indicator-item">
                  <span className="indicator-label">BB Upper:</span>
                  <span className="indicator-value">${formatPrice(breakoutStrategy.technicalIndicators.bollingerBands.upper)}</span>
                </div>
                <div className="indicator-item">
                  <span className="indicator-label">BB Lower:</span>
                  <span className="indicator-value">${formatPrice(breakoutStrategy.technicalIndicators.bollingerBands.lower)}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Volume Analysis Section */}
      {breakoutStrategy.volumeAnalysis && (
        <div className="section">
          <h4 className="section-title">
            <FontAwesomeIcon icon="chart-bar" /> Volume Analysis
          </h4>
          <div className="volume-analysis-grid">
            <div className="volume-row">
              <span className="metric-label">Current Volume:</span>
              <span className="metric-value">
                {formatLargeNumber(breakoutStrategy.volumeAnalysis.currentVolume)}
              </span>
            </div>
            
            <div className="volume-row">
              <span className="metric-label">Avg Volume:</span>
              <span className="metric-value">
                {formatLargeNumber(breakoutStrategy.volumeAnalysis.avgVolume)}
              </span>
            </div>
            
            <div className="volume-row">
              <span className="metric-label">Volume Ratio:</span>
              <span 
                className="metric-value"
                style={{
                  color: getVolumeRatioColor(breakoutStrategy.volumeAnalysis.volumeRatio)
                }}
              >
                {breakoutStrategy.volumeAnalysis.volumeRatio.toFixed(2)}x
              </span>
            </div>
            
            <div className="volume-row">
              <span className="metric-label">VWAP:</span>
              <span className="metric-value">
                ${formatPrice(breakoutStrategy.volumeAnalysis.vwap)}
              </span>
            </div>
            
            <div className="volume-row">
              <span className="metric-label">Volume Trend:</span>
              <span 
                className="metric-value"
                style={{
                  color: getVolumeTrendColor(breakoutStrategy.volumeAnalysis.volumeTrend)
                }}
              >
                {getVolumeTrendIcon(breakoutStrategy.volumeAnalysis.volumeTrend)} {breakoutStrategy.volumeAnalysis.volumeTrend}
              </span>
            </div>
            
            <div className="volume-row">
              <span className="metric-label">Volume Strength:</span>
              <span 
                className="metric-value"
                style={{
                  color: getVolumeStrengthColor(breakoutStrategy.volumeAnalysis.volumeStrength)
                }}
              >
                {breakoutStrategy.volumeAnalysis.volumeStrength}
              </span>
            </div>

            {/* Volume Spikes */}
            {breakoutStrategy.volumeAnalysis.volumeSpikes.length > 0 && (
              <div className="volume-spikes">
                <span className="metric-label">Recent Volume Spikes:</span>
                <div className="spikes-list">
                  {breakoutStrategy.volumeAnalysis.volumeSpikes.slice(0, 3).map((spike, index) => (
                    <div key={index} className="spike-item">
                      <span className="spike-date">{new Date(spike.date).toLocaleDateString()}</span>
                      <span 
                        className="spike-ratio"
                        style={{
                          color: getSpikeSignificanceColor(spike.significance)
                        }}
                      >
                        {spike.ratio.toFixed(1)}x ({spike.significance})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
