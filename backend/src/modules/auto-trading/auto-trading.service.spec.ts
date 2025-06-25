import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaperTradingService } from '../paper-trading/paper-trading.service';
import { StockService } from '../stock/stock.service';
import { StockWebSocketGateway } from '../websocket/websocket.gateway';
import { AutoTradingService } from './auto-trading.service';
import { AutoTrade } from './entities/auto-trade.entity';
import { TradingRule } from './entities/trading-rule.entity';
import { TradingSession } from './entities/trading-session.entity';
import { PositionSizingService } from './services/position-sizing.service';
import { RiskManagementService } from './services/risk-management.service';
import { RuleEngineService } from './services/rule-engine.service';
import { TradeExecutionService } from './services/trade-execution.service';

describe('AutoTradingService', () => {
  let service: AutoTradingService;
  let tradingRuleRepository: Repository<TradingRule>;
  let autoTradeRepository: Repository<AutoTrade>;
  let tradingSessionRepository: Repository<TradingSession>;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockRuleEngineService = {
    validateRule: jest.fn(),
    getActiveRules: jest.fn(),
    evaluateRule: jest.fn(),
    executeActions: jest.fn(),
    conflictResolution: jest.fn(),
  };

  const mockTradeExecutionService = {
    executeTrade: jest.fn(),
    getPortfolioTrades: jest.fn(),
    getTradeDetails: jest.fn(),
    cancelTrade: jest.fn(),
  };

  const mockStockService = {
    getAllStocks: jest.fn(),
    getStockBySymbol: jest.fn(),
  };

  const mockPaperTradingService = {
    getPortfolio: jest.fn(),
  };

  const mockWebSocketGateway = {
    server: { emit: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutoTradingService,
        {
          provide: getRepositoryToken(TradingRule),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(AutoTrade),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(TradingSession),
          useValue: mockRepository,
        },
        {
          provide: RuleEngineService,
          useValue: mockRuleEngineService,
        },
        {
          provide: TradeExecutionService,
          useValue: mockTradeExecutionService,
        },
        {
          provide: RiskManagementService,
          useValue: { checkEmergencyStop: jest.fn().mockResolvedValue(false) },
        },
        {
          provide: PositionSizingService,
          useValue: { calculatePositionSize: jest.fn() },
        },
        {
          provide: StockService,
          useValue: mockStockService,
        },
        {
          provide: PaperTradingService,
          useValue: mockPaperTradingService,
        },
        {
          provide: StockWebSocketGateway,
          useValue: mockWebSocketGateway,
        },
      ],
    }).compile();

    service = module.get<AutoTradingService>(AutoTradingService);
    tradingRuleRepository = module.get<Repository<TradingRule>>(
      getRepositoryToken(TradingRule),
    );
    autoTradeRepository = module.get<Repository<AutoTrade>>(
      getRepositoryToken(AutoTrade),
    );
    tradingSessionRepository = module.get<Repository<TradingSession>>(
      getRepositoryToken(TradingSession),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTradingRule', () => {
    it('should create a trading rule successfully', async () => {
      const createRuleDto = {
        portfolio_id: 'test-portfolio',
        name: 'Test Rule',
        rule_type: 'entry' as any,
        conditions: [
          {
            field: 'current_price',
            operator: 'greater_than' as any,
            value: 100,
          },
        ],
        actions: [
          {
            type: 'buy' as any,
            sizing_method: 'percentage' as any,
            size_value: 5,
          },
        ],
      };

      const mockRule = { id: 'rule-1', ...createRuleDto };

      mockRuleEngineService.validateRule.mockResolvedValue({
        isValid: true,
        errors: [],
        warnings: [],
      });
      mockRepository.create.mockReturnValue(mockRule);
      mockRepository.save.mockResolvedValue(mockRule);

      const result = await service.createTradingRule(createRuleDto);

      expect(result).toEqual(mockRule);
      expect(mockRuleEngineService.validateRule).toHaveBeenCalledWith(
        createRuleDto,
      );
      expect(mockRepository.create).toHaveBeenCalledWith(createRuleDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockRule);
    });

    it('should throw error if rule validation fails', async () => {
      const createRuleDto = {
        portfolio_id: 'test-portfolio',
        name: 'Invalid Rule',
        rule_type: 'entry' as any,
        conditions: [],
        actions: [],
      };

      mockRuleEngineService.validateRule.mockResolvedValue({
        isValid: false,
        errors: ['Rule must have at least one condition'],
        warnings: [],
      });

      await expect(service.createTradingRule(createRuleDto)).rejects.toThrow(
        'Rule validation failed: Rule must have at least one condition',
      );
    });
  });

  describe('getTradingRules', () => {
    it('should return trading rules for a portfolio', async () => {
      const portfolioId = 'test-portfolio';
      const mockRules = [
        { id: 'rule-1', name: 'Rule 1', portfolio_id: portfolioId },
        { id: 'rule-2', name: 'Rule 2', portfolio_id: portfolioId },
      ];

      mockRepository.find.mockResolvedValue(mockRules);

      const result = await service.getTradingRules(portfolioId);

      expect(result).toEqual(mockRules);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { portfolio_id: portfolioId },
        order: { priority: 'DESC', created_at: 'ASC' },
      });
    });
  });

  describe('startTradingSession', () => {
    it('should start a trading session successfully', async () => {
      const portfolioId = 'test-portfolio';
      const sessionDto = {
        portfolio_id: portfolioId,
        session_name: 'Test Session',
        config: {
          max_daily_trades: 10,
          max_position_size: 1000,
        },
      };

      const mockSession = {
        id: 'session-1',
        ...sessionDto,
        start_time: new Date(),
        is_active: true,
      };

      mockRepository.findOne.mockResolvedValue(null); // No existing session
      mockRepository.create.mockReturnValue(mockSession);
      mockRepository.save.mockResolvedValue(mockSession);

      const result = await service.startTradingSession(portfolioId, sessionDto);

      expect(result).toEqual(mockSession);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { portfolio_id: portfolioId, is_active: true },
      });
    });

    it('should throw error if active session already exists', async () => {
      const portfolioId = 'test-portfolio';
      const sessionDto = {
        portfolio_id: portfolioId,
        session_name: 'Test Session',
        config: {},
      };

      const existingSession = { id: 'existing-session', is_active: true };
      mockRepository.findOne.mockResolvedValue(existingSession);

      await expect(
        service.startTradingSession(portfolioId, sessionDto),
      ).rejects.toThrow('Portfolio already has an active trading session');
    });
  });
});
