import { Inject, Injectable, forwardRef } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { StockService } from '../stock/stock.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:8000'], // Frontend on 3000, backend on 8000
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
})
@Injectable()
export class StockWebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private clients: Map<string, Socket> = new Map();

  constructor(
    @Inject(forwardRef(() => StockService))
    private stockService: StockService,
  ) {}
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.clients.set(client.id, client);

    // Set up error handling for this client
    client.on('error', (error) => {
      console.error(`Socket error for client ${client.id}:`, error);
    });

    // Send initial stock data with error handling
    this.sendStockUpdates(client).catch((error) => {
      console.error(
        `Failed to send initial data to client ${client.id}:`,
        error,
      );
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.clients.delete(client.id);
  }

  @SubscribeMessage('subscribe_stocks')
  handleSubscribeStocks(@ConnectedSocket() client: Socket) {
    console.log(`Client ${client.id} subscribed to stock updates`);
    this.sendStockUpdates(client);
  }

  @SubscribeMessage('subscribe_stock')
  handleSubscribeStock(
    @MessageBody() data: { symbol: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Client ${client.id} subscribed to ${data.symbol}`);
    // Join room for specific stock
    client.join(`stock_${data.symbol}`);
  }

  @SubscribeMessage('unsubscribe_stock')
  handleUnsubscribeStock(
    @MessageBody() data: { symbol: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Client ${client.id} unsubscribed from ${data.symbol}`);
    // Leave room for specific stock
    client.leave(`stock_${data.symbol}`);
  }
  async sendStockUpdates(client?: Socket) {
    try {
      // Use getAllStocks instead of non-existent getAllStocksWithSentiment
      const stocks = await this.stockService.getAllStocks();
      const target = client || this.server;

      if (target && typeof target.emit === 'function') {
        target.emit('stock_updates', stocks);
        console.log(
          `Sent stock updates to ${client ? 'client' : 'all clients'}`,
        );
      }
    } catch (error) {
      console.error('Error sending stock updates:', error);
      // Send error event to client(s)
      const target = client || this.server;
      if (target && typeof target.emit === 'function') {
        target.emit('stock_error', {
          message: 'Failed to fetch stock data',
          timestamp: new Date().toISOString(),
        });
      }
    }
  }
  async broadcastStockUpdate(symbol: string, stockData: any) {
    try {
      if (!this.server) {
        console.warn('WebSocket server not initialized');
        return;
      }

      // Send to all clients
      this.server.emit('stock_update', { symbol, data: stockData });

      // Send to clients subscribed to specific stock
      this.server
        .to(`stock_${symbol}`)
        .emit('stock_specific_update', stockData);

      console.log(`Broadcasted update for ${symbol}`);
    } catch (error) {
      console.error(`Error broadcasting stock update for ${symbol}:`, error);
    }
  }

  async broadcastTradingSignal(signal: any) {
    this.server.emit('trading_signal', signal);
  }

  async broadcastNewsUpdate(news: any) {
    this.server.emit('news_update', news);
  }

  /**
   * Broadcast all stock updates to connected clients
   * Called by StockService when prices are updated
   */
  async broadcastAllStockUpdates() {
    try {
      const stocks = await this.stockService.getAllStocks();
      if (this.server && stocks.length > 0) {
        this.server.emit('stock_updates', stocks);
        console.log(
          `📊 Broadcasted ${stocks.length} stock updates to all clients`,
        );
      }
    } catch (error) {
      console.error('Error broadcasting all stock updates:', error);
    }
  }

  /**
   * Get count of connected clients
   */
  getConnectedClientsCount(): number {
    return this.clients.size;
  }
}
