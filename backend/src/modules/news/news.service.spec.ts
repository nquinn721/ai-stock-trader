import { Test, TestingModule } from '@nestjs/testing';
import { NewsService } from './news.service';

describe('NewsService', () => {
  let service: NewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NewsService],
    }).compile();

    service = module.get<NewsService>(NewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('fetchNewsForStock', () => {
    it('should return empty array for news', async () => {
      const news = await service.fetchNewsForStock('AAPL');

      expect(news).toBeDefined();
      expect(Array.isArray(news)).toBe(true);
      expect(news.length).toBe(0);
    });

    it('should handle different symbols', async () => {
      const symbols = ['AAPL', 'GOOGL', 'MSFT'];

      for (const symbol of symbols) {
        const news = await service.fetchNewsForStock(symbol);
        expect(news).toBeDefined();
        expect(Array.isArray(news)).toBe(true);
      }
    });
  });

  describe('getNewsForStock', () => {
    it('should return limited news for stock', async () => {
      const news = await service.getNewsForStock('AAPL', 5);

      expect(news).toBeDefined();
      expect(Array.isArray(news)).toBe(true);
      expect(news.length).toBeLessThanOrEqual(5);
    });

    it('should default to 10 articles limit', async () => {
      const news = await service.getNewsForStock('AAPL');

      expect(news).toBeDefined();
      expect(Array.isArray(news)).toBe(true);
      expect(news.length).toBeLessThanOrEqual(10);
    });
  });

  describe('getAverageSentiment', () => {
    it('should return sentiment score for a symbol', async () => {
      const sentiment = await service.getAverageSentiment('AAPL');

      expect(sentiment).toBeDefined();
      expect(typeof sentiment).toBe('number');
      expect(sentiment).toBe(0); // Should return neutral sentiment
    });

    it('should handle different time periods', async () => {
      const sentiment7Days = await service.getAverageSentiment('AAPL', 7);
      const sentiment30Days = await service.getAverageSentiment('AAPL', 30);

      expect(typeof sentiment7Days).toBe('number');
      expect(typeof sentiment30Days).toBe('number');
    });

    it('should handle empty or invalid symbols', async () => {
      const sentiment = await service.getAverageSentiment('');

      expect(sentiment).toBeDefined();
      expect(typeof sentiment).toBe('number');
      expect(sentiment).toBe(0);
    });
  });

  describe('analyzeSentiment', () => {
    it('should analyze sentiment of text', async () => {
      const positiveText =
        'This is great news! The company is performing excellently.';
      const negativeText =
        'This is terrible news. The company is failing badly.';
      const neutralText = 'The company reported quarterly results.';

      const positiveSentiment = await service.analyzeSentiment(positiveText);
      const negativeSentiment = await service.analyzeSentiment(negativeText);
      const neutralSentiment = await service.analyzeSentiment(neutralText);

      expect(positiveSentiment.score).toBeGreaterThan(0);
      expect(negativeSentiment.score).toBeLessThan(0);
      expect(Math.abs(neutralSentiment.score)).toBeLessThan(
        Math.abs(positiveSentiment.score),
      );

      // Check structure
      expect(positiveSentiment.label).toBe('positive');
      expect(negativeSentiment.label).toBe('negative');
      expect(typeof positiveSentiment.confidence).toBe('number');
      expect(Array.isArray(positiveSentiment.tokens)).toBe(true);
    });

    it('should handle empty text', async () => {
      const result = await service.analyzeSentiment('');

      expect(result).toBeDefined();
      expect(typeof result.score).toBe('number');
      expect(result.label).toBeDefined();
      expect(typeof result.confidence).toBe('number');
      expect(Array.isArray(result.tokens)).toBe(true);
    });

    it('should return consistent results for same text', async () => {
      const text = 'The stock market is performing well today.';
      const sentiment1 = await service.analyzeSentiment(text);
      const sentiment2 = await service.analyzeSentiment(text);

      expect(sentiment1.score).toBe(sentiment2.score);
      expect(sentiment1.label).toBe(sentiment2.label);
    });
  });

  describe('getPortfolioSentiment', () => {
    it('should return sentiment map for multiple stocks', async () => {
      const symbols = ['AAPL', 'GOOGL', 'MSFT'];
      const sentimentMap = await service.getPortfolioSentiment(symbols);

      expect(sentimentMap).toBeDefined();
      expect(sentimentMap instanceof Map).toBe(true);
      expect(sentimentMap.size).toBe(symbols.length);

      symbols.forEach((symbol) => {
        expect(sentimentMap.has(symbol)).toBe(true);

        const data = sentimentMap.get(symbol);
        expect(data.sentiment).toBeDefined();
        expect(data.recentNews).toBeDefined();
        expect(Array.isArray(data.recentNews)).toBe(true);
      });
    });

    it('should handle empty symbol array', async () => {
      const sentimentMap = await service.getPortfolioSentiment([]);

      expect(sentimentMap).toBeDefined();
      expect(sentimentMap instanceof Map).toBe(true);
      expect(sentimentMap.size).toBe(0);
    });
  });

  describe('bulkAnalyzeSentimentForStocks', () => {
    it('should analyze sentiment for multiple stocks', async () => {
      const symbols = ['AAPL', 'GOOGL', 'MSFT'];
      const results = await service.bulkAnalyzeSentimentForStocks(symbols);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(symbols.length);

      results.forEach((result, index) => {
        expect(result.symbol).toBe(symbols[index]);
        expect(typeof result.avgSentiment).toBe('number');
        expect(typeof result.newsCount).toBe('number');
        expect(result.lastProcessed).toBeDefined();
      });
    });

    it('should handle errors gracefully', async () => {
      const symbols = ['INVALID_SYMBOL'];
      const results = await service.bulkAnalyzeSentimentForStocks(symbols);

      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBe(1);
      expect(results[0].symbol).toBe('INVALID_SYMBOL');
    });
  });

  describe('saveNewsWithSentiment', () => {
    it('should save news with sentiment analysis', async () => {
      const mockNewsItem = {
        title: 'Apple Reports Strong Q4 Earnings',
        summary: 'Apple Inc. reported better than expected quarterly results.',
        url: 'https://example.com/news',
        publishedAt: new Date().toISOString(),
        source: 'Financial Times',
      };

      const result = await service.saveNewsWithSentiment('AAPL', mockNewsItem);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.symbol).toBe('AAPL');
      expect(result.title).toBe(mockNewsItem.title);
      expect(result.sentiment).toBeDefined();
      expect(result.sentiment.score).toBeDefined();
      expect(result.sentiment.label).toBeDefined();
      expect(result.savedAt).toBeDefined();
    });
  });
});
