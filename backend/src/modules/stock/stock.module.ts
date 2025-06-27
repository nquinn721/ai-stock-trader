import { Module, forwardRef } from '@nestjs/common';
// Removed TypeORM imports since we're using mock data
import { BreakoutModule } from '../breakout/breakout.module';
import { MLAnalysisModule } from '../ml-analysis/ml-analysis.module';
import { NewsModule } from '../news/news.module';
import { TradingModule } from '../trading/trading.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';

@Module({
  imports: [
    // Removed TypeOrmModule.forFeature([Stock, TradingSignal]) since we're using mock data
    forwardRef(() => WebsocketModule),
    forwardRef(() => NewsModule),
    forwardRef(() => TradingModule),
    forwardRef(() => BreakoutModule),
    MLAnalysisModule,
  ],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
