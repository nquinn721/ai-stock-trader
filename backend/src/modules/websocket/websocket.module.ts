import { Module, forwardRef } from '@nestjs/common';
import { StockModule } from '../stock/stock.module';
import { PaperTradingModule } from '../paper-trading/paper-trading.module';
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
