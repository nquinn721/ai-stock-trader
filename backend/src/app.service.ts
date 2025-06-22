import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getHealth() {
    const startTime = Date.now();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: 'healthy',
        api: 'healthy',
      },
    };
  }
}
