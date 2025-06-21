import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useSocket } from "../context/SocketContext";
import { useStockStore, usePortfolioStore } from "../stores/StoreContext";
import "./Dashboard.css";
import PortfolioChart from "./PortfolioChart";
import PortfolioSummary from "./PortfolioSummary";
import QuickTrade from "./QuickTrade";
import StockCard from "./StockCard";

const Dashboard: React.FC = observer(() => {
  const { isConnected } = useSocket();
  const stockStore = useStockStore();
  const portfolioStore = usePortfolioStore();
  
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "1D" | "1W" | "1M" | "3M" | "1Y"
  >("1M");

  // Get top performing stock for main chart display
  const topStock =
    stockStore.stocks.find((s) => s.changePercent && s.changePercent > 0) ||
    stockStore.stocks[0];
  useEffect(() => {
    // Fetch initial data from MobX stores
    stockStore.fetchStocks();
    stockStore.fetchTradingSignals();
    portfolioStore.fetchPortfolio(1);
  }, [stockStore, portfolioStore]);

  if (stockStore.isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading stock data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Stock Trading Dashboard</h1>
        <div className="header-info">
          <div
            className={`connection-status ${
              isConnected ? "connected" : "disconnected"
            }`}
          >
            {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
          </div>{" "}          <div className="stats">
            <span>Stocks: {stockStore.stocks.length}</span>
            <span title="Trading signals that are currently valid and haven't expired or been replaced">
              Active Signals: {stockStore.tradingSignals.filter((s) => s.isActive).length}
            </span>
          </div>
        </div>{" "}
      </header>{" "}
      {/* Paper Trading Section */}
      <div className="paper-trading-section">
        <div className="portfolio-overview">
          <PortfolioSummary />{" "}          <PortfolioChart
            userId={1}
            timeframe={selectedTimeframe}
            height={240}
            onTimeframeChange={setSelectedTimeframe}
          />
        </div>{" "}
        <QuickTrade />
      </div>{" "}
      <div className="trading-signals-summary">
        <h2>Latest Trading Signals</h2>        {stockStore.tradingSignals.length === 0 ? (
          <div className="no-data-message">
            <p>No trading signals available - Real API integration required</p>
          </div>
        ) : (
          <div className="signals-grid">
            {stockStore.tradingSignals.slice(0, 3).map((signal, index) => (
              <div key={index} className="signal-summary">
                <div className="signal-stock">
                  {signal.symbol || "Unknown"}
                </div>
                <div className={`signal-type ${signal.signal}`}>
                  {signal.signal.toUpperCase()}
                </div>
                <div className="signal-conf">
                  {(signal.confidence * 100).toFixed(1)}% confidence
                </div>
              </div>
            ))}
          </div>
        )}
      </div>{" "}
      <div className="stocks-grid">        {stockStore.stocks.map((stock) => (
          <div key={stock.id} className="stock-container">
            <StockCard
              stock={stock}
              signal={stockStore.tradingSignals.find(s => s.symbol === stock.symbol)}
            />
          </div>
        ))}
      </div>{" "}
      {stockStore.stocks.length === 0 && (
        <div className="no-data-message">
          <h3>No Stock Data Available</h3>
          <p>
            Real stock market API integration is required to display live stock
            data.
          </p>
          <p>
            Please configure API keys for Yahoo Finance, Alpha Vantage, or
            similar services.
          </p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
