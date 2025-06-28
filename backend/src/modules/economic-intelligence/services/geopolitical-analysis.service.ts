import { Injectable, Logger } from '@nestjs/common';
import {
  ConflictRiskAssessment,
  ElectionPrediction,
  StabilityScore,
} from '../interfaces/economic-intelligence.interface';

interface RegimeChangeRisk {
  country: string;
  probability: number;
  timeframe: string;
  triggers: string[];
  impact: 'minimal' | 'moderate' | 'severe';
}

interface TradeWarAnalysis {
  countries: string[];
  escalationProbability: number;
  economicImpact: { [sector: string]: string };
  duration: string;
  resolution: string[];
}

interface SanctionData {
  target: string;
  type: string[];
  severity: 'light' | 'moderate' | 'severe';
  duration: string;
}

interface SanctionsImpact {
  target: string;
  economicDamage: number;
  marketEffects: { [asset: string]: string };
  spilloverRisks: string[];
  effectiveness: number;
}

interface TensionAnalysis {
  region: string;
  tensionLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: string[];
  trajectory: 'escalating' | 'stable' | 'de-escalating';
  marketImpact: string[];
}

interface ElectionData {
  country: string;
  date: Date;
  type: 'presidential' | 'parliamentary' | 'local';
  candidates: any[];
  keyIssues: string[];
}

interface ConflictData {
  region: string;
  parties: string[];
  intensity: 'low' | 'medium' | 'high';
  duration: string;
}

interface SafeHavenAnalysis {
  eventType: string;
  assets: {
    asset: string;
    attractiveness: number;
    reasoning: string;
  }[];
  flowMagnitude: 'small' | 'moderate' | 'large';
  duration: string;
}

interface RefugeeFlowPrediction {
  conflict: ConflictData;
  estimatedNumbers: number;
  destinations: string[];
  timeframe: string;
  economicImpact: { [country: string]: string };
}

@Injectable()
export class GeopoliticalAnalysisService {
  private readonly logger = new Logger(GeopoliticalAnalysisService.name);

  /**
   * Assess political stability for a country
   */
  async assessPoliticalStability(country: string): Promise<StabilityScore> {
    this.logger.log(`Assessing political stability for ${country}`);

    const factors = this.analyzePoliticalFactors(country);
    const score = this.calculateStabilityScore(factors);

    return {
      country,
      score,
      factors,
      trend: this.determineTrend(factors),
      risks: this.identifyStabilityRisks(country, factors),
      marketImpact: this.assessMarketImpact(score),
    };
  }

  /**
   * Predict election outcomes and market implications
   */
  async predictElectionOutcome(
    election: ElectionData,
  ): Promise<ElectionPrediction> {
    this.logger.log(`Predicting election outcome for ${election.country}`);

    const candidates = this.analyzeCandidates(election);
    const marketImplications = this.assessElectionMarketImpact(
      election,
      candidates,
    );

    return {
      country: election.country,
      electionDate: election.date,
      candidates,
      keyIssues: this.identifyKeyElectionIssues(election),
      marketImplications,
      uncertaintyLevel: this.assessElectionUncertainty(candidates),
    };
  }

  /**
   * Analyze regime change risk
   */
  async analyzeRegimeChangeRisk(country: string): Promise<RegimeChangeRisk> {
    this.logger.log(`Analyzing regime change risk for ${country}`);

    const probability = this.calculateRegimeChangeRisk(country);

    return {
      country,
      probability,
      timeframe: this.estimateRegimeChangeTimeframe(probability),
      triggers: this.identifyRegimeChangeTriggers(country),
      impact: this.assessRegimeChangeImpact(probability),
    };
  }

  /**
   * Analyze trade war impact between countries
   */
  async analyzeTradeWarImpact(countries: string[]): Promise<TradeWarAnalysis> {
    this.logger.log(
      `Analyzing trade war impact between ${countries.join(', ')}`,
    );

    const escalationProbability = this.calculateTradeWarEscalation(countries);

    return {
      countries,
      escalationProbability,
      economicImpact: this.assessTradeWarEconomicImpact(countries),
      duration: this.estimateTradeWarDuration(escalationProbability),
      resolution: this.identifyTradeWarResolutionPaths(countries),
    };
  }

