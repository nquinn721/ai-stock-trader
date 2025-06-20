import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stock } from '../../entities/stock.entity';
import { TradingSignal } from '../../entities/trading-signal.entity';
import { BreakoutModule } from '../breakout/breakout.module';
import { NewsModule } from '../news/news.module';
import { TradingModule } from '../trading/trading.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Stock, TradingSignal]),
    forwardRef(() => WebsocketModule),
    forwardRef(() => NewsModule),
    forwardRef(() => TradingModule),
    BreakoutModule,
  ],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
