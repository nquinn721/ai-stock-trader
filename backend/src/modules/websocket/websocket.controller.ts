import { Controller, Get } from '@nestjs/common';
import { WebSocketHealthService } from './websocket-health.service';

@Controller('websocket')
export class WebSocketController {
  constructor(private readonly healthService: WebSocketHealthService) {}

  @Get('health')
  getHealthStatus() {
    return this.healthService.getHealthStatus();
  }

  @Get('metrics')
  getSystemMetrics() {
    return this.healthService.getSystemMetrics();
  }

  @Get('connections')
  getActiveConnections() {
    const metrics = this.healthService.getSystemMetrics();
    return {
      activeConnections: metrics.activeConnections,
      peakConnections: metrics.peakConnections,
      totalConnections: metrics.totalConnections,
    };
  }
}