  /**
   * Assess sanctions impact on target country and markets
   */
  async assessSanctionsImpact(
    sanctions: SanctionData,
  ): Promise<SanctionsImpact> {
    this.logger.log(`Assessing sanctions impact on ${sanctions.target}`);

    const economicDamage = this.calculateSanctionsEconomicDamage(sanctions);

    return {
      target: sanctions.target,
      economicDamage,
      marketEffects: this.assessSanctionsMarketEffects(sanctions),
      spilloverRisks: this.identifySpilloverRisks(sanctions),
      effectiveness: this.assessSanctionsEffectiveness(sanctions),
    };
  }

  /**
   * Predict diplomatic tensions in a region
   */
  async predictDiplomaticTensions(region: string): Promise<TensionAnalysis> {
    this.logger.log(`Predicting diplomatic tensions in ${region}`);

    const tensionLevel = this.assessCurrentTensions(region);

    return {
      region,
      tensionLevel,
      factors: this.identifyTensionFactors(region),
      trajectory: this.predictTensionTrajectory(region, tensionLevel),
      marketImpact: this.assessTensionMarketImpact(region, tensionLevel),
    };
  }

  /**
   * Assess conflict risk in specific regions
   */
  async assessConflictRisk(regions: string[]): Promise<ConflictRiskAssessment> {
    this.logger.log(`Assessing conflict risk in ${regions.join(', ')}`);

    const riskLevel = this.calculateAggregateConflictRisk(regions);

    return {
      regions,
      riskLevel,
      probability: this.calculateConflictProbability(regions),
      timeframe: this.estimateConflictTimeframe(riskLevel),
      triggers: this.identifyConflictTriggers(regions),
      economicImpact: {
        global: this.assessGlobalEconomicImpact(riskLevel),
        regional: this.assessRegionalEconomicImpact(regions, riskLevel),
        sectors: this.assessSectoralImpact(riskLevel),
      },
      safeHavenAssets: this.identifySafeHavenAssets(riskLevel),
    };
  }

  /**
   * Analyze safe haven flows during geopolitical events
   */
  async analyzeSafeHavenFlows(eventType: string): Promise<SafeHavenAnalysis> {
    this.logger.log(`Analyzing safe haven flows for event type: ${eventType}`);

    const assets = this.rankSafeHavenAssets(eventType);

    return {
      eventType,
      assets,
      flowMagnitude: this.estimateFlowMagnitude(eventType),
      duration: this.estimateFlowDuration(eventType),
    };
  }

  /**
   * Predict refugee flows from conflicts
   */
  async predictRefugeeFlows(
    conflict: ConflictData,
  ): Promise<RefugeeFlowPrediction> {
    this.logger.log(
      `Predicting refugee flows from conflict in ${conflict.region}`,
    );

    const estimatedNumbers = this.estimateRefugeeNumbers(conflict);

    return {
      conflict,
      estimatedNumbers,
      destinations: this.predictDestinations(conflict),
      timeframe: this.estimateRefugeeTimeframe(conflict),
      economicImpact: this.assessRefugeeEconomicImpact(
        conflict,
        estimatedNumbers,
      ),
    };
  }

  /**
   * Assess comprehensive geopolitical risks for a region
   */
  async assessGeopoliticalRisks(
    region?: string,
  ): Promise<
    import('../interfaces/economic-intelligence.interface').GeopoliticalRiskAssessment
  > {
    this.logger.log(
      `Assessing comprehensive geopolitical risks${region ? ` for ${region}` : ' globally'}`,
    );

    const targetRegion = region || 'Global';

    // Use existing methods to build comprehensive assessment
    const conflictRisk = await this.assessConflictRisk([targetRegion]);
    const stabilityScore = await this.assessPoliticalStability(targetRegion);
    const tensions = await this.predictDiplomaticTensions(targetRegion);

    // Create mock events based on region
    const keyEvents = this.generateMockGeopoliticalEvents(targetRegion);

    const overallRisk = Math.round(
      (conflictRisk.probability * 100 +
        (100 - stabilityScore.score) +
        this.getTensionRiskScore(tensions.tensionLevel)) /
        3,
    );

    return {
      region: targetRegion,
      assessmentDate: new Date(),
      overallRisk,
      riskLevel: this.determineRiskLevel(overallRisk),
      keyEvents,
      conflictRisk: conflictRisk.probability * 100,
      politicalStability: stabilityScore.score,
      economicSanctions: {
        active: targetRegion === 'Europe' || targetRegion === 'Global',
        severity: targetRegion === 'Europe' ? 80 : 45,
        impactedSectors: ['energy', 'finance', 'technology'],
      },
      tradeRelations: {
        US: 'stable',
        China: tensions.tensionLevel === 'high' ? 'deteriorating' : 'stable',
        EU: 'stable',
        Russia: 'deteriorating',
      },
      marketImplications: this.generateMarketImplications(
        overallRisk,
        tensions.tensionLevel,
      ),
    };
  }

