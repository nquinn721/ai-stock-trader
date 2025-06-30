import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutoTradingOrder, AutoTradingOrderStatus, AutoTradingOrderAction, AutoTradingOrderType, RiskLevel } from '../../../entities/auto-trading-order.entity';
import { Portfolio } from '../../../entities/portfolio.entity';
import { Stock } from '../../../entities/stock.entity';
import { SignalGenerationService } from '../../ml/services/signal-generation.service';
import { AdvancedOrderExecutionService } from './advanced-order-execution.service';
import { RiskManagementService } from './risk-management.service';
import { PositionSizingService } from './position-sizing.service';
import { TradingSignals } from '../../ml/interfaces/ml.interfaces';

export interface TradingRecommendation {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD' | 'WATCH';
  confidence: number;
  reasoning: string[];
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
  riskLevel: RiskLevel;
  timeHorizon: '1D' | '1W' | '1M';
  expiryTime: Date;
  technicalSignals: any;
  marketConditions: any;
  riskRewardRatio: number;
  maxDrawdown: number;
  createdAt: Date;
}

export interface RecommendationToOrderRequest {
  recommendationId: string;
  portfolioId: number;
  autoExecute?: boolean;
  customRiskParams?: {
    maxPositionPercent?: number;
    stopLossPercent?: number;
    takeProfitPercent?: number;
  };
  orderStrategy?: 'BRACKET' | 'OCO' | 'TRAILING_STOP' | 'CONDITIONAL';
}

export interface PipelineConfiguration {
  enabled: boolean;
  autoExecutionEnabled: boolean;
  minimumConfidence: number;
  maximumRiskLevel: RiskLevel;
  supportedTimeframes: string[];
  portfolioFilters: number[];
  symbolFilters: string[];
  maxOrdersPerDay: number;
  cooldownMinutes: number;
}

/**
 * S43: Recommendation-to-Order Integration Pipeline Service
 * 
 * This service bridges the gap between AI trading recommendations and actual order execution.
 * It automatically converts high-confidence AI signals into actionable trading orders with 
 * comprehensive risk management and position sizing.
 */
@Injectable()
export class RecommendationPipelineService {
  private readonly logger = new Logger(RecommendationPipelineService.name);
  private pipelineConfig: PipelineConfiguration;
  private recommendationCache: Map<string, TradingRecommendation> = new Map();
  private orderHistory: Map<string, string[]> = new Map(); // recommendationId -> orderIds

  constructor(
    @InjectRepository(AutoTradingOrder)
    private autoTradingOrderRepository: Repository<AutoTradingOrder>,
    @InjectRepository(Portfolio)
    private portfolioRepository: Repository<Portfolio>,
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    private signalGenerationService: SignalGenerationService,
    private advancedOrderExecutionService: AdvancedOrderExecutionService,
    private riskManagementService: RiskManagementService,
    private positionSizingService: PositionSizingService,
  ) {
    this.initializePipelineConfiguration();
    this.logger.log('🚀 S43: Recommendation Pipeline Service initialized');
  }

  /**
   * Initialize pipeline configuration with sensible defaults
   */
  private initializePipelineConfiguration(): void {
    this.pipelineConfig = {
      enabled: true,
      autoExecutionEnabled: false, // Start conservative
      minimumConfidence: 0.75, // Only high-confidence signals
      maximumRiskLevel: RiskLevel.MEDIUM,
      supportedTimeframes: ['5m', '15m', '1h', '1d'],
      portfolioFilters: [], // Empty means all portfolios
      symbolFilters: [], // Empty means all symbols
      maxOrdersPerDay: 50,
      cooldownMinutes: 15, // Prevent spam
    };
  }

