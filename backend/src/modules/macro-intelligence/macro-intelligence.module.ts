import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MacroIntelligenceController } from './controllers/macro-intelligence.controller';
import { EconomicIntelligenceService } from './services/economic-intelligence.service';
import { MonetaryPolicyService } from './services/monetary-policy.service';
import { GeopoliticalAnalysisService } from './services/geopolitical-analysis.service';
import {
  EconomicForecast,
  BusinessCycle,
  RecessionProbability,
} from './entities/economic.entities';
import {
  MonetaryPolicyPrediction,
  PolicyStanceAnalysis,
  QEProbabilityAssessment,
} from './entities/monetary-policy.entities';
import {
  PoliticalStabilityScore,
  ElectionPrediction,
  ConflictRiskAssessment,
} from './entities/geopolitical.entities';

/**
 * S51: Macro Intelligence Module
 * Comprehensive macroeconomic intelligence and geopolitical analysis system
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      // Economic entities
      EconomicForecast,
      BusinessCycle,
      RecessionProbability,
      // Monetary policy entities
      MonetaryPolicyPrediction,
      PolicyStanceAnalysis,
      QEProbabilityAssessment,
      // Geopolitical entities
      PoliticalStabilityScore,
      ElectionPrediction,
      ConflictRiskAssessment,
    ]),
  ],
  controllers: [MacroIntelligenceController],
  providers: [
    EconomicIntelligenceService,
    MonetaryPolicyService,
    GeopoliticalAnalysisService,
  ],
  exports: [
    EconomicIntelligenceService,
    MonetaryPolicyService,
    GeopoliticalAnalysisService,
  ],
})
export class MacroIntelligenceModule {}
