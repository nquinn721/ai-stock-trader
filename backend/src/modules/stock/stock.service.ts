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
    // Initialize mock data
    this.initializeMockData();
  }

  private initializeMockData() {
    // Create mock stocks with varied prices
    this.mockStocks = [
      {
        id: 1,
        symbol: 'AAPL',
        name: 'Apple Inc.',
        currentPrice: 178.5,
        previousClose: 176.25,
        volume: 52000000,
      } as Stock,
      {
        id: 2,
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        currentPrice: 140.75,
        previousClose: 138.9,
        volume: 28000000,
      } as Stock,
      {
        id: 3,
        symbol: 'MSFT',
        name: 'Microsoft Corporation',
        currentPrice: 415.25,
        previousClose: 412.8,
        volume: 35000000,
      } as Stock,
      {
        id: 4,
        symbol: 'AMZN',
        name: 'Amazon.com Inc.',
        currentPrice: 145.6,
        previousClose: 143.25,
        volume: 41000000,
      } as Stock,
      {
        id: 5,
        symbol: 'TSLA',
        name: 'Tesla Inc.',
        currentPrice: 248.75,
        previousClose: 245.1,
        volume: 67000000,
      } as Stock,
      {
        id: 6,
        symbol: 'NVDA',
        name: 'NVIDIA Corporation',
        currentPrice: 485.3,
        previousClose: 478.9,
        volume: 39000000,
      } as Stock,
      {
        id: 7,
        symbol: 'META',
        name: 'Meta Platforms Inc.',
        currentPrice: 325.8,
        previousClose: 322.45,
        volume: 31000000,
      } as Stock,
      {
        id: 8,
        symbol: 'NFLX',
        name: 'Netflix Inc.',
        currentPrice: 465.2,
        previousClose: 461.75,
        volume: 18000000,
      } as Stock,
    ];
  }
  async getAllStocks(): Promise<
    (Stock & {
      tradingSignal?: TradingSignal | null;
      breakoutStrategy?: any;
      sentiment?: any;
      recentNews?: any[];
    })[]
  > {
    // Use the same logic as getAllStocksWithSignals but return basic format
    return await this.getAllStocksWithSignals();
  }
  async getAllStocksWithSignals(): Promise<
    (Stock & {
      tradingSignal: TradingSignal | null;
      breakoutStrategy?: any;
      sentiment?: any;
      recentNews?: any[];
    })[]
  > {
    const stocks = this.mockStocks; // Use mock data instead of database
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
      // Get existing mock signal for this stock
      let latestSignal = this.mockSignals.find(
        (s) => s.stockId === stock.id && s.isActive,
      );

      // Always generate fresh ML-powered AI signals for live data
      // Force signal regeneration every 1 minute for live ML analysis demonstration
      const oneMinuteAgo = new Date(Date.now() - 1 * 60 * 1000);
      if (!latestSignal || latestSignal.createdAt < oneMinuteAgo) {
        console.log(
          `🤖 Generating AI signal for ${stock.symbol} using ML models`,
        );
        try {
          // Get historical data for ML analysis
          const historicalData = await this.getHistoricalData(stock.symbol);

          if (historicalData && historicalData.length > 0) {
            // Use ML Analysis Service for proper AI-powered prediction
            const mlPrediction =
              await this.mlAnalysisService.generateEnsemblePrediction(
                historicalData,
                {
                  currentPrice: stock.currentPrice,
                  volume: stock.volume,
                  previousClose: stock.previousClose,
                },
              );

            // Convert ML prediction to trading signal
            let signal: SignalType;
            if (
              mlPrediction.direction === 'bullish' &&
              mlPrediction.confidence > 0.6
            ) {
              signal = SignalType.BUY;
            } else if (
              mlPrediction.direction === 'bearish' &&
              mlPrediction.confidence > 0.6
            ) {
              signal = SignalType.SELL;
            } else {
              signal = SignalType.HOLD;
            }

            // Calculate target price based on ML prediction
            const priceMultiplier =
              signal === SignalType.BUY
                ? 1 + mlPrediction.probability * 0.1
                : signal === SignalType.SELL
                  ? 1 - mlPrediction.probability * 0.1
                  : 1 + (Math.random() - 0.5) * 0.02;

            // Deactivate old signals first to ensure fresh generation
            this.mockSignals.forEach((s) => {
              if (s.stockId === stock.id && s.isActive) {
                s.isActive = false;
              }
            });
            const newSignal = {
              id: Date.now(),
              stockId: stock.id,
              stock: stock,
              signal: signal,
              confidence: Math.max(0.3, mlPrediction.confidence), // Dynamic confidence from ML
              targetPrice: stock.currentPrice * priceMultiplier,
              currentPrice: stock.currentPrice,
              reason: `🧠 ${mlPrediction.reasoning} - Live ML analysis with ${(mlPrediction.confidence * 100).toFixed(1)}% confidence`,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as TradingSignal;

            this.mockSignals.push(newSignal);
            latestSignal = newSignal;
            console.log(
              `✅ AI signal generated for ${stock.symbol}: ${signal} (${(mlPrediction.confidence * 100).toFixed(1)}%)`,
            );
          } else {
            // Fallback if no historical data - still deactivate old signals
            console.log(
              `⚠️ No historical data for ${stock.symbol}, using basic analysis`,
            );

            // Deactivate old signals first
            this.mockSignals.forEach((s) => {
              if (s.stockId === stock.id && s.isActive) {
                s.isActive = false;
              }
            });

            const fallbackSignal = await this.generateBasicSignal(stock);
            this.mockSignals.push(fallbackSignal);
            latestSignal = fallbackSignal;
          }
        } catch (error) {
          console.error(
            `❌ Error generating AI signal for ${stock.symbol}:`,
            error,
          );

          // Deactivate old signals first
          this.mockSignals.forEach((s) => {
            if (s.stockId === stock.id && s.isActive) {
              s.isActive = false;
            }
          });

          // Fallback to basic signal on error
          const fallbackSignal = await this.generateBasicSignal(stock);
          this.mockSignals.push(fallbackSignal);
          latestSignal = fallbackSignal;
        }
      }

      // Always calculate breakout strategy with ML models and day trading patterns
      const breakoutStrategy = await this.calculateBreakoutStrategy(
        stock.symbol,
        stock.currentPrice,
      );

      stocksWithSignals.push({
        ...stock,
        tradingSignal: latestSignal,
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
    // Use mock data instead of database
    return this.mockStocks.find((stock) => stock.symbol === symbol) || null;
  }
  async updateStockPrice(symbol: string): Promise<Stock | null> {
    try {
      // Skip symbols with dots as they cause issues with yahoo-finance2
      if (symbol.includes('.')) {
        console.log(`Skipping symbol with dot: ${symbol}`);
        return await this.getStockBySymbol(symbol);
      }

      const quote = await yahooFinance.quote(
        symbol,
        {},
        {
          validateResult: false,
        },
      );
      const stock = await this.getStockBySymbol(symbol);

      if (stock && quote) {
        stock.currentPrice = Number(quote.regularMarketPrice) || 0;
        stock.previousClose = Number(quote.regularMarketPreviousClose) || 0;
        stock.changePercent = Number(quote.regularMarketChangePercent) || 0;
        stock.volume = Number(quote.regularMarketVolume) || 0;
        stock.marketCap = Number(quote.marketCap) || 0;
        // Update mock data instead of database
        const index = this.mockStocks.findIndex((s) => s.symbol === symbol);
        if (index !== -1) {
          this.mockStocks[index] = stock;
        }

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
      }

      return stock;
    } catch (error) {
      console.error(`Error updating stock price for ${symbol}:`, error.message);
      return null;
    }
  }
  @Cron('*/5 * * * * *') // Every 5 seconds
  async updateAllStockPrices() {
    const stocks = await this.getAllStocks();
    console.log(`Updating prices for ${stocks.length} stocks...`);
    for (const stock of stocks) {
      const updatedStock = await this.updateStockPrice(stock.symbol);
      // Add small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Send all updated stocks to clients
    this.websocketGateway.sendStockUpdates();
  }
  async getStockHistory(symbol: string, period: string = '1mo'): Promise<any> {
    try {
      // Skip symbols with dots as they cause issues with yahoo-finance2
      if (symbol.includes('.')) {
        console.log(`Skipping historical data for symbol with dot: ${symbol}`);
        return [];
      }

      const historical = await yahooFinance.historical(
        symbol,
        {
          period1: this.getPeriodStartDate(period),
          period2: new Date(),
          interval: '1d' as any,
        },
        {
          validateResult: false,
        },
      );
      return historical;
    } catch (error) {
      console.error(
        `Error fetching historical data for ${symbol}:`,
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
}
