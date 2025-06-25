import { Injectable, Logger } from '@nestjs/common';
import {
  AssistantResponse,
  ExplanationContext,
  LLMConfig,
  UserContext,
} from '../interfaces/ai.interfaces';

@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name);
  private readonly config: LLMConfig;

  constructor() {
    this.config = {
      provider:
        (process.env.LLM_PROVIDER as 'openai' | 'anthropic') || 'openai',
      apiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || '',
      model: process.env.LLM_MODEL || 'gpt-4-turbo-preview',
      maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '1000'),
      temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    };

    if (!this.config.apiKey) {
      this.logger.warn(
        'No LLM API key configured. AI features will be limited.',
      );
    }
  }

  async generateExplanation(context: ExplanationContext): Promise<string> {
    if (!this.config.apiKey) {
      return this.getFallbackExplanation(context);
    }

    try {
      const prompt = this.buildExplanationPrompt(context);
      const response = await this.callLLM(prompt);
      return response;
    } catch (error) {
      this.logger.error('Failed to generate AI explanation:', error);
      return this.getFallbackExplanation(context);
    }
  }

  async processQuery(
    question: string,
    userContext: UserContext,
  ): Promise<AssistantResponse> {
    if (!this.config.apiKey) {
      return this.getFallbackResponse(question);
    }

    try {
      const prompt = this.buildQueryPrompt(question, userContext);
      const response = await this.callLLM(prompt);

      return {
        response,
        confidence: 0.8,
        sources: ['AI Analysis'],
        context: { question, userId: userContext.userId },
      };
    } catch (error) {
      this.logger.error('Failed to process AI query:', error);
      return this.getFallbackResponse(question);
    }
  }

  private async callLLM(prompt: string): Promise<string> {
    if (this.config.provider === 'openai') {
      return this.callOpenAI(prompt);
    } else {
      return this.callAnthropic(prompt);
    }
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert trading assistant providing clear, actionable insights to traders. Focus on practical advice and explain complex concepts simply.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Unable to generate response.';
  }

  private async callAnthropic(prompt: string): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0]?.text || 'Unable to generate response.';
  }

  private buildExplanationPrompt(context: ExplanationContext): string {
    const indicators = Object.entries(context.indicators)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');

    return `
Explain this trading recommendation in simple, clear language:

**Recommendation**: ${context.signal} (Confidence: ${(context.confidence * 100).toFixed(1)}%)
**Technical Indicators**: ${indicators}
**Market Conditions**: ${context.marketConditions.marketTrend} trend, ${context.marketConditions.volatility}% volatility
**Risk Factors**: ${context.riskFactors.join(', ')}
${context.priceTarget ? `**Price Target**: $${context.priceTarget}` : ''}
${context.stopLoss ? `**Stop Loss**: $${context.stopLoss}` : ''}

Please provide:
1. Why this recommendation makes sense right now
2. What the key technical indicators are telling us
3. Market conditions supporting this decision
4. Potential risks to watch out for
5. Suggested time horizon for this trade

Keep it conversational and educational, as if explaining to someone learning to trade.
    `.trim();
  }

  private buildQueryPrompt(question: string, userContext: UserContext): string {
    const portfolioInfo = userContext.portfolio
      ? `
**Current Portfolio**:
- Total Value: $${userContext.portfolio.totalValue.toLocaleString()}
- Daily Performance: ${userContext.portfolio.performance.daily > 0 ? '+' : ''}${userContext.portfolio.performance.daily.toFixed(2)}%
- Holdings: ${userContext.portfolio.holdings.map((h) => `${h.symbol} (${h.quantity} shares, ${h.gainLossPercent > 0 ? '+' : ''}${h.gainLossPercent.toFixed(2)}%)`).join(', ')}
      `
      : '';

    return `
**User Question**: ${question}

**User Context**:
- Risk Profile: ${userContext.riskProfile || 'Not specified'}
${portfolioInfo}

Please provide a helpful, accurate response about trading and markets. If the question is about specific stocks, include:
- Current market conditions affecting the stock
- Technical analysis insights
- Risk considerations
- Actionable advice

Keep your response practical and educational. If you need more information to provide a complete answer, let the user know what additional details would be helpful.
    `.trim();
  }

  private getFallbackExplanation(context: ExplanationContext): string {
    const confidenceText =
      context.confidence > 0.8
        ? 'High'
        : context.confidence > 0.6
          ? 'Medium'
          : 'Low';

    return `
**${context.signal} Recommendation** (${confidenceText} Confidence)

Based on our technical analysis, we recommend a ${context.signal} position. Key factors include:

• **Market Trend**: Current ${context.marketConditions.marketTrend.toLowerCase()} market conditions
• **Technical Indicators**: ${Object.keys(context.indicators).length} indicators analyzed
• **Risk Assessment**: ${context.riskFactors.length} risk factors identified

${context.priceTarget ? `**Target Price**: $${context.priceTarget}` : ''}
${context.stopLoss ? `**Stop Loss**: $${context.stopLoss}` : ''}

*Note: AI explanation service is currently limited. For detailed analysis, please review the technical indicators panel.*
    `.trim();
  }

  private getFallbackResponse(question: string): AssistantResponse {
    return {
      response: `I understand you're asking about "${question}". While I'd love to provide detailed AI-powered insights, the AI service is currently limited. 

For trading analysis, I recommend:
• Check the latest market data and technical indicators
• Review news and sentiment analysis
• Consult the recommendations panel for ML-generated signals
• Consider your risk tolerance and portfolio allocation

Is there a specific aspect of trading you'd like me to help explain using our available tools?`,
      confidence: 0.3,
      sources: ['Fallback Response'],
      context: { fallback: true, question },
    };
  }
}
