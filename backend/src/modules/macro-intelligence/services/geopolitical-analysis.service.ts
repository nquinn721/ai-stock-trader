import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ConflictRiskAssessment as ConflictEntity,
  ElectionPrediction as ElectionEntity,
  PoliticalStabilityScore,
} from '../entities/geopolitical.entities';
import {
  ConflictData,
  ConflictRiskAssessment,
  ElectionData,
  ElectionPrediction,
  RefugeeFlowPrediction,
  RegimeChangeRisk,
  SafeHavenAnalysis,
  SanctionData,
  SanctionsImpact,
  StabilityScore,
  TensionAnalysis,
  TradeWarAnalysis,
} from '../interfaces/geopolitical.interfaces';

/**
 * S51: Geopolitical Analysis Service
 * Political risk assessment and geopolitical intelligence system
 */
@Injectable()
export class GeopoliticalAnalysisService {
  private readonly logger = new Logger(GeopoliticalAnalysisService.name);

  constructor(
    @InjectRepository(PoliticalStabilityScore)
    private stabilityRepository: Repository<PoliticalStabilityScore>,
    @InjectRepository(ElectionEntity)
    private electionRepository: Repository<ElectionEntity>,
    @InjectRepository(ConflictEntity)
    private conflictRepository: Repository<ConflictEntity>,
  ) {}

