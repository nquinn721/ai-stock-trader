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
   * Send enhanced portfolio performance update to specific client or room
   */
  async sendPortfolioUpdate(portfolioId: number, client?: Socket) {
    try {
      // Use enhanced real-time performance tracking
      const enhancedPerformance =
        await this.paperTradingService.updatePortfolioRealTimePerformance(portfolioId);

      if (client) {
        client.emit('portfolio_update', enhancedPerformance);
      } else {
        this.server
          .to(`portfolio_${portfolioId}`)
          .emit('portfolio_update', enhancedPerformance);
      }

      console.log(`📈 Sent enhanced portfolio update for portfolio ${portfolioId}`);
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
   * Enhanced broadcast portfolio updates to all subscribed clients when stock prices change
   */
  async broadcastPortfolioUpdates() {
    try {
      // Get all active portfolios that have subscribers
      const subscribedPortfolioIds = new Set<number>();

      for (const portfolioIds of this.portfolioSubscriptions.values()) {
        portfolioIds.forEach((id) => subscribedPortfolioIds.add(id));
      }

      if (subscribedPortfolioIds.size === 0) {
        return;
      }

      // Use batch update for better performance
      const portfolioIdsArray = Array.from(subscribedPortfolioIds);
      const batchResults = await this.paperTradingService.updateMultiplePortfoliosRealTime(portfolioIdsArray);

      // Send individual updates to subscribed clients
      for (const result of batchResults) {
        if (result.error) {
          // Send error to clients
          this.server
            .to(`portfolio_${result.portfolioId}`)
            .emit('portfolio_error', result);
        } else {
          // Send successful update
          this.server
            .to(`portfolio_${result.portfolioId}`)
            .emit('portfolio_update', result);
        }
      }

      console.log(
        `📊 Broadcasted enhanced portfolio updates for ${subscribedPortfolioIds.size} portfolios`,
      );
    } catch (error) {
      console.error('Error broadcasting portfolio updates:', error);
    }
  }

  @SubscribeMessage('get_portfolio_performance')
  async handleGetPortfolioPerformance(
    @MessageBody() data: { portfolioId: number },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `Client ${client.id} requested performance data for portfolio ${data.portfolioId}`,
    );

    try {
      // Get both real-time and historical performance data
      const realTimePerformance =
        await this.paperTradingService.updatePortfolioRealTimePerformance(data.portfolioId);
      const historicalPerformance =
        await this.paperTradingService.getPortfolioPerformance(data.portfolioId);

      const combinedData = {
        ...realTimePerformance,
        historical: historicalPerformance.performance || [],
        metrics: historicalPerformance.metrics || {},
      };

      client.emit('portfolio_performance_data', combinedData);
    } catch (error) {
      console.error(`Error getting portfolio performance for ${data.portfolioId}:`, error);
      client.emit('portfolio_error', {
        portfolioId: data.portfolioId,
        message: 'Failed to fetch portfolio performance data',
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('get_position_details')
  async handleGetPositionDetails(
    @MessageBody() data: { portfolioId: number; symbol: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `Client ${client.id} requested position details for ${data.symbol} in portfolio ${data.portfolioId}`,
    );

    try {
      // Get detailed position information
      const portfolio = await this.paperTradingService.getPortfolio(data.portfolioId);
      const position = portfolio.positions?.find(p => p.symbol === data.symbol.toUpperCase());

      if (!position) {
        client.emit('position_error', {
          portfolioId: data.portfolioId,
          symbol: data.symbol,
          message: 'Position not found',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Update position with latest market data
      await this.paperTradingService.updatePortfolioRealTimePerformance(data.portfolioId);

      // Get position trade history
      const trades = await this.paperTradingService.getPositionTradeHistory(data.portfolioId, data.symbol);

      const positionDetails = {
        portfolioId: data.portfolioId,
        symbol: data.symbol,
        position: {
          quantity: position.quantity,
          averagePrice: Number(position.averagePrice),
          currentValue: Number(position.currentValue) || Number(position.totalCost),
          totalCost: Number(position.totalCost),
          unrealizedPnL: Number(position.unrealizedPnL || 0),
          unrealizedReturn: Number(position.unrealizedReturn || 0),
          lastUpdated: new Date().toISOString(),
        },
        tradeHistory: trades,
        timestamp: new Date().toISOString(),
      };

      client.emit('position_details', positionDetails);
    } catch (error) {
      console.error(`Error getting position details:`, error);
      client.emit('position_error', {
        portfolioId: data.portfolioId,
        symbol: data.symbol,
        message: 'Failed to fetch position details',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
