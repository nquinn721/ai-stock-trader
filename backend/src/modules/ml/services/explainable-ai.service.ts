import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIExplanation } from '../entities/ai.entities';
import {
  ExplanationContext,
  MarketConditions,
  NewsItem,
} from '../interfaces/ai.interfaces';
import { TradingRecommendation } from './intelligent-recommendation.service';
import { LLMService } from './llm.service';

@Injectable()
export class ExplainableAIService {
  private readonly logger = new Logger(ExplainableAIService.name);

  constructor(
    @InjectRepository(AIExplanation)
    private readonly explanationRepository: Repository<AIExplanation>,
    private readonly llmService: LLMService,
  ) {}

  async explainRecommendation(
    recommendation: TradingRecommendation,
  ): Promise<string> {
    try {
      // Check if we already have an explanation for this recommendation
      const existingExplanation = await this.explanationRepository.findOne({
        where: {
          symbol: recommendation.symbol,
          signal: recommendation.action,
          confidence: recommendation.confidence,
        },
        order: { timestamp: 'DESC' },
      });

      // Return cached explanation if it's recent (within 1 hour)
      if (
        existingExplanation &&
        new Date().getTime() - existingExplanation.timestamp.getTime() < 3600000
      ) {
        return existingExplanation.explanation;
      }

      // Build context for LLM
      const context = await this.buildExplanationContext(recommendation);

      // Generate explanation using LLM
      const explanation = await this.llmService.generateExplanation(context);

      // Store the explanation for caching
      await this.saveExplanation(recommendation, explanation, context);

      return explanation;
    } catch (error) {
      this.logger.error(
        `Failed to explain recommendation for ${recommendation.symbol}:`,
        error,
      );
      return this.generateFallbackExplanation(recommendation);
    }
  }

  async answerTradingQuestion(
    question: string,
    userContext: any,
  ): Promise<string> {
    try {
      const response = await this.llmService.processQuery(
        question,
        userContext,
      );
      return response.response;
    } catch (error) {
      this.logger.error('Failed to process trading question:', error);
      return "I apologize, but I'm having trouble processing your question right now. Please try again later or contact support for assistance.";
    }
  }

  async explainStockSituation(
    symbol: string,
    context?: Record<string, any>,
  ): Promise<string> {
    try {
      // Build context for stock situation explanation
      const explanationContext = await this.buildStockSituationContext(
        symbol,
        context,
      );

      // Generate explanation using LLM
      const explanation =
        await this.llmService.generateExplanation(explanationContext);

      // Store the explanation for caching
      await this.saveStockExplanation(symbol, explanation, explanationContext);

      return explanation;
    } catch (error) {
      this.logger.error(
        `Failed to explain stock situation for ${symbol}:`,
        error,
      );
      return this.generateFallbackStockExplanation(symbol, context);
    }
  }

  async getExplanationHistory(
    symbol: string,
    limit: number = 10,
  ): Promise<any[]> {
    try {
      const explanations = await this.explanationRepository.find({
        where: { symbol },
        order: { timestamp: 'DESC' },
        take: limit,
      });

      return explanations.map((exp) => ({
        id: exp.id,
        symbol: exp.symbol,
        signal: exp.signal,
        confidence: exp.confidence,
        explanation: exp.explanation,
        timestamp: exp.timestamp,
      }));
    } catch (error) {
      this.logger.error(
        `Failed to get explanation history for ${symbol}:`,
        error,
      );
      return [];
    }
  }

  private async buildExplanationContext(
    recommendation: TradingRecommendation,
  ): Promise<ExplanationContext> {
    // Extract technical indicators from recommendation metrics
    const indicators: Record<string, number> = {};

    if (recommendation.metrics.technicalSignals?.signals) {
      recommendation.metrics.technicalSignals.signals.forEach((signal) => {
        indicators[signal.type] = signal.value;
      });
    }

    // Build market conditions
    const marketConditions: MarketConditions = {
      marketTrend: this.inferMarketTrend(recommendation),
      volatility: recommendation.metrics.riskAssessment?.volatility || 0,
      volume: 0, // Would need volume data from stock service
      sector: 'Technology', // Would need sector data
      marketCap: 'Large Cap', // Would need market cap data
      news: await this.getRelevantNews(recommendation.symbol),
    };

    // Extract risk factors
    const riskFactors = recommendation.metrics.riskAssessment?.factors || [];

    return {
      signal: recommendation.action,
      confidence: recommendation.confidence,
      indicators,
      marketConditions,
      riskFactors,
      priceTarget: recommendation.takeProfit,
      stopLoss: recommendation.stopLoss,
      timeHorizon: recommendation.timeHorizon,
    };
  }

  private inferMarketTrend(
    recommendation: TradingRecommendation,
  ): 'BULLISH' | 'BEARISH' | 'SIDEWAYS' {
    if (recommendation.action === 'BUY' && recommendation.confidence > 0.7) {
      return 'BULLISH';
    } else if (
      recommendation.action === 'SELL' &&
      recommendation.confidence > 0.7
    ) {
      return 'BEARISH';
    }
    return 'SIDEWAYS';
  }

