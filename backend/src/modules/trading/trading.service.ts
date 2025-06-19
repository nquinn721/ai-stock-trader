import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TradingSignal, SignalType } from '../../entities/trading-signal.entity';
import { Stock } from '../../entities/stock.entity';
import { StockPrice } from '../../entities/stock-price.entity';
import { NewsService } from '../news/news.service';

@Injectable()
export class TradingService {
  constructor(
    @InjectRepository(TradingSignal)
    private tradingSignalRepository: Repository<TradingSignal>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    @InjectRepository(StockPrice)
    private stockPriceRepository: Repository<StockPrice>,
    private newsService: NewsService,
  ) {}

  async detectBreakout(symbol: string): Promise<{ isBreakout: boolean; signal: SignalType; confidence: number; reason: string }> {
    const stock = await this.stockRepository.findOne({ where: { symbol } });
    if (!stock) {
      throw new Error(`Stock ${symbol} not found`);
    }

    // Get recent price data
    const recentPrices = await this.stockPriceRepository.find({
      where: { stockId: stock.id },
      order: { date: 'DESC' },
      take: 20, // Last 20 days
    });

    if (recentPrices.length < 10) {
      return { isBreakout: false, signal: SignalType.HOLD, confidence: 0, reason: 'Insufficient data' };
    }

    const prices = recentPrices.reverse(); // Oldest first
    const currentPrice = prices[prices.length - 1].close;
    
    // Calculate moving averages
    const sma10 = this.calculateSMA(prices.slice(-10), 'close');
    const sma20 = this.calculateSMA(prices, 'close');
    
    // Calculate RSI
    const rsi = this.calculateRSI(prices, 14);
    
    // Calculate volume average
    const avgVolume = this.calculateSMA(prices.slice(-10), 'volume');
    const currentVolume = prices[prices.length - 1].volume;
    
    // Get sentiment
    const sentiment = await this.newsService.getAverageSentiment(symbol, 7);
    
    // Breakout detection logic
    let signal = SignalType.HOLD;
    let confidence = 0;
    let reason = '';
    let isBreakout = false;

    // Bullish breakout conditions
    if (
      currentPrice > sma10 && 
      sma10 > sma20 && 
      currentVolume > avgVolume * 1.5 && 
      rsi < 70 &&
      sentiment > 0.1
    ) {
      signal = SignalType.BUY;
      confidence = Math.min(0.9, 0.5 + (sentiment * 0.2) + ((currentVolume / avgVolume - 1) * 0.2));
      reason = 'Bullish breakout detected: price above moving averages with high volume and positive sentiment';
      isBreakout = true;
    }
    // Bearish breakout conditions
    else if (
      currentPrice < sma10 && 
      sma10 < sma20 && 
      currentVolume > avgVolume * 1.3 && 
      rsi > 30 &&
      sentiment < -0.1
    ) {
      signal = SignalType.SELL;
      confidence = Math.min(0.9, 0.5 + (Math.abs(sentiment) * 0.2) + ((currentVolume / avgVolume - 1) * 0.2));
      reason = 'Bearish breakout detected: price below moving averages with high volume and negative sentiment';
      isBreakout = true;
    }
    // Consolidation/Hold conditions
    else {
      confidence = 0.3;
      reason = 'No clear breakout pattern detected, market consolidating';
    }

    return { isBreakout, signal, confidence, reason };
  }

  private calculateSMA(prices: any[], field: string): number {
    const sum = prices.reduce((acc, price) => acc + Number(price[field]), 0);
    return sum / prices.length;
  }

  private calculateRSI(prices: any[], period: number): number {
    if (prices.length < period + 1) return 50; // Default neutral RSI

    const gains: number[] = [];
    const losses: number[] = [];

    for (let i = 1; i < prices.length; i++) {
      const change = Number(prices[i].close) - Number(prices[i - 1].close);
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  async generateTradingSignal(symbol: string): Promise<TradingSignal> {
    const stock = await this.stockRepository.findOne({ where: { symbol } });
    if (!stock) {
      throw new Error(`Stock ${symbol} not found`);
    }

    const analysis = await this.detectBreakout(symbol);
    
    // Calculate target price based on signal
    let targetPrice = stock.currentPrice;
    if (analysis.signal === SignalType.BUY) {
      targetPrice = stock.currentPrice * 1.05; // 5% upside target
    } else if (analysis.signal === SignalType.SELL) {
      targetPrice = stock.currentPrice * 0.95; // 5% downside target
    }

    // Deactivate previous signals for this stock
    await this.tradingSignalRepository.update(
      { stockId: stock.id, isActive: true },
      { isActive: false }
    );

    const tradingSignal = this.tradingSignalRepository.create({
      stockId: stock.id,
      signal: analysis.signal,
      confidence: analysis.confidence,
      targetPrice,
      currentPrice: stock.currentPrice,
      reason: analysis.reason,
      isActive: true,
    });

    return await this.tradingSignalRepository.save(tradingSignal);
  }

  async getActiveSignals(): Promise<TradingSignal[]> {
    return await this.tradingSignalRepository.find({
      where: { isActive: true },
      relations: ['stock'],
      order: { createdAt: 'DESC' },
    });
  }

  async getSignalsForStock(symbol: string, limit: number = 10): Promise<TradingSignal[]> {
    const stock = await this.stockRepository.findOne({ where: { symbol } });
    if (!stock) {
      throw new Error(`Stock ${symbol} not found`);
    }

    return await this.tradingSignalRepository.find({
      where: { stockId: stock.id },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async analyzeAllStocks(): Promise<TradingSignal[]> {
    const stocks = await this.stockRepository.find();
    const signals: TradingSignal[] = [];

    for (const stock of stocks) {
      try {
        const signal = await this.generateTradingSignal(stock.symbol);
        signals.push(signal);
      } catch (error) {
        console.error(`Error analyzing ${stock.symbol}:`, error);
      }
    }

    return signals;
  }
}
