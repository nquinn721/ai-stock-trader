import { Injectable, Logger } from '@nestjs/common';
import {
  ExecutionResult,
  FairValueAdjustment,
  FairValueCalculation,
  HedgingAction,
  InventoryAction,
  MarketConditions,
  MarketMakingService,
  MarketMakingStrategy,
  OptimalQuotes,
  OptimalSpread,
  OrderBookDepth,
  Position,
  Quote,
  RiskExposure,
  RiskLimits,
} from '../interfaces/market-making.interface';

@Injectable()
export class MarketMakingServiceImpl implements MarketMakingService {
  private readonly logger = new Logger(MarketMakingServiceImpl.name);

  // Avellaneda-Stoikov model parameters
  private readonly RISK_AVERSION = 0.1;
  private readonly INVENTORY_PENALTY = 0.01;
  private readonly VOLATILITY_ADJUSTMENT = 1.5;

  async calculateOptimalSpread(
    symbol: string,
    market: MarketConditions,
  ): Promise<OptimalSpread> {
    try {
      this.logger.debug(`Calculating optimal spread for ${symbol}`);

      // Avellaneda-Stoikov optimal market making formula
      const baseSpread = this.calculateBaseSpread(market);
      const volatilityAdjustment = this.calculateVolatilityAdjustment(
        market.volatility,
      );
      const liquidityAdjustment = this.calculateLiquidityAdjustment(
        market.liquidity,
      );
      const momentumAdjustment = this.calculateMomentumAdjustment(
        market.momentum,
        market.trendDirection,
      );

      const optimalSpreadWidth =
        baseSpread *
        volatilityAdjustment *
        liquidityAdjustment *
        momentumAdjustment;

      const midPrice = market.marketDepth.midPrice;
      const halfSpread = optimalSpreadWidth / 2;

      const bidPrice = midPrice - halfSpread;
      const askPrice = midPrice + halfSpread;

      // Calculate optimal order sizes based on market depth and volatility
      const optimalBidSize = this.calculateOptimalOrderSize(market, 'BID');
      const optimalAskSize = this.calculateOptimalOrderSize(market, 'ASK');

      // Estimate expected profit and risk-adjusted return
      const expectedProfit = this.calculateExpectedProfit(
        optimalSpreadWidth,
        market,
      );
      const riskAdjustedReturn = this.calculateRiskAdjustedReturn(
        expectedProfit,
        market.volatility,
      );

      return {
        bidPrice,
        askPrice,
        spread: optimalSpreadWidth,
        confidence: this.calculateConfidence(market),
        expectedProfit,
        riskAdjustedReturn,
        optimalBidSize,
        optimalAskSize,
      };
    } catch (error) {
      this.logger.error(
        `Error calculating optimal spread for ${symbol}:`,
        error,
      );
      throw new Error(`Failed to calculate optimal spread: ${error.message}`);
    }
  }

  async manageInventory(
    position: Position,
    riskLimits: RiskLimits,
  ): Promise<InventoryAction> {
    try {
      this.logger.debug(`Managing inventory for ${position.symbol}`);

      const currentExposure = Math.abs(position.quantity);
      const maxExposure = riskLimits.maxPositionSize;
      const exposureRatio = currentExposure / maxExposure;

      // Determine urgency based on exposure and risk metrics
      let urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
      let action: 'HOLD' | 'REDUCE' | 'HEDGE' | 'LIQUIDATE' = 'HOLD';
      let quantity = 0;

      if (exposureRatio > 0.9) {
        urgency = 'CRITICAL';
        action = 'LIQUIDATE';
        quantity = Math.abs(position.quantity) * 0.5; // Liquidate 50% immediately
      } else if (exposureRatio > 0.7) {
        urgency = 'HIGH';
        action = 'REDUCE';
        quantity = Math.abs(position.quantity) * 0.3; // Reduce by 30%
      } else if (exposureRatio > 0.5) {
        urgency = 'MEDIUM';
        action = 'HEDGE';
        quantity = Math.abs(position.quantity) * 0.2; // Hedge 20%
      }

      // Calculate expected timeframe based on urgency and market conditions
      const expectedTimeframe = this.calculateInventoryTimeframe(
        urgency,
        position,
      );

      // Calculate risk reduction percentage
      const riskReduction = this.calculateRiskReduction(
        action,
        quantity,
        position,
      );

      return {
        action,
        quantity,
        urgency,
        strategy: this.getInventoryStrategy(action, exposureRatio),
        expectedTimeframe,
        riskReduction,
      };
    } catch (error) {
      this.logger.error(
        `Error managing inventory for ${position.symbol}:`,
        error,
      );
      throw new Error(`Failed to manage inventory: ${error.message}`);
    }
  }

