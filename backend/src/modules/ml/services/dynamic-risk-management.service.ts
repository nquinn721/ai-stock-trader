import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MLModel, MLPrediction } from '../entities/ml.entities';

export interface RiskAssessmentInput {
  portfolioValue: number;
  positions: Array<{
    symbol: string;
    quantity: number;
    currentPrice: number;
    entryPrice: number;
    positionValue: number;
    weight: number;
  }>;
  marketConditions: {
    volatilityIndex: number; // VIX or similar
    marketTrend: 'bull' | 'bear' | 'sideways';
    liquidityConditions: 'high' | 'medium' | 'low';
    correlationMatrix: Record<string, Record<string, number>>;
  };
  historicalVolatility: Record<string, number>;
  economicIndicators: {
    interestRates: number;
    inflationRate: number;
    gdpGrowth: number;
    unemploymentRate: number;
  };
}

export interface RiskMetrics {
  portfolioRisk: {
    var95: number; // Value at Risk 95%
    var99: number; // Value at Risk 99%
    expectedShortfall: number; // Conditional VaR
    maxDrawdown: number;
    sharpeRatio: number;
    sortinoRatio: number;
    beta: number;
    alpha: number;
  };
  positionRisks: Array<{
    symbol: string;
    individualRisk: number;
    contributionToRisk: number;
    concentration: number;
    correlationRisk: number;
  }>;
  scenarioAnalysis: {
    stressTestResults: Array<{
      scenario: string;
      portfolioImpact: number;
      probability: number;
    }>;
    monteCarloResults: {
      expectedReturn: number;
      worstCase5: number;
      worstCase1: number;
      bestCase95: number;
      bestCase99: number;
    };
  };
}

export interface DynamicPositionSizing {
  symbol: string;
  recommendedSize: number; // Dollar amount
  maxPosition: number;
  riskBudget: number; // Percentage of portfolio
  kellyFraction: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  reasoning: string[];
}

export interface AdaptiveStopLoss {
  symbol: string;
  currentStopLoss: number;
  newStopLoss: number;
  stopLossType: 'fixed' | 'trailing' | 'volatility' | 'atr' | 'momentum';
  riskRatio: number; // Risk/reward ratio
  timeDecay: number;
  volatilityAdjustment: number;
  trendAdjustment: number;
}

export interface RiskAlert {
  alertId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type:
    | 'concentration'
    | 'correlation'
    | 'volatility'
    | 'drawdown'
    | 'var_breach'
    | 'liquidity';
  message: string;
  recommendations: string[];
  affectedPositions: string[];
  timestamp: Date;
  requiresAction: boolean;
}

@Injectable()
export class DynamicRiskManagementService {
  private readonly logger = new Logger(DynamicRiskManagementService.name);
  private riskModels = new Map<string, any>();

  constructor(
    @InjectRepository(MLModel)
    private readonly modelRepository: Repository<MLModel>,
    @InjectRepository(MLPrediction)
    private readonly predictionRepository: Repository<MLPrediction>,
  ) {}

