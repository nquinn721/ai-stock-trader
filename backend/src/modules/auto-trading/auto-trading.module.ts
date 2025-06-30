import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutoTradingOrder } from '../../entities/auto-trading-order.entity';
import { Portfolio } from '../../entities/portfolio.entity';
import { Stock } from '../../entities/stock.entity';
import { MarketHoursService } from '../../utils/market-hours.service';
import { MLModule } from '../ml/ml.module';
import { PaperTradingModule } from '../paper-trading/paper-trading.module';
import { StockModule } from '../stock/stock.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { AutoTradingController } from './auto-trading.controller';
import { AutoTradingService } from './auto-trading.service';
import { AutoTrade } from './entities/auto-trade.entity';
import { BacktestResult } from './entities/backtest-result.entity';
import { StrategyTemplate } from './entities/strategy-template.entity';
import { TradingRule } from './entities/trading-rule.entity';
import { TradingSession } from './entities/trading-session.entity';
import { TradingStrategy } from './entities/trading-strategy.entity';
import { AdvancedOrderExecutionService } from './services/advanced-order-execution.service';
import { AutoTradingOrderPreviewService } from './services/auto-trading-order-preview.service';
import { AutonomousTradingService } from './services/autonomous-trading.service';
import { BacktestingService } from './services/backtesting.service';
import { OrderManagementService } from './services/order-management.service';
import { PositionSizingService } from './services/position-sizing.service';
import { RiskManagementService } from './services/risk-management.service';
import { RuleEngineService } from './services/rule-engine.service';
import { TradeExecutionService } from './services/trade-execution.service';
import { StrategyBuilderController } from './strategy-builder.controller';
import { StrategyBuilderService } from './strategy-builder.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TradingRule,
      AutoTrade,
      TradingSession,
      TradingStrategy,
      StrategyTemplate,
      BacktestResult,
      AutoTradingOrder,
      Portfolio,
      Stock,
    ]),
    PaperTradingModule,
    StockModule,
    WebsocketModule,
    MLModule,
  ],
  controllers: [AutoTradingController, StrategyBuilderController],
  providers: [
    AutoTradingService,
    StrategyBuilderService,
    BacktestingService,
    AutonomousTradingService,
    AutoTradingOrderPreviewService,
    AdvancedOrderExecutionService,
    RuleEngineService,
    TradeExecutionService,
    RiskManagementService,
    PositionSizingService,
    OrderManagementService,
    MarketHoursService,
  ],
  exports: [
    AutoTradingService,
    StrategyBuilderService,
    BacktestingService,
    AutonomousTradingService,
  ],
})
export class AutoTradingModule {}
