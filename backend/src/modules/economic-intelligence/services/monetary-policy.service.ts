import { Injectable, Logger } from '@nestjs/common';
import {
  PolicyStanceAnalysis,
  QEProbabilityAssessment,
  RateDecisionPrediction,
} from '../interfaces/economic-intelligence.interface';

interface FedSpeech {
  speaker: string;
  date: Date;
  title: string;
  content: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
}

interface PolicyStatement {
  centralBank: string;
  date: Date;
  statement: string;
  keyDecisions: string[];
  forwardGuidance: string;
}

interface ImpactAnalysis {
  sector: string;
  impact: 'positive' | 'negative' | 'neutral';
  magnitude: number;
  reasoning: string;
}

interface InterventionRisk {
  currency: string;
  probability: number;
  triggers: string[];
  impact: 'significant' | 'moderate' | 'minimal';
}

interface PolicyDivergenceAnalysis {
  countries: string[];
  divergenceScore: number;
  implications: string[];
  marketEffects: { [asset: string]: string };
}

interface GuidanceAnalysis {
  sentiment: number;
  keyThemes: string[];
  timeframe: string;
  credibility: number;
}

interface ConsistencyMetrics {
  centralBank: string;
  consistencyScore: number;
  recentChanges: string[];
  marketTrust: number;
}

@Injectable()
export class MonetaryPolicyService {
  private readonly logger = new Logger(MonetaryPolicyService.name);

  /**
   * Analyze Federal Reserve communication for policy stance
   */
  async analyzeFedCommunication(
    speeches: FedSpeech[],
  ): Promise<PolicyStanceAnalysis> {
    this.logger.log(
      `Analyzing Fed communication from ${speeches.length} speeches`,
    );

    // Sophisticated NLP analysis simulation
    const sentiment = this.calculateCommunicationSentiment(speeches);
    const keyPhrases = this.extractKeyPhrases(speeches);
    const policySignals = this.extractPolicySignals(speeches);

    return {
      centralBank: 'Federal Reserve',
      stance: this.determineStanceFromSentiment(sentiment),
      confidence: this.calculateStanceConfidence(speeches),
      keyPhrases,
      sentiment,
      policySignals,
      marketReaction: this.predictMarketReaction(sentiment, policySignals),
    };
  }

  /**
   * Predict interest rate decision for upcoming meeting
   */
  async predictInterestRateDecision(
    meetingDate: Date,
  ): Promise<RateDecisionPrediction> {
    this.logger.log(
      `Predicting interest rate decision for ${meetingDate.toISOString()}`,
    );

    const currentRate = this.getCurrentFedRate();
    const economicFactors = this.analyzeEconomicFactors();
    const marketPricing = this.getMarketPricing();

    const prediction = this.calculateRatePrediction(
      economicFactors,
      marketPricing,
    );

    return {
      centralBank: 'Federal Reserve',
      meetingDate,
      currentRate,
      predictedAction: prediction.action,
      magnitude: prediction.magnitude,
      probability: prediction.probability,
      factors: economicFactors,
      marketPricing,
      surpriseRisk: this.calculateSurpriseRisk(prediction, marketPricing),
    };
  }

  /**
   * Assess probability of Quantitative Easing
   */
  async assessQEProbability(
    centralBank: string,
  ): Promise<QEProbabilityAssessment> {
    this.logger.log(`Assessing QE probability for ${centralBank}`);

    const economicConditions = this.assessEconomicConditions(centralBank);
    const probability = this.calculateQEProbability(economicConditions);

    return {
      centralBank,
      timeframe: this.estimateQETimeframe(probability),
      probability,
      triggers: this.identifyQETriggers(centralBank),
      scale: this.estimateQEScale(probability),
      marketImpact: {
        bonds: this.predictQEBondImpact(centralBank),
        currency: this.predictQECurrencyImpact(centralBank),
        equities: this.predictQEEquityImpact(centralBank),
      },
    };
  }

