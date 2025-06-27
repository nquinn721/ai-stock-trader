import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CreateOrderRequest,
  ExchangeConnector,
  ExchangeOrder,
  ExchangeOrderBook,
  ExchangeConfig,
} from '../interfaces/exchange-connector.interface';
import { BinanceAdapter } from '../adapters/binance.adapter';

@Injectable()
export class ExchangeConnectorService implements OnModuleInit {
  private readonly logger = new Logger(ExchangeConnectorService.name);
  private exchanges: Map<string, ExchangeConnector> = new Map();

  constructor(private configService: ConfigService) {}
  /**
   * Initialize exchange connectors on module startup
   */
  async onModuleInit(): Promise<void> {
    this.logger.log('Initializing exchange connectors...');

    try {
      // Initialize Binance adapter
      await this.initializeBinanceAdapter();
      
      this.logger.log(`Initialized ${this.exchanges.size} exchange connectors`);
    } catch (error) {
      this.logger.error(`Failed to initialize exchange connectors: ${error.message}`);
    }
  }

  /**
   * Initialize Binance adapter with configuration
   */
  private async initializeBinanceAdapter(): Promise<void> {
    try {
      const binanceConfig: ExchangeConfig = {
        name: 'binance',
        apiKey: this.configService.get<string>('BINANCE_API_KEY') || '',
        secretKey: this.configService.get<string>('BINANCE_SECRET_KEY') || '',
        sandbox: this.configService.get<boolean>('BINANCE_TESTNET') || false,
        baseUrl: this.configService.get<string>('BINANCE_BASE_URL'),
        wsUrl: this.configService.get<string>('BINANCE_WS_URL'),
        rateLimits: {
          requests: 1200, // Binance allows 1200 requests per minute
          interval: 60000, // 1 minute
          weight: 1200, // Binance weight limits
        },
      };

      const binanceAdapter = new BinanceAdapter(binanceConfig);

      // Only connect if API keys are provided
      if (binanceConfig.apiKey && binanceConfig.secretKey) {
        await binanceAdapter.connect();
        this.logger.log('Binance adapter connected with API authentication');
      } else {
        this.logger.warn('Binance API keys not configured - running in read-only mode');
      }

      this.registerExchange('binance', binanceAdapter);
    } catch (error) {
      this.logger.error(`Failed to initialize Binance adapter: ${error.message}`);
    }
  }

  /**
   * Register an exchange connector
   */
  registerExchange(name: string, connector: ExchangeConnector): void {
    this.exchanges.set(name, connector);
    this.logger.log(`Registered exchange connector: ${name}`);
  }

  /**
   * Get exchange connector by name
   */
  getExchange(name: string): ExchangeConnector | undefined {
    return this.exchanges.get(name);
  }

  /**
   * Get all registered exchanges
   */
  getExchanges(): string[] {
    return Array.from(this.exchanges.keys());
  }

  /**
   * Get order book from multiple exchanges
   */
  async getAggregatedOrderBook(
    symbol: string,
    exchanges?: string[],
  ): Promise<ExchangeOrderBook[]> {
    const targetExchanges = exchanges || this.getExchanges();
    const orderBooks: ExchangeOrderBook[] = [];

    for (const exchangeName of targetExchanges) {
      const exchange = this.getExchange(exchangeName);
      if (exchange) {
        try {
          const orderBook = await exchange.getOrderBook(symbol);
          orderBooks.push(orderBook);
        } catch (error) {
          this.logger.warn(
            `Failed to get order book from ${exchangeName}: ${error.message}`,
          );
        }
      }
    }

    return orderBooks;
  }

  /**
   * Get best bid/ask across exchanges
   */
  async getBestQuotes(
    symbol: string,
    exchanges?: string[],
  ): Promise<{
    bestBid: { price: number; quantity: number; exchange: string } | null;
    bestAsk: { price: number; quantity: number; exchange: string } | null;
  }> {
    const orderBooks = await this.getAggregatedOrderBook(symbol, exchanges);

    let bestBid: { price: number; quantity: number; exchange: string } | null =
      null;
    let bestAsk: { price: number; quantity: number; exchange: string } | null =
      null;

    for (const book of orderBooks) {
      // Best bid (highest price)
      if (book.bids.length > 0) {
        const [price, quantity] = book.bids[0];
        if (!bestBid || price > bestBid.price) {
          bestBid = { price, quantity, exchange: book.exchange };
        }
      }

      // Best ask (lowest price)
      if (book.asks.length > 0) {
        const [price, quantity] = book.asks[0];
        if (!bestAsk || price < bestAsk.price) {
          bestAsk = { price, quantity, exchange: book.exchange };
        }
      }
    }

    return { bestBid, bestAsk };
  }

