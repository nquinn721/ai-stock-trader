import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../entities/order.entity';
import { Portfolio } from '../../entities/portfolio.entity';
import { Position } from '../../entities/position.entity';
import { Stock } from '../../entities/stock.entity';
import { Trade } from '../../entities/trade.entity';
import { PaperTradingModule } from '../paper-trading/paper-trading.module';
import { OrderManagementController } from './order-management.controller';
import { OrderManagementService } from './order-management.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Portfolio, Position, Stock, Trade]),
    ScheduleModule.forRoot(), // For cron jobs
    PaperTradingModule, // For trade execution
  ],
  controllers: [OrderManagementController],
  providers: [OrderManagementService],
  exports: [OrderManagementService],
})
export class OrderManagementModule {}
