import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EconomicIntelligenceService } from '../services/economic-intelligence.service';
import { MonetaryPolicyService } from '../services/monetary-policy.service';
import { GeopoliticalAnalysisService } from '../services/geopolitical-analysis.service';
import {
  EconomicForecast,
  BusinessCycle,
  RecessionProbability,
} from '../entities/economic.entities';
import {
  MonetaryPolicyPrediction,
  PolicyStanceAnalysis,
  QEProbabilityAssessment,
} from '../entities/monetary-policy.entities';
import {
  PoliticalStabilityScore,
  ElectionPrediction,
  ConflictRiskAssessment,
} from '../entities/geopolitical.entities';

/**
 * S51: Macro Intelligence Services Tests
 * Test suite for macroeconomic intelligence and geopolitical analysis
 */
describe('S51 Macro Intelligence Services', () => {
  let economicService: EconomicIntelligenceService;
  let monetaryService: MonetaryPolicyService;
  let geopoliticalService: GeopoliticalAnalysisService;

  // Mock repositories
  const mockEconomicForecastRepo = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockBusinessCycleRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockRecessionRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockPolicyPredictionRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockPolicyStanceRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockQERepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockStabilityRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockElectionRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockConflictRepo = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EconomicIntelligenceService,
        MonetaryPolicyService,
        GeopoliticalAnalysisService,
        {
          provide: getRepositoryToken(EconomicForecast),
          useValue: mockEconomicForecastRepo,
        },
        {
          provide: getRepositoryToken(BusinessCycle),
          useValue: mockBusinessCycleRepo,
        },
        {
          provide: getRepositoryToken(RecessionProbability),
          useValue: mockRecessionRepo,
        },
        {
          provide: getRepositoryToken(MonetaryPolicyPrediction),
          useValue: mockPolicyPredictionRepo,
        },
        {
          provide: getRepositoryToken(PolicyStanceAnalysis),
          useValue: mockPolicyStanceRepo,
        },
        {
          provide: getRepositoryToken(QEProbabilityAssessment),
          useValue: mockQERepo,
        },
        {
          provide: getRepositoryToken(PoliticalStabilityScore),
          useValue: mockStabilityRepo,
        },
        {
          provide: getRepositoryToken(ElectionPrediction),
          useValue: mockElectionRepo,
        },
        {
          provide: getRepositoryToken(ConflictRiskAssessment),
          useValue: mockConflictRepo,
        },
      ],
    }).compile();

    economicService = module.get<EconomicIntelligenceService>(EconomicIntelligenceService);
    monetaryService = module.get<MonetaryPolicyService>(MonetaryPolicyService);
    geopoliticalService = module.get<GeopoliticalAnalysisService>(GeopoliticalAnalysisService);
  });

  describe('Economic Intelligence Service', () => {
    it('should be defined', () => {
      expect(economicService).toBeDefined();
    });

    it('should analyze economic indicators for a country', async () => {
      mockEconomicForecastRepo.find.mockResolvedValue([]);

      const result = await economicService.analyzeEconomicIndicators('US');

      expect(result).toBeDefined();
      expect(result.country).toBe('US');
      expect(result.overallHealth).toBeGreaterThanOrEqual(0);
      expect(result.overallHealth).toBeLessThanOrEqual(100);
      expect(result.indicators).toBeInstanceOf(Array);
      expect(result.trends).toBeDefined();
      expect(result.risks).toBeInstanceOf(Array);
      expect(result.opportunities).toBeInstanceOf(Array);
      expect(['positive', 'neutral', 'negative']).toContain(result.outlook);
    });

    it('should predict inflation trends', async () => {
      const result = await economicService.predictInflationTrend('US', '1Y');

      expect(result).toBeDefined();
      expect(result.region).toBe('US');
      expect(result.currentInflation).toBeGreaterThanOrEqual(0);
      expect(result.forecasts).toBeDefined();
      expect(result.forecasts.oneMonth).toBeDefined();
      expect(result.forecasts.threeMonth).toBeDefined();
      expect(result.forecasts.sixMonth).toBeDefined();
      expect(result.forecasts.oneYear).toBeDefined();
      expect(result.drivers).toBeInstanceOf(Array);
      expect(result.risks.upside).toBeInstanceOf(Array);
      expect(result.risks.downside).toBeInstanceOf(Array);
    });

    it('should forecast GDP growth', async () => {
      const result = await economicService.forecastGDPGrowth('US');

      expect(result).toBeDefined();
      expect(result.country).toBe('US');
      expect(result.currentGDP).toBeGreaterThan(0);
      expect(result.growthRate).toBeDefined();
      expect(result.forecasts.nextQuarter).toBeDefined();
      expect(result.forecasts.nextYear).toBeDefined();
      expect(result.forecasts.twoYear).toBeDefined();
      expect(result.sectorsContribution).toBeInstanceOf(Array);
    });

    it('should identify business cycle phase', async () => {
      mockBusinessCycleRepo.create.mockReturnValue({});
      mockBusinessCycleRepo.save.mockResolvedValue({});

      const result = await economicService.identifyBusinessCyclePhase('US');

      expect(result).toBeDefined();
      expect(result.economy).toBe('US');
      expect(['expansion', 'peak', 'contraction', 'trough']).toContain(result.phase);
      expect(result.duration).toBeGreaterThan(0);
      expect(result.strength).toBeGreaterThanOrEqual(0);
      expect(result.strength).toBeLessThanOrEqual(100);
      expect(result.indicators).toBeDefined();
      expect(result.nextPhase).toBeDefined();
    });

    it('should predict recession probability', async () => {
      mockRecessionRepo.create.mockReturnValue({});
      mockRecessionRepo.save.mockResolvedValue({});

      const result = await economicService.predictRecessionProbability('US');

      expect(result).toBeDefined();
      expect(result.country).toBe('US');
      expect(result.probability.sixMonth).toBeGreaterThanOrEqual(0);
      expect(result.probability.sixMonth).toBeLessThanOrEqual(1);
      expect(result.probability.oneYear).toBeGreaterThanOrEqual(0);
      expect(result.probability.oneYear).toBeLessThanOrEqual(1);
      expect(result.probability.twoYear).toBeGreaterThanOrEqual(0);
      expect(result.probability.twoYear).toBeLessThanOrEqual(1);
      expect(result.indicators).toBeInstanceOf(Array);
      expect(result.historicalAccuracy).toBeGreaterThanOrEqual(0);
      expect(result.historicalAccuracy).toBeLessThanOrEqual(1);
    });
  });

  describe('Monetary Policy Service', () => {
    it('should be defined', () => {
      expect(monetaryService).toBeDefined();
    });

    it('should predict interest rate decisions', async () => {
      mockPolicyPredictionRepo.create.mockReturnValue({});
      mockPolicyPredictionRepo.save.mockResolvedValue({});

      const meetingDate = new Date('2025-07-30');
      const result = await monetaryService.predictInterestRateDecision(meetingDate);

      expect(result).toBeDefined();
      expect(result.centralBank).toBe('Federal Reserve');
      expect(result.meetingDate).toEqual(meetingDate);
      expect(result.currentRate).toBeGreaterThanOrEqual(0);
      expect(result.predictions).toBeDefined();
      expect(result.predictions.cut50).toBeGreaterThanOrEqual(0);
      expect(result.predictions.cut50).toBeLessThanOrEqual(1);
      expect(result.predictions.hold).toBeGreaterThanOrEqual(0);
      expect(result.predictions.hold).toBeLessThanOrEqual(1);
      expect(result.factors).toBeInstanceOf(Array);
    });

    it('should assess QE probability', async () => {
      mockQERepo.create.mockReturnValue({});
      mockQERepo.save.mockResolvedValue({});

      const result = await monetaryService.assessQEProbability('Federal Reserve');

      expect(result).toBeDefined();
      expect(result.centralBank).toBe('Federal Reserve');
      expect(result.probability.threeMonth).toBeGreaterThanOrEqual(0);
      expect(result.probability.threeMonth).toBeLessThanOrEqual(1);
      expect(result.factors).toBeDefined();
      expect(result.factors.economic).toBeInstanceOf(Array);
      expect(result.factors.financial).toBeInstanceOf(Array);
      expect(result.factors.political).toBeInstanceOf(Array);
      expect(result.expectedScale).toBeDefined();
      expect(result.marketImpact).toBeDefined();
    });

    it('should model rate change impact', async () => {
      const result = await monetaryService.modelRateChangeImpact(0.25, ['Technology', 'Financials']);

      expect(result).toBeDefined();
      expect(result.rateChange).toBe(0.25);
      expect(result.sectors).toBeInstanceOf(Array);
      expect(result.sectors.length).toBe(2);
      expect(result.currencies).toBeInstanceOf(Array);
      expect(result.bonds).toBeInstanceOf(Array);
      expect(result.commodities).toBeInstanceOf(Array);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Geopolitical Analysis Service', () => {
    it('should be defined', () => {
      expect(geopoliticalService).toBeDefined();
    });

    it('should assess political stability', async () => {
      mockStabilityRepo.create.mockReturnValue({});
      mockStabilityRepo.save.mockResolvedValue({});

      const result = await geopoliticalService.assessPoliticalStability('US');

      expect(result).toBeDefined();
      expect(result.country).toBe('US');
      expect(result.overall).toBeGreaterThanOrEqual(0);
      expect(result.overall).toBeLessThanOrEqual(100);
      expect(result.components).toBeDefined();
      expect(result.components.political).toBeDefined();
      expect(result.components.economic).toBeDefined();
      expect(result.components.social).toBeDefined();
      expect(result.components.security).toBeDefined();
      expect(result.risks).toBeInstanceOf(Array);
      expect(result.stabilizers).toBeInstanceOf(Array);
    });

    it('should analyze conflict risk', async () => {
      mockConflictRepo.create.mockReturnValue({});
      mockConflictRepo.save.mockResolvedValue({});

      const regions = ['Eastern Europe', 'Middle East'];
      const result = await geopoliticalService.assessConflictRisk(regions);

      expect(result).toBeDefined();
      expect(result.regions).toEqual(regions);
      expect(['low', 'medium', 'high', 'critical']).toContain(result.riskLevel);
      expect(result.conflictTypes).toBeInstanceOf(Array);
      expect(result.drivers).toBeInstanceOf(Array);
      expect(result.timeframe).toBeDefined();
      expect(result.spilloverRisk).toBeDefined();
      expect(result.preventionMeasures).toBeInstanceOf(Array);
    });

    it('should analyze safe haven flows', async () => {
      const result = await geopoliticalService.analyzeSafeHavenFlows('geopolitical_crisis');

      expect(result).toBeDefined();
      expect(result.eventType).toBe('geopolitical_crisis');
      expect(result.safeHavens).toBeInstanceOf(Array);
      expect(result.flows).toBeDefined();
      expect(result.flows.from).toBeInstanceOf(Array);
      expect(result.flows.to).toBeInstanceOf(Array);
      expect(result.flows.magnitude).toBeGreaterThanOrEqual(0);
      expect(result.priceImpact).toBeInstanceOf(Array);
      expect(result.conditions).toBeDefined();
      expect(result.historicalComparison).toBeInstanceOf(Array);
    });
  });

  describe('Integration Tests', () => {
    it('should handle multiple concurrent analysis requests', async () => {
      mockEconomicForecastRepo.find.mockResolvedValue([]);
      mockBusinessCycleRepo.create.mockReturnValue({});
      mockBusinessCycleRepo.save.mockResolvedValue({});
      mockStabilityRepo.create.mockReturnValue({});
      mockStabilityRepo.save.mockResolvedValue({});

      const promises = [
        economicService.analyzeEconomicIndicators('US'),
        economicService.identifyBusinessCyclePhase('US'),
        geopoliticalService.assessPoliticalStability('US'),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results[0]).toBeDefined(); // Economic analysis
      expect(results[1]).toBeDefined(); // Business cycle
      expect(results[2]).toBeDefined(); // Political stability
    });

    it('should provide consistent data types across services', async () => {
      mockEconomicForecastRepo.find.mockResolvedValue([]);

      const economicResult = await economicService.analyzeEconomicIndicators('US');
      const inflationResult = await economicService.predictInflationTrend('US', '1Y');

      // Check timestamp consistency
      expect(economicResult.timestamp).toBeInstanceOf(Date);
      expect(inflationResult.timestamp).toBeInstanceOf(Date);

      // Check confidence scores are in valid range
      expect(economicResult.confidence).toBeGreaterThanOrEqual(0);
      expect(economicResult.confidence).toBeLessThanOrEqual(1);
      expect(inflationResult.confidence).toBeGreaterThanOrEqual(0);
      expect(inflationResult.confidence).toBeLessThanOrEqual(1);
    });
  });
});
