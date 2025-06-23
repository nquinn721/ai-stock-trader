import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  MLModel,
  MLPrediction,
  MLMetric,
} from '../entities/ml.entities';
import {
  MarketPrediction,
  MarketState,
  TechnicalFeatures,
} from '../interfaces/ml.interfaces';

/**
 * Advanced Market Prediction Service - Phase 3 (S29)
 * Implements sophisticated market prediction models using ensemble methods,
 * time series forecasting, and multi-horizon predictions
 */
@Injectable()
export class MarketPredictionService {
  private readonly logger = new Logger(MarketPredictionService.name);
  private models: Map<string, any> = new Map();
  private predictionCache: Map<string, MarketPrediction> = new Map();

  constructor(
    @InjectRepository(MLModel)
    private mlModelRepository: Repository<MLModel>,
    @InjectRepository(MLPrediction)
    private mlPredictionRepository: Repository<MLPrediction>,
    @InjectRepository(MLMetric)
    private mlMetricRepository: Repository<MLMetric>,
  ) {
    this.logger.log('🚀 Market Prediction Service initialized - Phase 3');
    this.initializeModels();
  }

  /**
   * Generate comprehensive market predictions using ensemble methods
   * Combines multiple prediction horizons and model types
   */
  async predictMarket(
    symbol: string,
    features: TechnicalFeatures,
    horizons: string[] = ['1h', '4h', '1d', '1w'],
    options: any = {},
  ): Promise<MarketPrediction> {
    this.logger.log(`Generating market predictions for ${symbol} across ${horizons.length} horizons`);

    const startTime = Date.now();

    try {
      // Generate predictions for each time horizon
      const horizonPredictions = await Promise.all(
        horizons.map(horizon => this.generateHorizonPrediction(symbol, features, horizon, options))
      );

      // Ensemble predictions across horizons
      const ensemblePrediction = await this.ensembleHorizonPredictions(
        symbol,
        horizonPredictions,
        options
      );

      // Apply uncertainty quantification
      const uncertaintyBounds = await this.calculateUncertaintyBounds(
        symbol,
        ensemblePrediction,
        horizonPredictions
      );

      // Generate trading signals
      const signals = await this.generateTradingSignals(
        symbol,
        ensemblePrediction,
        uncertaintyBounds,
        options
      );

      const prediction: MarketPrediction = {
        symbol,
        timestamp: new Date(),
        horizonPredictions,
        ensemblePrediction,
        uncertaintyBounds,
        signals,
        confidence: this.calculateOverallConfidence(horizonPredictions),
        modelVersions: this.getActiveModelVersions(),
        executionTime: Date.now() - startTime,
      };

      // Cache prediction for performance
      this.predictionCache.set(`${symbol}_${Date.now()}`, prediction);

      // Log prediction for monitoring
      await this.logPrediction(symbol, prediction);

      return prediction;

    } catch (error) {
      this.logger.error(`Error predicting market for ${symbol}:`, error);
      throw error;
    }
  }
  /**
   * Generate prediction for specific time horizon
   */
  private async generateHorizonPrediction(
    symbol: string,
    features: TechnicalFeatures,
    horizon: string,
    options: any
  ): Promise<any> {
    const models = this.getHorizonModels(horizon);
    const predictions: any[] = [];

    // Time Series Models (LSTM, Transformer, ARIMA-GARCH)
    const tsModels = models.filter(m => m.type === 'timeseries');
    for (const model of tsModels) {
      const pred = await this.runTimeSeriesModel(model, symbol, features, horizon);
      predictions.push({
        modelId: model.id,
        modelType: 'timeseries',
        prediction: pred,
        weight: model.weight,
      });
    }

    // Technical Analysis Models
    const taModels = models.filter(m => m.type === 'technical');
    for (const model of taModels) {
      const pred = await this.runTechnicalModel(model, symbol, features, horizon);
      predictions.push({
        modelId: model.id,
        modelType: 'technical',
        prediction: pred,
        weight: model.weight,
      });
    }

    // Fundamental Analysis Models
    const faModels = models.filter(m => m.type === 'fundamental');
    for (const model of faModels) {
      const pred = await this.runFundamentalModel(model, symbol, features, horizon);
      predictions.push({
        modelId: model.id,
        modelType: 'fundamental',
        prediction: pred,
        weight: model.weight,
      });
    }

    // Market Regime Models
    const mrModels = models.filter(m => m.type === 'regime');
    for (const model of mrModels) {
      const pred = await this.runMarketRegimeModel(model, symbol, features, horizon);
      predictions.push({
        modelId: model.id,
        modelType: 'regime',
        prediction: pred,
        weight: model.weight,
      });
    }

    // Ensemble individual model predictions
    const ensemblePred = this.ensembleModelPredictions(predictions, horizon);

    return {
      horizon,
      predictions,
      ensemble: ensemblePred,
      confidence: this.calculateHorizonConfidence(predictions),
      timestamp: new Date(),
    };
  }

