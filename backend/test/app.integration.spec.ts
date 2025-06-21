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

  describe('Health Check', () => {
    it('/health (GET) should return OK', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body.status).toBe('OK');
        });
    });
  });

  describe('Stock API', () => {
    it('/stocks (GET) should return array of stocks', () => {
      return request(app.getHttpServer())
        .get('/stocks')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('id');
            expect(res.body[0]).toHaveProperty('symbol');
            expect(res.body[0]).toHaveProperty('name');
            expect(res.body[0]).toHaveProperty('currentPrice');
          }
        });
    });

    it('/stocks/with-signals/all (GET) should return stocks with signals', () => {
      return request(app.getHttpServer())
        .get('/stocks/with-signals/all')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('symbol');
            expect(res.body[0]).toHaveProperty('currentPrice');
            expect(res.body[0]).toHaveProperty('tradingSignal');
          }
        });
    });

    it('/stocks/:symbol (GET) should return specific stock', () => {
      return request(app.getHttpServer())
        .get('/stocks/AAPL')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('symbol', 'AAPL');
          expect(res.body).toHaveProperty('name');
          expect(res.body).toHaveProperty('currentPrice');
        });
    });

    it('/stocks/:symbol (GET) should return 404 for non-existent stock', () => {
      return request(app.getHttpServer())
        .get('/stocks/NONEXISTENT')
        .expect(404);
    });

    it('/stocks/:symbol/historical (GET) should return historical data', () => {
      return request(app.getHttpServer())
        .get('/stocks/AAPL/historical')
        .query({ period: '1mo' })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('date');
            expect(res.body[0]).toHaveProperty('open');
            expect(res.body[0]).toHaveProperty('high');
            expect(res.body[0]).toHaveProperty('low');
            expect(res.body[0]).toHaveProperty('close');
            expect(res.body[0]).toHaveProperty('volume');
          }
        });
    });

    it('/stocks/:symbol/historical (GET) should handle invalid period', () => {
      return request(app.getHttpServer())
        .get('/stocks/AAPL/historical')
        .query({ period: 'invalid' })
        .expect(400);
    });
  });

  describe('Trading API', () => {
    it('/trading/signals (GET) should return trading signals', () => {
      return request(app.getHttpServer())
        .get('/trading/signals')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('id');
            expect(res.body[0]).toHaveProperty('symbol');
            expect(res.body[0]).toHaveProperty('signal');
            expect(res.body[0]).toHaveProperty('confidence');
            expect(res.body[0]).toHaveProperty('reason');
            expect(['buy', 'sell', 'hold']).toContain(res.body[0].signal);
            expect(res.body[0].confidence).toBeGreaterThanOrEqual(0);
            expect(res.body[0].confidence).toBeLessThanOrEqual(1);
          }
        });
    });

    it('/trading/signals/:symbol (GET) should return signals for specific stock', () => {
      return request(app.getHttpServer())
        .get('/trading/signals/AAPL')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('/trading/breakout/:symbol (GET) should return breakout analysis', () => {
      return request(app.getHttpServer())
        .get('/trading/breakout/AAPL')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('isBreakout');
          expect(res.body).toHaveProperty('signal');
          expect(res.body).toHaveProperty('confidence');
          expect(res.body).toHaveProperty('reason');
          expect(typeof res.body.isBreakout).toBe('boolean');
          expect(['buy', 'sell', 'hold']).toContain(res.body.signal);
          expect(res.body.confidence).toBeGreaterThan(0);
          expect(res.body.confidence).toBeLessThanOrEqual(1);
        });
    });

    it('/trading/validate/:symbol (GET) should return signal accuracy', () => {
      return request(app.getHttpServer())
        .get('/trading/validate/AAPL')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accuracy');
          expect(res.body).toHaveProperty('totalSignals');
          expect(res.body).toHaveProperty('correctPredictions');
          expect(res.body.accuracy).toBeGreaterThanOrEqual(0);
          expect(res.body.accuracy).toBeLessThanOrEqual(1);
          expect(res.body.totalSignals).toBeGreaterThanOrEqual(0);
          expect(res.body.correctPredictions).toBeGreaterThanOrEqual(0);
        });
    });
  });

  describe('News API', () => {
    it('/news/:symbol (GET) should return news for stock', () => {
      return request(app.getHttpServer())
        .get('/news/AAPL')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          // News might be empty array if no real news API is configured
        });
    });

    it('/news/:symbol/sentiment (GET) should return sentiment analysis', () => {
      return request(app.getHttpServer())
        .get('/news/AAPL/sentiment')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('symbol', 'AAPL');
          expect(res.body).toHaveProperty('sentiment');
          expect(res.body).toHaveProperty('newsCount');
          expect(res.body).toHaveProperty('headlines');
          expect(typeof res.body.sentiment).toBe('number');
          expect(typeof res.body.newsCount).toBe('number');
          expect(Array.isArray(res.body.headlines)).toBe(true);
        });
    });

    it('/news/sentiment/bulk (POST) should analyze multiple stocks', () => {
      const stockSymbols = ['AAPL', 'GOOGL', 'MSFT'];

      return request(app.getHttpServer())
        .post('/news/sentiment/bulk')
        .send({ symbols: stockSymbols })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(stockSymbols.length);

          res.body.forEach((item: any) => {
            expect(item).toHaveProperty('symbol');
            expect(item).toHaveProperty('avgSentiment');
            expect(item).toHaveProperty('newsCount');
            expect(item).toHaveProperty('lastProcessed');
            expect(stockSymbols).toContain(item.symbol);
          });
        });
    });

    it('/news/sentiment/bulk (POST) should validate request body', () => {
      return request(app.getHttpServer())
        .post('/news/sentiment/bulk')
        .send({}) // Missing symbols
        .expect(400);
    });
  });

  describe('Paper Trading API', () => {
    let portfolioId: number;

    it('/paper-trading/portfolios (POST) should create portfolio', () => {
      return request(app.getHttpServer())
        .post('/paper-trading/portfolios')
        .send({
          name: 'Test Portfolio',
          initialCash: 10000,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('name', 'Test Portfolio');
          expect(res.body).toHaveProperty('initialCash', 10000);
          expect(res.body).toHaveProperty('currentCash', 10000);
          portfolioId = res.body.id;
        });
    });

    it('/paper-trading/portfolios (GET) should return all portfolios', () => {
      return request(app.getHttpServer())
        .get('/paper-trading/portfolios')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('id');
            expect(res.body[0]).toHaveProperty('name');
            expect(res.body[0]).toHaveProperty('initialCash');
            expect(res.body[0]).toHaveProperty('currentCash');
          }
        });
    });
    it('/paper-trading/portfolios/:id (GET) should return specific portfolio', async () => {
      if (!portfolioId) {
        return; // Skip test if portfolio not created
      }

      return request(app.getHttpServer())
        .get(`/paper-trading/portfolios/${portfolioId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', portfolioId);
          expect(res.body).toHaveProperty('name');
          expect(res.body).toHaveProperty('positions');
          expect(res.body).toHaveProperty('trades');
        });
    });

    it('/paper-trading/trades (POST) should create a trade', async () => {
      if (!portfolioId) {
        return; // Skip test if portfolio not created
      }

      return request(app.getHttpServer())
        .post('/paper-trading/trades')
        .send({
          portfolioId,
          symbol: 'AAPL',
          type: 'buy',
          quantity: 10,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('portfolioId', portfolioId);
          expect(res.body).toHaveProperty('symbol', 'AAPL');
          expect(res.body).toHaveProperty('type', 'buy');
          expect(res.body).toHaveProperty('quantity', 10);
          expect(res.body).toHaveProperty('status');
        });
    });

    it('/paper-trading/trades (POST) should validate trade request', () => {
      return request(app.getHttpServer())
        .post('/paper-trading/trades')
        .send({
          portfolioId: 999999, // Non-existent portfolio
          symbol: 'AAPL',
          type: 'buy',
          quantity: 10,
        })
        .expect(400);
    });
    it('/paper-trading/portfolios/:id/positions (GET) should return positions', async () => {
      if (!portfolioId) {
        return; // Skip test if portfolio not created
      }

      return request(app.getHttpServer())
        .get(`/paper-trading/portfolios/${portfolioId}/positions`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('/paper-trading/portfolios/:id/trades (GET) should return trade history', async () => {
      if (!portfolioId) {
        return; // Skip test if portfolio not created
      }

      return request(app.getHttpServer())
        .get(`/paper-trading/portfolios/${portfolioId}/trades`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('ML Analysis API', () => {
    it('/ml/analyze/:symbol (GET) should return ML analysis', () => {
      return request(app.getHttpServer())
        .get('/ml/analyze/AAPL')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('symbol', 'AAPL');
          expect(res.body).toHaveProperty('predictions');
          expect(res.body).toHaveProperty('confidence');
          expect(res.body).toHaveProperty('analysis');
        });
    });

    it('/ml/train (POST) should trigger model training', () => {
      return request(app.getHttpServer())
        .post('/ml/train')
        .send({ symbols: ['AAPL', 'GOOGL'] })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('message');
        });
    });
  });

  describe('WebSocket Gateway', () => {
    it('should handle WebSocket connections', (done) => {
      // This is a basic test - in a real app you'd use socket.io-client
      // to test WebSocket functionality
      const io = require('socket.io-client');
      const client = io('http://localhost:3000');

      client.on('connect', () => {
        client.on('stock_update', (data: any) => {
          expect(data).toBeDefined();
          client.disconnect();
          done();
        });
      });

      client.on('connect_error', (error: Error) => {
        client.disconnect();
        done.fail(error);
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', () => {
      return request(app.getHttpServer())
        .get('/non-existent-endpoint')
        .expect(404);
    });

    it('should handle malformed JSON', () => {
      return request(app.getHttpServer())
        .post('/news/sentiment/bulk')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);
    });

    it('should validate required parameters', () => {
      return request(app.getHttpServer())
        .get('/stocks/') // Missing symbol
        .expect(404);
    });
  });

  describe('Rate Limiting and Performance', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array(10)
        .fill(null)
        .map(() => request(app.getHttpServer()).get('/stocks').expect(200));

      const responses = await Promise.all(requests);
      responses.forEach((response) => {
        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    it('should respond within reasonable time', () => {
      const start = Date.now();

      return request(app.getHttpServer())
        .get('/stocks')
        .expect(200)
        .expect(() => {
          const duration = Date.now() - start;
          expect(duration).toBeLessThan(5000); // 5 seconds max
        });
    });
  });

  describe('CORS and Security Headers', () => {
    it('should include CORS headers', () => {
      return request(app.getHttpServer())
        .options('/stocks')
        .expect(200)
        .expect('Access-Control-Allow-Origin', '*');
    });

    it('should handle preflight requests', () => {
      return request(app.getHttpServer())
        .options('/paper-trading/trades')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type')
        .expect(200);
    });
  });
});