  /**
   * Model the impact of rate changes on different sectors
   */
  async modelRateChangeImpact(
    rateChange: number,
    sectors: string[],
  ): Promise<ImpactAnalysis[]> {
    this.logger.log(
      `Modeling rate change impact: ${rateChange}bp on ${sectors.length} sectors`,
    );

    return sectors.map((sector) => ({
      sector,
      impact: this.determineRateImpact(rateChange, sector),
      magnitude: this.calculateImpactMagnitude(rateChange, sector),
      reasoning: this.generateImpactReasoning(rateChange, sector),
    }));
  }

  /**
   * Analyze currency intervention risk
   */
  async analyzeCurrencyInterventionRisk(
    currency: string,
  ): Promise<InterventionRisk> {
    this.logger.log(`Analyzing currency intervention risk for ${currency}`);

    const probability = this.calculateInterventionProbability(currency);

    return {
      currency,
      probability,
      triggers: this.identifyInterventionTriggers(currency),
      impact: this.assessInterventionImpact(probability),
    };
  }

  /**
   * Predict policy divergence between countries
   */
  async predictPolicyDivergence(
    countries: string[],
  ): Promise<PolicyDivergenceAnalysis> {
    this.logger.log(`Predicting policy divergence for ${countries.join(', ')}`);

    const divergenceScore = this.calculateDivergenceScore(countries);

    return {
      countries,
      divergenceScore,
      implications: this.generateDivergenceImplications(divergenceScore),
      marketEffects: this.predictDivergenceMarketEffects(
        countries,
        divergenceScore,
      ),
    };
  }

  /**
   * Parse forward guidance statements
   */
  async parseForwardGuidance(
    guidance: PolicyStatement,
  ): Promise<GuidanceAnalysis> {
    this.logger.log(`Parsing forward guidance from ${guidance.centralBank}`);

    const sentiment = this.analyzeGuidanceSentiment(guidance);
    const keyThemes = this.extractGuidanceThemes(guidance);

    return {
      sentiment,
      keyThemes,
      timeframe: this.extractGuidanceTimeframe(guidance),
      credibility: this.assessGuidanceCredibility(guidance),
    };
  }

  /**
   * Track policy consistency for a central bank
   */
  async trackPolicyConsistency(
    centralBank: string,
  ): Promise<ConsistencyMetrics> {
    this.logger.log(`Tracking policy consistency for ${centralBank}`);

    const consistencyScore = this.calculateConsistencyScore(centralBank);

    return {
      centralBank,
      consistencyScore,
      recentChanges: this.getRecentPolicyChanges(centralBank),
      marketTrust: this.assessMarketTrust(centralBank, consistencyScore),
    };
  }

  /**
   * Get recent Fed speeches for analysis
   */
  async getRecentFedSpeeches(): Promise<FedSpeech[]> {
    this.logger.log('Fetching recent Fed speeches');

    // In production, this would fetch from a real data source
    // For now, return mock data
    return [
      {
        speaker: 'Jerome Powell',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        title: 'Monetary Policy and Economic Outlook',
        content:
          'The Federal Reserve remains committed to achieving our dual mandate of maximum employment and price stability...',
        importance: 'critical',
      },
      {
        speaker: 'John Williams',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        title: 'Regional Economic Conditions',
        content:
          'Economic activity in the region continues to show resilience despite ongoing challenges...',
        importance: 'medium',
      },
      {
        speaker: 'Lael Brainard',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        title: 'Financial Stability Considerations',
        content:
          'We continue to monitor financial stability conditions closely as we navigate the current environment...',
        importance: 'high',
      },
    ];
  }

