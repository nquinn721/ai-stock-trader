import {
  faBolt,
  faChartLine,
  faCogs,
  faExclamationTriangle,
  faHistory,
  faPlay,
  faPlus,
  faRobot,
  faShieldHalved,
  faStop,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import {
  useAutoTradingStore,
  usePortfolioStore,
} from "../../stores/StoreContext";
import { Portfolio } from "../../types";
import AutoTradeHistory from "./AutoTradeHistory";
import "./AutoTradingDashboard.css";
import TradingControlPanel from "./TradingControlPanel";
import TradingPerformanceChart from "./TradingPerformanceChart";
import TradingRulesManager from "./TradingRulesManager";
import TradingSessionMonitor from "./TradingSessionMonitor";

interface AutoTradingDashboardProps {
  portfolios: Portfolio[];
}

const AutoTradingDashboard: React.FC<AutoTradingDashboardProps> = observer(
  ({ portfolios }) => {
    const autoTradingStore = useAutoTradingStore();
    const portfolioStore = usePortfolioStore();
    const [activeTab, setActiveTab] = useState<
      "overview" | "rules" | "sessions" | "history"
    >("overview");
    const [selectedPortfolioId, setSelectedPortfolioId] = useState<
      string | null
    >(null);

    useEffect(() => {
      // Load initial data when component mounts
      autoTradingStore.fetchTradingPerformance();
      autoTradingStore.fetchActiveTrades();

      if (selectedPortfolioId) {
        autoTradingStore.fetchTradingRules(selectedPortfolioId);
        autoTradingStore.fetchTradingSessions(selectedPortfolioId);
      }
    }, [autoTradingStore, selectedPortfolioId]);

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    };

    const formatPercentage = (value: number) => {
      return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
    };

    const {
      tradingPerformance,
      todaysPerformance,
      activeSessionsCount,
      activeRulesCount,
      unacknowledgedAlerts,
    } = autoTradingStore;

    return (
      <div className="auto-trading-dashboard">
        {/* Header with Emergency Stop */}
        <div className="dashboard-header">
          <div className="header-title">
            <FontAwesomeIcon icon={faRobot} />
            <h2>Automated Trading Dashboard</h2>
            <div className="status-indicator">
              <div
                className={`status-dot ${
                  autoTradingStore.isGlobalTradingActive ? "active" : "inactive"
                }`}
              />
              <span>
                {autoTradingStore.isGlobalTradingActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
          <div className="header-actions">
            {unacknowledgedAlerts.length > 0 && (
              <div className="alerts-badge">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                <span>{unacknowledgedAlerts.length}</span>
              </div>
            )}
            <button
              className="emergency-stop-btn"
              onClick={() => autoTradingStore.emergencyStop()}
            >
              <FontAwesomeIcon icon={faStop} />
              Emergency Stop
            </button>
          </div>
        </div>

        {/* Global Performance Summary */}
        <div className="performance-summary">
          <div className="summary-card">
            <div className="card-icon">
              <FontAwesomeIcon icon={faChartLine} />
            </div>
            <div className="card-content">
              <h3>Total P&L</h3>
              <div className="metric-value">
                {tradingPerformance
                  ? formatCurrency(tradingPerformance.globalPnL)
                  : "--"}
              </div>
              <div className="metric-subtitle">
                Today: {formatCurrency(todaysPerformance.pnl)}
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon">
              <FontAwesomeIcon icon={faBolt} />
            </div>
            <div className="card-content">
              <h3>Active Sessions</h3>
              <div className="metric-value">{activeSessionsCount}</div>
              <div className="metric-subtitle">
                {tradingPerformance?.totalActiveSessions || 0} total portfolios
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon">
              <FontAwesomeIcon icon={faCogs} />
            </div>
            <div className="card-content">
              <h3>Active Rules</h3>
              <div className="metric-value">{activeRulesCount}</div>
              <div className="metric-subtitle">
                {autoTradingStore.tradingRules.length} total rules
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon">
              <FontAwesomeIcon icon={faShieldHalved} />
            </div>
            <div className="card-content">
              <h3>Win Rate</h3>
              <div className="metric-value">
                {tradingPerformance
                  ? formatPercentage(tradingPerformance.winRate)
                  : "--"}
              </div>
              <div className="metric-subtitle">
                {todaysPerformance.trades} trades today
              </div>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div className="global-controls">
          <div className="controls-section">
            <h3>Global Trading Controls</h3>
            <div className="control-buttons">
              {autoTradingStore.isGlobalTradingActive ? (
                <button
                  className="control-btn stop-btn"
                  onClick={() => autoTradingStore.stopGlobalTrading()}
                  disabled={autoTradingStore.isLoading}
                >
                  <FontAwesomeIcon icon={faStop} />
                  Stop All Trading
                </button>
              ) : (
                <button
                  className="control-btn start-btn"
                  onClick={() => autoTradingStore.startGlobalTrading()}
                  disabled={autoTradingStore.isLoading}
                >
                  <FontAwesomeIcon icon={faPlay} />
                  Start All Trading
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Portfolio Selection */}
        <div className="portfolio-selection">
          <h3>Select Portfolio</h3>
          <div className="portfolio-tabs">
            <button
              className={`portfolio-tab ${
                selectedPortfolioId === null ? "active" : ""
              }`}
              onClick={() => setSelectedPortfolioId(null)}
            >
              All Portfolios
            </button>
            {portfolios.map((portfolio) => (
              <button
                key={portfolio.id}
                className={`portfolio-tab ${
                  selectedPortfolioId === portfolio.id.toString()
                    ? "active"
                    : ""
                }`}
                onClick={() => setSelectedPortfolioId(portfolio.id.toString())}
              >
                {portfolio.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="dashboard-tabs">
          <button
            className={`tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <FontAwesomeIcon icon={faChartLine} />
            Overview
          </button>
          <button
            className={`tab ${activeTab === "rules" ? "active" : ""}`}
            onClick={() => setActiveTab("rules")}
          >
            <FontAwesomeIcon icon={faCogs} />
            Trading Rules
          </button>
          <button
            className={`tab ${activeTab === "sessions" ? "active" : ""}`}
            onClick={() => setActiveTab("sessions")}
          >
            <FontAwesomeIcon icon={faPlay} />
            Sessions
          </button>
          <button
            className={`tab ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <FontAwesomeIcon icon={faHistory} />
            Trade History
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === "overview" && (
            <div className="overview-content">
              {/* Trading Control Panel */}
              <div className="overview-section full-width">
                <TradingControlPanel portfolios={portfolios} />
              </div>

              {/* Session Monitor */}
              <div className="overview-section full-width">
                <TradingSessionMonitor />
              </div>

              {/* Performance Chart */}
              <div className="overview-section full-width">
                <TradingPerformanceChart
                  portfolioId={selectedPortfolioId || undefined}
                  timeRange="1w"
                />
              </div>

              {/* Recent Activity */}
              <div className="overview-section full-width">
                <div className="section-header">
                  <h3>Recent Trading Activity</h3>
                </div>
                <div className="recent-activity">
                  {autoTradingStore.activeTrades.slice(0, 5).map((trade) => (
                    <div key={trade.id} className="activity-item">
                      <div className="activity-icon">
                        <FontAwesomeIcon
                          icon={trade.type === "buy" ? faPlus : faStop}
                        />
                      </div>
                      <div className="activity-content">
                        {/* Activity content */}
                        <div className="activity-title">
                          {trade.type.toUpperCase()} {trade.quantity} shares of{" "}
                          {trade.symbol}
                        </div>
                        <div className="activity-subtitle">
                          {trade.executedPrice
                            ? formatCurrency(trade.executedPrice)
                            : "Pending"}{" "}
                          • {new Date(trade.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className={`activity-status ${trade.status}`}>
                        {trade.status}
                      </div>
                    </div>
                  ))}
                  {autoTradingStore.activeTrades.length === 0 && (
                    <div className="no-activity">
                      <p>No recent trading activity</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "rules" && (
            <TradingRulesManager
              portfolioId={selectedPortfolioId || undefined}
            />
          )}

          {activeTab === "sessions" && <TradingSessionMonitor />}

          {activeTab === "history" && (
            <AutoTradeHistory portfolioId={selectedPortfolioId || undefined} />
          )}
        </div>

        {/* Error Display */}
        {autoTradingStore.error && (
          <div className="error-banner">
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <span>{autoTradingStore.error}</span>
            <button onClick={() => autoTradingStore.clearError()}>×</button>
          </div>
        )}
      </div>
    );
  }
);

export default AutoTradingDashboard;