  /**
   * Analyze comprehensive trade war impact
   */
  async analyzeTradeWarImpactComprehensive(): Promise<any> {
    this.logger.log('Analyzing comprehensive trade war impact');

    const countries = ['US', 'China'];
    const analysis = await this.analyzeTradeWarImpact(countries);

    return {
      participants: countries,
      severity: this.mapSeverity(analysis.escalationProbability),
      affectedSectors: Object.keys(analysis.economicImpact),
      tariffLevel: 15.5, // Mock tariff level
      economicImpact: {
        gdpImpact: -2.5,
        inflationImpact: 1.2,
        tradeVolume: -15.0,
      },
      marketEffects: {
        equities: 'negative',
        currencies: 'positive', // USD benefits
        commodities: 'neutral',
      },
      resolution: {
        probability: 1 - analysis.escalationProbability,
        timeframe: analysis.duration,
        requirements: analysis.resolution,
      },
    };
  }

  /**
   * Analyze sanctions impact for a specific country
   */
  async analyzeSanctionsImpact(country?: string): Promise<any> {
    this.logger.log(
      `Analyzing sanctions impact${country ? ` for ${country}` : ''}`,
    );

    const targetCountry = country || 'Russia';
    const mockSanctions = {
      target: targetCountry,
      type: ['financial', 'energy', 'technology'],
      severity: 'severe' as const,
      duration: 'long-term',
    };

    const impact = await this.assessSanctionsImpact(mockSanctions);

    return {
      targetCountry,
      sanctioningCountries: ['US', 'EU', 'UK', 'Canada'],
      type: 'comprehensive',
      severity: 85,
      sectors: {
        energy: {
          impact: 80,
          adaptationCapability: 40,
          alternativeMarkets: ['China', 'India'],
        },
        finance: {
          impact: 90,
          adaptationCapability: 30,
          alternativeMarkets: ['China'],
        },
      },
      economicEffects: {
        gdpImpact: -8.5,
        inflationEffect: 12.8,
        currencyDevaluation: 42.5,
      },
      marketConsequences: {
        commodityPrices: { oil: 15.5, gas: 25.0, wheat: 12.0 },
        sectorPerformance: { energy: -25.0, finance: -40.0 },
        regionalSpillover: { Europe: -5.5, Asia: -2.0 },
      },
    };
  }

  // Private helper methods for geopolitical analysis
  private analyzePoliticalFactors(country: string): StabilityScore['factors'] {
    return {
      political: this.generatePoliticalScore(country),
      economic: this.generateEconomicScore(country),
      social: this.generateSocialScore(country),
      external: this.generateExternalScore(country),
    };
  }

  private generatePoliticalScore(country: string): number {
    // Simulate political stability scoring (0-100)
    const baseScore = 60 + Math.random() * 40;
    const countryAdjustment = this.getCountryStabilityAdjustment(country);
    return Math.max(0, Math.min(100, baseScore + countryAdjustment));
  }

  private generateEconomicScore(country: string): number {
    return 50 + Math.random() * 50;
  }

  private generateSocialScore(country: string): number {
    return 40 + Math.random() * 60;
  }

  private generateExternalScore(country: string): number {
    return 30 + Math.random() * 70;
  }

