import { Injectable, Logger } from '@nestjs/common';

export enum SizingMethod {
  FIXED = 'fixed',
  PERCENTAGE = 'percentage',
  KELLY = 'kelly',
  VOLATILITY_ADJUSTED = 'volatility_adjusted',
  RISK_PARITY = 'risk_parity',
}

export interface PositionSizeRequest {
  portfolioValue: number;
  symbol: string;
  currentPrice: number;
  volatility?: number;
  expectedReturn?: number;
  winRate?: number;
  avgWin?: number;
  avgLoss?: number;
  maxRiskPercentage?: number;
}

export interface PositionSizeResult {
  quantity: number;
  dollarAmount: number;
  percentageOfPortfolio: number;
  reasoning: string;
}

@Injectable()
export class PositionSizingService {
  private readonly logger = new Logger(PositionSizingService.name);

  /**
   * Calculate position size based on the specified method
   */
  async calculatePositionSize(
    method: SizingMethod,
    request: PositionSizeRequest,
    methodParams?: any,
  ): Promise<PositionSizeResult> {
    try {
      let result: PositionSizeResult;

      switch (method) {
        case SizingMethod.FIXED:
          result = this.calculateFixedSize(request, methodParams);
          break;
        case SizingMethod.PERCENTAGE:
          result = this.calculatePercentageSize(request, methodParams);
          break;
        case SizingMethod.KELLY:
          result = this.calculateKellySize(request, methodParams);
          break;
        case SizingMethod.VOLATILITY_ADJUSTED:
          result = this.calculateVolatilityAdjustedSize(request, methodParams);
          break;
        case SizingMethod.RISK_PARITY:
          result = this.calculateRiskParitySize(request, methodParams);
          break;
        default:
          result = this.calculatePercentageSize(request, { percentage: 5 });
      }

      this.logger.debug(
        `Position size calculated for ${request.symbol}: ${result.quantity} shares ($${result.dollarAmount})`,
      );
      return result;
    } catch (error) {
      this.logger.error('Error calculating position size:', error);
      // Fallback to safe default
      return this.calculatePercentageSize(request, { percentage: 1 });
    }
  }

  /**
   * Fixed dollar amount position sizing
   */
  private calculateFixedSize(
    request: PositionSizeRequest,
    params: { dollarAmount: number },
  ): PositionSizeResult {
    const dollarAmount = Math.min(
      params.dollarAmount,
      request.portfolioValue * 0.2,
    ); // Cap at 20% of portfolio
    const quantity = Math.floor(dollarAmount / request.currentPrice);
    const actualDollarAmount = quantity * request.currentPrice;
    const percentageOfPortfolio =
      (actualDollarAmount / request.portfolioValue) * 100;

    return {
      quantity,
      dollarAmount: actualDollarAmount,
      percentageOfPortfolio,
      reasoning: `Fixed dollar amount sizing: $${params.dollarAmount} target`,
    };
  }

  /**
   * Percentage of portfolio position sizing
   */
  private calculatePercentageSize(
    request: PositionSizeRequest,
    params: { percentage: number },
  ): PositionSizeResult {
    const percentage = Math.min(params.percentage, 20); // Cap at 20%
    const dollarAmount = (request.portfolioValue * percentage) / 100;
    const quantity = Math.floor(dollarAmount / request.currentPrice);
    const actualDollarAmount = quantity * request.currentPrice;
    const actualPercentage =
      (actualDollarAmount / request.portfolioValue) * 100;

    return {
      quantity,
      dollarAmount: actualDollarAmount,
      percentageOfPortfolio: actualPercentage,
      reasoning: `Percentage-based sizing: ${percentage}% of portfolio`,
    };
  }

  /**
   * Kelly Criterion position sizing
   */
  private calculateKellySize(
    request: PositionSizeRequest,
    params?: { winRate?: number; avgWin?: number; avgLoss?: number },
  ): PositionSizeResult {
    // Default parameters if not provided
    const winRate = params?.winRate || request.winRate || 0.55;
    const avgWin = params?.avgWin || request.avgWin || 0.08; // 8% average win
    const avgLoss = params?.avgLoss || request.avgLoss || 0.05; // 5% average loss

    // Kelly formula: f = (bp - q) / b
    // where f = fraction of capital to wager
    // b = odds of winning (avgWin/avgLoss)
    // p = probability of winning
    // q = probability of losing (1-p)

    const b = avgWin / avgLoss;
    const p = winRate;
    const q = 1 - winRate;

    const kellyFraction = (b * p - q) / b;

    // Apply conservative cap (max 25% Kelly)
    const cappedKelly = Math.max(0, Math.min(kellyFraction, 0.25));

    const dollarAmount = request.portfolioValue * cappedKelly;
    const quantity = Math.floor(dollarAmount / request.currentPrice);
    const actualDollarAmount = quantity * request.currentPrice;
    const percentageOfPortfolio =
      (actualDollarAmount / request.portfolioValue) * 100;

    return {
      quantity,
      dollarAmount: actualDollarAmount,
      percentageOfPortfolio,
      reasoning: `Kelly Criterion sizing: ${(kellyFraction * 100).toFixed(1)}% of portfolio (capped at 25%)`,
    };
  }

