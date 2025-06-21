import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('API Integration Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Stocks API', () => {
    it('/stocks (GET) should return array of stocks', async () => {
      const response = await request(app.getHttpServer())
        .get('/stocks')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('symbol');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('currentPrice');
      }
    });

    it('/stocks/with-signals/all (GET) should return stocks with trading signals', async () => {
      const response = await request(app.getHttpServer())
        .get('/stocks/with-signals/all')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('symbol');
        expect(response.body[0]).toHaveProperty('currentPrice');
        // May or may not have tradingSignal depending on data
      }
    });

    it('/stocks/:symbol (GET) should return specific stock', async () => {
      const response = await request(app.getHttpServer())
        .get('/stocks/AAPL')
        .expect((res) => {
          if (res.status === 200) {
            expect(res.body).toHaveProperty('symbol', 'AAPL');
            expect(res.body).toHaveProperty('name');
            expect(res.body).toHaveProperty('currentPrice');
          } else if (res.status === 404) {
            // Stock not found is also acceptable
            expect(res.body).toHaveProperty('message');
          }
        });
    });

    it('/stocks/:symbol (GET) should return 404 for non-existent stock', async () => {
      await request(app.getHttpServer()).get('/stocks/NONEXISTENT').expect(404);
    });

    it('/stocks/:symbol/historical/:period (GET) should return historical data', async () => {
      const response = await request(app.getHttpServer())
        .get('/stocks/AAPL/historical/1mo')
        .expect((res) => {
          if (res.status === 200) {
            expect(Array.isArray(res.body)).toBe(true);
          } else if (res.status === 404) {
            // Stock not found is acceptable
            expect(res.body).toHaveProperty('message');
          }
        });
    });
  });

  describe('Trading API', () => {
    it('/trading/signals (GET) should return trading signals', async () => {
      const response = await request(app.getHttpServer())
        .get('/trading/signals')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('symbol');
        expect(response.body[0]).toHaveProperty('signal');
        expect(response.body[0]).toHaveProperty('confidence');
      }
    });

    it('/trading/signal/:symbol (GET) should return signal for specific stock', async () => {
      const response = await request(app.getHttpServer())
        .get('/trading/signal/AAPL')
        .expect((res) => {
          if (res.status === 200) {
            expect(res.body).toHaveProperty('symbol', 'AAPL');
            expect(res.body).toHaveProperty('signal');
            expect(res.body).toHaveProperty('confidence');
          } else if (res.status === 404) {
            // Signal not found is also acceptable
            expect(res.body).toHaveProperty('message');
          }
        });
    });

    it('/trading/breakout/:symbol (GET) should return breakout analysis', async () => {
      const response = await request(app.getHttpServer())
        .get('/trading/breakout/AAPL')
        .expect(200);

      expect(response.body).toHaveProperty('isBreakout');
      expect(response.body).toHaveProperty('signal');
      expect(response.body).toHaveProperty('confidence');
      expect(response.body).toHaveProperty('reason');
    });

    it('/trading/accuracy/:symbol (GET) should return signal accuracy metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/trading/accuracy/AAPL')
        .expect(200);

      expect(response.body).toHaveProperty('accuracy');
      expect(response.body).toHaveProperty('totalSignals');
      expect(response.body).toHaveProperty('correctPredictions');
      expect(typeof response.body.accuracy).toBe('number');
      expect(response.body.accuracy).toBeGreaterThanOrEqual(0);
      expect(response.body.accuracy).toBeLessThanOrEqual(1);
    });
  });

  describe('News API', () => {
    it('/news/:symbol (GET) should return news for stock', async () => {
      const response = await request(app.getHttpServer())
        .get('/news/AAPL')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // News may be empty array if no real news data available
    });

    it('/news/:symbol/sentiment (GET) should return sentiment analysis', async () => {
      const response = await request(app.getHttpServer())
        .get('/news/AAPL/sentiment')
        .expect(200);

      expect(response.body).toHaveProperty('symbol', 'AAPL');
      expect(response.body).toHaveProperty('sentiment');
      expect(response.body).toHaveProperty('newsCount');
      expect(response.body).toHaveProperty('headlines');
      expect(typeof response.body.sentiment).toBe('number');
      expect(Array.isArray(response.body.headlines)).toBe(true);
    });

    it('/news/portfolio/sentiment (POST) should return portfolio sentiment', async () => {
      const stockSymbols = ['AAPL', 'GOOGL', 'MSFT'];

      const response = await request(app.getHttpServer())
        .post('/news/portfolio/sentiment')
        .send({ stockSymbols })
        .expect(200);

      expect(response.body).toBeDefined();
      expect(typeof response.body).toBe('object');

      stockSymbols.forEach((symbol) => {
        if (response.body[symbol]) {
          expect(response.body[symbol]).toHaveProperty('sentiment');
          expect(response.body[symbol]).toHaveProperty('recentNews');
        }
      });
    });

    it('/news/bulk-analyze (POST) should analyze sentiment for multiple stocks', async () => {
      const stockSymbols = ['AAPL', 'GOOGL'];

      const response = await request(app.getHttpServer())
        .post('/news/bulk-analyze')
        .send({ stockSymbols })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(stockSymbols.length);

      response.body.forEach((result) => {
        expect(result).toHaveProperty('symbol');
        expect(result).toHaveProperty('avgSentiment');
        expect(result).toHaveProperty('newsCount');
        expect(typeof result.avgSentiment).toBe('number');
        expect(typeof result.newsCount).toBe('number');
      });
    });
  });

  describe('Paper Trading API', () => {
    let portfolioId: number;

    it('/paper-trading/portfolios (POST) should create a new portfolio', async () => {
      const createPortfolioDto = {
        name: 'Test Portfolio',
        initialCash: 10000,
      };

      const response = await request(app.getHttpServer())
        .post('/paper-trading/portfolios')
        .send(createPortfolioDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'Test Portfolio');
      expect(response.body).toHaveProperty('initialCash', 10000);
      expect(response.body).toHaveProperty('currentCash', 10000);

      portfolioId = response.body.id;
    });

    it('/paper-trading/portfolios (GET) should return all portfolios', async () => {
      const response = await request(app.getHttpServer())
        .get('/paper-trading/portfolios')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('id');
        expect(response.body[0]).toHaveProperty('name');
        expect(response.body[0]).toHaveProperty('totalValue');
      }
    });

    it('/paper-trading/portfolios/:id (GET) should return specific portfolio', async () => {
      if (!portfolioId) {
        // Create a portfolio first if one wasn't created
        const createResponse = await request(app.getHttpServer())
          .post('/paper-trading/portfolios')
          .send({ name: 'Test Portfolio 2', initialCash: 5000 });
        portfolioId = createResponse.body.id;
      }

      const response = await request(app.getHttpServer())
        .get(`/paper-trading/portfolios/${portfolioId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', portfolioId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('totalValue');
    });

    it('/paper-trading/trade (POST) should execute a trade', async () => {
      if (!portfolioId) {
        // Create a portfolio first
        const createResponse = await request(app.getHttpServer())
          .post('/paper-trading/portfolios')
          .send({ name: 'Trading Portfolio', initialCash: 15000 });
        portfolioId = createResponse.body.id;
      }

      const tradeDto = {
        portfolioId,
        symbol: 'AAPL',
        type: 'buy',
        quantity: 10,
      };

      const response = await request(app.getHttpServer())
        .post('/paper-trading/trade')
        .send(tradeDto)
        .expect((res) => {
          // Trade might succeed or fail depending on stock availability
          if (res.status === 201) {
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('symbol', 'AAPL');
            expect(res.body).toHaveProperty('type', 'buy');
            expect(res.body).toHaveProperty('quantity', 10);
          } else {
            // Error responses should have message
            expect(res.body).toHaveProperty('message');
          }
        });
    });
  });

  describe('Breakout API', () => {
    it('/breakout/:symbol/detect (GET) should detect breakouts', async () => {
      const response = await request(app.getHttpServer())
        .get('/breakout/AAPL/detect')
        .expect(200);

      expect(response.body).toHaveProperty('signal');
      expect(response.body).toHaveProperty('probability');
      expect(response.body).toHaveProperty('confidence');
      expect(response.body).toHaveProperty('recommendation');
      expect(['bullish', 'bearish', 'neutral']).toContain(response.body.signal);
      expect(typeof response.body.probability).toBe('number');
      expect(typeof response.body.confidence).toBe('number');
    });

    it('/breakout/:symbol/patterns (GET) should return day trading patterns', async () => {
      const response = await request(app.getHttpServer())
        .get('/breakout/AAPL/patterns')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      if (response.body.length > 0) {
        expect(response.body[0]).toHaveProperty('type');
        expect(response.body[0]).toHaveProperty('confidence');
        expect(response.body[0]).toHaveProperty('direction');
      }
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      await request(app.getHttpServer())
        .get('/non-existent-endpoint')
        .expect(404);
    });

    it('should handle malformed JSON in POST requests', async () => {
      await request(app.getHttpServer())
        .post('/paper-trading/portfolios')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('should validate required fields in POST requests', async () => {
      await request(app.getHttpServer())
        .post('/paper-trading/portfolios')
        .send({}) // Missing required fields
        .expect(400);
    });
  });

  describe('CORS and Headers', () => {
    it('should include CORS headers', async () => {
      const response = await request(app.getHttpServer())
        .get('/stocks')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle OPTIONS requests', async () => {
      await request(app.getHttpServer())
        .options('/stocks')
        .expect((res) => {
          // Should not return 404 for OPTIONS
          expect(res.status).not.toBe(404);
        });
    });
  });
});
