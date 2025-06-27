import { Injectable, Logger } from '@nestjs/common';

export interface CognitiveBiasAnalysis {
  symbol: string;
  timestamp: Date;
  biases: {
    anchoring: {
      score: number;
      confidence: number;
      description: string;
      priceAnchor: number;
    };
    confirmation: {
      score: number;
      confidence: number;
      description: string;
      confirmatorySignals: number;
    };
    recency: {
      score: number;
      confidence: number;
      description: string;
      recentEventsWeight: number;
    };
    availability: {
      score: number;
      confidence: number;
      description: string;
      recentNewsImpact: number;
    };
    overconfidence: {
      score: number;
      confidence: number;
      description: string;
      volatilityUnderestimation: number;
    };
  };
  overallBiasScore: number;
  recommendedAction: 'exploit' | 'neutral' | 'avoid';
}

export interface SentimentCyclePhase {
  phase: 'despair' | 'depression' | 'hope' | 'optimism' | 'belief' | 'thrill' | 'euphoria' | 'complacency' | 'anxiety' | 'denial' | 'fear' | 'capitulation';
  confidence: number;
  duration: number; // days in current phase
  expectedTransition: string;
  transitionProbability: number;
  marketImplications: {
    expectedVolatility: number;
    expectedDirection: 'up' | 'down' | 'sideways';
    timeframe: number; // days
  };
}

export interface FearGreedMetrics {
  overallIndex: number; // 0-100 scale
  components: {
    marketVolatility: { value: number; weight: number; };
    marketMomentum: { value: number; weight: number; };
    stockPriceBreadth: { value: number; weight: number; };
    putCallRatio: { value: number; weight: number; };
    junkBondDemand: { value: number; weight: number; };
    safeHavenDemand: { value: number; weight: number; };
    socialSentiment: { value: number; weight: number; };
  };
  interpretation: 'extreme-fear' | 'fear' | 'neutral' | 'greed' | 'extreme-greed';
  historicalPercentile: number;
  tradingSignal: {
    recommendation: 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell';
    confidence: number;
    reasoning: string;
  };
}

export interface HerdingMetrics {
  symbol: string;
  herdingScore: number; // 0-1 scale
  institutionalHerding: number;
  retailHerding: number;
  socialMediaHerding: number;
  contrarian: {
    opportunity: boolean;
    strength: number;
    expectedReversion: number;
    timeframe: number;
  };
  crowdPsychology: {
    phase: 'accumulation' | 'markup' | 'distribution' | 'decline';
    smartMoney: 'buying' | 'selling' | 'neutral';
    publicSentiment: 'bullish' | 'bearish' | 'neutral';
  };
}

export interface ProspectTheoryAnalysis {
  portfolioId: string;
  riskTolerance: {
    gainsReaction: number; // risk aversion in gains
    lossesReaction: number; // risk seeking in losses
    lossAversion: number; // loss aversion coefficient
  };
  mentalAccounting: {
    accounts: Array<{
      name: string;
      value: number;
      riskProfile: 'conservative' | 'moderate' | 'aggressive';
      emotionalAttachment: number;
    }>;
    integrationOpportunity: number;
  };
  decisionFraming: {
    frameType: 'gains' | 'losses';
    biasStrength: number;
    recommendations: string[];
  };
  overallBiasScore: number;
}

export interface LossAversionProfile {
  traderId: string;
  lossAversionCoefficient: number; // typically 2-2.5
  realizationEffect: {
    prematureGainRealization: number;
    lossHoldingTendency: number;
  };
  dispositionEffect: {
    strength: number;
    impactOnReturns: number;
  };
  recommendations: {
    stopLossStrategy: string;
    positionSizing: string;
    diversificationAdvice: string;
  };
}

@Injectable()
export class BehavioralFinanceService {
  private readonly logger = new Logger(BehavioralFinanceService.name);

  async detectCognitiveBias(marketData: any): Promise<CognitiveBiasAnalysis> {
    const symbol = marketData?.symbol || 'UNKNOWN';
    this.logger.log(`Analyzing cognitive biases for ${symbol}`);

    try {
      // Anchoring Bias Analysis
      const anchoring = await this.analyzeAnchoringBias(marketData);
      
      // Confirmation Bias Analysis
      const confirmation = await this.analyzeConfirmationBias(marketData);
      
      // Recency Bias Analysis
      const recency = await this.analyzeRecencyBias(marketData);
      
      // Availability Heuristic Analysis
      const availability = await this.analyzeAvailabilityHeuristic(marketData);
      
      // Overconfidence Bias Analysis
      const overconfidence = await this.analyzeOverconfidenceBias(marketData);

      const overallBiasScore = this.calculateOverallBiasScore({
        anchoring,
        confirmation,
        recency,
        availability,
        overconfidence
      });

      return {
        symbol: marketData.symbol,
        timestamp: new Date(),
        biases: {
          anchoring,
          confirmation,
          recency,
          availability,
          overconfidence
        },
        overallBiasScore,
        recommendedAction: this.getRecommendedAction(overallBiasScore)
      };
    } catch (error) {
      this.logger.error(`Error analyzing cognitive biases: ${error.message}`);
      return this.getDefaultCognitiveBiasAnalysis(symbol);
    }
  }

