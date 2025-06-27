import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FedSpeech,
  PolicyStatement,
  PolicyStanceAnalysis,
  RateDecisionPrediction,
  QEProbabilityAssessment,
  ImpactAnalysis,
  InterventionRisk,
  PolicyDivergenceAnalysis,
  GuidanceAnalysis,
  ConsistencyMetrics,
} from '../interfaces/monetary-policy.interfaces';
import {
  MonetaryPolicyPrediction,
  PolicyStanceAnalysis as PolicyStanceEntity,
  QEProbabilityAssessment as QEEntity,
} from '../entities/monetary-policy.entities';

/**
 * S51: Monetary Policy Service
 * Central bank policy analysis and prediction system
 */
@Injectable()
export class MonetaryPolicyService {
  private readonly logger = new Logger(MonetaryPolicyService.name);

  constructor(
    @InjectRepository(MonetaryPolicyPrediction)
    private policyPredictionRepository: Repository<MonetaryPolicyPrediction>,
    @InjectRepository(PolicyStanceEntity)
    private policyStanceRepository: Repository<PolicyStanceEntity>,
    @InjectRepository(QEEntity)
    private qeAssessmentRepository: Repository<QEEntity>,
  ) {}

  /**
   * Analyze Federal Reserve communication patterns
   */
  async analyzeFedCommunication(speeches: FedSpeech[]): Promise<PolicyStanceAnalysis> {
    try {
      this.logger.log(`Analyzing ${speeches.length} Fed communications`);

      const hawkishScore = this.calculateAverageHawkishness(speeches);
      const stance = this.determineStance(hawkishScore);
      const keyThemes = this.extractKeyThemes(speeches);
      const concerns = this.identifyConcerns(speeches);
      const priorities = this.identifyPriorities(speeches);
      const marketImpact = this.assessMarketImpact(stance, hawkishScore);

      const analysis: PolicyStanceAnalysis = {
        centralBank: 'Federal Reserve',
        stance,
        confidence: 0.85,
        change: hawkishScore - this.getPreviousStance('Federal Reserve'),
        keyThemes,
        concerns,
        priorities,
        marketImpact,
        timestamp: new Date(),
      };

      // Save to database
      const entity = this.policyStanceRepository.create({
        centralBank: 'Federal Reserve',
        stance,
        confidence: 0.85,
        change: analysis.change,
        keyThemes,
        concerns,
        priorities,
        marketImpact,
      });
      await this.policyStanceRepository.save(entity);

      return analysis;
    } catch (error) {
      this.logger.error('Error analyzing Fed communication:', error);
      throw error;
    }
  }

  /**
   * Predict interest rate decision for upcoming meeting
   */
  async predictInterestRateDecision(meetingDate: Date): Promise<RateDecisionPrediction> {
    try {
      this.logger.log(`Predicting rate decision for ${meetingDate}`);

      const currentRate = this.getCurrentFedRate();
      const predictions = this.calculateRateProbabilities();
      const consensusView = this.getConsensusView();
      const marketPricing = this.getMarketPricing();
      const factors = this.analyzeRateFactors();

      const prediction: RateDecisionPrediction = {
        centralBank: 'Federal Reserve',
        meetingDate,
        currentRate,
        predictions,
        consensusView,
        marketPricing,
        factors,
        confidence: 0.78,
        timestamp: new Date(),
      };

      // Save to database
      const entity = this.policyPredictionRepository.create({
        centralBank: 'Federal Reserve',
        meetingDate,
        currentRate,
        predictions,
        consensusView,
        marketPricing,
        factors,
        confidence: 0.78,
      });
      await this.policyPredictionRepository.save(entity);

      return prediction;
    } catch (error) {
      this.logger.error('Error predicting rate decision:', error);
      throw error;
    }
  }

  /**
   * Assess probability of quantitative easing
   */
  async assessQEProbability(centralBank: string): Promise<QEProbabilityAssessment> {
    try {
      this.logger.log(`Assessing QE probability for ${centralBank}`);

      const probability = this.calculateQEProbabilities(centralBank);
      const factors = this.identifyQEFactors(centralBank);
      const expectedScale = this.estimateQEScale(centralBank);
      const marketImpact = this.assessQEMarketImpact(centralBank);
      const historicalComparison = this.getHistoricalQEComparisons(centralBank);

      const assessment: QEProbabilityAssessment = {
        centralBank,
        probability,
        factors,
        expectedScale,
        marketImpact,
        historicalComparison,
        timestamp: new Date(),
      };

      // Save to database
      const entity = this.qeAssessmentRepository.create({
        centralBank,
        probability,
        factors,
        expectedScale,
        marketImpact,
        historicalComparison,
      });
      await this.qeAssessmentRepository.save(entity);

      return assessment;
    } catch (error) {
      this.logger.error(`Error assessing QE probability for ${centralBank}:`, error);
      throw error;
    }
  }