  /**
   * Run advanced time series prediction models
   * Implements LSTM, Transformer, and ARIMA-GARCH models
   */
  private async runTimeSeriesModel(
    model: any,
    symbol: string,
    features: TechnicalFeatures,
    horizon: string
  ): Promise<any> {
    // Mock implementation - in production would run actual ML models
    
    const modelConfig = this.getModelConfig(model.id);
    const lookbackPeriod = this.getHorizonLookback(horizon);

    // Simulate LSTM prediction
    if (model.architecture === 'LSTM') {
      return this.simulateLSTMPrediction(symbol, features, horizon, modelConfig);
    }

    // Simulate Transformer prediction
    if (model.architecture === 'Transformer') {
      return this.simulateTransformerPrediction(symbol, features, horizon, modelConfig);
    }

    // Simulate ARIMA-GARCH prediction
    if (model.architecture === 'ARIMA-GARCH') {
      return this.simulateARIMAGARCHPrediction(symbol, features, horizon, modelConfig);
    }

    // Default fallback
    return this.simulateBasicTSPrediction(symbol, features, horizon);
  }

  /**
   * Simulate LSTM prediction with confidence intervals
   */
  private simulateLSTMPrediction(
    symbol: string,
    features: TechnicalFeatures,
    horizon: string,
    config: any
  ): any {
    const volatility = this.calculateVolatility(features);
    const trend = this.detectTrend(features);
    
    // Simulate LSTM prediction with Monte Carlo dropout for uncertainty
    const baseReturn = trend * this.getHorizonMultiplier(horizon);
    const uncertainty = volatility * Math.sqrt(this.getHorizonDays(horizon));
    
    return {
      priceTarget: features.price * (1 + baseReturn),
      returnPrediction: baseReturn,
      confidenceInterval: {
        lower: baseReturn - 1.96 * uncertainty,
        upper: baseReturn + 1.96 * uncertainty,
      },
      volatilityForecast: volatility,
      confidence: 0.75 + Math.random() * 0.2,
      architecture: 'LSTM',
      parameters: config,
    };
  }

  /**
   * Simulate Transformer prediction with attention mechanisms
   */
  private simulateTransformerPrediction(
    symbol: string,
    features: TechnicalFeatures,
    horizon: string,
    config: any
  ): any {
    const attention_weights = this.calculateAttentionWeights(features);
    const trend = this.detectTrend(features);
    const volatility = this.calculateVolatility(features);
    
    // Transformer models generally show better long-term predictions
    const horizonBoost = horizon === '1w' ? 1.1 : 1.0;
    const baseReturn = trend * this.getHorizonMultiplier(horizon) * horizonBoost;
    const uncertainty = volatility * Math.sqrt(this.getHorizonDays(horizon)) * 0.9; // Lower uncertainty
    
    return {
      priceTarget: features.price * (1 + baseReturn),
      returnPrediction: baseReturn,
      confidenceInterval: {
        lower: baseReturn - 1.96 * uncertainty,
        upper: baseReturn + 1.96 * uncertainty,
      },
      volatilityForecast: volatility * 0.95,
      confidence: 0.8 + Math.random() * 0.15,
      architecture: 'Transformer',
      attentionWeights: attention_weights,
      parameters: config,
    };
  }

