import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NewsService } from './news.service';

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get(':symbol')
  @ApiOperation({ summary: 'Get news for a specific stock symbol' })
  @ApiResponse({ status: 200, description: 'News data retrieved successfully' })
  async getNewsForStock(
    @Param('symbol') symbol: string,
    @Query('limit') limit: string = '10',
  ) {
    return await this.newsService.getNewsForStock(symbol, parseInt(limit));
  }

  @Get(':symbol/sentiment')
  @ApiOperation({ summary: 'Get average sentiment for a stock' })
  @ApiResponse({ status: 200, description: 'Sentiment data retrieved successfully' })
  async getStockSentiment(
    @Param('symbol') symbol: string,
    @Query('days') days: string = '7',
  ) {
    const avgSentiment = await this.newsService.getAverageSentiment(symbol, parseInt(days));
    return {
      symbol,
      averageSentiment: avgSentiment,
      days: parseInt(days),
    };
  }
  @Get(':symbol/fetch')
  @ApiOperation({ summary: 'Fetch and analyze new news for a stock' })
  @ApiResponse({ status: 200, description: 'News fetched and analyzed successfully' })
  async fetchAndAnalyzeNews(@Param('symbol') symbol: string) {
    const newsData = await this.newsService.fetchNewsForStock(symbol);
    const savedNews: any[] = [];

    for (const item of newsData.slice(0, 5)) { // Process first 5 items
      try {
        const news = await this.newsService.saveNewsWithSentiment(symbol, item);
        savedNews.push(news);
      } catch (error) {
        console.error('Error saving news:', error);
      }
    }

    return {
      symbol,
      newsSaved: savedNews.length,
      news: savedNews,
    };
  }
}
