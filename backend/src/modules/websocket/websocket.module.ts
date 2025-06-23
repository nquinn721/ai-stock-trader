import { Module, forwardRef } from '@nestjs/common';
import { OrderManagementModule } from '../order-management/order-management.module';
import { PaperTradingModule } from '../paper-trading/paper-trading.module';
import { StockModule } from '../stock/stock.module';
import { StockWebSocketGateway } from './websocket.gateway';

@Module({
  imports: [
    forwardRef(() => StockModule),
    forwardRef(() => PaperTradingModule),
    forwardRef(() => OrderManagementModule),
  ],
  providers: [StockWebSocketGateway],
  exports: [StockWebSocketGateway],
})
export class WebsocketModule {}
