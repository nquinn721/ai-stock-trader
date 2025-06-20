import { Module, forwardRef } from '@nestjs/common';
import { StockModule } from '../stock/stock.module';
import { StockWebSocketGateway } from './websocket.gateway';

@Module({
  imports: [forwardRef(() => StockModule)],
  providers: [StockWebSocketGateway],
  exports: [StockWebSocketGateway],
})
export class WebsocketModule {}
