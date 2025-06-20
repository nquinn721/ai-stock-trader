import { Module } from '@nestjs/common';
// Removed TypeORM imports since we're using mock data
import { StockModule } from '../stock/stock.module';
import { PaperTradingController } from './paper-trading.controller';
import { PaperTradingService } from './paper-trading.service';

@Module({
  imports: [
    // Removed TypeOrmModule.forFeature([Portfolio, Position, Trade, Stock]) since we're using mock data
    StockModule,
  ],
  controllers: [PaperTradingController],
  providers: [PaperTradingService],
  exports: [PaperTradingService],
})
export class PaperTradingModule {}
