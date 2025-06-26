import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage, ConversationContext } from '../entities/ai.entities';
import {
  AssistantResponse,
  ConversationContext as IConversationContext,
  SuggestedAction,
  UserContext,
} from '../interfaces/ai.interfaces';
import { ExplainableAIService } from './explainable-ai.service';
import { LLMService } from './llm.service';

@Injectable()
export class TradingAssistantService {
  private readonly logger = new Logger(TradingAssistantService.name);
  private readonly conversationMemory = new Map<string, IConversationContext>();

  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    @InjectRepository(ConversationContext)
    private readonly conversationRepository: Repository<ConversationContext>,
    private readonly explainableAIService: ExplainableAIService,
    private readonly llmService: LLMService,
  ) {}

  async processConversation(
    message: string,
    userId: string,
    conversationId?: string,
  ): Promise<AssistantResponse> {
    try {
      // Get or create conversation context
      const conversation = await this.getOrCreateConversation(
        userId,
        conversationId,
      );

      // Build user context for this conversation
      const userContext = await this.getUserTradingContext(userId);

      // Add conversation history to context
      const contextWithHistory = {
        ...userContext,
        conversationHistory: await this.getRecentMessages(
          conversation.conversationId,
          5,
        ),
      };

      // Process the message
      const response = await this.llmService.processQuery(
        message,
        contextWithHistory,
      );

      // Enhance response with suggested actions
      const enhancedResponse = await this.enhanceWithActions(
        response,
        message,
        userContext,
      );

      // Save the conversation
      await this.saveChatMessage(
        conversation.conversationId,
        userId,
        message,
        enhancedResponse.response,
        enhancedResponse.context,
      );

      // Update conversation context
      await this.updateConversationContext(conversation.conversationId, {
        lastMessage: message,
        lastResponse: enhancedResponse.response,
        messageCount: conversation.messageCount + 1,
      });

      return enhancedResponse;
    } catch (error) {
      this.logger.error(
        `Failed to process conversation for user ${userId}:`,
        error,
      );
      return this.getFallbackResponse(message);
    }
  }

  async getConversationHistory(
    userId: string,
    conversationId: string,
    limit: number = 20,
  ): Promise<ChatMessage[]> {
    return this.chatMessageRepository.find({
      where: { userId, conversationId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  async getUserConversations(
    userId: string,
    limit: number = 10,
  ): Promise<ConversationContext[]> {
    return this.conversationRepository.find({
      where: { userId, isActive: true },
      order: { lastInteraction: 'DESC' },
      take: limit,
    });
  }

  async processTradingQuestion(
    question: string,
    userId: string,
    context?: Record<string, any>,
  ): Promise<AssistantResponse> {
    try {
      const userContext = await this.getUserTradingContext(userId);
      const enhancedContext = { ...userContext, ...context };

      return await this.llmService.processQuery(question, enhancedContext);
    } catch (error) {
      this.logger.error('Failed to process trading question:', error);
      return this.getFallbackResponse(question);
    }
  }

  async generateMarketCommentary(
    symbols?: string[],
  ): Promise<AssistantResponse> {
    try {
      // Get market data for specified symbols or general market
      const marketContext =
        symbols && symbols.length > 0
          ? await this.getMarketContextForSymbols(symbols)
          : await this.getGeneralMarketContext();

      const prompt = this.buildMarketCommentaryPrompt(marketContext);
      const response = await this.llmService.processQuery(prompt, {
        userId: 'system',
        riskProfile: 'moderate',
      });

      return {
        ...response,
        context: { ...response.context, symbols, type: 'market-commentary' },
      };
    } catch (error) {
      this.logger.error('Failed to generate market commentary:', error);
      return {
        response:
          'Market commentary is currently unavailable. Please check the dashboard for the latest market data and trends.',
        confidence: 0.3,
        sources: ['Fallback'],
        context: { fallback: true, symbols },
      };
    }
  }

  async getPortfolioInsights(
    userId: string,
    portfolioId?: string,
  ): Promise<AssistantResponse> {
    try {
      const userContext = await this.getUserTradingContext(userId);

      if (!userContext.portfolio) {
        return {
          response:
            'No portfolio data available. Please ensure you have an active portfolio to get insights.',
          confidence: 0.8,
          sources: ['Portfolio Analysis'],
          context: { userId, portfolioId },
        };
      }

      const prompt = this.buildPortfolioInsightsPrompt(userContext.portfolio);
      const response = await this.llmService.processQuery(prompt, userContext);

      return {
        ...response,
        context: {
          ...response.context,
          userId,
          portfolioId,
          type: 'portfolio-insights',
        },
      };
    } catch (error) {
      this.logger.error('Failed to get portfolio insights:', error);
      return this.getFallbackResponse('portfolio insights');
    }
  }

  async generateStrategySupggestions(userProfile: {
    riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
    timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
    capital: number;
    experience: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  }): Promise<AssistantResponse> {
    try {
      const prompt = this.buildStrategySuggestionsPrompt(userProfile);
      const response = await this.llmService.processQuery(prompt, {
        userId: 'system',
        riskProfile: userProfile.riskTolerance.toLowerCase() as any,
      });

      return {
        ...response,
        context: {
          ...response.context,
          userProfile,
          type: 'strategy-suggestions',
        },
      };
    } catch (error) {
      this.logger.error('Failed to generate strategy suggestions:', error);
      return this.getFallbackResponse('strategy suggestions');
    }
  }

  async createNewConversation(userId: string): Promise<string> {
    try {
      const conversation = this.conversationRepository.create({
        userId,
        context: {},
        isActive: true,
        messageCount: 0,
        lastInteraction: new Date(),
      });

      const savedConversation =
        await this.conversationRepository.save(conversation);
      return savedConversation.conversationId;
    } catch (error) {
      this.logger.error('Failed to create new conversation:', error);
      throw error;
    }
  }

  async endConversation(conversationId: string): Promise<void> {
    try {
      await this.conversationRepository.update(
        { conversationId },
        {
          isActive: false,
          endedAt: new Date(),
        },
      );
    } catch (error) {
      this.logger.error('Failed to end conversation:', error);
      throw error;
    }
  }

  private async getOrCreateConversation(
    userId: string,
    conversationId?: string,
  ): Promise<ConversationContext> {
    if (conversationId) {
      const existing = await this.conversationRepository.findOne({
        where: { conversationId, userId, isActive: true },
      });
      if (existing) {
        return existing;
      }
    }

    // Create new conversation
    const conversation = this.conversationRepository.create({
      userId,
      context: {},
      messageCount: 0,
      lastInteraction: new Date(),
      isActive: true,
    });

    return this.conversationRepository.save(conversation);
  }

  private async getUserTradingContext(userId: string): Promise<UserContext> {
    // This would integrate with portfolio and user services
    // For now, return basic context
    return {
      userId,
      riskProfile: 'moderate',
      preferences: {
        sectors: ['Technology', 'Healthcare'],
        riskTolerance: 0.6,
        investmentGoal: 'Growth',
        timeHorizon: 'Long-term',
      },
    };
  }

  private async getRecentMessages(
    conversationId: string,
    limit: number,
  ): Promise<ChatMessage[]> {
    return this.chatMessageRepository.find({
      where: { conversationId },
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }

  private async enhanceWithActions(
    response: AssistantResponse,
    originalMessage: string,
    userContext: UserContext,
  ): Promise<AssistantResponse> {
    const actions: SuggestedAction[] = [];

    // Detect if user is asking about specific stocks
    const stockSymbolRegex = /\b[A-Z]{1,5}\b/g;
    const mentionedSymbols = originalMessage.match(stockSymbolRegex);

    if (mentionedSymbols) {
      mentionedSymbols.forEach((symbol) => {
        if (symbol.length >= 2 && symbol.length <= 5) {
          actions.push({
            type: 'VIEW_STOCK',
            symbol,
            description: `View detailed analysis for ${symbol}`,
          });
        }
      });
    }

    // Detect trading-related intents
    if (
      originalMessage.toLowerCase().includes('buy') ||
      originalMessage.toLowerCase().includes('purchase')
    ) {
      actions.push({
        type: 'PLACE_ORDER',
        description: 'Place a buy order',
        parameters: { action: 'BUY' },
      });
    }

    if (originalMessage.toLowerCase().includes('sell')) {
      actions.push({
        type: 'PLACE_ORDER',
        description: 'Place a sell order',
        parameters: { action: 'SELL' },
      });
    }

    if (originalMessage.toLowerCase().includes('portfolio')) {
      actions.push({
        type: 'VIEW_ANALYSIS',
        description: 'View portfolio analytics',
        parameters: { view: 'portfolio' },
      });
    }

    return {
      ...response,
      actions,
    };
  }

  private async saveChatMessage(
    conversationId: string,
    userId: string,
    message: string,
    response: string,
    context?: Record<string, any>,
  ): Promise<void> {
    try {
      const chatMessage = this.chatMessageRepository.create({
        conversationId,
        userId,
        message,
        response,
        context: context || {},
        confidence: 0.8, // Default confidence
        sources: ['AI Assistant'],
        timestamp: new Date(),
      });

      await this.chatMessageRepository.save(chatMessage);
    } catch (error) {
      this.logger.error('Failed to save chat message:', error);
      // Don't throw - conversation processing succeeded, saving is optional
    }
  }

  private async updateConversationContext(
    conversationId: string,
    updates: Record<string, any>,
  ): Promise<void> {
    try {
      await this.conversationRepository.update(
        { conversationId },
        {
          context: updates,
          lastInteraction: new Date(),
          messageCount: updates.messageCount,
        },
      );
    } catch (error) {
      this.logger.error('Failed to update conversation context:', error);
    }
  }

  private async getMarketContextForSymbols(symbols: string[]): Promise<any> {
    // TODO: Implement market data fetching for specific symbols
    return {
      symbols,
      timestamp: new Date(),
      note: 'Market data integration needed',
    };
  }

  private async getGeneralMarketContext(): Promise<any> {
    // TODO: Implement general market data fetching
    return {
      timestamp: new Date(),
      note: 'General market data integration needed',
    };
  }

  private buildMarketCommentaryPrompt(marketContext: any): string {
    return `
Provide current market commentary and insights based on the following market context:

${JSON.stringify(marketContext, null, 2)}

Please provide:
1. Current market sentiment and direction
2. Key factors driving market movements today
3. Sector performance highlights
4. Any notable risks or opportunities
5. Brief outlook for the near term

Keep the commentary informative but concise, suitable for traders looking for quick market insights.
    `.trim();
  }

  private buildPortfolioInsightsPrompt(portfolio: any): string {
    return `
Analyze this portfolio and provide actionable insights:

**Portfolio Summary**:
- Total Value: $${portfolio.totalValue?.toLocaleString() || 'N/A'}
- Daily Performance: ${portfolio.performance?.daily > 0 ? '+' : ''}${portfolio.performance?.daily?.toFixed(2) || '0.00'}%
- Holdings: ${portfolio.holdings?.length || 0} positions

**Holdings Details**:
${
  portfolio.holdings
    ?.map(
      (h: any) =>
        `- ${h.symbol}: ${h.quantity} shares, ${h.gainLossPercent > 0 ? '+' : ''}${h.gainLossPercent?.toFixed(2)}% P&L`,
    )
    .join('\n') || 'No holdings data available'
}

Please provide:
1. Portfolio performance assessment
2. Diversification analysis
3. Risk evaluation
4. Specific recommendations for optimization
5. Suggested actions (rebalancing, position adjustments, etc.)

Focus on actionable insights that help improve portfolio performance and risk management.
    `.trim();
  }

  private buildStrategySuggestionsPrompt(userProfile: any): string {
    return `
Based on this user profile, suggest appropriate trading strategies:

**User Profile**:
- Risk Tolerance: ${userProfile.riskTolerance}
- Time Horizon: ${userProfile.timeHorizon}
- Available Capital: $${userProfile.capital.toLocaleString()}
- Experience Level: ${userProfile.experience}

Please provide:
1. 2-3 recommended trading strategies suitable for this profile
2. Specific implementation guidance for each strategy
3. Risk management recommendations
4. Position sizing guidelines
5. Expected time commitment and complexity level

Tailor recommendations to match the user's experience level and risk tolerance.
    `.trim();
  }

  private getFallbackResponse(message: string): AssistantResponse {
    return {
      response: `I understand you're asking about "${message}". I'm currently experiencing some technical difficulties, but I'm here to help! 

Here are some things you can try:
• Check the latest stock recommendations in the dashboard
• Review your portfolio performance and analytics
• Explore market trends and technical indicators
• Use the order management system for trading

If you have specific questions about trading strategies or market analysis, feel free to ask again!`,
      confidence: 0.3,
      sources: ['Fallback Response'],
      context: { fallback: true, originalMessage: message },
      actions: [
        {
          type: 'VIEW_ANALYSIS',
          description: 'View dashboard',
          parameters: { view: 'dashboard' },
        },
      ],
    };
  }
}
