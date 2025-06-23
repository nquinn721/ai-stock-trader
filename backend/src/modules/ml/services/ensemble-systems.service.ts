import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MLModel,
  MLPrediction,
  MLMetric,
  MLModelPerformance,
} from '../entities/ml.entities';
import {
  MarketPrediction,
  TradingSignals,
  TechnicalFeatures,
  SentimentScore,
  MarketState,
  AdvancedPatternRecognition,
} from '../interfaces/ml.interfaces';

/**
 * Ensemble Systems Service - Phase 3 (S29)
 * Coordinates multiple ML models and services to create sophisticated
 * ensemble predictions and meta-learning systems
 */
@Injectable()
export class EnsembleSystemsService {
  private readonly logger = new Logger(EnsembleSystemsService.name);
  private modelPerformanceCache: Map<string, any> = new Map();
  private ensembleWeights: Map<string, any> = new Map();
  private metaLearningModels: Map<string, any> = new Map();

  constructor(
    @InjectRepository(MLModel)
    private mlModelRepository: Repository<MLModel>,
    @InjectRepository(MLPrediction)
    private mlPredictionRepository: Repository<MLPrediction>,
    @InjectRepository(MLMetric)
    private mlMetricRepository: Repository<MLMetric>,
    @InjectRepository(MLModelPerformance)
    private mlPerformanceRepository: Repository<MLModelPerformance>,
  ) {
    this.logger.log('🚀 Ensemble Systems Service initialized - Phase 3');
    this.initializeEnsembleSystems();
  }

