import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Portfolio } from '../../entities/portfolio.entity';
import { Position } from '../../entities/position.entity';
import { Stock } from '../../entities/stock.entity';
import { Trade } from '../../entities/trade.entity';
import { StockModule } from '../stock/stock.module';
import { PaperTradingController } from './paper-trading.controller';
import { PaperTradingService } from './paper-trading.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Portfolio, Position, Trade, Stock]),
    StockModule,
  ],
  controllers: [PaperTradingController],
  providers: [PaperTradingService],
  exports: [PaperTradingService],
})
export class PaperTradingModule {}
