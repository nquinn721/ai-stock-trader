import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AutoTradingModule } from '../auto-trading/auto-trading.module';
import { MLModule } from '../ml/ml.module';
import { PaperTradingModule } from '../paper-trading/paper-trading.module';
import { StockModule } from '../stock/stock.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { AutonomousTradingController } from './autonomous-trading.controller';
import { AutonomousTradingService } from './autonomous-trading.service';
import { TradingStrategy } from './entities/trading-strategy.entity';
import { StrategyBacktest } from './entities/strategy-backtest.entity';
import { StrategyExecution } from './entities/strategy-execution.entity';
import { StrategyBuilderService } from './services/strategy-builder.service';
import { BacktestingEngineService } from './services/backtesting-engine.service';
import { AutonomousExecutionService } from './services/autonomous-execution.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TradingStrategy,
      StrategyBacktest,
      StrategyExecution,
    ]),
    AutoTradingModule,
    MLModule,
    PaperTradingModule,
    StockModule,
    WebsocketModule,
  ],
  controllers: [AutonomousTradingController],
  providers: [
    AutonomousTradingService,
    StrategyBuilderService,
    BacktestingEngineService,
    AutonomousExecutionService,
  ],
  exports: [AutonomousTradingService, StrategyBuilderService],
})
export class AutonomousTradingModule {}