  /**
   * Generate AI trading recommendations for a symbol using the ML pipeline
   */
  async generateRecommendations(
    symbol: string,
    options: {
      timeframes?: string[];
      includeRiskAnalysis?: boolean;
      targetPortfolios?: number[];
    } = {},
  ): Promise<TradingRecommendation[]> {
    this.logger.log(`S43: Generating recommendations for ${symbol}`);
    
    try {
      // Step 1: Get ensemble signals from the ML pipeline (S19 dependency)
      const signalResponse = await this.signalGenerationService.generateEnsembleSignals(
        symbol,
        {
          timeframes: options.timeframes || this.pipelineConfig.supportedTimeframes,
          includeConflictResolution: true,
          ensembleMethod: 'meta_learning',
          confidenceThreshold: this.pipelineConfig.minimumConfidence,
          enableRealTimeStream: true,
        },
      );

      const signals = signalResponse.signals;
      
      // Step 2: Convert ML signals to trading recommendations
      const recommendations: TradingRecommendation[] = [];
      
      if (signals) {
        const recommendation = await this.convertSignalToRecommendation(
          symbol,
          signals,
          signalResponse.ensembleDetails,
          options,
        );
        
        if (recommendation) {
          recommendations.push(recommendation);
          
          // Cache for tracking
          this.recommendationCache.set(recommendation.id, recommendation);
          
          this.logger.log(
            `S43: Generated ${recommendation.action} recommendation for ${symbol} with ${recommendation.confidence} confidence`,
          );
        }
      }

      return recommendations;
    } catch (error) {
      this.logger.error(`S43: Error generating recommendations for ${symbol}:`, error);
      return [];
    }
  }

  /**
   * Convert ML trading signals to structured recommendations
   */
  private async convertSignalToRecommendation(
    symbol: string,
    signals: TradingSignals,
    ensembleDetails: any,
    options: any,
  ): Promise<TradingRecommendation | null> {
    // Use the signals object directly since it contains the signal information
    
    // Extract action from signal
    const action = this.determineActionFromSignal(signals);
    if (action === 'HOLD' && !this.shouldIncludeHoldSignals()) {
      return null; // Skip HOLD signals unless specifically requested
    }

    // Calculate risk parameters
    const currentPrice = signals.levels?.currentPrice || 100; // Use actual price from signals
    const confidence = signals.confidence || 0;
    
    // Calculate stop loss and take profit levels
    const { stopLoss, takeProfit } = this.calculateRiskLevels(
      currentPrice,
      action,
      signals.riskMetrics?.volatility || 0.02,
      confidence,
    );

    // Determine risk level based on signal characteristics
    const riskLevel = this.determineRiskLevel(signals, confidence);
    
    // Generate reasoning from signal data
    const reasoning = this.generateRecommendationReasoning(signals, ensembleDetails);

    const recommendation: TradingRecommendation = {
      id: this.generateRecommendationId(symbol, action),
      symbol,
      action,
      confidence,
      reasoning,
      entryPrice: currentPrice,
      stopLoss,
      takeProfit,
      positionSize: 0, // Will be calculated during order creation
      riskLevel,
      timeHorizon: this.determineTimeHorizon(signals),
      expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours default
      technicalSignals: {
        rsi: signals.factors?.technicalSignals?.rsi,
        macd: signals.factors?.technicalSignals?.macd,
        bollinger: signals.factors?.technicalSignals?.bollinger,
        volume: signals.factors?.technicalSignals?.volume,
      },
      marketConditions: {
        trend: signals.factors?.marketConditions?.trend,
        volatility: signals.riskMetrics?.volatility,
        strength: signals.strength,
      },
      riskRewardRatio: this.calculateRiskRewardRatio(currentPrice, stopLoss, takeProfit),
      maxDrawdown: signals.riskMetrics?.maxDrawdown || 0.05,
      createdAt: new Date(),
    };

    return recommendation;
  }

