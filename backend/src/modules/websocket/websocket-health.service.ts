import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface ConnectionMetrics {
  clientId: string;
  connectedAt: Date;
  lastActivity: Date;
  messagesSent: number;
  messagesReceived: number;
  averageLatency: number;
  connectionQuality: 'good' | 'poor' | 'bad';
  errorCount: number;
}

@Injectable()
export class WebSocketHealthService {
  private connectionMetrics: Map<string, ConnectionMetrics> = new Map();
  private systemMetrics = {
    totalConnections: 0,
    peakConnections: 0,
    averageLatency: 0,
    messageRate: 0,
    errorRate: 0,
    uptime: Date.now(),
  };

  /**
   * Track connection metrics
   */
  trackConnection(clientId: string) {
    const now = new Date();
    this.connectionMetrics.set(clientId, {
      clientId,
      connectedAt: now,
      lastActivity: now,
      messagesSent: 0,
      messagesReceived: 0,
      averageLatency: 0,
      connectionQuality: 'good',
      errorCount: 0,
    });

    this.systemMetrics.totalConnections++;
    this.systemMetrics.peakConnections = Math.max(
      this.systemMetrics.peakConnections,
      this.connectionMetrics.size,
    );
  }

  /**
   * Update connection activity
   */
  updateActivity(
    clientId: string,
    type: 'sent' | 'received' | 'error',
    latency?: number,
  ) {
    const metrics = this.connectionMetrics.get(clientId);
    if (!metrics) return;

    metrics.lastActivity = new Date();

    switch (type) {
      case 'sent':
        metrics.messagesSent++;
        break;
      case 'received':
        metrics.messagesReceived++;
        break;
      case 'error':
        metrics.errorCount++;
        break;
    }

    if (latency !== undefined) {
      // Calculate rolling average latency
      const alpha = 0.1; // Smoothing factor
      metrics.averageLatency =
        metrics.averageLatency === 0
          ? latency
          : alpha * latency + (1 - alpha) * metrics.averageLatency;

      // Update connection quality based on latency
      if (metrics.averageLatency > 1000) {
        metrics.connectionQuality = 'bad';
      } else if (metrics.averageLatency > 500) {
        metrics.connectionQuality = 'poor';
      } else {
        metrics.connectionQuality = 'good';
      }
    }
  }

  /**
   * Remove connection metrics
   */
  removeConnection(clientId: string) {
    this.connectionMetrics.delete(clientId);
  }

  /**
   * Get connection metrics for a client
   */
  getConnectionMetrics(clientId: string): ConnectionMetrics | undefined {
    return this.connectionMetrics.get(clientId);
  }

  /**
   * Get system-wide metrics
   */
  getSystemMetrics() {
    const activeConnections = this.connectionMetrics.size;
    const totalLatency = Array.from(this.connectionMetrics.values()).reduce(
      (sum, metrics) => sum + metrics.averageLatency,
      0,
    );
    const averageLatency =
      activeConnections > 0 ? totalLatency / activeConnections : 0;

    const totalMessages = Array.from(this.connectionMetrics.values()).reduce(
      (sum, metrics) => sum + metrics.messagesSent + metrics.messagesReceived,
      0,
    );
    const uptime = Date.now() - this.systemMetrics.uptime;
    const messageRate = totalMessages / (uptime / 1000); // messages per second

    const totalErrors = Array.from(this.connectionMetrics.values()).reduce(
      (sum, metrics) => sum + metrics.errorCount,
      0,
    );
    const errorRate =
      totalMessages > 0 ? (totalErrors / totalMessages) * 100 : 0;

    return {
      ...this.systemMetrics,
      activeConnections,
      averageLatency,
      messageRate,
      errorRate,
      uptime,
    };
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    const metrics = this.getSystemMetrics();
    const poorConnections = Array.from(this.connectionMetrics.values()).filter(
      (m) => m.connectionQuality !== 'good',
    ).length;

    const healthScore = Math.max(
      0,
      100 -
        ((metrics.averageLatency > 500 ? 20 : 0) +
          (metrics.errorRate > 5 ? 30 : 0) +
          (poorConnections / metrics.activeConnections) * 50),
    );

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthScore >= 80) {
      status = 'healthy';
    } else if (healthScore >= 50) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      score: healthScore,
      metrics,
      issues: {
        highLatency: metrics.averageLatency > 500,
        highErrorRate: metrics.errorRate > 5,
        poorConnections: poorConnections > 0,
      },
    };
  }

  /**
   * Periodic health check and cleanup
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  performHealthCheck() {
    const health = this.getHealthStatus();
    console.log(`🔍 WebSocket Health Check:`, {
      status: health.status,
      score: health.score,
      activeConnections: health.metrics.activeConnections,
      averageLatency: `${health.metrics.averageLatency.toFixed(2)}ms`,
      messageRate: `${health.metrics.messageRate.toFixed(2)}/s`,
      errorRate: `${health.metrics.errorRate.toFixed(2)}%`,
    });

    // Log warnings for degraded performance
    if (health.status !== 'healthy') {
      console.warn(`⚠️ WebSocket performance degraded:`, health.issues);
    }

    // Cleanup stale connection metrics
    this.cleanupStaleConnections();
  }

  /**
   * Cleanup connections that haven't been active for a while
   */
  private cleanupStaleConnections() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const staleConnections = Array.from(this.connectionMetrics.entries())
      .filter(([_, metrics]) => metrics.lastActivity < fiveMinutesAgo)
      .map(([clientId]) => clientId);

    staleConnections.forEach((clientId) => {
      console.log(`🧹 Cleaning up stale connection metrics for ${clientId}`);
      this.connectionMetrics.delete(clientId);
    });
  }

  /**
   * Reset system metrics
   */
  resetMetrics() {
    this.connectionMetrics.clear();
    this.systemMetrics = {
      totalConnections: 0,
      peakConnections: 0,
      averageLatency: 0,
      messageRate: 0,
      errorRate: 0,
      uptime: Date.now(),
    };
  }
}
