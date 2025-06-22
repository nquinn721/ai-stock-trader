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
import { PaperTradingService } from '../paper-trading/paper-trading.service';
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
  private portfolioSubscriptions: Map<string, Set<number>> = new Map(); // clientId -> portfolioIds

  constructor(
    @Inject(forwardRef(() => StockService))
    private stockService: StockService,
    @Inject(forwardRef(() => PaperTradingService))
    private paperTradingService: PaperTradingService,
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
    this.portfolioSubscriptions.delete(client.id);
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

        // Also broadcast portfolio updates since stock prices changed
        await this.broadcastPortfolioUpdates();
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

  @SubscribeMessage('subscribe_portfolio')
  handleSubscribePortfolio(
    @MessageBody() data: { portfolioId: number },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `Client ${client.id} subscribed to portfolio ${data.portfolioId}`,
    );

    // Add to client's portfolio subscriptions
    if (!this.portfolioSubscriptions.has(client.id)) {
      this.portfolioSubscriptions.set(client.id, new Set());
    }
    this.portfolioSubscriptions.get(client.id)!.add(data.portfolioId);

    // Join room for specific portfolio
    client.join(`portfolio_${data.portfolioId}`);

    // Send initial portfolio data
    this.sendPortfolioUpdate(data.portfolioId, client);
  }

  @SubscribeMessage('unsubscribe_portfolio')
  handleUnsubscribePortfolio(
    @MessageBody() data: { portfolioId: number },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `Client ${client.id} unsubscribed from portfolio ${data.portfolioId}`,
    );

    // Remove from client's portfolio subscriptions
    if (this.portfolioSubscriptions.has(client.id)) {
      this.portfolioSubscriptions.get(client.id)!.delete(data.portfolioId);
    }

    // Leave room for specific portfolio
    client.leave(`portfolio_${data.portfolioId}`);
  }

  /**
   * Send portfolio performance update to specific client or room
   */
  async sendPortfolioUpdate(portfolioId: number, client?: Socket) {
    try {
      const performance =
        await this.paperTradingService.getPortfolioPerformance(portfolioId);
      const portfolio =
        await this.paperTradingService.getPortfolio(portfolioId);

      const portfolioUpdate = {
        portfolioId,
        totalValue: portfolio.totalValue,
        totalPnL: portfolio.totalPnL,
        totalReturn: portfolio.totalReturn,
        currentCash: portfolio.currentCash,
        dayGain: performance.dayGain || 0,
        dayGainPercent: performance.dayGainPercent || 0,
        timestamp: new Date().toISOString(),
        positions: portfolio.positions || [],
      };

      if (client) {
        client.emit('portfolio_update', portfolioUpdate);
      } else {
        this.server
          .to(`portfolio_${portfolioId}`)
          .emit('portfolio_update', portfolioUpdate);
      }

      console.log(`📈 Sent portfolio update for portfolio ${portfolioId}`);
    } catch (error) {
      console.error(
        `Error sending portfolio update for ${portfolioId}:`,
        error,
      );
      const target = client || this.server.to(`portfolio_${portfolioId}`);
      target.emit('portfolio_error', {
        portfolioId,
        message: 'Failed to fetch portfolio data',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Broadcast portfolio updates to all subscribed clients when stock prices change
   */
  async broadcastPortfolioUpdates() {
    try {
      // Get all active portfolios that have subscribers
      const subscribedPortfolioIds = new Set<number>();

      for (const portfolioIds of this.portfolioSubscriptions.values()) {
        portfolioIds.forEach((id) => subscribedPortfolioIds.add(id));
      }

      // Send updates for each subscribed portfolio
      for (const portfolioId of subscribedPortfolioIds) {
        await this.sendPortfolioUpdate(portfolioId);
      }

      if (subscribedPortfolioIds.size > 0) {
        console.log(
          `📊 Broadcasted portfolio updates for ${subscribedPortfolioIds.size} portfolios`,
        );
      }
    } catch (error) {
      console.error('Error broadcasting portfolio updates:', error);
    }
  }
}
