import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage, ConversationContext } from '../entities/ai.entities';
import { AssistantResponse } from '../interfaces/ai.interfaces';
import { ExplainableAIService } from './explainable-ai.service';
import { LLMService } from './llm.service';
import { TradingAssistantService } from './trading-assistant.service';

describe('TradingAssistantService', () => {
  let service: TradingAssistantService;
  let explainableAIService: ExplainableAIService;
  let llmService: LLMService;
  let chatMessageRepository: Repository<ChatMessage>;
  let conversationRepository: Repository<ConversationContext>;

  const mockChatMessageRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockConversationRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };

  const mockExplainableAIService = {
    explainRecommendation: jest.fn(),
    answerTradingQuestion: jest.fn(),
  };

  const mockLLMService = {
    processQuery: jest.fn(),
    generateExplanation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TradingAssistantService,
        {
          provide: getRepositoryToken(ChatMessage),
          useValue: mockChatMessageRepository,
        },
        {
          provide: getRepositoryToken(ConversationContext),
          useValue: mockConversationRepository,
        },
        {
          provide: ExplainableAIService,
          useValue: mockExplainableAIService,
        },
        {
          provide: LLMService,
          useValue: mockLLMService,
        },
      ],
    }).compile();

    service = module.get<TradingAssistantService>(TradingAssistantService);
    explainableAIService =
      module.get<ExplainableAIService>(ExplainableAIService);
    llmService = module.get<LLMService>(LLMService);
    chatMessageRepository = module.get<Repository<ChatMessage>>(
      getRepositoryToken(ChatMessage),
    );
    conversationRepository = module.get<Repository<ConversationContext>>(
      getRepositoryToken(ConversationContext),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processConversation', () => {
    it('should create new conversation if none exists', async () => {
      const userId = 'test-user';
      const message = 'What stocks should I buy?';

      const newConversation = {
        conversationId: 'new-conversation-id',
        userId,
        messageCount: 0,
        lastInteraction: new Date(),
        isActive: true,
      };

      mockConversationRepository.findOne.mockResolvedValue(null);
      mockConversationRepository.create.mockReturnValue(newConversation);
      mockConversationRepository.save.mockResolvedValue(newConversation);
      mockConversationRepository.update.mockResolvedValue({});
      mockChatMessageRepository.create.mockReturnValue({});
      mockChatMessageRepository.save.mockResolvedValue({});
      mockChatMessageRepository.find.mockResolvedValue([]);

      const mockResponse: AssistantResponse = {
        response: 'Based on current market conditions, I recommend...',
        confidence: 0.8,
        sources: ['Market Analysis'],
        context: { conversationId: 'new-conversation-id' },
        actions: [],
      };

      mockLLMService.processQuery.mockResolvedValue(mockResponse);

      const result = await service.processConversation(message, userId);

      expect(result).toEqual(mockResponse);
      expect(mockConversationRepository.create).toHaveBeenCalled();
      expect(mockLLMService.processQuery).toHaveBeenCalledWith(
        message,
        expect.objectContaining({
          userId,
          conversationHistory: [],
        }),
      );
    });

    it('should use existing conversation if provided', async () => {
      const userId = 'test-user';
      const conversationId = 'existing-conversation';
      const message = 'Tell me more about that stock';

      const existingConversation = {
        conversationId,
        userId,
        messageCount: 5,
        lastInteraction: new Date(),
        isActive: true,
      };

      const conversationHistory = [
        {
          id: '1',
          conversationId,
          userId,
          message: 'What about AAPL?',
          response: 'AAPL is showing strong signals...',
          timestamp: new Date(),
        },
      ];

      mockConversationRepository.findOne.mockResolvedValue(
        existingConversation,
      );
      mockConversationRepository.update.mockResolvedValue({});
      mockChatMessageRepository.create.mockReturnValue({});
      mockChatMessageRepository.save.mockResolvedValue({});
      mockChatMessageRepository.find.mockResolvedValue(conversationHistory);

      const mockResponse: AssistantResponse = {
        response: 'Based on our previous discussion about AAPL...',
        confidence: 0.9,
        sources: ['Conversation Context'],
        context: { conversationId },
        actions: [],
      };

      mockLLMService.processQuery.mockResolvedValue(mockResponse);

      const result = await service.processConversation(
        message,
        userId,
        conversationId,
      );

      expect(result).toEqual(mockResponse);
      expect(mockLLMService.processQuery).toHaveBeenCalledWith(
        message,
        expect.objectContaining({
          userId,
          conversationHistory,
        }),
      );
    });

    it('should enhance response with suggested actions', async () => {
      const userId = 'test-user';
      const message = 'Should I buy TSLA?';

      mockConversationRepository.findOne.mockResolvedValue(null);
      mockConversationRepository.create.mockReturnValue({
        conversationId: 'new-id',
        userId,
        messageCount: 0,
      });
      mockConversationRepository.save.mockResolvedValue({});
      mockConversationRepository.update.mockResolvedValue({});
      mockChatMessageRepository.create.mockReturnValue({});
      mockChatMessageRepository.save.mockResolvedValue({});
      mockChatMessageRepository.find.mockResolvedValue([]);

      const mockResponse: AssistantResponse = {
        response: 'TSLA shows mixed signals...',
        confidence: 0.7,
        sources: ['Technical Analysis'],
        context: {},
        actions: [],
      };

      mockLLMService.processQuery.mockResolvedValue(mockResponse);

      const result = await service.processConversation(message, userId);

      expect(result.actions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'VIEW_STOCK',
            symbol: 'TSLA',
            description: 'View detailed analysis for TSLA',
          }),
          expect.objectContaining({
            type: 'PLACE_ORDER',
            description: 'Place a buy order',
            parameters: { action: 'BUY' },
          }),
        ]),
      );
    });

    it('should return fallback response on error', async () => {
      const userId = 'test-user';
      const message = 'What should I do?';

      mockConversationRepository.findOne.mockRejectedValue(
        new Error('Database error'),
      );

      const result = await service.processConversation(message, userId);

      expect(result.response).toContain('technical difficulties');
      expect(result.confidence).toBe(0.3);
      expect(result.context?.fallback).toBe(true);
      expect(result.actions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'VIEW_ANALYSIS',
            description: 'View dashboard',
          }),
        ]),
      );
    });
  });

  describe('getConversationHistory', () => {
    it('should retrieve conversation history for user and conversation', async () => {
      const userId = 'test-user';
      const conversationId = 'conversation-123';
      const limit = 10;

      const mockHistory = [
        {
          id: '1',
          conversationId,
          userId,
          message: 'Hello',
          response: 'Hi there!',
          timestamp: new Date(),
        },
        {
          id: '2',
          conversationId,
          userId,
          message: 'How are markets today?',
          response: 'Markets are mixed...',
          timestamp: new Date(),
        },
      ];

      mockChatMessageRepository.find.mockResolvedValue(mockHistory);

      const result = await service.getConversationHistory(
        userId,
        conversationId,
        limit,
      );

      expect(result).toEqual(mockHistory);
      expect(mockChatMessageRepository.find).toHaveBeenCalledWith({
        where: { userId, conversationId },
        order: { timestamp: 'DESC' },
        take: limit,
      });
    });
  });

  describe('getUserConversations', () => {
    it('should retrieve active conversations for user', async () => {
      const userId = 'test-user';
      const mockConversations = [
        {
          conversationId: 'conv-1',
          userId,
          messageCount: 5,
          lastInteraction: new Date(),
          isActive: true,
        },
        {
          conversationId: 'conv-2',
          userId,
          messageCount: 2,
          lastInteraction: new Date(),
          isActive: true,
        },
      ];

      mockConversationRepository.find.mockResolvedValue(mockConversations);

      const result = await service.getUserConversations(userId, 5);

      expect(result).toEqual(mockConversations);
      expect(mockConversationRepository.find).toHaveBeenCalledWith({
        where: { userId, isActive: true },
        order: { lastInteraction: 'DESC' },
        take: 5,
      });
    });
  });

  describe('createNewConversation', () => {
    it('should create and return new conversation ID', async () => {
      const userId = 'test-user';
      const newConversation = {
        conversationId: 'new-conversation-id',
        userId,
        context: {},
        messageCount: 0,
        lastInteraction: expect.any(Date),
        isActive: true,
      };

      mockConversationRepository.create.mockReturnValue(newConversation);
      mockConversationRepository.save.mockResolvedValue(newConversation);

      const result = await service.createNewConversation(userId);

      expect(result).toBe('new-conversation-id');
      expect(mockConversationRepository.create).toHaveBeenCalledWith({
        userId,
        context: {},
        messageCount: 0,
        lastInteraction: expect.any(Date),
        isActive: true,
      });
    });
  });

  describe('endConversation', () => {
    it('should mark conversation as inactive', async () => {
      const conversationId = 'conversation-to-end';

      mockConversationRepository.update.mockResolvedValue({});

      await service.endConversation(conversationId);

      expect(mockConversationRepository.update).toHaveBeenCalledWith(
        { conversationId },
        { isActive: false },
      );
    });
  });

  describe('action detection', () => {
    it('should detect stock symbols in messages', async () => {
      const message = 'What do you think about AAPL and MSFT?';
      const userId = 'test-user';

      mockConversationRepository.findOne.mockResolvedValue(null);
      mockConversationRepository.create.mockReturnValue({
        conversationId: 'new-id',
      });
      mockConversationRepository.save.mockResolvedValue({});
      mockConversationRepository.update.mockResolvedValue({});
      mockChatMessageRepository.create.mockReturnValue({});
      mockChatMessageRepository.save.mockResolvedValue({});
      mockChatMessageRepository.find.mockResolvedValue([]);

      mockLLMService.processQuery.mockResolvedValue({
        response: 'Both AAPL and MSFT are...',
        confidence: 0.8,
      });

      const result = await service.processConversation(message, userId);

      expect(result.actions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'VIEW_STOCK',
            symbol: 'AAPL',
          }),
          expect.objectContaining({
            type: 'VIEW_STOCK',
            symbol: 'MSFT',
          }),
        ]),
      );
    });

    it('should detect portfolio-related queries', async () => {
      const message = 'How is my portfolio performing?';
      const userId = 'test-user';

      mockConversationRepository.findOne.mockResolvedValue(null);
      mockConversationRepository.create.mockReturnValue({
        conversationId: 'new-id',
      });
      mockConversationRepository.save.mockResolvedValue({});
      mockConversationRepository.update.mockResolvedValue({});
      mockChatMessageRepository.create.mockReturnValue({});
      mockChatMessageRepository.save.mockResolvedValue({});
      mockChatMessageRepository.find.mockResolvedValue([]);

      mockLLMService.processQuery.mockResolvedValue({
        response: 'Your portfolio is...',
        confidence: 0.9,
      });

      const result = await service.processConversation(message, userId);

      expect(result.actions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'VIEW_ANALYSIS',
            description: 'View portfolio analytics',
            parameters: { view: 'portfolio' },
          }),
        ]),
      );
    });
  });
});