  async calculateFairValue(
    symbol: string,
    venue: string,
  ): Promise<FairValueCalculation> {
    try {
      this.logger.debug(`Calculating fair value for ${symbol} on ${venue}`);

      // Implement multi-source fair value calculation
      const marketPrice = await this.getMarketPrice(symbol, venue);
      const fundamentalValue = await this.getFundamentalValue(symbol);
      const technicalValue = await this.getTechnicalValue(symbol);

      // Weight different valuation methods
      const weights = { market: 0.5, fundamental: 0.3, technical: 0.2 };

      const fairValue =
        marketPrice * weights.market +
        fundamentalValue * weights.fundamental +
        technicalValue * weights.technical;

      const adjustments: FairValueAdjustment[] = [
        {
          type: 'VOLUME',
          adjustment: this.getVolumeAdjustment(symbol),
          reasoning: 'Volume-based liquidity adjustment',
        },
        {
          type: 'VOLATILITY',
          adjustment: this.getVolatilityAdjustment(symbol),
          reasoning: 'Volatility risk premium adjustment',
        },
      ];

      return {
        fairValue,
        confidence: this.calculateFairValueConfidence(symbol),
        methodology: 'MULTI_SOURCE_WEIGHTED',
        dataQuality: this.assessDataQuality(symbol, venue),
        staleness: this.calculateDataStaleness(symbol, venue),
        adjustments,
      };
    } catch (error) {
      this.logger.error(`Error calculating fair value for ${symbol}:`, error);
      throw new Error(`Failed to calculate fair value: ${error.message}`);
    }
  }

  async optimizePriceQuotes(orderBook: OrderBookDepth): Promise<OptimalQuotes> {
    try {
      this.logger.debug('Optimizing price quotes based on order book');

      const midPrice = orderBook.midPrice;
      const bestBid = orderBook.bidLevels[0];
      const bestAsk = orderBook.askLevels[0];

      // Calculate optimal bid and ask prices considering queue position
      const optimalBidPrice = this.calculateOptimalBidPrice(orderBook);
      const optimalAskPrice = this.calculateOptimalAskPrice(orderBook);

      // Calculate optimal sizes based on market depth
      const optimalBidSize = this.calculateOptimalQuoteSize(orderBook, 'BID');
      const optimalAskSize = this.calculateOptimalQuoteSize(orderBook, 'ASK');

      const bid: Quote = {
        price: optimalBidPrice,
        size: optimalBidSize,
        venue: 'PRIMARY',
        orderType: 'LIMIT',
      };

      const ask: Quote = {
        price: optimalAskPrice,
        size: optimalAskSize,
        venue: 'PRIMARY',
        orderType: 'LIMIT',
      };

      const expectedProfitPerShare = (optimalAskPrice - optimalBidPrice) * 0.5; // Simplified
      const riskScore = this.calculateQuoteRiskScore(orderBook);
      const confidence = this.calculateQuoteConfidence(orderBook);

      return {
        bid,
        ask,
        confidence,
        expectedProfitPerShare,
        riskScore,
      };
    } catch (error) {
      this.logger.error('Error optimizing price quotes:', error);
      throw new Error(`Failed to optimize price quotes: ${error.message}`);
    }
  }

