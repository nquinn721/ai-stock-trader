  /**
   * Get historical candles
   */
  async getCandles(
    symbol: string,
    interval: string,
    limit = 100,
  ): Promise<ExchangeCandle[]> {
    try {
      const ohlcv = await this.exchange.fetchOHLCV(
        symbol,
        interval,
        undefined,
        limit,
      );
      
      return ohlcv.map(([timestamp, open, high, low, close, volume]) => ({
        timestamp: new Date(timestamp),
        open,
        high,
        low,
        close,
        volume,
        symbol,
        exchange: 'binance',
      }));
    } catch (error) {
      this.logger.error(`Failed to get candles for ${symbol}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel order - return boolean as per interface
   */
  async cancelOrder(orderId: string, symbol: string): Promise<boolean> {
    try {
      await this.exchange.cancelOrder(orderId, symbol);
      this.logger.log(`Order ${orderId} canceled successfully`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to cancel order ${orderId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get orders with optional filtering
   */
  async getOrders(symbol?: string, status?: string): Promise<ExchangeOrder[]> {
    try {
      const orders = status === 'open' 
        ? await this.exchange.fetchOpenOrders(symbol)
        : await this.exchange.fetchClosedOrders(symbol);
      
      return orders.map((order) => ({
        id: order.id,
        clientOrderId: order.clientOrderId,
        symbol: order.symbol,
        exchange: 'binance',
        side: order.side as 'buy' | 'sell',
        type: order.type as 'market' | 'limit' | 'stop' | 'stop_limit',
        quantity: order.amount,
        price: order.price || 0,
        status: order.status as 'pending' | 'open' | 'filled' | 'cancelled' | 'rejected',
        filledQuantity: order.filled || 0,
        remainingQuantity: order.remaining || 0,
        averagePrice: order.average || 0,
        timestamp: new Date(order.timestamp || Date.now()),
        updatedAt: new Date(order.timestamp || Date.now()),
        timeInForce: 'GTC',
      }));
    } catch (error) {
      this.logger.error(`Failed to get orders: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get order history
   */
  async getOrderHistory(symbol?: string, limit?: number): Promise<ExchangeOrder[]> {
    try {
      const orders = await this.exchange.fetchClosedOrders(symbol, undefined, limit);
      
      return orders.map((order) => ({
        id: order.id,
        clientOrderId: order.clientOrderId,
        symbol: order.symbol,
        exchange: 'binance',
        side: order.side as 'buy' | 'sell',
        type: order.type as 'market' | 'limit' | 'stop' | 'stop_limit',
        quantity: order.amount,
        price: order.price || 0,
        status: order.status as 'pending' | 'open' | 'filled' | 'cancelled' | 'rejected',
        filledQuantity: order.filled || 0,
        remainingQuantity: order.remaining || 0,
        averagePrice: order.average || 0,
        timestamp: new Date(order.timestamp || Date.now()),
        updatedAt: new Date(order.timestamp || Date.now()),
        timeInForce: 'GTC',
      }));
    } catch (error) {
      this.logger.error(`Failed to get order history: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get balances (plural as per interface)
   */
  async getBalances(): Promise<ExchangeBalance[]> {
    try {
      const balance = await this.exchange.fetchBalance();
      
      return Object.keys(balance.total).map((currency) => ({
        currency,
        exchange: 'binance',
        available: balance.free[currency] || 0,
        locked: balance.used[currency] || 0,
        total: balance.total[currency] || 0,
        timestamp: new Date(),
      }));
    } catch (error) {
      this.logger.error(`Failed to get balances: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get trading fees with optional symbol
   */
  async getTradingFees(symbol?: string): Promise<TradingFees> {
    try {
      const fees = await this.exchange.fetchTradingFees();
      
      return {
        maker: fees.maker || 0.001,
        taker: fees.taker || 0.001,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get trading fees: ${error.message}`);
      throw error;
    }
  }

  /**
   * Subscribe to orders
   */
  async subscribeOrders(callback: (data: ExchangeOrder) => void): Promise<void> {
    this.logger.log('Order subscription not yet implemented');
  }

  /**
   * Subscribe to balances
   */
  async subscribeBalances(callback: (data: ExchangeBalance[]) => void): Promise<void> {
    this.logger.log('Balance subscription not yet implemented');
  }

  /**
   * Unsubscribe methods required by interface
   */
  async unsubscribeOrderBook(symbol: string): Promise<void> {
    this.subscriptions.delete(`orderbook_${symbol}`);
  }

  async unsubscribeTicker(symbol: string): Promise<void> {
    this.subscriptions.delete(`ticker_${symbol}`);
  }

  async unsubscribeTrades(symbol: string): Promise<void> {
    this.subscriptions.delete(`trades_${symbol}`);
  }

  async unsubscribeOrders(): Promise<void> {
    this.logger.log('Unsubscribing from orders');
  }

  async unsubscribeBalances(): Promise<void> {
    this.logger.log('Unsubscribing from balances');
  }

  async unsubscribeAll(): Promise<void> {
    this.subscriptions.clear();
    this.wsSubscriptions.clear();
  }