import { Module } from '@nestjs/common';
// Removed TypeORM imports since we're using mock data
import { NewsController } from './news.controller';
import { NewsService } from './news.service';

@Module({
  imports: [
    // Removed TypeOrmModule.forFeature([News, Stock]) since we're using mock data
  ],
  controllers: [NewsController],
  providers: [NewsService],
  exports: [NewsService],
})
export class NewsModule {}