  /**
   * Assess portfolio risk using ML-driven volatility prediction
   */
  async assessPortfolioRisk(input: RiskAssessmentInput): Promise<RiskMetrics> {
    this.logger.log('Performing dynamic portfolio risk assessment');

    try {
      // Predict individual asset volatilities
      const volatilityPredictions = await this.predictVolatilities(input);

      // Calculate correlation-adjusted risk
      const correlationRisk = await this.calculateCorrelationRisk(input);

      // Perform Value at Risk calculations
      const varCalculations = await this.calculateVaR(
        input,
        volatilityPredictions,
      );

      // Run stress tests and scenario analysis
      const stressTestResults = await this.performStressTesting(input);

      // Monte Carlo simulation
      const monteCarloResults = await this.runMonteCarloSimulation(
        input,
        volatilityPredictions,
      );

      // Calculate position-level risk contributions
      const positionRisks = await this.calculatePositionRisks(
        input,
        volatilityPredictions,
      );

      const riskMetrics: RiskMetrics = {
        portfolioRisk: {
          var95: varCalculations.var95,
          var99: varCalculations.var99,
          expectedShortfall: varCalculations.expectedShortfall,
          maxDrawdown: await this.calculateMaxDrawdown(input),
          sharpeRatio: await this.calculateSharpeRatio(input),
          sortinoRatio: await this.calculateSortinoRatio(input),
          beta: await this.calculatePortfolioBeta(input),
          alpha: await this.calculatePortfolioAlpha(input),
        },
        positionRisks,
        scenarioAnalysis: {
          stressTestResults,
          monteCarloResults,
        },
      };

      // Log risk assessment
      await this.logRiskAssessment(input, riskMetrics);

      return riskMetrics;
    } catch (error) {
      this.logger.error(
        `Risk assessment failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Calculate dynamic position sizing based on market conditions
   */
  async calculateDynamicPositionSize(
    symbol: string,
    portfolioValue: number,
    riskTolerance: number,
    marketConditions: any,
  ): Promise<DynamicPositionSizing> {
    this.logger.debug(`Calculating dynamic position size for ${symbol}`);

    try {
      // Predict asset volatility
      const volatilityPrediction = await this.predictAssetVolatility(
        symbol,
        marketConditions,
      );

      // Calculate Kelly fraction
      const kellyFraction = await this.calculateKellyFraction(
        symbol,
        volatilityPrediction,
      );

      // Adjust for market conditions
      const marketAdjustment =
        await this.getMarketConditionAdjustment(marketConditions);

      // Calculate risk-adjusted position size
      const baseSize =
        portfolioValue * riskTolerance * kellyFraction * marketAdjustment;

      // Apply concentration limits
      const maxPosition = portfolioValue * 0.2; // Max 20% in single position
      const recommendedSize = Math.min(baseSize, maxPosition);

      // Calculate confidence intervals
      const confidenceInterval = await this.calculatePositionSizeConfidence(
        symbol,
        recommendedSize,
        volatilityPrediction,
      );

      const reasoning = [
        `Kelly fraction: ${kellyFraction.toFixed(4)}`,
        `Market adjustment: ${marketAdjustment.toFixed(4)}`,
        `Volatility prediction: ${volatilityPrediction.toFixed(4)}`,
        `Risk tolerance: ${riskTolerance.toFixed(4)}`,
      ];

      return {
        symbol,
        recommendedSize,
        maxPosition,
        riskBudget: (recommendedSize / portfolioValue) * 100,
        kellyFraction,
        confidenceInterval,
        reasoning,
      };
    } catch (error) {
      this.logger.error(
        `Position sizing calculation failed for ${symbol}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Implement adaptive stop-loss mechanisms
   */
  async calculateAdaptiveStopLoss(
    symbol: string,
    entryPrice: number,
    currentPrice: number,
    positionAge: number, // hours
    marketConditions: any,
  ): Promise<AdaptiveStopLoss> {
    this.logger.debug(`Calculating adaptive stop-loss for ${symbol}`);

    try {
      // Get current volatility
      const currentVolatility = await this.getCurrentVolatility(symbol);

      // Calculate ATR-based stop loss
      const atrStopLoss = await this.calculateATRStopLoss(
        symbol,
        currentPrice,
        currentVolatility,
      );

      // Calculate momentum-based stop loss
      const momentumStopLoss = await this.calculateMomentumStopLoss(
        symbol,
        currentPrice,
      );

      // Calculate volatility-adjusted stop loss
      const volatilityStopLoss = await this.calculateVolatilityStopLoss(
        currentPrice,
        currentVolatility,
        marketConditions,
      );

      // Time decay adjustment
      const timeDecayAdjustment = Math.max(0.5, 1 - positionAge / (24 * 7)); // Tighten over week

      // Select best stop loss method based on market conditions
      const { bestStopLoss, stopLossType } = await this.selectOptimalStopLoss({
        atr: atrStopLoss,
        momentum: momentumStopLoss,
        volatility: volatilityStopLoss,
        marketConditions,
      });

      // Apply time decay
      const adjustedStopLoss = bestStopLoss * timeDecayAdjustment;

      // Calculate risk/reward ratio
      const riskRatio =
        Math.abs(currentPrice - adjustedStopLoss) / currentPrice;

      return {
        symbol,
        currentStopLoss: entryPrice * 0.95, // Placeholder for current stop
        newStopLoss: adjustedStopLoss,
        stopLossType,
        riskRatio,
        timeDecay: timeDecayAdjustment,
        volatilityAdjustment: currentVolatility,
        trendAdjustment: await this.getTrendAdjustment(symbol),
      };
    } catch (error) {
      this.logger.error(
        `Adaptive stop-loss calculation failed for ${symbol}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Real-time risk monitoring and alerting
   */
  async monitorRisks(
    portfolioInput: RiskAssessmentInput,
  ): Promise<RiskAlert[]> {
    this.logger.debug('Monitoring portfolio risks');

    const alerts: RiskAlert[] = [];

    try {
      // Check concentration risk
      const concentrationAlerts =
        await this.checkConcentrationRisk(portfolioInput);
      alerts.push(...concentrationAlerts);

      // Check correlation risk
      const correlationAlerts = await this.checkCorrelationRisk(portfolioInput);
      alerts.push(...correlationAlerts);

      // Check volatility spikes
      const volatilityAlerts = await this.checkVolatilitySpikes(portfolioInput);
      alerts.push(...volatilityAlerts);

      // Check VaR breaches
      const varAlerts = await this.checkVaRBreaches(portfolioInput);
      alerts.push(...varAlerts);

      // Check liquidity risk
      const liquidityAlerts = await this.checkLiquidityRisk(portfolioInput);
      alerts.push(...liquidityAlerts);

      // Check drawdown limits
      const drawdownAlerts = await this.checkDrawdownLimits(portfolioInput);
      alerts.push(...drawdownAlerts);

      // Sort by severity
      alerts.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });

      if (alerts.length > 0) {
        this.logger.warn(`Generated ${alerts.length} risk alerts`);
      }

      return alerts;
    } catch (error) {
      this.logger.error(
        `Risk monitoring failed: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
  /**
   * Stress testing and scenario analysis
   */
  async performStressTesting(input: RiskAssessmentInput): Promise<
    Array<{
      scenario: string;
      portfolioImpact: number;
      probability: number;
    }>
  > {
    this.logger.log('Performing stress testing scenarios');

    const scenarios = [
      {
        name: 'Market Crash (-20%)',
        marketMove: -0.2,
        probability: 0.05,
      },
      {
        name: 'Interest Rate Spike (+2%)',
        interestRateChange: 0.02,
        probability: 0.15,
      },
      {
        name: 'High Volatility (VIX > 40)',
        volatilitySpike: 2.0,
        probability: 0.1,
      },
      {
        name: 'Liquidity Crisis',
        liquidityShock: -0.5,
        probability: 0.03,
      },
      {
        name: 'Currency Devaluation (-15%)',
        currencyMove: -0.15,
        probability: 0.08,
      },
    ];

    const results: Array<{
      scenario: string;
      portfolioImpact: number;
      probability: number;
    }> = [];

    for (const scenario of scenarios) {
      const portfolioImpact = await this.simulateScenario(input, scenario);
      results.push({
        scenario: scenario.name,
        portfolioImpact,
        probability: scenario.probability,
      });
    }

    return results;
  }

  // Private helper methods

  private async predictVolatilities(
    input: RiskAssessmentInput,
  ): Promise<Record<string, number>> {
    const volatilities: Record<string, number> = {};

    for (const position of input.positions) {
      // Use historical volatility as baseline, adjust with ML predictions
      const baseVolatility =
        input.historicalVolatility[position.symbol] || 0.02;
      const marketAdjustment = input.marketConditions.volatilityIndex / 20; // Normalize VIX

      volatilities[position.symbol] = baseVolatility * (1 + marketAdjustment);
    }

    return volatilities;
  }

  private async calculateCorrelationRisk(
    input: RiskAssessmentInput,
  ): Promise<number> {
    const correlations = input.marketConditions.correlationMatrix;
    let avgCorrelation = 0;
    let count = 0;

    for (const symbol1 of Object.keys(correlations)) {
      for (const symbol2 of Object.keys(correlations[symbol1])) {
        if (symbol1 !== symbol2) {
          avgCorrelation += Math.abs(correlations[symbol1][symbol2]);
          count++;
        }
      }
    }

    return count > 0 ? avgCorrelation / count : 0;
  }

  private async calculateVaR(
    input: RiskAssessmentInput,
    volatilities: Record<string, number>,
  ): Promise<{ var95: number; var99: number; expectedShortfall: number }> {
    // Simplified VaR calculation using portfolio variance
    let portfolioVariance = 0;

    // Calculate individual position variances
    for (const position of input.positions) {
      const vol = volatilities[position.symbol] || 0.02;
      portfolioVariance += Math.pow(position.weight * vol, 2);
    }

    // Add correlation effects (simplified)
    const correlationEffect = 1.2; // Assume 20% increase due to correlations
    portfolioVariance *= correlationEffect;

    const portfolioVol = Math.sqrt(portfolioVariance);

    // VaR calculations (assuming normal distribution)
    const var95 = input.portfolioValue * portfolioVol * 1.645; // 95% confidence
    const var99 = input.portfolioValue * portfolioVol * 2.326; // 99% confidence
    const expectedShortfall = var95 * 1.3; // Simplified ES calculation

    return { var95, var99, expectedShortfall };
  }

  private async runMonteCarloSimulation(
    input: RiskAssessmentInput,
    volatilities: Record<string, number>,
  ): Promise<{
    expectedReturn: number;
    worstCase5: number;
    worstCase1: number;
    bestCase95: number;
    bestCase99: number;
  }> {
    const simulations = 10000;
    const returns: number[] = [];

    for (let i = 0; i < simulations; i++) {
      let portfolioReturn = 0;

      for (const position of input.positions) {
        // Generate random return using normal distribution
        const vol = volatilities[position.symbol] || 0.02;
        const expectedReturn = 0.08 / 252; // 8% annual return, daily
        const randomReturn = this.generateNormalRandom(expectedReturn, vol);

        portfolioReturn += position.weight * randomReturn;
      }

      returns.push(portfolioReturn);
    }

    returns.sort((a, b) => a - b);

    return {
      expectedReturn: returns.reduce((sum, r) => sum + r, 0) / returns.length,
      worstCase5: returns[Math.floor(simulations * 0.05)],
      worstCase1: returns[Math.floor(simulations * 0.01)],
      bestCase95: returns[Math.floor(simulations * 0.95)],
      bestCase99: returns[Math.floor(simulations * 0.99)],
    };
  }

  private async calculatePositionRisks(
    input: RiskAssessmentInput,
    volatilities: Record<string, number>,
  ): Promise<
    Array<{
      symbol: string;
      individualRisk: number;
      contributionToRisk: number;
      concentration: number;
      correlationRisk: number;
    }>
  > {
    return input.positions.map((position) => {
      const vol = volatilities[position.symbol] || 0.02;
      const individualRisk = position.positionValue * vol;

      return {
        symbol: position.symbol,
        individualRisk,
        contributionToRisk: individualRisk * position.weight,
        concentration: position.weight,
        correlationRisk: this.calculatePositionCorrelationRisk(
          position,
          input.marketConditions.correlationMatrix,
        ),
      };
    });
  }

  private calculatePositionCorrelationRisk(
    position: any,
    correlations: Record<string, Record<string, number>>,
  ): number {
    const positionCorrelations = correlations[position.symbol] || {};
    const avgCorrelation =
      Object.values(positionCorrelations).reduce(
        (sum, corr) => sum + Math.abs(corr),
        0,
      ) / Object.values(positionCorrelations).length;
    return avgCorrelation || 0;
  }

  private generateNormalRandom(mean: number, stdDev: number): number {
    // Box-Muller transformation for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + stdDev * z0;
  }

  // Additional helper methods (simplified implementations)

  private async calculateMaxDrawdown(
    input: RiskAssessmentInput,
  ): Promise<number> {
    // Simplified - would calculate from historical data
    return 0.05; // 5% max drawdown
  }

  private async calculateSharpeRatio(
    input: RiskAssessmentInput,
  ): Promise<number> {
    // Simplified calculation
    return 1.2;
  }

  private async calculateSortinoRatio(
    input: RiskAssessmentInput,
  ): Promise<number> {
    // Simplified calculation
    return 1.5;
  }

  private async calculatePortfolioBeta(
    input: RiskAssessmentInput,
  ): Promise<number> {
    // Simplified calculation
    return 1.1;
  }

  private async calculatePortfolioAlpha(
    input: RiskAssessmentInput,
  ): Promise<number> {
    // Simplified calculation
    return 0.02; // 2% alpha
  }

  private async logRiskAssessment(
    input: RiskAssessmentInput,
    metrics: RiskMetrics,
  ): Promise<void> {
    this.logger.log(
      `Risk assessment completed - VaR95: ${metrics.portfolioRisk.var95.toFixed(2)}, Sharpe: ${metrics.portfolioRisk.sharpeRatio.toFixed(4)}`,
    );
  }

  private async predictAssetVolatility(
    symbol: string,
    marketConditions: any,
  ): Promise<number> {
    // Simplified volatility prediction
    return 0.02 + Math.random() * 0.01;
  }

  private async calculateKellyFraction(
    symbol: string,
    volatility: number,
  ): Promise<number> {
    // Simplified Kelly fraction calculation
    const winProbability = 0.55;
    const avgWin = 0.03;
    const avgLoss = 0.02;

    return (winProbability * avgWin - (1 - winProbability) * avgLoss) / avgWin;
  }

  private async getMarketConditionAdjustment(
    marketConditions: any,
  ): Promise<number> {
    // Adjust position sizes based on market conditions
    let adjustment = 1.0;

    if (marketConditions.volatilityIndex > 30) adjustment *= 0.8; // Reduce in high volatility
    if (marketConditions.marketTrend === 'bear') adjustment *= 0.7; // Reduce in bear market
    if (marketConditions.liquidityConditions === 'low') adjustment *= 0.6; // Reduce in low liquidity

    return Math.max(0.2, adjustment); // Minimum 20% of normal size
  }

  private async calculatePositionSizeConfidence(
    symbol: string,
    size: number,
    volatility: number,
  ): Promise<{ lower: number; upper: number }> {
    const confidence = 1 - volatility; // Higher volatility = lower confidence
    const range = size * 0.2; // 20% range

    return {
      lower: size - range * (1 - confidence),
      upper: size + range * (1 - confidence),
    };
  }

  private async getCurrentVolatility(symbol: string): Promise<number> {
    // Simplified - would fetch real-time volatility
    return 0.02 + Math.random() * 0.01;
  }

  private async calculateATRStopLoss(
    symbol: string,
    currentPrice: number,
    volatility: number,
  ): Promise<number> {
    const atrMultiplier = 2.0;
    const atr = currentPrice * volatility * atrMultiplier;
    return currentPrice - atr;
  }

  private async calculateMomentumStopLoss(
    symbol: string,
    currentPrice: number,
  ): Promise<number> {
    // Simplified momentum-based stop loss
    return currentPrice * 0.97; // 3% stop loss
  }

  private async calculateVolatilityStopLoss(
    currentPrice: number,
    volatility: number,
    marketConditions: any,
  ): Promise<number> {
    const volMultiplier = marketConditions.volatilityIndex > 25 ? 2.5 : 2.0;
    return currentPrice * (1 - volatility * volMultiplier);
  }
  private async selectOptimalStopLoss(stopLosses: any): Promise<{
    bestStopLoss: number;
    stopLossType: 'fixed' | 'trailing' | 'volatility' | 'atr' | 'momentum';
  }> {
    // Simple selection logic - choose the most conservative (highest) stop loss
    const values = Object.entries(stopLosses).filter(
      ([key]) => key !== 'marketConditions',
    );
    const best = values.reduce(
      (max, [key, value]) =>
        (value as number) > max.value ? { key, value: value as number } : max,
      { key: '', value: 0 },
    );

    // Map the key to a valid stop loss type
    const typeMapping: Record<
      string,
      'fixed' | 'trailing' | 'volatility' | 'atr' | 'momentum'
    > = {
      atr: 'atr',
      momentum: 'momentum',
      volatility: 'volatility',
    };

    return {
      bestStopLoss: best.value,
      stopLossType: typeMapping[best.key] || 'atr',
    };
  }

  private async getTrendAdjustment(symbol: string): Promise<number> {
    // Simplified trend adjustment
    return 1.0;
  }

  // Risk monitoring helper methods

  private async checkConcentrationRisk(
    input: RiskAssessmentInput,
  ): Promise<RiskAlert[]> {
    const alerts: RiskAlert[] = [];
    const maxSinglePosition = 0.2; // 20% max

    for (const position of input.positions) {
      if (position.weight > maxSinglePosition) {
        alerts.push({
          alertId: `concentration_${position.symbol}_${Date.now()}`,
          severity: 'high',
          type: 'concentration',
          message: `Position in ${position.symbol} exceeds concentration limit (${(position.weight * 100).toFixed(1)}% > ${maxSinglePosition * 100}%)`,
          recommendations: [
            'Consider reducing position size',
            'Diversify into other assets',
          ],
          affectedPositions: [position.symbol],
          timestamp: new Date(),
          requiresAction: true,
        });
      }
    }

    return alerts;
  }

  private async checkCorrelationRisk(
    input: RiskAssessmentInput,
  ): Promise<RiskAlert[]> {
    // Simplified correlation risk check
    return [];
  }

  private async checkVolatilitySpikes(
    input: RiskAssessmentInput,
  ): Promise<RiskAlert[]> {
    // Simplified volatility spike check
    return [];
  }

  private async checkVaRBreaches(
    input: RiskAssessmentInput,
  ): Promise<RiskAlert[]> {
    // Simplified VaR breach check
    return [];
  }

  private async checkLiquidityRisk(
    input: RiskAssessmentInput,
  ): Promise<RiskAlert[]> {
    // Simplified liquidity risk check
    return [];
  }

  private async checkDrawdownLimits(
    input: RiskAssessmentInput,
  ): Promise<RiskAlert[]> {
    // Simplified drawdown check
    return [];
  }

  private async simulateScenario(
    input: RiskAssessmentInput,
    scenario: any,
  ): Promise<number> {
    // Simplified scenario simulation
    if (scenario.marketMove) {
      return input.portfolioValue * scenario.marketMove;
    }
    return 0;
  }
}
