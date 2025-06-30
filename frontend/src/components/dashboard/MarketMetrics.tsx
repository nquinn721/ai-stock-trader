import { ArrowUpward, TrendingDown, TrendingUp } from "@mui/icons-material";
import React from "react";

interface MarketAnalytics {
  totalStocks: number;
  gainers: number;
  losers: number;
  avgChange: number;
  totalVolume: number;
  totalMarketCap: number;
  buySignals: number;
  sellSignals: number;
  holdSignals: number;
  topGainer: any;
  topLoser: any;
}

interface MarketMetricsProps {
  analytics: MarketAnalytics;
  isConnected: boolean;
}

/**
 * MarketMetrics - Displays key market metrics and analytics
 */
const MarketMetrics: React.FC<MarketMetricsProps> = ({
  analytics,
  isConnected,
}) => {
  const formatVolume = (volume: number) => {
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`;
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(2)}K`;
    return volume.toLocaleString();
  };

  const formatMarketCap = (cap: number) => {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    return `$${cap.toLocaleString()}`;
  };

  return (
    <div className="metrics-section">
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-header">
            <TrendingUp className="metric-icon" />
            <span>Market Overview</span>
          </div>
          <div className="metric-content">
            <div className="metric-row">
              <span>Total Stocks</span>
              <span className="metric-value">{analytics.totalStocks}</span>
            </div>
            <div className="metric-row">
              <span>Gainers</span>
              <span className="metric-value positive">{analytics.gainers}</span>
            </div>
            <div className="metric-row">
              <span>Losers</span>
              <span className="metric-value negative">{analytics.losers}</span>
            </div>
            <div className="metric-row">
              <span>Avg Change</span>
              <span
                className={`metric-value ${analytics.avgChange >= 0 ? "positive" : "negative"}`}
              >
                {analytics.avgChange >= 0 ? "+" : ""}
                {analytics.avgChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <TrendingDown className="metric-icon" />
            <span>Volume & Cap</span>
          </div>
          <div className="metric-content">
            <div className="metric-row">
              <span>Total Volume</span>
              <span className="metric-value">
                {formatVolume(analytics.totalVolume)}
              </span>
            </div>
            <div className="metric-row">
              <span>Market Cap</span>
              <span className="metric-value">
                {formatMarketCap(analytics.totalMarketCap)}
              </span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-header">
            <ArrowUpward className="metric-icon" />
            <span>Trading Signals</span>
          </div>
          <div className="metric-content">
            <div className="metric-row">
              <span>Buy Signals</span>
              <span className="metric-value buy">{analytics.buySignals}</span>
            </div>
            <div className="metric-row">
              <span>Sell Signals</span>
              <span className="metric-value sell">{analytics.sellSignals}</span>
            </div>
            <div className="metric-row">
              <span>Hold Signals</span>
              <span className="metric-value hold">{analytics.holdSignals}</span>
            </div>
          </div>
        </div>

        {analytics.topGainer && (
          <div className="metric-card">
            <div className="metric-header">
              <ArrowUpward className="metric-icon positive" />
              <span>Top Performer</span>
            </div>
            <div className="metric-content">
              <div className="metric-row">
                <span>Top Gainer</span>
                <span className="metric-value">
                  {analytics.topGainer.symbol}
                  <span className="positive">
                    +{analytics.topGainer.changePercent.toFixed(2)}%
                  </span>
                </span>
              </div>
              {analytics.topLoser && (
                <div className="metric-row">
                  <span>Top Loser</span>
                  <span className="metric-value">
                    {analytics.topLoser.symbol}
                    <span className="negative">
                      {analytics.topLoser.changePercent.toFixed(2)}%
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div
        className={`connection-status ${isConnected ? "connected" : "disconnected"}`}
      >
        <span className="status-indicator"></span>
        <span>{isConnected ? "Live Market Data" : "Disconnected"}</span>
      </div>
    </div>
  );
};

export default MarketMetrics;
