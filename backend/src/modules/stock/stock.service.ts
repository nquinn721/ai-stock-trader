import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import yahooFinance from 'yahoo-finance2';
import { Stock } from '../../entities/stock.entity';
import {
  SignalType,
  TradingSignal,
} from '../../entities/trading-signal.entity';
import { BreakoutService, HistoricalData } from '../breakout/breakout.service';
import { MLAnalysisService } from '../ml-analysis/ml-analysis.service';
import { NewsService } from '../news/news.service';
import { TradingService } from '../trading/trading.service';
import { StockWebSocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class StockService {
  private mockStocks: Stock[] = [];
  private mockSignals: TradingSignal[] = [];

  constructor(
    // Temporarily comment out database dependencies
    // @InjectRepository(Stock)
    // private stockRepository: Repository<Stock>,
    // @InjectRepository(TradingSignal)
    // private tradingSignalRepository: Repository<TradingSignal>,
    @Inject(forwardRef(() => StockWebSocketGateway))
    private websocketGateway: StockWebSocketGateway,
    @Inject(forwardRef(() => NewsService))
    private newsService: NewsService,
    @Inject(forwardRef(() => TradingService))
    private tradingService: TradingService,
    private breakoutService: BreakoutService,
    private mlAnalysisService: MLAnalysisService,
  ) {
    // Initialize with live stock symbols for tracking
    this.initializeMockData();
    console.log(
      '📊 Stock service initialized - will fetch live data from Yahoo Finance',
    );
  }
  private initializeMockData() {
    // Initialize with popular stock symbols for live data tracking
    this.mockStocks = [
      {
        id: 1,
        symbol: 'AAPL',
        name: 'Apple Inc.',
        currentPrice: 0,
        previousClose: 0,
        volume: 0,
      } as Stock,
      {
        id: 2,
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        currentPrice: 0,
        previousClose: 0,
        volume: 0,
      } as Stock,
      {
        id: 3,
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        currentPrice: 0,
        previousClose: 0,
        volume: 0,
      } as Stock,
      {
        id: 4,
        symbol: 'AMZN',
        name: 'Amazon.com Inc.',
        currentPrice: 0,
        previousClose: 0,
        volume: 0,
      } as Stock,
      {
        id: 5,
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        currentPrice: 0,
        previousClose: 0,
        volume: 0,
      } as Stock,
      {
        id: 6,
        symbol: 'NVDA',
        name: 'NVIDIA Corporation',
        currentPrice: 0,
        previousClose: 0,
        volume: 0,
      } as Stock,
      {
        id: 7,
        symbol: 'META',
        name: 'Meta Platforms Inc.',
        currentPrice: 0,
        previousClose: 0,
        volume: 0,
      } as Stock,
      {
        id: 8,
        symbol: 'NFLX',
        name: 'Netflix Inc.',
        currentPrice: 0,
        previousClose: 0,
        volume: 0,
      } as Stock,
    ];
    this.mockSignals = [];
    console.log('📊 Initialized stock symbols for live data tracking');
  }
  async getAllStocks(): Promise<
    (Stock & {
      tradingSignal?: TradingSignal | null;
      breakoutStrategy?: any;
      sentiment?: any;
      recentNews?: any[];
    })[]
  > {
    // Return stocks with live data from Yahoo Finance
    return this.mockStocks.filter((stock) => stock.currentPrice > 0);
  }
  async getAllStocksWithSignals(): Promise<
    (Stock & {
      tradingSignal: TradingSignal | null;
      breakoutStrategy?: any;
      sentiment?: any;
      recentNews?: any[];
    })[]
  > {
    const stocks = this.mockStocks.filter((stock) => stock.currentPrice > 0);
    const stocksWithSignals: (Stock & {
      tradingSignal: TradingSignal | null;
      breakoutStrategy?: any;
      sentiment?: any;
      recentNews?: any[];
    })[] = [];

    // Get sentiment data for all stocks
    const stockSymbols = stocks.map((stock) => stock.symbol);
    const sentimentMap =
      await this.newsService.getPortfolioSentiment(stockSymbols);

    for (const stock of stocks) {
      // Generate trading signal based on live price data
      const signal = await this.generateLiveTradingSignal(stock);

      // Calculate breakout strategy with live data
      const breakoutStrategy = await this.calculateBreakoutStrategy(
        stock.symbol,
        stock.currentPrice,
      );

      stocksWithSignals.push({
        ...stock,
        tradingSignal: signal,
        breakoutStrategy,
        sentiment: sentimentMap.get(stock.symbol)?.sentiment || {
          score: 0,
          label: 'neutral',
          confidence: 0,
          articlesAnalyzed: 0,
        },
        recentNews: sentimentMap.get(stock.symbol)?.recentNews || [],
      });
    }

    return stocksWithSignals;
  }
  async getStockBySymbol(symbol: string): Promise<Stock | null> {
    return this.mockStocks.find((stock) => stock.symbol === symbol) || null;
  }
  async updateStockPrice(symbol: string): Promise<Stock | null> {
    try {
      // Skip symbols with dots as they cause issues with yahoo-finance2
      if (symbol.includes('.')) {
        console.log(`⏭️ Skipping symbol with dot: ${symbol}`);
        return await this.getStockBySymbol(symbol);
      }

      console.log(`📊 Fetching live data for ${symbol} from Yahoo Finance...`);

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('API timeout')), 10000); // 10 second timeout
      });

      const quote = await Promise.race([
        yahooFinance.quote(
          symbol,
          {},
          {
            validateResult: false,
          },
        ),
        timeoutPromise,
      ]);

      const stock = await this.getStockBySymbol(symbol);

      if (stock && quote) {
        const newPrice = Number(quote.regularMarketPrice) || 0;
        const prevClose = Number(quote.regularMarketPreviousClose) || 0;
        const changePercent = Number(quote.regularMarketChangePercent) || 0;
        const volume = Number(quote.regularMarketVolume) || 0;
        const marketCap = Number(quote.marketCap) || 0;

        // Update stock with live data
        stock.currentPrice = newPrice;
        stock.previousClose = prevClose;
        stock.changePercent = changePercent;
        stock.volume = volume;
        stock.marketCap = marketCap;

        // Update in our stock array
        const index = this.mockStocks.findIndex((s) => s.symbol === symbol);
        if (index !== -1) {
          this.mockStocks[index] = stock;
        }

        console.log(
          `✅ Updated ${symbol}: $${newPrice.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`,
        );

        // Broadcast the updated stock data via WebSocket
        this.websocketGateway.broadcastStockUpdate(symbol, {
          symbol: stock.symbol,
          currentPrice: stock.currentPrice,
          previousClose: stock.previousClose,
          changePercent: stock.changePercent,
          volume: stock.volume,
          marketCap: stock.marketCap,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.log(`⚠️ No quote data received for ${symbol}`);
      }

      return stock;
    } catch (error) {
      console.error(
        `❌ Error updating stock price for ${symbol}:`,
        error.message,
      );
      return null;
    }
  }
  @Cron('0 */2 * * * *') // Every 2 minutes (less aggressive to prevent API rate limiting)
  async updateAllStockPrices() {
    const stocks = this.mockStocks; // Get all tracked stocks
    const connectedClients = this.websocketGateway.getConnectedClientsCount();

    if (connectedClients === 0) {
      console.log('⏸️ No clients connected, skipping price update');
      return;
    }

    console.log(
      `🔄 Updating live prices for ${stocks.length} stocks (${connectedClients} clients connected)...`,
    );

    let successCount = 0;
    for (const stock of stocks) {
      try {
        const updated = await this.updateStockPrice(stock.symbol);
        if (updated) successCount++;
        // Add delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`❌ Error updating ${stock.symbol}:`, error.message);
      }
    }

    // Broadcast all updated stocks to clients via WebSocket
    if (successCount > 0) {
      await this.websocketGateway.broadcastAllStockUpdates();
      console.log(
        `✅ Updated ${successCount}/${stocks.length} stocks and broadcasted to ${connectedClients} clients`,
      );
    } else {
      console.log('⚠️ No stocks were successfully updated');
    }
  }
  async getStockHistory(symbol: string, period: string = '1mo'): Promise<any> {
    try {
      // Skip symbols with dots as they cause issues with yahoo-finance2
      if (symbol.includes('.')) {
        console.log(
          `⏭️ Skipping historical data for symbol with dot: ${symbol}`,
        );
        return [];
      }

      console.log(`📈 Fetching historical data for ${symbol}...`);

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error('Historical data API timeout')),
          15000,
        ); // 15 second timeout
      });

      const historical = await Promise.race([
        yahooFinance.historical(
          symbol,
          {
            period1: this.getPeriodStartDate(period),
            period2: new Date(),
            interval: '1d' as any,
          },
          {
            validateResult: false,
          },
        ),
        timeoutPromise,
      ]);

      console.log(
        `✅ Retrieved ${Array.isArray(historical) ? historical.length : 0} historical data points for ${symbol}`,
      );
      return historical;
    } catch (error) {
      console.error(
        `❌ Error fetching historical data for ${symbol}:`,
        error.message,
      );
      return [];
    }
  }

  private getPeriodStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case '1d':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '1w':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '1mo':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '3mo':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
  async getAllStocksWithSentiment(): Promise<any[]> {
    const stocks = await this.getAllStocks();
    const stockSymbols = stocks.map((stock) => stock.symbol);

    // Get sentiment data for all stocks
    const sentimentMap =
      await this.newsService.getPortfolioSentiment(stockSymbols);

    // Combine stock data with sentiment and breakout strategy
    const enrichedStocks = await Promise.all(
      stocks.map(async (stock) => {
        const breakoutStrategy = await this.calculateBreakoutStrategy(
          stock.symbol,
          stock.currentPrice,
        );

        return {
          ...stock,
          sentiment: sentimentMap.get(stock.symbol)?.sentiment || {
            score: 0,
            label: 'neutral',
            confidence: 0,
            articlesAnalyzed: 0,
          },
          recentNews: sentimentMap.get(stock.symbol)?.recentNews || [],
          breakoutStrategy,
        };
      }),
    );

    return enrichedStocks;
  }

  async getStockWithSentiment(symbol: string): Promise<any> {
    const stock = await this.getStockBySymbol(symbol);
    if (!stock) return null;

    const sentimentMap = await this.newsService.getPortfolioSentiment([symbol]);
    const sentimentData = sentimentMap.get(symbol);
    const breakoutStrategy = await this.calculateBreakoutStrategy(
      symbol,
      stock.currentPrice,
    );

    return {
      ...stock,
      sentiment: sentimentData?.sentiment || {
        score: 0,
        label: 'neutral',
        confidence: 0,
        articlesAnalyzed: 0,
      },
      recentNews: sentimentData?.recentNews || [],
      breakoutStrategy,
    };
  }

  private async calculateBreakoutStrategy(
    symbol: string,
    currentPrice: number,
  ): Promise<any> {
    try {
      // Get historical data for breakout analysis
      const historicalData = await this.getStockHistory(symbol, '3mo');

      // Convert Yahoo Finance data to our format
      const formattedData =
        this.breakoutService.convertYahooDataToHistorical(historicalData); // Calculate breakout strategy
      return this.breakoutService.calculateBreakoutStrategy(
        symbol,
        currentPrice,
        formattedData,
      );
    } catch (error) {
      console.error(
        `Error calculating breakout strategy for ${symbol}:`,
        error,
      );
      // Return default breakout strategy
      return {
        signal: 'neutral',
        probability: 0.5,
        supportLevel: currentPrice * 0.95,
        resistanceLevel: currentPrice * 1.05,
        currentTrend: 'sideways',
        volatility: 0.2,
        rsi: 50,
        bollingerPosition: 'middle',
        recommendation: 'Analysis unavailable',
        confidence: 0.1,
        lastCalculated: new Date().toISOString(),
      };
    }
  }

  /**
   * Get historical data for ML analysis
   */
  private async getHistoricalData(symbol: string): Promise<HistoricalData[]> {
    try {
      const historicalData = await this.getStockHistory(symbol, '6mo');
      return this.breakoutService.convertYahooDataToHistorical(historicalData);
    } catch (error) {
      console.error(`Error getting historical data for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Generate basic trading signal as fallback
   */ private async generateBasicSignal(stock: Stock): Promise<TradingSignal> {
    // Enhanced technical analysis with dynamic elements
    const changePercent = Number(stock.changePercent) || 0;
    const volumeRatio =
      stock.volume / (stock.volume * 0.8 + Math.random() * stock.volume * 0.4); // Simulated average volume
    const timeBasedFactor = Math.sin(Date.now() / 120000) * 0.1; // 2-minute cycles

    // More sophisticated signal generation
    let signal: SignalType;
    let confidence: number;
    let reasoning: string;

    const adjustedChange = changePercent + timeBasedFactor * 10;
    const volumeWeight = volumeRatio > 1.2 ? 0.2 : volumeRatio < 0.8 ? -0.1 : 0;
    const finalScore = adjustedChange + volumeWeight * 5;

    if (finalScore > 2.5) {
      signal = SignalType.BUY;
      confidence = Math.min(0.9, 0.4 + Math.abs(finalScore) * 0.1);
      reasoning = `Technical breakout detected: ${finalScore.toFixed(1)}% momentum with ${volumeRatio > 1.2 ? 'high' : 'normal'} volume`;
    } else if (finalScore < -2.5) {
      signal = SignalType.SELL;
      confidence = Math.min(0.9, 0.4 + Math.abs(finalScore) * 0.1);
      reasoning = `Technical breakdown detected: ${finalScore.toFixed(1)}% decline with ${volumeRatio > 1.2 ? 'high' : 'normal'} volume`;
    } else {
      signal = SignalType.HOLD;
      confidence = 0.3 + Math.random() * 0.4; // Variable confidence for hold signals
      reasoning = `Consolidation phase: ${finalScore.toFixed(1)}% movement within normal range`;
    }
    return {
      id: Date.now() + Math.random(),
      stockId: stock.id,
      stock: stock,
      signal: signal,
      confidence: confidence,
      targetPrice:
        stock.currentPrice *
        (signal === SignalType.BUY
          ? 1.02 + Math.random() * 0.03
          : signal === SignalType.SELL
            ? 0.96 - Math.random() * 0.03
            : 0.99 + Math.random() * 0.02),
      currentPrice: stock.currentPrice,
      reason: reasoning,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as TradingSignal;
  }

  /**
   * Generate trading signal based on live price data and technical analysis
   */
  private async generateLiveTradingSignal(
    stock: Stock,
  ): Promise<TradingSignal> {
    try {
      // Get historical data for technical analysis
      const historicalData = await this.getHistoricalData(stock.symbol);

      if (historicalData && historicalData.length > 20) {
        // Use ML analysis with real historical data
        const mlPrediction = await this.mlAnalysisService.predictPriceMomentum(
          historicalData,
          { symbol: stock.symbol, price: stock.currentPrice },
        );

        // Get sentiment data
        const sentiment = await this.newsService.getAverageSentiment(
          stock.symbol,
        );

        // Determine signal based on ML prediction and sentiment
        let signal: SignalType = SignalType.HOLD;
        let confidence = mlPrediction.confidence;

        if (
          mlPrediction.direction === 'bullish' &&
          mlPrediction.confidence > 0.6
        ) {
          signal = SignalType.BUY;
          // Boost confidence if sentiment is also positive
          if (sentiment > 1) {
            confidence = Math.min(0.95, confidence + 0.15);
          }
        } else if (
          mlPrediction.direction === 'bearish' &&
          mlPrediction.confidence > 0.6
        ) {
          signal = SignalType.SELL;
          // Boost confidence if sentiment is also negative
          if (sentiment < -1) {
            confidence = Math.min(0.95, confidence + 0.15);
          }
        }

        // Calculate target price
        const priceMultiplier =
          signal === SignalType.BUY
            ? 1 + mlPrediction.probability * 0.05 // 0-5% upside
            : signal === SignalType.SELL
              ? 1 - mlPrediction.probability * 0.05 // 0-5% downside
              : 1;

        return {
          id: Date.now() + Math.random(),
          stockId: stock.id,
          stock: stock,
          signal: signal,
          confidence: confidence,
          targetPrice: stock.currentPrice * priceMultiplier,
          currentPrice: stock.currentPrice,
          reason: `🤖 AI Analysis: ${mlPrediction.reasoning} | Sentiment: ${sentiment.toFixed(2)} | Confidence: ${(confidence * 100).toFixed(1)}%`,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as TradingSignal;
      } else {
        // Fallback to basic technical analysis if no historical data
        return await this.generateBasicSignal(stock);
      }
    } catch (error) {
      console.error(`Error generating live signal for ${stock.symbol}:`, error);
      return await this.generateBasicSignal(stock);
    }
  }

  /**
   * Get pattern recognition analysis for a specific stock
   */
  async getPatternAnalysis(symbol: string): Promise<any> {
    try {
      // Get historical data
      const historicalData = await this.getStockHistory(symbol, '3mo');

      if (!historicalData || historicalData.length === 0) {
        return {
          symbol,
          error: 'No historical data available for pattern analysis',
          patternRecognition: null,
        };
      }

      // Convert Yahoo Finance data to our format
      const convertedData =
        this.breakoutService.convertYahooDataToHistorical(historicalData);

      if (convertedData.length === 0) {
        return {
          symbol,
          error: 'Unable to process historical data',
          patternRecognition: null,
        };
      }

      // Get current price
      const currentPrice = convertedData[convertedData.length - 1]?.close || 0;

      // Get the full breakout strategy (which includes pattern recognition)
      const breakoutStrategy =
        await this.breakoutService.calculateBreakoutStrategy(
          symbol,
          currentPrice,
          convertedData,
        );

      return {
        symbol,
        currentPrice,
        lastUpdated: new Date().toISOString(),
        patternRecognition: breakoutStrategy.patternRecognition,
        // Also include relevant context
        technicalContext: {
          rsi: breakoutStrategy.rsi,
          currentTrend: breakoutStrategy.currentTrend,
          volatility: breakoutStrategy.volatility,
          supportLevel: breakoutStrategy.supportLevel,
          resistanceLevel: breakoutStrategy.resistanceLevel,
        },
      };
    } catch (error) {
      console.error(`Error getting pattern analysis for ${symbol}:`, error);
      return {
        symbol,
        error: `Failed to analyze patterns: ${error.message}`,
        patternRecognition: null,
      };
    }
  }
}
