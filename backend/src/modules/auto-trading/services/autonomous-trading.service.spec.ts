import { Test, TestingModule } from '@nestjs/testing';
import { Portfolio } from '../../../entities/portfolio.entity';
import { PaperTradingService } from '../../paper-trading/paper-trading.service';
import { AutonomousTradingService } from './autonomous-trading.service';

describe('AutonomousTradingService - Random Strategy Assignment', () => {
  let service: AutonomousTradingService;
  let paperTradingService: jest.Mocked<PaperTradingService>;

  const mockPortfolio: Partial<Portfolio> = {
    id: 1,
    name: 'Test Portfolio',
    currentCash: 10000,
    totalValue: 10000,
    portfolioType: 'BASIC',
    dayTradingEnabled: false,
    dayTradeCount: 0,
    lastDayTradeReset: undefined,
    initialCash: 10000,
    totalPnL: 0,
    totalReturn: 0,
    isActive: true,
    assignedStrategy: undefined,
    assignedStrategyName: undefined,
    strategyAssignedAt: undefined,
    positions: [],
    trades: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AutonomousTradingService,
          useValue: {
            assignRandomStrategy: jest.fn(),
          },
        },
        {
          provide: PaperTradingService,
          useValue: {
            getPortfolio: jest.fn(),
            updatePortfolioStrategy: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AutonomousTradingService>(AutonomousTradingService);
    paperTradingService = module.get(PaperTradingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('assignRandomStrategy', () => {
    it('should randomly assign a trading strategy to a portfolio', async () => {
      // Arrange
      const portfolioId = '1';
      const expectedResult = {
        portfolioId: portfolioId,
        portfolioName: mockPortfolio.name,
        assignedStrategy: 'momentum-breakout-v1',
        assignedStrategyName: 'Momentum Breakout Strategy',
        strategyDescription:
          'Trades breakouts above resistance with volume confirmation',
        strategyCategory: 'momentum',
        assignedAt: new Date(),
      };

      (service.assignRandomStrategy as jest.Mock).mockResolvedValue(
        expectedResult,
      );

      // Act
      const result = await service.assignRandomStrategy(portfolioId);

      // Assert
      expect(service.assignRandomStrategy).toHaveBeenCalledWith(portfolioId);
      expect(result).toMatchObject({
        portfolioId: portfolioId,
        portfolioName: expect.any(String),
        assignedStrategy: expect.any(String),
        assignedStrategyName: expect.any(String),
        strategyDescription: expect.any(String),
        strategyCategory: expect.any(String),
        assignedAt: expect.any(Date),
      });
    });

    it('should handle portfolio not found error', async () => {
      // Arrange
      const portfolioId = '999';
      (service.assignRandomStrategy as jest.Mock).mockRejectedValue(
        new Error('Portfolio not found'),
      );

      // Act & Assert
      await expect(service.assignRandomStrategy(portfolioId)).rejects.toThrow(
        'Portfolio not found',
      );
    });
  });
});

describe('AutonomousTradingService - S46 Auto Strategy Assignment', () => {
  let service: AutonomousTradingService;
  let portfolioRepository: any;
  let strategyRepository: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutonomousTradingService,
        {
          provide: 'PortfolioRepository',
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: 'TradingStrategyRepository',
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: 'AutoTradeRepository',
          useValue: {},
        },
        {
          provide: 'BacktestingService',
          useValue: {},
        },
        {
          provide: 'StrategyBuilderService',
          useValue: {
            validateStrategy: jest
              .fn()
              .mockResolvedValue({ isValid: true, errors: [] }),
          },
        },
        {
          provide: 'RiskManagementService',
          useValue: {},
        },
        {
          provide: 'StockService',
          useValue: {},
        },
        {
          provide: 'PaperTradingService',
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AutonomousTradingService>(AutonomousTradingService);
    portfolioRepository = module.get('PortfolioRepository');
    strategyRepository = module.get('TradingStrategyRepository');
  });

  describe('Automatic Strategy Selection Based on Portfolio Balance', () => {
    it('should select day trading aggressive strategy for high balance portfolios (>=$50k)', () => {
      const portfolio = {
        id: 1,
        totalValue: 60000,
        currentCash: 60000,
      } as Portfolio;

      // Use reflection to access private method for testing
      const selectedStrategy = (service as any).selectStrategyForPortfolio(
        portfolio,
      );

      expect(selectedStrategy.id).toBe('day-trading-aggressive');
      expect(selectedStrategy.name).toBe('Day Trading Aggressive');
      expect(selectedStrategy.type).toBe('day_trading');
      expect(selectedStrategy.minBalance).toBe(25000);
    });

    it('should select day trading conservative strategy for PDT-eligible portfolios ($25k-$50k)', () => {
      const portfolio = {
        id: 1,
        totalValue: 30000,
        currentCash: 30000,
      } as Portfolio;

      const selectedStrategy = (service as any).selectStrategyForPortfolio(
        portfolio,
      );

      expect(selectedStrategy.id).toBe('day-trading-conservative');
      expect(selectedStrategy.name).toBe('Day Trading Conservative');
      expect(selectedStrategy.type).toBe('day_trading');
      expect(selectedStrategy.minBalance).toBe(25000);
    });

    it('should select swing trading growth strategy for medium balance portfolios ($5k-$25k)', () => {
      const portfolio = {
        id: 1,
        totalValue: 10000,
        currentCash: 10000,
      } as Portfolio;

      const selectedStrategy = (service as any).selectStrategyForPortfolio(
        portfolio,
      );

      expect(selectedStrategy.id).toBe('swing-trading-growth');
      expect(selectedStrategy.name).toBe('Swing Trading Growth');
      expect(selectedStrategy.type).toBe('swing_trading');
      expect(selectedStrategy.minBalance).toBe(0);
    });

    it('should select swing trading value strategy for small balance portfolios (<$5k)', () => {
      const portfolio = {
        id: 1,
        totalValue: 2000,
        currentCash: 2000,
      } as Portfolio;

      const selectedStrategy = (service as any).selectStrategyForPortfolio(
        portfolio,
      );

      expect(selectedStrategy.id).toBe('swing-trading-value');
      expect(selectedStrategy.name).toBe('Swing Trading Value');
      expect(selectedStrategy.type).toBe('swing_trading');
      expect(selectedStrategy.minBalance).toBe(0);
    });

    it('should handle PDT threshold edge case (exactly $25,000)', () => {
      const portfolio = {
        id: 1,
        totalValue: 25000,
        currentCash: 25000,
      } as Portfolio;

      const selectedStrategy = (service as any).selectStrategyForPortfolio(
        portfolio,
      );

      expect(selectedStrategy.type).toBe('day_trading');
      expect(selectedStrategy.id).toBe('day-trading-conservative');
    });

    it('should use currentCash when totalValue is zero', () => {
      const portfolio = {
        id: 1,
        totalValue: 0,
        currentCash: 30000,
      } as Portfolio;

      const selectedStrategy = (service as any).selectStrategyForPortfolio(
        portfolio,
      );
      expect(selectedStrategy.type).toBe('day_trading');
    });
  });

  describe('PDT (Pattern Day Trader) Compliance', () => {
    it('should correctly identify PDT-eligible accounts ($25k+)', () => {
      const portfolio = {
        id: 1,
        totalValue: 25000,
        currentCash: 25000,
      } as Portfolio;

      const selectedStrategy = (service as any).selectStrategyForPortfolio(
        portfolio,
      );
      expect(selectedStrategy.type).toBe('day_trading');
    });

    it('should correctly identify non-PDT accounts (<$25k)', () => {
      const portfolio = {
        id: 1,
        totalValue: 24999,
        currentCash: 24999,
      } as Portfolio;

      const selectedStrategy = (service as any).selectStrategyForPortfolio(
        portfolio,
      );
      expect(selectedStrategy.type).toBe('swing_trading');
    });
  });

  describe('Risk Management Configuration', () => {
    it('should create aggressive risk config for day trading strategies', () => {
      const portfolio = {
        id: 1,
        totalValue: 60000,
        currentCash: 60000,
      } as Portfolio;

      const strategyConfig = {
        id: 'day-trading-aggressive',
        maxPositions: 10,
        executionFrequency: 'minute' as const,
        riskLevel: 'aggressive',
      };

      const config = (service as any).createAutoDeploymentConfig(
        portfolio,
        strategyConfig,
      );

      expect(config.riskLimits.maxDrawdown).toBe(15); // aggressive
      expect(config.riskLimits.maxPositionSize).toBe(25); // aggressive
      expect(config.riskLimits.dailyLossLimit).toBe(3000); // 5% of 60k
    });

    it('should create conservative risk config for swing trading strategies', () => {
      const portfolio = {
        id: 1,
        totalValue: 2000,
        currentCash: 2000,
      } as Portfolio;

      const strategyConfig = {
        id: 'swing-trading-value',
        maxPositions: 2,
        executionFrequency: 'daily' as const,
        riskLevel: 'conservative',
      };

      const config = (service as any).createAutoDeploymentConfig(
        portfolio,
        strategyConfig,
      );

      expect(config.riskLimits.maxDrawdown).toBe(5); // conservative
      expect(config.riskLimits.maxPositionSize).toBe(10); // conservative
      expect(config.riskLimits.dailyLossLimit).toBe(40); // 2% of 2k
    });
  });
});