  private async getRelevantNews(symbol: string): Promise<NewsItem[]> {
    // This would integrate with the news service to get relevant news
    // For now, return empty array as a placeholder
    return [];
  }

  private async saveExplanation(
    recommendation: TradingRecommendation,
    explanation: string,
    context: ExplanationContext,
  ): Promise<void> {
    try {
      const aiExplanation = this.explanationRepository.create({
        symbol: recommendation.symbol,
        signal: recommendation.action,
        explanation,
        confidence: recommendation.confidence,
        indicators: context.indicators,
        marketConditions: context.marketConditions,
        riskFactors: context.riskFactors,
        priceTarget: context.priceTarget,
        stopLoss: context.stopLoss,
        timestamp: new Date(),
      });

      await this.explanationRepository.save(aiExplanation);
    } catch (error) {
      this.logger.error('Failed to save AI explanation:', error);
      // Don't throw - explanation generation succeeded, saving is optional
    }
  }

  private async buildStockSituationContext(
    symbol: string,
    context?: Record<string, any>,
  ): Promise<any> {
    // TODO: Integrate with stock service to get real market data
    return {
      signal: 'HOLD' as const,
      confidence: 0.7,
      indicators: {
        price: context?.currentPrice || 0,
        volume: context?.volume || 0,
        rsi: context?.rsi || 50,
      },
      marketConditions: {
        marketTrend: 'SIDEWAYS' as const,
        volatility: 0.2,
        volume: context?.volume || 0,
        sector: context?.sector || 'Technology',
        marketCap: context?.marketCap || 'Large Cap',
      },
      riskFactors: ['Market volatility', 'Sector-specific risks'],
      timeHorizon: '1W',
    };
  }

  private async saveStockExplanation(
    symbol: string,
    explanation: string,
    context: any,
  ): Promise<void> {
    try {
      const stockExplanation = this.explanationRepository.create({
        symbol,
        signal: context.signal,
        confidence: context.confidence,
        explanation,
        indicators: context.indicators || {},
        marketConditions: context.marketConditions || {},
        riskFactors: context.riskFactors || [],
        priceTarget: context.priceTarget,
        stopLoss: context.stopLoss,
        // recommendationId is optional, leave undefined for stock explanations
      });

      await this.explanationRepository.save(stockExplanation);
    } catch (error) {
      this.logger.error(
        `Failed to save stock explanation for ${symbol}:`,
        error,
      );
    }
  }

  private generateFallbackExplanation(
    recommendation: TradingRecommendation,
  ): string {
    const action = recommendation.action.toLowerCase();
    const confidencePercent = (recommendation.confidence * 100).toFixed(1);
    const riskLevel = recommendation.riskLevel.toLowerCase();

    let explanation = `**${recommendation.action} Recommendation for ${recommendation.symbol}**\n\n`;
    explanation += `Our AI analysis suggests a ${action} position with ${confidencePercent}% confidence. `;
    explanation += `This is considered a ${riskLevel} risk trade.\n\n`;

    // Add reasoning if available
    if (recommendation.reasoning && recommendation.reasoning.length > 0) {
      explanation += '**Key Factors:**\n';
      recommendation.reasoning.forEach((reason, index) => {
        explanation += `${index + 1}. ${reason}\n`;
      });
      explanation += '\n';
    }

    // Add risk assessment
    explanation += `**Risk Assessment:** ${recommendation.riskLevel} risk level. `;
    if (recommendation.stopLoss) {
      explanation += `Suggested stop loss: $${recommendation.stopLoss.toFixed(2)}. `;
    }
    if (recommendation.takeProfit) {
      explanation += `Target price: $${recommendation.takeProfit.toFixed(2)}. `;
    }

    explanation += `\n**Time Horizon:** ${recommendation.timeHorizon}\n\n`;
    explanation +=
      '*This is a simplified explanation. For detailed AI insights, please ensure the AI service is properly configured.*';

    return explanation;
  }

  private generateFallbackStockExplanation(
    symbol: string,
    context?: Record<string, any>,
  ): string {
    return `
**${symbol} Current Situation**

Based on available information, here's what we know about ${symbol}:

**Current Status:**
- The stock is currently being monitored by our systems
- Market conditions are being analyzed for trading opportunities
- Technical indicators are being evaluated

**Key Considerations:**
- Monitor for any significant price movements
- Watch for volume changes that might indicate trend shifts
- Keep an eye on sector performance and market sentiment
- Consider your portfolio allocation and risk tolerance

**Recommendation:**
- Continue monitoring the stock's performance
- Review your position sizing if you currently hold shares
- Stay informed about company news and earnings announcements
- Consider your investment time horizon when making decisions

*Note: For more detailed analysis, please ensure the AI explanation service is properly configured with API access.*
    `.trim();
  }
}
