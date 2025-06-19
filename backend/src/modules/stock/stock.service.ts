import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import yahooFinance from 'yahoo-finance2';
import { StockPrice } from '../../entities/stock-price.entity';
import { Stock } from '../../entities/stock.entity';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    @InjectRepository(StockPrice)
    private stockPriceRepository: Repository<StockPrice>,
  ) {}
  async getAllStocks(): Promise<Stock[]> {
    return this.stockRepository.find();
  }
  async getStockBySymbol(symbol: string): Promise<Stock | null> {
    return this.stockRepository.findOne({ where: { symbol } });
  }
  async updateStockPrice(symbol: string): Promise<Stock | null> {
    try {
      const quote = await yahooFinance.quote(symbol);
      const stock = await this.getStockBySymbol(symbol);

      if (stock && quote) {
        stock.currentPrice = Number(quote.regularMarketPrice) || 0;
        stock.previousClose = Number(quote.regularMarketPreviousClose) || 0;
        stock.changePercent = Number(quote.regularMarketChangePercent) || 0;
        stock.volume = Number(quote.regularMarketVolume) || 0;
        stock.marketCap = Number(quote.marketCap) || 0;

        await this.stockRepository.save(stock);

        // Save historical data
        const stockPrice = this.stockPriceRepository.create({
          stockId: stock.id,
          open: Number(quote.regularMarketOpen) || Number(quote.regularMarketPrice) || 0,
          high: Number(quote.regularMarketDayHigh) || Number(quote.regularMarketPrice) || 0,
          low: Number(quote.regularMarketDayLow) || Number(quote.regularMarketPrice) || 0,
          close: Number(quote.regularMarketPrice) || 0,
          adjustedClose: Number(quote.regularMarketPrice) || 0,
          volume: Number(quote.regularMarketVolume) || 0,
          date: new Date(),
        });

        await this.stockPriceRepository.save(stockPrice);
      }

      return stock;
    } catch (error) {
      console.error(`Error updating stock price for ${symbol}:`, error);
      return null;
    }
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async updateAllStockPrices() {
    const stocks = await this.getAllStocks();

    for (const stock of stocks) {
      await this.updateStockPrice(stock.symbol);
      // Add small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  async getStockHistory(symbol: string, period: string = '1mo'): Promise<any> {
    try {
      const historical = await yahooFinance.historical(symbol, {
        period1: this.getPeriodStartDate(period),
        period2: new Date(),
        interval: '1d' as any,
      });
      return historical;
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error);
      return [];
    }
  }

  private getPeriodStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case '1d':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '1w':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '1mo':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '3mo':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }
}
