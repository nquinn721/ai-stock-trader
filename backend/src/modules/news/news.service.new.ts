import { Injectable } from '@nestjs/common';
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
   * Generate mock news sentiment data for a stock symbol
   */
  async fetchNewsForStock(symbol: string): Promise<any[]> {
    // Return mock news articles with varied sentiment
    const mockNews = [
      {
        title: `${symbol} reports strong quarterly earnings`,
        summary: `${symbol} exceeded analyst expectations with robust revenue growth`,
        url: `https://example.com/news/${symbol}-earnings`,
        publishedAt: new Date(
          Date.now() - Math.random() * 24 * 60 * 60 * 1000,
        ).toISOString(),
        source: 'Financial Times',
      },
      {
        title: `Market outlook positive for ${symbol}`,
        summary: `Analysts are optimistic about ${symbol}'s future prospects`,
        url: `https://example.com/news/${symbol}-outlook`,
        publishedAt: new Date(
          Date.now() - Math.random() * 48 * 60 * 60 * 1000,
        ).toISOString(),
        source: 'Reuters',
      },
      {
        title: `${symbol} faces market volatility concerns`,
        summary: `Industry challenges may impact ${symbol}'s performance`,
        url: `https://example.com/news/${symbol}-volatility`,
        publishedAt: new Date(
          Date.now() - Math.random() * 72 * 60 * 60 * 1000,
        ).toISOString(),
        source: 'Bloomberg',
      },
    ];

    return mockNews;
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

        for (const article of news) {
          const text = `${article.title || ''} ${article.summary || ''}`;
          const sentiment = await this.analyzeSentiment(text);

          totalScore += sentiment.score;
          totalConfidence += sentiment.confidence;
          articlesAnalyzed++;
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
        // Default neutral sentiment on error
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
}
