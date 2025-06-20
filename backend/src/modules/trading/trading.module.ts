import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Stock } from '../../entities/stock.entity';
import { TradingSignal } from '../../entities/trading-signal.entity';
import { NewsModule } from '../news/news.module';
import { TradingController } from './trading.controller';
import { TradingService } from './trading.service';

@Module({
  imports: [TypeOrmModule.forFeature([TradingSignal, Stock]), NewsModule],
  controllers: [TradingController],
  providers: [TradingService],
  exports: [TradingService],
})
export class TradingModule {}
