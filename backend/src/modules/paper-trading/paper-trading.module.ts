import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Portfolio } from '../../entities/portfolio.entity';
import { Position } from '../../entities/position.entity';
import { Stock } from '../../entities/stock.entity';
import { Trade } from '../../entities/trade.entity';
import { MLModule } from '../ml/ml.module';
import { StockModule } from '../stock/stock.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { PaperTradingController } from './paper-trading.controller';
import { PaperTradingService } from './paper-trading.service';
import { PortfolioAnalyticsController } from './portfolio-analytics.controller';
import { PortfolioAnalyticsService } from './portfolio-analytics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Portfolio, Position, Trade, Stock]),
    StockModule,
    forwardRef(() => WebsocketModule),
    forwardRef(() => MLModule),
  ],
  controllers: [PaperTradingController, PortfolioAnalyticsController],
  providers: [PaperTradingService, PortfolioAnalyticsService],
  exports: [PaperTradingService, PortfolioAnalyticsService],
})
export class PaperTradingModule {}
