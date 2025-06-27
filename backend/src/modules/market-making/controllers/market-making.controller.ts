import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Logger,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ArbitrageOpportunity,
  LiquidityPool,
  MeanReversionParams,
  MomentumSignals,
} from '../interfaces/liquidity-provision.interface';
import {
  MarketConditions,
  MarketMakingStrategy,
  Position,
  RiskExposure,
  RiskLimits,
} from '../interfaces/market-making.interface';
import {
  MarketShock,
  OptionsPosition,
  Portfolio,
  PortfolioPosition,
  StressScenario,
} from '../interfaces/risk-management.interface';
import { DataPersistenceService } from '../services/data-persistence.service';
import { ExchangeConnectorService } from '../services/exchange-connector.service';
import { LiquidityProvisionServiceImpl } from '../services/liquidity-provision.service';
import { MarketDataServiceImpl } from '../services/market-data.service';
import { MarketMakingServiceImpl } from '../services/market-making.service';
import { RiskManagementServiceImpl } from '../services/risk-management.service';
import { WebSocketManagerService } from '../services/websocket-manager.service';

@Controller('market-making')
export class MarketMakingController {
  private readonly logger = new Logger(MarketMakingController.name);

  constructor(
    private readonly marketMakingService: MarketMakingServiceImpl,
    private readonly liquidityService: LiquidityProvisionServiceImpl,
    private readonly riskManagementService: RiskManagementServiceImpl,
    private readonly marketDataService: MarketDataServiceImpl,
    private readonly exchangeConnectorService: ExchangeConnectorService,
    private readonly webSocketManagerService: WebSocketManagerService,
    private readonly dataPersistenceService: DataPersistenceService,
  ) {}

  // Market Making Endpoints

