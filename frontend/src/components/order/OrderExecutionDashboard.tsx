/**
 * =============================================================================
 * ORDER EXECUTION DASHBOARD - S45 Implementation
 * =============================================================================
 *
 * Comprehensive order visualization component that provides real-time
 * visualization of pending orders, execution progress, recommendation
 * pipeline status, and performance analytics for the automated trading system.
 *
 * Features:
 * - Real-time order status monitoring
 * - Order execution pipeline visualization
 * - Daily performance metrics
 * - Order type breakdown charts
 * - Success rate tracking
 * - Volume and P&L analytics
 * =============================================================================
 */

import {
  Assessment,
  AutoGraph,
  BarChart,
  CheckCircle,
  Error,
  HourglassEmpty,
  Schedule,
  Timeline,
  TrendingUp,
} from "@mui/icons-material";
import { Alert, Box, Chip, LinearProgress, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import orderManagementService, {
  DailyOrderSummary,
  OrderExecutionMetrics,
  ProcessingStatus,
} from "../../services/orderManagementService";
import { ContentCard, LoadingState, StatusChip, TradingButton } from "../ui";
import "./OrderExecutionDashboard.css";

interface OrderExecutionDashboardProps {
  portfolioIds: number[];
  refreshInterval?: number;
}

interface OrderPipelineStatus {
  pending: number;
  triggered: number;
  executing: number;
  completed: number;
  failed: number;
}

const OrderExecutionDashboard: React.FC<OrderExecutionDashboardProps> = ({
  portfolioIds,
  refreshInterval = 30000,
}) => {
  const [metrics, setMetrics] = useState<OrderExecutionMetrics[]>([]);
  const [aggregatedMetrics, setAggregatedMetrics] = useState<any>(null);
  const [processingStatus, setProcessingStatus] =
    useState<ProcessingStatus | null>(null);
  const [todaysSummaries, setTodaysSummaries] = useState<DailyOrderSummary[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Simulated pipeline status - in real implementation, this would come from WebSocket
  const [pipelineStatus, setPipelineStatus] = useState<OrderPipelineStatus>({
    pending: 0,
    triggered: 0,
    executing: 0,
    completed: 0,
    failed: 0,
  });

  useEffect(() => {
    if (portfolioIds.length > 0) {
      loadOrderData();
      const interval = setInterval(loadOrderData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [portfolioIds, refreshInterval]);

  const loadOrderData = async () => {
    try {
      setError(null);

      // Load data in parallel
      const [portfolioMetrics, aggregated, status, summaries] =
        await Promise.all([
          Promise.all(
            portfolioIds.map((id) =>
              orderManagementService.getOrderExecutionMetrics(id)
            )
          ),
          orderManagementService.getAllPortfoliosMetrics(portfolioIds),
          orderManagementService.getProcessingStatus(),
          Promise.all(
            portfolioIds.map((id) =>
              orderManagementService.getTodayOrderSummary(id)
            )
          ),
        ]);

      setMetrics(portfolioMetrics);
      setAggregatedMetrics(aggregated);
      setProcessingStatus(status);
      setTodaysSummaries(summaries);

      // Update pipeline status based on metrics
      updatePipelineStatus(portfolioMetrics);

      setLastUpdate(new Date());
    } catch (err: any) {
      console.error("Error loading order data:", err);
      setError(`Failed to load order data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updatePipelineStatus = (metrics: OrderExecutionMetrics[]) => {
    const status: OrderPipelineStatus = {
      pending: metrics.reduce((sum, m) => sum + m.pendingOrders, 0),
      triggered: 0, // Would come from real-time data
      executing: 0, // Would come from real-time data
      completed: metrics.reduce((sum, m) => sum + m.executedOrdersToday, 0),
      failed: metrics.reduce(
        (sum, m) =>
          sum + (m.totalOrdersToday - m.executedOrdersToday - m.pendingOrders),
        0
      ),
    };

    setPipelineStatus(status);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString();
  };

  if (loading && metrics.length === 0) {
    return (
      <LoadingState
        variant="spinner"
        message="Loading order execution data..."
        size="lg"
      />
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <TradingButton
          variant="secondary"
          size="sm"
          onClick={loadOrderData}
          sx={{ ml: 2 }}
        >
          Retry
        </TradingButton>
      </Alert>
    );
  }

  const totalOrders =
    pipelineStatus.pending + pipelineStatus.completed + pipelineStatus.failed;
  const completionRate =
    totalOrders > 0 ? (pipelineStatus.completed / totalOrders) * 100 : 0;

  return (
    <div className="order-execution-dashboard">
      {/* Header with Real-time Status */}
      <div className="dashboard-header">
        <div className="status-section">
          <StatusChip
            status={processingStatus?.isValidTradingDay ? "success" : "warning"}
            label={`Market ${processingStatus?.marketStatus || "Unknown"}`}
            animated={processingStatus?.isValidTradingDay}
          />
          <Typography variant="body2" color="text.secondary">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Typography>
        </div>

        <TradingButton
          variant="secondary"
          size="sm"
          onClick={loadOrderData}
          disabled={loading}
          loading={loading}
          startIcon={<Assessment />}
        >
          Refresh Data
        </TradingButton>
      </div>

      {/* Order Pipeline Visualization */}
      <ContentCard
        title="Order Execution Pipeline"
        subtitle="Real-time order processing status"
        variant="gradient"
        padding="lg"
        className="pipeline-card"
        headerActions={
          <StatusChip
            status={pipelineStatus.pending > 0 ? "warning" : "success"}
            label={`${pipelineStatus.pending} pending`}
            animated={pipelineStatus.pending > 0}
          />
        }
      >
        <div className="pipeline-visualization">
          <div className="pipeline-stage">
            <div className="stage-icon pending">
              <HourglassEmpty />
            </div>
            <div className="stage-info">
              <Typography variant="h6">{pipelineStatus.pending}</Typography>
              <Typography variant="body2">Pending</Typography>
            </div>
          </div>

          <div className="pipeline-arrow">→</div>

          <div className="pipeline-stage">
            <div className="stage-icon triggered">
              <Schedule />
            </div>
            <div className="stage-info">
              <Typography variant="h6">{pipelineStatus.triggered}</Typography>
              <Typography variant="body2">Triggered</Typography>
            </div>
          </div>

          <div className="pipeline-arrow">→</div>

          <div className="pipeline-stage">
            <div className="stage-icon executing">
              <AutoGraph />
            </div>
            <div className="stage-info">
              <Typography variant="h6">{pipelineStatus.executing}</Typography>
              <Typography variant="body2">Executing</Typography>
            </div>
          </div>

          <div className="pipeline-arrow">→</div>

          <div className="pipeline-stage">
            <div className="stage-icon completed">
              <CheckCircle />
            </div>
            <div className="stage-info">
              <Typography variant="h6">{pipelineStatus.completed}</Typography>
              <Typography variant="body2">Completed</Typography>
            </div>
          </div>

          {pipelineStatus.failed > 0 && (
            <>
              <div className="pipeline-arrow error">⚠</div>
              <div className="pipeline-stage">
                <div className="stage-icon failed">
                  <Error />
                </div>
                <div className="stage-info">
                  <Typography variant="h6">{pipelineStatus.failed}</Typography>
                  <Typography variant="body2">Failed</Typography>
                </div>
              </div>
            </>
          )}
        </div>

        {totalOrders > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" gutterBottom>
              Completion Rate: {completionRate.toFixed(1)}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={completionRate}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}
      </ContentCard>

      {/* Performance Metrics Grid */}
      <div className="metrics-grid">
        {/* Aggregated Metrics */}
        {aggregatedMetrics && (
          <ContentCard
            title="Today's Performance"
            subtitle="Aggregated metrics across all portfolios"
            variant="default"
            padding="md"
            className="metrics-card"
          >
            <div className="metrics-content">
              <div className="metric-item">
                <TrendingUp className="metric-icon success" />
                <div className="metric-data">
                  <Typography variant="h5">
                    {formatNumber(aggregatedMetrics.totalExecuted)}/
                    {formatNumber(aggregatedMetrics.totalOrders)}
                  </Typography>
                  <Typography variant="body2">Orders Executed</Typography>
                </div>
              </div>

              <div className="metric-item">
                <BarChart className="metric-icon primary" />
                <div className="metric-data">
                  <Typography variant="h5">
                    {aggregatedMetrics.averageSuccessRate.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2">Success Rate</Typography>
                </div>
              </div>

              <div className="metric-item">
                <Assessment className="metric-icon warning" />
                <div className="metric-data">
                  <Typography variant="h5">
                    {formatCurrency(aggregatedMetrics.totalPnL)}
                  </Typography>
                  <Typography variant="body2">P&L Today</Typography>
                </div>
              </div>

              <div className="metric-item">
                <Timeline className="metric-icon info" />
                <div className="metric-data">
                  <Typography variant="h5">
                    {formatNumber(aggregatedMetrics.totalVolume)}
                  </Typography>
                  <Typography variant="body2">Volume Traded</Typography>
                </div>
              </div>
            </div>
          </ContentCard>
        )}

        {/* Portfolio-specific metrics */}
        {metrics.map((metric, index) => {
          const summary = todaysSummaries.find(
            (s) => s.portfolioId === metric.portfolioId
          );
          return (
            <ContentCard
              key={metric.portfolioId}
              title={`Portfolio ${metric.portfolioId}`}
              subtitle="Individual performance metrics"
              variant="default"
              padding="md"
              className="portfolio-metrics-card"
              headerActions={
                <StatusChip
                  status={
                    metric.executedOrdersToday > 0 ? "success" : "inactive"
                  }
                  label={`${metric.executedOrdersToday} executed`}
                  animated={metric.pendingOrders > 0}
                />
              }
            >
              <div className="portfolio-metrics">
                <div className="metric-row">
                  <Typography variant="body2">Orders Today:</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {metric.totalOrdersToday}
                  </Typography>
                </div>

                <div className="metric-row">
                  <Typography variant="body2">Success Rate:</Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {metric.successRateToday.toFixed(1)}%
                  </Typography>
                </div>

                <div className="metric-row">
                  <Typography variant="body2">Pending Orders:</Typography>
                  <Chip
                    label={metric.pendingOrders}
                    size="small"
                    color={metric.pendingOrders > 0 ? "warning" : "default"}
                  />
                </div>

                <div className="metric-row">
                  <Typography variant="body2">P&L Today:</Typography>
                  <Typography
                    variant="body1"
                    fontWeight="bold"
                    color={metric.pnlToday >= 0 ? "success.main" : "error.main"}
                  >
                    {formatCurrency(metric.pnlToday)}
                  </Typography>
                </div>

                {summary && (
                  <div className="metric-row">
                    <Typography variant="body2">Commissions:</Typography>
                    <Typography variant="body1">
                      {formatCurrency(summary.commissions)}
                    </Typography>
                  </div>
                )}
              </div>
            </ContentCard>
          );
        })}
      </div>

      {/* Next Scheduled Events */}
      {processingStatus && (
        <ContentCard
          title="Scheduled Processing Events"
          subtitle="Upcoming market and EOD processing times"
          variant="default"
          padding="md"
          className="schedule-card"
        >
          <div className="schedule-events">
            <div className="event-item">
              <Schedule className="event-icon" />
              <div className="event-info">
                <Typography variant="body2" fontWeight="bold">
                  Market Open
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatTime(processingStatus.nextScheduledRuns.marketOpen)}
                </Typography>
              </div>
            </div>

            <div className="event-item">
              <Schedule className="event-icon" />
              <div className="event-info">
                <Typography variant="body2" fontWeight="bold">
                  Market Close
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatTime(processingStatus.nextScheduledRuns.marketClose)}
                </Typography>
              </div>
            </div>

            <div className="event-item">
              <Assessment className="event-icon" />
              <div className="event-info">
                <Typography variant="body2" fontWeight="bold">
                  EOD Processing
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatTime(processingStatus.nextScheduledRuns.eodProcessing)}
                </Typography>
              </div>
            </div>

            <div className="event-item">
              <AutoGraph className="event-icon" />
              <div className="event-info">
                <Typography variant="body2" fontWeight="bold">
                  Hourly Maintenance
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {formatTime(
                    processingStatus.nextScheduledRuns.hourlyMaintenance
                  )}
                </Typography>
              </div>
            </div>
          </div>
        </ContentCard>
      )}
    </div>
  );
};

export default OrderExecutionDashboard;
