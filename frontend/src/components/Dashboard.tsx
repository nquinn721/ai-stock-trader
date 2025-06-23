import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { Stock, TradingSignal } from "../types";
import "./Dashboard.css";
import EmptyState from "./EmptyState";
import NotificationCenter from "./NotificationCenter";
import PortfolioChart from "./PortfolioChart";
import PortfolioSummary from "./PortfolioSummary";
import QuickTrade from "./QuickTrade";
import StockCard from "./StockCard";

const Dashboard: React.FC = () => {
  const { isConnected, tradingSignals } = useSocket();
  const [stocksWithSignals, setStocksWithSignals] = useState<
    (Stock & { tradingSignal: TradingSignal | null })[]
  >([]);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    "1D" | "1W" | "1M" | "3M" | "1Y"
  >("1M");
  // Get top performing stock for main chart display
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const topStock =
    stocksWithSignals.find((s) => s.changePercent && s.changePercent > 0) ||
    stocksWithSignals[0];
  useEffect(() => {
    fetchStocksWithSignals();
    fetchTradingSignals();
  }, []);

  const fetchStocksWithSignals = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8000/stocks/with-signals/all"
      );
      setStocksWithSignals(response.data);
    } catch (error) {
      console.error("Error fetching stocks with signals:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTradingSignals = async () => {
    try {
      const response = await axios.get("http://localhost:8000/trading/signals");
      setSignals(response.data);
    } catch (error) {
      console.error("Error fetching trading signals:", error);
    }
  };
  if (loading) {
    return (
      <div className="dashboard">
        {" "}
        <EmptyState
          type="loading"
          icon={<FontAwesomeIcon icon="clock" />}
          title="Loading Stock Data"
          description="Fetching real-time market data and trading signals..."
          size="large"
        />
      </div>
    );
  }

  return (
    <div className="dashboard">      <header className="dashboard-header">
        <h1>Stock Trading Dashboard</h1>
        <div className="header-info">
          <div
            className={`connection-status ${
              isConnected ? "connected" : "disconnected"
            }`}
          >
            <FontAwesomeIcon
              icon="circle"
              style={{ color: isConnected ? "#00C851" : "#ff4444" }}
            />
            {isConnected ? " Connected" : " Disconnected"}
          </div>{" "}
          <div className="stats">
            <span>Stocks: {stocksWithSignals.length}</span>
            <span title="Trading signals that are currently valid and haven't expired or been replaced">
              Active Signals: {signals.filter((s) => s.isActive).length}
            </span>
          </div>
          <NotificationCenter />
        </div>{" "}
      </header>{" "}
      {/* Paper Trading Section */}
      <div className="paper-trading-section">
        <div className="portfolio-overview">
          <PortfolioSummary />{" "}
          <PortfolioChart
            portfolioId={1}
            timeframe={selectedTimeframe}
            height={240}
            onTimeframeChange={setSelectedTimeframe}
          />
        </div>{" "}
        <QuickTrade />
      </div>{" "}
      <div className="trading-signals-summary">
        <h2>Latest Trading Signals</h2>
        {tradingSignals.length === 0 ? (
          <div className="no-data-message">
            <p>No trading signals available - Real API integration required</p>
          </div>
        ) : (
          <div className="signals-grid">
            {tradingSignals.slice(0, 3).map((signal, index) => (
              <div key={index} className="signal-summary">
                <div className="signal-stock">
                  {signal.stock?.symbol || "Unknown"}
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
      <div className="stocks-grid">
        {stocksWithSignals.map((stockWithSignal) => (
          <div key={stockWithSignal.id} className="stock-container">
            {" "}
            <StockCard
              stock={stockWithSignal}
              signal={stockWithSignal.tradingSignal || undefined}
            />
          </div>
        ))}{" "}
      </div>{" "}
      {stocksWithSignals.length === 0 && (
        <EmptyState
          type="no-data"
          icon={<FontAwesomeIcon icon="chart-line" />}
          title="No Stock Data Available"
          description="Real stock market API integration is required to display live stock data. Please configure API keys for Yahoo Finance, Alpha Vantage, or similar services."
          size="large"
        />
      )}
    </div>
  );
};

export default Dashboard;