  async executeMarketMakingOrders(
    strategy: MarketMakingStrategy,
  ): Promise<ExecutionResult[]> {
    try {
      this.logger.debug(
        `Executing market making orders for strategy: ${strategy.name}`,
      );

      const results: ExecutionResult[] = [];

      for (const symbol of strategy.symbols) {
        // Get current market conditions
        const marketConditions = await this.getMarketConditions(symbol);

        // Calculate optimal spread for this symbol
        const optimalSpread = await this.calculateOptimalSpread(
          symbol,
          marketConditions,
        );

        // Execute bid order
        const bidResult = await this.executeLimitOrder({
          symbol,
          side: 'BUY',
          price: optimalSpread.bidPrice,
          quantity: optimalSpread.optimalBidSize,
          strategy: strategy.name,
        });

        // Execute ask order
        const askResult = await this.executeLimitOrder({
          symbol,
          side: 'SELL',
          price: optimalSpread.askPrice,
          quantity: optimalSpread.optimalAskSize,
          strategy: strategy.name,
        });

        results.push(bidResult, askResult);
      }

      return results;
    } catch (error) {
      this.logger.error(`Error executing market making orders:`, error);
      throw new Error(
        `Failed to execute market making orders: ${error.message}`,
      );
    }
  }

  async hedgePosition(exposure: RiskExposure): Promise<HedgingAction> {
    try {
      this.logger.debug(`Calculating hedging action for ${exposure.symbol}`);

      // Determine primary risk to hedge (delta, gamma, vega, etc.)
      const primaryRisk = this.identifyPrimaryRisk(exposure);

      let action: HedgingAction['action'];
      let instrument: string;
      let quantity: number;
      let priority: HedgingAction['priority'];

      switch (primaryRisk) {
        case 'DELTA':
          action = 'DELTA_HEDGE';
          instrument = exposure.symbol; // Hedge with underlying
          quantity = Math.abs(exposure.delta);
          priority = Math.abs(exposure.delta) > 1000 ? 'URGENT' : 'HIGH';
          break;

        case 'GAMMA':
          action = 'GAMMA_HEDGE';
          instrument = `${exposure.symbol}_OPTIONS`;
          quantity = Math.abs(exposure.gamma) / 100;
          priority = Math.abs(exposure.gamma) > 50 ? 'HIGH' : 'MEDIUM';
          break;

        case 'VEGA':
          action = 'VEGA_HEDGE';
          instrument = `${exposure.symbol}_OPTIONS`;
          quantity = Math.abs(exposure.vega) / 100;
          priority = Math.abs(exposure.vega) > 1000 ? 'HIGH' : 'MEDIUM';
          break;

        default:
          action = 'DELTA_HEDGE';
          instrument = exposure.symbol;
          quantity = Math.abs(exposure.totalExposure) * 0.5;
          priority = 'LOW';
      }

      const expectedCost = this.calculateHedgingCost(
        action,
        quantity,
        instrument,
      );
      const riskReduction = this.calculateHedgingRiskReduction(
        action,
        exposure,
      );

      return {
        action,
        instrument,
        quantity,
        expectedCost,
        riskReduction,
        priority,
      };
    } catch (error) {
      this.logger.error(`Error calculating hedging action:`, error);
      throw new Error(`Failed to calculate hedging action: ${error.message}`);
    }
  }

  // Private helper methods
  private calculateBaseSpread(market: MarketConditions): number {
    // Base spread calculation using bid-ask spread and volatility
    const minSpread = 0.001; // 10 basis points minimum
    const volAdjustment = market.volatility * this.VOLATILITY_ADJUSTMENT;
    return Math.max(minSpread, market.spread * (1 + volAdjustment));
  }

  private calculateVolatilityAdjustment(volatility: number): number {
    // Higher volatility requires wider spreads
    return 1 + volatility * this.RISK_AVERSION;
  }

