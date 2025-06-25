import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaperTradingModule } from '../paper-trading/paper-trading.module';
import { StockModule } from '../stock/stock.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { AutoTradingController } from './auto-trading.controller';
import { AutoTradingService } from './auto-trading.service';
import { AutoTrade } from './entities/auto-trade.entity';
import { TradingRule } from './entities/trading-rule.entity';
import { TradingSession } from './entities/trading-session.entity';
import { OrderManagementService } from './services/order-management.service';
import { PositionSizingService } from './services/position-sizing.service';
import { RiskManagementService } from './services/risk-management.service';
import { RuleEngineService } from './services/rule-engine.service';
import { TradeExecutionService } from './services/trade-execution.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TradingRule, AutoTrade, TradingSession]),
    PaperTradingModule,
    StockModule,
    WebsocketModule,
  ],
  controllers: [AutoTradingController],
  providers: [
    AutoTradingService,
    RuleEngineService,
    TradeExecutionService,
    RiskManagementService,
    PositionSizingService,
    OrderManagementService,
  ],
  exports: [AutoTradingService],
})
export class AutoTradingModule {}
