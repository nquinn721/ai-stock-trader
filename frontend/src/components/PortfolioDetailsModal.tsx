import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Portfolio, Position, Trade } from "../types";
import EmptyState from "./EmptyState";
import PortfolioChart from "./PortfolioChart";
import "./PortfolioDetailsModal.css";

interface PortfolioDetailsModalProps {
  portfolio: Portfolio;
  isOpen: boolean;
  onClose: () => void;
}

interface PortfolioPerformance {
  totalValue: number;
  totalPnL: number;
  totalReturn: number;
  dayGain: number;
  dayGainPercent: number;
  positions: Position[];
  trades: Trade[];
  analytics: {
    bestPerformer?: Position;
    worstPerformer?: Position;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    averageGain: number;
    averageLoss: number;
  };
}

const PortfolioDetailsModal: React.FC<PortfolioDetailsModalProps> = ({
  portfolio,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"overview" | "positions" | "history">("overview");
  const [performance, setPerformance] = useState<PortfolioPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<"1D" | "1W" | "1M" | "3M" | "1Y">("1M");

  useEffect(() => {
    if (isOpen && portfolio) {
      fetchPortfolioPerformance();
    }
  }, [isOpen, portfolio]);

  const fetchPortfolioPerformance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch portfolio performance data
      const performanceResponse = await axios.get(
        `http://localhost:8000/paper-trading/portfolios/${portfolio.id}/performance`
      );
      
      // Fetch portfolio details with positions and trades
      const detailsResponse = await axios.get(
        `http://localhost:8000/paper-trading/portfolios/${portfolio.id}`
      );
      
      const portfolioData = detailsResponse.data;
      const positions = portfolioData.positions || [];
      const trades = portfolioData.trades || [];
      
      // Calculate analytics
      const analytics = calculateAnalytics(positions, trades);
        setPerformance({
        totalValue: portfolio.totalValue,
        totalPnL: portfolio.totalPnL,
        totalReturn: portfolio.totalReturn,
        dayGain: performanceResponse.data.dayGain || 0,
        dayGainPercent: performanceResponse.data.dayGainPercent || 0,
        positions,
        trades,
        analytics: {
          ...analytics,
          bestPerformer: analytics.bestPerformer || undefined,
          worstPerformer: analytics.worstPerformer || undefined,
        },
      });
    } catch (err) {
      console.error("Error fetching portfolio performance:", err);
      setError("Failed to load portfolio performance data");
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (positions: Position[], trades: Trade[]) => {
    const bestPerformer = positions.reduce((best, pos) => 
      !best || pos.unrealizedPnL > best.unrealizedPnL ? pos : best, null as Position | null
    );
    
    const worstPerformer = positions.reduce((worst, pos) => 
      !worst || pos.unrealizedPnL < worst.unrealizedPnL ? pos : worst, null as Position | null
    );
    
    const executedTrades = trades.filter(trade => trade.status === "executed");
    const winningTrades = executedTrades.filter(trade => {
      // For sell trades, calculate if they were profitable
      if (trade.type === "sell") {
        const buyTrades = executedTrades.filter(t => 
          t.symbol === trade.symbol && t.type === "buy" && 
          new Date(t.executedAt) < new Date(trade.executedAt)
        );
        if (buyTrades.length > 0) {
          const avgBuyPrice = buyTrades.reduce((sum, t) => sum + t.price, 0) / buyTrades.length;
          return trade.price > avgBuyPrice;
        }
      }
      return false;
    });
    
    const losingTrades = executedTrades.length - winningTrades.length;
    const winRate = executedTrades.length > 0 ? (winningTrades.length / executedTrades.length) * 100 : 0;
    
    return {
      bestPerformer,
      worstPerformer,
      totalTrades: executedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades,
      winRate,
      averageGain: 0, // Would need more complex calculation
      averageLoss: 0,  // Would need more complex calculation
    };
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    const numValue = Number(amount) || 0;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numValue);
  };

  const formatPercent = (percent: number | string | null | undefined) => {
    const numValue = Number(percent) || 0;
    return `${numValue >= 0 ? "+" : ""}${numValue.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="portfolio-modal-overlay" onClick={onClose}>
      <div className="portfolio-modal" onClick={(e) => e.stopPropagation()}>
        <div className="portfolio-modal-header">
          <div className="portfolio-modal-title">
            <h2>{portfolio.name}</h2>
            <span className="portfolio-type-badge">
              {portfolio.portfolioType || "BASIC"}
            </span>
          </div>
          <button className="close-modal-btn" onClick={onClose}>
            <FontAwesomeIcon icon="times" />
          </button>
        </div>

        <div className="portfolio-modal-content">
          {loading ? (
            <EmptyState
              type="loading"
              icon={<FontAwesomeIcon icon="clock" />}
              title="Loading Portfolio Details"
              description="Fetching performance data, positions, and trading history..."
              size="large"
            />
          ) : error ? (
            <EmptyState
              type="error"
              icon={<FontAwesomeIcon icon="exclamation-triangle" />}
              title="Error Loading Portfolio"
              description={error}
              size="large"
              action={{
                label: "Retry",
                onClick: fetchPortfolioPerformance,
              }}
            />
          ) : (
            <>
              {/* Tab Navigation */}
              <div className="modal-tabs">
                <button
                  className={`tab ${activeTab === "overview" ? "active" : ""}`}
                  onClick={() => setActiveTab("overview")}
                >
                  <FontAwesomeIcon icon="chart-pie" />
                  Overview
                </button>
                <button
                  className={`tab ${activeTab === "positions" ? "active" : ""}`}
                  onClick={() => setActiveTab("positions")}
                >
                  <FontAwesomeIcon icon="briefcase" />
                  Positions ({performance?.positions.length || 0})
                </button>
                <button
                  className={`tab ${activeTab === "history" ? "active" : ""}`}
                  onClick={() => setActiveTab("history")}
                >
                  <FontAwesomeIcon icon="history" />
                  Trading History ({performance?.trades.length || 0})
                </button>
              </div>

              {/* Tab Content */}
              <div className="modal-tab-content">
                {activeTab === "overview" && performance && (
                  <div className="overview-tab">
                    {/* Performance Metrics */}
                    <div className="performance-metrics">
                      <div className="metric-card">
                        <span className="metric-label">Total Value</span>
                        <span className="metric-value large">
                          {formatCurrency(performance.totalValue)}
                        </span>
                      </div>
                      <div className="metric-card">
                        <span className="metric-label">Total P&L</span>
                        <span className={`metric-value large ${performance.totalPnL >= 0 ? "positive" : "negative"}`}>
                          {formatCurrency(performance.totalPnL)}
                        </span>
                      </div>
                      <div className="metric-card">
                        <span className="metric-label">Total Return</span>
                        <span className={`metric-value large ${performance.totalReturn >= 0 ? "positive" : "negative"}`}>
                          {formatPercent(performance.totalReturn)}
                        </span>
                      </div>
                      <div className="metric-card">
                        <span className="metric-label">Day Gain</span>
                        <span className={`metric-value ${performance.dayGain >= 0 ? "positive" : "negative"}`}>
                          {formatCurrency(performance.dayGain)} ({formatPercent(performance.dayGainPercent)})
                        </span>
                      </div>
                    </div>

                    {/* Portfolio Chart */}
                    <div className="chart-section">
                      <div className="chart-header">
                        <h3>Performance Chart</h3>
                      </div>
                      <PortfolioChart
                        portfolioId={portfolio.id}
                        timeframe={selectedTimeframe}
                        height={300}
                        onTimeframeChange={setSelectedTimeframe}
                      />
                    </div>

                    {/* Analytics Summary */}
                    <div className="analytics-section">
                      <h3>Trading Analytics</h3>
                      <div className="analytics-grid">
                        <div className="analytics-card">
                          <span className="analytics-label">Total Trades</span>
                          <span className="analytics-value">{performance.analytics.totalTrades}</span>
                        </div>
                        <div className="analytics-card">
                          <span className="analytics-label">Win Rate</span>
                          <span className="analytics-value">{performance.analytics.winRate.toFixed(1)}%</span>
                        </div>
                        <div className="analytics-card">
                          <span className="analytics-label">Best Performer</span>
                          <span className="analytics-value">
                            {performance.analytics.bestPerformer?.symbol || "N/A"}
                          </span>
                        </div>
                        <div className="analytics-card">
                          <span className="analytics-label">Worst Performer</span>
                          <span className="analytics-value">
                            {performance.analytics.worstPerformer?.symbol || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "positions" && performance && (
                  <div className="positions-tab">
                    {performance.positions.length === 0 ? (
                      <EmptyState
                        type="no-data"
                        icon={<FontAwesomeIcon icon="briefcase" />}
                        title="No Positions"
                        description="This portfolio doesn't have any open positions yet"
                        size="medium"
                      />
                    ) : (
                      <div className="positions-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Symbol</th>
                              <th>Quantity</th>
                              <th>Avg Price</th>
                              <th>Current Value</th>
                              <th>P&L</th>
                              <th>Return %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {performance.positions.map((position) => (
                              <tr key={position.id}>
                                <td className="symbol-cell">
                                  <strong>{position.symbol}</strong>
                                </td>
                                <td>{position.quantity}</td>
                                <td>{formatCurrency(position.averagePrice)}</td>
                                <td>{formatCurrency(position.currentValue)}</td>
                                <td className={position.unrealizedPnL >= 0 ? "positive" : "negative"}>
                                  {formatCurrency(position.unrealizedPnL)}
                                </td>
                                <td className={position.unrealizedReturn >= 0 ? "positive" : "negative"}>
                                  {formatPercent(position.unrealizedReturn)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "history" && performance && (
                  <div className="history-tab">
                    {performance.trades.length === 0 ? (
                      <EmptyState
                        type="no-data"
                        icon={<FontAwesomeIcon icon="history" />}
                        title="No Trading History"
                        description="This portfolio doesn't have any completed trades yet"
                        size="medium"
                      />
                    ) : (
                      <div className="trades-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Symbol</th>
                              <th>Type</th>
                              <th>Quantity</th>
                              <th>Price</th>
                              <th>Total Value</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {performance.trades
                              .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime())
                              .map((trade) => (
                              <tr key={trade.id}>
                                <td>{formatDate(trade.executedAt)}</td>
                                <td className="symbol-cell">
                                  <strong>{trade.symbol}</strong>
                                </td>
                                <td>
                                  <span className={`trade-type ${trade.type}`}>
                                    {trade.type.toUpperCase()}
                                  </span>
                                </td>
                                <td>{trade.quantity}</td>
                                <td>{formatCurrency(trade.price)}</td>
                                <td>{formatCurrency(trade.totalValue)}</td>
                                <td>
                                  <span className={`trade-status ${trade.status}`}>
                                    {trade.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioDetailsModal;
