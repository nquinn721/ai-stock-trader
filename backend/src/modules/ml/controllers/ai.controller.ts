import { 
  Body, 
  Controller, 
  Get, 
  Param, 
  Post, 
  Query, 
  UseGuards 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AssistantResponse } from '../interfaces/ai.interfaces';
import { TradingRecommendation } from '../services/intelligent-recommendation.service';
import { ExplainableAIService } from '../services/explainable-ai.service';
import { TradingAssistantService } from '../services/trading-assistant.service';

// DTOs for API requests
export class ChatMessageDto {
  message: string;
  userId: string;
  conversationId?: string;
}

export class ExplainRecommendationDto {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeHorizon: '1D' | '1W' | '1M';
  stopLoss?: number;
  takeProfit?: number;
}

export class TradingQuestionDto {
  question: string;
  userId: string;
  context?: Record<string, any>;
}

@ApiTags('AI Trading Assistant')
@Controller('ai')
export class AIController {
  constructor(
    private readonly explainableAIService: ExplainableAIService,
    private readonly tradingAssistantService: TradingAssistantService,
  ) {}

  @Post('chat')
  @ApiOperation({ summary: 'Send message to AI trading assistant' })
  @ApiResponse({ 
    status: 200, 
    description: 'AI response to user message',
    type: Object // Would define proper DTO for AssistantResponse
  })
  async sendChatMessage(@Body() chatDto: ChatMessageDto): Promise<AssistantResponse> {
    return this.tradingAssistantService.processConversation(
      chatDto.message,
      chatDto.userId,
      chatDto.conversationId
    );
  }

  @Post('explain-recommendation')
  @ApiOperation({ summary: 'Get AI explanation for trading recommendation' })
  @ApiResponse({ 
    status: 200, 
    description: 'Natural language explanation of recommendation',
    type: String
  })
  async explainRecommendation(@Body() recommendationDto: ExplainRecommendationDto): Promise<{explanation: string}> {
    // Convert DTO to TradingRecommendation format
    const recommendation: TradingRecommendation = {
      symbol: recommendationDto.symbol,
      action: recommendationDto.action,
      confidence: recommendationDto.confidence,
      reasoning: recommendationDto.reasoning,
      riskLevel: recommendationDto.riskLevel,
      timeHorizon: recommendationDto.timeHorizon,
      stopLoss: recommendationDto.stopLoss,
      takeProfit: recommendationDto.takeProfit,
      timestamp: new Date(),
      metrics: {
        marketPrediction: {
          direction: recommendationDto.action,
          confidence: recommendationDto.confidence,
          timeHorizon: recommendationDto.timeHorizon,
        },
        technicalSignals: { strength: 0, signals: [] },
        sentimentAnalysis: { score: 0, sources: [], confidence: 0 },
        riskAssessment: {
          level: recommendationDto.riskLevel,
          factors: [],
          maxDrawdown: 0,
          volatility: 0,
        },
        patternRecognition: { patterns: [] },
        ensembleScore: recommendationDto.confidence,
        finalConfidence: recommendationDto.confidence,
      },
    };

    const explanation = await this.explainableAIService.explainRecommendation(recommendation);
    return { explanation };
  }

  @Get('conversations/:userId')
  @ApiOperation({ summary: 'Get user conversation history' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'limit', description: 'Number of conversations to return', required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'List of user conversations',
    type: Array
  })
  async getUserConversations(
    @Param('userId') userId: string,
    @Query('limit') limit: number = 10
  ) {
    return this.tradingAssistantService.getUserConversations(userId, limit);
  }

