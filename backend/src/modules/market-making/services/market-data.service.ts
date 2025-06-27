import { Injectable, Logger } from '@nestjs/common';
import {
  ImpactCurve,
  LiquidityGap,
  MarketDataAggregation,
  MarketDataProvider,
  MarketDataService,
  MarketDataSubscription,
  MarketDataUpdate,
  MarketDepthAnalytics,
  MarketImpact,
  OrderBookLevel,
  OrderBookSnapshot,
  PriceLevel,
} from '../interfaces/market-data.interface';

@Injectable()
export class MarketDataServiceImpl implements MarketDataService {
  private readonly logger = new Logger(MarketDataServiceImpl.name);

  private subscriptions = new Map<string, MarketDataSubscription>();
  private providers = new Map<string, MarketDataProvider>();
  private marketDataCache = new Map<string, MarketDataUpdate>();
  private orderBookCache = new Map<string, OrderBookSnapshot>();

  // Data subscription management
  async subscribe(
    subscription: Omit<
      MarketDataSubscription,
      'id' | 'createdAt' | 'lastUpdate'
    >,
  ): Promise<string> {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newSubscription: MarketDataSubscription = {
      id: subscriptionId,
      ...subscription,
      createdAt: new Date(),
      lastUpdate: new Date(),
    };

    this.subscriptions.set(subscriptionId, newSubscription);

    this.logger.log(
      `Created market data subscription ${subscriptionId} for ${subscription.symbol}`,
    );

    // Start data streaming for this subscription
    await this.startDataStream(newSubscription);

    return subscriptionId;
  }