  @Post('optimal-spread/:symbol')
  async calculateOptimalSpread(
    @Param('symbol') symbol: string,
    @Body() marketConditions: MarketConditions,
  ) {
    try {
      this.logger.log(`Calculating optimal spread for ${symbol}`);

      if (!symbol || !marketConditions) {
        throw new BadRequestException(
          'Symbol and market conditions are required',
        );
      }

      const result = await this.marketMakingService.calculateOptimalSpread(
        symbol,
        marketConditions,
      );

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error calculating optimal spread: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to calculate optimal spread',
      );
    }
  }

  @Post('manage-inventory')
  async manageInventory(
    @Body() request: { position: Position; riskLimits: RiskLimits },
  ) {
    try {
      this.logger.log(`Managing inventory for ${request.position.symbol}`);

      const result = await this.marketMakingService.manageInventory(
        request.position,
        request.riskLimits,
      );

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error managing inventory: ${error.message}`);
      throw new InternalServerErrorException('Failed to manage inventory');
    }
  }

  @Get('fair-value/:symbol')
  async calculateFairValue(
    @Param('symbol') symbol: string,
    @Query('venue') venue: string = 'PRIMARY',
  ) {
    try {
      this.logger.log(`Calculating fair value for ${symbol} on ${venue}`);

      const result = await this.marketMakingService.calculateFairValue(
        symbol,
        venue,
      );

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error calculating fair value: ${error.message}`);
      throw new InternalServerErrorException('Failed to calculate fair value');
    }
  }

  @Post('execute-strategy')
  async executeMarketMakingStrategy(@Body() strategy: MarketMakingStrategy) {
    try {
      this.logger.log(`Executing market making strategy: ${strategy.name}`);

      const result =
        await this.marketMakingService.executeMarketMakingOrders(strategy);

      return {
        success: true,
        data: result,
        message: `Executed ${result.length} orders for strategy ${strategy.name}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error executing strategy: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to execute market making strategy',
      );
    }
  }

  @Post('hedge-position')
  async hedgePosition(@Body() exposure: RiskExposure) {
    try {
      this.logger.log(`Calculating hedge for ${exposure.symbol}`);

      const result = await this.marketMakingService.hedgePosition(exposure);

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error hedging position: ${error.message}`);
      throw new InternalServerErrorException('Failed to hedge position');
    }
  }

  // Liquidity Provision Endpoints

  @Post('strategies/mean-reversion')
  async implementMeanReversionStrategy(
    @Body() parameters: MeanReversionParams,
  ) {
    try {
      this.logger.log('Implementing mean reversion strategy');

      const result =
        await this.liquidityService.implementMeanReversionStrategy(parameters);

      return {
        success: true,
        data: result,
        message: `Mean reversion strategy ${result.id} implemented successfully`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Error implementing mean reversion strategy: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to implement mean reversion strategy',
      );
    }
  }

  @Post('strategies/momentum')
  async executeMomentumStrategy(@Body() signals: MomentumSignals) {
    try {
      this.logger.log(`Executing momentum strategy for ${signals.symbol}`);

      const result =
        await this.liquidityService.executeMomentumStrategy(signals);

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error executing momentum strategy: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to execute momentum strategy',
      );
    }
  }

  @Get('arbitrage/opportunities')
  async detectArbitrageOpportunities() {
    try {
      this.logger.log('Detecting arbitrage opportunities');

      const opportunities =
        await this.liquidityService.detectArbitrageOpportunities();

      return {
        success: true,
        data: opportunities,
        count: opportunities.length,
        message: `Found ${opportunities.length} arbitrage opportunities`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Error detecting arbitrage opportunities: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to detect arbitrage opportunities',
      );
    }
  }

  @Post('arbitrage/execute/:opportunityId')
  async executeCrossVenueArbitrage(
    @Param('opportunityId') opportunityId: string,
  ) {
    try {
      this.logger.log(`Executing arbitrage opportunity: ${opportunityId}`);

      // In a real implementation, you would fetch the opportunity from storage
      const mockOpportunity: ArbitrageOpportunity = {
        id: opportunityId,
        type: 'SPATIAL',
        instruments: [],
        profitPotential: 0.01,
        riskScore: 0.3,
        requiredCapital: 10000,
        executionTimeframe: 5,
        confidence: 0.8,
        discovered: new Date(),
        expires: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
      };

      const result =
        await this.liquidityService.executeCrossVenueArbitrage(mockOpportunity);

      return {
        success: true,
        data: result,
        message: `Arbitrage executed with ${result.actualProfit > 0 ? 'profit' : 'loss'}: ${result.actualProfit}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error executing arbitrage: ${error.message}`);
      throw new InternalServerErrorException('Failed to execute arbitrage');
    }
  }

  @Post('defi/provide-liquidity')
  async provideLiquidityToDEX(
    @Body() request: { pool: LiquidityPool; amount: number },
  ) {
    try {
      this.logger.log(`Providing liquidity to DeFi pool: ${request.pool.id}`);

      const result = await this.liquidityService.provideLiquidityToDEX(
        request.pool,
        request.amount,
      );

      return {
        success: true,
        data: result,
        message: `Liquidity provided to ${request.pool.protocol}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error providing DeFi liquidity: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to provide DeFi liquidity',
      );
    }
  }

  // Risk Management Endpoints

  @Post('risk/var-calculation')
  async calculatePortfolioVaR(
    @Body() request: { portfolio: Portfolio; timeframe: string },
  ) {
    try {
      this.logger.log(`Calculating VaR for portfolio: ${request.portfolio.id}`);

      const result = await this.riskManagementService.calculatePortfolioVaR(
        request.portfolio,
        request.timeframe,
      );

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error calculating VaR: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to calculate portfolio VaR',
      );
    }
  }

  @Post('risk/concentration-analysis')
  async assessConcentrationRisk(@Body() positions: PortfolioPosition[]) {
    try {
      this.logger.log('Assessing portfolio concentration risk');

      const result =
        await this.riskManagementService.assessConcentrationRisk(positions);

      return {
        success: true,
        data: result,
        riskLevel:
          result.riskScore > 0.7
            ? 'HIGH'
            : result.riskScore > 0.4
              ? 'MEDIUM'
              : 'LOW',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error assessing concentration risk: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to assess concentration risk',
      );
    }
  }

  @Post('risk/greeks/:symbol')
  async calculateGreeks(
    @Param('symbol') symbol: string,
    @Body() optionsPosition: OptionsPosition,
  ) {
    try {
      this.logger.log(`Calculating Greeks for ${symbol}`);

      const result =
        await this.riskManagementService.calculateGreeks(optionsPosition);

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error calculating Greeks: ${error.message}`);
      throw new InternalServerErrorException('Failed to calculate Greeks');
    }
  }

  @Post('risk/dynamic-hedge')
  async executeDynamicHedge(@Body() exposure: RiskExposure) {
    try {
      this.logger.log(`Executing dynamic hedge for ${exposure.symbol}`);

      const result =
        await this.riskManagementService.executeDynamicHedge(exposure);

      return {
        success: true,
        data: result,
        message: `Dynamic hedge executed with ${result.expectedRiskReduction}% risk reduction`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error executing dynamic hedge: ${error.message}`);
      throw new InternalServerErrorException('Failed to execute dynamic hedge');
    }
  }

  @Post('risk/stress-test')
  async performStressTesting(@Body() scenarios: StressScenario[]) {
    try {
      this.logger.log('Performing stress testing');

      const result =
        await this.riskManagementService.performStressTesting(scenarios);

      return {
        success: true,
        data: result,
        message: `Stress testing completed for ${scenarios.length} scenarios`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error performing stress testing: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to perform stress testing',
      );
    }
  }

  @Post('risk/market-shock-simulation')
  async simulateMarketShock(@Body() shockParams: MarketShock) {
    try {
      this.logger.log(`Simulating market shock: ${shockParams.shockType}`);

      const result =
        await this.riskManagementService.simulateMarketShock(shockParams);

      return {
        success: true,
        data: result,
        message: `Market shock simulation completed with ${result.immediateImpact}% impact`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error simulating market shock: ${error.message}`);
      throw new InternalServerErrorException('Failed to simulate market shock');
    }
  }

  // Market Data Endpoints
  @Get('market-data/:symbol')
  async getCurrentMarketData(
    @Param('symbol') symbol: string,
    @Query('exchange') exchange?: string,
  ) {
    try {
      const marketData = await this.marketDataService.getCurrentMarketData(
        symbol,
        exchange,
      );
      return {
        success: true,
        data: marketData,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error fetching market data for ${symbol}:`, error);
      return {
        success: false,
        error: 'Failed to fetch market data',
        timestamp: new Date(),
      };
    }
  }

  @Get('order-book/:symbol')
  async getOrderBook(
    @Param('symbol') symbol: string,
    @Query('exchange') exchange?: string,
    @Query('depth') depth?: number,
  ) {
    try {
      const orderBook = await this.marketDataService.getOrderBook(
        symbol,
        exchange,
        depth ? parseInt(depth.toString()) : 10,
      );
      return {
        success: true,
        data: orderBook,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error fetching order book for ${symbol}:`, error);
      return {
        success: false,
        error: 'Failed to fetch order book',
        timestamp: new Date(),
      };
    }
  }

  @Get('aggregated-data/:symbol')
  async getAggregatedMarketData(@Param('symbol') symbol: string) {
    try {
      const aggregatedData =
        await this.marketDataService.getAggregatedMarketData(symbol);
      return {
        success: true,
        data: aggregatedData,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error fetching aggregated data for ${symbol}:`, error);
      return {
        success: false,
        error: 'Failed to fetch aggregated market data',
        timestamp: new Date(),
      };
    }
  }

  @Get('market-depth/:symbol')
  async getMarketDepthAnalytics(@Param('symbol') symbol: string) {
    try {
      const analytics =
        await this.marketDataService.getMarketDepthAnalytics(symbol);
      return {
        success: true,
        data: analytics,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error calculating market depth for ${symbol}:`, error);
      return {
        success: false,
        error: 'Failed to calculate market depth analytics',
        timestamp: new Date(),
      };
    }
  }

  @Get('volatility/:symbol')
  async getVolatility(
    @Param('symbol') symbol: string,
    @Query('periods') periods: number = 30,
  ) {
    try {
      const volatility = await this.marketDataService.calculateVolatility(
        symbol,
        periods,
      );
      return {
        success: true,
        data: {
          symbol,
          volatility,
          periods,
          annualized: true,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error calculating volatility for ${symbol}:`, error);
      return {
        success: false,
        error: 'Failed to calculate volatility',
        timestamp: new Date(),
      };
    }
  }

  @Get('vwap/:symbol')
  async getVWAP(
    @Param('symbol') symbol: string,
    @Query('timeWindow') timeWindow: number = 60, // minutes
  ) {
    try {
      const vwap = await this.marketDataService.calculateVWAP(
        symbol,
        timeWindow,
      );
      return {
        success: true,
        data: {
          symbol,
          vwap,
          timeWindow,
          unit: 'minutes',
        },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error calculating VWAP for ${symbol}:`, error);
      return {
        success: false,
        error: 'Failed to calculate VWAP',
        timestamp: new Date(),
      };
    }
  }

  @Post('subscribe')
  async subscribeToMarketData(@Body() subscriptionRequest: any) {
    try {
      const subscriptionId = await this.marketDataService.subscribe({
        symbol: subscriptionRequest.symbol,
        exchanges: subscriptionRequest.exchanges || ['NASDAQ'],
        dataTypes: subscriptionRequest.dataTypes || ['REAL_TIME'],
        callback: (data) => {
          // In a real implementation, this would use WebSockets or SSE
          this.logger.debug(`Market data update for ${data.symbol}:`, data);
        },
        isActive: true,
      });

      return {
        success: true,
        data: {
          subscriptionId,
          symbol: subscriptionRequest.symbol,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Error creating market data subscription:', error);
      return {
        success: false,
        error: 'Failed to create subscription',
        timestamp: new Date(),
      };
    }
  }

  @Delete('subscribe/:subscriptionId')
  async unsubscribeFromMarketData(
    @Param('subscriptionId') subscriptionId: string,
  ) {
    try {
      const success = await this.marketDataService.unsubscribe(subscriptionId);
      return {
        success,
        data: {
          subscriptionId,
          unsubscribed: success,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error unsubscribing from ${subscriptionId}:`, error);
      return {
        success: false,
        error: 'Failed to unsubscribe',
        timestamp: new Date(),
      };
    }
  }

  // Utility Endpoints

  @Get('health')
  async healthCheck() {
    return {
      success: true,
      message: 'Market Making Engine is operational',
      services: {
        marketMaking: 'HEALTHY',
        liquidityProvision: 'HEALTHY',
        riskManagement: 'HEALTHY',
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('status')
  async getSystemStatus() {
    try {
      // In a real implementation, you would check actual system status
      return {
        success: true,
        data: {
          activeStrategies: 5,
          totalVolume24h: 1250000,
          profitToday: 15420.75,
          riskUtilization: 0.65,
          arbitrageOpportunities: 12,
          lastUpdate: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error getting system status: ${error.message}`);
      throw new InternalServerErrorException('Failed to get system status');
    }
  }

  // ===================================
  // PHASE 2: REAL-TIME DATA & EXCHANGE INTEGRATION ENDPOINTS
  // ===================================

  /**
   * Get aggregated order book from multiple exchanges
   */
  @Get('exchanges/orderbook/:symbol')
  async getAggregatedOrderBook(
    @Param('symbol') symbol: string,
    @Query('exchanges') exchanges?: string,
  ) {
    try {
      const exchangeList = exchanges ? exchanges.split(',') : undefined;
      const orderBooks =
        await this.exchangeConnectorService.getAggregatedOrderBook(
          symbol,
          exchangeList,
        );

      return {
        success: true,
        data: orderBooks,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Error getting aggregated order book: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to get aggregated order book',
      );
    }
  }

  /**
   * Get best quotes across exchanges
   */
  @Get('exchanges/quotes/:symbol')
  async getBestQuotes(
    @Param('symbol') symbol: string,
    @Query('exchanges') exchanges?: string,
  ) {
    try {
      const exchangeList = exchanges ? exchanges.split(',') : undefined;
      const quotes = await this.exchangeConnectorService.getBestQuotes(
        symbol,
        exchangeList,
      );

      return {
        success: true,
        data: quotes,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error getting best quotes: ${error.message}`);
      throw new InternalServerErrorException('Failed to get best quotes');
    }
  }

  /**
   * Execute arbitrage opportunity
   */
  @Post('exchanges/arbitrage')
  async executeArbitrage(
    @Body()
    request: {
      symbol: string;
      buyExchange: string;
      sellExchange: string;
      quantity: number;
      expectedProfit: number;
    },
  ) {
    try {
      const result = await this.exchangeConnectorService.executeArbitrage(
        request.symbol,
        request.buyExchange,
        request.sellExchange,
        request.quantity,
        request.expectedProfit,
      );

      return {
        success: result.success,
        data: result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error executing arbitrage: ${error.message}`);
      throw new InternalServerErrorException('Failed to execute arbitrage');
    }
  }

  /**
   * Get exchange connectivity status
   */
  @Get('exchanges/status')
  async getExchangeStatus() {
    try {
      const [connectivity, status] = await Promise.all([
        this.exchangeConnectorService.checkConnectivity(),
        this.exchangeConnectorService.getExchangeStatus(),
      ]);

      return {
        success: true,
        data: {
          connectivity,
          status,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error getting exchange status: ${error.message}`);
      throw new InternalServerErrorException('Failed to get exchange status');
    }
  }

  /**
   * Get aggregated balances across exchanges
   */
  @Get('exchanges/balances')
  async getAggregatedBalances() {
    try {
      const balances =
        await this.exchangeConnectorService.getAggregatedBalances();

      return {
        success: true,
        data: balances,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error getting aggregated balances: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to get aggregated balances',
      );
    }
  }

  /**
   * Subscribe to real-time order book updates
   */
  @Post('websocket/subscribe/orderbook')
  async subscribeOrderBook(
    @Body() request: { exchange: string; symbol: string },
  ) {
    try {
      const subscriptionId =
        await this.webSocketManagerService.subscribeOrderBook(
          request.exchange,
          request.symbol,
          (data) => {
            // Store data for persistence
            this.dataPersistenceService.storeMarketDataSnapshot(
              request.exchange,
              request.symbol,
              { orderBook: data },
            );
          },
        );

      return {
        success: true,
        data: { subscriptionId },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error subscribing to order book: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to subscribe to order book',
      );
    }
  }

  /**
   * Subscribe to real-time ticker updates
   */
  @Post('websocket/subscribe/ticker')
  async subscribeTicker(@Body() request: { exchange: string; symbol: string }) {
    try {
      const subscriptionId = await this.webSocketManagerService.subscribeTicker(
        request.exchange,
        request.symbol,
        (data) => {
          // Store data for persistence
          this.dataPersistenceService.storeMarketDataSnapshot(
            request.exchange,
            request.symbol,
            { ticker: data },
          );
        },
      );

      return {
        success: true,
        data: { subscriptionId },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error subscribing to ticker: ${error.message}`);
      throw new InternalServerErrorException('Failed to subscribe to ticker');
    }
  }

  /**
   * Get WebSocket subscription status
   */
  @Get('websocket/status')
  async getWebSocketStatus() {
    try {
      const [activeSubscriptions, connectionStatus, healthCheck] =
        await Promise.all([
          this.webSocketManagerService.getActiveSubscriptions(),
          this.webSocketManagerService.getConnectionStatus(),
          this.webSocketManagerService.healthCheck(),
        ]);

      return {
        success: true,
        data: {
          activeSubscriptions,
          connectionStatus,
          healthCheck,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error getting WebSocket status: ${error.message}`);
      throw new InternalServerErrorException('Failed to get WebSocket status');
    }
  }

  /**
   * Unsubscribe from WebSocket stream
   */
  @Delete('websocket/subscribe/:subscriptionId')
  async unsubscribe(@Param('subscriptionId') subscriptionId: string) {
    try {
      const success =
        await this.webSocketManagerService.unsubscribe(subscriptionId);

      return {
        success,
        data: { unsubscribed: success },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error unsubscribing: ${error.message}`);
      throw new InternalServerErrorException('Failed to unsubscribe');
    }
  }

  /**
   * Start a new trading session
   */
  @Post('data/trading-session')
  async startTradingSession(
    @Body() request: { exchange: string; symbol: string; strategyId: string },
  ) {
    try {
      const sessionId = await this.dataPersistenceService.startTradingSession(
        request.exchange,
        request.symbol,
        request.strategyId,
      );

      return {
        success: true,
        data: { sessionId },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error starting trading session: ${error.message}`);
      throw new InternalServerErrorException('Failed to start trading session');
    }
  }

  /**
   * Get historical candles
   */
  @Get('data/candles/:exchange/:symbol')
  async getHistoricalCandles(
    @Param('exchange') exchange: string,
    @Param('symbol') symbol: string,
    @Query('interval') interval: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('limit') limit?: string,
  ) {
    try {
      const candles = await this.dataPersistenceService.getCandles(
        exchange,
        symbol,
        interval,
        startTime ? new Date(startTime) : undefined,
        endTime ? new Date(endTime) : undefined,
        limit ? parseInt(limit) : undefined,
      );

      return {
        success: true,
        data: candles,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error getting historical candles: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to get historical candles',
      );
    }
  }

  /**
   * Get performance metrics
   */
  @Get('data/performance/:strategyId')
  async getPerformanceMetrics(
    @Param('strategyId') strategyId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const metrics = await this.dataPersistenceService.getPerformanceMetrics(
        strategyId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined,
      );

      return {
        success: true,
        data: metrics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error getting performance metrics: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to get performance metrics',
      );
    }
  }

  /**
   * Get trading session history
   */
  @Get('data/trading-sessions')
  async getTradingSessions(
    @Query('strategyId') strategyId?: string,
    @Query('exchange') exchange?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const sessions = await this.dataPersistenceService.getTradingSessions(
        strategyId,
        exchange,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined,
      );

      return {
        success: true,
        data: sessions,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error getting trading sessions: ${error.message}`);
      throw new InternalServerErrorException('Failed to get trading sessions');
    }
  }

  /**
   * Get database statistics
   */
  @Get('data/stats')
  async getDatabaseStats() {
    try {
      const stats = await this.dataPersistenceService.getDatabaseStats();

      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error getting database stats: ${error.message}`);
      throw new InternalServerErrorException('Failed to get database stats');
    }
  }

  /**
   * Get market data snapshot
   */
  @Get('websocket/snapshot/:exchange/:symbol')
  async getMarketDataSnapshot(
    @Param('exchange') exchange: string,
    @Param('symbol') symbol: string,
  ) {
    try {
      const snapshot = this.webSocketManagerService.getMarketDataSnapshot(
        exchange,
        symbol,
      );

      return {
        success: true,
        data: snapshot || null,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error getting market data snapshot: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to get market data snapshot',
      );
    }
  }
}
