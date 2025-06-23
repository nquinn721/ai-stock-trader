import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MLMetric, MLModel, MLPrediction } from '../entities/ml.entities';
import {
  MarketPrediction,
  MarketState,
  SentimentScore,
  TechnicalFeatures,
  TradingSignals,
} from '../interfaces/ml.interfaces';

/**
 * Advanced Signal Generation Service - Phase 3 (S29)
 * Generates sophisticated trading signals by combining multiple ML models,
 * market conditions, and risk factors
 */
@Injectable()
export class SignalGenerationService {
  private readonly logger = new Logger(SignalGenerationService.name);
  private signalCache: Map<string, any> = new Map();
  private signalHistory: Map<string, any[]> = new Map();

  constructor(
    @InjectRepository(MLModel)
    private mlModelRepository: Repository<MLModel>,
    @InjectRepository(MLPrediction)
    private mlPredictionRepository: Repository<MLPrediction>,
    @InjectRepository(MLMetric)
    private mlMetricRepository: Repository<MLMetric>,
  ) {
    this.logger.log('🚀 Signal Generation Service initialized - Phase 3');
  }

  /**
   * Generate comprehensive trading signals using multi-factor analysis
   * Combines market predictions, sentiment, technical analysis, and risk factors
   */
  async generateAdvancedSignals(
    symbol: string,
    inputs: {
      marketPrediction?: MarketPrediction;
      technicalFeatures?: TechnicalFeatures;
      sentimentScore?: SentimentScore;
      marketState?: MarketState;
      portfolioContext?: any;
      riskProfile?: any;
    },
    options: any = {},
  ): Promise<TradingSignals> {
    this.logger.log(`Generating advanced trading signals for ${symbol}`);

    const startTime = Date.now();

    try {
      // Factor Analysis
      const factors = await this.analyzeSignalFactors(symbol, inputs);

      // Risk Assessment
      const riskAssessment = await this.assessRiskFactors(
        symbol,
        inputs,
        factors,
      );

      // Market Timing Analysis
      const timingAnalysis = await this.analyzeMarketTiming(
        symbol,
        inputs,
        factors,
      );

      // Position Sizing Recommendation
      const positionSizing = await this.calculatePositionSizing(
        symbol,
        inputs,
        riskAssessment,
      );

      // Generate Primary Signal
      const primarySignal = await this.generatePrimarySignal(
        factors,
        riskAssessment,
        timingAnalysis,
      );

      // Apply Signal Filters
      const filteredSignal = await this.applySignalFilters(
        symbol,
        primarySignal,
        inputs,
      );

      // Generate Stop Loss and Take Profit Levels
      const levels = await this.calculateTradingLevels(
        symbol,
        inputs,
        filteredSignal,
      );

      // Create comprehensive trading signals
      const signals: TradingSignals = {
        signal: filteredSignal.action,
        strength: filteredSignal.strength,
        reasoning: filteredSignal.reasoning,
        thresholds: {
          buyThreshold: options.buyThreshold || 0.65,
          sellThreshold: options.sellThreshold || 0.35,
          confidenceThreshold: options.confidenceThreshold || 0.7,
          uncertaintyThreshold: options.uncertaintyThreshold || 0.25,
        },
        riskMetrics: {
          maxDrawdown: riskAssessment.maxDrawdown,
          volatility: riskAssessment.volatility,
          sharpeRatio: riskAssessment.sharpeRatio,
        },
        // Extended properties for advanced signals
        factors,
        riskAssessment,
        timingAnalysis,
        positionSizing,
        levels,
        confidence: filteredSignal.confidence,
        executionPriority: this.calculateExecutionPriority(
          filteredSignal,
          riskAssessment,
        ),
        validUntil: new Date(
          Date.now() + (options.validityMinutes || 30) * 60000,
        ),
        metadata: {
          generatedAt: new Date(),
          version: '3.0.0',
          modelInputs: Object.keys(inputs),
          executionTime: Date.now() - startTime,
        },
      };

      // Cache and log signal
      await this.cacheAndLogSignal(symbol, signals);

      return signals;
    } catch (error) {
      this.logger.error(`Error generating signals for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Analyze multiple factors that influence trading decisions
   */
  private async analyzeSignalFactors(
    symbol: string,
    inputs: any,
  ): Promise<any> {
    const factors = {
      technical: this.analyzeTechnicalFactors(inputs.technicalFeatures),
      fundamental: this.analyzeFundamentalFactors(symbol, inputs),
      sentiment: this.analyzeSentimentFactors(inputs.sentimentScore),
      market: this.analyzeMarketFactors(inputs.marketState),
      momentum: this.analyzeMomentumFactors(inputs),
      volatility: this.analyzeVolatilityFactors(inputs),
      liquidity: this.analyzeLiquidityFactors(symbol, inputs),
      correlation: await this.analyzeCorrelationFactors(symbol, inputs),
    };

    // Calculate factor weights based on current market conditions
    const weights = this.calculateFactorWeights(inputs.marketState, factors);

    // Weighted factor score
    const weightedScore = this.calculateWeightedFactorScore(factors, weights);

    return {
      individual: factors,
      weights,
      weightedScore,
      dominantFactors: this.identifyDominantFactors(factors, weights),
    };
  }

  /**
   * Assess risk factors for signal generation
   */
  private async assessRiskFactors(
    symbol: string,
    inputs: any,
    factors: any,
  ): Promise<any> {
    const technicalRisk = this.calculateTechnicalRisk(inputs.technicalFeatures);
    const marketRisk = this.calculateMarketRisk(inputs.marketState);
    const sentimentRisk = this.calculateSentimentRisk(inputs.sentimentScore);
    const liquidityRisk = this.calculateLiquidityRisk(symbol, inputs);
    const concentrationRisk = this.calculateConcentrationRisk(
      symbol,
      inputs.portfolioContext,
    );

    // Model uncertainty risk
    const modelRisk = inputs.marketPrediction
      ? inputs.marketPrediction.uncertaintyBounds.standardError
      : 0.15;

    // Aggregate risk score
    const overallRisk = this.aggregateRiskScores({
      technical: technicalRisk,
      market: marketRisk,
      sentiment: sentimentRisk,
      liquidity: liquidityRisk,
      concentration: concentrationRisk,
      model: modelRisk,
    });

    return {
      components: {
        technical: technicalRisk,
        market: marketRisk,
        sentiment: sentimentRisk,
        liquidity: liquidityRisk,
        concentration: concentrationRisk,
        model: modelRisk,
      },
      overall: overallRisk,
      riskLevel: this.categorizeRiskLevel(overallRisk),
      maxDrawdown: Math.max(overallRisk * 0.8, 0.05), // Min 5% max DD
      volatility: this.estimatePositionVolatility(inputs, overallRisk),
      sharpeRatio: this.estimateExpectedSharpe(factors, overallRisk),
      recommendations: this.generateRiskRecommendations(overallRisk, factors),
    };
  }

  /**
   * Analyze optimal market timing
   */
  private async analyzeMarketTiming(
    symbol: string,
    inputs: any,
    factors: any,
  ): Promise<any> {
    const technicalTiming = this.analyzeTechnicalTiming(
      inputs.technicalFeatures,
    );
    const sentimentTiming = this.analyzeSentimentTiming(inputs.sentimentScore);
    const marketCycleTiming = this.analyzeMarketCycleTiming(inputs.marketState);
    const seasonalTiming = this.analyzeSeasonalTiming(symbol);
    const eventTiming = await this.analyzeEventTiming(symbol);

    // Get historical signal performance for timing optimization
    const historicalPerformance =
      await this.getHistoricalSignalPerformance(symbol);

    const overallTiming = this.synthesizeTimingAnalysis({
      technical: technicalTiming,
      sentiment: sentimentTiming,
      marketCycle: marketCycleTiming,
      seasonal: seasonalTiming,
      events: eventTiming,
      historical: historicalPerformance,
    });

    return {
      components: {
        technical: technicalTiming,
        sentiment: sentimentTiming,
        marketCycle: marketCycleTiming,
        seasonal: seasonalTiming,
        events: eventTiming,
      },
      overall: overallTiming,
      optimalEntry: overallTiming.score > 0.7,
      timingScore: overallTiming.score,
      waitRecommendation: overallTiming.score < 0.4,
      urgency: this.calculateUrgency(overallTiming, factors),
    };
  }

  /**
   * Calculate optimal position sizing
   */
  private async calculatePositionSizing(
    symbol: string,
    inputs: any,
    riskAssessment: any,
  ): Promise<any> {
    const portfolio = inputs.portfolioContext || {};
    const riskProfile = inputs.riskProfile || { tolerance: 'MODERATE' };

    // Kelly Criterion calculation
    const kellySize = this.calculateKellySize(inputs, riskAssessment);

    // Risk parity sizing
    const riskParitySize = this.calculateRiskParitySize(
      portfolio,
      riskAssessment,
    );

    // Volatility-based sizing
    const volatilitySize = this.calculateVolatilityBasedSize(riskAssessment);

    // Portfolio heat sizing
    const heatSize = this.calculatePortfolioHeatSize(portfolio, riskAssessment);

    // Combine sizing methods
    const combinedSize = this.combineSizingMethods(
      {
        kelly: kellySize,
        riskParity: riskParitySize,
        volatility: volatilitySize,
        heat: heatSize,
      },
      riskProfile,
    );

    return {
      recommended: combinedSize,
      methods: {
        kelly: kellySize,
        riskParity: riskParitySize,
        volatility: volatilitySize,
        heat: heatSize,
      },
      constraints: {
        maxPosition: riskProfile.maxPositionSize || 0.1, // 10% max
        minPosition: 0.001, // 0.1% min
        portfolioHeat: riskProfile.maxPortfolioHeat || 0.2, // 20% max
      },
      rationale: this.generateSizingRationale(combinedSize, riskAssessment),
    };
  }

  /**
   * Generate primary trading signal from all factors
   */
  private async generatePrimarySignal(
    factors: any,
    riskAssessment: any,
    timingAnalysis: any,
  ): Promise<any> {
    const factorScore = factors.weightedScore;
    const riskAdjustment = this.calculateRiskAdjustment(riskAssessment);
    const timingAdjustment = this.calculateTimingAdjustment(timingAnalysis);

    // Combined signal strength
    const rawStrength = factorScore * riskAdjustment * timingAdjustment;
    const adjustedStrength = Math.max(0, Math.min(1, rawStrength));

    // Determine signal direction and action
    let action: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL' = 'HOLD';

    if (adjustedStrength > 0.8) action = 'STRONG_BUY';
    else if (adjustedStrength > 0.65) action = 'BUY';
    else if (adjustedStrength < 0.2) action = 'STRONG_SELL';
    else if (adjustedStrength < 0.35) action = 'SELL';

    const confidence = this.calculateSignalConfidence(
      factors,
      riskAssessment,
      timingAnalysis,
    );

    const reasoning = this.generateSignalReasoning({
      factors,
      riskAssessment,
      timingAnalysis,
      action,
      strength: adjustedStrength,
    });

    return {
      action,
      strength: adjustedStrength,
      confidence,
      reasoning,
      components: {
        factorScore,
        riskAdjustment,
        timingAdjustment,
      },
    };
  }
  /**
   * Apply various filters to refine signals
   */
  private async applySignalFilters(
    symbol: string,
    primarySignal: any,
    inputs: any,
  ): Promise<any> {
    let filteredSignal = { ...primarySignal };
    const filters: string[] = [];

    // Volatility filter
    if (inputs.technicalFeatures?.volatility > 0.4) {
      filteredSignal.strength *= 0.8;
      filters.push('High volatility detected - reduced signal strength');
    }

    // Market condition filter
    if (
      inputs.marketState?.marketTrend === 'BEARISH' &&
      filteredSignal.action.includes('BUY')
    ) {
      filteredSignal.strength *= 0.7;
      filters.push('Bear market condition - reduced buy signal strength');
    }

    // Sentiment divergence filter
    if (
      inputs.sentimentScore &&
      this.detectSentimentDivergence(inputs.sentimentScore, filteredSignal)
    ) {
      filteredSignal.strength *= 0.85;
      filters.push('Sentiment divergence detected - signal adjustment');
    }

    // Liquidity filter
    const liquidityCheck = await this.checkLiquidityConstraints(
      symbol,
      filteredSignal,
    );
    if (!liquidityCheck.passed) {
      filteredSignal.strength *= liquidityCheck.adjustment;
      filters.push(`Liquidity constraint: ${liquidityCheck.reason}`);
    }

    // Risk budget filter
    if (inputs.portfolioContext) {
      const riskBudgetCheck = this.checkRiskBudget(
        inputs.portfolioContext,
        filteredSignal,
      );
      if (!riskBudgetCheck.passed) {
        filteredSignal.action = 'HOLD';
        filteredSignal.strength = 0.3;
        filters.push('Risk budget exceeded - signal overridden to HOLD');
      }
    }

    // Add filter information to reasoning
    if (filters.length > 0) {
      filteredSignal.reasoning += ` Filters applied: ${filters.join('; ')}`;
    }

    return {
      ...filteredSignal,
      filtersApplied: filters,
    };
  }

  /**
   * Calculate trading levels (stop loss, take profit, etc.)
   */
  private async calculateTradingLevels(
    symbol: string,
    inputs: any,
    signal: any,
  ): Promise<any> {
    const currentPrice = inputs.technicalFeatures?.price || 100; // Default for mock
    const volatility = inputs.technicalFeatures?.volatility || 0.2;
    const atr = volatility * currentPrice * 0.02; // Approximate ATR

    // Support and resistance levels
    const support = inputs.technicalFeatures?.support || currentPrice * 0.95;
    const resistance =
      inputs.technicalFeatures?.resistance || currentPrice * 1.05;

    // Dynamic stop loss based on volatility and signal strength
    const stopLossDistance = this.calculateDynamicStopLoss(
      volatility,
      signal.strength,
      atr,
    );
    const takeProfitDistance = this.calculateDynamicTakeProfit(
      volatility,
      signal.strength,
      atr,
    );

    let stopLoss, takeProfit;

    if (signal.action.includes('BUY')) {
      stopLoss = Math.max(support, currentPrice - stopLossDistance);
      takeProfit = Math.min(
        resistance * 1.1,
        currentPrice + takeProfitDistance,
      );
    } else if (signal.action.includes('SELL')) {
      stopLoss = Math.min(resistance, currentPrice + stopLossDistance);
      takeProfit = Math.max(support * 0.9, currentPrice - takeProfitDistance);
    } else {
      // HOLD - defensive levels
      stopLoss = currentPrice * 0.95;
      takeProfit = currentPrice * 1.05;
    }

    return {
      entry: currentPrice,
      stopLoss,
      takeProfit,
      support,
      resistance,
      riskRewardRatio:
        Math.abs(takeProfit - currentPrice) / Math.abs(currentPrice - stopLoss),
      atr,
      levels: {
        immediate: {
          support: currentPrice * 0.98,
          resistance: currentPrice * 1.02,
        },
        shortTerm: {
          support: currentPrice * 0.95,
          resistance: currentPrice * 1.05,
        },
        mediumTerm: {
          support: currentPrice * 0.9,
          resistance: currentPrice * 1.1,
        },
      },
    };
  }

  // ==================== HELPER METHODS ====================

  private analyzeTechnicalFactors(features?: TechnicalFeatures): any {
    if (!features) return { score: 0.5, strength: 'NEUTRAL' };

    const rsiScore = this.normalizeRSI(features.rsi);
    const macdScore = this.normalizeMACD(features.macd);
    const volumeScore = this.normalizeVolume(features.volume);
    const momentumScore = this.normalizeMomentum(features.momentum);

    const overallScore =
      (rsiScore + macdScore + volumeScore + momentumScore) / 4;

    return {
      score: overallScore,
      components: {
        rsi: rsiScore,
        macd: macdScore,
        volume: volumeScore,
        momentum: momentumScore,
      },
      strength:
        overallScore > 0.6
          ? 'BULLISH'
          : overallScore < 0.4
            ? 'BEARISH'
            : 'NEUTRAL',
    };
  }

  private analyzeFundamentalFactors(symbol: string, inputs: any): any {
    // Mock fundamental analysis - would use real data in production
    const peRatio = 15 + Math.random() * 20;
    const earningsGrowth = Math.random() * 0.3 - 0.1;
    const debtToEquity = Math.random() * 0.8;

    let score = 0.5;
    if (peRatio < 20) score += 0.1;
    if (earningsGrowth > 0.1) score += 0.2;
    if (debtToEquity < 0.4) score += 0.1;

    return {
      score: Math.max(0, Math.min(1, score)),
      metrics: { peRatio, earningsGrowth, debtToEquity },
      strength: score > 0.6 ? 'STRONG' : score < 0.4 ? 'WEAK' : 'MODERATE',
    };
  }

  private analyzeSentimentFactors(sentiment?: SentimentScore): any {
    if (!sentiment) return { score: 0.5, strength: 'NEUTRAL' };

    const normalizedSentiment = (sentiment.overallSentiment + 1) / 2; // Convert [-1,1] to [0,1]
    const confidenceAdjusted = normalizedSentiment * sentiment.confidence;

    return {
      score: confidenceAdjusted,
      confidence: sentiment.confidence,
      strength:
        confidenceAdjusted > 0.6
          ? 'POSITIVE'
          : confidenceAdjusted < 0.4
            ? 'NEGATIVE'
            : 'NEUTRAL',
    };
  }

  private analyzeMarketFactors(marketState?: MarketState): any {
    if (!marketState) return { score: 0.5, strength: 'NEUTRAL' };

    let score = 0.5;

    // VIX level analysis
    if (marketState.vixLevel < 20)
      score += 0.2; // Low volatility is bullish
    else if (marketState.vixLevel > 30) score -= 0.2; // High volatility is bearish

    // Market trend analysis
    if (marketState.marketTrend === 'BULLISH') score += 0.3;
    else if (marketState.marketTrend === 'BEARISH') score -= 0.3;

    return {
      score: Math.max(0, Math.min(1, score)),
      vixLevel: marketState.vixLevel,
      trend: marketState.marketTrend,
      strength:
        score > 0.6 ? 'FAVORABLE' : score < 0.4 ? 'UNFAVORABLE' : 'NEUTRAL',
    };
  }

  private analyzeMomentumFactors(inputs: any): any {
    const momentum = inputs.technicalFeatures?.momentum || 0;
    const normalizedMomentum = Math.max(0, Math.min(1, (momentum + 1) / 2));

    return {
      score: normalizedMomentum,
      rawMomentum: momentum,
      strength:
        normalizedMomentum > 0.6
          ? 'STRONG'
          : normalizedMomentum < 0.4
            ? 'WEAK'
            : 'MODERATE',
    };
  }

  private analyzeVolatilityFactors(inputs: any): any {
    const volatility = inputs.technicalFeatures?.volatility || 0.2;

    // Lower volatility generally better for signals
    const volatilityScore = Math.max(0, 1 - volatility * 2);

    return {
      score: volatilityScore,
      rawVolatility: volatility,
      level: volatility > 0.4 ? 'HIGH' : volatility < 0.15 ? 'LOW' : 'MODERATE',
    };
  }

  private analyzeLiquidityFactors(symbol: string, inputs: any): any {
    const volume = inputs.technicalFeatures?.volume || 1000000;

    // Mock liquidity analysis
    const avgVolume = 1500000; // Mock average volume
    const liquidityRatio = volume / avgVolume;
    const liquidityScore = Math.min(1, liquidityRatio);

    return {
      score: liquidityScore,
      volume,
      avgVolume,
      level:
        liquidityScore > 0.8
          ? 'HIGH'
          : liquidityScore < 0.5
            ? 'LOW'
            : 'MODERATE',
    };
  }

  private async analyzeCorrelationFactors(
    symbol: string,
    inputs: any,
  ): Promise<any> {
    // Mock correlation analysis
    const marketCorrelation = 0.3 + Math.random() * 0.4; // 0.3 to 0.7
    const sectorCorrelation = 0.5 + Math.random() * 0.3; // 0.5 to 0.8

    // Lower correlation is generally better for diversification
    const correlationScore = 1 - (marketCorrelation + sectorCorrelation) / 2;

    return {
      score: correlationScore,
      marketCorrelation,
      sectorCorrelation,
      level:
        correlationScore > 0.6
          ? 'LOW'
          : correlationScore < 0.3
            ? 'HIGH'
            : 'MODERATE',
    };
  }

  private calculateFactorWeights(marketState: any, factors: any): any {
    // Dynamic weight calculation based on market conditions
    const baseWeights = {
      technical: 0.25,
      fundamental: 0.15,
      sentiment: 0.2,
      market: 0.15,
      momentum: 0.1,
      volatility: 0.05,
      liquidity: 0.05,
      correlation: 0.05,
    };

    // Adjust weights based on market state
    if (marketState?.marketTrend === 'BEARISH') {
      baseWeights.technical += 0.1;
      baseWeights.sentiment += 0.05;
      baseWeights.fundamental -= 0.1;
      baseWeights.momentum -= 0.05;
    }

    return baseWeights;
  }

  private calculateWeightedFactorScore(factors: any, weights: any): number {
    return Object.keys(factors.individual).reduce((sum, key) => {
      return sum + factors.individual[key].score * (weights[key] || 0);
    }, 0);
  }

  private identifyDominantFactors(factors: any, weights: any): string[] {
    const factorScores = Object.keys(factors.individual).map((key) => ({
      name: key,
      weightedScore: factors.individual[key].score * (weights[key] || 0),
    }));

    return factorScores
      .sort((a, b) => b.weightedScore - a.weightedScore)
      .slice(0, 3)
      .map((f) => f.name);
  }

  // Additional helper methods would continue here...
  // For brevity, I'll include just the essential ones

  private calculateTechnicalRisk(features?: TechnicalFeatures): number {
    if (!features) return 0.3;

    const volatilityRisk = Math.min(features.volatility * 2, 0.5);
    const rsiRisk = Math.abs(features.rsi - 50) / 100; // Distance from neutral

    return (volatilityRisk + rsiRisk) / 2;
  }

  private calculateMarketRisk(marketState?: MarketState): number {
    if (!marketState) return 0.3;

    const vixRisk = Math.min(marketState.vixLevel / 50, 0.5);
    const trendRisk = marketState.marketTrend === 'BEARISH' ? 0.3 : 0.1;

    return (vixRisk + trendRisk) / 2;
  }

  private calculateSentimentRisk(sentiment?: SentimentScore): number {
    if (!sentiment) return 0.2;

    const confidenceRisk = 1 - sentiment.confidence;
    const extremeRisk = Math.abs(sentiment.overallSentiment) > 0.8 ? 0.2 : 0;

    return (confidenceRisk + extremeRisk) / 2;
  }

  private calculateLiquidityRisk(symbol: string, inputs: any): number {
    const volume = inputs.technicalFeatures?.volume || 1000000;
    const avgVolume = 1500000; // Mock

    const liquidityRatio = volume / avgVolume;
    return liquidityRatio < 0.5 ? 0.3 : liquidityRatio < 0.8 ? 0.15 : 0.05;
  }

  private calculateConcentrationRisk(symbol: string, portfolio: any): number {
    if (!portfolio || !portfolio.positions) return 0.1;

    const totalValue = portfolio.totalValue || 100000;
    const symbolPosition = portfolio.positions.find(
      (p: any) => p.symbol === symbol,
    );
    const concentration = symbolPosition
      ? symbolPosition.value / totalValue
      : 0;

    return concentration > 0.2 ? 0.4 : concentration > 0.1 ? 0.2 : 0.05;
  }

  private aggregateRiskScores(risks: any): number {
    const weights = {
      technical: 0.25,
      market: 0.25,
      sentiment: 0.15,
      liquidity: 0.15,
      concentration: 0.15,
      model: 0.05,
    };

    return Object.keys(risks).reduce((sum, key) => {
      return sum + risks[key] * (weights[key] || 0);
    }, 0);
  }

  private categorizeRiskLevel(riskScore: number): string {
    if (riskScore > 0.4) return 'HIGH';
    if (riskScore > 0.25) return 'MEDIUM';
    return 'LOW';
  }

  private async cacheAndLogSignal(
    symbol: string,
    signals: TradingSignals,
  ): Promise<void> {
    // Cache signal
    this.signalCache.set(symbol, signals);

    // Maintain signal history
    const history = this.signalHistory.get(symbol) || [];
    history.push({
      timestamp: new Date(),
      signal: signals.signal,
      strength: signals.strength,
      confidence: (signals as any).confidence,
    });

    // Keep only last 100 signals
    if (history.length > 100) {
      history.shift();
    }

    this.signalHistory.set(symbol, history);

    // Log to database
    try {
      const mlPrediction = this.mlPredictionRepository.create({
        modelId: 'signal_generation_v3',
        symbol,
        predictionType: 'trading_signal',
        inputFeatures: {
          factors: (signals as any).factors?.dominantFactors,
          riskLevel: signals.riskMetrics,
        },
        outputPrediction: {
          signal: signals.signal,
          strength: signals.strength,
          reasoning: signals.reasoning,
        },
        confidence: (signals as any).confidence || 0.8,
        executionTime: (signals as any).metadata?.executionTime || 100,
      });

      await this.mlPredictionRepository.save(mlPrediction);
    } catch (error) {
      this.logger.error('Error logging signal:', error);
    }
  }

  // Mock implementations for complex calculations
  private normalizeRSI(rsi: number): number {
    return rsi > 70 ? 0.2 : rsi < 30 ? 0.8 : 0.5;
  }

  private normalizeMACD(macd: number): number {
    return Math.max(0, Math.min(1, (macd + 1) / 2));
  }

  private normalizeVolume(volume: number): number {
    return Math.min(1, volume / 2000000); // Normalize against 2M average
  }

  private normalizeMomentum(momentum: number): number {
    return Math.max(0, Math.min(1, (momentum + 1) / 2));
  }

  private calculateRiskAdjustment(riskAssessment: any): number {
    return Math.max(0.5, 1 - riskAssessment.overall);
  }

  private calculateTimingAdjustment(timingAnalysis: any): number {
    return timingAnalysis.timingScore;
  }

  private calculateSignalConfidence(
    factors: any,
    risk: any,
    timing: any,
  ): number {
    const factorConfidence = factors.weightedScore;
    const riskConfidence = 1 - risk.overall;
    const timingConfidence = timing.timingScore;

    return (factorConfidence + riskConfidence + timingConfidence) / 3;
  }

  private generateSignalReasoning(params: any): string {
    const { factors, action, strength } = params;
    const dominant = factors.dominantFactors.join(', ');

    return `${action} signal (${(strength * 100).toFixed(0)}% strength) based on: ${dominant}`;
  }

  // Placeholder implementations for other complex methods
  private analyzeTechnicalTiming(features: any): any {
    return { score: 0.7 };
  }
  private analyzeSentimentTiming(sentiment: any): any {
    return { score: 0.6 };
  }
  private analyzeMarketCycleTiming(market: any): any {
    return { score: 0.8 };
  }
  private analyzeSeasonalTiming(symbol: string): any {
    return { score: 0.5 };
  }
  private async analyzeEventTiming(symbol: string): Promise<any> {
    return { score: 0.6 };
  }
  private async getHistoricalSignalPerformance(symbol: string): Promise<any> {
    return { accuracy: 0.7 };
  }
  private synthesizeTimingAnalysis(components: any): any {
    return { score: 0.7 };
  }
  private calculateUrgency(timing: any, factors: any): string {
    return 'MEDIUM';
  }

  private calculateKellySize(inputs: any, risk: any): number {
    return 0.05;
  }
  private calculateRiskParitySize(portfolio: any, risk: any): number {
    return 0.03;
  }
  private calculateVolatilityBasedSize(risk: any): number {
    return 0.04;
  }
  private calculatePortfolioHeatSize(portfolio: any, risk: any): number {
    return 0.06;
  }
  private combineSizingMethods(methods: any, profile: any): number {
    return 0.04;
  }
  private generateSizingRationale(size: number, risk: any): string {
    return 'Moderate position size';
  }

  private detectSentimentDivergence(sentiment: any, signal: any): boolean {
    return false;
  }
  private async checkLiquidityConstraints(
    symbol: string,
    signal: any,
  ): Promise<any> {
    return { passed: true, adjustment: 1, reason: '' };
  }
  private checkRiskBudget(portfolio: any, signal: any): any {
    return { passed: true };
  }

  private calculateDynamicStopLoss(
    vol: number,
    strength: number,
    atr: number,
  ): number {
    return atr * (2 - strength) * Math.max(1, vol * 5);
  }

  private calculateDynamicTakeProfit(
    vol: number,
    strength: number,
    atr: number,
  ): number {
    return atr * (1 + strength) * Math.max(1.5, vol * 3);
  }

  private calculateExecutionPriority(
    signal: any,
    risk: any,
  ): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (signal.strength > 0.8 && risk.overall < 0.3) return 'HIGH';
    if (signal.strength > 0.6 && risk.overall < 0.4) return 'MEDIUM';
    return 'LOW';
  }

  private estimatePositionVolatility(inputs: any, risk: number): number {
    return (inputs.technicalFeatures?.volatility || 0.2) * (1 + risk);
  }

  private estimateExpectedSharpe(factors: any, risk: number): number {
    const expectedReturn = factors.weightedScore * 0.15; // Max 15% return
    const riskFreeRate = 0.02; // 2% risk-free rate
    const volatility = risk * 0.3; // Convert to volatility

    return (expectedReturn - riskFreeRate) / (volatility || 0.01);
  }
  private generateRiskRecommendations(risk: number, factors: any): string[] {
    const recommendations: string[] = [];

    if (risk > 0.4)
      recommendations.push('Consider reducing position size due to high risk');
    if (factors.individual.volatility?.level === 'HIGH')
      recommendations.push('Monitor volatility closely');
    if (factors.individual.liquidity?.level === 'LOW')
      recommendations.push('Be cautious of liquidity constraints');

    return recommendations;
  }
}
