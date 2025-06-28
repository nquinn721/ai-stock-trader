import { Module } from '@nestjs/common';
import { EconomicIntelligenceService } from './services/economic-intelligence.service';
import { MonetaryPolicyService } from './services/monetary-policy.service';
// import { GeopoliticalAnalysisService } from './services/geopolitical-analysis.service';
import { EconomicIntelligenceController } from './economic-intelligence.controller';

@Module({
  controllers: [EconomicIntelligenceController],
  providers: [
    EconomicIntelligenceService,
    MonetaryPolicyService,
    // GeopoliticalAnalysisService,
  ],
  exports: [
    EconomicIntelligenceService,
    MonetaryPolicyService,
    // GeopoliticalAnalysisService,
  ],
})
export class EconomicIntelligenceModule {}