  async analyzeMarketSentimentCycle(): Promise<SentimentCyclePhase> {
    this.logger.log('Analyzing market sentiment cycle phase');

    try {
      // Analyze multiple market indicators
      const volatilityIndex = await this.getMarketVolatility();
      const volumePatterns = await this.getVolumePatterns();
      const priceAction = await this.getPriceActionSignals();
      const socialSentiment = await this.getSocialSentimentData();

      // Determine current market phase using psychological indicators
      const phase = this.determineSentimentPhase({
        volatilityIndex,
        volumePatterns,
        priceAction,
        socialSentiment
      });

      const confidence = this.calculatePhaseConfidence(phase);
      const duration = await this.getPhaseDuration(phase);

      return {
        phase,
        confidence,
        duration,
        expectedTransition: this.getExpectedTransition(phase),
        transitionProbability: this.getTransitionProbability(phase, duration),
        marketImplications: this.getMarketImplications(phase)
      };
    } catch (error) {
      this.logger.error(`Error analyzing sentiment cycle: ${error.message}`);
      return this.getDefaultSentimentCycle();
    }
  }

  async calculateFearGreedIndex(): Promise<FearGreedMetrics> {
    this.logger.log('Calculating Fear & Greed Index');

    try {
      // Calculate individual components
      const components = {
        marketVolatility: await this.calculateVolatilityComponent(),
        marketMomentum: await this.calculateMomentumComponent(),
        stockPriceBreadth: await this.calculateBreadthComponent(),
        putCallRatio: await this.calculatePutCallComponent(),
        junkBondDemand: await this.calculateJunkBondComponent(),
        safeHavenDemand: await this.calculateSafeHavenComponent(),
        socialSentiment: await this.calculateSocialSentimentComponent()
      };

      // Calculate weighted overall index
      const overallIndex = this.calculateWeightedIndex(components);
      
      const interpretation = this.interpretFearGreedIndex(overallIndex);
      const historicalPercentile = await this.getHistoricalPercentile(overallIndex);
      const tradingSignal = this.generateTradingSignal(overallIndex, interpretation);

      return {
        overallIndex,
        components,
        interpretation,
        historicalPercentile,
        tradingSignal
      };
    } catch (error) {
      this.logger.error(`Error calculating Fear & Greed Index: ${error.message}`);
      return this.getDefaultFearGreedMetrics();
    }
  }

  async detectHerdingBehavior(symbol: string): Promise<HerdingMetrics> {
    this.logger.log(`Detecting herding behavior for ${symbol}`);

    try {
      // Analyze different types of herding behavior
      const institutionalHerding = await this.analyzeInstitutionalHerding(symbol);
      const retailHerding = await this.analyzeRetailHerding(symbol);
      const socialMediaHerding = await this.analyzeSocialMediaHerding(symbol);

      const herdingScore = (institutionalHerding + retailHerding + socialMediaHerding) / 3;

      const contrarian = await this.analyzeContrarianOpportunity(symbol, herdingScore);
      const crowdPsychology = await this.analyzeCrowdPsychology(symbol);

      return {
        symbol,
        herdingScore,
        institutionalHerding,
        retailHerding,
        socialMediaHerding,
        contrarian,
        crowdPsychology
      };
    } catch (error) {
      this.logger.error(`Error detecting herding behavior: ${error.message}`);
      return this.getDefaultHerdingMetrics(symbol);
    }
  }

  async analyzeProspectTheory(portfolio: any): Promise<ProspectTheoryAnalysis> {
    this.logger.log(`Analyzing prospect theory for portfolio ${portfolio.id}`);

    try {
      const tradingHistory = await this.getPortfolioTradingHistory(portfolio.id);
      
      const riskTolerance = this.analyzeRiskTolerance(tradingHistory);
      const mentalAccounting = this.analyzeMentalAccounting(portfolio);
      const decisionFraming = this.analyzeDecisionFraming(tradingHistory);

      const overallBiasScore = this.calculateProspectTheoryBias({
        riskTolerance,
        mentalAccounting,
        decisionFraming
      });

      return {
        portfolioId: portfolio.id,
        riskTolerance,
        mentalAccounting,
        decisionFraming,
        overallBiasScore
      };
    } catch (error) {
      this.logger.error(`Error analyzing prospect theory: ${error.message}`);
      return this.getDefaultProspectTheoryAnalysis(portfolio.id);
    }
  }

