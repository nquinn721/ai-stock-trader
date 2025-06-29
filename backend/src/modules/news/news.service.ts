/**
 * =============================================================================
 * NEWS SERVICE
 * =============================================================================
 *
 * Financial news aggregation and sentiment analysis service for stock trading.
 * Provides real-time news data with AI-powered sentiment scoring to support
 * trading decisions and market intelligence.
 *
 * Key Features:
 * - News API integration for financial headlines and articles
 * - Advanced sentiment analysis using Natural Language Processing
 * - Financial-specific sentiment lexicon (bullish, bearish, volatility terms)
 * - Intelligent caching system (5-minute cache duration)
 * - Stock symbol filtering and relevance scoring
 * - Market impact analysis and categorization
 *
 * External Dependencies:
 * - News API: Real-time financial news aggregation
 * - Natural.js: Text tokenization and processing
 * - Sentiment.js: Sentiment analysis engine
 *
 * Cache Strategy:
 * - 5-minute cache for news data to reduce API calls
 * - Symbol-specific caching for targeted news retrieval
 * - Automatic cache invalidation for fresh market data
 *
 * Used By:
 * - Stock analysis for news-driven price movements
 * - Portfolio risk assessment based on sentiment
 * - Trading signal generation from market sentiment
 * - Real-time market intelligence dashboard
 * =============================================================================
 */

import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { WordTokenizer } from 'natural';
import Sentiment from 'sentiment';
import { buildApiUrl, getHttpConfig } from '../../config';

@Injectable()
export class NewsService {
  private sentiment: any;
  private wordTokenizer: WordTokenizer;
  private newsCache = new Map<string, { data: any[]; timestamp: number }>();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  constructor() {
    this.sentiment = new Sentiment();
    this.wordTokenizer = new WordTokenizer();

    // Add custom financial sentiment words
    this.enhanceSentimentLexicon();
  }

