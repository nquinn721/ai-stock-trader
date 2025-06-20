import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { WordTokenizer } from 'natural';
import * as Sentiment from 'sentiment';
import { Repository } from 'typeorm';
import { News } from '../../entities/news.entity';
import { Stock } from '../../entities/stock.entity';

@Injectable()
export class NewsService {
  private sentiment: any;
  private wordTokenizer: WordTokenizer;

  constructor(
    @InjectRepository(News)
    private newsRepository: Repository<News>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
  ) {
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
  async fetchNewsForStock(symbol: string): Promise<any[]> {
    try {
      const newsPromises = [
        this.fetchFromAlphaVantage(symbol),
        this.fetchFromFinancialData(symbol),
      ];
      const results = await Promise.allSettled(newsPromises);
      const allNews: any[] = [];

      results.forEach((result) => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          allNews.push(...result.value);
        }
      });

      // Remove duplicates and sort by date
      const uniqueNews = this.removeDuplicateNews(allNews);
      return uniqueNews.slice(0, 20); // Return top 20 most recent
    } catch (error) {
      console.error(`Error fetching news for ${symbol}:`, error);
      return [];
    }
  }

  private async fetchFromAlphaVantage(symbol: string): Promise<any[]> {
    try {
      const response = await axios.get('https://www.alphavantage.co/query', {
        params: {
          function: 'NEWS_SENTIMENT',
          tickers: symbol,
          apikey: process.env.ALPHA_VANTAGE_API_KEY || 'demo',
          limit: 10,
        },
      });
      return response.data.feed || [];
    } catch (error) {
      console.error(`Alpha Vantage API error for ${symbol}:`, error);
      return [];
    }
  }
  private async fetchFromFinancialData(symbol: string): Promise<any[]> {
    try {
      // Using Yahoo Finance or other financial news sources
      const response = await axios.get(
        `https://query1.finance.yahoo.com/v1/finance/search`,
        {
          params: {
            q: symbol,
            newsCount: 10,
          },
        },
      );
      return response.data.news || [];
    } catch (error) {
      console.error(`Yahoo Finance news error for ${symbol}:`, error);
      return [];
    }
  }

  private removeDuplicateNews(newsArray: any[]): any[] {
    const seen = new Set();
    return newsArray.filter((item) => {
      const key = item.title || item.headline || item.summary;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  async analyzeSentiment(text: string): Promise<{
    score: number;
    label: string;
    confidence: number;
    details: any;
  }> {
    if (!text) {
      return { score: 0, label: 'neutral', confidence: 0, details: {} };
    }

    // Clean and preprocess text
    const cleanText = this.preprocessText(text);

    // Use the enhanced sentiment analyzer
    const sentimentResult = this.sentiment.analyze(cleanText);

    // Calculate normalized score (-1 to 1)
    const normalizedScore = this.normalizeSentimentScore(
      sentimentResult.score,
      cleanText.length,
    );

    // Determine label and confidence
    const { label, confidence } = this.calculateLabelAndConfidence(
      normalizedScore,
      sentimentResult,
    );

    return {
      score: normalizedScore,
      label,
      confidence,
      details: {
        raw_score: sentimentResult.score,
        comparative: sentimentResult.comparative,
        calculation: sentimentResult.calculation,
        tokens: sentimentResult.tokens,
        words: sentimentResult.words,
        positive: sentimentResult.positive,
        negative: sentimentResult.negative,
      },
    };
  }

  private preprocessText(text: string): string {
    // Remove URLs, mentions, hashtags, and special characters
    return text
      .replace(/https?:\/\/[^\s]+/gi, '') // Remove URLs
      .replace(/@\w+/gi, '') // Remove mentions
      .replace(/#\w+/gi, '') // Remove hashtags
      .replace(/[^\w\s.,!?-]/gi, ' ') // Keep only alphanumeric, spaces, and basic punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .toLowerCase();
  }

  private normalizeSentimentScore(
    rawScore: number,
    textLength: number,
  ): number {
    // Normalize based on text length and apply bounds
    const lengthFactor = Math.min(textLength / 100, 1); // Longer texts get more weight
    const normalizedScore =
      (rawScore / Math.max(textLength / 10, 1)) * lengthFactor;

    // Ensure score is between -1 and 1
    return Math.max(-1, Math.min(1, normalizedScore));
  }

  private calculateLabelAndConfidence(
    score: number,
    sentimentResult: any,
  ): { label: string; confidence: number } {
    const absScore = Math.abs(score);
    let label = 'neutral';
    let confidence = 0;

    if (score > 0.1) {
      label = score > 0.5 ? 'very_positive' : 'positive';
      confidence = Math.min(absScore * 2, 1);
    } else if (score < -0.1) {
      label = score < -0.5 ? 'very_negative' : 'negative';
      confidence = Math.min(absScore * 2, 1);
    } else {
      label = 'neutral';
      confidence = 1 - absScore * 2; // Higher confidence for neutral when score is close to 0
    }

    // Adjust confidence based on number of sentiment words found
    const sentimentWords =
      sentimentResult.positive.length + sentimentResult.negative.length;
    if (sentimentWords === 0) {
      confidence = Math.max(confidence * 0.5, 0.1); // Lower confidence if no sentiment words
    } else if (sentimentWords >= 5) {
      confidence = Math.min(confidence * 1.2, 1); // Higher confidence with more sentiment words
    }

    return { label, confidence: Math.round(confidence * 100) / 100 };
  }

  async saveNewsWithSentiment(
    stockSymbol: string,
    newsData: any,
  ): Promise<News> {
    const stock = await this.stockRepository.findOne({
      where: { symbol: stockSymbol },
    });
    if (!stock) {
      throw new Error(`Stock ${stockSymbol} not found`);
    }

    const sentiment = await this.analyzeSentiment(
      newsData.summary || newsData.title,
    );

    const news = this.newsRepository.create({
      stockId: stock.id,
      title: newsData.title,
      content: newsData.summary || newsData.description || '',
      url: newsData.url,
      source: newsData.source,
      publishedAt: new Date(newsData.time_published || newsData.publishedAt),
      sentimentScore: sentiment.score,
      sentimentLabel: sentiment.label,
    });

    return await this.newsRepository.save(news);
  }

  async getNewsForStock(
    stockSymbol: string,
    limit: number = 10,
  ): Promise<News[]> {
    const stock = await this.stockRepository.findOne({
      where: { symbol: stockSymbol },
    });
    if (!stock) {
      throw new Error(`Stock ${stockSymbol} not found`);
    }

    return await this.newsRepository.find({
      where: { stockId: stock.id },
      order: { publishedAt: 'DESC' },
      take: limit,
    });
  }

  async getAverageSentiment(
    stockSymbol: string,
    days: number = 7,
  ): Promise<number> {
    const stock = await this.stockRepository.findOne({
      where: { symbol: stockSymbol },
    });
    if (!stock) {
      throw new Error(`Stock ${stockSymbol} not found`);
    }

    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    const result = await this.newsRepository
      .createQueryBuilder('news')
      .select('AVG(news.sentimentScore)', 'avgSentiment')
      .where('news.stockId = :stockId', { stockId: stock.id })
      .andWhere('news.publishedAt >= :fromDate', { fromDate })
      .getRawOne();

    return parseFloat(result.avgSentiment) || 0;
  }

  async getPortfolioSentiment(
    stockSymbols: string[],
  ): Promise<Map<string, any>> {
    const sentimentMap = new Map();

    const promises = stockSymbols.map(async (symbol) => {
      try {
        const news = await this.fetchNewsForStock(symbol);
        const recentNews = news.slice(0, 10); // Get most recent 10 articles

        let totalSentiment = 0;
        let totalConfidence = 0;
        let sentimentCount = 0;
        const sentimentDetails: any[] = [];

        for (const article of recentNews) {
          const text = `${article.title || ''} ${article.summary || article.description || ''}`;
          const sentiment = await this.analyzeSentiment(text);

          totalSentiment += sentiment.score;
          totalConfidence += sentiment.confidence;
          sentimentCount++;

          sentimentDetails.push({
            title: article.title,
            sentiment: sentiment.label,
            score: sentiment.score,
            confidence: sentiment.confidence,
            source: article.source,
            publishedAt: article.time_published || article.publishedAt,
          });
        }

        const avgSentiment =
          sentimentCount > 0 ? totalSentiment / sentimentCount : 0;
        const avgConfidence =
          sentimentCount > 0 ? totalConfidence / sentimentCount : 0;

        let overallLabel = 'neutral';
        if (avgSentiment > 0.1)
          overallLabel = avgSentiment > 0.5 ? 'very_positive' : 'positive';
        else if (avgSentiment < -0.1)
          overallLabel = avgSentiment < -0.5 ? 'very_negative' : 'negative';

        sentimentMap.set(symbol, {
          symbol,
          sentiment: {
            score: Math.round(avgSentiment * 100) / 100,
            label: overallLabel,
            confidence: Math.round(avgConfidence * 100) / 100,
            articlesAnalyzed: sentimentCount,
            lastUpdated: new Date().toISOString(),
          },
          recentNews: sentimentDetails.slice(0, 5), // Return top 5 for UI
        });
      } catch (error) {
        console.error(`Error getting sentiment for ${symbol}:`, error);
        sentimentMap.set(symbol, {
          symbol,
          sentiment: {
            score: 0,
            label: 'neutral',
            confidence: 0,
            articlesAnalyzed: 0,
          },
          recentNews: [],
          error: 'Failed to fetch sentiment data',
        });
      }
    });

    await Promise.all(promises);
    return sentimentMap;
  }
  async bulkAnalyzeSentimentForStocks(stockSymbols: string[]): Promise<any[]> {
    const results: any[] = [];

    for (const symbol of stockSymbols) {
      try {
        const news = await this.fetchNewsForStock(symbol);

        for (const article of news.slice(0, 5)) {
          // Process top 5 articles per stock
          const text = `${article.title || ''} ${article.summary || article.description || ''}`;
          const sentiment = await this.analyzeSentiment(text);

          // Save to database
          await this.saveNewsWithSentiment(symbol, {
            ...article,
            sentimentScore: sentiment.score,
            sentimentLabel: sentiment.label,
            sentimentConfidence: sentiment.confidence,
          });
        }

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
