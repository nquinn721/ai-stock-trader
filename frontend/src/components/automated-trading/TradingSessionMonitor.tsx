import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { useAutoTradingStore } from "../../stores/StoreContext";
import "./TradingSessionMonitor.css";

const TradingSessionMonitor: React.FC = observer(() => {
  const autoTradingStore = useAutoTradingStore();
  const [selectedTab, setSelectedTab] = useState<
    "activity" | "alerts" | "performance"
  >("activity");
  const [filterPeriod, setFilterPeriod] = useState<"today" | "week" | "month">(
    "today"
  );
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    // Load initial data
    autoTradingStore.fetchActiveTrades();
    autoTradingStore.fetchTradingSessions();

    // Set up auto-refresh
    let refreshInterval: NodeJS.Timeout;
    if (autoRefresh) {
      refreshInterval = setInterval(() => {
        autoTradingStore.fetchActiveTrades();
        autoTradingStore.fetchTradingSessions();
      }, 5000); // Refresh every 5 seconds
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh]);

  const getFilteredTrades = () => {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let cutoff: Date;
    switch (filterPeriod) {
      case "today":
        cutoff = startOfDay;
        break;
      case "week":
        cutoff = startOfWeek;
        break;
      case "month":
        cutoff = startOfMonth;
        break;
      default:
        cutoff = startOfDay;
    }

    return autoTradingStore.tradeHistory.filter(
      (trade) => new Date(trade.executedAt || trade.createdAt) >= cutoff
    );
  };

  const getFilteredAlerts = () => {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

    return autoTradingStore.alerts.filter(
      (alert) => new Date(alert.timestamp) >= cutoff
    );
  };

  const getTradeStatusColor = (status: string) => {
    switch (status) {
      case "executed":
        return "success";
      case "pending":
        return "warning";
      case "cancelled":
        return "error";
      case "failed":
        return "error";
      default:
        return "inactive";
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "error";
      case "warning":
        return "warning";
      case "info":
        return "info";
      default:
        return "inactive";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const calculateSessionMetrics = () => {
    const activeSessions = autoTradingStore.tradingSessions.filter(
      (session) => session.status === "active"
    );
    const totalSessions = autoTradingStore.tradingSessions.length;
    const totalTrades = getFilteredTrades().length;
    const totalPnL = getFilteredTrades().reduce(
      (sum, trade) => sum + (trade.pnl || 0),
      0
    );
    const successfulTrades = getFilteredTrades().filter(
      (trade) => (trade.pnl || 0) > 0
    ).length;
    const successRate =
      totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0;

    return {
      activeSessions: activeSessions.length,
      totalSessions,
      totalTrades,
      totalPnL,
      successRate,
    };
  };

  const metrics = calculateSessionMetrics();

  return (
    <div className="trading-session-monitor">
      {/* Header with metrics */}
      <div className="monitor-header">
        <div className="header-content">
          <h3>Trading Session Monitor</h3>
          <div className="refresh-controls">
            <label className="auto-refresh">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh
            </label>
            <button
              className="refresh-btn"
              onClick={() => {
                autoTradingStore.fetchActiveTrades();
                autoTradingStore.fetchTradingSessions();
              }}
            >
              🔄
            </button>
          </div>
        </div>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-value">{metrics.activeSessions}</div>
            <div className="metric-label">Active Sessions</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{metrics.totalTrades}</div>
            <div className="metric-label">
              Trades{" "}
              {filterPeriod === "today" ? "Today" : `This ${filterPeriod}`}
            </div>
          </div>
          <div className="metric-card">
            <div
              className={`metric-value ${
                metrics.totalPnL >= 0 ? "positive" : "negative"
              }`}
            >
              {formatCurrency(metrics.totalPnL)}
            </div>
            <div className="metric-label">Total P&L</div>
          </div>
          <div className="metric-card">
            <div
              className={`metric-value ${
                metrics.successRate >= 60 ? "positive" : "negative"
              }`}
            >
              {Number(metrics.successRate || 0).toFixed(1)}%
            </div>
            <div className="metric-label">Success Rate</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${selectedTab === "activity" ? "active" : ""}`}
          onClick={() => setSelectedTab("activity")}
        >
          Trading Activity
          {autoTradingStore.activeTrades.length > 0 && (
            <span className="badge">
              {autoTradingStore.activeTrades.length}
            </span>
          )}
        </button>
        <button
          className={`tab-btn ${selectedTab === "alerts" ? "active" : ""}`}
          onClick={() => setSelectedTab("alerts")}
        >
          Alerts & Warnings
          {getFilteredAlerts().length > 0 && (
            <span className="badge alert">{getFilteredAlerts().length}</span>
          )}
        </button>
        <button
          className={`tab-btn ${selectedTab === "performance" ? "active" : ""}`}
          onClick={() => setSelectedTab("performance")}
        >
          Performance
        </button>
      </div>

      {/* Filter Controls */}
      <div className="filter-controls">
        <div className="period-filter">
          <label>Time Period:</label>
          <select
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value as any)}
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {selectedTab === "activity" && (
          <div className="activity-tab">
            {/* Active Trades */}
            {autoTradingStore.activeTrades.length > 0 && (
              <div className="section">
                <h4>Active Trades</h4>
                <div className="trades-list">
                  {autoTradingStore.activeTrades.map((trade) => (
                    <div
                      key={trade.id}
                      className={`trade-card ${getTradeStatusColor(
                        trade.status
                      )}`}
                    >
                      <div className="trade-header">
                        <div className="trade-symbol">
                          <span className="symbol">{trade.symbol}</span>
                          <span
                            className={`action ${trade.action.toLowerCase()}`}
                          >
                            {trade.action}
                          </span>
                        </div>
                        <div className="trade-status">
                          <span
                            className={`status-badge ${getTradeStatusColor(
                              trade.status
                            )}`}
                          >
                            {trade.status}
                          </span>
                        </div>
                      </div>
                      <div className="trade-details">
                        <div className="detail">
                          <label>Quantity:</label>
                          <span>{trade.quantity}</span>
                        </div>
                        <div className="detail">
                          <label>Price:</label>
                          <span>{formatCurrency(trade.price)}</span>
                        </div>
                        <div className="detail">
                          <label>Value:</label>
                          <span>
                            {formatCurrency(trade.quantity * trade.price)}
                          </span>
                        </div>
                        <div className="detail">
                          <label>Created:</label>
                          <span>
                            {new Date(trade.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      {trade.pnl !== undefined && (
                        <div
                          className={`trade-pnl ${
                            trade.pnl >= 0 ? "positive" : "negative"
                          }`}
                        >
                          P&L: {formatCurrency(trade.pnl)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trade History */}
            <div className="section">
              <h4>Recent Trade History</h4>
              {getFilteredTrades().length === 0 ? (
                <div className="no-data">
                  <p>No trades found for the selected period.</p>
                </div>
              ) : (
                <div className="trades-list">
                  {getFilteredTrades()
                    .sort(
                      (a, b) =>
                        new Date(b.executedAt || b.createdAt).getTime() -
                        new Date(a.executedAt || a.createdAt).getTime()
                    )
                    .slice(0, 20)
                    .map((trade) => (
                      <div
                        key={trade.id}
                        className={`trade-card ${getTradeStatusColor(
                          trade.status
                        )}`}
                      >
                        <div className="trade-header">
                          <div className="trade-symbol">
                            <span className="symbol">{trade.symbol}</span>
                            <span
                              className={`action ${trade.action.toLowerCase()}`}
                            >
                              {trade.action}
                            </span>
                          </div>
                          <div className="trade-time">
                            {new Date(
                              trade.executedAt || trade.createdAt
                            ).toLocaleString()}
                          </div>
                        </div>
                        <div className="trade-details">
                          <div className="detail">
                            <label>Quantity:</label>
                            <span>{trade.quantity}</span>
                          </div>
                          <div className="detail">
                            <label>Price:</label>
                            <span>{formatCurrency(trade.price)}</span>
                          </div>
                          <div className="detail">
                            <label>Rule:</label>
                            <span>{trade.ruleName || "N/A"}</span>
                          </div>
                          {trade.pnl !== undefined && (
                            <div className="detail">
                              <label>P&L:</label>
                              <span
                                className={
                                  trade.pnl >= 0 ? "positive" : "negative"
                                }
                              >
                                {formatCurrency(trade.pnl)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === "alerts" && (
          <div className="alerts-tab">
            <div className="section">
              <h4>Recent Alerts & Warnings</h4>
              {getFilteredAlerts().length === 0 ? (
                <div className="no-data">
                  <p>No alerts in the last 24 hours.</p>
                </div>
              ) : (
                <div className="alerts-list">
                  {getFilteredAlerts()
                    .sort(
                      (a, b) =>
                        new Date(b.timestamp).getTime() -
                        new Date(a.timestamp).getTime()
                    )
                    .map((alert) => (
                      <div
                        key={alert.id}
                        className={`alert-card ${getAlertSeverityColor(
                          alert.severity
                        )}`}
                      >
                        <div className="alert-header">
                          <div className="alert-type">
                            <span
                              className={`severity-badge ${getAlertSeverityColor(
                                alert.severity
                              )}`}
                            >
                              {alert.severity}
                            </span>
                            <span className="alert-title">{alert.title}</span>
                          </div>
                          <div className="alert-time">
                            {new Date(alert.timestamp).toLocaleString()}
                          </div>
                        </div>
                        <div className="alert-message">{alert.message}</div>
                        {alert.portfolioId && (
                          <div className="alert-context">
                            Portfolio: {alert.portfolioId}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === "performance" && (
          <div className="performance-tab">
            <div className="section">
              <h4>Session Performance Overview</h4>
              <div className="performance-grid">
                {autoTradingStore.tradingSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`session-card ${session.status}`}
                  >
                    <div className="session-header">
                      <div className="session-info">
                        <h5>Portfolio {session.portfolioId}</h5>
                        <span className={`status-indicator ${session.status}`}>
                          {session.status}
                        </span>
                      </div>
                      <div className="session-time">
                        Started: {new Date(session.startTime).toLocaleString()}
                      </div>
                    </div>

                    {session.performance && (
                      <div className="session-metrics">
                        <div className="metric">
                          <label>Total P&L:</label>
                          <span
                            className={
                              session.performance.totalPnL >= 0
                                ? "positive"
                                : "negative"
                            }
                          >
                            {formatCurrency(session.performance.totalPnL)}
                          </span>
                        </div>
                        <div className="metric">
                          <label>Trades:</label>
                          <span>{session.performance.totalTrades}</span>
                        </div>
                        <div className="metric">
                          <label>Success Rate:</label>
                          <span
                            className={
                              session.performance.successRate >= 60
                                ? "positive"
                                : "negative"
                            }
                          >
                            {Number(
                              session.performance.successRate || 0
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                        <div className="metric">
                          <label>Avg P&L:</label>
                          <span
                            className={
                              session.performance.averagePnL >= 0
                                ? "positive"
                                : "negative"
                            }
                          >
                            {formatCurrency(session.performance.averagePnL)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading indicator */}
      {autoTradingStore.isLoading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      )}
    </div>
  );
});

export { TradingSessionMonitor };
export default TradingSessionMonitor;
