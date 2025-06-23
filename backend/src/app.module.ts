import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { News } from './entities/news.entity';
import { Order } from './entities/order.entity';
import { Portfolio } from './entities/portfolio.entity';
import { Position } from './entities/position.entity';
import { Stock } from './entities/stock.entity';
import { Trade } from './entities/trade.entity';
import { TradingSignal } from './entities/trading-signal.entity';
import { BreakoutModule } from './modules/breakout/breakout.module';
import {
  MLABTest,
  MLFeatureImportance,
  MLMetric,
  MLModel,
  MLModelPerformance,
  MLPrediction,
} from './modules/ml/entities/ml.entities';
import { MLModule } from './modules/ml/ml.module';
import { NewsModule } from './modules/news/news.module';
import { 
  NotificationEntity, 
  NotificationPreferenceEntity, 
  NotificationTemplateEntity 
} from './modules/notification/entities/notification.entities';
import { NotificationModule } from './modules/notification/notification.module';
import { OrderManagementModule } from './modules/order-management/order-management.module';
import { PaperTradingModule } from './modules/paper-trading/paper-trading.module';
import { StockModule } from './modules/stock/stock.module';
import { TradingModule } from './modules/trading/trading.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { SeedService } from './services/seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DATABASE_HOST'),
        port: +configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USERNAME'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),        entities: [
          Stock,
          News,
          TradingSignal,
          Portfolio,
          Position,
          Trade,
          Order,
          MLModel,
          MLPrediction,
          MLMetric,
          MLABTest,
          MLFeatureImportance,
          MLModelPerformance,
          NotificationEntity,
          NotificationPreferenceEntity,
          NotificationTemplateEntity,
        ],
        synchronize: true, // Don't use in production
        logging: false, // Disabled to clean up console output
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Stock]),    StockModule,
    WebsocketModule,
    NewsModule,
    TradingModule,
    PaperTradingModule,
    OrderManagementModule,
    BreakoutModule,
    MLModule,
    NotificationModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {}