  async unsubscribe(subscriptionId: string): Promise<boolean> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      return false;
    }

    subscription.isActive = false;
    this.subscriptions.delete(subscriptionId);

    this.logger.log(
      `Unsubscribed from market data subscription ${subscriptionId}`,
    );
    return true;
  }

  async getActiveSubscriptions(): Promise<MarketDataSubscription[]> {
    return Array.from(this.subscriptions.values()).filter(
      (sub) => sub.isActive,
    );
  }

  // Real-time data access
  async getCurrentMarketData(
    symbol: string,
    exchange?: string,
  ): Promise<MarketDataUpdate> {
    const cacheKey = exchange ? `${symbol}_${exchange}` : symbol;
    const cachedData = this.marketDataCache.get(cacheKey);

    if (cachedData && this.isDataFresh(cachedData.timestamp)) {
      return cachedData;
    }

    // Simulate fetching real-time data
    const marketData: MarketDataUpdate = {
      symbol,
      exchange: exchange || 'NASDAQ',
      timestamp: new Date(),
      bid: 150.0 + (Math.random() - 0.5) * 2,
      ask: 150.1 + (Math.random() - 0.5) * 2,
      last: 150.05 + (Math.random() - 0.5) * 2,
      volume: Math.floor(Math.random() * 1000000) + 100000,
      high: 151.0 + (Math.random() - 0.5) * 1,
      low: 149.0 + (Math.random() - 0.5) * 1,
      open: 150.0 + (Math.random() - 0.5) * 0.5,
      volatility: 0.15 + Math.random() * 0.2,
      vwap: 150.03 + (Math.random() - 0.5) * 1,
    };

    this.marketDataCache.set(cacheKey, marketData);
    return marketData;
  }

  async getOrderBook(
    symbol: string,
    exchange?: string,
    depth: number = 10,
  ): Promise<OrderBookSnapshot> {
    const cacheKey = exchange
      ? `${symbol}_${exchange}_orderbook`
      : `${symbol}_orderbook`;
    const cachedOrderBook = this.orderBookCache.get(cacheKey);

    if (cachedOrderBook && this.isDataFresh(cachedOrderBook.timestamp)) {
      return cachedOrderBook;
    }

    // Simulate fetching order book data
    const basePrice = 150.0;
    const bids: OrderBookLevel[] = [];
    const asks: OrderBookLevel[] = [];

    // Generate bid levels
    for (let i = 0; i < depth; i++) {
      bids.push({
        price: basePrice - (i + 1) * 0.01,
        size: Math.floor(Math.random() * 1000) + 100,
        orders: Math.floor(Math.random() * 10) + 1,
        venue: exchange || 'NASDAQ',
      });
    }

    // Generate ask levels
    for (let i = 0; i < depth; i++) {
      asks.push({
        price: basePrice + (i + 1) * 0.01,
        size: Math.floor(Math.random() * 1000) + 100,
        orders: Math.floor(Math.random() * 10) + 1,
        venue: exchange || 'NASDAQ',
      });
    }

    const orderBook: OrderBookSnapshot = {
      symbol,
      exchange: exchange || 'NASDAQ',
      timestamp: new Date(),
      bids: bids.sort((a, b) => b.price - a.price),
      asks: asks.sort((a, b) => a.price - b.price),
      sequence: Date.now(),
    };

    this.orderBookCache.set(cacheKey, orderBook);
    return orderBook;
  }

  async getAggregatedMarketData(
    symbol: string,
  ): Promise<MarketDataAggregation> {
    // Simulate aggregating data from multiple exchanges
    const exchanges = ['NASDAQ', 'NYSE', 'BATS', 'ARCA'];
    const marketDataList: MarketDataUpdate[] = [];

    for (const exchange of exchanges) {
      const data = await this.getCurrentMarketData(symbol, exchange);
      marketDataList.push(data);
    }

    // Find best bid and ask across exchanges
    const bestBid = Math.max(...marketDataList.map((d) => d.bid));
    const bestAsk = Math.min(...marketDataList.map((d) => d.ask));
    const bestBidExchange =
      marketDataList.find((d) => d.bid === bestBid)?.exchange || 'NASDAQ';
    const bestAskExchange =
      marketDataList.find((d) => d.ask === bestAsk)?.exchange || 'NASDAQ';

    // Calculate aggregated metrics
    const totalVolume = marketDataList.reduce((sum, d) => sum + d.volume, 0);
    const weightedPrice =
      marketDataList.reduce((sum, d) => sum + d.last * d.volume, 0) /
      totalVolume;

    return {
      symbol,
      consolidatedBid: bestBid,
      consolidatedAsk: bestAsk,
      consolidatedLast: weightedPrice,
      totalVolume,
      weightedPrice,
      bestBidExchange,
      bestAskExchange,
      exchanges,
      timestamp: new Date(),
      spread: bestAsk - bestBid,
      liquidityScore: this.calculateLiquidityScore(marketDataList),
    };
  }

  // Historical data access
  async getHistoricalData(
    symbol: string,
    fromDate: Date,
    toDate: Date,
    interval: string,
  ): Promise<MarketDataUpdate[]> {
    this.logger.log(
      `Fetching historical data for ${symbol} from ${fromDate} to ${toDate}`,
    );

    // Simulate historical data generation
    const data: MarketDataUpdate[] = [];
    const current = new Date(fromDate);
    const basePrice = 150.0;

    while (current <= toDate) {
      const randomWalk = (Math.random() - 0.5) * 2;
      const price = basePrice + randomWalk;

      data.push({
        symbol,
        exchange: 'NASDAQ',
        timestamp: new Date(current),
        bid: price - 0.05,
        ask: price + 0.05,
        last: price,
        volume: Math.floor(Math.random() * 100000) + 10000,
        high: price + Math.random() * 0.5,
        low: price - Math.random() * 0.5,
        open: price + (Math.random() - 0.5) * 0.2,
        volatility: 0.15 + Math.random() * 0.1,
      });

      // Move to next interval
      current.setMinutes(
        current.getMinutes() + this.getIntervalMinutes(interval),
      );
    }

    return data;
  }

  async getHistoricalOrderBook(
    symbol: string,
    timestamp: Date,
    exchange?: string,
  ): Promise<OrderBookSnapshot> {
    this.logger.log(
      `Fetching historical order book for ${symbol} at ${timestamp}`,
    );
    // This would typically fetch from a historical database
    return await this.getOrderBook(symbol, exchange);
  }

  // Market analytics
  async calculateVWAP(symbol: string, timeWindow: number): Promise<number> {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - timeWindow * 60 * 1000);

    const historicalData = await this.getHistoricalData(
      symbol,
      startTime,
      endTime,
      '1min',
    );

    const totalVolumeValue = historicalData.reduce(
      (sum, data) => sum + data.last * data.volume,
      0,
    );
    const totalVolume = historicalData.reduce(
      (sum, data) => sum + data.volume,
      0,
    );

    return totalVolume > 0 ? totalVolumeValue / totalVolume : 0;
  }

  async calculateVolatility(symbol: string, periods: number): Promise<number> {
    const endTime = new Date();
    const startTime = new Date(
      endTime.getTime() - periods * 24 * 60 * 60 * 1000,
    );

    const historicalData = await this.getHistoricalData(
      symbol,
      startTime,
      endTime,
      '1day',
    );

    if (historicalData.length < 2) return 0;

    const returns: number[] = [];
    for (let i = 1; i < historicalData.length; i++) {
      const returnValue = Math.log(
        historicalData[i].last / historicalData[i - 1].last,
      );
      returns.push(returnValue);
    }

    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance =
      returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
      returns.length;

    return Math.sqrt(variance * 252); // Annualized volatility
  }

  async getMarketDepthAnalytics(symbol: string): Promise<MarketDepthAnalytics> {
    const orderBook = await this.getOrderBook(symbol, undefined, 20);

    const totalBidVolume = orderBook.bids.reduce(
      (sum, level) => sum + level.size,
      0,
    );
    const totalAskVolume = orderBook.asks.reduce(
      (sum, level) => sum + level.size,
      0,
    );
    const imbalanceRatio = totalBidVolume / (totalBidVolume + totalAskVolume);

    // Identify support and resistance levels
    const supportLevels = this.identifyPriceLevels(orderBook.bids, 'support');
    const resistanceLevels = this.identifyPriceLevels(
      orderBook.asks,
      'resistance',
    );

    // Identify liquidity gaps
    const liquidityGaps = this.identifyLiquidityGaps(orderBook);

    // Calculate market impact
    const marketImpact = await this.calculateMarketImpact(symbol, orderBook);

    return {
      symbol,
      timestamp: orderBook.timestamp,
      totalBidVolume,
      totalAskVolume,
      imbalanceRatio,
      supportLevels,
      resistanceLevels,
      liquidityGaps,
      marketImpact,
    };
  }

  // Provider management
  async addDataProvider(provider: MarketDataProvider): Promise<boolean> {
    const providerId = `${provider.exchange}_${provider.symbol}`;
    this.providers.set(providerId, provider);
    this.logger.log(`Added market data provider: ${providerId}`);
    return true;
  }

  async removeDataProvider(providerId: string): Promise<boolean> {
    const removed = this.providers.delete(providerId);
    if (removed) {
      this.logger.log(`Removed market data provider: ${providerId}`);
    }
    return removed;
  }

  async getDataProviders(): Promise<MarketDataProvider[]> {
    return Array.from(this.providers.values());
  }

  async getProviderStatus(providerId: string): Promise<string> {
    const provider = this.providers.get(providerId);
    return provider?.connectionStatus || 'NOT_FOUND';
  }

  // Private helper methods
  private isDataFresh(timestamp: Date, maxAgeMs: number = 5000): boolean {
    return Date.now() - timestamp.getTime() < maxAgeMs;
  }

  private async startDataStream(
    subscription: MarketDataSubscription,
  ): Promise<void> {
    // Simulate starting a real-time data stream
    this.logger.log(`Starting data stream for subscription ${subscription.id}`);

    const interval = setInterval(async () => {
      if (!subscription.isActive) {
        clearInterval(interval);
        return;
      }

      try {
        const marketData = await this.getCurrentMarketData(subscription.symbol);
        subscription.callback(marketData);
        subscription.lastUpdate = new Date();
      } catch (error) {
        this.logger.error(
          `Error in data stream for ${subscription.symbol}:`,
          error,
        );
      }
    }, 1000); // Update every second
  }

  private calculateLiquidityScore(marketDataList: MarketDataUpdate[]): number {
    const totalVolume = marketDataList.reduce((sum, d) => sum + d.volume, 0);
    const averageSpread =
      marketDataList.reduce((sum, d) => sum + (d.ask - d.bid), 0) /
      marketDataList.length;

    // Simple liquidity score: higher volume and lower spread = higher score
    return Math.min(100, totalVolume / 10000 - averageSpread * 1000);
  }

  private getIntervalMinutes(interval: string): number {
    const intervalMap: { [key: string]: number } = {
      '1min': 1,
      '5min': 5,
      '15min': 15,
      '1hour': 60,
      '1day': 1440,
    };
    return intervalMap[interval] || 1;
  }

  private identifyPriceLevels(
    levels: OrderBookLevel[],
    type: 'support' | 'resistance',
  ): PriceLevel[] {
    // Identify significant price levels based on volume
    const significantLevels = levels
      .filter((level) => level.size > 500) // Threshold for significance
      .map((level) => ({
        price: level.price,
        volume: level.size,
        strength: level.size / 1000, // Normalize strength
      }))
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 5); // Top 5 levels

    return significantLevels;
  }

  private identifyLiquidityGaps(orderBook: OrderBookSnapshot): LiquidityGap[] {
    const gaps: LiquidityGap[] = [];
    const threshold = 100; // Minimum size threshold

    // Check bid side gaps
    for (let i = 0; i < orderBook.bids.length - 1; i++) {
      const currentLevel = orderBook.bids[i];
      const nextLevel = orderBook.bids[i + 1];

      if (currentLevel.size < threshold && nextLevel.size < threshold) {
        gaps.push({
          startPrice: nextLevel.price,
          endPrice: currentLevel.price,
          gapSize: currentLevel.price - nextLevel.price,
          direction: 'BID',
        });
      }
    }

    // Check ask side gaps
    for (let i = 0; i < orderBook.asks.length - 1; i++) {
      const currentLevel = orderBook.asks[i];
      const nextLevel = orderBook.asks[i + 1];

      if (currentLevel.size < threshold && nextLevel.size < threshold) {
        gaps.push({
          startPrice: currentLevel.price,
          endPrice: nextLevel.price,
          gapSize: nextLevel.price - currentLevel.price,
          direction: 'ASK',
        });
      }
    }

    return gaps;
  }

  private async calculateMarketImpact(
    symbol: string,
    orderBook: OrderBookSnapshot,
  ): Promise<MarketImpact> {
    const quantities = [100, 500, 1000, 5000, 10000];
    const buyImpact: ImpactCurve[] = [];
    const sellImpact: ImpactCurve[] = [];

    const midPrice = (orderBook.bids[0].price + orderBook.asks[0].price) / 2;

    for (const quantity of quantities) {
      // Calculate buy impact
      let remainingQty = quantity;
      let totalCost = 0;
      for (const askLevel of orderBook.asks) {
        if (remainingQty <= 0) break;

        const qtyAtLevel = Math.min(remainingQty, askLevel.size);
        totalCost += qtyAtLevel * askLevel.price;
        remainingQty -= qtyAtLevel;
      }

      const avgPrice = totalCost / quantity;
      buyImpact.push({
        quantity,
        priceImpact: (avgPrice - midPrice) / midPrice,
        cost: totalCost,
      });

      // Calculate sell impact
      remainingQty = quantity;
      totalCost = 0;
      for (const bidLevel of orderBook.bids) {
        if (remainingQty <= 0) break;

        const qtyAtLevel = Math.min(remainingQty, bidLevel.size);
        totalCost += qtyAtLevel * bidLevel.price;
        remainingQty -= qtyAtLevel;
      }

      const avgSellPrice = totalCost / quantity;
      sellImpact.push({
        quantity,
        priceImpact: (midPrice - avgSellPrice) / midPrice,
        cost: totalCost,
      });
    }

    return {
      symbol,
      buyImpact,
      sellImpact,
      averageSpread: orderBook.asks[0].price - orderBook.bids[0].price,
      liquidityScore: this.calculateOrderBookLiquidityScore(orderBook),
    };
  }

  private calculateOrderBookLiquidityScore(
    orderBook: OrderBookSnapshot,
  ): number {
    const bidVolume = orderBook.bids
      .slice(0, 5)
      .reduce((sum, level) => sum + level.size, 0);
    const askVolume = orderBook.asks
      .slice(0, 5)
      .reduce((sum, level) => sum + level.size, 0);
    const spread = orderBook.asks[0].price - orderBook.bids[0].price;

    // Higher volume and lower spread = higher liquidity score
    return Math.min(100, (bidVolume + askVolume) / 100 - spread * 1000);
  }
}
