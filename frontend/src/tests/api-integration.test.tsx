import axios from 'axios';
import { renderHook, waitFor } from '@testing-library/react';
import { usePortfolioStore, useStockStore } from '../stores/StoreContext';
import { ApiStore } from '../stores/ApiStore';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock socket context
jest.mock('../context/SocketContext', () => ({
  useSocket: () => ({
    isConnected: true,
    stocks: [],
    tradingSignals: [],
    news: [],
  }),
}));

describe('Frontend API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stock API Integration', () => {
    it('should fetch stocks with signals successfully', async () => {
      const mockStocksWithSignals = [
        {
          id: 1,
          symbol: 'AAPL',
          name: 'Apple Inc.',
          currentPrice: 150.25,
          previousClose: 148.5,
          changePercent: 1.18,
          tradingSignal: {
            id: 1,
            signal: 'buy',
            confidence: 0.75,
            targetPrice: 155.0,
          },
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockStocksWithSignals });

      const response = await axios.get('http://localhost:8000/stocks/with-signals/all');

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:8000/stocks/with-signals/all');
      expect(response.data).toEqual(mockStocksWithSignals);
    });

    it('should handle stock API errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      await expect(
        axios.get('http://localhost:8000/stocks/with-signals/all')
      ).rejects.toThrow('Network Error');
    });

    it('should fetch individual stock data', async () => {
      const mockStock = {
        id: 1,
        symbol: 'AAPL',
        name: 'Apple Inc.',
        currentPrice: 150.25,
        previousClose: 148.5,
      };

      mockedAxios.get.mockResolvedValue({ data: mockStock });

      const response = await axios.get('http://localhost:8000/stocks/AAPL');

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:8000/stocks/AAPL');
      expect(response.data).toEqual(mockStock);
    });
  });

  describe('Portfolio API Integration', () => {
    it('should fetch all portfolios', async () => {
      const mockPortfolios = [
        {
          id: 1,
          name: 'Test Portfolio',
          initialCash: 100000,
          currentCash: 95000,
          totalValue: 105000,
          positions: [],
          trades: [],
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockPortfolios });

      const response = await axios.get('http://localhost:8000/paper-trading/portfolios');

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:8000/paper-trading/portfolios');
      expect(response.data).toEqual(mockPortfolios);
    });

    it('should fetch specific portfolio', async () => {
      const mockPortfolio = {
        id: 1,
        name: 'Test Portfolio',
        initialCash: 100000,
        currentCash: 95000,
        totalValue: 105000,
        positions: [
          {
            id: 1,
            symbol: 'AAPL',
            quantity: 10,
            averagePrice: 150.0,
            currentValue: 1502.5,
          },
        ],
        trades: [],
      };

      mockedAxios.get.mockResolvedValue({ data: mockPortfolio });

      const response = await axios.get('http://localhost:8000/paper-trading/portfolios/1');

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:8000/paper-trading/portfolios/1');
      expect(response.data).toEqual(mockPortfolio);
    });

    it('should create new portfolio', async () => {
      const newPortfolio = {
        name: 'New Portfolio',
        initialCash: 50000,
      };

      const createdPortfolio = {
        id: 2,
        ...newPortfolio,
        currentCash: 50000,
        totalValue: 50000,
        positions: [],
        trades: [],
      };

      mockedAxios.post.mockResolvedValue({ data: createdPortfolio });

      const response = await axios.post(
        'http://localhost:8000/paper-trading/portfolios',
        newPortfolio
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8000/paper-trading/portfolios',
        newPortfolio
      );
      expect(response.data).toEqual(createdPortfolio);
    });

    it('should execute trades', async () => {
      const tradeData = {
        portfolioId: 1,
        symbol: 'AAPL',
        type: 'buy',
        quantity: 10,
        price: 150.25,
      };

      const executedTrade = {
        id: 1,
        ...tradeData,
        executedAt: new Date().toISOString(),
        totalCost: 1502.5,
      };

      mockedAxios.post.mockResolvedValue({ data: executedTrade });

      const response = await axios.post(
        'http://localhost:8000/paper-trading/trade',
        tradeData
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:8000/paper-trading/trade',
        tradeData
      );
      expect(response.data).toEqual(executedTrade);
    });
  });

  describe('Trading Signals API Integration', () => {
    it('should fetch trading signals', async () => {
      const mockSignals = [
        {
          id: 1,
          stockId: 1,
          signal: 'buy',
          confidence: 0.75,
          targetPrice: 155.0,
          reason: 'Strong upward trend',
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockSignals });

      const response = await axios.get('http://localhost:8000/trading/signals');

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:8000/trading/signals');
      expect(response.data).toEqual(mockSignals);
    });

    it('should fetch breakout data for specific stock', async () => {
      const mockBreakout = {
        isBreakout: true,
        signal: 'buy',
        confidence: 0.8,
        reason: 'Price broke resistance level',
      };

      mockedAxios.get.mockResolvedValue({ data: mockBreakout });

      const response = await axios.get('http://localhost:8000/trading/breakout/AAPL');

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:8000/trading/breakout/AAPL');
      expect(response.data).toEqual(mockBreakout);
    });
  });

  describe('News API Integration', () => {
    it('should fetch news for specific stock', async () => {
      const mockNews = [
        {
          title: 'AAPL reports strong earnings',
          summary: 'Apple exceeded expectations',
          url: 'https://example.com/news/1',
          publishedAt: '2024-01-01T00:00:00Z',
          source: 'Financial Times',
        },
      ];

      mockedAxios.get.mockResolvedValue({ data: mockNews });

      const response = await axios.get('http://localhost:8000/news/AAPL');

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:8000/news/AAPL');
      expect(response.data).toEqual(mockNews);
    });

    it('should fetch sentiment analysis for stock', async () => {
      const mockSentiment = {
        symbol: 'AAPL',
        sentiment: 0.75,
        newsCount: 5,
        headlines: ['Positive news 1', 'Positive news 2'],
      };

      mockedAxios.get.mockResolvedValue({ data: mockSentiment });

      const response = await axios.get('http://localhost:8000/news/AAPL/sentiment');

      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:8000/news/AAPL/sentiment');
      expect(response.data).toEqual(mockSentiment);
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { status: 404, data: { message: 'Stock not found' } },
      });

      await expect(
        axios.get('http://localhost:8000/stocks/NONEXISTENT')
      ).rejects.toMatchObject({
        response: { status: 404 },
      });
    });

    it('should handle 500 errors gracefully', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { status: 500, data: { message: 'Internal server error' } },
      });

      await expect(
        axios.get('http://localhost:8000/stocks/with-signals/all')
      ).rejects.toMatchObject({
        response: { status: 500 },
      });
    });

    it('should handle network errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network Error'));

      await expect(
        axios.get('http://localhost:8000/stocks/with-signals/all')
      ).rejects.toThrow('Network Error');
    });
  });

  describe('Performance and Timeout Handling', () => {
    it('should handle API timeouts', async () => {
      mockedAxios.get.mockRejectedValue({ code: 'ECONNABORTED', message: 'timeout' });

      await expect(
        axios.get('http://localhost:8000/stocks/AAPL/historical/1mo', { timeout: 5000 })
      ).rejects.toMatchObject({
        code: 'ECONNABORTED',
      });
    });

    it('should handle concurrent API calls', async () => {
      const mockResponses = [
        { data: [{ symbol: 'AAPL' }] },
        { data: [{ signal: 'buy' }] },
        { data: [{ title: 'News' }] },
      ];

      mockedAxios.get
        .mockResolvedValueOnce(mockResponses[0])
        .mockResolvedValueOnce(mockResponses[1])
        .mockResolvedValueOnce(mockResponses[2]);

      const promises = [
        axios.get('http://localhost:8000/stocks/with-signals/all'),
        axios.get('http://localhost:8000/trading/signals'),
        axios.get('http://localhost:8000/news/AAPL'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results[0].data).toEqual([{ symbol: 'AAPL' }]);
      expect(results[1].data).toEqual([{ signal: 'buy' }]);
      expect(results[2].data).toEqual([{ title: 'News' }]);
    });
  });
});