  /**
   * Automatically convert recommendation to trading order
   */
  async convertRecommendationToOrder(
    request: RecommendationToOrderRequest,
  ): Promise<{
    success: boolean;
    orderId?: string;
    errors?: string[];
    recommendation?: TradingRecommendation;
  }> {
    this.logger.log(`S43: Converting recommendation ${request.recommendationId} to order`);

    try {
      // Step 1: Validate recommendation exists
      const recommendation = this.recommendationCache.get(request.recommendationId);
      if (!recommendation) {
        return {
          success: false,
          errors: ['Recommendation not found or expired'],
        };
      }

      // Step 2: Validate pipeline configuration
      const validationResult = await this.validateRecommendationForOrder(
        recommendation,
        request,
      );
      if (!validationResult.valid) {
        return {
          success: false,
          errors: validationResult.errors,
          recommendation,
        };
      }

      // Step 3: Get portfolio for position sizing
      const portfolio = await this.portfolioRepository.findOne({
        where: { id: request.portfolioId },
      });
      if (!portfolio) {
        return {
          success: false,
          errors: ['Portfolio not found'],
          recommendation,
        };
      }

      // Step 4: Calculate position size
      const positionSize = await this.calculatePositionSize(
        recommendation,
        portfolio,
        request.customRiskParams,
      );

      // Step 5: Create the advanced auto trading order
      const orderResult = await this.createAdvancedAutoOrder(
        recommendation,
        portfolio,
        positionSize,
        request,
      );

      if (orderResult.success && orderResult.orderId) {
        // Track order history
        const existingOrders = this.orderHistory.get(request.recommendationId) || [];
        existingOrders.push(orderResult.orderId);
        this.orderHistory.set(request.recommendationId, existingOrders);

        this.logger.log(
          `S43: Successfully created order ${orderResult.orderId} from recommendation ${request.recommendationId}`,
        );
      }

      return {
        success: orderResult.success,
        orderId: orderResult.orderId,
        errors: orderResult.errors,
        recommendation,
      };
    } catch (error) {
      this.logger.error(
        `S43: Error converting recommendation to order:`,
        error,
      );
      return {
        success: false,
        errors: [`Internal error: ${error.message}`],
        recommendation: this.recommendationCache.get(request.recommendationId),
      };
    }
  }

  /**
   * Get all active recommendations
   */
  async getActiveRecommendations(filters: {
    symbols?: string[];
    minConfidence?: number;
    actions?: string[];
    maxAge?: number; // hours
  } = {}): Promise<TradingRecommendation[]> {
    const recommendations = Array.from(this.recommendationCache.values());
    
    return recommendations.filter((rec) => {
      // Age filter
      if (filters.maxAge) {
        const ageHours = (Date.now() - rec.createdAt.getTime()) / (1000 * 60 * 60);
        if (ageHours > filters.maxAge) return false;
      }
      
      // Symbol filter
      if (filters.symbols && !filters.symbols.includes(rec.symbol)) return false;
      
      // Confidence filter
      if (filters.minConfidence && rec.confidence < filters.minConfidence) return false;
      
      // Action filter
      if (filters.actions && !filters.actions.includes(rec.action)) return false;
      
      return true;
    });
  }

