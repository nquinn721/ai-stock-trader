import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

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
    origin: isProduction ? true : [
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

  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Stock Trading API')
    .setDescription(
      'API for stock trading application with real-time data and sentiment analysis',
    )
    .setVersion('1.0')
    .addTag('stocks')
    .addTag('trading')
    .addTag('news')
    .addTag('websocket')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Catch-all handler: send back React's index.html file for SPA routing
  if (isProduction) {
    app.getHttpAdapter().get('*', (req, res) => {
      if (!req.url.startsWith('/api') && !req.url.startsWith('/socket.io')) {
        res.sendFile(join(__dirname, '..', 'public', 'index.html'));
      }
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
