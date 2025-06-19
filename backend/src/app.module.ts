import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { News } from './entities/news.entity';
import { StockPrice } from './entities/stock-price.entity';
import { Stock } from './entities/stock.entity';
import { TradingSignal } from './entities/trading-signal.entity';
import { StockModule } from './modules/stock/stock.module';
import { WebsocketModule } from './modules/websocket/websocket.module';
import { NewsModule } from './modules/news/news.module';
import { TradingModule } from './modules/trading/trading.module';
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
        database: configService.get('DATABASE_NAME'),
        entities: [Stock, StockPrice, News, TradingSignal],
        synchronize: true, // Don't use in production
        logging: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Stock]),
    StockModule,
    WebsocketModule,
    NewsModule,
    TradingModule,
  ],
  controllers: [AppController],
  providers: [AppService, SeedService],
})
export class AppModule {}