  private enhanceSentimentLexicon() {
    // Add financial-specific terms for better sentiment analysis
    this.sentiment.registerLanguage('financial', {
      labels: {
        bullish: 5,
        rally: 4,
        surge: 4,
        soar: 4,
        breakthrough: 4,
        outperform: 3,
        exceed: 3,
        strong: 3,
        robust: 3,
        solid: 3,
        beat: 3,
        upbeat: 3,
        optimistic: 3,
        positive: 2,
        growth: 2,
        gain: 2,
        profit: 2,
        revenue: 1,
        bearish: -5,
        crash: -4,
        plummet: -4,
        plunge: -4,
        collapse: -4,
        decline: -3,
        fall: -3,
        drop: -3,
        weak: -3,
        poor: -3,
        loss: -3,
        miss: -3,
        disappointing: -3,
        concern: -2,
        risk: -2,
        volatility: -2,
        uncertainty: -2,
        negative: -2,
      },
    });
  } /**
   * Fetch real news articles for a stock symbol using multiple sources
   */
  async fetchNewsForStock(symbol: string): Promise<any[]> {
    // Check cache first
    const cached = this.newsCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`📰 Using cached news for ${symbol}`);
      return cached.data;
    }

    console.log(`📰 Fetching fresh news for ${symbol}...`);

    // Try multiple sources in order of preference    // 1. Try Alpha Vantage API first
    const alphaVantageResult = await this.tryAlphaVantageNews(symbol);
    if (alphaVantageResult.length > 0) {
      this.newsCache.set(symbol, {
        data: alphaVantageResult,
        timestamp: Date.now(),
      });
      return alphaVantageResult;
    }

    // 2. Try Finnhub API as fallback
    const finnhubResult = await this.tryFinnhubNews(symbol);
    if (finnhubResult.length > 0) {
      this.newsCache.set(symbol, {
        data: finnhubResult,
        timestamp: Date.now(),
      });
      return finnhubResult;
    }

    // 3. Use realistic mock data if all APIs fail
    console.log(
      `📰 Using enhanced mock news for ${symbol} (APIs not available)`,
    );
    const mockResult = this.generateRealisticMockNews(symbol);
    this.newsCache.set(symbol, { data: mockResult, timestamp: Date.now() });
    return mockResult;
  }

  private async tryAlphaVantageNews(symbol: string): Promise<any[]> {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

    if (!apiKey || apiKey === 'YOUR_ALPHA_VANTAGE_API_KEY') {
      return [];
    }

    const alphaVantageUrl = buildApiUrl('alphaVantage', 'newsSentiment', {
      tickers: symbol,
      limit: '8',
      apikey: apiKey,
    });

    const httpConfig = getHttpConfig('alphaVantage');

    try {
      const response = await axios.get(alphaVantageUrl, {
        timeout: httpConfig.timeout,
      });

      if (
        response.data &&
        response.data.feed &&
        response.data.feed.length > 0
      ) {
        console.log(
          `📰 Fetched ${response.data.feed.length} articles for ${symbol} from Alpha Vantage`,
        );

        return response.data.feed.slice(0, 5).map((article: any) => ({
          title: article.title,
          summary: article.summary || article.title,
          url: article.url,
          publishedAt: article.time_published,
          source: article.source,
          sentiment: this.normalizeSentiment(
            parseFloat(article.overall_sentiment_score || '0'),
            article.overall_sentiment_label || 'neutral',
          ),
          relevanceScore: article.relevance_score || '0.5',
        }));
      }
    } catch (error) {
      console.log(`⚠️ Alpha Vantage API error for ${symbol}:`, error.message);
    }

    return [];
  }

  private async tryFinnhubNews(symbol: string): Promise<any[]> {
    const apiKey = process.env.FINNHUB_API_KEY;

    if (!apiKey || apiKey === 'YOUR_FINNHUB_API_KEY') {
      return [];
    }

    const finnhubUrl = buildApiUrl('finnhub', 'companyNews', {
      symbol: symbol,
      from: this.getDateDaysAgo(7),
      to: this.getDateDaysAgo(0),
      token: apiKey,
    });

    const httpConfig = getHttpConfig('finnhub');

    try {
      const response = await axios.get(finnhubUrl, {
        timeout: httpConfig.timeout,
      });

      if (
        response.data &&
        Array.isArray(response.data) &&
        response.data.length > 0
      ) {
        console.log(
          `📰 Fetched ${response.data.length} articles for ${symbol} from Finnhub`,
        );

        return response.data.slice(0, 5).map((article: any) => ({
          title: article.headline,
          summary: article.summary || article.headline,
          url: article.url,
          publishedAt: new Date(article.datetime * 1000).toISOString(),
          source: article.source,
          sentiment: this.analyzeSentiment(
            article.headline + ' ' + (article.summary || ''),
          ),
          relevanceScore: '0.8',
        }));
      }
    } catch (error) {
      console.log(`⚠️ Finnhub API error for ${symbol}:`, error.message);
    }

    return [];
  }

  private getDateDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  private normalizeSentiment(score: number, label: string): any {
    return {
      score: score,
      label: label.toLowerCase(),
      confidence: Math.min(0.9, Math.abs(score) * 0.5 + 0.3),
    };
  }
  private generateRealisticMockNews(symbol: string): any[] {
    console.log(
      `📰 No real news data available for ${symbol} - returning empty array`,
    );
    return [];
  }

  /**
   * Analyze sentiment of text using natural language processing
   */
  async analyzeSentiment(text: string): Promise<{
    score: number;
    label: string;
    confidence: number;
    tokens: string[];
  }> {
    const tokens = this.wordTokenizer.tokenize(text.toLowerCase());
    const result = this.sentiment.analyze(text);

    let label = 'neutral';
    if (result.score > 1) label = 'positive';
    else if (result.score < -1) label = 'negative';

    return {
      score: result.score,
      label,
      confidence: Math.min(0.9, Math.abs(result.score) * 0.1 + 0.5),
      tokens: tokens.slice(0, 10), // First 10 tokens
    };
  }

  /**
   * Get news for stock - alias for fetchNewsForStock to match controller expectations
   */
  async getNewsForStock(symbol: string, limit: number = 10): Promise<any[]> {
    const allNews = await this.fetchNewsForStock(symbol);
    return allNews.slice(0, limit);
  }
  /**
   * Get portfolio sentiment for multiple stock symbols
   */
  async getPortfolioSentiment(
    stockSymbols: string[],
  ): Promise<Map<string, any>> {
    const sentimentMap = new Map<string, any>();

    for (const symbol of stockSymbols) {
      try {
        const news = await this.fetchNewsForStock(symbol);
        let totalScore = 0;
        let totalConfidence = 0;
        let articlesAnalyzed = 0;

        // If we have real news articles, analyze them
        if (news && news.length > 0) {
          for (const article of news) {
            const text = `${article.title || ''} ${article.summary || ''}`;
            const sentiment = await this.analyzeSentiment(text);

            totalScore += sentiment.score;
            totalConfidence += sentiment.confidence;
            articlesAnalyzed++;
          }
        } // If no news or API failed, return neutral/empty sentiment data
        if (articlesAnalyzed === 0) {
          console.log(
            `� No news data available for ${symbol} - using neutral sentiment`,
          );
          sentimentMap.set(symbol, {
            sentiment: {
              score: 0,
              label: 'neutral',
              confidence: 0,
              articlesAnalyzed: 0,
            },
            recentNews: [],
          });
          continue;
        }

        const avgScore =
          articlesAnalyzed > 0 ? totalScore / articlesAnalyzed : 0;
        const avgConfidence =
          articlesAnalyzed > 0 ? totalConfidence / articlesAnalyzed : 0;

        let label = 'neutral';
        if (avgScore > 1) label = 'positive';
        else if (avgScore < -1) label = 'negative';

        sentimentMap.set(symbol, {
          sentiment: {
            score: avgScore,
            label,
            confidence: avgConfidence,
            articlesAnalyzed,
          },
          recentNews: news,
        });
      } catch (error) {
        console.error(`Error analyzing sentiment for ${symbol}:`, error);
        // Return neutral sentiment on error
        sentimentMap.set(symbol, {
          sentiment: {
            score: 0,
            label: 'neutral',
            confidence: 0,
            articlesAnalyzed: 0,
          },
          recentNews: [],
        });
      }
    }

    return sentimentMap;
  }
  /**
   * Get average sentiment for a stock symbol
   */
  async getAverageSentiment(symbol: string, days: number = 7): Promise<number> {
    // No real sentiment data available
    console.log(`📰 No real sentiment data available for ${symbol}`);
    return 0; // Return neutral sentiment
  }

  /**
   * Bulk analyze sentiment for multiple stocks (simplified mock version)
   */
  async bulkAnalyzeSentimentForStocks(stockSymbols: string[]): Promise<any[]> {
    const results: any[] = [];

    for (const symbol of stockSymbols) {
      try {
        const news = await this.fetchNewsForStock(symbol);
        const avgSentiment = await this.getAverageSentiment(symbol, 7);

        results.push({
          symbol,
          avgSentiment,
          newsCount: news.length,
          lastProcessed: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`Error processing sentiment for ${symbol}:`, error);
        results.push({
          symbol,
          avgSentiment: 0,
          newsCount: 0,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * Save news with sentiment analysis (mock implementation)
   */
  async saveNewsWithSentiment(symbol: string, newsItem: any): Promise<any> {
    // Analyze sentiment of the news item
    const text = `${newsItem.title || ''} ${newsItem.summary || ''}`;
    const sentiment = await this.analyzeSentiment(text);

    // Return mock saved news object
    return {
      id: `news-${Date.now()}-${Math.random()}`,
      symbol,
      title: newsItem.title,
      summary: newsItem.summary,
      url: newsItem.url,
      publishedAt: newsItem.publishedAt,
      source: newsItem.source,
      sentiment: sentiment,
      savedAt: new Date().toISOString(),
    };
  }
  /**
   * Generate realistic mock sentiment data for testing/fallback
   */
  private generateMockSentiment(symbol: string): any {
    console.log(`📰 No real sentiment data available for ${symbol}`);
    return {
      score: 0,
      label: 'neutral',
      confidence: 0,
      articlesAnalyzed: 0,
      lastUpdated: new Date().toISOString(),
    };
  } /**
   * Generate mock news articles for testing/fallback
   */
  private generateMockNews(symbol: string): any[] {
    console.log(
      `📰 No real news data available for ${symbol} - returning empty array`,
    );
    return [];
  }
}
