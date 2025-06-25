import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { MarketScannerController } from './market-scanner.controller';
import { MarketScannerService } from './services/market-scanner.service';
import { TechnicalIndicatorService } from './services/technical-indicator.service';
import { ScreenerTemplate, MarketAlert, ScanResult } from './entities/scanner.entity';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScreenerTemplate, MarketAlert, ScanResult]),
    ScheduleModule.forRoot(),
    forwardRef(() => StockModule),
  ],
  controllers: [MarketScannerController],
  providers: [MarketScannerService, TechnicalIndicatorService],
  exports: [MarketScannerService, TechnicalIndicatorService],
})
export class MarketScannerModule {}
