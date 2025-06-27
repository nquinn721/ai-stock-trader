import { Module } from '@nestjs/common';
import { DataIntelligenceController } from './data-intelligence.controller';
import { DataIntelligenceService } from './data-intelligence.service';
import { StreamProcessingService } from './stream-processing.service';

/**
 * S48: Enterprise-Grade Real-Time Data Intelligence Platform
 * Data Intelligence Module - Provides institutional-grade market data processing
 */
@Module({
  imports: [],
  controllers: [DataIntelligenceController],
  providers: [DataIntelligenceService, StreamProcessingService],
  exports: [DataIntelligenceService, StreamProcessingService],
})
export class DataIntelligenceModule {}
