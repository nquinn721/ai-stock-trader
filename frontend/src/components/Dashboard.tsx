import axios from "axios";
import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { TradingSignal } from "../types";
import "./Dashboard.css";
import PaperTrading from "./PaperTrading";
import StockCard from "./StockCard";

const Dashboard: React.FC = () => {
  const { isConnected, stocks, tradingSignals } = useSocket();
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [activeTab, setActiveTab] = useState<"dashboard" | "paper-trading">(
    "dashboard"
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTradingSignals();
  }, []);
  const fetchTradingSignals = async () => {
    try {
      const response = await axios.get("http://localhost:8000/trading/signals");
      setSignals(response.data);
    } catch (error) {
      console.error("Error fetching trading signals:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSignalForStock = (stockSymbol: string) => {
    return signals.find(
      (signal) => signal.stock?.symbol === stockSymbol && signal.isActive
    );
  };
  const analyzeStock = async (symbol: string) => {
    try {
      await axios.post(`http://localhost:8000/trading/analyze/${symbol}`);
      // Refresh signals after analysis
      setTimeout(fetchTradingSignals, 1000);
    } catch (error) {
      console.error("Error analyzing stock:", error);
    }
  };
  const analyzeAllStocks = async () => {
    try {
      setLoading(true);
      await axios.post("http://localhost:8000/trading/analyze-all");
      setTimeout(fetchTradingSignals, 2000);
    } catch (error) {
      console.error("Error analyzing all stocks:", error);
    } finally {
      setLoading(false);
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
          </div>
          <div className="stats">
            <span>Stocks: {stocks.length}</span>
            <span>
              Active Signals: {signals.filter((s) => s.isActive).length}
            </span>
          </div>
        </div>
      </header>{" "}
      <div className="dashboard-controls">
        <div className="tab-navigation">
          <button
            className={`tab-button ${
              activeTab === "dashboard" ? "active" : ""
            }`}
            onClick={() => setActiveTab("dashboard")}
          >
            Stock Dashboard
          </button>
          <button
            className={`tab-button ${
              activeTab === "paper-trading" ? "active" : ""
            }`}
            onClick={() => setActiveTab("paper-trading")}
          >
            Paper Trading
          </button>
        </div>

        {activeTab === "dashboard" && (
          <div className="dashboard-action-buttons">
            <button
              className="analyze-all-btn"
              onClick={analyzeAllStocks}
              disabled={loading}
            >
              Analyze All Stocks
            </button>
            <button className="refresh-btn" onClick={fetchTradingSignals}>
              Refresh Signals
            </button>
          </div>
        )}
      </div>
      {activeTab === "dashboard" ? (
        <>
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
          </div>
          <div className="stocks-grid">
            {stocks.map((stock) => (
              <div key={stock.id} className="stock-container">
                <StockCard
                  stock={stock}
                  signal={getSignalForStock(stock.symbol)}
                />
                <button
                  className="analyze-btn"
                  onClick={() => analyzeStock(stock.symbol)}
                >
                  Analyze {stock.symbol}
                </button>
              </div>
            ))}
          </div>{" "}
          {stocks.length === 0 && (
            <div className="no-stocks">
              <p>No stocks available. Please check your backend connection.</p>
            </div>
          )}
        </>
      ) : (
        <PaperTrading />
      )}
    </div>
  );
};

export default Dashboard;
