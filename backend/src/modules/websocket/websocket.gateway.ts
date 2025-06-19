import { Injectable } from '@nestjs/common';
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
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
})
@Injectable()
export class StockWebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private clients: Map<string, Socket> = new Map();

  constructor(private stockService: StockService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.clients.set(client.id, client);

    // Send initial stock data
    this.sendStockUpdates(client);
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
      const stocks = await this.stockService.getAllStocks();
      const target = client || this.server;
      target.emit('stock_updates', stocks);
    } catch (error) {
      console.error('Error sending stock updates:', error);
    }
  }

  async broadcastStockUpdate(symbol: string, stockData: any) {
    // Send to all clients
    this.server.emit('stock_update', { symbol, data: stockData });

    // Send to clients subscribed to specific stock
    this.server.to(`stock_${symbol}`).emit('stock_specific_update', stockData);
  }

  async broadcastTradingSignal(signal: any) {
    this.server.emit('trading_signal', signal);
  }

  async broadcastNewsUpdate(news: any) {
    this.server.emit('news_update', news);
  }
}
