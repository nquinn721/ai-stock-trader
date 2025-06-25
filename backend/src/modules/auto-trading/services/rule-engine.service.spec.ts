import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RuleType, TradingRule } from '../entities/trading-rule.entity';
import { RuleEngineService, TradingContext } from './rule-engine.service';

describe('RuleEngineService', () => {
  let service: RuleEngineService;
  let repository: Repository<TradingRule>;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RuleEngineService,
        {
          provide: getRepositoryToken(TradingRule),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<RuleEngineService>(RuleEngineService);
    repository = module.get<Repository<TradingRule>>(
      getRepositoryToken(TradingRule),
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('evaluateRule', () => {
    it('should return false for inactive rule', async () => {
      const rule = {
        id: 'rule-1',
        portfolio_id: 'portfolio-1',
        name: 'Test Rule',
        is_active: false,
        rule_type: RuleType.ENTRY,
        conditions: [],
        actions: [],
        priority: 0,
        description: '',
        created_at: new Date(),
        updated_at: new Date(),
      } as TradingRule;

      const context: TradingContext = {
        symbol: 'AAPL',
        currentPrice: 150,
        portfolioValue: 100000,
        cashBalance: 50000,
        positions: [],
        marketData: {},
      };

      const result = await service.evaluateRule(rule, context);
      expect(result).toBe(false);
    });

    it('should evaluate active rule with conditions', async () => {
      const rule = {
        id: 'rule-1',
        portfolio_id: 'portfolio-1',
        name: 'Price Above 100',
        is_active: true,
        rule_type: RuleType.ENTRY,
        conditions: [
          {
            field: 'current_price',
            operator: 'greater_than' as const,
            value: 100,
          },
        ],
        actions: [],
        priority: 0,
        description: '',
        created_at: new Date(),
        updated_at: new Date(),
      } as TradingRule;

      const context: TradingContext = {
        symbol: 'AAPL',
        currentPrice: 150,
        portfolioValue: 100000,
        cashBalance: 50000,
        positions: [],
        marketData: {},
      };

      const result = await service.evaluateRule(rule, context);
      expect(result).toBe(true);
    });

    it('should return false when condition is not met', async () => {
      const rule = {
        id: 'rule-1',
        portfolio_id: 'portfolio-1',
        name: 'Price Above 200',
        is_active: true,
        rule_type: RuleType.ENTRY,
        conditions: [
          {
            field: 'current_price',
            operator: 'greater_than' as const,
            value: 200,
          },
        ],
        actions: [],
        priority: 0,
        description: '',
        created_at: new Date(),
        updated_at: new Date(),
      } as TradingRule;

      const context: TradingContext = {
        symbol: 'AAPL',
        currentPrice: 150,
        portfolioValue: 100000,
        cashBalance: 50000,
        positions: [],
        marketData: {},
      };

      const result = await service.evaluateRule(rule, context);
      expect(result).toBe(false);
    });
  });

  describe('validateRule', () => {
    it('should validate a complete rule successfully', async () => {
      const rule = {
        name: 'Test Rule',
        rule_type: RuleType.ENTRY,
        conditions: [
          {
            field: 'current_price',
            operator: 'greater_than' as const,
            value: 100,
          },
        ],
        actions: [
          {
            type: 'buy' as const,
            sizing_method: 'percentage' as const,
            size_value: 5,
          },
        ],
      };

      const result = await service.validateRule(rule);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return validation errors for incomplete rule', async () => {
      const rule = {
        name: 'Invalid Rule',
        rule_type: RuleType.ENTRY,
        conditions: [],
        actions: [],
      };

      const result = await service.validateRule(rule);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Rule must have at least one condition');
      expect(result.errors).toContain('Rule must have at least one action');
    });

    it('should validate condition fields', async () => {
      const rule = {
        name: 'Test Rule',
        rule_type: RuleType.ENTRY,
        conditions: [
          {
            field: '',
            operator: '' as any,
            value: null,
          },
        ],
        actions: [
          {
            type: 'buy' as const,
            sizing_method: 'percentage' as const,
            size_value: 5,
          },
        ],
      };

      const result = await service.validateRule(rule);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Condition 1: Field is required');
      expect(result.errors).toContain('Condition 1: Operator is required');
      expect(result.errors).toContain('Condition 1: Value is required');
    });
  });

  describe('getActiveRules', () => {
    it('should return active rules for a portfolio', async () => {
      const portfolioId = 'portfolio-1';
      const mockRules = [
        { id: 'rule-1', is_active: true, portfolio_id: portfolioId },
        { id: 'rule-2', is_active: true, portfolio_id: portfolioId },
      ];

      mockRepository.find.mockResolvedValue(mockRules);

      const result = await service.getActiveRules(portfolioId);

      expect(result).toEqual(mockRules);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          portfolio_id: portfolioId,
          is_active: true,
        },
        order: {
          priority: 'DESC',
          created_at: 'ASC',
        },
      });
    });
  });

  describe('prioritizeRules', () => {
    it('should sort rules by priority and type', async () => {
      const rules = [
        { priority: 1, rule_type: RuleType.ENTRY } as TradingRule,
        { priority: 2, rule_type: RuleType.EXIT } as TradingRule,
        { priority: 1, rule_type: RuleType.EXIT } as TradingRule,
      ];

      const result = await service.prioritizeRules(rules);

      expect(result[0].priority).toBe(2);
      expect(result[1].rule_type).toBe(RuleType.EXIT);
      expect(result[2].rule_type).toBe(RuleType.ENTRY);
    });
  });
});
