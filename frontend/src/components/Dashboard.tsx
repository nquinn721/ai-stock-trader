import axios from "axios";
import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { Stock, TradingSignal } from "../types";
import "./Dashboard.css";
import PortfolioChart from "./PortfolioChart";
import PortfolioSummary from "./PortfolioSummary";
import PriceChart from "./PriceChart";
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
      {/* Paper Trading Section */}
      <div className="paper-trading-section">
        <div className="portfolio-overview">
          <PortfolioSummary />{" "}
          <PortfolioChart
            portfolioId={1}
            timeframe={selectedTimeframe}
            height={400}
            onTimeframeChange={setSelectedTimeframe}
          />
        </div>
        <QuickTrade />
      </div>
      {/* Market Overview with Real-time Charts */}
      <div className="market-overview-section">
        <h2>Market Overview</h2>
        <div className="charts-grid">
          {topStock && (
            <div className="main-chart">
              <h3>Featured Stock: {topStock.symbol}</h3>{" "}              <PriceChart
                symbol={topStock.symbol}
                currentPrice={topStock.currentPrice}
                changePercent={topStock.changePercent || 0}
                height={250}
                showRealTime={true}
                period="1H"
                interval={30000} // 30 seconds - much slower to prevent hanging
              />
            </div>
          )}{" "}
          {stocksWithSignals.slice(0, 3).map((stock) => (
            <div key={stock.id} className="mini-chart">              <PriceChart
                symbol={stock.symbol}
                currentPrice={stock.currentPrice}
                changePercent={stock.changePercent || 0}
                height={160}
                showRealTime={false}
                period="1H"
              />
            </div>
          ))}
        </div>
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