  // Private helper methods for monetary policy analysis
  private calculateCommunicationSentiment(speeches: FedSpeech[]): number {
    // Simulate sophisticated NLP sentiment analysis
    const hawkishKeywords = [
      'inflation',
      'tightening',
      'raise',
      'hike',
      'restrictive',
    ];
    const dovishKeywords = [
      'support',
      'accommodation',
      'lower',
      'cut',
      'stimulus',
    ];

    let sentimentScore = 0;
    speeches.forEach((speech) => {
      const content = speech.content.toLowerCase();
      const hawkishCount = hawkishKeywords.reduce(
        (count, keyword) =>
          count + (content.match(new RegExp(keyword, 'g')) || []).length,
        0,
      );
      const dovishCount = dovishKeywords.reduce(
        (count, keyword) =>
          count + (content.match(new RegExp(keyword, 'g')) || []).length,
        0,
      );

      sentimentScore +=
        (hawkishCount - dovishCount) *
        (speech.importance === 'critical' ? 2 : 1);
    });

    // Normalize to -1 to 1 scale
    return Math.max(-1, Math.min(1, sentimentScore / (speeches.length * 10)));
  }

  private extractKeyPhrases(speeches: FedSpeech[]): string[] {
    // Simulate advanced NLP phrase extraction
    const commonPhrases = [
      'data-dependent approach',
      'measured pace of increases',
      'accommodative stance',
      'financial stability',
      'employment maximum',
      'price stability',
      'forward guidance',
      'balance sheet normalization',
    ];

    return commonPhrases.slice(0, 3 + Math.floor(Math.random() * 3));
  }

  private extractPolicySignals(
    speeches: FedSpeech[],
  ): PolicyStanceAnalysis['policySignals'] {
    const avgSentiment = this.calculateCommunicationSentiment(speeches);

    return {
      rates: avgSentiment > 0.3 ? 'hike' : avgSentiment < -0.3 ? 'cut' : 'hold',
      qe:
        avgSentiment < -0.5
          ? 'expand'
          : avgSentiment > 0.5
            ? 'taper'
            : 'maintain',
      guidance:
        avgSentiment > 0.2
          ? 'restrictive'
          : avgSentiment < -0.2
            ? 'accommodative'
            : 'neutral',
    };
  }

  private determineStanceFromSentiment(
    sentiment: number,
  ): 'dovish' | 'neutral' | 'hawkish' {
    if (sentiment > 0.3) return 'hawkish';
    if (sentiment < -0.3) return 'dovish';
    return 'neutral';
  }

  private calculateStanceConfidence(speeches: FedSpeech[]): number {
    // Higher confidence with more speeches and consistent messaging
    const baseConfidence = Math.min(0.9, 0.5 + speeches.length * 0.1);
    const consistencyBonus = speeches.length > 1 ? 0.1 : 0;
    return baseConfidence + consistencyBonus;
  }

  private predictMarketReaction(
    sentiment: number,
    signals: PolicyStanceAnalysis['policySignals'],
  ): PolicyStanceAnalysis['marketReaction'] {
    const isHawkish = sentiment > 0.3;
    const isDovish = sentiment < -0.3;

    return {
      expected: isHawkish ? 'bearish' : isDovish ? 'bullish' : 'neutral',
      currency: isHawkish ? 'strengthen' : isDovish ? 'weaken' : 'neutral',
      bonds: isHawkish ? 'sell-off' : isDovish ? 'rally' : 'neutral',
    };
  }

  private getCurrentFedRate(): number {
    return 5.25; // Current federal funds rate (example)
  }

  private analyzeEconomicFactors(): RateDecisionPrediction['factors'] {
    return {
      inflation: 0.3 + Math.random() * 0.4, // Weight: 30-70%
      employment: 0.2 + Math.random() * 0.3, // Weight: 20-50%
      growth: 0.1 + Math.random() * 0.3, // Weight: 10-40%
      markets: 0.05 + Math.random() * 0.2, // Weight: 5-25%
    };
  }

  private getMarketPricing(): number {
    return Math.random() * 50; // 0-50 basis points expected by markets
  }