  private getCountryStabilityAdjustment(country: string): number {
    // Country-specific stability adjustments
    const adjustments: { [key: string]: number } = {
      US: 20,
      GB: 15,
      DE: 18,
      FR: 12,
      JP: 16,
      CA: 18,
      AU: 17,
      CH: 25,
      NO: 22,
      SE: 20,
    };
    return adjustments[country] || 0;
  }

  private calculateStabilityScore(factors: StabilityScore['factors']): number {
    const weights = {
      political: 0.3,
      economic: 0.25,
      social: 0.25,
      external: 0.2,
    };
    return Object.entries(factors).reduce((sum, [key, value]) => {
      return sum + value * weights[key as keyof typeof weights];
    }, 0);
  }

  private determineTrend(
    factors: StabilityScore['factors'],
  ): 'improving' | 'stable' | 'deteriorating' {
    const trends = ['improving', 'stable', 'deteriorating'] as const;
    return trends[Math.floor(Math.random() * trends.length)];
  }

  private identifyStabilityRisks(
    country: string,
    factors: StabilityScore['factors'],
  ): string[] {
    const risks = [
      'Political polarization',
      'Economic inequality',
      'Social unrest',
      'External pressures',
      'Institutional weakness',
      'Corruption concerns',
    ];
    return risks.slice(0, 2 + Math.floor(Math.random() * 3));
  }

  private assessMarketImpact(
    score: number,
  ): 'positive' | 'neutral' | 'negative' {
    if (score > 70) return 'positive';
    if (score < 40) return 'negative';
    return 'neutral';
  }

  private analyzeCandidates(
    election: ElectionData,
  ): ElectionPrediction['candidates'] {
    const numCandidates = 2 + Math.floor(Math.random() * 3); // 2-4 candidates
    const candidates: ElectionPrediction['candidates'] = [];

    for (let i = 0; i < numCandidates; i++) {
      candidates.push({
        name: `Candidate ${i + 1}`,
        party: `Party ${String.fromCharCode(65 + i)}`,
        probability: Math.random(),
        marketFriendly: Math.random() > 0.4, // 60% chance of being market-friendly
      });
    }

    // Normalize probabilities to sum to 1
    const totalProb = candidates.reduce((sum, c) => sum + c.probability, 0);
    candidates.forEach((c) => (c.probability = c.probability / totalProb));

    return candidates;
  }

  private identifyKeyElectionIssues(election: ElectionData): string[] {
    const issues = [
      'Economic policy',
      'Healthcare reform',
      'Immigration',
      'Climate change',
      'Foreign policy',
      'Tax policy',
      'Trade relations',
      'Social security',
    ];
    return issues.slice(0, 3 + Math.floor(Math.random() * 3));
  }

  private assessElectionMarketImpact(
    election: ElectionData,
    candidates: any[],
  ): ElectionPrediction['marketImplications'] {
    const leadingCandidate = candidates.reduce((prev, current) =>
      prev.probability > current.probability ? prev : current,
    );

    return {
      currency: leadingCandidate.marketFriendly
        ? 'Potential strengthening'
        : 'Potential weakening',
      stocks: leadingCandidate.marketFriendly
        ? 'Likely positive'
        : 'Risk of volatility',
      sectors: {
        Healthcare: leadingCandidate.marketFriendly
          ? 'Neutral'
          : 'Risk of regulation',
        Energy: 'Policy dependent',
        Finance: leadingCandidate.marketFriendly
          ? 'Positive'
          : 'Regulatory risk',
        Technology: 'Antitrust concerns',
      },
    };
  }

  private assessElectionUncertainty(
    candidates: any[],
  ): 'low' | 'medium' | 'high' {
    const maxProbability = Math.max(...candidates.map((c) => c.probability));
    if (maxProbability > 0.6) return 'low';
    if (maxProbability > 0.4) return 'medium';
    return 'high';
  }

  private calculateRegimeChangeRisk(country: string): number {
    const baseRisk = Math.random() * 0.3; // 0-30% base risk
    const countryRiskAdjustment = this.getCountryRegimeRiskAdjustment(country);
    return Math.max(0, Math.min(1, baseRisk + countryRiskAdjustment));
  }