  /**
   * Process pipeline for multiple symbols automatically
   */
  async processAutomatedPipeline(
    symbols: string[],
    portfolioIds: number[],
  ): Promise<{
    totalRecommendations: number;
    ordersCreated: number;
    errors: string[];
  }> {
    if (!this.pipelineConfig.enabled) {
      return { totalRecommendations: 0, ordersCreated: 0, errors: ['Pipeline disabled'] };
    }

    this.logger.log(`S43: Processing automated pipeline for ${symbols.length} symbols`);
    
    const results = {
      totalRecommendations: 0,
      ordersCreated: 0,
      errors: [] as string[],
    };

    for (const symbol of symbols) {
      try {
        // Generate recommendations
        const recommendations = await this.generateRecommendations(symbol);
        results.totalRecommendations += recommendations.length;

        // Convert high-confidence recommendations to orders if auto-execution enabled
        if (this.pipelineConfig.autoExecutionEnabled) {
          for (const recommendation of recommendations) {
            if (recommendation.confidence >= this.pipelineConfig.minimumConfidence) {
              for (const portfolioId of portfolioIds) {
                const orderResult = await this.convertRecommendationToOrder({
                  recommendationId: recommendation.id,
                  portfolioId,
                  autoExecute: true,
                });

                if (orderResult.success) {
                  results.ordersCreated++;
                } else {
                  results.errors.push(
                    `${symbol}: ${orderResult.errors?.join(', ') || 'Unknown error'}`,
                  );
                }
              }
            }
          }
        }
      } catch (error) {
        results.errors.push(`${symbol}: ${error.message}`);
      }
    }

    this.logger.log(
      `S43: Automated pipeline completed - ${results.totalRecommendations} recommendations, ${results.ordersCreated} orders`,
    );
    
    return results;
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private determineActionFromSignal(signals: TradingSignals): 'BUY' | 'SELL' | 'HOLD' | 'WATCH' {
    if (!signals || typeof signals.signal !== 'string') return 'HOLD';
    
    const signalType = signals.signal.toUpperCase();
    if (signalType.includes('BUY') || signalType.includes('LONG')) return 'BUY';
    if (signalType.includes('SELL') || signalType.includes('SHORT')) return 'SELL';
    if (signalType.includes('WATCH')) return 'WATCH';
    return 'HOLD';
  }

  private shouldIncludeHoldSignals(): boolean {
    // For now, skip HOLD signals to focus on actionable recommendations
    return false;
  }

  private calculateRiskLevels(
    currentPrice: number,
    action: string,
    volatility: number,
    confidence: number,
  ): { stopLoss: number; takeProfit: number } {
    const baseRiskPercent = 0.02; // 2% base risk
    const adjustedRisk = baseRiskPercent * (1 + volatility) * (2 - confidence);
    
    let stopLoss: number;
    let takeProfit: number;
    
    if (action === 'BUY') {
      stopLoss = currentPrice * (1 - adjustedRisk);
      takeProfit = currentPrice * (1 + adjustedRisk * 2); // 2:1 risk/reward
    } else if (action === 'SELL') {
      stopLoss = currentPrice * (1 + adjustedRisk);
      takeProfit = currentPrice * (1 - adjustedRisk * 2);
    } else {
      stopLoss = currentPrice;
      takeProfit = currentPrice;
    }
    
    return { stopLoss, takeProfit };
  }

  private determineRiskLevel(signals: TradingSignals, confidence: number): RiskLevel {
    // Base risk on confidence and signal strength
    const riskScore = (1 - confidence) + (1 - signals.strength);
    
    if (riskScore < 0.3) return RiskLevel.LOW;
    if (riskScore < 0.6) return RiskLevel.MEDIUM;
    return RiskLevel.HIGH;
  }

  private generateRecommendationReasoning(signals: TradingSignals, ensembleDetails: any): string[] {
    const reasoning: string[] = [];
    
    // Add basic signal reasoning
    reasoning.push(`Signal: ${signals.signal} with ${(signals.strength * 100).toFixed(1)}% strength`);
    reasoning.push(`Confidence: ${(signals.confidence * 100).toFixed(1)}%`);
    
    // Add technical indicators if available
    if (signals.factors?.technicalSignals) {
      reasoning.push(`Technical indicators support the ${signals.signal} signal`);
    }
    
    // Add risk assessment
    if (signals.riskMetrics) {
      reasoning.push(`Risk metrics: Volatility ${(signals.riskMetrics.volatility * 100).toFixed(1)}%, Max Drawdown ${(signals.riskMetrics.maxDrawdown * 100).toFixed(1)}%`);
    }
    
    // Add execution priority
    if (signals.executionPriority) {
      reasoning.push(`Execution priority: ${signals.executionPriority}`);
    }
    
    return reasoning;
  }

  private calculateRiskRewardRatio(
    entryPrice: number,
    stopLoss: number,
    takeProfit: number,
  ): number {
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfit - entryPrice);
    
    if (risk === 0) return 0;
    return reward / risk;
  }

  private determineTimeHorizon(signals: TradingSignals): '1D' | '1W' | '1M' {
    // Determine time horizon based on signal characteristics
    if (signals.executionPriority === 'HIGH') return '1D';
    if (signals.strength > 0.8) return '1W';
    return '1M'; // Default to longer term for lower confidence signals
  }

  private generateRecommendationId(symbol: string, action: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `REC_${symbol}_${action}_${timestamp}_${random}`;
  }

  private async validateRecommendationForOrder(
    recommendation: TradingRecommendation,
    request: RecommendationToOrderRequest,
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // Check if recommendation is expired
    if (recommendation.expiryTime < new Date()) {
      errors.push('Recommendation has expired');
    }
    
    // Check confidence threshold
    if (recommendation.confidence < this.pipelineConfig.minimumConfidence) {
      errors.push(`Confidence ${recommendation.confidence} below threshold ${this.pipelineConfig.minimumConfidence}`);
    }
    
    // Check risk level
    if (this.getRiskLevelValue(recommendation.riskLevel) > this.getRiskLevelValue(this.pipelineConfig.maximumRiskLevel)) {
      errors.push(`Risk level ${recommendation.riskLevel} exceeds maximum ${this.pipelineConfig.maximumRiskLevel}`);
    }
    
    // Check daily order limits
    const todayOrders = await this.getTodayOrderCount();
    if (todayOrders >= this.pipelineConfig.maxOrdersPerDay) {
      errors.push(`Daily order limit ${this.pipelineConfig.maxOrdersPerDay} reached`);
    }
    
    return { valid: errors.length === 0, errors };
  }

