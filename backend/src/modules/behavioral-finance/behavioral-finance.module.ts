import { Module } from '@nestjs/common';
import { BehavioralFinanceController } from './behavioral-finance.controller';
import { BehavioralFinanceService } from './behavioral-finance.service';
import { CognitiveAIService } from './cognitive-ai.service';
import { MarketPsychologyService } from './market-psychology.service';

@Module({
  controllers: [BehavioralFinanceController],
  providers: [
    BehavioralFinanceService,
    CognitiveAIService,
    MarketPsychologyService,
  ],
  exports: [
    BehavioralFinanceService,
    CognitiveAIService,
    MarketPsychologyService,
  ],
})
export class BehavioralFinanceModule {}