  async assessLossAversion(tradingHistory: any[]): Promise<LossAversionProfile> {
    this.logger.log('Assessing loss aversion profile');

    try {
      const lossAversionCoefficient = this.calculateLossAversionCoefficient(tradingHistory);
      const realizationEffect = this.analyzeRealizationEffect(tradingHistory);
      const dispositionEffect = this.analyzeDispositionEffect(tradingHistory);

      const recommendations = this.generateLossAversionRecommendations({
        lossAversionCoefficient,
        realizationEffect,
        dispositionEffect
      });

      return {
        traderId: tradingHistory[0]?.traderId || 'unknown',
        lossAversionCoefficient,
        realizationEffect,
        dispositionEffect,
        recommendations
      };
    } catch (error) {
      this.logger.error(`Error assessing loss aversion: ${error.message}`);
      return this.getDefaultLossAversionProfile();
    }
  }

  // Private helper methods
  private async analyzeAnchoringBias(marketData: any) {
    // Analyze how current price relates to recent highs/lows
    const recentHigh = Math.max(...marketData.recentPrices.slice(-20));
    const recentLow = Math.min(...marketData.recentPrices.slice(-20));
    const currentPrice = marketData.currentPrice;
    
    const anchorDistance = Math.min(
      Math.abs(currentPrice - recentHigh) / recentHigh,
      Math.abs(currentPrice - recentLow) / recentLow
    );

    return {
      score: Math.max(0, 1 - anchorDistance * 2), // Higher score = stronger anchoring
      confidence: 0.8,
      description: `Price anchored to recent ${currentPrice > (recentHigh + recentLow) / 2 ? 'high' : 'low'}`,
      priceAnchor: currentPrice > (recentHigh + recentLow) / 2 ? recentHigh : recentLow
    };
  }

  private async analyzeConfirmationBias(marketData: any) {
    // Analyze how market participants seek confirming information
    const trendStrength = marketData.trend?.strength || 0.5;
    const newsConsensus = marketData.newsConsensus || 0.5;
    
    const biasScore = Math.abs(trendStrength - 0.5) * Math.abs(newsConsensus - 0.5) * 4;

    return {
      score: biasScore,
      confidence: 0.7,
      description: `${biasScore > 0.6 ? 'Strong' : 'Moderate'} confirmation bias detected`,
      confirmatorySignals: Math.round(biasScore * 10)
    };
  }

  private async analyzeRecencyBias(marketData: any) {
    // Analyze overweighting of recent events
    const recentVolatility = this.calculateRecentVolatility(marketData.recentPrices);
    const historicalVolatility = marketData.historicalVolatility || recentVolatility;
    
    const recencyRatio = recentVolatility / historicalVolatility;
    const biasScore = Math.abs(Math.log(recencyRatio)) / 2; // Normalize log ratio

    return {
      score: Math.min(biasScore, 1),
      confidence: 0.75,
      description: `Recent events ${recencyRatio > 1 ? 'overweighted' : 'underweighted'}`,
      recentEventsWeight: recencyRatio
    };
  }

  private async analyzeAvailabilityHeuristic(marketData: any) {
    // Analyze impact of easily recalled events
    const newsImpact = marketData.recentNewsImpact || 0.5;
    const mediaAttention = marketData.mediaAttention || 0.5;
    
    const availabilityScore = (newsImpact + mediaAttention) / 2;

    return {
      score: availabilityScore,
      confidence: 0.6,
      description: `${availabilityScore > 0.7 ? 'High' : 'Moderate'} availability bias from recent events`,
      recentNewsImpact: newsImpact
    };
  }

  private async analyzeOverconfidenceBias(marketData: any) {
    // Analyze overconfidence in predictions
    const predictionAccuracy = marketData.predictionAccuracy || 0.5;
    const volatilityUnderestimation = Math.max(0, 0.8 - predictionAccuracy);
    
    return {
      score: volatilityUnderestimation,
      confidence: 0.65,
      description: `${volatilityUnderestimation > 0.4 ? 'Significant' : 'Moderate'} overconfidence detected`,
      volatilityUnderestimation
    };
  }