  private calculateLiquidityAdjustment(liquidity: number): number {
    // Lower liquidity requires wider spreads
    return 1 + 1 / Math.max(0.1, liquidity);
  }

  private calculateMomentumAdjustment(
    momentum: number,
    direction: string,
  ): number {
    // Adjust spreads based on momentum
    const momentumFactor = Math.abs(momentum) * 0.1;
    return 1 + momentumFactor;
  }

  private calculateOptimalOrderSize(
    market: MarketConditions,
    side: 'BID' | 'ASK',
  ): number {
    const levels =
      side === 'BID'
        ? market.marketDepth.bidLevels
        : market.marketDepth.askLevels;
    const topLevel = levels[0];

    // Size based on top level quantity and market conditions
    const baseSize = topLevel ? topLevel.quantity * 0.1 : 100;
    const volatilityAdjustment = 1 - market.volatility * 0.5;

    return Math.max(10, Math.floor(baseSize * volatilityAdjustment));
  }

  private calculateExpectedProfit(
    spread: number,
    market: MarketConditions,
  ): number {
    // Expected profit based on spread and fill probability
    const fillProbability = this.calculateFillProbability(market);
    return spread * fillProbability * 0.5; // Expected profit per share
  }

  private calculateRiskAdjustedReturn(
    expectedProfit: number,
    volatility: number,
  ): number {
    // Sharpe-like ratio for expected return
    return expectedProfit / Math.max(0.01, volatility);
  }

  private calculateConfidence(market: MarketConditions): number {
    // Confidence based on data quality and market stability
    const volumeScore = Math.min(1, market.volume / 1000000);
    const liquidityScore = Math.min(1, market.liquidity);
    const stabilityScore = 1 - Math.min(1, market.volatility);

    return (volumeScore + liquidityScore + stabilityScore) / 3;
  }

  private calculateFillProbability(market: MarketConditions): number {
    // Probability of orders being filled based on market conditions
    const volumeScore = Math.min(1, market.volume / 500000);
    const liquidityScore = Math.min(1, market.liquidity);

    return (volumeScore + liquidityScore) / 2;
  }

  private calculateInventoryTimeframe(
    urgency: string,
    position: Position,
  ): number {
    // Expected time to manage inventory based on urgency
    switch (urgency) {
      case 'CRITICAL':
        return 5; // 5 minutes
      case 'HIGH':
        return 30; // 30 minutes
      case 'MEDIUM':
        return 120; // 2 hours
      default:
        return 480; // 8 hours
    }
  }

  private calculateRiskReduction(
    action: string,
    quantity: number,
    position: Position,
  ): number {
    const currentRisk = Math.abs(position.quantity) * position.averagePrice;
    const reductionAmount = quantity * position.averagePrice;
    return (reductionAmount / currentRisk) * 100;
  }

  private getInventoryStrategy(action: string, exposureRatio: number): string {
    if (action === 'LIQUIDATE') return 'EMERGENCY_LIQUIDATION';
    if (action === 'REDUCE') return 'GRADUAL_REDUCTION';
    if (action === 'HEDGE') return 'DELTA_HEDGE';
    return 'MONITOR_ONLY';
  }

  // Placeholder methods for external data sources
  private async getMarketPrice(symbol: string, venue: string): Promise<number> {
    // Implementation would fetch real market price
    return 100; // Placeholder
  }

  private async getFundamentalValue(symbol: string): Promise<number> {
    // Implementation would calculate fundamental value
    return 100; // Placeholder
  }

  private async getTechnicalValue(symbol: string): Promise<number> {
    // Implementation would calculate technical value
    return 100; // Placeholder
  }

  private getVolumeAdjustment(symbol: string): number {
    return 0; // Placeholder
  }

  private getVolatilityAdjustment(symbol: string): number {
    return 0; // Placeholder
  }