  /**
   * Simulate ARIMA-GARCH prediction for volatility modeling
   */
  private simulateARIMAGARCHPrediction(
    symbol: string,
    features: TechnicalFeatures,
    horizon: string,
    config: any
  ): any {
    const volatility = this.calculateVolatility(features);
    const garch_volatility = this.simulateGARCHVolatility(features, horizon);
    const arima_return = this.simulateARIMAReturn(features, horizon);
    
    return {
      priceTarget: features.price * (1 + arima_return),
      returnPrediction: arima_return,
      confidenceInterval: {
        lower: arima_return - 1.96 * garch_volatility,
        upper: arima_return + 1.96 * garch_volatility,
      },
      volatilityForecast: garch_volatility,
      confidence: 0.7 + Math.random() * 0.2,
      architecture: 'ARIMA-GARCH',
      arimaParams: { p: 1, d: 1, q: 1 },
      garchParams: { p: 1, q: 1 },
      parameters: config,
    };
  }

  /**
   * Run technical analysis models
   */
  private async runTechnicalModel(
    model: any,
    symbol: string,
    features: TechnicalFeatures,
    horizon: string
  ): Promise<any> {    // Technical analysis based predictions
    const rsiSignal = this.getRSISignal(features.rsi);
    // Create a mock MACD object since features.macd is just a number
    const macdObj = { line: features.macd, signal: features.macd * 0.9, histogram: features.macd * 0.1 };
    const macdSignal = this.getMACDSignal(macdObj);
    const bbSignal = this.getBollingerSignal(features.bollingerBands, features.price);
    
    const technicalScore = (rsiSignal + macdSignal + bbSignal) / 3;
    const baseReturn = technicalScore * 0.05; // Max 5% return prediction
    
    return {
      priceTarget: features.price * (1 + baseReturn),
      returnPrediction: baseReturn,
      technicalScore,
      signals: {
        rsi: rsiSignal,
        macd: macdSignal,
        bollinger: bbSignal,
      },
      confidence: 0.65 + Math.random() * 0.2,
    };
  }

  /**
   * Run fundamental analysis models
   */
  private async runFundamentalModel(
    model: any,
    symbol: string,
    features: TechnicalFeatures,
    horizon: string
  ): Promise<any> {
    // Mock fundamental analysis - would use actual financial data
    const peRatio = 15 + Math.random() * 20; // Mock P/E ratio
    const earningsGrowth = Math.random() * 0.3 - 0.1; // -10% to +20%
    const debtToEquity = Math.random() * 0.8; // 0% to 80%
    
    const fundamentalScore = this.calculateFundamentalScore(peRatio, earningsGrowth, debtToEquity);
    const baseReturn = fundamentalScore * 0.1; // Max 10% return for fundamental
    
    return {
      priceTarget: features.price * (1 + baseReturn),
      returnPrediction: baseReturn,
      fundamentalScore,
      metrics: {
        peRatio,
        earningsGrowth,
        debtToEquity,
      },
      confidence: 0.7 + Math.random() * 0.2,
    };
  }

  /**
   * Run market regime detection models
   */
  private async runMarketRegimeModel(
    model: any,
    symbol: string,
    features: TechnicalFeatures,
    horizon: string
  ): Promise<any> {
    const volatility = this.calculateVolatility(features);
    const trend = this.detectTrend(features);
    
    // Detect market regime
    let regime = 'NEUTRAL';
    if (trend > 0.02 && volatility < 0.25) regime = 'BULL';
    else if (trend < -0.02 && volatility > 0.3) regime = 'BEAR';
    else if (volatility > 0.35) regime = 'HIGH_VOLATILITY';
    
    const regimeMultiplier = this.getRegimeMultiplier(regime);
    const baseReturn = trend * regimeMultiplier;
    
    return {
      priceTarget: features.price * (1 + baseReturn),
      returnPrediction: baseReturn,
      regime,
      regimeConfidence: 0.8,
      regimeMultiplier,
      confidence: 0.75 + Math.random() * 0.15,
    };
  }

