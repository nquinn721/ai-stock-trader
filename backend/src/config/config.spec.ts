import {
  buildApiUrl,
  getProviderBaseUrl,
  validateApiConfiguration,
} from './api-endpoints.config';

import {
  getCacheTtl,
  getHttpConfig,
  getRateLimits,
} from './http-client.config';

describe('API Configuration', () => {
  describe('buildApiUrl', () => {
    it('should build correct URL for Alpha Vantage', () => {
      const url = buildApiUrl('alphaVantage', 'newsSentiment', {
        tickers: 'AAPL',
        limit: '8',
        apikey: 'test-key',
      });

      expect(url).toBe(
        'https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=AAPL&limit=8&apikey=test-key',
      );
    });

    it('should build correct URL for Finnhub', () => {
      const url = buildApiUrl('finnhub', 'companyNews', {
        symbol: 'AAPL',
        from: '2023-01-01',
        to: '2023-01-07',
        token: 'test-token',
      });

      expect(url).toBe(
        'https://finnhub.io/api/v1/company-news?symbol=AAPL&from=2023-01-01&to=2023-01-07&token=test-token',
      );
    });

    it('should build correct URL for OpenAI', () => {
      const url = buildApiUrl('openai', 'chatCompletions');

      expect(url).toBe('https://api.openai.com/v1/chat/completions');
    });

    it('should build correct URL for Anthropic', () => {
      const url = buildApiUrl('anthropic', 'messages');

      expect(url).toBe('https://api.anthropic.com/v1/messages');
    });

    it('should throw error for unknown provider', () => {
      expect(() => {
        buildApiUrl('unknownProvider' as any, 'someEndpoint');
      }).toThrow('Unknown API provider: unknownProvider');
    });

    it('should throw error for unknown endpoint', () => {
      expect(() => {
        buildApiUrl('alphaVantage', 'unknownEndpoint');
      }).toThrow(
        "Unknown endpoint 'unknownEndpoint' for provider 'alphaVantage'",
      );
    });
  });

  describe('getProviderBaseUrl', () => {
    it('should return correct base URLs', () => {
      expect(getProviderBaseUrl('alphaVantage')).toBe(
        'https://www.alphavantage.co',
      );
      expect(getProviderBaseUrl('finnhub')).toBe('https://finnhub.io/api/v1');
      expect(getProviderBaseUrl('openai')).toBe('https://api.openai.com/v1');
      expect(getProviderBaseUrl('anthropic')).toBe(
        'https://api.anthropic.com/v1',
      );
    });
  });

  describe('validateApiConfiguration', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('should return false for missing API keys', () => {
      delete process.env.ALPHA_VANTAGE_API_KEY;
      delete process.env.FINNHUB_API_KEY;
      delete process.env.OPENAI_API_KEY;
      delete process.env.ANTHROPIC_API_KEY;

      const result = validateApiConfiguration();

      expect(result.alphaVantage).toBe(false);
      expect(result.finnhub).toBe(false);
      expect(result.openai).toBe(false);
      expect(result.anthropic).toBe(false);
    });

    it('should return true for valid API keys', () => {
      process.env.ALPHA_VANTAGE_API_KEY = 'valid-key';
      process.env.FINNHUB_API_KEY = 'valid-key';
      process.env.OPENAI_API_KEY = 'valid-key';
      process.env.ANTHROPIC_API_KEY = 'valid-key';

      const result = validateApiConfiguration();

      expect(result.alphaVantage).toBe(true);
      expect(result.finnhub).toBe(true);
      expect(result.openai).toBe(true);
      expect(result.anthropic).toBe(true);
    });

    it('should return false for placeholder API keys', () => {
      process.env.ALPHA_VANTAGE_API_KEY = 'YOUR_ALPHA_VANTAGE_API_KEY';
      process.env.FINNHUB_API_KEY = 'YOUR_FINNHUB_API_KEY';
      process.env.OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY';
      process.env.ANTHROPIC_API_KEY = 'YOUR_ANTHROPIC_API_KEY';

      const result = validateApiConfiguration();

      expect(result.alphaVantage).toBe(false);
      expect(result.finnhub).toBe(false);
      expect(result.openai).toBe(false);
      expect(result.anthropic).toBe(false);
    });
  });

  describe('HTTP Configuration', () => {
    it('should return correct HTTP config for providers', () => {
      const alphaVantageConfig = getHttpConfig('alphaVantage');
      expect(alphaVantageConfig.timeout).toBe(10000);
      expect(alphaVantageConfig.retries).toBe(2);

      const openaiConfig = getHttpConfig('openai');
      expect(openaiConfig.timeout).toBe(30000);
      expect(openaiConfig.retries).toBe(1);
    });

    it('should return correct cache TTL for providers', () => {
      expect(getCacheTtl('alphaVantage')).toBe(300000); // 5 minutes
      expect(getCacheTtl('openai')).toBe(3600000); // 1 hour
    });

    it('should return correct rate limits for providers', () => {
      const alphaVantageRateLimits = getRateLimits('alphaVantage');
      expect(alphaVantageRateLimits.requestsPerMinute).toBe(5);

      const finnhubRateLimits = getRateLimits('finnhub');
      expect(finnhubRateLimits.requestsPerMinute).toBe(10);
    });
  });
});