  private calculateFairValueConfidence(symbol: string): number {
    return 0.8; // Placeholder
  }

  private assessDataQuality(symbol: string, venue: string): number {
    return 0.9; // Placeholder
  }

  private calculateDataStaleness(symbol: string, venue: string): number {
    return 100; // Placeholder - 100ms
  }

  private calculateOptimalBidPrice(orderBook: OrderBookDepth): number {
    const bestBid = orderBook.bidLevels[0];
    return bestBid ? bestBid.price + 0.01 : orderBook.midPrice - 0.05;
  }

  private calculateOptimalAskPrice(orderBook: OrderBookDepth): number {
    const bestAsk = orderBook.askLevels[0];
    return bestAsk ? bestAsk.price - 0.01 : orderBook.midPrice + 0.05;
  }

  private calculateOptimalQuoteSize(
    orderBook: OrderBookDepth,
    side: 'BID' | 'ASK',
  ): number {
    const levels = side === 'BID' ? orderBook.bidLevels : orderBook.askLevels;
    const topLevel = levels[0];
    return topLevel ? Math.min(topLevel.quantity * 0.5, 1000) : 100;
  }

  private calculateQuoteRiskScore(orderBook: OrderBookDepth): number {
    const spread =
      orderBook.askLevels[0]?.price - orderBook.bidLevels[0]?.price;
    return Math.min(1, (spread || 0.1) / orderBook.midPrice);
  }

  private calculateQuoteConfidence(orderBook: OrderBookDepth): number {
    const depth = orderBook.bidLevels.length + orderBook.askLevels.length;
    return Math.min(1, depth / 20);
  }

  private async getMarketConditions(symbol: string): Promise<MarketConditions> {
    // Placeholder - would fetch real market conditions
    return {
      volatility: 0.2,
      volume: 1000000,
      spread: 0.05,
      liquidity: 0.8,
      trendDirection: 'SIDEWAYS',
      momentum: 0.1,
      marketDepth: {
        bidLevels: [{ price: 99.95, quantity: 1000, orders: 5 }],
        askLevels: [{ price: 100.05, quantity: 1000, orders: 5 }],
        midPrice: 100,
        weightedMidPrice: 100,
      },
    };
  }

  private async executeLimitOrder(order: any): Promise<ExecutionResult> {
    // Placeholder - would execute real order
    return {
      orderId: `ORDER_${Date.now()}`,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      price: order.price,
      status: 'PENDING',
      venue: 'PRIMARY',
      timestamp: new Date(),
      commission: order.quantity * order.price * 0.001,
      slippage: 0,
    };
  }

  private identifyPrimaryRisk(
    exposure: RiskExposure,
  ): 'DELTA' | 'GAMMA' | 'VEGA' | 'THETA' {
    const risks = {
      DELTA: Math.abs(exposure.delta),
      GAMMA: Math.abs(exposure.gamma),
      VEGA: Math.abs(exposure.vega),
      THETA: Math.abs(exposure.theta),
    };

    return Object.entries(risks).reduce((a, b) =>
      risks[a[0]] > risks[b[0]] ? a : b,
    )[0] as any;
  }

  private calculateHedgingCost(
    action: string,
    quantity: number,
    instrument: string,
  ): number {
    // Simplified hedging cost calculation
    const basePrice = 100; // Placeholder
    const commissionRate = 0.001;
    return quantity * basePrice * commissionRate;
  }

  private calculateHedgingRiskReduction(
    action: string,
    exposure: RiskExposure,
  ): number {
    // Simplified risk reduction calculation
    switch (action) {
      case 'DELTA_HEDGE':
        return Math.min(90, Math.abs(exposure.delta) / 10);
      case 'GAMMA_HEDGE':
        return Math.min(80, Math.abs(exposure.gamma) / 5);
      case 'VEGA_HEDGE':
        return Math.min(70, Math.abs(exposure.vega) / 100);
      default:
        return 50;
    }
  }
}
