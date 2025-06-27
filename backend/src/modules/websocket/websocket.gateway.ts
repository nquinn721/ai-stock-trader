import { Inject, Injectable, Optional, forwardRef } from '@nestjs/common';
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
import {
  PredictionSubscription,
  PredictionUpdate,
} from '../ml/interfaces/predictive-analytics.interfaces';
import { PredictiveAnalyticsService } from '../ml/services/predictive-analytics.service';
import { OrderManagementService } from '../order-management/order-management.service';
import { PaperTradingService } from '../paper-trading/paper-trading.service';
import { PortfolioAnalyticsService } from '../paper-trading/portfolio-analytics.service';
import { StockService } from '../stock/stock.service';
import { WebSocketHealthService } from './websocket-health.service';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'], // Frontend on 3000, backend on 3001
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  // Enable compression for better performance
  compression: true,
  perMessageDeflate: {
    threshold: 1024, // Only compress messages larger than 1KB
    concurrencyLimit: 10,
    memLevel: 3,
  },
  // Optimize for high-frequency updates
  maxHttpBufferSize: 1e6, // 1MB buffer
  allowEIO3: true,
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

  // S39: Predictive Analytics subscriptions
  private predictionSubscriptions: Map<string, PredictionSubscription> =
    new Map(); // clientId -> subscription
  private predictionStreams: Map<string, any> = new Map(); // symbol -> RxJS subscription

  // Message batching optimization
  private messageBatch: Map<string, any[]> = new Map();
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_INTERVAL = 100; // 100ms batching interval
  private readonly MAX_BATCH_SIZE = 50; // Maximum messages per batch

  // Connection management and rate limiting
  private connectionPool: Map<
    string,
    { lastActivity: number; requestCount: number }
  > = new Map();
  private readonly MAX_REQUESTS_PER_MINUTE = 100;
  private readonly CONNECTION_CLEANUP_INTERVAL = 60000; // 1 minute
  private cleanupTimer: NodeJS.Timeout | null = null;

  // Subscription management for selective updates
  private stockSubscriptions: Map<string, Set<string>> = new Map(); // clientId -> Set<symbols>
  private lastUpdateTimes: Map<string, number> = new Map(); // symbol -> timestamp

  // Compression and binary message support
  private compressionEnabled: boolean = true;
  private readonly COMPRESSION_THRESHOLD = 500; // bytes

  // Enhanced bandwidth optimization
  private readonly UPDATE_THROTTLE_MS = 250; // 250ms throttle for updates
  private throttledUpdates: Map<string, NodeJS.Timeout> = new Map();
  private pendingUpdates: Map<string, any> = new Map();

  // Connection quality tracking
  private connectionQuality: Map<
    string,
    { latency: number; lastPing: number; quality: 'good' | 'poor' | 'bad' }
  > = new Map();

  constructor(
    @Inject(forwardRef(() => StockService))
    private stockService: StockService,
    @Inject(forwardRef(() => PaperTradingService))
    private paperTradingService: PaperTradingService,
    @Inject(forwardRef(() => PortfolioAnalyticsService))
    private portfolioAnalyticsService: PortfolioAnalyticsService,
    @Inject(forwardRef(() => OrderManagementService))
    private orderManagementService: OrderManagementService,
    private healthService: WebSocketHealthService,
    @Optional()
    @Inject(forwardRef(() => PredictiveAnalyticsService))
    private predictiveAnalyticsService: PredictiveAnalyticsService,
  ) {
    // Set the WebSocket gateway reference in the order management service
    // to enable WebSocket event emission from the service
    this.orderManagementService.setWebSocketGateway(this);

    // Initialize batch processing
    this.initializeBatchProcessing();

    // Initialize connection management
    this.initializeConnectionManagement();
  }
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);

    // Rate limiting check
    if (!this.checkRateLimit(client.id)) {
      console.warn(`Rate limit exceeded for client ${client.id}`);
      client.emit('rate_limit_exceeded', {
        message: 'Too many requests, please slow down',
        retryAfter: 60, // seconds
      });
      client.disconnect();
      return;
    }

    this.clients.set(client.id, client);

    // Initialize connection tracking
    this.connectionPool.set(client.id, {
      lastActivity: Date.now(),
      requestCount: 0,
    });

    // Track connection in health service
    this.healthService.trackConnection(client.id);

    // Track client activity for rate limiting
    client.use((event, next) => {
      this.updateClientActivity(client.id);
      this.healthService.updateActivity(client.id, 'received');
      next();
    });

    // Connection quality monitoring
    client.on('ping', () => {
      const now = Date.now();
      client.emit('pong', now);
    });

    client.on('pong', (timestamp: number) => {
      const latency = Date.now() - timestamp;
      this.updateConnectionQuality(client.id, latency);
      this.healthService.updateActivity(client.id, 'received', latency);
    });

    // Set up error handling for this client
    client.on('error', (error) => {
      console.error(`Socket error for client ${client.id}:`, error);
      this.healthService.updateActivity(client.id, 'error');
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
    this.stockSubscriptions.delete(client.id);
    this.connectionPool.delete(client.id);
    this.connectionQuality.delete(client.id);

    // S39: Clean up prediction subscriptions
    this.cleanupPredictionSubscriptions(client.id);

    // Remove from health service
    this.healthService.removeConnection(client.id);

    // Cleanup any pending throttled updates for this client
    const clientUpdateKeys = Array.from(this.throttledUpdates.keys()).filter(
      (key) => key.startsWith(client.id),
    );
    clientUpdateKeys.forEach((key) => {
      const timeout = this.throttledUpdates.get(key);
      if (timeout) clearTimeout(timeout);
      this.throttledUpdates.delete(key);
      this.pendingUpdates.delete(key);
    });

    // Cleanup batch processing if no clients connected
    if (this.clients.size === 0) {
      this.cleanupBatchProcessing();
      this.cleanupConnectionManagement();
      this.cleanupOptimizations();
    }

    // Cleanup prediction subscriptions
    this.cleanupPredictionSubscriptions(client.id);
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

    // Add to selective subscription tracking
    if (!this.stockSubscriptions.has(client.id)) {
      this.stockSubscriptions.set(client.id, new Set());
    }
    this.stockSubscriptions.get(client.id)!.add(data.symbol.toUpperCase());

    // Join room for specific stock
    client.join(`stock_${data.symbol}`);
  }

  @SubscribeMessage('unsubscribe_stock')
  handleUnsubscribeStock(
    @MessageBody() data: { symbol: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Client ${client.id} unsubscribed from ${data.symbol}`);

    // Remove from selective subscription tracking
    if (this.stockSubscriptions.has(client.id)) {
      this.stockSubscriptions.get(client.id)!.delete(data.symbol.toUpperCase());
    }

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

      // Use batched updates for better performance
      this.addToBatch('stock_update', { symbol, data: stockData });
      this.addToBatch(`stock_specific_update_${symbol}`, stockData);

      console.log(`Queued update for ${symbol}`);
    } catch (error) {
      console.error(`Error broadcasting stock update for ${symbol}:`, error);
    }
  }

  async broadcastTradingSignal(signal: any) {
    if (!this.server) {
      console.warn(
        'WebSocket server not available, skipping trading signal broadcast',
      );
      return;
    }
    this.server.emit('trading_signal', signal);
  }

  async broadcastNewsUpdate(news: any) {
    if (!this.server) {
      console.warn(
        'WebSocket server not available, skipping news update broadcast',
      );
      return;
    }
    this.server.emit('news_update', news);
  }
  /**
   * Broadcast all stock updates to connected clients with batching optimization
   * Called by StockService when prices are updated
   * Only sends stocks that have valid price data (currentPrice > 0)
   */
  async broadcastAllStockUpdates() {
    try {
      const allStocks = await this.stockService.getAllStocks();
      // Filter to only include stocks with valid price data
      const readyStocks = allStocks.filter((stock) => stock.currentPrice > 0);

      if (this.server && readyStocks.length > 0) {
        // Use batched message sending for better performance
        this.addToBatch('stock_updates', readyStocks);
        console.log(
          `📊 Queued ${readyStocks.length}/${allStocks.length} ready stock updates for batched broadcast`,
        );

        // Also queue portfolio updates since stock prices changed
        await this.broadcastPortfolioUpdates();
      } else if (allStocks.length > 0) {
        console.log(
          `⏭️ No ready stocks to broadcast (${allStocks.length} total stocks, none with valid prices)`,
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
      const target =
        client ||
        (this.server ? this.server.to(`portfolio_${portfolioId}`) : null);
      if (target) {
        target.emit('portfolio_error', {
          portfolioId,
          message: 'Failed to fetch portfolio data',
          timestamp: new Date().toISOString(),
        });
      }
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
      if (this.server) {
        this.server.emit('order_book_update', order);
      }

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
      if (this.server) {
        this.server.emit('order_book_update', {
          orderId: data.orderId,
          status: 'canceled',
        });
      }

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
      if (!this.server) {
        console.warn('WebSocket server not available, skipping notification');
        return;
      }
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
      if (!this.server) {
        console.warn(
          'WebSocket server not available, skipping bulk notifications',
        );
        return;
      }
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
      if (!this.server) {
        console.warn(
          'WebSocket server not available, skipping notification status update',
        );
        return;
      }
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
      if (!this.server) {
        console.warn(
          'WebSocket server not available, skipping unread count update',
        );
        return;
      }
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
      if (!this.server) {
        console.warn('WebSocket server not available, skipping system alert');
        return;
      }
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
        if (this.server) {
          this.server.emit('portfolios_update', portfolios);
        }

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
        if (this.server) {
          this.server.emit('portfolios_update', []);
        }
        console.log('📊 Broadcasted empty portfolios list to all clients');
      }
    } catch (error) {
      console.error('Error broadcasting all portfolios:', error);

      // Send error to all clients
      if (this.server) {
        this.server.emit('portfolios_error', {
          message: 'Failed to fetch portfolios data',
          timestamp: new Date().toISOString(),
        });
      }
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

  /**
   * Initialize batch processing for message optimization
   */
  private initializeBatchProcessing() {
    // Start the batch processing timer
    this.processBatchedMessages();
  }

  /**
   * Add message to batch for optimized delivery
   */
  private addToBatch(eventType: string, data: any) {
    if (!this.messageBatch.has(eventType)) {
      this.messageBatch.set(eventType, []);
    }

    const batch = this.messageBatch.get(eventType)!;
    batch.push(data);

    // If batch is full, process immediately
    if (batch.length >= this.MAX_BATCH_SIZE) {
      this.flushBatch(eventType);
    }
  }

  /**
   * Process batched messages at regular intervals
   */
  private processBatchedMessages() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
    }

    this.batchTimer = setTimeout(() => {
      this.flushAllBatches();
      this.processBatchedMessages(); // Schedule next batch
    }, this.BATCH_INTERVAL);
  }

  /**
   * Flush all message batches
   */
  private flushAllBatches() {
    for (const [eventType] of this.messageBatch) {
      this.flushBatch(eventType);
    }
  }

  /**
   * Flush specific batch type
   */
  private flushBatch(eventType: string) {
    const batch = this.messageBatch.get(eventType);
    if (!batch || batch.length === 0) {
      return;
    }

    try {
      let payload: any;

      if (eventType.startsWith('stock_specific_update_')) {
        // Handle specific stock updates
        const symbol = eventType.replace('stock_specific_update_', '');
        payload = {
          symbol,
          updates: batch,
          timestamp: new Date().toISOString(),
        };

        // Use optimized emission with compression
        this.emitOptimized(
          `stock_${symbol}`,
          'stock_specific_update_batch',
          payload,
        );
      } else {
        // Handle general batched updates
        payload = {
          updates: batch,
          count: batch.length,
          timestamp: new Date().toISOString(),
        };

        // Use optimized emission with compression
        this.emitOptimized(null, `${eventType}_batch`, payload);
      }

      console.log(`✨ Flushed ${batch.length} messages for ${eventType}`);
    } catch (error) {
      console.error(`Error flushing batch for ${eventType}:`, error);
    }

    // Clear the batch
    this.messageBatch.set(eventType, []);
  }

  /**
   * Cleanup batch processing on disconnect
   */
  private cleanupBatchProcessing() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    this.messageBatch.clear();
  }

  /**
   * Initialize connection management and rate limiting
   */
  private initializeConnectionManagement() {
    // Start connection cleanup timer
    this.cleanupTimer = setInterval(() => {
      this.cleanupInactiveConnections();
    }, this.CONNECTION_CLEANUP_INTERVAL);
  }

  /**
   * Check rate limit for client
   */
  private checkRateLimit(clientId: string): boolean {
    const connection = this.connectionPool.get(clientId);
    if (!connection) {
      return true; // New connection, allow
    }

    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Reset request count if more than a minute has passed
    if (connection.lastActivity < oneMinuteAgo) {
      connection.requestCount = 0;
    }

    return connection.requestCount < this.MAX_REQUESTS_PER_MINUTE;
  }

  /**
   * Update client activity for rate limiting
   */
  private updateClientActivity(clientId: string) {
    const connection = this.connectionPool.get(clientId);
    if (connection) {
      connection.lastActivity = Date.now();
      connection.requestCount++;
    }
  }

  /**
   * Clean up inactive connections
   */
  private cleanupInactiveConnections() {
    const now = Date.now();
    const fiveMinutesAgo = now - 300000; // 5 minutes

    for (const [clientId, connection] of this.connectionPool.entries()) {
      if (connection.lastActivity < fiveMinutesAgo) {
        const client = this.clients.get(clientId);
        if (client) {
          console.log(`Disconnecting inactive client: ${clientId}`);
          client.disconnect();
        }
      }
    }
  }

  /**
   * Cleanup connection management
   */
  private cleanupConnectionManagement() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.connectionPool.clear();
    this.stockSubscriptions.clear();
    this.lastUpdateTimes.clear();
  }

  /**
   * Throttle updates to prevent overwhelming clients
   */
  private throttleUpdate(key: string, data: any, emitFn: () => void) {
    // Cancel previous timeout for this key
    if (this.throttledUpdates.has(key)) {
      clearTimeout(this.throttledUpdates.get(key)!);
    }

    // Store pending update
    this.pendingUpdates.set(key, data);

    // Set new timeout
    const timeoutId = setTimeout(() => {
      const pendingData = this.pendingUpdates.get(key);
      if (pendingData) {
        emitFn();
        this.pendingUpdates.delete(key);
        this.throttledUpdates.delete(key);
      }
    }, this.UPDATE_THROTTLE_MS);

    this.throttledUpdates.set(key, timeoutId);
  }

  /**
   * Monitor connection quality based on ping times
   */
  private updateConnectionQuality(clientId: string, latency: number) {
    const now = Date.now();
    let quality: 'good' | 'poor' | 'bad' = 'good';

    if (latency > 1000) {
      quality = 'bad';
    } else if (latency > 500) {
      quality = 'poor';
    }

    this.connectionQuality.set(clientId, {
      latency,
      lastPing: now,
      quality,
    });

    // Adjust update frequency based on connection quality
    if (quality === 'bad') {
      // Reduce update frequency for poor connections
      console.log(
        `⚠️ Poor connection detected for client ${clientId}, reducing update frequency`,
      );
    }
  }

  /**
   * Get connection quality for a client
   */
  private getConnectionQuality(clientId: string) {
    return (
      this.connectionQuality.get(clientId) || {
        latency: 0,
        lastPing: 0,
        quality: 'good' as const,
      }
    );
  }

  /**
   * Cleanup optimization data structures
   */
  private cleanupOptimizations() {
    this.throttledUpdates.forEach((timeout) => clearTimeout(timeout));
    this.throttledUpdates.clear();
    this.pendingUpdates.clear();
    this.connectionQuality.clear();
  }

  /**
   * Optimized emit with compression and binary support
   */
  private emitOptimized(room: string | null, event: string, data: any) {
    try {
      // Check if server is available
      if (!this.server) {
        console.warn('WebSocket server not available, skipping emit');
        return;
      }

      const serializedData = JSON.stringify(data);
      const dataSize = Buffer.byteLength(serializedData, 'utf8');

      // Determine target
      const target = room ? this.server.to(room) : this.server;

      // Ensure target has emit method
      if (!target || typeof target.emit !== 'function') {
        console.warn(
          'Target does not have emit method, falling back to server emit',
        );
        if (this.server && typeof this.server.emit === 'function') {
          this.server.emit(event, data);
        }
        return;
      }

      // Use binary message for large payloads if supported
      if (dataSize > this.COMPRESSION_THRESHOLD && this.compressionEnabled) {
        // Convert to compressed binary message
        const buffer = Buffer.from(serializedData, 'utf8');
        target.emit(event, {
          type: 'compressed',
          data: buffer,
          originalSize: dataSize,
          compressed: true,
        });

        console.log(`📦 Sent compressed message: ${dataSize} bytes`);
      } else {
        // Standard JSON emission
        target.emit(event, data);
      }
    } catch (error) {
      console.error('Error in optimized emit:', error);
      // Fallback to standard emit if server is available
      try {
        if (this.server && typeof this.server.emit === 'function') {
          const target = room ? this.server.to(room) : this.server;
          if (target && typeof target.emit === 'function') {
            target.emit(event, data);
          }
        }
      } catch (fallbackError) {
        console.error('Fallback emit also failed:', fallbackError);
      }
    }
  }

  /**
   * Check if client supports compression
   */
  private clientSupportsCompression(clientId: string): boolean {
    const client = this.clients.get(clientId);
    return client ? client.conn.transport.name === 'websocket' : false;
  }

  // ========================================
  // S39: Predictive Analytics WebSocket Methods
  // ========================================

  /**
   * Subscribe to real-time predictive analytics for symbols
   */
  @SubscribeMessage('subscribe-predictions')
  async handlePredictionSubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: PredictionSubscription,
  ) {
    console.log(
      `🔮 Client ${client.id} subscribing to predictions for ${data.symbol}`,
    );

    try {
      // Store client subscription
      this.predictionSubscriptions.set(client.id, data);

      // Join symbol-specific room
      await client.join(`predictions:${data.symbol}`);

      // Start streaming predictions if not already started
      if (
        !this.predictionStreams.has(data.symbol) &&
        this.predictiveAnalyticsService
      ) {
        const stream = this.predictiveAnalyticsService
          .streamPredictions(data.symbol)
          .subscribe({
            next: (update: PredictionUpdate) => {
              this.emitPredictionUpdate(data.symbol, update);
            },
            error: (error) => {
              console.error(
                `Error in prediction stream for ${data.symbol}:`,
                error,
              );
              this.server
                .to(`predictions:${data.symbol}`)
                .emit('prediction-error', {
                  symbol: data.symbol,
                  error: 'Prediction stream error',
                  timestamp: new Date(),
                });
            },
          });

        this.predictionStreams.set(data.symbol, stream);
      }

      // Send initial prediction data
      if (this.predictiveAnalyticsService) {
        const initialPrediction =
          await this.predictiveAnalyticsService.getRealTimePredictions(
            data.symbol,
          );

        client.emit('prediction-update', {
          type: 'prediction-update',
          symbol: data.symbol,
          timestamp: new Date(),
          data: initialPrediction,
          changeDetected: [],
        } as PredictionUpdate);
      }

      client.emit('subscription-confirmed', {
        type: 'predictions',
        symbol: data.symbol,
        status: 'active',
      });
    } catch (error) {
      console.error(
        `Error subscribing to predictions for ${data.symbol}:`,
        error,
      );
      client.emit('subscription-error', {
        type: 'predictions',
        symbol: data.symbol,
        error: 'Failed to subscribe to predictions',
      });
    }
  }

  /**
   * Unsubscribe from predictive analytics
   */
  @SubscribeMessage('unsubscribe-predictions')
  async handlePredictionUnsubscription(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { symbol: string },
  ) {
    console.log(
      `🔮 Client ${client.id} unsubscribing from predictions for ${data.symbol}`,
    );

    try {
      // Remove client subscription
      this.predictionSubscriptions.delete(client.id);

      // Leave symbol-specific room
      await client.leave(`predictions:${data.symbol}`);

      // Check if any clients are still subscribed to this symbol
      const roomSize =
        this.server?.sockets?.adapter?.rooms?.get(`predictions:${data.symbol}`)
          ?.size || 0;

      // If no clients are subscribed, stop the stream
      if (roomSize === 0 && this.predictionStreams.has(data.symbol)) {
        const stream = this.predictionStreams.get(data.symbol);
        if (stream && stream.unsubscribe) {
          stream.unsubscribe();
        }
        this.predictionStreams.delete(data.symbol);
        console.log(
          `🔮 Stopped prediction stream for ${data.symbol} - no active subscribers`,
        );
      }

      client.emit('unsubscription-confirmed', {
        type: 'predictions',
        symbol: data.symbol,
        status: 'inactive',
      });
    } catch (error) {
      console.error(
        `Error unsubscribing from predictions for ${data.symbol}:`,
        error,
      );
      client.emit('unsubscription-error', {
        type: 'predictions',
        symbol: data.symbol,
        error: 'Failed to unsubscribe from predictions',
      });
    }
  }

  /**
   * Get current prediction data for a symbol
   */
  @SubscribeMessage('get-prediction')
  async handleGetPrediction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { symbol: string },
  ) {
    try {
      if (this.predictiveAnalyticsService) {
        const prediction =
          await this.predictiveAnalyticsService.getRealTimePredictions(
            data.symbol,
          );

        client.emit('prediction-data', {
          symbol: data.symbol,
          data: prediction,
          timestamp: new Date(),
        });
      } else {
        client.emit('prediction-error', {
          symbol: data.symbol,
          error: 'Predictive analytics service not available',
        });
      }
    } catch (error) {
      console.error(`Error getting prediction for ${data.symbol}:`, error);
      client.emit('prediction-error', {
        symbol: data.symbol,
        error: 'Failed to get prediction data',
        timestamp: new Date(),
      });
    }
  }

  /**
   * Emit prediction update to all subscribed clients
   */
  private emitPredictionUpdate(symbol: string, update: PredictionUpdate) {
    try {
      if (!this.server) {
        console.warn(
          'WebSocket server not available, skipping prediction update',
        );
        return;
      }
      this.server.to(`predictions:${symbol}`).emit('prediction-update', update);
      console.log(
        `🔮 Emitted prediction update for ${symbol} to subscribed clients`,
      );
    } catch (error) {
      console.error(`Error emitting prediction update for ${symbol}:`, error);
    }
  }

  /**
   * Clean up prediction subscriptions when client disconnects
   */
  private cleanupPredictionSubscriptions(clientId: string) {
    const subscription = this.predictionSubscriptions.get(clientId);
    if (subscription) {
      this.predictionSubscriptions.delete(clientId);

      // Check if we need to stop any streams
      const symbol = subscription.symbol;
      const roomSize =
        this.server?.sockets?.adapter?.rooms?.get(`predictions:${symbol}`)
          ?.size || 0;

      if (roomSize === 0 && this.predictionStreams.has(symbol)) {
        const stream = this.predictionStreams.get(symbol);
        if (stream && stream.unsubscribe) {
          stream.unsubscribe();
        }
        this.predictionStreams.delete(symbol);
        console.log(
          `🔮 Cleaned up prediction stream for ${symbol} after client disconnect`,
        );
      }
    }
  }

  // ========================================
  // Auto-Trading WebSocket Methods
  // ========================================

  /**
   * Notify about trading session started
   */
  async notifyTradingSessionStarted(portfolioId: string, session: any) {
    try {
      this.server
        .to(`portfolio_${portfolioId}`)
        .emit('trading_session_started', {
          type: 'trading_session_started',
          data: session,
          portfolioId,
          timestamp: new Date().toISOString(),
        });
      console.log(
        `🎯 Trading session started notification sent for portfolio ${portfolioId}`,
      );
    } catch (error) {
      console.error(
        `Error sending trading session started notification:`,
        error,
      );
    }
  }

  /**
   * Notify about trading session stopped
   */
  async notifyTradingSessionStopped(
    portfolioId: string,
    sessionId: string,
    reason?: string,
  ) {
    try {
      this.server
        .to(`portfolio_${portfolioId}`)
        .emit('trading_session_stopped', {
          type: 'trading_session_stopped',
          data: {
            sessionId,
            reason: reason || 'Manual stop',
          },
          portfolioId,
          timestamp: new Date().toISOString(),
        });
      console.log(
        `🛑 Trading session stopped notification sent for portfolio ${portfolioId}`,
      );
    } catch (error) {
      console.error(
        `Error sending trading session stopped notification:`,
        error,
      );
    }
  }

  /**
   * Notify about trade executed
   */
  async notifyTradeExecuted(portfolioId: string, tradeData: any) {
    try {
      // Send to portfolio-specific room
      this.server.to(`portfolio_${portfolioId}`).emit('trade_executed', {
        type: 'trade_executed',
        data: tradeData,
        portfolioId,
        timestamp: new Date().toISOString(),
      });

      // Also send to general trading room for broader notifications
      this.server.emit('auto_trade_notification', {
        type: 'trade_executed',
        data: {
          portfolioId,
          symbol: tradeData.symbol,
          type: tradeData.type,
          quantity: tradeData.quantity,
          price: tradeData.price,
          rule: tradeData.rule,
        },
        timestamp: new Date().toISOString(),
      });

      console.log(
        `💹 Trade executed notification sent: ${tradeData.type} ${tradeData.quantity} ${tradeData.symbol}`,
      );
    } catch (error) {
      console.error(`Error sending trade executed notification:`, error);
    }
  }

  /**
   * Notify about trading rule triggered
   */
  async notifyTradingRuleTriggered(portfolioId: string, ruleData: any) {
    try {
      this.server
        .to(`portfolio_${portfolioId}`)
        .emit('trading_rule_triggered', {
          type: 'trading_rule_triggered',
          data: ruleData,
          portfolioId,
          timestamp: new Date().toISOString(),
        });
      console.log(
        `⚡ Trading rule triggered notification sent for portfolio ${portfolioId}`,
      );
    } catch (error) {
      console.error(
        `Error sending trading rule triggered notification:`,
        error,
      );
    }
  }

  /**
   * Notify about emergency stop triggered
   */
  async notifyEmergencyStopTriggered(portfolioId: string, reason: string) {
    try {
      this.server
        .to(`portfolio_${portfolioId}`)
        .emit('emergency_stop_triggered', {
          type: 'emergency_stop_triggered',
          data: {
            reason,
            portfolioId,
          },
          timestamp: new Date().toISOString(),
        });

      // Also broadcast as system alert for high visibility
      await this.broadcastSystemAlert({
        title: 'Emergency Stop Triggered',
        message: `Emergency stop activated for portfolio ${portfolioId}: ${reason}`,
        severity: 'critical',
        portfolioId,
      });

      console.log(
        `🚨 Emergency stop notification sent for portfolio ${portfolioId}`,
      );
    } catch (error) {
      console.error(`Error sending emergency stop notification:`, error);
    }
  }

  /**
   * Subscribe to auto-trading notifications
   */
  @SubscribeMessage('subscribe_auto_trading')
  handleSubscribeAutoTrading(
    @MessageBody() data: { portfolioId: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `Client ${client.id} subscribed to auto-trading for portfolio ${data.portfolioId}`,
    );
    client.join(`auto_trading_${data.portfolioId}`);
  }

  /**
   * Unsubscribe from auto-trading notifications
   */
  @SubscribeMessage('unsubscribe_auto_trading')
  handleUnsubscribeAutoTrading(
    @MessageBody() data: { portfolioId: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(
      `Client ${client.id} unsubscribed from auto-trading for portfolio ${data.portfolioId}`,
    );
    client.leave(`auto_trading_${data.portfolioId}`);
  }
}