  /**
   * Assess political stability for a country
   */
  async assessPoliticalStability(country: string): Promise<StabilityScore> {
    try {
      this.logger.log(`Assessing political stability for ${country}`);

      const overall = this.calculateOverallStability(country);
      const components = this.analyzeStabilityComponents(country);
      const trends = this.analyzeStabilityTrends(country);
      const risks = this.identifyStabilityRisks(country);
      const stabilizers = this.identifyStabilizers(country);

      const stabilityScore: StabilityScore = {
        country,
        overall,
        components,
        trends,
        risks,
        stabilizers,
        timestamp: new Date(),
      };

      // Save to database
      const entity = this.stabilityRepository.create({
        country,
        overall,
        components,
        trends,
        risks,
        stabilizers,
      });
      await this.stabilityRepository.save(entity);

      return stabilityScore;
    } catch (error) {
      this.logger.error(
        `Error assessing political stability for ${country}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Predict election outcomes
   */
  async predictElectionOutcome(
    election: ElectionData,
  ): Promise<ElectionPrediction> {
    try {
      this.logger.log(
        `Predicting election outcome for ${election.country} ${election.type} election`,
      );

      const predictions = this.generateElectionPredictions(election);
      const scenarios = this.generateElectionScenarios(election);
      const keyFactors = this.identifyElectionFactors(election);
      const uncertainty = this.calculateElectionUncertainty(election);

      const prediction: ElectionPrediction = {
        election,
        predictions,
        scenarios,
        keyFactors,
        uncertainty,
        timestamp: new Date(),
      };

      // Save to database
      const entity = this.electionRepository.create({
        country: election.country,
        electionType: election.type,
        electionDate: election.date,
        predictions,
        scenarios,
        keyFactors,
        uncertainty,
      });
      await this.electionRepository.save(entity);

      return prediction;
    } catch (error) {
      this.logger.error(
        `Error predicting election outcome for ${election.country}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Analyze regime change risk
   */
  async analyzeRegimeChangeRisk(country: string): Promise<RegimeChangeRisk> {
    try {
      this.logger.log(`Analyzing regime change risk for ${country}`);

      const riskLevel = this.assessRegimeChangeRiskLevel(country);
      const probability = this.calculateRegimeChangeProbability(country);
      const triggers = this.identifyRegimeChangeTriggers(country);
      const earlyWarnings = this.monitorEarlyWarnings(country);
      const marketImpact = this.assessRegimeChangeMarketImpact(country);

      return {
        country,
        riskLevel,
        probability,
        triggers,
        earlyWarnings,
        marketImpact,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Error analyzing regime change risk for ${country}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Analyze trade war impact
   */
  async analyzeTradeWarImpact(countries: string[]): Promise<TradeWarAnalysis> {
    try {
      this.logger.log(
        `Analyzing trade war impact between countries: ${countries.join(', ')}`,
      );

      const escalation = this.assessTradeWarEscalation(countries);
      const measures = this.analyzeTradeMeasures(countries);
      const economicImpact = this.assessTradeWarEconomicImpact(countries);
      const marketImpact = this.assessTradeWarMarketImpact(countries);
      const resolution = this.assessTradeWarResolution(countries);

      return {
        countries,
        escalation,
        measures,
        economicImpact,
        marketImpact,
        resolution,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Error analyzing trade war impact:', error);
      throw error;
    }
  }

  /**
   * Assess sanctions impact
   */
  async assessSanctionsImpact(
    sanctions: SanctionData,
  ): Promise<SanctionsImpact> {
    try {
      this.logger.log(`Assessing sanctions impact on ${sanctions.target}`);

      const effectiveness = this.assessSanctionsEffectiveness(sanctions);
      const economicImpact = this.assessSanctionsEconomicImpact(sanctions);
      const marketEffects = this.assessSanctionsMarketEffects(sanctions);
      const adaptation = this.analyzeSanctionsAdaptation(sanctions);
      const duration = this.estimateSanctionsDuration(sanctions);

      return {
        sanctions,
        effectiveness,
        economicImpact,
        marketEffects,
        adaptation,
        duration,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Error assessing sanctions impact on ${sanctions.target}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Predict diplomatic tensions
   */
  async predictDiplomaticTensions(region: string): Promise<TensionAnalysis> {
    try {
      this.logger.log(`Predicting diplomatic tensions in ${region}`);

      const tensionLevel = this.assessTensionLevel(region);
      const sources = this.identifyTensionSources(region);
      const escalationRisk = this.assessEscalationRisk(region);
      const economicImpact = this.assessTensionEconomicImpact(region);
      const marketImpact = this.assessTensionMarketImpact(region);
      const resolution = this.analyzeResolutionPaths(region);

      return {
        region,
        tensionLevel,
        sources,
        escalationRisk,
        economicImpact,
        marketImpact,
        resolution,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Error predicting diplomatic tensions in ${region}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Assess conflict risk
   */
  async assessConflictRisk(regions: string[]): Promise<ConflictRiskAssessment> {
    try {
      this.logger.log(
        `Assessing conflict risk for regions: ${regions.join(', ')}`,
      );

      const riskLevel = this.assessOverallConflictRisk(regions);
      const conflictTypes = this.analyzeConflictTypes(regions);
      const drivers = this.identifyConflictDrivers(regions);
      const timeframe = this.assessConflictTimeframe(regions);
      const spilloverRisk = this.assessSpilloverRisk(regions);
      const preventionMeasures = this.identifyPreventionMeasures(regions);

      const assessment: ConflictRiskAssessment = {
        regions,
        riskLevel,
        conflictTypes,
        drivers,
        timeframe,
        spilloverRisk,
        preventionMeasures,
        timestamp: new Date(),
      };

      // Save to database
      const entity = this.conflictRepository.create({
        regions,
        riskLevel,
        conflictTypes,
        drivers,
        timeframe,
        spilloverRisk,
        preventionMeasures,
      });
      await this.conflictRepository.save(entity);

      return assessment;
    } catch (error) {
      this.logger.error('Error assessing conflict risk:', error);
      throw error;
    }
  }

  /**
   * Analyze safe haven flows
   */
  async analyzeSafeHavenFlows(eventType: string): Promise<SafeHavenAnalysis> {
    try {
      this.logger.log(
        `Analyzing safe haven flows for event type: ${eventType}`,
      );

      const safeHavens = this.identifySafeHavens(eventType);
      const flows = this.calculateFlowPatterns(eventType);
      const priceImpact = this.assessSafeHavenPriceImpact(eventType);
      const conditions = this.assessSafeHavenConditions(eventType);
      const historicalComparison =
        this.getHistoricalSafeHavenComparisons(eventType);

      return {
        eventType,
        safeHavens,
        flows,
        priceImpact,
        conditions,
        historicalComparison,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Error analyzing safe haven flows for ${eventType}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Predict refugee flows
   */
  async predictRefugeeFlows(
    conflict: ConflictData,
  ): Promise<RefugeeFlowPrediction> {
    try {
      this.logger.log(
        `Predicting refugee flows from conflict in ${conflict.regions.join(', ')}`,
      );

      const projections = this.generateRefugeeProjections(conflict);
      const economicImpact = this.assessRefugeeEconomicImpact(
        conflict,
        projections,
      );
      const marketEffects = this.assessRefugeeMarketEffects(conflict);
      const policyResponse = this.predictPolicyResponse(conflict, projections);

      return {
        conflict,
        projections,
        economicImpact,
        marketEffects,
        policyResponse,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Error predicting refugee flows:', error);
      throw error;
    }
  }

  // Private helper methods

  private calculateOverallStability(country: string): number {
    // Simulate political stability calculation
    const baseStability = { US: 85, Germany: 88, UK: 82, China: 65 };
    return baseStability[country] || 70 + Math.random() * 20;
  }

  private analyzeStabilityComponents(country: string): any {
    return {
      political: 75 + Math.random() * 20,
      economic: 80 + Math.random() * 15,
      social: 78 + Math.random() * 18,
      security: 82 + Math.random() * 16,
    };
  }

  private analyzeStabilityTrends(country: string): any {
    return {
      shortTerm: Math.random() * 20 - 10, // -10 to +10
      mediumTerm: Math.random() * 15 - 7.5,
      longTerm: Math.random() * 10 - 5,
    };
  }

  private identifyStabilityRisks(country: string): any[] {
    return [
      { type: 'Economic inequality', probability: 0.3, impact: 0.4 },
      { type: 'Political polarization', probability: 0.5, impact: 0.6 },
      { type: 'Social unrest', probability: 0.2, impact: 0.3 },
    ];
  }

  private identifyStabilizers(country: string): string[] {
    return [
      'Strong institutions',
      'Economic growth',
      'Social cohesion',
      'International support',
    ];
  }

  private generateElectionPredictions(election: ElectionData): any[] {
    return election.candidates.map((candidate) => ({
      candidate: candidate.name,
      winProbability: Math.random(),
      voteShare: 20 + Math.random() * 40,
      confidence: 0.7 + Math.random() * 0.25,
    }));
  }

  private generateElectionScenarios(election: ElectionData): any[] {
    return [
      {
        scenario: 'Incumbent victory',
        probability: 0.45,
        marketImpact: { stocks: 0.02, bonds: 0.01, currency: 0.015 },
      },
      {
        scenario: 'Opposition victory',
        probability: 0.35,
        marketImpact: { stocks: -0.03, bonds: -0.02, currency: -0.025 },
      },
      {
        scenario: 'Hung parliament',
        probability: 0.2,
        marketImpact: { stocks: -0.05, bonds: 0.02, currency: -0.03 },
      },
    ];
  }

  private identifyElectionFactors(election: ElectionData): string[] {
    return [
      'Economic performance',
      'Foreign policy stance',
      'Social issues',
      'Candidate popularity',
      'Campaign effectiveness',
    ];
  }

  private calculateElectionUncertainty(election: ElectionData): number {
    return 0.2 + Math.random() * 0.4; // 20-60% uncertainty
  }

  private assessRegimeChangeRiskLevel(
    country: string,
  ): 'low' | 'medium' | 'high' | 'critical' {
    const riskLevels: ('low' | 'medium' | 'high' | 'critical')[] = [
      'low',
      'medium',
      'high',
      'critical',
    ];
    return riskLevels[Math.floor(Math.random() * riskLevels.length)];
  }

  private calculateRegimeChangeProbability(country: string): any {
    return {
      sixMonth: Math.random() * 0.1,
      oneYear: Math.random() * 0.2,
      twoYear: Math.random() * 0.4,
    };
  }

  private identifyRegimeChangeTriggers(country: string): any {
    return {
      economic: ['Economic collapse', 'Hyperinflation', 'Mass unemployment'],
      political: [
        'Electoral fraud',
        'Corruption scandals',
        'Authoritarian overreach',
      ],
      social: ['Mass protests', 'Ethnic tensions', 'Religious conflicts'],
    };
  }

  private monitorEarlyWarnings(country: string): any[] {
    return [
      { indicator: 'Protest activity', status: 'green', trend: 0.1 },
      { indicator: 'Military loyalty', status: 'yellow', trend: -0.2 },
      { indicator: 'Economic conditions', status: 'yellow', trend: -0.3 },
    ];
  }

  private assessRegimeChangeMarketImpact(country: string): any {
    return {
      equities: -0.15,
      bonds: -0.25,
      currency: -0.3,
      commodities: 0.05,
    };
  }

  private assessTradeWarEscalation(countries: string[]): any {
    return {
      current: 0.6,
      trend: 0.1,
      forecast: 0.7,
    };
  }

  private analyzeTradeMeasures(countries: string[]): any[] {
    return [
      { type: 'Tariffs', sectors: ['Technology', 'Steel'], impact: 0.4 },
      { type: 'Quotas', sectors: ['Textiles'], impact: 0.3 },
      {
        type: 'Export restrictions',
        sectors: ['Critical minerals'],
        impact: 0.6,
      },
    ];
  }

  private assessTradeWarEconomicImpact(countries: string[]): any[] {
    return countries.map((country) => ({
      country,
      gdpImpact: -0.5 - Math.random() * 1.0,
      inflationImpact: 0.2 + Math.random() * 0.5,
      sectorsAffected: ['Manufacturing', 'Technology', 'Agriculture'],
    }));
  }

  private assessTradeWarMarketImpact(countries: string[]): any {
    return {
      global: -0.03,
      regional: [
        { region: 'Asia', impact: -0.05 },
        { region: 'North America', impact: -0.02 },
        { region: 'Europe', impact: -0.01 },
      ],
      sectors: [
        { sector: 'Technology', impact: -0.08 },
        { sector: 'Manufacturing', impact: -0.06 },
        { sector: 'Agriculture', impact: -0.04 },
      ],
    };
  }

  private assessTradeWarResolution(countries: string[]): any {
    return {
      probability: 0.4,
      timeframe: '12-18 months',
      conditions: [
        'Mutual economic pain',
        'Political changes',
        'Third-party mediation',
      ],
    };
  }

  private assessSanctionsEffectiveness(sanctions: SanctionData): any {
    return {
      economic: 0.6,
      political: 0.3,
      overall: 0.45,
    };
  }

  private assessSanctionsEconomicImpact(sanctions: SanctionData): any {
    return {
      target: {
        gdpImpact: -2.5,
        tradeImpact: -15.0,
        financialImpact: -8.0,
      },
      imposers: sanctions.imposer.map((country) => ({
        country,
        impact: -0.1 - Math.random() * 0.3,
      })),
      global: -0.05,
    };
  }

  private assessSanctionsMarketEffects(sanctions: SanctionData): any {
    return {
      commodities: [
        { commodity: 'Oil', impact: 0.15 },
        { commodity: 'Gas', impact: 0.25 },
        { commodity: 'Wheat', impact: 0.1 },
      ],
      currencies: [
        { currency: 'USD', impact: 0.02 },
        { currency: 'EUR', impact: -0.01 },
      ],
      sectors: [
        { sector: 'Energy', impact: 0.08 },
        { sector: 'Defense', impact: 0.05 },
        { sector: 'Technology', impact: -0.03 },
      ],
    };
  }

  private analyzeSanctionsAdaptation(sanctions: SanctionData): any {
    return {
      workarounds: [
        'Alternative payment systems',
        'Third-party intermediaries',
        'Barter trade',
      ],
      newPartnerships: ['Non-aligned countries', 'Regional allies'],
      effectiveness: 0.4,
    };
  }

  private estimateSanctionsDuration(sanctions: SanctionData): any {
    return {
      expected: 24, // months
      factors: [
        'Political change',
        'Economic pressure',
        'International mediation',
      ],
    };
  }

  private assessTensionLevel(region: string): number {
    return 0.3 + Math.random() * 0.5; // 30-80% tension level
  }

  private identifyTensionSources(region: string): any[] {
    return [
      {
        type: 'Territorial disputes',
        description: 'Border conflicts',
        severity: 0.6,
      },
      {
        type: 'Trade disputes',
        description: 'Economic competition',
        severity: 0.4,
      },
      {
        type: 'Political differences',
        description: 'Ideological conflicts',
        severity: 0.5,
      },
    ];
  }

  private assessEscalationRisk(region: string): any {
    return {
      probability: 0.3,
      timeframe: '6-12 months',
      triggers: [
        'Military incidents',
        'Political provocations',
        'Economic measures',
      ],
    };
  }

  private assessTensionEconomicImpact(region: string): any {
    return {
      trade: -0.05,
      investment: -0.08,
      growth: -0.03,
    };
  }

  private assessTensionMarketImpact(region: string): any {
    return {
      volatility: 0.15,
      safeHaven: 0.25,
      sectors: [
        { sector: 'Defense', impact: 0.06 },
        { sector: 'Tourism', impact: -0.04 },
        { sector: 'Technology', impact: -0.02 },
      ],
    };
  }

  private analyzeResolutionPaths(region: string): any {
    return {
      paths: [
        'Diplomatic negotiation',
        'Economic cooperation',
        'Third-party mediation',
      ],
      probability: [
        { path: 'Diplomatic negotiation', chance: 0.4 },
        { path: 'Economic cooperation', chance: 0.3 },
        { path: 'Third-party mediation', chance: 0.3 },
      ],
    };
  }

  private assessOverallConflictRisk(
    regions: string[],
  ): 'low' | 'medium' | 'high' | 'critical' {
    const riskLevels: ('low' | 'medium' | 'high' | 'critical')[] = [
      'low',
      'medium',
      'high',
      'critical',
    ];
    return riskLevels[Math.floor(Math.random() * riskLevels.length)];
  }

  private analyzeConflictTypes(regions: string[]): any[] {
    return [
      { type: 'territorial', probability: 0.3, severity: 0.7 },
      { type: 'economic', probability: 0.5, severity: 0.4 },
      { type: 'ideological', probability: 0.2, severity: 0.6 },
    ];
  }

  private identifyConflictDrivers(regions: string[]): any[] {
    return [
      {
        category: 'Resource competition',
        factors: ['Water rights', 'Mineral deposits'],
        intensity: 0.6,
      },
      {
        category: 'Historical grievances',
        factors: ['Past conflicts', 'Cultural disputes'],
        intensity: 0.4,
      },
      {
        category: 'Economic inequality',
        factors: ['Development gaps', 'Trade imbalances'],
        intensity: 0.5,
      },
    ];
  }

  private assessConflictTimeframe(regions: string[]): any {
    return {
      immediate: 0.1,
      shortTerm: 0.3,
      mediumTerm: 0.5,
    };
  }

  private assessSpilloverRisk(regions: string[]): any {
    return {
      regions: ['Adjacent regions', 'Allied countries'],
      probability: 0.4,
      impact: 0.6,
    };
  }

  private identifyPreventionMeasures(regions: string[]): string[] {
    return [
      'Diplomatic engagement',
      'Economic cooperation',
      'Conflict mediation',
      'International monitoring',
    ];
  }

  private identifySafeHavens(eventType: string): any[] {
    return [
      { asset: 'Gold', strength: 0.8, duration: 'Long-term', capacity: 0.9 },
      { asset: 'USD', strength: 0.7, duration: 'Medium-term', capacity: 0.8 },
      {
        asset: 'Swiss Franc',
        strength: 0.6,
        duration: 'Short-term',
        capacity: 0.6,
      },
      {
        asset: 'US Treasuries',
        strength: 0.9,
        duration: 'Long-term',
        capacity: 0.7,
      },
    ];
  }

  private calculateFlowPatterns(eventType: string): any {
    return {
      from: ['Emerging markets', 'European markets', 'Asian markets'],
      to: ['US markets', 'Swiss markets', 'Gold'],
      magnitude: 0.15,
    };
  }

  private assessSafeHavenPriceImpact(eventType: string): any[] {
    return [
      { asset: 'Gold', impact: 0.05, timeframe: 'Immediate' },
      { asset: 'USD', impact: 0.03, timeframe: 'Short-term' },
      { asset: 'US Treasuries', impact: 0.02, timeframe: 'Medium-term' },
    ];
  }

  private assessSafeHavenConditions(eventType: string): any {
    return {
      optimal: [
        'Market uncertainty',
        'Currency instability',
        'Geopolitical tensions',
      ],
      deteriorating: [
        'Central bank intervention',
        'Economic recovery',
        'Risk appetite return',
      ],
    };
  }

  private getHistoricalSafeHavenComparisons(eventType: string): any[] {
    return [
      {
        event: '2008 Financial Crisis',
        similarity: 0.7,
        outcome: 'Strong safe haven performance',
      },
      {
        event: '2020 COVID-19',
        similarity: 0.5,
        outcome: 'Mixed safe haven performance',
      },
      {
        event: '2011 European Crisis',
        similarity: 0.6,
        outcome: 'Moderate safe haven flows',
      },
    ];
  }

  private generateRefugeeProjections(conflict: ConflictData): any[] {
    return [
      {
        timeframe: '3 months',
        numbers: 500000,
        destinations: [
          { country: 'Neighboring Country A', percentage: 60 },
          { country: 'Neighboring Country B', percentage: 30 },
          { country: 'International Community', percentage: 10 },
        ],
      },
      {
        timeframe: '1 year',
        numbers: 1200000,
        destinations: [
          { country: 'Neighboring Country A', percentage: 45 },
          { country: 'Neighboring Country B', percentage: 25 },
          { country: 'International Community', percentage: 30 },
        ],
      },
    ];
  }

  private assessRefugeeEconomicImpact(
    conflict: ConflictData,
    projections: any[],
  ): any {
    return {
      origin: {
        laborMarket: -0.15,
        consumption: -0.2,
        investment: -0.25,
      },
      destination: [
        {
          country: 'Neighboring Country A',
          fiscalImpact: -0.02,
          laborImpact: 0.01,
          socialImpact: -0.01,
        },
        {
          country: 'Neighboring Country B',
          fiscalImpact: -0.015,
          laborImpact: 0.005,
          socialImpact: -0.008,
        },
      ],
    };
  }

  private assessRefugeeMarketEffects(conflict: ConflictData): any {
    return {
      currencies: [
        { currency: 'Origin Currency', impact: -0.1 },
        { currency: 'Destination Currency A', impact: -0.02 },
      ],
      bonds: [
        { country: 'Origin Country', impact: -0.15 },
        { country: 'Destination Country A', impact: -0.01 },
      ],
      sectors: [
        { sector: 'Defense', impact: 0.03 },
        { sector: 'Healthcare', impact: 0.02 },
        { sector: 'Construction', impact: 0.01 },
      ],
    };
  }

  private predictPolicyResponse(
    conflict: ConflictData,
    projections: any[],
  ): any[] {
    return [
      {
        country: 'Neighboring Country A',
        measures: [
          'Border controls',
          'Humanitarian aid',
          'International assistance',
        ],
        effectiveness: 0.6,
      },
      {
        country: 'International Community',
        measures: ['UN resolutions', 'Humanitarian funding', 'Peacekeeping'],
        effectiveness: 0.4,
      },
    ];
  }
}
