import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../entities/order.entity';
import { Portfolio } from '../../entities/portfolio.entity';
import { Position } from '../../entities/position.entity';
import { Stock } from '../../entities/stock.entity';
import { Trade } from '../../entities/trade.entity';
import { MarketHoursService } from '../../utils/market-hours.service';
import { PaperTradingModule } from '../paper-trading/paper-trading.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { OrderManagementController } from './order-management.controller';
import { OrderManagementService } from './order-management.service';
import { OrderService } from './order.service';
import { ConditionalOrderService } from './services/conditional-order.service';
import { OrderExecutionEngine } from './services/order-execution-engine.service';
import { OrderExecutionService } from './services/order-execution.service';
import { OrderRiskManagementService } from './services/order-risk-management.service';
import { RiskManagementService } from './services/risk-management.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Portfolio, Position, Stock, Trade]),
    ScheduleModule.forRoot(), // For cron jobs
    forwardRef(() => PaperTradingModule), // For trade execution
    forwardRef(() => WebsocketModule), // For websocket communication
  ],
  controllers: [OrderManagementController],
  providers: [
    OrderManagementService,
    OrderService,
    OrderExecutionEngine,
    OrderExecutionService,
    ConditionalOrderService,
    RiskManagementService,
    OrderRiskManagementService,
    MarketHoursService,
  ],
  exports: [
    OrderManagementService,
    OrderService,
    OrderExecutionEngine,
    OrderExecutionService,
    ConditionalOrderService,
    RiskManagementService,
    OrderRiskManagementService,
  ],
})
export class OrderManagementModule {}
