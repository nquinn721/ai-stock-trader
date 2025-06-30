import React, { useEffect, useState } from "react";
import "./EnterpriseDataIntelligence.css";

interface DataQualitySource {
  name: string;
  status: "healthy" | "degraded" | "offline";
  latency: number;
  accuracy: number;
  completeness: number;
  lastUpdate: Date;
}

interface LatencyMetrics {
  dataIngestion: { average: number; p95: number; p99: number };
  processing: { average: number; p95: number; p99: number };
  delivery: { average: number; p95: number; p99: number };
  endToEnd: { average: number; p95: number; p99: number };
}

interface ArbitrageOpportunity {
  symbol: string;
  type: string;
  exchanges: string[];
  priceDifference: number;
  profitPotential: number;
  riskLevel: string;
  confidence: number;
}

interface UnusualActivity {
  symbol: string;
  activityType: string;
  severity: string;
  description: string;
  timestamp: Date;
}

interface DashboardData {
  dataQuality: {
    overallScore: number;
    sources: DataQualitySource[];
    alerts: Array<{ severity: string; message: string; source: string }>;
  };
  latencyMetrics: LatencyMetrics;
  arbitrageOpportunities: ArbitrageOpportunity[];
  unusualActivity: UnusualActivity[];
  bufferStatus: { [symbol: string]: { size: number; latency: number } };
  systemStatus: {
    uptime: number;
    memoryUsage: any;
    cpuUsage: any;
  };
}

