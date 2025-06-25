import { Module, forwardRef } from '@nestjs/common';
import { OrderManagementModule } from '../order-management/order-management.module';
import { PaperTradingModule } from '../paper-trading/paper-trading.module';
import { StockModule } from '../stock/stock.module';
import { WebSocketHealthService } from './websocket-health.service';
import { WebSocketController } from './websocket.controller';
import { StockWebSocketGateway } from './websocket.gateway';

@Module({
  imports: [
    forwardRef(() => StockModule),
    forwardRef(() => PaperTradingModule),
    forwardRef(() => OrderManagementModule),
  ],
  controllers: [WebSocketController],
  providers: [StockWebSocketGateway, WebSocketHealthService],
  exports: [StockWebSocketGateway, WebSocketHealthService],
})
export class WebsocketModule {}