  private getCountryRegimeRiskAdjustment(country: string): number {
    // Lower regime change risk for stable democracies
    const stableCountries = [
      'US',
      'GB',
      'DE',
      'FR',
      'JP',
      'CA',
      'AU',
      'CH',
      'NO',
      'SE',
    ];
    return stableCountries.includes(country) ? -0.15 : 0.05;
  }

  private estimateRegimeChangeTimeframe(probability: number): string {
    if (probability > 0.6) return '6-18 months';
    if (probability > 0.3) return '1-3 years';
    return '3+ years';
  }

  private identifyRegimeChangeTriggers(country: string): string[] {
    const triggers = [
      'Economic crisis',
      'Popular uprising',
      'Military intervention',
      'Electoral dispute',
      'External pressure',
      'Constitutional crisis',
    ];
    return triggers.slice(0, 2 + Math.floor(Math.random() * 3));
  }

  private assessRegimeChangeImpact(
    probability: number,
  ): 'minimal' | 'moderate' | 'severe' {
    if (probability > 0.6) return 'severe';
    if (probability > 0.3) return 'moderate';
    return 'minimal';
  }

  private calculateTradeWarEscalation(countries: string[]): number {
    return Math.random() * 0.7; // 0-70% escalation probability
  }

  private assessTradeWarEconomicImpact(countries: string[]): {
    [sector: string]: string;
  } {
    return {
      Manufacturing: 'Negative impact from tariffs',
      Agriculture: 'Export restrictions likely',
      Technology: 'Supply chain disruption',
      Services: 'Minimal direct impact',
      Energy: 'Potential strategic commodity',
    };
  }

  private estimateTradeWarDuration(escalationProb: number): string {
    if (escalationProb > 0.6) return '2-5 years';
    if (escalationProb > 0.3) return '1-2 years';
    return '6-12 months';
  }

  private identifyTradeWarResolutionPaths(countries: string[]): string[] {
    return [
      'Negotiated settlement',
      'WTO arbitration',
      'Third-party mediation',
      'Economic pressure resolution',
    ];
  }

  private calculateSanctionsEconomicDamage(sanctions: SanctionData): number {
    const severityMultiplier = { light: 0.1, moderate: 0.3, severe: 0.7 };
    return severityMultiplier[sanctions.severity] * 100; // 0-70% economic damage
  }

  private assessSanctionsMarketEffects(sanctions: SanctionData): {
    [asset: string]: string;
  } {
    return {
      Currency: 'Depreciation pressure',
      Bonds: 'Risk premium increase',
      Equities: 'Sector-specific impact',
      Commodities: sanctions.type.includes('energy')
        ? 'Supply disruption'
        : 'Minimal impact',
    };
  }

  private identifySpilloverRisks(sanctions: SanctionData): string[] {
    return [
      'Regional economic contagion',
      'Supply chain disruption',
      'Energy market volatility',
      'Financial system stress',
    ];
  }

  private assessSanctionsEffectiveness(sanctions: SanctionData): number {
    const baseEffectiveness = Math.random() * 0.6; // 0-60% base effectiveness
    const severityBonus = { light: 0, moderate: 0.1, severe: 0.2 };
    return Math.min(1, baseEffectiveness + severityBonus[sanctions.severity]);
  }

  private assessCurrentTensions(
    region: string,
  ): 'low' | 'medium' | 'high' | 'critical' {
    const levels = ['low', 'medium', 'high', 'critical'] as const;
    return levels[Math.floor(Math.random() * levels.length)];
  }

  private identifyTensionFactors(region: string): string[] {
    const factors = [
      'Territorial disputes',
      'Economic competition',
      'Historical grievances',
      'Resource competition',
      'Ideological differences',
      'Alliance dynamics',
    ];
    return factors.slice(0, 2 + Math.floor(Math.random() * 3));
  }

  private predictTensionTrajectory(
    region: string,
    currentLevel: string,
  ): 'escalating' | 'stable' | 'de-escalating' {
    const trajectories = ['escalating', 'stable', 'de-escalating'] as const;
    return trajectories[Math.floor(Math.random() * trajectories.length)];
  }

