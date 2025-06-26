import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketHoursService } from '../../utils/market-hours.service';
import { PaperTradingModule } from '../paper-trading/paper-trading.module';
import { StockModule } from '../stock/stock.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { AutoTradingController } from './auto-trading.controller';
import { AutoTradingService } from './auto-trading.service';
import { AutonomousTradingController } from './autonomous-trading.controller';
import { AutoTrade } from './entities/auto-trade.entity';
import { BacktestResult } from './entities/backtest-result.entity';
import { StrategyTemplate } from './entities/strategy-template.entity';
import { TradingRule } from './entities/trading-rule.entity';
import { TradingSession } from './entities/trading-session.entity';
import { TradingStrategy } from './entities/trading-strategy.entity';
import { AutonomousTradingService } from './services/autonomous-trading.service';
import { BacktestingService } from './services/backtesting.service';
import { OrderManagementService } from './services/order-management.service';
import { PositionSizingService } from './services/position-sizing.service';
import { RiskManagementService } from './services/risk-management.service';
import { RuleEngineService } from './services/rule-engine.service';
import { StrategyBuilderService } from './services/strategy-builder.service';
import { TradeExecutionService } from './services/trade-execution.service';
import { StrategyBuilderController } from './strategy-builder.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TradingRule,
      AutoTrade,
      TradingSession,
      TradingStrategy,
      StrategyTemplate,
      BacktestResult,
    ]),
    PaperTradingModule,
    StockModule,
    WebsocketModule,
  ],
  controllers: [
    AutoTradingController,
    StrategyBuilderController,
    AutonomousTradingController,
  ],
  providers: [
    AutoTradingService,
    StrategyBuilderService,
    BacktestingService,
    AutonomousTradingService,
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