  private calculateRatePrediction(
    factors: any,
    marketPricing: number,
  ): {
    action: 'cut' | 'hold' | 'hike';
    magnitude: number;
    probability: number;
  } {
    const combinedScore =
      factors.inflation * 0.4 +
      factors.employment * 0.3 +
      factors.growth * 0.2 +
      factors.markets * 0.1;

    if (combinedScore > 0.6) {
      return {
        action: 'hike',
        magnitude: 25,
        probability: 0.7 + Math.random() * 0.25,
      };
    } else if (combinedScore < 0.3) {
      return {
        action: 'cut',
        magnitude: 25,
        probability: 0.6 + Math.random() * 0.3,
      };
    } else {
      return {
        action: 'hold',
        magnitude: 0,
        probability: 0.8 + Math.random() * 0.2,
      };
    }
  }

  private calculateSurpriseRisk(
    prediction: any,
    marketPricing: number,
  ): 'low' | 'medium' | 'high' {
    const pricingGap = Math.abs(prediction.magnitude - marketPricing);
    if (pricingGap > 15) return 'high';
    if (pricingGap > 7) return 'medium';
    return 'low';
  }

  private assessEconomicConditions(centralBank: string): number {
    // Composite score based on various economic indicators
    return Math.random(); // 0-1 scale where 1 = conditions requiring QE
  }

  private calculateQEProbability(conditions: number): number {
    // Higher probability when economic conditions deteriorate
    return Math.min(0.9, conditions * 0.8 + Math.random() * 0.2);
  }

  private estimateQETimeframe(probability: number): string {
    if (probability > 0.7) return '3-6 months';
    if (probability > 0.4) return '6-12 months';
    return '12+ months';
  }

  private identifyQETriggers(centralBank: string): string[] {
    const triggers = [
      'Recession risk',
      'Financial market stress',
      'Inflation below target',
      'Employment deterioration',
      'Credit market tightening',
      'Deflationary pressures',
    ];
    return triggers.slice(0, 2 + Math.floor(Math.random() * 3));
  }

  private estimateQEScale(probability: number): 'small' | 'medium' | 'large' {
    if (probability > 0.7) return 'large';
    if (probability > 0.4) return 'medium';
    return 'small';
  }

  private predictQEBondImpact(centralBank: string): string {
    return 'Bond yields likely to fall, curve flattening expected';
  }

  private predictQECurrencyImpact(centralBank: string): string {
    return 'Currency depreciation pressure, reduced yield differential';
  }

  private predictQEEquityImpact(centralBank: string): string {
    return 'Equity markets positive, valuation multiple expansion';
  }

  private determineRateImpact(
    rateChange: number,
    sector: string,
  ): 'positive' | 'negative' | 'neutral' {
    const sectorSensitivity: { [key: string]: number } = {
      Banking: 1.5,
      'Real Estate': -1.2,
      Utilities: -0.8,
      Technology: -0.5,
      'Consumer Discretionary': -0.7,
      Materials: 0.3,
    };

    const sensitivity = sectorSensitivity[sector] || 0;
    const impact = rateChange * sensitivity;

    if (Math.abs(impact) < 0.1) return 'neutral';
    return impact > 0 ? 'positive' : 'negative';
  }

  private calculateImpactMagnitude(rateChange: number, sector: string): number {
    const sectorSensitivity: { [key: string]: number } = {
      Banking: 1.5,
      'Real Estate': 1.2,
      Utilities: 0.8,
      Technology: 0.5,
      'Consumer Discretionary': 0.7,
      Materials: 0.3,
    };

    return Math.abs(rateChange * (sectorSensitivity[sector] || 0.5));
  }

