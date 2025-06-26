import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockModule } from '../stock/stock.module';
import {
  MarketAlert,
  ScanResult,
  ScreenerTemplate,
} from './entities/scanner.entity';
import { MarketScannerController } from './market-scanner.controller';
import { MarketScannerService } from './services/market-scanner.service';
import { TechnicalIndicatorService } from './services/technical-indicator.service';

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
