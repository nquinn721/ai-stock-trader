import { Module, forwardRef } from '@nestjs/common';
import { PaperTradingModule } from '../paper-trading/paper-trading.module';
import { StockModule } from '../stock/stock.module';
import { StockWebSocketGateway } from './websocket.gateway';

@Module({
  imports: [
    forwardRef(() => StockModule),
    forwardRef(() => PaperTradingModule),
  ],
  providers: [StockWebSocketGateway],
  exports: [StockWebSocketGateway],
})
export class WebsocketModule {}