  /**
   * Ensemble predictions across different time horizons
   */
  private async ensembleHorizonPredictions(
    symbol: string,
    horizonPredictions: any[],
    options: any
  ): Promise<any> {
    const weights = this.calculateHorizonWeights(horizonPredictions);
    
    let weightedReturn = 0;
    let weightedConfidence = 0;
    let weightedPriceTarget = 0;
    
    for (let i = 0; i < horizonPredictions.length; i++) {
      const pred = horizonPredictions[i];
      const weight = weights[i];
      
      weightedReturn += pred.ensemble.returnPrediction * weight;
      weightedConfidence += pred.confidence * weight;
      weightedPriceTarget += pred.ensemble.priceTarget * weight;
    }
    
    return {
      returnPrediction: weightedReturn,
      priceTarget: weightedPriceTarget,
      confidence: weightedConfidence,
      horizonWeights: weights,
      ensembleMethod: 'weighted_average',
    };
  }

  /**
   * Calculate uncertainty bounds using prediction intervals
   */
  private async calculateUncertaintyBounds(
    symbol: string,
    ensemblePrediction: any,
    horizonPredictions: any[]
  ): Promise<any> {
    // Calculate prediction variance across models and horizons
    const predictions = horizonPredictions.flatMap(h => 
      h.predictions.map(p => p.prediction.returnPrediction)
    );
    
    const mean = predictions.reduce((sum, pred) => sum + pred, 0) / predictions.length;
    const variance = predictions.reduce((sum, pred) => sum + Math.pow(pred - mean, 2), 0) / predictions.length;
    const std = Math.sqrt(variance);
    
    return {
      prediction: ensemblePrediction.returnPrediction,
      standardError: std,
      confidenceIntervals: {
        '68%': [mean - std, mean + std],
        '95%': [mean - 1.96 * std, mean + 1.96 * std],
        '99%': [mean - 2.58 * std, mean + 2.58 * std],
      },
      predictionInterval: [mean - 2 * std, mean + 2 * std],
    };
  }

  /**
   * Generate actionable trading signals from predictions
   */
  private async generateTradingSignals(
    symbol: string,
    ensemblePrediction: any,
    uncertaintyBounds: any,
    options: any
  ): Promise<any> {
    const prediction = ensemblePrediction.returnPrediction;
    const confidence = ensemblePrediction.confidence;
    const uncertainty = uncertaintyBounds.standardError;
      // Signal generation logic
    let signal = 'HOLD';
    let strength = 0;
    let reasoning: string[] = [];
    
    // Strong buy signal
    if (prediction > 0.03 && confidence > 0.8 && uncertainty < 0.02) {
      signal = 'STRONG_BUY';
      strength = 0.9;
      reasoning.push('High confidence positive prediction with low uncertainty');
    }
    // Buy signal
    else if (prediction > 0.01 && confidence > 0.7) {
      signal = 'BUY';
      strength = 0.7;
      reasoning.push('Positive prediction with good confidence');
    }
    // Strong sell signal
    else if (prediction < -0.03 && confidence > 0.8 && uncertainty < 0.02) {
      signal = 'STRONG_SELL';
      strength = 0.9;
      reasoning.push('High confidence negative prediction with low uncertainty');
    }
    // Sell signal
    else if (prediction < -0.01 && confidence > 0.7) {
      signal = 'SELL';
      strength = 0.7;
      reasoning.push('Negative prediction with good confidence');
    }
    // Hold due to high uncertainty
    else if (uncertainty > 0.05) {
      signal = 'HOLD';
      strength = 0.3;
      reasoning.push('High prediction uncertainty, recommend holding position');
    }
    
    return {
      signal,
      strength,
      reasoning: reasoning.join('; '),
      thresholds: {
        buyThreshold: 0.01,
        sellThreshold: -0.01,
        confidenceThreshold: 0.7,
        uncertaintyThreshold: 0.05,
      },
      riskMetrics: {
        maxDrawdown: Math.abs(Math.min(0, uncertaintyBounds.confidenceIntervals['95%'][0])),
        volatility: uncertainty,
        sharpeRatio: prediction / (uncertainty || 0.01),
      },
    };
  }