  /**
   * Generate comprehensive ensemble predictions using multiple ML services
   * This is the master orchestrator for all ML predictions in Phase 3
   */
  async generateEnsemblePrediction(
    symbol: string,
    inputs: {
      technicalFeatures: TechnicalFeatures;
      sentimentScore?: SentimentScore;
      marketState?: MarketState;
      patterns?: AdvancedPatternRecognition;
      portfolioContext?: any;
    },
    services: {
      marketPredictionService?: any;
      sentimentAnalysisService?: any;
      patternRecognitionService?: any;
      signalGenerationService?: any;
    },
    options: any = {},
  ): Promise<any> {
    this.logger.log(`Generating ensemble prediction for ${symbol}`);

    const startTime = Date.now();

    try {
      // Phase 1: Collect predictions from all available services
      const predictions = await this.collectServicePredictions(symbol, inputs, services, options);
      
      // Phase 2: Apply dynamic weighting based on recent performance
      const weights = await this.calculateDynamicWeights(symbol, predictions, inputs);
      
      // Phase 3: Generate ensemble prediction using advanced methods
      const ensemblePrediction = await this.combineEnsemblePredictions(predictions, weights, options);
      
      // Phase 4: Apply meta-learning improvements
      const metaEnhancedPrediction = await this.applyMetaLearning(symbol, ensemblePrediction, predictions, inputs);
      
      // Phase 5: Generate uncertainty quantification
      const uncertaintyAnalysis = await this.quantifyUncertainty(predictions, metaEnhancedPrediction);
      
      // Phase 6: Create adaptive confidence intervals
      const confidenceIntervals = await this.calculateAdaptiveConfidence(symbol, metaEnhancedPrediction, uncertaintyAnalysis);
      
      // Phase 7: Generate ensemble trading signals
      const ensembleSignals = await this.generateEnsembleSignals(
        symbol,
        metaEnhancedPrediction,
        uncertaintyAnalysis,
        inputs,
        options
      );

      const result = {
        symbol,
        timestamp: new Date(),
        
        // Core predictions
        predictions: predictions,
        weights: weights,
        ensemblePrediction: metaEnhancedPrediction,
        
        // Uncertainty and confidence
        uncertaintyAnalysis,
        confidenceIntervals,
        
        // Trading signals
        signals: ensembleSignals,
        
        // Performance and quality metrics
        ensembleQuality: this.assessEnsembleQuality(predictions, weights),
        diversityMetrics: this.calculateDiversityMetrics(predictions),
        
        // Meta information
        metadata: {
          version: '3.0.0',
          servicesUsed: Object.keys(services).filter(key => services[key]),
          executionTime: Date.now() - startTime,
          ensembleMethod: 'dynamic_weighted_meta_learning',
          qualityScore: this.calculateOverallQuality(predictions, metaEnhancedPrediction),
        },
      };

      // Log ensemble prediction for continuous improvement
      await this.logEnsemblePrediction(symbol, result);
      
      // Update model performance tracking
      await this.updateModelPerformance(symbol, predictions, result);

      return result;

    } catch (error) {
      this.logger.error(`Error generating ensemble prediction for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Collect predictions from all available ML services
   */
  private async collectServicePredictions(
    symbol: string,
    inputs: any,
    services: any,
    options: any
  ): Promise<any> {
    const predictions: any = {};

    try {
      // Market Prediction Service
      if (services.marketPredictionService) {
        const marketPred = await services.marketPredictionService.predictMarket(
          symbol,
          inputs.technicalFeatures,
          options.horizons || ['1h', '4h', '1d', '1w'],
          options
        );
        predictions.market = {
          source: 'market_prediction',
          prediction: marketPred,
          confidence: marketPred.confidence,
          weight: 0.3, // Base weight
        };
      }

      // Sentiment Analysis (enhanced if available)
      if (services.sentimentAnalysisService && inputs.sentimentScore) {
        predictions.sentiment = {
          source: 'sentiment_analysis',
          prediction: inputs.sentimentScore,
          confidence: inputs.sentimentScore.confidence,
          weight: 0.2, // Base weight
        };
      }

      // Pattern Recognition
      if (services.patternRecognitionService) {
        const patterns = await services.patternRecognitionService.recognizePatterns(
          symbol,
          [], // Historical data would be passed here
          options.timeframes || ['1d'],
          options.patternTypes || ['all']
        );
        predictions.patterns = {
          source: 'pattern_recognition',
          prediction: patterns,
          confidence: patterns.confidence,
          weight: 0.25, // Base weight
        };
      }

      // Signal Generation (if used as input prediction)
      if (services.signalGenerationService && options.includeSignals) {
        const signals = await services.signalGenerationService.generateAdvancedSignals(
          symbol,
          inputs,
          options
        );
        predictions.signals = {
          source: 'signal_generation',
          prediction: signals,
          confidence: signals.confidence || 0.8,
          weight: 0.25, // Base weight
        };
      }

      // Technical Analysis (baseline)
      predictions.technical = {
        source: 'technical_analysis',
        prediction: this.generateTechnicalPrediction(inputs.technicalFeatures),
        confidence: 0.7,
        weight: 0.15, // Base weight
      };

      // Fundamental Analysis (mock for now)
      predictions.fundamental = {
        source: 'fundamental_analysis',
        prediction: this.generateFundamentalPrediction(symbol),
        confidence: 0.6,
        weight: 0.1, // Base weight
      };

    } catch (error) {
      this.logger.error('Error collecting service predictions:', error);
    }

    return predictions;
  }

  /**
   * Calculate dynamic weights based on recent performance and current conditions
   */
  private async calculateDynamicWeights(
    symbol: string,
    predictions: any,
    inputs: any
  ): Promise<any> {
    const weights: any = {};
    
    // Get recent performance data for each prediction source
    const performanceData = await this.getRecentPerformance(symbol, Object.keys(predictions));
    
    // Market condition adaptations
    const marketConditionWeights = this.adaptWeightsToMarketConditions(inputs.marketState, predictions);
    
    // Volatility-based adaptations
    const volatilityWeights = this.adaptWeightsToVolatility(inputs.technicalFeatures?.volatility, predictions);
    
    // Confidence-based adaptations
    const confidenceWeights = this.adaptWeightsToConfidence(predictions);
    
    // Calculate final dynamic weights
    for (const key of Object.keys(predictions)) {
      const baseWeight = predictions[key].weight;
      const performanceMultiplier = performanceData[key]?.accuracy || 1.0;
      const marketMultiplier = marketConditionWeights[key] || 1.0;
      const volatilityMultiplier = volatilityWeights[key] || 1.0;
      const confidenceMultiplier = confidenceWeights[key] || 1.0;
      
      weights[key] = baseWeight * performanceMultiplier * marketMultiplier * volatilityMultiplier * confidenceMultiplier;
    }    // Normalize weights to sum to 1
    const weightValues = Object.values(weights) as number[];
    const totalWeight: number = weightValues.reduce((sum: number, weight: number) => sum + weight, 0);
    for (const key of Object.keys(weights)) {
      weights[key] = (weights[key] as number) / totalWeight;
    }
    
    return {
      weights,
      adaptations: {
        performance: performanceData,
        marketCondition: marketConditionWeights,
        volatility: volatilityWeights,
        confidence: confidenceWeights,
      },
    };
  }

  /**
   * Combine predictions using advanced ensemble methods
   */
  private async combineEnsemblePredictions(
    predictions: any,
    weights: any,
    options: any
  ): Promise<any> {
    const method = options.ensembleMethod || 'weighted_average';
    
    switch (method) {
      case 'weighted_average':
        return this.weightedAverageEnsemble(predictions, weights.weights);
      
      case 'dynamic_selection':
        return this.dynamicSelectionEnsemble(predictions, weights);
      
      case 'stacking':
        return this.stackingEnsemble(predictions, weights);
      
      case 'boosting':
        return this.boostingEnsemble(predictions, weights);
      
      default:
        return this.weightedAverageEnsemble(predictions, weights.weights);
    }
  }

  /**
   * Apply meta-learning to improve predictions
   */
  private async applyMetaLearning(
    symbol: string,
    ensemblePrediction: any,
    basePredictions: any,
    inputs: any
  ): Promise<any> {
    // Get meta-learning model for this symbol/context
    const metaModel = await this.getMetaLearningModel(symbol, inputs);
    
    if (!metaModel) {
      return ensemblePrediction; // No meta-learning available
    }
    
    // Create meta-features from base predictions and context
    const metaFeatures = this.extractMetaFeatures(basePredictions, inputs, ensemblePrediction);
    
    // Apply meta-learning correction
    const metaCorrection = await this.applyMetaModel(metaModel, metaFeatures);
    
    // Combine original prediction with meta-learning correction
    const metaEnhancedPrediction = this.combineWithMetaCorrection(ensemblePrediction, metaCorrection);
    
    return {
      ...metaEnhancedPrediction,
      metaLearning: {
        modelUsed: metaModel.id,
        correction: metaCorrection,
        features: metaFeatures,
        confidence: metaModel.confidence,
      },
    };
  }

  /**
   * Quantify uncertainty across all predictions
   */
  private async quantifyUncertainty(
    predictions: any,
    ensemblePrediction: any
  ): Promise<any> {
    // Calculate prediction variance
    const predictionValues = Object.values(predictions).map((p: any) => {
      return this.extractPredictionValue(p.prediction);
    });
    
    const mean = predictionValues.reduce((sum, val) => sum + val, 0) / predictionValues.length;
    const variance = predictionValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / predictionValues.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Calculate model disagreement
    const disagreement = this.calculateModelDisagreement(predictions);
    
    // Estimate epistemic uncertainty (model uncertainty)
    const epistemicUncertainty = standardDeviation;
    
    // Estimate aleatoric uncertainty (data uncertainty)
    const aleatoricUncertainty = this.estimateAleatoricUncertainty(predictions);
    
    // Total uncertainty
    const totalUncertainty = Math.sqrt(epistemicUncertainty ** 2 + aleatoricUncertainty ** 2);
    
    return {
      epistemic: epistemicUncertainty,
      aleatoric: aleatoricUncertainty,
      total: totalUncertainty,
      disagreement,
      variance,
      standardDeviation,
      confidenceLevel: 1 - (totalUncertainty / Math.abs(mean)),
    };
  }

  /**
   * Calculate adaptive confidence intervals
   */
  private async calculateAdaptiveConfidence(
    symbol: string,
    prediction: any,
    uncertaintyAnalysis: any
  ): Promise<any> {
    const predictionValue = this.extractPredictionValue(prediction);
    const uncertainty = uncertaintyAnalysis.total;
    
    // Historical calibration data
    const calibrationData = await this.getConfidenceCalibrationData(symbol);
    
    // Adaptive multipliers based on market conditions and historical accuracy
    const adaptiveMultiplier = this.calculateAdaptiveMultiplier(calibrationData, uncertaintyAnalysis);
    
    const adjustedUncertainty = uncertainty * adaptiveMultiplier;
    
    return {
      prediction: predictionValue,
      intervals: {
        '50%': [predictionValue - 0.675 * adjustedUncertainty, predictionValue + 0.675 * adjustedUncertainty],
        '68%': [predictionValue - adjustedUncertainty, predictionValue + adjustedUncertainty],
        '90%': [predictionValue - 1.645 * adjustedUncertainty, predictionValue + 1.645 * adjustedUncertainty],
        '95%': [predictionValue - 1.96 * adjustedUncertainty, predictionValue + 1.96 * adjustedUncertainty],
        '99%': [predictionValue - 2.576 * adjustedUncertainty, predictionValue + 2.576 * adjustedUncertainty],
      },
      adaptiveMultiplier,
      calibrationQuality: calibrationData?.quality || 'unknown',
    };
  }

  /**
   * Generate ensemble trading signals
   */
  private async generateEnsembleSignals(
    symbol: string,
    ensemblePrediction: any,
    uncertaintyAnalysis: any,
    inputs: any,
    options: any
  ): Promise<TradingSignals> {
    const predictionValue = this.extractPredictionValue(ensemblePrediction);
    const confidence = ensemblePrediction.confidence || 0.8;
    const uncertainty = uncertaintyAnalysis.total;
    
    // Signal strength based on prediction magnitude and confidence
    const rawStrength = Math.abs(predictionValue) * confidence * (1 - uncertainty);
    const adjustedStrength = Math.max(0, Math.min(1, rawStrength));
    
    // Determine signal direction
    let signal: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL' = 'HOLD';
    
    if (predictionValue > 0.05 && adjustedStrength > 0.8) signal = 'STRONG_BUY';
    else if (predictionValue > 0.02 && adjustedStrength > 0.6) signal = 'BUY';
    else if (predictionValue < -0.05 && adjustedStrength > 0.8) signal = 'STRONG_SELL';
    else if (predictionValue < -0.02 && adjustedStrength > 0.6) signal = 'SELL';
    
    // Generate comprehensive reasoning
    const reasoning = this.generateEnsembleReasoning(ensemblePrediction, uncertaintyAnalysis, signal, adjustedStrength);
    
    // Calculate risk metrics
    const riskMetrics = this.calculateEnsembleRiskMetrics(uncertaintyAnalysis, inputs);
    
    return {
      signal,
      strength: adjustedStrength,
      reasoning,
      thresholds: {
        buyThreshold: options.buyThreshold || 0.6,
        sellThreshold: options.sellThreshold || 0.4,
        confidenceThreshold: options.confidenceThreshold || 0.7,
        uncertaintyThreshold: options.uncertaintyThreshold || 0.3,
      },
      riskMetrics,
      // Extended ensemble properties
      confidence,
      uncertaintyScore: uncertainty,
      ensembleQuality: ensemblePrediction.quality || 0.8,
      modelAgreement: 1 - uncertaintyAnalysis.disagreement,
    } as TradingSignals;
  }

  // ==================== ENSEMBLE METHODS ====================

  private weightedAverageEnsemble(predictions: any, weights: any): any {
    let weightedSum = 0;
    let totalWeight = 0;
    let weightedConfidence = 0;
    
    for (const key of Object.keys(predictions)) {
      const weight = weights[key] || 0;
      const value = this.extractPredictionValue(predictions[key].prediction);
      const confidence = predictions[key].confidence;
      
      weightedSum += value * weight;
      weightedConfidence += confidence * weight;
      totalWeight += weight;
    }
    
    return {
      prediction: weightedSum / totalWeight,
      confidence: weightedConfidence / totalWeight,
      method: 'weighted_average',
      weights,
    };
  }

  private dynamicSelectionEnsemble(predictions: any, weights: any): any {    // Select best performing model based on recent performance
    let bestModel: string | null = null;
    let bestScore = -Infinity;
    
    for (const key of Object.keys(predictions)) {
      const score = predictions[key].confidence * (weights.weights[key] || 0);
      if (score > bestScore) {
        bestScore = score;
        bestModel = key;
      }
    }
    
    if (!bestModel) {
      throw new Error('No valid model found for dynamic selection');
    }
    
    const selectedPrediction = predictions[bestModel];
    
    return {
      prediction: this.extractPredictionValue(selectedPrediction.prediction),
      confidence: selectedPrediction.confidence,
      method: 'dynamic_selection',
      selectedModel: bestModel,
      selectionScore: bestScore,
    };
  }

  private stackingEnsemble(predictions: any, weights: any): any {
    // Mock stacking implementation - would use a trained meta-model
    const weightedPrediction = this.weightedAverageEnsemble(predictions, weights.weights);
    
    // Apply stacking correction (mock)
    const stackingCorrection = Math.random() * 0.1 - 0.05; // ±5% adjustment
    
    return {
      prediction: weightedPrediction.prediction + stackingCorrection,
      confidence: weightedPrediction.confidence * 0.95, // Slightly lower confidence
      method: 'stacking',
      baselinePrediction: weightedPrediction.prediction,
      stackingCorrection,
    };
  }

  private boostingEnsemble(predictions: any, weights: any): any {
    // Mock boosting implementation
    const orderedPredictions = Object.keys(predictions)
      .map(key => ({
        key,
        prediction: this.extractPredictionValue(predictions[key].prediction),
        confidence: predictions[key].confidence,
        weight: weights.weights[key] || 0,
      }))
      .sort((a, b) => b.confidence - a.confidence);
    
    let boostedPrediction = 0;
    let totalWeight = 0;
    
    for (const pred of orderedPredictions) {
      const boostWeight = pred.weight * (1 + pred.confidence); // Boost high-confidence predictions
      boostedPrediction += pred.prediction * boostWeight;
      totalWeight += boostWeight;
    }
    
    return {
      prediction: boostedPrediction / totalWeight,
      confidence: orderedPredictions[0].confidence, // Use highest confidence
      method: 'boosting',
      boostOrder: orderedPredictions.map(p => p.key),
    };
  }

  // ==================== HELPER METHODS ====================

  private initializeEnsembleSystems(): void {
    // Initialize ensemble configurations
    this.ensembleWeights.set('default', {
      market: 0.3,
      sentiment: 0.2,
      patterns: 0.25,
      technical: 0.15,
      fundamental: 0.1,
    });
    
    // Initialize meta-learning models (mock)
    this.metaLearningModels.set('default', {
      id: 'meta_v1',
      confidence: 0.8,
      features: ['prediction_variance', 'model_agreement', 'market_volatility'],
    });
  }

  private extractPredictionValue(prediction: any): number {
    if (typeof prediction === 'number') return prediction;
    if (prediction.returnPrediction) return prediction.returnPrediction;
    if (prediction.prediction) return prediction.prediction;
    if (prediction.overallSentiment) return prediction.overallSentiment;
    return 0;
  }

  private generateTechnicalPrediction(features: TechnicalFeatures): any {
    const rsi = features.rsi;
    const momentum = features.momentum;
    const volatility = features.volatility;
    
    // Simple technical prediction
    let prediction = 0;
    if (rsi < 30) prediction += 0.3; // Oversold
    else if (rsi > 70) prediction -= 0.3; // Overbought
    
    prediction += momentum * 0.5;
    prediction *= (1 - volatility); // Reduce for high volatility
    
    return {
      returnPrediction: Math.max(-0.5, Math.min(0.5, prediction)),
      confidence: 0.7,
      components: { rsi, momentum, volatility },
    };
  }

  private generateFundamentalPrediction(symbol: string): any {
    // Mock fundamental prediction
    return {
      returnPrediction: Math.random() * 0.2 - 0.1, // ±10%
      confidence: 0.6,
      components: {
        pe: 15 + Math.random() * 10,
        growth: Math.random() * 0.2,
        debt: Math.random() * 0.5,
      },
    };
  }

  private async getRecentPerformance(symbol: string, sources: string[]): Promise<any> {
    const performance: any = {};
    
    for (const source of sources) {
      // Mock performance data - would query actual historical performance
      performance[source] = {
        accuracy: 0.7 + Math.random() * 0.2, // 70-90%
        lastUpdate: new Date(),
        sampleSize: 100,
      };
    }
    
    return performance;
  }

  private adaptWeightsToMarketConditions(marketState: any, predictions: any): any {
    const weights: any = {};
    
    if (marketState?.marketTrend === 'BEARISH') {
      // Increase weight on technical analysis during bear markets
      weights.technical = 1.2;
      weights.sentiment = 1.1;
      weights.fundamental = 0.8;
    } else if (marketState?.marketTrend === 'BULLISH') {
      // Increase weight on fundamental analysis during bull markets
      weights.fundamental = 1.2;
      weights.technical = 0.9;
    }
    
    // Fill in defaults
    for (const key of Object.keys(predictions)) {
      weights[key] = weights[key] || 1.0;
    }
    
    return weights;
  }

  private adaptWeightsToVolatility(volatility: number = 0.2, predictions: any): any {
    const weights: any = {};
    
    if (volatility > 0.4) {
      // High volatility - trust technical analysis more
      weights.technical = 1.3;
      weights.patterns = 1.2;
      weights.fundamental = 0.7;
    } else if (volatility < 0.15) {
      // Low volatility - trust fundamental analysis more
      weights.fundamental = 1.2;
      weights.technical = 0.9;
    }
    
    // Fill in defaults
    for (const key of Object.keys(predictions)) {
      weights[key] = weights[key] || 1.0;
    }
    
    return weights;
  }

  private adaptWeightsToConfidence(predictions: any): any {
    const weights: any = {};
    
    for (const key of Object.keys(predictions)) {
      const confidence = predictions[key].confidence;
      weights[key] = Math.pow(confidence, 1.5); // Exponentially weight by confidence
    }
    
    return weights;
  }

  private calculateModelDisagreement(predictions: any): number {
    const values = Object.values(predictions).map((p: any) => this.extractPredictionValue(p.prediction));
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const maxDeviation = Math.max(...values.map(val => Math.abs(val - mean)));
    return maxDeviation;
  }

  private estimateAleatoricUncertainty(predictions: any): number {
    // Mock implementation - would use actual uncertainty estimates
    return 0.1 + Math.random() * 0.1; // 10-20% base uncertainty
  }

  private async getMetaLearningModel(symbol: string, inputs: any): Promise<any> {
    // Mock meta-learning model - would load actual trained model
    return this.metaLearningModels.get('default');
  }

  private extractMetaFeatures(predictions: any, inputs: any, ensemble: any): any {
    return {
      predictionVariance: this.calculateModelDisagreement(predictions),
      modelAgreement: 1 - this.calculateModelDisagreement(predictions),
      marketVolatility: inputs.technicalFeatures?.volatility || 0.2,
      ensembleConfidence: ensemble.confidence || 0.8,
      predictionCount: Object.keys(predictions).length,
    };
  }

  private async applyMetaModel(metaModel: any, features: any): Promise<any> {
    // Mock meta-model application
    const correction = (features.predictionVariance - 0.1) * 0.5; // Adjust for variance
    return {
      correction,
      confidence: metaModel.confidence,
    };
  }

  private combineWithMetaCorrection(prediction: any, metaCorrection: any): any {
    return {
      ...prediction,
      prediction: prediction.prediction + metaCorrection.correction,
      confidence: prediction.confidence * metaCorrection.confidence,
    };
  }

  private async getConfidenceCalibrationData(symbol: string): Promise<any> {
    // Mock calibration data
    return {
      quality: 'good',
      bias: 0.02,
      slope: 0.95,
      samples: 1000,
    };
  }

  private calculateAdaptiveMultiplier(calibrationData: any, uncertaintyAnalysis: any): number {
    if (!calibrationData) return 1.0;
    
    // Adjust based on calibration quality and bias
    let multiplier = 1.0;
    
    if (calibrationData.quality === 'poor') multiplier *= 1.3;
    else if (calibrationData.quality === 'excellent') multiplier *= 0.8;
    
    if (calibrationData.bias > 0.05) multiplier *= 1.2; // Over-confident
    else if (calibrationData.bias < -0.05) multiplier *= 0.9; // Under-confident
    
    return multiplier;
  }

  private generateEnsembleReasoning(ensemble: any, uncertainty: any, signal: string, strength: number): string {
    const confidence = ensemble.confidence || 0.8;
    const method = ensemble.method || 'ensemble';
    
    return `${signal} signal (${(strength * 100).toFixed(0)}% strength) from ${method} prediction with ${(confidence * 100).toFixed(0)}% confidence. Uncertainty: ${(uncertainty.total * 100).toFixed(0)}%`;
  }

  private calculateEnsembleRiskMetrics(uncertainty: any, inputs: any): any {
    const volatility = inputs.technicalFeatures?.volatility || 0.2;
    
    return {
      maxDrawdown: Math.max(uncertainty.total * 0.8, 0.05),
      volatility: volatility * (1 + uncertainty.total),
      sharpeRatio: Math.max(0, 2 - uncertainty.total * 5), // Decreases with uncertainty
    };
  }
  private assessEnsembleQuality(predictions: any, weights: any): any {
    const predictionCount = Object.keys(predictions).length;
    const predictionValues = Object.values(predictions) as any[];
    const avgConfidence = predictionValues.reduce((sum: number, p: any) => sum + p.confidence, 0) / predictionCount;
    const weightDistribution = this.calculateWeightDistribution(weights.weights);
    
    return {
      modelCount: predictionCount,
      averageConfidence: avgConfidence,
      weightDistribution,
      diversityScore: 1 - weightDistribution.concentration,
      qualityScore: avgConfidence * (1 - weightDistribution.concentration),
    };
  }

  private calculateDiversityMetrics(predictions: any): any {
    const values = Object.values(predictions).map((p: any) => this.extractPredictionValue(p.prediction));
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return {
      predictionVariance: variance,
      predictionRange: Math.max(...values) - Math.min(...values),
      coefficientOfVariation: Math.sqrt(variance) / Math.abs(mean),
      diversityIndex: Math.min(1, variance * 10), // Normalized diversity
    };
  }

  private calculateWeightDistribution(weights: any): any {
    const weightValues = Object.values(weights) as number[];
    const maxWeight = Math.max(...weightValues);
    const concentration = maxWeight; // How concentrated the weights are
    
    return {
      weights,
      maxWeight,
      concentration,
      entropy: this.calculateEntropy(weightValues),
    };
  }

  private calculateEntropy(weights: number[]): number {
    return -weights.reduce((sum, weight) => {
      return sum + (weight > 0 ? weight * Math.log2(weight) : 0);
    }, 0);
  }

  private calculateOverallQuality(predictions: any, ensemble: any): number {
    const predictionCount = Object.keys(predictions).length;
    const confidence = ensemble.confidence || 0.8;
    
    // Quality increases with more diverse, confident predictions
    return Math.min(1, confidence * (predictionCount / 5)); // Assume 5 is optimal
  }

  private async logEnsemblePrediction(symbol: string, result: any): Promise<void> {
    try {
      const mlPrediction = this.mlPredictionRepository.create({
        modelId: 'ensemble_system_v3',
        symbol,
        predictionType: 'ensemble_prediction',
        inputFeatures: {
          servicesUsed: result.metadata.servicesUsed,
          modelCount: Object.keys(result.predictions).length,
        },
        outputPrediction: {
          prediction: result.ensemblePrediction.prediction,
          confidence: result.ensemblePrediction.confidence,
          uncertainty: result.uncertaintyAnalysis.total,
          signal: result.signals.signal,
        },
        confidence: result.ensemblePrediction.confidence,
        executionTime: result.metadata.executionTime,
      });

      await this.mlPredictionRepository.save(mlPrediction);
    } catch (error) {
      this.logger.error('Error logging ensemble prediction:', error);
    }
  }

  private async updateModelPerformance(symbol: string, predictions: any, result: any): Promise<void> {
    // Update performance tracking for continuous improvement
    for (const [source, prediction] of Object.entries(predictions)) {
      this.modelPerformanceCache.set(`${symbol}_${source}`, {
        lastPrediction: (prediction as any).prediction,
        confidence: (prediction as any).confidence,
        timestamp: new Date(),
        ensembleWeight: result.weights.weights[source],
      });
    }
  }
}
