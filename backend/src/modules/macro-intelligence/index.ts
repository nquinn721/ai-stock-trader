// S51: Macro Intelligence Module Exports

// Module
export { MacroIntelligenceModule } from './macro-intelligence.module';

// Controllers
export { MacroIntelligenceController } from './controllers/macro-intelligence.controller';

// Services
export { EconomicIntelligenceService } from './services/economic-intelligence.service';
export { MonetaryPolicyService } from './services/monetary-policy.service';
export { GeopoliticalAnalysisService } from './services/geopolitical-analysis.service';

// Entities
export {
  EconomicForecast,
  BusinessCycle,
  RecessionProbability,
} from './entities/economic.entities';
export {
  MonetaryPolicyPrediction,
  PolicyStanceAnalysis,
  QEProbabilityAssessment,
} from './entities/monetary-policy.entities';
export {
  PoliticalStabilityScore,
  ElectionPrediction,
  ConflictRiskAssessment,
} from './entities/geopolitical.entities';

// Interfaces
export * from './interfaces/economic.interfaces';
export * from './interfaces/monetary-policy.interfaces';
export * from './interfaces/geopolitical.interfaces';
