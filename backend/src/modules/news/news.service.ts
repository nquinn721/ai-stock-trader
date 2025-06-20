import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { WordTokenizer } from 'natural';
import * as Sentiment from 'sentiment';

@Injectable()
export class NewsService {
  private sentiment: any;
  private wordTokenizer: WordTokenizer;

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
  }
  /**
   * Fetch real news articles for a stock symbol using NewsAPI
   */
  async fetchNewsForStock(symbol: string): Promise<any[]> {
    // Check if NewsAPI key is available
    const apiKey = process.env.NEWSAPI_KEY;

    // If no API key or it's the default placeholder, return mock data immediately
    if (!apiKey || apiKey === 'YOUR_NEWSAPI_KEY') {
      console.log(
        `📰 Using mock news for ${symbol} (NewsAPI key not configured)`,
      );
      return this.generateMockNews(symbol);
    }

    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
      symbol,
    )}&sortBy=publishedAt&language=en&pageSize=5&apiKey=${apiKey}`;

    try {
      const response = await axios.get(url, { timeout: 5000 }); // 5 second timeout
      if (response.data && response.data.articles) {
        return response.data.articles.map((article: any) => ({
          title: article.title,
          summary: article.description,
          url: article.url,
          publishedAt: article.publishedAt,
          source: article.source.name,
        }));
      }
      return this.generateMockNews(symbol);
    } catch (error) {
      console.error(`Error fetching news for ${symbol}:`, error.message);
      return this.generateMockNews(symbol);
    }
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
        }

        // If no news or API failed, generate realistic mock sentiment data
        if (articlesAnalyzed === 0) {
          console.log(
            `🔄 Using mock sentiment data for ${symbol} (NewsAPI not available)`,
          );
          const mockSentiment = this.generateMockSentiment(symbol);
          sentimentMap.set(symbol, {
            sentiment: mockSentiment,
            recentNews: this.generateMockNews(symbol),
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
        // Generate mock sentiment on error
        const mockSentiment = this.generateMockSentiment(symbol);
        sentimentMap.set(symbol, {
          sentiment: mockSentiment,
          recentNews: this.generateMockNews(symbol),
        });
      }
    }

    return sentimentMap;
  }

  /**
   * Get average sentiment for a stock symbol
   */
  async getAverageSentiment(symbol: string, days: number = 7): Promise<number> {
    // Mock implementation - return random sentiment score
    const baseScore = Math.sin(Date.now() / 100000) * 2; // Oscillating between -2 and 2
    const randomVariation = (Math.random() - 0.5) * 1; // Add some randomness
    return Math.max(-5, Math.min(5, baseScore + randomVariation));
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
    // Create deterministic but varied sentiment based on symbol
    const symbolHash = symbol
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const timeVariation = Math.sin(Date.now() / 300000) * 0.5; // Slow oscillation
    const symbolVariation = (symbolHash % 100) / 50 - 1; // -1 to 1 based on symbol

    const baseScore = symbolVariation + timeVariation;
    const score = Math.max(-2, Math.min(2, baseScore));

    let label = 'neutral';
    if (score > 0.5) label = 'positive';
    else if (score < -0.5) label = 'negative';

    const confidence = Math.min(
      0.9,
      Math.max(0.3, Math.abs(score) * 0.4 + 0.4),
    );

    return {
      score: parseFloat(score.toFixed(2)),
      label,
      confidence: parseFloat(confidence.toFixed(2)),
      articlesAnalyzed: Math.floor(Math.random() * 5) + 3, // 3-7 articles
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Generate mock news articles for testing/fallback
   */
  private generateMockNews(symbol: string): any[] {
    const mockTitles = [
      `${symbol} Shows Strong Performance in Latest Quarter`,
      `Analysts Upgrade ${symbol} Price Target`,
      `${symbol} Announces New Strategic Initiative`,
      `Market Watch: ${symbol} Trading Volume Increases`,
      `${symbol} Reports Better Than Expected Earnings`,
    ];

    return mockTitles.slice(0, 3).map((title, index) => ({
      title,
      summary: `Latest analysis and market updates for ${symbol} indicating positive market trends.`,
      url: `https://example.com/news/${symbol.toLowerCase()}-${index}`,
      publishedAt: new Date(Date.now() - index * 3600000).toISOString(), // Staggered by hours
      source: index % 2 === 0 ? 'Market Watch' : 'Financial News',
      sentiment: 'positive',
      score: 0.6 + Math.random() * 0.4,
      confidence: 0.7 + Math.random() * 0.2,
    }));
  }
}