  /**
   * Execute arbitrage opportunity
   */
  async executeArbitrage(
    symbol: string,
    buyExchange: string,
    sellExchange: string,
    quantity: number,
    expectedProfit: number,
  ): Promise<{
    success: boolean;
    buyOrder?: ExchangeOrder;
    sellOrder?: ExchangeOrder;
    actualProfit?: number;
    error?: string;
  }> {
    const buyConnector = this.getExchange(buyExchange);
    const sellConnector = this.getExchange(sellExchange);

    if (!buyConnector || !sellConnector) {
      return {
        success: false,
        error: 'Exchange connector not found',
      };
    }

    try {
      // Place buy order on cheaper exchange
      const buyOrderRequest: CreateOrderRequest = {
        symbol,
        side: 'buy',
        type: 'market',
        quantity,
        clientOrderId: `arb_buy_${Date.now()}`,
      };

      // Place sell order on expensive exchange
      const sellOrderRequest: CreateOrderRequest = {
        symbol,
        side: 'sell',
        type: 'market',
        quantity,
        clientOrderId: `arb_sell_${Date.now()}`,
      };

      // Execute orders simultaneously
      const [buyOrder, sellOrder] = await Promise.all([
        buyConnector.createOrder(buyOrderRequest),
        sellConnector.createOrder(sellOrderRequest),
      ]);

      // Calculate actual profit
      const actualProfit =
        (sellOrder.averagePrice || 0) * quantity -
        (buyOrder.averagePrice || 0) * quantity;

      return {
        success: true,
        buyOrder,
        sellOrder,
        actualProfit,
      };
    } catch (error) {
      this.logger.error(`Arbitrage execution failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check exchange connectivity
   */
  async checkConnectivity(): Promise<{ [exchange: string]: boolean }> {
    const results: { [exchange: string]: boolean } = {};

    for (const [name, connector] of this.exchanges) {
      try {
        await connector.connect();
        results[name] = connector.isConnected();
      } catch (error) {
        this.logger.warn(
          `Exchange ${name} connectivity check failed: ${error.message}`,
        );
        results[name] = false;
      }
    }

    return results;
  }

  /**
   * Get aggregated portfolio balances across exchanges
   */
  async getAggregatedBalances(): Promise<{
    [asset: string]: {
      total: number;
      exchanges: { [exchange: string]: number };
    };
  }> {
    const aggregated: {
      [asset: string]: {
        total: number;
        exchanges: { [exchange: string]: number };
      };
    } = {};

    for (const [exchangeName, connector] of this.exchanges) {
      try {
        const balances = await connector.getBalances();

        for (const balance of balances) {
          if (!aggregated[balance.currency]) {
            aggregated[balance.currency] = {
              total: 0,
              exchanges: {},
            };
          }

          aggregated[balance.currency].total +=
            balance.available + balance.locked;
          aggregated[balance.currency].exchanges[exchangeName] =
            balance.available + balance.locked;
        }
      } catch (error) {
        this.logger.warn(
          `Failed to get balances from ${exchangeName}: ${error.message}`,
        );
      }
    }

    return aggregated;
  }

  /**
   * Monitor exchange rate limits
   */
  async getExchangeStatus(): Promise<{
    [exchange: string]: {
      connected: boolean;
      rateLimitUsed?: number;
      rateLimitRemaining?: number;
      lastError?: string;
    };
  }> {
    const status: any = {};

    for (const [name, connector] of this.exchanges) {
      try {
        // Check if exchange is connected
        const connected = connector.isConnected();
        status[name] = {
          connected,
          rateLimitUsed: 0, // Would be populated by specific implementations
          rateLimitRemaining: 1000,
        };
      } catch (error) {
        status[name] = {
          connected: false,
          lastError: error.message,
        };
      }
    }

    return status;
  }
}