const EnterpriseDataIntelligence: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/data-intelligence/dashboard");
      const result = await response.json();

      if (result.success) {
        setDashboardData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatLatency = (latency: number): string => {
    return `${latency.toFixed(1)}ms`;
  };

  const formatUptime = (uptime: number): string => {
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "healthy":
        return "#22c55e";
      case "degraded":
        return "#f59e0b";
      case "offline":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case "low":
        return "#22c55e";
      case "medium":
        return "#f59e0b";
      case "high":
        return "#f97316";
      case "extreme":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  if (loading) {
    return (
      <div className="enterprise-dashboard loading">
        <div className="spinner"></div>
        <p>Loading Enterprise Data Intelligence...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="enterprise-dashboard error">
        <p>Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="enterprise-dashboard">
      <div className="dashboard-header">
        <h1>Enterprise Data Intelligence Platform</h1>
        <div className="system-status">
          <span className="uptime">
            Uptime: {formatUptime(dashboardData.systemStatus.uptime)}
          </span>
          <span className="overall-score">
            Data Quality: {dashboardData.dataQuality.overallScore.toFixed(1)}%
          </span>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={activeTab === "overview" ? "active" : ""}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={activeTab === "latency" ? "active" : ""}
          onClick={() => setActiveTab("latency")}
        >
          Latency Metrics
        </button>
        <button
          className={activeTab === "arbitrage" ? "active" : ""}
          onClick={() => setActiveTab("arbitrage")}
        >
          Arbitrage
        </button>
        <button
          className={activeTab === "activity" ? "active" : ""}
          onClick={() => setActiveTab("activity")}
        >
          Unusual Activity
        </button>
      </div>

      <div className="page-content">
        {activeTab === "overview" && (
          <div className="overview-tab">
            <div className="metrics-grid">
              <div className="metric-card">
                <h3>Data Quality Score</h3>
                <div className="metric-value large">
                  {dashboardData.dataQuality.overallScore.toFixed(1)}%
                </div>
                <div className="metric-trend positive">↗ Excellent</div>
              </div>

              <div className="metric-card">
                <h3>Average Latency</h3>
                <div className="metric-value large">
                  {formatLatency(dashboardData.latencyMetrics.endToEnd.average)}
                </div>
                <div className="metric-trend positive">↗ Sub-50ms</div>
              </div>

              <div className="metric-card">
                <h3>Active Arbitrage</h3>
                <div className="metric-value large">
                  {dashboardData.arbitrageOpportunities.length}
                </div>
                <div className="metric-trend">Opportunities</div>
              </div>

              <div className="metric-card">
                <h3>Alert Level</h3>
                <div className="metric-value large">
                  {dashboardData.unusualActivity.length}
                </div>
                <div className="metric-trend warning">Active Alerts</div>
              </div>
            </div>

            <div className="data-sources">
              <h3>Data Source Status</h3>
              <div className="sources-grid">
                {dashboardData.dataQuality.sources.map((source, index) => (
                  <div key={index} className="source-card">
                    <div className="source-header">
                      <span className="source-name">{source.name}</span>
                      <span
                        className="source-status"
                        style={{
                          backgroundColor: getStatusColor(source.status),
                        }}
                      >
                        {source.status}
                      </span>
                    </div>
                    <div className="source-metrics">
                      <div className="source-metric">
                        <span>Latency:</span>
                        <span>{formatLatency(source.latency)}</span>
                      </div>
                      <div className="source-metric">
                        <span>Accuracy:</span>
                        <span>{source.accuracy.toFixed(1)}%</span>
                      </div>
                      <div className="source-metric">
                        <span>Completeness:</span>
                        <span>{source.completeness.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "latency" && (
          <div className="latency-tab">
            <div className="latency-metrics">
              <h3>End-to-End Latency Breakdown</h3>
              <div className="latency-chart">
                <div className="latency-stage">
                  <h4>Data Ingestion</h4>
                  <div className="latency-values">
                    <span>
                      Avg:{" "}
                      {formatLatency(
                        dashboardData.latencyMetrics.dataIngestion.average
                      )}
                    </span>
                    <span>
                      P95:{" "}
                      {formatLatency(
                        dashboardData.latencyMetrics.dataIngestion.p95
                      )}
                    </span>
                    <span>
                      P99:{" "}
                      {formatLatency(
                        dashboardData.latencyMetrics.dataIngestion.p99
                      )}
                    </span>
                  </div>
                </div>

                <div className="latency-stage">
                  <h4>Processing</h4>
                  <div className="latency-values">
                    <span>
                      Avg:{" "}
                      {formatLatency(
                        dashboardData.latencyMetrics.processing.average
                      )}
                    </span>
                    <span>
                      P95:{" "}
                      {formatLatency(
                        dashboardData.latencyMetrics.processing.p95
                      )}
                    </span>
                    <span>
                      P99:{" "}
                      {formatLatency(
                        dashboardData.latencyMetrics.processing.p99
                      )}
                    </span>
                  </div>
                </div>

                <div className="latency-stage">
                  <h4>Delivery</h4>
                  <div className="latency-values">
                    <span>
                      Avg:{" "}
                      {formatLatency(
                        dashboardData.latencyMetrics.delivery.average
                      )}
                    </span>
                    <span>
                      P95:{" "}
                      {formatLatency(dashboardData.latencyMetrics.delivery.p95)}
                    </span>
                    <span>
                      P99:{" "}
                      {formatLatency(dashboardData.latencyMetrics.delivery.p99)}
                    </span>
                  </div>
                </div>

                <div className="latency-stage total">
                  <h4>Total End-to-End</h4>
                  <div className="latency-values">
                    <span>
                      Avg:{" "}
                      {formatLatency(
                        dashboardData.latencyMetrics.endToEnd.average
                      )}
                    </span>
                    <span>
                      P95:{" "}
                      {formatLatency(dashboardData.latencyMetrics.endToEnd.p95)}
                    </span>
                    <span>
                      P99:{" "}
                      {formatLatency(dashboardData.latencyMetrics.endToEnd.p99)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="buffer-status">
              <h3>Buffer Status</h3>
              <div className="buffer-grid">
                {Object.entries(dashboardData.bufferStatus).map(
                  ([symbol, status]) => (
                    <div key={symbol} className="buffer-card">
                      <div className="buffer-symbol">{symbol}</div>
                      <div className="buffer-metrics">
                        <span>Size: {status.size}</span>
                        <span>Latency: {formatLatency(status.latency)}</span>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "arbitrage" && (
          <div className="arbitrage-tab">
            <h3>Active Arbitrage Opportunities</h3>
            <div className="arbitrage-list">
              {dashboardData.arbitrageOpportunities.map(
                (opportunity, index) => (
                  <div key={index} className="arbitrage-card">
                    <div className="arbitrage-header">
                      <span className="arbitrage-symbol">
                        {opportunity.symbol}
                      </span>
                      <span className="arbitrage-type">
                        {opportunity.type.replace("_", " ")}
                      </span>
                      <span
                        className="arbitrage-risk"
                        style={{
                          backgroundColor: getSeverityColor(
                            opportunity.riskLevel
                          ),
                        }}
                      >
                        {opportunity.riskLevel} risk
                      </span>
                    </div>
                    <div className="arbitrage-details">
                      <div className="arbitrage-metric">
                        <span>Exchanges:</span>
                        <span>{opportunity.exchanges.join(" ↔ ")}</span>
                      </div>
                      <div className="arbitrage-metric">
                        <span>Price Difference:</span>
                        <span>
                          {(opportunity.priceDifference * 100).toFixed(3)}%
                        </span>
                      </div>
                      <div className="arbitrage-metric">
                        <span>Profit Potential:</span>
                        <span className="profit">
                          {(opportunity.profitPotential * 100).toFixed(3)}%
                        </span>
                      </div>
                      <div className="arbitrage-metric">
                        <span>Confidence:</span>
                        <span>
                          {(opportunity.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="activity-tab">
            <h3>Unusual Market Activity</h3>
            <div className="activity-list">
              {dashboardData.unusualActivity.map((activity, index) => (
                <div key={index} className="activity-card">
                  <div className="activity-header">
                    <span className="activity-symbol">{activity.symbol}</span>
                    <span className="activity-type">
                      {activity.activityType.replace("_", " ")}
                    </span>
                    <span
                      className="activity-severity"
                      style={{
                        backgroundColor: getSeverityColor(activity.severity),
                      }}
                    >
                      {activity.severity}
                    </span>
                  </div>
                  <div className="activity-description">
                    {activity.description}
                  </div>
                  <div className="activity-timestamp">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {dashboardData.dataQuality.alerts.length > 0 && (
        <div className="alerts-panel">
          <h3>System Alerts</h3>
          <div className="alerts-list">
            {dashboardData.dataQuality.alerts
              .slice(0, 5)
              .map((alert, index) => (
                <div key={index} className={`alert alert-${alert.severity}`}>
                  <span className="alert-source">{alert.source}:</span>
                  <span className="alert-message">{alert.message}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnterpriseDataIntelligence;