  /**
   * Model impact of rate changes on markets
   */
  async modelRateChangeImpact(rateChange: number, sectors: string[]): Promise<ImpactAnalysis> {
    try {
      this.logger.log(`Modeling impact of ${rateChange}% rate change on sectors: ${sectors.join(', ')}`);

      const sectorImpacts = this.calculateSectorImpacts(rateChange, sectors);
      const currencyImpacts = this.calculateCurrencyImpacts(rateChange);
      const bondImpacts = this.calculateBondImpacts(rateChange);
      const commodityImpacts = this.calculateCommodityImpacts(rateChange);

      return {
        rateChange,
        sectors: sectorImpacts,
        currencies: currencyImpacts,
        bonds: bondImpacts,
        commodities: commodityImpacts,
        confidence: 0.82,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Error modeling rate change impact:', error);
      throw error;
    }
  }

  /**
   * Analyze currency intervention risk
   */
  async analyzeCurrencyInterventionRisk(currency: string): Promise<InterventionRisk> {
    try {
      this.logger.log(`Analyzing intervention risk for ${currency}`);

      const riskLevel = this.assessInterventionRiskLevel(currency);
      const probability = this.calculateInterventionProbability(currency);
      const triggers = this.identifyInterventionTriggers(currency);
      const historicalInterventions = this.getHistoricalInterventions(currency);
      const marketImpact = this.assessInterventionMarketImpact(currency);

      return {
        currency,
        riskLevel,
        probability,
        triggers,
        historicalInterventions,
        marketImpact,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error analyzing intervention risk for ${currency}:`, error);
      throw error;
    }
  }

  /**
   * Predict policy divergence between central banks
   */
  async predictPolicyDivergence(countries: string[]): Promise<PolicyDivergenceAnalysis> {
    try {
      this.logger.log(`Analyzing policy divergence for countries: ${countries.join(', ')}`);

      const divergence = this.calculatePolicyDivergence(countries);
      const drivers = this.identifyDivergenceDrivers(countries);
      const implications = this.assessDivergenceImplications(countries);
      const opportunities = this.identifyDivergenceOpportunities(countries);
      const risks = this.identifyDivergenceRisks(countries);

      return {
        countries,
        divergence,
        drivers,
        implications,
        opportunities,
        risks,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Error predicting policy divergence:', error);
      throw error;
    }
  }

  /**
   * Parse and analyze forward guidance
   */
  async parseForwardGuidance(guidance: PolicyStatement): Promise<GuidanceAnalysis> {
    try {
      this.logger.log(`Parsing forward guidance from ${guidance.centralBank}`);

      const clarity = this.assessGuidanceClarity(guidance.guidance);
      const commitment = this.assessGuidanceCommitment(guidance.guidance);
      const timeframe = this.extractTimeframe(guidance.guidance);
      const conditions = this.extractConditions(guidance.guidance);
      const marketReaction = this.assessMarketReaction(guidance);
      const credibility = this.assessGuidanceCredibility(guidance.centralBank);

      return {
        centralBank: guidance.centralBank,
        guidance: guidance.guidance,
        clarity,
        commitment,
        timeframe,
        conditions,
        marketReaction,
        credibility,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Error parsing forward guidance:', error);
      throw error;
    }
  }

  /**
   * Track policy consistency over time
   */
  async trackPolicyConsistency(centralBank: string): Promise<ConsistencyMetrics> {
    try {
      this.logger.log(`Tracking policy consistency for ${centralBank}`);

      const consistency = this.calculateConsistencyMetrics(centralBank);
      const deviations = this.identifyPolicyDeviations(centralBank);
      const credibilityTrend = this.calculateCredibilityTrend(centralBank);
      const marketTrust = this.assessMarketTrust(centralBank);

      return {
        centralBank,
        consistency,
        deviations,
        credibilityTrend,
        marketTrust,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error tracking policy consistency for ${centralBank}:`, error);
      throw error;
    }
  }

  // Private helper methods

  private calculateAverageHawkishness(speeches: FedSpeech[]): number {
    if (speeches.length === 0) return 0;
    const sum = speeches.reduce((acc, speech) => acc + speech.hawkishScore, 0);
    return sum / speeches.length;
  }

  private determineStance(hawkishScore: number): 'dovish' | 'neutral' | 'hawkish' {
    if (hawkishScore > 0.3) return 'hawkish';
    if (hawkishScore < -0.3) return 'dovish';
    return 'neutral';
  }

  private extractKeyThemes(speeches: FedSpeech[]): string[] {
    // Extract common themes from speeches
    const allTopics = speeches.flatMap(speech => speech.topics);
    const topicCounts = allTopics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  private identifyConcerns(speeches: FedSpeech[]): string[] {
    return [
      'Persistent inflation',
      'Labor market tightness',
      'Financial stability risks',
      'Global economic uncertainty',
    ];
  }

  private identifyPriorities(speeches: FedSpeech[]): string[] {
    return [
      'Price stability',
      'Maximum employment',
      'Financial system stability',
      'Economic growth sustainability',
    ];
  }

  private assessMarketImpact(stance: string, hawkishScore: number): any {
    const impact = Math.abs(hawkishScore) * 0.5;
    return {
      currencies: [
        { currency: 'USD', impact: hawkishScore > 0 ? impact : -impact },
        { currency: 'EUR', impact: hawkishScore > 0 ? -impact * 0.7 : impact * 0.7 },
        { currency: 'JPY', impact: hawkishScore > 0 ? -impact * 0.5 : impact * 0.5 },
      ],
      bonds: [
        { maturity: '2Y', impact: hawkishScore * 0.8 },
        { maturity: '10Y', impact: hawkishScore * 0.6 },
        { maturity: '30Y', impact: hawkishScore * 0.4 },
      ],
      stocks: [
        { sector: 'Financials', impact: hawkishScore * 0.3 },
        { sector: 'Technology', impact: hawkishScore * -0.4 },
        { sector: 'Utilities', impact: hawkishScore * -0.2 },
      ],
    };
  }

  private getPreviousStance(centralBank: string): number {
    // In production, retrieve from database
    return 0.1; // Previous hawkish score
  }

  private getCurrentFedRate(): number {
    return 5.25; // Current Fed funds rate
  }

  private calculateRateProbabilities(): any {
    return {
      cut50: 0.05,
      cut25: 0.15,
      hold: 0.60,
      raise25: 0.18,
      raise50: 0.02,
    };
  }

  private getConsensusView(): number {
    return 0.0; // No change expected
  }

  private getMarketPricing(): number {
    return -0.125; // Markets pricing in slight cut
  }

  private analyzeRateFactors(): any[] {
    return [
      { factor: 'Inflation trend', impact: 'hawkish', weight: 0.35 },
      { factor: 'Employment data', impact: 'neutral', weight: 0.25 },
      { factor: 'Financial conditions', impact: 'dovish', weight: 0.20 },
      { factor: 'Global economy', impact: 'dovish', weight: 0.20 },
    ];
  }

  private calculateQEProbabilities(centralBank: string): any {
    return {
      threeMonth: 0.15,
      sixMonth: 0.35,
      oneYear: 0.55,
    };
  }

  private identifyQEFactors(centralBank: string): any {
    return {
      economic: ['Recession risk', 'Deflationary pressures', 'Credit market stress'],
      financial: ['Bond market dysfunction', 'Liquidity crisis', 'Bank funding issues'],
      political: ['Fiscal policy coordination', 'Political pressure', 'International cooperation'],
    };
  }

  private estimateQEScale(centralBank: string): any {
    return {
      size: 1500, // Billion USD
      duration: 18, // Months
      assetTypes: ['Government bonds', 'Corporate bonds', 'MBS'],
    };
  }

  private assessQEMarketImpact(centralBank: string): any {
    return {
      bonds: 0.8, // Strong positive impact
      currencies: -0.4, // Negative impact on currency
      stocks: 0.6, // Positive impact on stocks
    };
  }

  private getHistoricalQEComparisons(centralBank: string): string[] {
    return ['QE1 (2008-2010)', 'QE2 (2010-2011)', 'QE3 (2012-2014)', 'COVID QE (2020-2022)'];
  }

  private calculateSectorImpacts(rateChange: number, sectors: string[]): any[] {
    const sectorSensitivities = {
      'Financials': 0.6,
      'Technology': -0.8,
      'Utilities': -0.4,
      'Real Estate': -0.9,
      'Consumer Discretionary': -0.5,
      'Healthcare': -0.2,
    };

    return sectors.map(sector => ({
      sector,
      impact: (sectorSensitivities[sector] || 0) * rateChange,
      reasoning: this.getSectorReasoning(sector, rateChange),
    }));
  }

  private getSectorReasoning(sector: string, rateChange: number): string {
    if (sector === 'Financials') {
      return rateChange > 0 ? 'Higher margins from increased spreads' : 'Lower margins from compressed spreads';
    }
    if (sector === 'Technology') {
      return rateChange > 0 ? 'Higher discount rates reduce growth valuations' : 'Lower rates support growth valuations';
    }
    return 'Interest rate sensitivity varies by company fundamentals';
  }

  private calculateCurrencyImpacts(rateChange: number): any[] {
    return [
      { currency: 'USD', impact: rateChange * 0.5, timeframe: 'Short-term' },
      { currency: 'EUR', impact: rateChange * -0.3, timeframe: 'Medium-term' },
      { currency: 'JPY', impact: rateChange * -0.4, timeframe: 'Short-term' },
    ];
  }

  private calculateBondImpacts(rateChange: number): any[] {
    return [
      { maturity: '2Y', priceImpact: rateChange * -2.0, yieldImpact: rateChange * 0.8 },
      { maturity: '10Y', priceImpact: rateChange * -6.0, yieldImpact: rateChange * 0.6 },
      { maturity: '30Y', priceImpact: rateChange * -12.0, yieldImpact: rateChange * 0.5 },
    ];
  }

  private calculateCommodityImpacts(rateChange: number): any[] {
    return [
      { commodity: 'Gold', impact: rateChange * -0.8, mechanism: 'Opportunity cost of holding non-yielding asset' },
      { commodity: 'Oil', impact: rateChange * -0.3, mechanism: 'Economic growth expectations' },
      { commodity: 'Copper', impact: rateChange * -0.5, mechanism: 'Industrial demand expectations' },
    ];
  }

  private assessInterventionRiskLevel(currency: string): 'low' | 'medium' | 'high' | 'critical' {
    // Simulate risk assessment
    const riskLevels: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical'];
    return riskLevels[Math.floor(Math.random() * riskLevels.length)];
  }

  private calculateInterventionProbability(currency: string): number {
    return Math.random() * 0.4; // 0-40% probability
  }

  private identifyInterventionTriggers(currency: string): any {
    return {
      level: 1.10, // Exchange rate level
      volatility: 0.25, // Volatility threshold
      timeframe: '1 week', // Sustained movement timeframe
    };
  }

  private getHistoricalInterventions(currency: string): any[] {
    return [
      { date: new Date('2022-09-22'), level: 1.12, effectiveness: 0.3 },
      { date: new Date('2011-03-18'), level: 0.85, effectiveness: 0.7 },
    ];
  }

  private assessInterventionMarketImpact(currency: string): any {
    return {
      immediate: 0.02, // 2% immediate impact
      sustained: 0.005, // 0.5% sustained impact
    };
  }

  private calculatePolicyDivergence(countries: string[]): any {
    return {
      current: 0.65, // High divergence
      trend: 0.1, // Increasing
      forecast: 0.75, // Expected to increase
    };
  }

  private identifyDivergenceDrivers(countries: string[]): string[] {
    return [
      'Inflation differentials',
      'Economic growth gaps',
      'Labor market conditions',
      'Financial stability concerns',
    ];
  }

  private assessDivergenceImplications(countries: string[]): any {
    return {
      currencies: [
        { pair: 'USD/EUR', impact: 0.5 },
        { pair: 'USD/JPY', impact: 0.3 },
      ],
      bonds: [
        { spread: 'US-German 10Y', impact: 0.25 },
      ],
      flows: [
        { direction: 'USD inflows', magnitude: 0.4 },
      ],
    };
  }

  private identifyDivergenceOpportunities(countries: string[]): string[] {
    return [
      'Currency carry trades',
      'Interest rate differentials',
      'Cross-border arbitrage',
    ];
  }

  private identifyDivergenceRisks(countries: string[]): string[] {
    return [
      'Financial market volatility',
      'Capital flow reversals',
      'Exchange rate instability',
    ];
  }

  private assessGuidanceClarity(guidance: string): number {
    // NLP analysis would go here
    return 0.7;
  }

  private assessGuidanceCommitment(guidance: string): number {
    // NLP analysis would go here
    return 0.6;
  }

  private extractTimeframe(guidance: string): string {
    return 'Next 2-3 meetings';
  }

  private extractConditions(guidance: string): string[] {
    return ['Data dependent', 'Inflation progress', 'Employment stability'];
  }

  private assessMarketReaction(guidance: PolicyStatement): any {
    return {
      immediate: 0.015, // 1.5% immediate market reaction
      sustained: 0.005, // 0.5% sustained reaction
    };
  }

  private assessGuidanceCredibility(centralBank: string): number {
    return 0.85; // High credibility
  }

  private calculateConsistencyMetrics(centralBank: string): any {
    return {
      overall: 0.82,
      communications: 0.85,
      actions: 0.78,
    };
  }

  private identifyPolicyDeviations(centralBank: string): any[] {
    return [
      { date: new Date('2023-03-15'), type: 'Rate guidance deviation', impact: 0.02 },
    ];
  }

  private calculateCredibilityTrend(centralBank: string): number[] {
    return [0.75, 0.78, 0.80, 0.82, 0.85]; // Increasing trend
  }

  private assessMarketTrust(centralBank: string): number {
    return 0.83; // High market trust
  }
}