  private assessTensionMarketImpact(
    region: string,
    tensionLevel: string,
  ): string[] {
    const impacts = [
      'Increased volatility',
      'Safe haven demand',
      'Regional asset selloff',
      'Currency weakness',
      'Risk premium expansion',
    ];

    const numImpacts =
      tensionLevel === 'critical' ? 4 : tensionLevel === 'high' ? 3 : 2;
    return impacts.slice(0, numImpacts);
  }

  private calculateAggregateConflictRisk(
    regions: string[],
  ): 'low' | 'medium' | 'high' | 'critical' {
    const levels = ['low', 'medium', 'high', 'critical'] as const;
    return levels[Math.floor(Math.random() * levels.length)];
  }

  private calculateConflictProbability(regions: string[]): number {
    return Math.random() * 0.4; // 0-40% conflict probability
  }

  private estimateConflictTimeframe(riskLevel: string): string {
    const timeframes = {
      low: '2+ years',
      medium: '1-2 years',
      high: '6-12 months',
      critical: '1-6 months',
    };
    return timeframes[riskLevel as keyof typeof timeframes];
  }

  private identifyConflictTriggers(regions: string[]): string[] {
    const triggers = [
      'Border incidents',
      'Resource disputes',
      'Ethnic tensions',
      'Political instability',
      'Economic pressures',
      'External intervention',
    ];
    return triggers.slice(0, 2 + Math.floor(Math.random() * 3));
  }

  private assessGlobalEconomicImpact(riskLevel: string): string {
    const impacts = {
      low: 'Minimal global impact',
      medium: 'Regional economic disruption',
      high: 'Significant market volatility',
      critical: 'Global recession risk',
    };
    return impacts[riskLevel as keyof typeof impacts];
  }

  private assessRegionalEconomicImpact(
    regions: string[],
    riskLevel: string,
  ): string {
    return `${riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} economic disruption in ${regions.join(', ')}`;
  }

  private assessSectoralImpact(riskLevel: string): {
    [sector: string]: string;
  } {
    const intensity =
      riskLevel === 'critical'
        ? 'Severe'
        : riskLevel === 'high'
          ? 'Significant'
          : 'Moderate';

    return {
      Defense: `${intensity} positive impact`,
      Energy: `${intensity} supply risk`,
      Transportation: `${intensity} disruption risk`,
      Tourism: `${intensity} negative impact`,
      Technology: 'Supply chain concerns',
    };
  }

  private identifySafeHavenAssets(riskLevel: string): string[] {
    const baseAssets = [
      'US Treasury bonds',
      'Gold',
      'US Dollar',
      'Swiss Franc',
    ];
    if (riskLevel === 'critical' || riskLevel === 'high') {
      baseAssets.push('Japanese Yen', 'German Bunds');
    }
    return baseAssets;
  }

  private rankSafeHavenAssets(eventType: string): SafeHavenAnalysis['assets'] {
    const assets = [
      {
        asset: 'Gold',
        attractiveness: 0.8 + Math.random() * 0.2,
        reasoning: 'Traditional store of value during uncertainty',
      },
      {
        asset: 'US Treasury bonds',
        attractiveness: 0.7 + Math.random() * 0.3,
        reasoning: "World's deepest and most liquid bond market",
      },
      {
        asset: 'US Dollar',
        attractiveness: 0.6 + Math.random() * 0.3,
        reasoning: 'Global reserve currency status',
      },
      {
        asset: 'Swiss Franc',
        attractiveness: 0.5 + Math.random() * 0.3,
        reasoning: 'Political neutrality and stability',
      },
      {
        asset: 'Japanese Yen',
        attractiveness: 0.4 + Math.random() * 0.4,
        reasoning: 'Low interest rates and carry trade unwinding',
      },
    ];

    return assets.sort((a, b) => b.attractiveness - a.attractiveness);
  }

  private estimateFlowMagnitude(
    eventType: string,
  ): 'small' | 'moderate' | 'large' {
    const magnitudes = ['small', 'moderate', 'large'] as const;
    return magnitudes[Math.floor(Math.random() * magnitudes.length)];
  }

  private estimateFlowDuration(eventType: string): string {
    const durations = ['Days', 'Weeks', 'Months', 'Quarters'];
    return durations[Math.floor(Math.random() * durations.length)];
  }