  private getRiskLevelValue(riskLevel: RiskLevel): number {
    switch (riskLevel) {
      case RiskLevel.LOW: return 1;
      case RiskLevel.MEDIUM: return 2;
      case RiskLevel.HIGH: return 3;
      default: return 2;
    }
  }

  private async getTodayOrderCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.autoTradingOrderRepository.count({
      where: {
        createdAt: { $gte: today } as any,
      },
    });
  }

  private async calculatePositionSize(
    recommendation: TradingRecommendation,
    portfolio: Portfolio,
    customRiskParams?: any,
  ): Promise<number> {
    // Use the position sizing service for proper calculation
    const riskAmount = portfolio.totalValue * 0.02; // 2% risk per trade
    const entryPrice = recommendation.entryPrice;
    const stopLoss = recommendation.stopLoss;
    const riskPerShare = Math.abs(entryPrice - stopLoss);
    
    if (riskPerShare === 0) return 0;
    
    const maxShares = Math.floor(riskAmount / riskPerShare);
    const maxValue = portfolio.totalValue * 0.1; // Max 10% position size
    const maxSharesByValue = Math.floor(maxValue / entryPrice);
    
    return Math.min(maxShares, maxSharesByValue);
  }

  private async createAdvancedAutoOrder(
    recommendation: TradingRecommendation,
    portfolio: Portfolio,
    positionSize: number,
    request: RecommendationToOrderRequest,
  ): Promise<{ success: boolean; orderId?: string; errors?: string[] }> {
    try {
      // Use the advanced order execution service (S42 dependency)
      const orderDto = {
        portfolioId: portfolio.id,
        symbol: recommendation.symbol,
        strategy: 'BRACKET' as any, // Default to bracket strategy
        recommendationId: recommendation.id,
        side: recommendation.action === 'BUY' ? 'BUY' as any : 'SELL' as any,
        baseQuantity: positionSize,
        orderType: 'MARKET' as any,
        limitPrice: recommendation.entryPrice,
        stopLossPrice: recommendation.stopLoss,
        takeProfitPrice: recommendation.takeProfit,
        confidence: recommendation.confidence,
        reasoning: recommendation.reasoning,
        riskLevel: recommendation.riskLevel,
        expiryTime: recommendation.expiryTime,
      };

      // Create the order using advanced execution service
      const order = await this.advancedOrderExecutionService.createAdvancedOrder(orderDto);
      
      return {
        success: true,
        orderId: order.id,
      };
    } catch (error) {
      return {
        success: false,
        errors: [`Order creation failed: ${error.message}`],
      };
    }
  }

  /**
   * Update pipeline configuration
   */
  updatePipelineConfiguration(config: Partial<PipelineConfiguration>): void {
    this.pipelineConfig = { ...this.pipelineConfig, ...config };
    this.logger.log('S43: Pipeline configuration updated');
  }

  /**
   * Get current pipeline configuration
   */
  getPipelineConfiguration(): PipelineConfiguration {
    return { ...this.pipelineConfig };
  }

  /**
   * Get pipeline statistics
   */
  async getPipelineStatistics(): Promise<{
    activeRecommendations: number;
    ordersCreated: number;
    successRate: number;
    avgConfidence: number;
  }> {
    const activeRecs = Array.from(this.recommendationCache.values());
    const totalOrders = Array.from(this.orderHistory.values()).reduce(
      (sum, orders) => sum + orders.length,
      0,
    );
    
    const avgConfidence = activeRecs.length > 0 
      ? activeRecs.reduce((sum, rec) => sum + rec.confidence, 0) / activeRecs.length
      : 0;

    return {
      activeRecommendations: activeRecs.length,
      ordersCreated: totalOrders,
      successRate: totalOrders > 0 ? totalOrders / activeRecs.length : 0,
      avgConfidence,
    };
  }
}
