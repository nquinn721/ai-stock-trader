import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from '../entities/stock.entity';
import { StockService } from '../modules/stock/stock.service';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    private stockService: StockService,
  ) {}

  async onApplicationBootstrap() {
    await this.seedStocks();
  }
  private async seedStocks() {
    console.log('Seeding stocks...');
    
    const stockListPath = join(__dirname, '../data/stock-list.json');
    const stockList = JSON.parse(readFileSync(stockListPath, 'utf8'));
    
    for (const stockData of stockList) {
      const existingStock = await this.stockRepository.findOne({
        where: { symbol: stockData.symbol },
      });

      if (!existingStock) {
        console.log(`Creating stock: ${stockData.symbol}`);
        const stock = this.stockRepository.create({
          symbol: stockData.symbol,
          name: stockData.name,
          sector: stockData.sector,
          description: stockData.description,
        });

        await this.stockRepository.save(stock);
          // Fetch initial stock data
        try {
          await this.stockService.updateStockPrice(stockData.symbol);
          console.log(`Updated data for: ${stockData.symbol}`);
        } catch (error) {
          console.error(`Error updating ${stockData.symbol}:`, error.message);
        }
      }
    }
    
    console.log('Stock seeding completed');
  }
}
