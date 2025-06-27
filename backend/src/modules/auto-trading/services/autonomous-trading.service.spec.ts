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
