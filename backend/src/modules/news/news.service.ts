import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News } from '../../entities/news.entity';
import { Stock } from '../../entities/stock.entity';
import axios from 'axios';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private newsRepository: Repository<News>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
  ) {}

  async fetchNewsForStock(symbol: string): Promise<any[]> {
    try {
      // Using Alpha Vantage News API as an example
      // You can replace this with your preferred news API
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
      console.error(`Error fetching news for ${symbol}:`, error);
      return [];
    }
  }

  async analyzeSentiment(text: string): Promise<{ score: number; label: string }> {
    // Simple sentiment analysis using basic keyword matching
    // In production, you would use a proper sentiment analysis service
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'bullish', 'up', 'rise', 'gain', 'profit', 'strong', 'buy'];
    const negativeWords = ['bad', 'terrible', 'negative', 'bearish', 'down', 'fall', 'loss', 'weak', 'sell', 'decline'];

    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    const totalSentimentWords = positiveCount + negativeCount;
    if (totalSentimentWords === 0) {
      return { score: 0, label: 'neutral' };
    }

    const score = (positiveCount - negativeCount) / totalSentimentWords;
    let label = 'neutral';
    
    if (score > 0.2) label = 'positive';
    else if (score < -0.2) label = 'negative';

    return { score: Math.max(-1, Math.min(1, score)), label };
  }

  async saveNewsWithSentiment(stockSymbol: string, newsData: any): Promise<News> {
    const stock = await this.stockRepository.findOne({ where: { symbol: stockSymbol } });
    if (!stock) {
      throw new Error(`Stock ${stockSymbol} not found`);
    }

    const sentiment = await this.analyzeSentiment(newsData.summary || newsData.title);

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

  async getNewsForStock(stockSymbol: string, limit: number = 10): Promise<News[]> {
    const stock = await this.stockRepository.findOne({ where: { symbol: stockSymbol } });
    if (!stock) {
      throw new Error(`Stock ${stockSymbol} not found`);
    }

    return await this.newsRepository.find({
      where: { stockId: stock.id },
      order: { publishedAt: 'DESC' },
      take: limit,
    });
  }

  async getAverageSentiment(stockSymbol: string, days: number = 7): Promise<number> {
    const stock = await this.stockRepository.findOne({ where: { symbol: stockSymbol } });
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
}