  // ==================== HELPER METHODS ====================

  private initializeModels(): void {
    // Initialize different model types for ensemble prediction
    this.models.set('lstm_1h', { id: 'lstm_1h', type: 'timeseries', architecture: 'LSTM', weight: 0.3 });
    this.models.set('transformer_1d', { id: 'transformer_1d', type: 'timeseries', architecture: 'Transformer', weight: 0.25 });
    this.models.set('arima_garch', { id: 'arima_garch', type: 'timeseries', architecture: 'ARIMA-GARCH', weight: 0.2 });
    this.models.set('technical_signals', { id: 'technical_signals', type: 'technical', weight: 0.15 });
    this.models.set('fundamental_analysis', { id: 'fundamental_analysis', type: 'fundamental', weight: 0.1 });
  }

  private getHorizonModels(horizon: string): any[] {
    // Return appropriate models for each time horizon
    const allModels = Array.from(this.models.values());
    
    if (horizon === '1h') {
      return allModels.filter(m => m.type === 'timeseries' || m.type === 'technical');
    } else if (horizon === '1w') {
      return allModels.filter(m => m.type === 'fundamental' || m.type === 'regime');
    }
    
    return allModels;
  }

  private calculateVolatility(features: TechnicalFeatures): number {
    const { bollingerBands, price } = features;
    const bandWidth = (bollingerBands.upper - bollingerBands.lower) / bollingerBands.middle;
    return Math.min(bandWidth, 0.5); // Cap at 50%
  }
  private detectTrend(features: TechnicalFeatures): number {
    const { movingAverages, price } = features;
    const { sma20, sma50 } = movingAverages;
    
    // Simple trend detection based on moving averages
    let trendScore = 0;
    
    if (price > sma20) trendScore += 0.33;
    if (sma20 > sma50) trendScore += 0.33;
    if (price > sma50) trendScore += 0.34;
    
    return (trendScore - 0.5) * 2; // Normalize to [-1, 1]
  }

  private getHorizonMultiplier(horizon: string): number {
    const multipliers = {
      '1h': 0.01,
      '4h': 0.03,
      '1d': 0.05,
      '1w': 0.1,
    };
    return multipliers[horizon] || 0.05;
  }

  private getHorizonDays(horizon: string): number {
    const days = {
      '1h': 1/24,
      '4h': 1/6,
      '1d': 1,
      '1w': 7,
    };
    return days[horizon] || 1;
  }

  private calculateOverallConfidence(horizonPredictions: any[]): number {
    const confidences = horizonPredictions.map(h => h.confidence);
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }
  private async logPrediction(symbol: string, prediction: MarketPrediction): Promise<void> {
    try {
      const mlPrediction = this.mlPredictionRepository.create({
        modelId: 'market_prediction_ensemble',
        symbol,
        predictionType: 'market_prediction',
        inputFeatures: {
          horizons: prediction.horizonPredictions.map(h => h.horizon),
          modelVersions: prediction.modelVersions,
        },
        outputPrediction: {
          returnPrediction: prediction.ensemblePrediction.returnPrediction,
          priceTarget: prediction.ensemblePrediction.priceTarget,
          signals: prediction.signals,
          uncertaintyBounds: prediction.uncertaintyBounds,
        },
        confidence: prediction.confidence,
        executionTime: prediction.executionTime,
      });

      await this.mlPredictionRepository.save(mlPrediction);
    } catch (error) {
      this.logger.error('Error logging prediction:', error);
    }
  }

  // Additional helper methods for model simulation
  private getModelConfig(modelId: string): any {
    return { epochs: 100, batchSize: 32, learningRate: 0.001 };
  }

  private getHorizonLookback(horizon: string): number {
    const lookbacks = { '1h': 24, '4h': 48, '1d': 30, '1w': 52 };
    return lookbacks[horizon] || 30;
  }

