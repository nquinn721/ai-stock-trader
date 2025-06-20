import axios from "axios";
import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { Stock, TradingSignal } from "../types";
import "./Dashboard.css";
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
          </div>{" "}
          <div className="stats">
            <span>Stocks: {stocksWithSignals.length}</span>
            <span title="Trading signals that are currently valid and haven't expired or been replaced">
              Active Signals: {signals.filter((s) => s.isActive).length}
            </span>
          </div>
        </div>{" "}
      </header>{" "}
      <div className="dashboard-controls">
        {" "}
        <div className="dashboard-action-buttons">
          <button
            className="refresh-btn"
            onClick={() => {
              fetchStocksWithSignals();
              fetchTradingSignals();
            }}
          >
            Refresh Data
          </button>
        </div>
      </div>
      {/* Paper Trading Section */}
      <div className="paper-trading-section">
        <PortfolioSummary />
        <QuickTrade />
      </div>{" "}
      <div className="trading-signals-summary">
        <h2>Latest Trading Signals</h2>
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
        ))}
      </div>
      {stocksWithSignals.length === 0 && (
        <div className="no-stocks">
          <p>No stocks available. Please check your backend connection.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