  @Get('conversations/:userId/:conversationId/history')
  @ApiOperation({ summary: 'Get conversation message history' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiQuery({ name: 'limit', description: 'Number of messages to return', required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Conversation message history',
    type: Array
  })
  async getConversationHistory(
    @Param('userId') userId: string,
    @Param('conversationId') conversationId: string,
    @Query('limit') limit: number = 20
  ) {
    return this.tradingAssistantService.getConversationHistory(userId, conversationId, limit);
  }

  @Post('conversations/:userId/new')
  @ApiOperation({ summary: 'Create new conversation' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ 
    status: 201, 
    description: 'New conversation created',
    type: Object
  })
  async createNewConversation(@Param('userId') userId: string) {
    const conversationId = await this.tradingAssistantService.createNewConversation(userId);
    return { conversationId };
  }

  @Post('conversations/:conversationId/end')
  @ApiOperation({ summary: 'End conversation' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Conversation ended successfully'
  })
  async endConversation(@Param('conversationId') conversationId: string) {
    await this.tradingAssistantService.endConversation(conversationId);
    return { message: 'Conversation ended successfully' };
  }

  @Get('explanations/:symbol')
  @ApiOperation({ summary: 'Get explanation history for a symbol' })
  @ApiParam({ name: 'symbol', description: 'Stock symbol' })
  @ApiQuery({ name: 'limit', description: 'Number of explanations to return', required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Explanation history for symbol',
    type: Array
  })
  async getExplanationHistory(
    @Param('symbol') symbol: string,
    @Query('limit') limit: number = 10
  ) {
    return this.explainableAIService.getExplanationHistory(symbol, limit);
  }

  @Post('question')
  @ApiOperation({ summary: 'Ask a trading question to AI assistant' })
  @ApiResponse({ 
    status: 200, 
    description: 'AI response to trading question',
    type: Object
  })
  async askTradingQuestion(@Body() questionDto: TradingQuestionDto) {
    return this.tradingAssistantService.processTradingQuestion(
      questionDto.question,
      questionDto.userId,
      questionDto.context
    );
  }

  @Post('market-commentary')
  @ApiOperation({ summary: 'Get AI market commentary' })
  @ApiResponse({ 
    status: 200, 
    description: 'AI market commentary',
    type: Object
  })
  async getMarketCommentary(
    @Body() body: { symbols?: string[] }
  ) {
    return this.tradingAssistantService.generateMarketCommentary(body.symbols);
  }

  @Post('portfolio-insights')
  @ApiOperation({ summary: 'Get AI portfolio insights' })
  @ApiResponse({ 
    status: 200, 
    description: 'AI portfolio insights',
    type: Object
  })
  async getPortfolioInsights(
    @Body() body: { userId: string; portfolioId?: string }
  ) {
    return this.tradingAssistantService.getPortfolioInsights(body.userId, body.portfolioId);
  }

  @Post('explain-stock')
  @ApiOperation({ summary: 'Get AI explanation for stock situation' })
  @ApiResponse({ 
    status: 200, 
    description: 'AI stock explanation',
    type: Object
  })
  async explainStockSituation(
    @Body() body: { symbol: string; context?: Record<string, any> }
  ) {
    const explanation = await this.explainableAIService.explainStockSituation(
      body.symbol, 
      body.context
    );
    return { explanation };
  }

  @Post('strategy-suggestions')
  @ApiOperation({ summary: 'Get AI trading strategy suggestions' })
  @ApiResponse({ 
    status: 200, 
    description: 'AI strategy suggestions',
    type: Object
  })
  async getTradingStrategySuggestions(
    @Body() userProfile: {
      riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
      timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
      capital: number;
      experience: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    }
  ) {
    return this.tradingAssistantService.generateStrategySupggestions(userProfile);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get conversation history with query params' })
  @ApiQuery({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'conversationId', description: 'Conversation ID', required: false })
  @ApiQuery({ name: 'limit', description: 'Number of messages to return', required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Conversation message history',
    type: Object
  })
  async getConversationHistoryByQuery(
    @Query('userId') userId: string,
    @Query('conversationId') conversationId?: string,
    @Query('limit') limit: number = 50
  ) {
    const messages = await this.tradingAssistantService.getConversationHistory(
      userId, 
      conversationId || '', 
      limit
    );
    return { messages };
  }
}