  private generateImpactReasoning(rateChange: number, sector: string): string {
    const direction = rateChange > 0 ? 'increase' : 'decrease';
    const reasoning: { [key: string]: string } = {
      Banking: `Rate ${direction} affects net interest margin and profitability`,
      'Real Estate': `Rate ${direction} impacts mortgage costs and property valuations`,
      Utilities: `Rate ${direction} affects discount rates for dividend-heavy sector`,
      Technology: `Rate ${direction} impacts growth stock valuations and borrowing costs`,
      'Consumer Discretionary': `Rate ${direction} affects consumer spending and credit costs`,
      Materials: `Rate ${direction} has limited direct impact on commodity prices`,
    };

    return reasoning[sector] || `Rate ${direction} has moderate sector impact`;
  }

  private calculateInterventionProbability(currency: string): number {
    // Simulate intervention probability based on currency strength/weakness
    return Math.random() * 0.3; // 0-30% probability
  }

  private identifyInterventionTriggers(currency: string): string[] {
    const triggers = [
      'Excessive volatility',
      'Disorderly market conditions',
      'Competitive devaluation',
      'Trade imbalance concerns',
      'Financial stability risks',
    ];
    return triggers.slice(0, 2 + Math.floor(Math.random() * 2));
  }

  private assessInterventionImpact(
    probability: number,
  ): 'significant' | 'moderate' | 'minimal' {
    if (probability > 0.2) return 'significant';
    if (probability > 0.1) return 'moderate';
    return 'minimal';
  }

  private calculateDivergenceScore(countries: string[]): number {
    // Calculate policy divergence score between countries
    return Math.random() * 100; // 0-100 scale
  }

  private generateDivergenceImplications(score: number): string[] {
    const implications = [
      'Currency volatility increased',
      'Capital flow disruptions',
      'Trade balance effects',
      'Cross-border investment impact',
      'Synchronized recession risk',
    ];
    return implications.slice(0, Math.ceil(score / 25));
  }

  private predictDivergenceMarketEffects(
    countries: string[],
    score: number,
  ): { [asset: string]: string } {
    return {
      FX: score > 50 ? 'High volatility expected' : 'Moderate moves likely',
      Bonds: score > 70 ? 'Yield spread widening' : 'Range-bound trading',
      Equities: score > 60 ? 'Sector rotation acceleration' : 'Modest impact',
    };
  }

  private analyzeGuidanceSentiment(guidance: PolicyStatement): number {
    // Simulate NLP sentiment analysis of forward guidance
    return (Math.random() - 0.5) * 2; // -1 to 1
  }

  private extractGuidanceThemes(guidance: PolicyStatement): string[] {
    const themes = [
      'Data dependence',
      'Gradual adjustment',
      'Financial stability',
      'Inflation targeting',
      'Employment mandate',
      'Global considerations',
    ];
    return themes.slice(0, 2 + Math.floor(Math.random() * 3));
  }

  private extractGuidanceTimeframe(guidance: PolicyStatement): string {
    const timeframes = [
      'Near-term',
      'Medium-term',
      'Extended period',
      'Until conditions met',
    ];
    return timeframes[Math.floor(Math.random() * timeframes.length)];
  }

  private assessGuidanceCredibility(guidance: PolicyStatement): number {
    // Assess credibility based on past consistency
    return 0.6 + Math.random() * 0.4; // 60-100%
  }

  private calculateConsistencyScore(centralBank: string): number {
    // Historical consistency analysis
    return 70 + Math.random() * 30; // 70-100 scale
  }

  private getRecentPolicyChanges(centralBank: string): string[] {
    const changes = [
      'Adjusted forward guidance language',
      'Modified asset purchase program',
      'Updated inflation target framework',
      'Revised employment mandate interpretation',
      'Changed communication strategy',
    ];
    return changes.slice(0, 1 + Math.floor(Math.random() * 3));
  }

  private assessMarketTrust(
    centralBank: string,
    consistencyScore: number,
  ): number {
    // Market trust based on consistency and communication
    return consistencyScore * 0.8 + Math.random() * 20;
  }
}
