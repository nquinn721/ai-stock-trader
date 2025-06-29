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

  // Add a simple health check endpoint for Cloud Run
  app.getHttpAdapter().get('/health', (req: any, res: any) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Add a root endpoint for debugging
  app.getHttpAdapter().get('/', (req: any, res: any) => {
    res.status(200).json({
      message: 'Stock Trading App API',
      status: 'running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  // Catch-all handler temporarily disabled for Cloud Run deployment
  // Will be re-enabled once path-to-regexp compatibility is resolved

  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(
    `Swagger documentation available at: http://localhost:${port}/api`,
  );
}
bootstrap();