  private calculateOverallBiasScore(biases: any): number {
    const weights = {
      anchoring: 0.2,
      confirmation: 0.25,
      recency: 0.2,
      availability: 0.15,
      overconfidence: 0.2
    };

    return Object.entries(weights).reduce((total, [bias, weight]) => {
      return total + (biases[bias].score * weight);
    }, 0);
  }

  private getRecommendedAction(biasScore: number): 'exploit' | 'neutral' | 'avoid' {
    if (biasScore > 0.7) return 'exploit';
    if (biasScore < 0.3) return 'avoid';
    return 'neutral';
  }

  // Additional helper methods for other analyses
  private calculateRecentVolatility(prices: number[]): number {
    if (prices.length < 2) return 0;
    
    const returns = prices.slice(1).map((price, i) => 
      Math.log(price / prices[i])
    );
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    
    return Math.sqrt(variance * 252); // Annualized volatility
  }

  // Default fallback methods
  private getDefaultCognitiveBiasAnalysis(symbol: string): CognitiveBiasAnalysis {
    return {
      symbol,
      timestamp: new Date(),
      biases: {
        anchoring: { score: 0.5, confidence: 0.3, description: 'Insufficient data', priceAnchor: 0 },
        confirmation: { score: 0.5, confidence: 0.3, description: 'Insufficient data', confirmatorySignals: 0 },
        recency: { score: 0.5, confidence: 0.3, description: 'Insufficient data', recentEventsWeight: 1 },
        availability: { score: 0.5, confidence: 0.3, description: 'Insufficient data', recentNewsImpact: 0.5 },
        overconfidence: { score: 0.5, confidence: 0.3, description: 'Insufficient data', volatilityUnderestimation: 0.3 }
      },
      overallBiasScore: 0.5,
      recommendedAction: 'neutral'
    };
  }

  private getDefaultSentimentCycle(): SentimentCyclePhase {
    return {
      phase: 'hope' as any,
      confidence: 0.3,
      duration: 0,
      expectedTransition: 'Unknown - insufficient data',
      transitionProbability: 0.5,
      marketImplications: {
        expectedVolatility: 0.15,
        expectedDirection: 'sideways',
        timeframe: 30
      }
    };
  }

  private getDefaultFearGreedMetrics(): FearGreedMetrics {
    return {
      overallIndex: 50,
      components: {
        marketVolatility: { value: 50, weight: 0.15 },
        marketMomentum: { value: 50, weight: 0.15 },
        stockPriceBreadth: { value: 50, weight: 0.15 },
        putCallRatio: { value: 50, weight: 0.15 },
        junkBondDemand: { value: 50, weight: 0.15 },
        safeHavenDemand: { value: 50, weight: 0.15 },
        socialSentiment: { value: 50, weight: 0.1 }
      },
      interpretation: 'neutral',
      historicalPercentile: 50,
      tradingSignal: {
        recommendation: 'hold',
        confidence: 0.3,
        reasoning: 'Insufficient data for reliable assessment'
      }
    };
  }

  private getDefaultHerdingMetrics(symbol: string): HerdingMetrics {
    return {
      symbol,
      herdingScore: 0.5,
      institutionalHerding: 0.5,
      retailHerding: 0.5,
      socialMediaHerding: 0.5,
      contrarian: {
        opportunity: false,
        strength: 0.3,
        expectedReversion: 0.1,
        timeframe: 30
      },
      crowdPsychology: {
        phase: 'accumulation',
        smartMoney: 'neutral',
        publicSentiment: 'neutral'
      }
    };
  }

  private getDefaultProspectTheoryAnalysis(portfolioId: string): ProspectTheoryAnalysis {
    return {
      portfolioId,
      riskTolerance: {
        gainsReaction: 0.5,
        lossesReaction: 0.5,
        lossAversion: 2.25
      },
      mentalAccounting: {
        accounts: [],
        integrationOpportunity: 0.5
      },
      decisionFraming: {
        frameType: 'gains',
        biasStrength: 0.5,
        recommendations: ['Consider portfolio-wide view']
      },
      overallBiasScore: 0.5
    };
  }

  private getDefaultLossAversionProfile(): LossAversionProfile {
    return {
      traderId: 'unknown',
      lossAversionCoefficient: 2.25,
      realizationEffect: {
        prematureGainRealization: 0.5,
        lossHoldingTendency: 0.5
      },
      dispositionEffect: {
        strength: 0.5,
        impactOnReturns: -0.02
      },
      recommendations: {
        stopLossStrategy: 'Implement systematic stop-loss rules',
        positionSizing: 'Use position sizing based on Kelly criterion',
        diversificationAdvice: 'Maintain diversified portfolio to reduce emotional attachment'
      }
    };
  }

