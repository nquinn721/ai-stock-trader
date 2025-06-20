import { Module } from '@nestjs/common';
// Removed TypeORM imports since we're using mock data
import { NewsModule } from '../news/news.module';
import { TradingController } from './trading.controller';
import { TradingService } from './trading.service';

@Module({
  imports: [
    // Removed TypeOrmModule.forFeature([TradingSignal, Stock]) since we're using mock data
    NewsModule,
  ],
  controllers: [TradingController],
  providers: [TradingService],
  exports: [TradingService],
})
export class TradingModule {}