  /**
   * Volatility-adjusted position sizing
   */
  private calculateVolatilityAdjustedSize(
    request: PositionSizeRequest,
    params: { basePercentage?: number; volatilityTarget?: number },
  ): PositionSizeResult {
    const basePercentage = params.basePercentage || 5; // 5% base
    const volatilityTarget = params.volatilityTarget || 0.02; // 2% target volatility
    const currentVolatility = request.volatility || 0.03; // 3% default

    // Adjust position size inversely to volatility
    const volatilityAdjustment = volatilityTarget / currentVolatility;
    const adjustedPercentage = Math.min(
      basePercentage * volatilityAdjustment,
      15,
    ); // Cap at 15%

    const dollarAmount = (request.portfolioValue * adjustedPercentage) / 100;
    const quantity = Math.floor(dollarAmount / request.currentPrice);
    const actualDollarAmount = quantity * request.currentPrice;
    const actualPercentage =
      (actualDollarAmount / request.portfolioValue) * 100;

    return {
      quantity,
      dollarAmount: actualDollarAmount,
      percentageOfPortfolio: actualPercentage,
      reasoning: `Volatility-adjusted sizing: ${adjustedPercentage.toFixed(1)}% (volatility: ${(currentVolatility * 100).toFixed(1)}%)`,
    };
  }

  /**
   * Risk parity position sizing
   */
  private calculateRiskParitySize(
    request: PositionSizeRequest,
    params: { riskTarget?: number },
  ): PositionSizeResult {
    const riskTarget = params.riskTarget || 0.01; // 1% risk target
    const volatility = request.volatility || 0.03; // 3% default volatility
    const maxRiskPercentage = request.maxRiskPercentage || 2; // 2% max risk

    // Calculate position size to achieve target risk
    const riskPerShare = request.currentPrice * volatility;
    const maxRiskDollars = (request.portfolioValue * maxRiskPercentage) / 100;
    const targetRiskDollars = (request.portfolioValue * riskTarget * 100) / 100;

    const riskBasedQuantity = Math.floor(
      Math.min(targetRiskDollars, maxRiskDollars) / riskPerShare,
    );
    const dollarAmount = riskBasedQuantity * request.currentPrice;
    const percentageOfPortfolio = (dollarAmount / request.portfolioValue) * 100;

    return {
      quantity: riskBasedQuantity,
      dollarAmount,
      percentageOfPortfolio,
      reasoning: `Risk parity sizing: ${riskTarget * 100}% risk target (volatility: ${(volatility * 100).toFixed(1)}%)`,
    };
  }

  /**
   * Get recommended sizing method based on market conditions and strategy
   */
  getRecommendedSizingMethod(
    marketVolatility: number,
    strategyWinRate?: number,
    riskTolerance: 'conservative' | 'moderate' | 'aggressive' = 'moderate',
  ): { method: SizingMethod; params: any; reasoning: string } {
    // High volatility markets
    if (marketVolatility > 0.05) {
      return {
        method: SizingMethod.VOLATILITY_ADJUSTED,
        params: { basePercentage: 3, volatilityTarget: 0.02 },
        reasoning:
          'High volatility environment - using volatility-adjusted sizing',
      };
    }

    // High confidence strategies with good win rate
    if (strategyWinRate && strategyWinRate > 0.6) {
      return {
        method: SizingMethod.KELLY,
        params: { winRate: strategyWinRate },
        reasoning: 'High win rate strategy - using Kelly Criterion',
      };
    }

    // Risk tolerance based selection
    switch (riskTolerance) {
      case 'conservative':
        return {
          method: SizingMethod.RISK_PARITY,
          params: { riskTarget: 0.005 }, // 0.5% risk
          reasoning: 'Conservative approach - using risk parity',
        };

      case 'aggressive':
        return {
          method: SizingMethod.PERCENTAGE,
          params: { percentage: 10 },
          reasoning: 'Aggressive approach - using higher percentage',
        };

      default:
        return {
          method: SizingMethod.PERCENTAGE,
          params: { percentage: 5 },
          reasoning: 'Moderate approach - using percentage-based sizing',
        };
    }
  }

  /**
   * Calculate maximum safe position size
   */
  calculateMaxSafeSize(
    request: PositionSizeRequest,
    maxRiskPercentage: number = 2,
  ): PositionSizeResult {
    const maxRiskDollars = (request.portfolioValue * maxRiskPercentage) / 100;
    const volatility = request.volatility || 0.03;

    // Assume stop loss at 2 standard deviations
    const stopLossPercentage = volatility * 2;
    const maxPositionValue = maxRiskDollars / stopLossPercentage;

    const quantity = Math.floor(maxPositionValue / request.currentPrice);
    const dollarAmount = quantity * request.currentPrice;
    const percentageOfPortfolio = (dollarAmount / request.portfolioValue) * 100;

    return {
      quantity,
      dollarAmount,
      percentageOfPortfolio,
      reasoning: `Maximum safe size based on ${maxRiskPercentage}% portfolio risk`,
    };
  }
}
