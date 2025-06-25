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
import { OrderManagementService } from '../order-management/order-management.service';
import { PaperTradingService } from '../paper-trading/paper-trading.service';
import { PortfolioAnalyticsService } from '../paper-trading/portfolio-analytics.service';
import { StockService } from '../stock/stock.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'], // Frontend on 3000, backend on 3001
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
  private notificationSubscriptions: Map<string, string> = new Map(); // clientId -> userId

  constructor(
    @Inject(forwardRef(() => StockService))
    private stockService: StockService,
    @Inject(forwardRef(() => PaperTradingService))
    private paperTradingService: PaperTradingService,
    @Inject(forwardRef(() => PortfolioAnalyticsService))
    private portfolioAnalyticsService: PortfolioAnalyticsService,
    @Inject(forwardRef(() => OrderManagementService))
    private orderManagementService: OrderManagementService,
  ) {
    // Set the WebSocket gateway reference in the order management service
    // to enable WebSocket event emission from the service
    this.orderManagementService.setWebSocketGateway(this);
  }
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.clients.set(client.id, client);

    // Set up error handling for this client
    client.on('error', (error) => {
      console.error(`Socket error for client ${client.id}:`, error);
    });

    // Send initial data (stocks and portfolios) with error handling
    this.sendInitialData(client).catch((error) => {
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
    this.notificationSubscriptions.delete(client.id);
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
        await this.paperTradingService.updatePortfolioRealTimePerformance(
          portfolioId,
        );

      if (client) {
        client.emit('portfolio_update', enhancedPerformance);
      } else {
        this.server
          .to(`portfolio_${portfolioId}`)
          .emit('portfolio_update', enhancedPerformance);
      }

      console.log(
        `📈 Sent enhanced portfolio update for portfolio ${portfolioId}`,
      );
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
      const batchResults =
        await this.paperTradingService.updateMultiplePortfoliosRealTime(
          portfolioIdsArray,
        );

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
      // Ensure default portfolio exists if none specified
      let portfolioId = data.portfolioId;
      if (!portfolioId) {
        const defaultPortfolio =
          await this.paperTradingService.ensureDefaultPortfolio();
        portfolioId = defaultPortfolio.id;
      }

      // Get both real-time and historical performance data
      const realTimePerformance =
        await this.paperTradingService.updatePortfolioRealTimePerformance(
          portfolioId,
        );
      const historicalPerformance =
        await this.paperTradingService.getPortfolioPerformance(portfolioId);

      const combinedData = {
        ...realTimePerformance,
        historical: historicalPerformance.performance || [],
        metrics: historicalPerformance.metrics || {},
      };

      client.emit('portfolio_performance_data', combinedData);
    } catch (error) {
      console.error(
        `Error getting portfolio performance for ${data.portfolioId}:`,
        error,
      );
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
      // Ensure default portfolio exists if none specified
      let portfolioId = data.portfolioId;
      if (!portfolioId) {
        const defaultPortfolio =
          await this.paperTradingService.ensureDefaultPortfolio();
        portfolioId = defaultPortfolio.id;
      }

      // Get detailed position information
      const portfolio =
        await this.paperTradingService.getPortfolio(portfolioId);
      const position = portfolio.positions?.find(
        (p) => p.symbol === data.symbol.toUpperCase(),
      );

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
      await this.paperTradingService.updatePortfolioRealTimePerformance(
        data.portfolioId,
      );

      // Get position trade history
      const trades = await this.paperTradingService.getPositionTradeHistory(
        data.portfolioId,
        data.symbol,
      );

      const positionDetails = {
        portfolioId: data.portfolioId,
        symbol: data.symbol,
        position: {
          quantity: position.quantity,
          averagePrice: Number(position.averagePrice),
          currentValue:
            Number(position.currentValue) || Number(position.totalCost),
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

  @SubscribeMessage('get_portfolio_analytics')
  async handleGetPortfolioAnalytics(
    @MessageBody() data: { portfolioId: number },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `Client ${client.id} requested analytics for portfolio ${data.portfolioId}`,
    );

    try {
      const analytics =
        await this.portfolioAnalyticsService.generatePortfolioAnalytics(
          data.portfolioId,
        );

      client.emit('portfolio_analytics', {
        portfolioId: data.portfolioId,
        analytics,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Error getting portfolio analytics:`, error);
      client.emit('portfolio_analytics_error', {
        portfolioId: data.portfolioId,
        message: 'Failed to fetch portfolio analytics',
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('get_sector_allocation')
  async handleGetSectorAllocation(
    @MessageBody() data: { portfolioId: number },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `Client ${client.id} requested sector allocation for portfolio ${data.portfolioId}`,
    );

    try {
      const analytics =
        await this.portfolioAnalyticsService.generatePortfolioAnalytics(
          data.portfolioId,
        );

      client.emit('sector_allocation', {
        portfolioId: data.portfolioId,
        sectorAllocation: analytics.sectorAllocation,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Error getting sector allocation:`, error);
      client.emit('sector_allocation_error', {
        portfolioId: data.portfolioId,
        message: 'Failed to fetch sector allocation',
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('get_performance_attribution')
  async handleGetPerformanceAttribution(
    @MessageBody() data: { portfolioId: number },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `Client ${client.id} requested performance attribution for portfolio ${data.portfolioId}`,
    );

    try {
      const analytics =
        await this.portfolioAnalyticsService.generatePortfolioAnalytics(
          data.portfolioId,
        );

      client.emit('performance_attribution', {
        portfolioId: data.portfolioId,
        performanceAttribution: analytics.performanceAttribution,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Error getting performance attribution:`, error);
      client.emit('performance_attribution_error', {
        portfolioId: data.portfolioId,
        message: 'Failed to fetch performance attribution',
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('get_risk_metrics')
  async handleGetRiskMetrics(
    @MessageBody() data: { portfolioId: number },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `Client ${client.id} requested risk metrics for portfolio ${data.portfolioId}`,
    );

    try {
      const analytics =
        await this.portfolioAnalyticsService.generatePortfolioAnalytics(
          data.portfolioId,
        );

      client.emit('risk_metrics', {
        portfolioId: data.portfolioId,
        riskMetrics: analytics.riskMetrics,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Error getting risk metrics:`, error);
      client.emit('risk_metrics_error', {
        portfolioId: data.portfolioId,
        message: 'Failed to fetch risk metrics',
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('get_benchmark_comparison')
  async handleGetBenchmarkComparison(
    @MessageBody() data: { portfolioId: number },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `Client ${client.id} requested benchmark comparison for portfolio ${data.portfolioId}`,
    );

    try {
      const analytics =
        await this.portfolioAnalyticsService.generatePortfolioAnalytics(
          data.portfolioId,
        );

      client.emit('benchmark_comparison', {
        portfolioId: data.portfolioId,
        benchmarkComparison: analytics.benchmarkComparison,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Error getting benchmark comparison:`, error);
      client.emit('benchmark_comparison_error', {
        portfolioId: data.portfolioId,
        message: 'Failed to fetch benchmark comparison',
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('get_rebalancing_suggestions')
  async handleGetRebalancingSuggestions(
    @MessageBody() data: { portfolioId: number },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `Client ${client.id} requested rebalancing suggestions for portfolio ${data.portfolioId}`,
    );

    try {
      const analytics =
        await this.portfolioAnalyticsService.generatePortfolioAnalytics(
          data.portfolioId,
        );

      client.emit('rebalancing_suggestions', {
        portfolioId: data.portfolioId,
        rebalancingSuggestions: analytics.rebalancingSuggestions,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Error getting rebalancing suggestions:`, error);
      client.emit('rebalancing_suggestions_error', {
        portfolioId: data.portfolioId,
        message: 'Failed to fetch rebalancing suggestions',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Broadcast analytics updates to all subscribed clients
   */
  async broadcastPortfolioAnalytics(portfolioId: number) {
    try {
      const analytics =
        await this.portfolioAnalyticsService.generatePortfolioAnalytics(
          portfolioId,
        );

      // Broadcast to all clients subscribed to this portfolio
      for (const [
        clientId,
        portfolioIds,
      ] of this.portfolioSubscriptions.entries()) {
        if (portfolioIds.has(portfolioId)) {
          const client = this.clients.get(clientId);
          if (client) {
            client.emit('portfolio_analytics_update', {
              portfolioId,
              analytics,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    } catch (error) {
      console.error(
        `Error broadcasting portfolio analytics for ${portfolioId}:`,
        error,
      );
    }
  }
  @SubscribeMessage('create_order')
  async handleCreateOrder(
    @MessageBody() orderData: any,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Client ${client.id} creating order`, orderData);

    try {
      // Validate required fields
      if (
        !orderData.portfolioId ||
        !orderData.symbol ||
        !orderData.orderType ||
        !orderData.side ||
        !orderData.quantity
      ) {
        client.emit('order_error', {
          message: 'Missing required order fields',
          details:
            'portfolioId, symbol, orderType, side, and quantity are required',
        });
        return;
      }

      // Create order using the service DTO format
      const order = await this.orderManagementService.createOrder(orderData);

      // Emit order confirmation to client
      client.emit('order_created', order);

      // Broadcast new order to all clients
      this.server.emit('order_book_update', order);

      console.log(`Order created and broadcasted: ${order.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      client.emit('order_error', {
        message: 'Failed to create order',
        details: error.message,
      });
    }
  }
  @SubscribeMessage('cancel_order')
  async handleCancelOrder(
    @MessageBody() data: { orderId: number },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Client ${client.id} canceling order ${data.orderId}`);

    try {
      // Cancel the order
      const cancelledOrder = await this.orderManagementService.cancelOrder(
        data.orderId,
      );

      // Emit cancellation confirmation to client
      client.emit('order_canceled', { orderId: data.orderId });

      // Broadcast order cancellation to all clients
      this.server.emit('order_book_update', {
        orderId: data.orderId,
        status: 'canceled',
      });

      console.log(`Order canceled and broadcasted: ${data.orderId}`);
    } catch (error) {
      console.error('Error canceling order:', error);
      client.emit('order_error', {
        message: 'Failed to cancel order',
        details: error.message,
      });
    }
  }

  @SubscribeMessage('get_order_book')
  async handleGetOrderBook(@ConnectedSocket() client: Socket) {
    console.log(`Client ${client.id} requested order book`);

    try {
      // Get the complete order book
      const orderBook = await this.orderManagementService.getOrderBook();

      // Send the order book to the client
      client.emit('order_book_data', orderBook);
    } catch (error) {
      console.error('Error fetching order book:', error);
      client.emit('order_error', {
        message: 'Failed to fetch order book',
        details: error.message,
      });
    }
  }

  // === Notification WebSocket Methods ===

  @SubscribeMessage('subscribe_notifications')
  handleSubscribeNotifications(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `Client ${client.id} subscribed to notifications for user ${data.userId}`,
    );

    // Store user subscription
    this.notificationSubscriptions.set(client.id, data.userId);

    // Join user-specific room
    client.join(`notifications_${data.userId}`);
  }

  @SubscribeMessage('unsubscribe_notifications')
  handleUnsubscribeNotifications(@ConnectedSocket() client: Socket) {
    const userId = this.notificationSubscriptions.get(client.id);
    if (userId) {
      console.log(
        `Client ${client.id} unsubscribed from notifications for user ${userId}`,
      );
      client.leave(`notifications_${userId}`);
      this.notificationSubscriptions.delete(client.id);
    }
  }

  /**
   * Send notification to specific user
   */
  async sendNotificationToUser(userId: string, notification: any) {
    try {
      this.server.to(`notifications_${userId}`).emit('notification', {
        type: 'new_notification',
        data: notification,
        timestamp: new Date().toISOString(),
      });
      console.log(
        `📢 Sent notification to user ${userId}: ${notification.title}`,
      );
    } catch (error) {
      console.error(`Error sending notification to user ${userId}:`, error);
    }
  }

  /**
   * Send bulk notifications to user
   */
  async sendBulkNotificationsToUser(userId: string, notifications: any[]) {
    try {
      this.server.to(`notifications_${userId}`).emit('notifications_bulk', {
        type: 'bulk_notifications',
        data: notifications,
        count: notifications.length,
        timestamp: new Date().toISOString(),
      });
      console.log(
        `📢 Sent ${notifications.length} notifications to user ${userId}`,
      );
    } catch (error) {
      console.error(
        `Error sending bulk notifications to user ${userId}:`,
        error,
      );
    }
  }

  /**
   * Send notification status update
   */
  async sendNotificationStatusUpdate(
    userId: string,
    notificationId: number,
    status: string,
  ) {
    try {
      this.server.to(`notifications_${userId}`).emit('notification_status', {
        type: 'status_update',
        data: {
          notificationId,
          status,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Error sending notification status update:`, error);
    }
  }

  /**
   * Send unread count update
   */
  async sendUnreadCountUpdate(userId: string, count: number) {
    try {
      this.server.to(`notifications_${userId}`).emit('unread_count', {
        type: 'unread_count_update',
        data: { count },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Error sending unread count update:`, error);
    }
  }

  /**
   * Broadcast system-wide alert (high priority notifications)
   */
  async broadcastSystemAlert(alert: any) {
    try {
      this.server.emit('system_alert', {
        type: 'system_alert',
        data: alert,
        timestamp: new Date().toISOString(),
      });
      console.log(`🚨 Broadcasted system alert: ${alert.title}`);
    } catch (error) {
      console.error(`Error broadcasting system alert:`, error);
    }
  }

  /**
   * Send initial data (stocks and portfolios) to a newly connected client
   */
  async sendInitialData(client: Socket) {
    try {
      console.log(`Sending initial data to client ${client.id}`);

      // Send stock data
      const stocks = await this.stockService.getAllStocks();
      if (stocks && stocks.length > 0) {
        client.emit('stock_updates', stocks);
        console.log(`Sent ${stocks.length} stocks to client ${client.id}`);
      }

      // Send all portfolios data
      const portfolios = await this.paperTradingService.getPortfolios();
      if (portfolios && portfolios.length > 0) {
        client.emit('portfolios_update', portfolios);
        console.log(
          `Sent ${portfolios.length} portfolios to client ${client.id}`,
        );

        // Send detailed performance data for each portfolio
        const portfolioPerformancePromises = portfolios.map(
          async (portfolio) => {
            try {
              const enhancedPerformance =
                await this.paperTradingService.updatePortfolioRealTimePerformance(
                  portfolio.id,
                );
              return {
                portfolioId: portfolio.id,
                data: enhancedPerformance,
              };
            } catch (error) {
              console.error(
                `Error getting performance for portfolio ${portfolio.id}:`,
                error,
              );
              return {
                portfolioId: portfolio.id,
                error: 'Failed to fetch performance data',
              };
            }
          },
        );

        const portfolioPerformances = await Promise.all(
          portfolioPerformancePromises,
        );
        client.emit('portfolios_performance_update', portfolioPerformances);
        console.log(
          `Sent performance data for ${portfolios.length} portfolios to client ${client.id}`,
        );
      }

      console.log(`✅ Initial data sent successfully to client ${client.id}`);
    } catch (error) {
      console.error(
        `Error sending initial data to client ${client.id}:`,
        error,
      );

      // Send error events to client
      client.emit('stock_error', {
        message: 'Failed to fetch stock data',
        timestamp: new Date().toISOString(),
      });

      client.emit('portfolios_error', {
        message: 'Failed to fetch portfolio data',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Broadcast all portfolios data to all connected clients
   * Useful when portfolios are created, deleted, or significantly modified
   */
  async broadcastAllPortfolios() {
    try {
      if (!this.server) {
        console.warn('WebSocket server not initialized');
        return;
      }

      // Get all portfolios
      const portfolios = await this.paperTradingService.getPortfolios();

      if (portfolios && portfolios.length > 0) {
        // Send basic portfolio list to all clients
        this.server.emit('portfolios_update', portfolios);

        // Send detailed performance data for each portfolio
        const portfolioPerformancePromises = portfolios.map(
          async (portfolio) => {
            try {
              const enhancedPerformance =
                await this.paperTradingService.updatePortfolioRealTimePerformance(
                  portfolio.id,
                );
              return {
                portfolioId: portfolio.id,
                data: enhancedPerformance,
              };
            } catch (error) {
              console.error(
                `Error getting performance for portfolio ${portfolio.id}:`,
                error,
              );
              return {
                portfolioId: portfolio.id,
                error: 'Failed to fetch performance data',
              };
            }
          },
        );

        const portfolioPerformances = await Promise.all(
          portfolioPerformancePromises,
        );
        this.server.emit(
          'portfolios_performance_update',
          portfolioPerformances,
        );

        console.log(
          `📊 Broadcasted ${portfolios.length} portfolios with performance data to all clients`,
        );
      } else {
        // Send empty portfolios list
        this.server.emit('portfolios_update', []);
        console.log('📊 Broadcasted empty portfolios list to all clients');
      }
    } catch (error) {
      console.error('Error broadcasting all portfolios:', error);

      // Send error to all clients
      this.server.emit('portfolios_error', {
        message: 'Failed to fetch portfolios data',
        timestamp: new Date().toISOString(),
      });
    }
  }

  @SubscribeMessage('subscribe_portfolios')
  handleSubscribePortfolios(@ConnectedSocket() client: Socket) {
    console.log(`Client ${client.id} subscribed to all portfolios updates`);
    this.sendAllPortfolios(client);
  }

  @SubscribeMessage('get_all_portfolios')
  handleGetAllPortfolios(@ConnectedSocket() client: Socket) {
    console.log(`Client ${client.id} requested all portfolios data`);
    this.sendAllPortfolios(client);
  }

  /**
   * Send all portfolios data to a specific client
   */
  async sendAllPortfolios(client: Socket) {
    try {
      console.log(`Sending all portfolios data to client ${client.id}`);

      // Send all portfolios data
      const portfolios = await this.paperTradingService.getPortfolios();
      if (portfolios && portfolios.length > 0) {
        client.emit('portfolios_update', portfolios);
        console.log(
          `Sent ${portfolios.length} portfolios to client ${client.id}`,
        );

        // Send detailed performance data for each portfolio
        const portfolioPerformancePromises = portfolios.map(
          async (portfolio) => {
            try {
              const enhancedPerformance =
                await this.paperTradingService.updatePortfolioRealTimePerformance(
                  portfolio.id,
                );
              return {
                portfolioId: portfolio.id,
                data: enhancedPerformance,
              };
            } catch (error) {
              console.error(
                `Error getting performance for portfolio ${portfolio.id}:`,
                error,
              );
              return {
                portfolioId: portfolio.id,
                error: 'Failed to fetch performance data',
              };
            }
          },
        );

        const portfolioPerformances = await Promise.all(
          portfolioPerformancePromises,
        );
        client.emit('portfolios_performance_update', portfolioPerformances);
        console.log(
          `Sent performance data for ${portfolios.length} portfolios to client ${client.id}`,
        );
      } else {
        // Send empty portfolios list
        client.emit('portfolios_update', []);
        console.log(`Sent empty portfolios list to client ${client.id}`);
      }

      console.log(
        `✅ All portfolios data sent successfully to client ${client.id}`,
      );
    } catch (error) {
      console.error(
        `Error sending all portfolios data to client ${client.id}:`,
        error,
      );

      // Send error event to client
      client.emit('portfolios_error', {
        message: 'Failed to fetch portfolios data',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