  private estimateRefugeeNumbers(conflict: ConflictData): number {
    const baseNumber = 10000;
    const intensityMultiplier = { low: 1, medium: 5, high: 15 };
    return (
      baseNumber * intensityMultiplier[conflict.intensity] * (1 + Math.random())
    );
  }

  private predictDestinations(conflict: ConflictData): string[] {
    // Simulate destination prediction based on geographical and political factors
    const destinations = [
      'Neighboring Country A',
      'Neighboring Country B',
      'Regional Power',
      'International Sanctuary',
    ];
    return destinations.slice(0, 2 + Math.floor(Math.random() * 2));
  }

  private estimateRefugeeTimeframe(conflict: ConflictData): string {
    const timeframes = [
      'Immediate (days)',
      'Short-term (weeks)',
      'Medium-term (months)',
      'Long-term (years)',
    ];
    return timeframes[Math.floor(Math.random() * timeframes.length)];
  }

  private assessRefugeeEconomicImpact(
    conflict: ConflictData,
    numbers: number,
  ): { [country: string]: string } {
    return {
      'Host Country 1':
        numbers > 50000 ? 'Significant fiscal burden' : 'Manageable impact',
      'Host Country 2': 'Short-term economic disruption',
      Region: 'Humanitarian crisis response required',
    };
  }

  private generateMockGeopoliticalEvents(
    region: string,
  ): import('../interfaces/economic-intelligence.interface').GeopoliticalEvent[] {
    const events: import('../interfaces/economic-intelligence.interface').GeopoliticalEvent[] =
      [];

    if (region === 'Global' || region === 'Europe') {
      events.push({
        id: 'ukraine-conflict',
        type: 'conflict' as const,
        country: 'Ukraine',
        region: 'Europe',
        severity: 'critical' as const,
        probability: 0.9,
        timeframe: 'ongoing',
        description: 'Ongoing conflict affecting global markets',
        marketImpact: {
          currencies: { USD: 'positive' as const, EUR: 'negative' as const },
          commodities: { oil: 'positive' as const, wheat: 'positive' as const },
          sectors: {
            defense: 'positive' as const,
            energy: 'negative' as const,
          },
        },
      });
    }

    if (region === 'Global' || region === 'Asia') {
      events.push({
        id: 'taiwan-tensions',
        type: 'diplomatic_crisis' as const,
        country: 'Taiwan',
        region: 'Asia',
        severity: 'high' as const,
        probability: 0.6,
        timeframe: '6-12 months',
        description: 'Rising tensions in Taiwan Strait',
        marketImpact: {
          currencies: { USD: 'positive' as const, CNY: 'negative' as const },
          commodities: { semiconductors: 'negative' as const },
          sectors: {
            technology: 'negative' as const,
            defense: 'positive' as const,
          },
        },
      });
    }

    return events;
  }

  private getTensionRiskScore(tensionLevel: string): number {
    const scoreMap = {
      low: 20,
      medium: 50,
      high: 75,
      critical: 95,
    };
    return scoreMap[tensionLevel] || 50;
  }

  private determineRiskLevel(
    overallRisk: number,
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (overallRisk >= 80) return 'critical';
    if (overallRisk >= 60) return 'high';
    if (overallRisk >= 40) return 'medium';
    return 'low';
  }

  private generateMarketImplications(
    overallRisk: number,
    tensionLevel: string,
  ): string[] {
    const implications: string[] = [];

    if (overallRisk >= 70) {
      implications.push('High volatility expected in risk assets');
      implications.push('Flight to quality supporting USD and treasuries');
      implications.push('Commodity prices likely to remain elevated');
    } else if (overallRisk >= 50) {
      implications.push('Moderate risk-off sentiment in markets');
      implications.push('Selective sector rotation expected');
    } else {
      implications.push('Geopolitical risks manageable for markets');
      implications.push('Risk-on sentiment likely to persist');
    }

    return implications;
  }

  private mapSeverity(
    escalationProbability: number,
  ): 'minor' | 'moderate' | 'major' | 'severe' {
    if (escalationProbability >= 0.8) return 'severe';
    if (escalationProbability >= 0.6) return 'major';
    if (escalationProbability >= 0.4) return 'moderate';
    return 'minor';
  }
}
