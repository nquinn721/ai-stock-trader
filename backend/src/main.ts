// CRITICAL: Load crypto polyfill FIRST
require('./setup-crypto');

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static files (React build) in production
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    app.useStaticAssets(join(__dirname, '..', 'public'));
    app.setBaseViewsDir(join(__dirname, '..', 'public'));
  }

  // Enable CORS for development
  app.enableCors({
    origin: isProduction
      ? true
      : [
          'http://localhost:3000', // Frontend development
        ],
    credentials: true,
  });

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Enable validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  // Setup Swagger documentation (disabled temporarily for Cloud Run compatibility)
  // const config = new DocumentBuilder()
  //   .setTitle('Stock Trading API')
  //   .setDescription(
  //     'API for stock trading application with real-time data and sentiment analysis',
  //   )
  //   .setVersion('1.0')
  //   .addTag('stocks')
  //   .addTag('trading')
  //   .addTag('news')
  //   .addTag('websocket')
  //   .build();

  // const document = SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('api', app, document);

  // Add a comprehensive health check endpoint for Cloud Run and debugging
  // This responds immediately for startup probes, even if ML modules are still loading
  app.getHttpAdapter().get('/health', async (req: any, res: any) => {
    try {
      const appContext = app.get('DatabaseInitializationService');
      let dbHealth = { database: false, tables: {}, connection: {} };

      if (appContext) {
        try {
          dbHealth = await appContext.healthCheck();
        } catch (error) {
          console.error('Database health check failed:', error);
        }
      }

      const healthStatus = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
        database: dbHealth,
      };

      res.status(200).json(healthStatus);
    } catch (error) {
      console.error('Health check error:', error);
      res.status(500).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  });

  // SPA routing support - serve index.html for non-API routes in production
  // This approach avoids path-to-regexp errors with wildcard routes
  if (isProduction) {
    app.getHttpAdapter().use((req: any, res: any, next: any) => {
      // Skip for API routes, static files, and health checks
      if (
        req.url.startsWith('/api') ||
        req.url.startsWith('/socket.io') ||
        req.url.startsWith('/health') ||
        req.url.includes('.') // Skip files with extensions (CSS, JS, etc.)
      ) {
        return next();
      }

      // For all other routes, serve the React app's index.html
      res.sendFile(join(__dirname, '..', 'public', 'index.html'));
    });
  }

  if (!isProduction) {
    // Development mode - show API info at root
    app.getHttpAdapter().get('/', (req: any, res: any) => {
      res.status(200).json({
        message: 'Stock Trading App API - Development Mode',
        status: 'running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        frontend: 'http://localhost:3000',
      });
    });
  }

  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(
    `Swagger documentation available at: http://localhost:${port}/api`,
  );
}
bootstrap();