  private simulateBasicTSPrediction(symbol: string, features: TechnicalFeatures, horizon: string): any {
    const trend = this.detectTrend(features);
    const volatility = this.calculateVolatility(features);
    const baseReturn = trend * this.getHorizonMultiplier(horizon);
    
    return {
      priceTarget: features.price * (1 + baseReturn),
      returnPrediction: baseReturn,
      confidence: 0.6,
    };
  }

  private calculateAttentionWeights(features: TechnicalFeatures): any {
    return {
      price: 0.3,
      volume: 0.2,
      rsi: 0.15,
      macd: 0.15,
      bollinger: 0.2,
    };
  }

  private simulateGARCHVolatility(features: TechnicalFeatures, horizon: string): number {
    const baseVol = this.calculateVolatility(features);
    const horizonFactor = Math.sqrt(this.getHorizonDays(horizon));
    return baseVol * horizonFactor * (0.8 + Math.random() * 0.4);
  }

  private simulateARIMAReturn(features: TechnicalFeatures, horizon: string): number {
    const trend = this.detectTrend(features);
    return trend * this.getHorizonMultiplier(horizon) * (0.8 + Math.random() * 0.4);
  }

  private getRSISignal(rsi: number): number {
    if (rsi > 70) return -0.5; // Overbought
    if (rsi < 30) return 0.5;  // Oversold
    return (50 - rsi) / 50;    // Normalized
  }

  private getMACDSignal(macd: { line: number; signal: number; histogram: number }): number {
    return Math.tanh(macd.histogram * 2); // Normalize MACD histogram
  }

  private getBollingerSignal(bb: { upper: number; middle: number; lower: number }, price: number): number {
    const position = (price - bb.lower) / (bb.upper - bb.lower);
    return (0.5 - position) * 2; // Normalize to [-1, 1]
  }

  private calculateFundamentalScore(pe: number, growth: number, debt: number): number {
    let score = 0;
    
    // P/E ratio scoring (lower is better)
    if (pe < 15) score += 0.3;
    else if (pe < 25) score += 0.1;
    else score -= 0.1;
    
    // Earnings growth scoring
    score += Math.min(growth, 0.3); // Cap at 30%
    
    // Debt-to-equity scoring (lower is better)
    score -= Math.min(debt, 0.5); // Cap penalty at 50%
    
    return Math.max(-1, Math.min(1, score)); // Clamp to [-1, 1]
  }

  private getRegimeMultiplier(regime: string): number {
    const multipliers = {
      'BULL': 1.2,
      'BEAR': 0.8,
      'HIGH_VOLATILITY': 0.9,
      'NEUTRAL': 1.0,
    };
    return multipliers[regime] || 1.0;
  }

  private ensembleModelPredictions(predictions: any[], horizon: string): any {
    const totalWeight = predictions.reduce((sum, p) => sum + p.weight, 0);
    
    let weightedReturn = 0;
    let weightedPrice = 0;
    let weightedConfidence = 0;
    
    for (const pred of predictions) {
      const normalizedWeight = pred.weight / totalWeight;
      weightedReturn += pred.prediction.returnPrediction * normalizedWeight;
      weightedPrice += pred.prediction.priceTarget * normalizedWeight;
      weightedConfidence += pred.prediction.confidence * normalizedWeight;
    }
    
    return {
      returnPrediction: weightedReturn,
      priceTarget: weightedPrice,
      confidence: weightedConfidence,
    };
  }

  private calculateHorizonConfidence(predictions: any[]): number {
    const confidences = predictions.map(p => p.prediction.confidence);
    return confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
  }

  private calculateHorizonWeights(horizonPredictions: any[]): number[] {
    // Weight shorter horizons more heavily for immediate decisions
    const baseWeights = { '1h': 0.4, '4h': 0.3, '1d': 0.2, '1w': 0.1 };
    const weights = horizonPredictions.map(h => baseWeights[h.horizon] || 0.1);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    return weights.map(w => w / totalWeight);
  }

  private getActiveModelVersions(): any {
    return {
      lstm: '2.1.0',
      transformer: '1.3.0',
      arima_garch: '1.0.2',
      technical: '3.0.1',
      fundamental: '1.1.0',
    };
  }
}
