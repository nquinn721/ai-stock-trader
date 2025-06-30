import { Controller, Get } from '@nestjs/common';
import { WebSocketHealthService } from './websocket-health.service';

@Controller('websocket/health')
export class WebSocketHealthController {
  constructor(private readonly healthService: WebSocketHealthService) {}

  /**
   * Get WebSocket health status
   */
  @Get('health')
  getHealthStatus() {
    return this.healthService.getHealthStatus();
  }

  /**
   * Get detailed system metrics
   */
  @Get('metrics')
  getSystemMetrics() {
    return this.healthService.getSystemMetrics();
  }

  /**
   * Get connection metrics for a specific client
   */
  @Get('metrics/:clientId')
  getConnectionMetrics(clientId: string) {
    return this.healthService.getConnectionMetrics(clientId);
  }

  /**
   * Reset all metrics (admin endpoint)
   */
  @Get('reset-metrics')
  resetMetrics() {
    this.healthService.resetMetrics();
    return { message: 'Metrics reset successfully' };
  }
}