  // Placeholder methods for complex calculations (to be implemented)
  private async getMarketVolatility(): Promise<number> { return 0.2; }
  private async getVolumePatterns(): Promise<any> { return {}; }
  private async getPriceActionSignals(): Promise<any> { return {}; }
  private async getSocialSentimentData(): Promise<any> { return {}; }
  private determineSentimentPhase(data: any): any { return 'hope'; }
  private calculatePhaseConfidence(phase: any): number { return 0.6; }
  private async getPhaseDuration(phase: any): Promise<number> { return 15; }
  private getExpectedTransition(phase: any): string { return 'gradual'; }
  private getTransitionProbability(phase: any, duration: number): number { return 0.4; }
  private getMarketImplications(phase: any) { 
    return { expectedVolatility: 0.15, expectedDirection: 'sideways' as any, timeframe: 30 }; 
  }
  
  private async calculateVolatilityComponent() { return { value: 50, weight: 0.15 }; }
  private async calculateMomentumComponent() { return { value: 50, weight: 0.15 }; }
  private async calculateBreadthComponent() { return { value: 50, weight: 0.15 }; }
  private async calculatePutCallComponent() { return { value: 50, weight: 0.15 }; }
  private async calculateJunkBondComponent() { return { value: 50, weight: 0.15 }; }
  private async calculateSafeHavenComponent() { return { value: 50, weight: 0.15 }; }
  private async calculateSocialSentimentComponent() { return { value: 50, weight: 0.1 }; }
  
  private calculateWeightedIndex(components: any): number {
    return Object.values(components).reduce((sum: number, comp: any) => 
      sum + (comp.value * comp.weight), 0
    ) as number;
  }
  
  private interpretFearGreedIndex(index: number): any {
    if (index <= 25) return 'extreme-fear';
    if (index <= 45) return 'fear';
    if (index <= 55) return 'neutral';
    if (index <= 75) return 'greed';
    return 'extreme-greed';
  }
  
  private async getHistoricalPercentile(index: number): Promise<number> { return 50; }
  private generateTradingSignal(index: number, interpretation: any) {
    return {
      recommendation: 'hold' as any,
      confidence: 0.6,
      reasoning: 'Behavioral analysis suggests neutral market psychology'
    };
  }

  // Additional placeholder methods
  private async analyzeInstitutionalHerding(symbol: string): Promise<number> { return 0.5; }
  private async analyzeRetailHerding(symbol: string): Promise<number> { return 0.5; }
  private async analyzeSocialMediaHerding(symbol: string): Promise<number> { return 0.5; }
  private async analyzeContrarianOpportunity(symbol: string, herdingScore: number) {
    return {
      opportunity: herdingScore > 0.7,
      strength: Math.max(0, herdingScore - 0.5),
      expectedReversion: herdingScore * 0.3,
      timeframe: 30
    };
  }
  private async analyzeCrowdPsychology(symbol: string) {
    return {
      phase: 'accumulation' as any,
      smartMoney: 'neutral' as any,
      publicSentiment: 'neutral' as any
    };
  }

  private async getPortfolioTradingHistory(portfolioId: string): Promise<any[]> { return []; }
  private analyzeRiskTolerance(tradingHistory: any[]) {
    return {
      gainsReaction: 0.5,
      lossesReaction: 0.5,
      lossAversion: 2.25
    };
  }
  private analyzeMentalAccounting(portfolio: any) {
    return {
      accounts: [],
      integrationOpportunity: 0.5
    };
  }
  private analyzeDecisionFraming(tradingHistory: any[]) {
    return {
      frameType: 'gains' as any,
      biasStrength: 0.5,
      recommendations: ['Consider portfolio-wide perspective']
    };
  }
  private calculateProspectTheoryBias(data: any): number { return 0.5; }
  
  private calculateLossAversionCoefficient(tradingHistory: any[]): number { return 2.25; }
  private analyzeRealizationEffect(tradingHistory: any[]) {
    return {
      prematureGainRealization: 0.5,
      lossHoldingTendency: 0.5
    };
  }
  private analyzeDispositionEffect(tradingHistory: any[]) {
    return {
      strength: 0.5,
      impactOnReturns: -0.02
    };
  }
  private generateLossAversionRecommendations(data: any) {
    return {
      stopLossStrategy: 'Implement systematic stop-loss rules',
      positionSizing: 'Use Kelly criterion for optimal position sizing',
      diversificationAdvice: 'Maintain diversified portfolio to reduce emotional attachment'
    };
  }
}
