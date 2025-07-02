import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutoTradingOrder, AutoTradingOrderAction, AutoTradingOrderType, RiskLevel } from '../src/entities/auto-trading-order.entity';
import { Portfolio } from '../src/entities/portfolio.entity';
import { Stock } from '../src/entities/stock.entity';
import { CreateAutoTradingOrderDto } from '../src/modules/auto-trading/dto/auto-trading-order.dto';
import { AutoTradingOrderPreviewService } from '../src/modules/auto-trading/services/auto-trading-order-preview.service';

describe('AutoTradingOrderPreviewService', () => {
  let service: AutoTradingOrderPreviewService;
  let repository: Repository<AutoTradingOrder>;
  let portfolioRepository: Repository<Portfolio>;
  let stockRepository: Repository<Stock>;

  const mockRepository = {
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      delete: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    })),
  };

  const mockPortfolioRepository = {
    findOne: jest.fn(),
  };

  const mockStockRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutoTradingOrderPreviewService,
        {
          provide: getRepositoryToken(AutoTradingOrder),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Portfolio),
          useValue: mockPortfolioRepository,
        },
        {
          provide: getRepositoryToken(Stock),
          useValue: mockStockRepository,
        },
      ],
    }).compile();

    service = module.get<AutoTradingOrderPreviewService>(AutoTradingOrderPreviewService);
    repository = module.get<Repository<AutoTradingOrder>>(getRepositoryToken(AutoTradingOrder));
    portfolioRepository = module.get<Repository<Portfolio>>(getRepositoryToken(Portfolio));
    stockRepository = module.get<Repository<Stock>>(getRepositoryToken(Stock));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAutoTradingOrder', () => {
    it('should create a new auto trading order', async () => {
      const createOrderDto: CreateAutoTradingOrderDto = {
        portfolioId: 1,
        symbol: 'AAPL',
        action: AutoTradingOrderAction.BUY,
        orderType: AutoTradingOrderType.LIMIT,
        quantity: 100,
        limitPrice: 150.0,
        stopLossPrice: 140.0,
        takeProfitPrice: 160.0,
        confidence: 0.85,
        reasoning: ['Strong earnings report', 'Positive market sentiment'],
        riskLevel: RiskLevel.MEDIUM,
        notes: 'High confidence buy signal',
      };

      const savedOrder = {
        id: 'order-1',
        ...createOrderDto,
        status: 'PENDING',
        expiryTime: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.save.mockResolvedValue(savedOrder);

      const result = await service.createAutoTradingOrder(createOrderDto);

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(savedOrder);
    });
  });

  describe('getPendingOrdersForPortfolio', () => {
    it('should return pending orders for a portfolio', async () => {
      const portfolioId = 1;
      const pendingOrders = [
        {
          id: 'order-1',
          portfolioId,
          symbol: 'AAPL',
          status: 'PENDING',
        },
      ];

      mockRepository.find.mockResolvedValue(pendingOrders);

      const result = await service.getPendingOrdersForPortfolio(portfolioId);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { portfolioId, status: expect.any(Object) },
        relations: ['stock', 'portfolio'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(pendingOrders);
    });
  });

  describe('approveOrder', () => {
    it('should approve an order by updating its status', async () => {
      const orderId = 'order-1';
      const existingOrder = {
        id: orderId,
        status: 'PENDING',
      };

      mockRepository.findOne.mockResolvedValue(existingOrder);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.approveOrder(orderId);

      expect(mockRepository.update).toHaveBeenCalledWith(orderId, {
        status: 'APPROVED',
        updatedAt: expect.any(Date),
      });
      expect(result).toBe(true);
    });

    it('should return false if order not found', async () => {
      const orderId = 'non-existent';
      
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.approveOrder(orderId);

      expect(result).toBe(false);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('rejectOrder', () => {
    it('should reject an order with reason', async () => {
      const orderId = 'order-1';
      const reason = 'Risk too high';
      const existingOrder = {
        id: orderId,
        status: 'PENDING',
      };

      mockRepository.findOne.mockResolvedValue(existingOrder);
      mockRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.rejectOrder(orderId, reason);

      expect(mockRepository.update).toHaveBeenCalledWith(orderId, {
        status: 'REJECTED',
        notes: reason,
        updatedAt: expect.any(Date),
      });
      expect(result).toBe(true);
    });
  });

  describe('bulkApproveOrders', () => {
    it('should approve multiple orders', async () => {
      const orderIds = ['order-1', 'order-2'];
      mockRepository.update.mockResolvedValue({ affected: 2 });

      const result = await service.bulkApproveOrders(orderIds);

      expect(mockRepository.update).toHaveBeenCalledWith(
        orderIds,
        {
          status: 'APPROVED',
          updatedAt: expect.any(Date),
        }
      );
      expect(result).toBe(2);
    });
  });

  describe('bulkRejectOrders', () => {
    it('should reject multiple orders', async () => {
      const orderIds = ['order-1', 'order-2'];
      const reason = 'Market conditions changed';
      mockRepository.update.mockResolvedValue({ affected: 2 });

      const result = await service.bulkRejectOrders(orderIds, reason);

      expect(mockRepository.update).toHaveBeenCalledWith(
        orderIds,
        {
          status: 'REJECTED',
          notes: reason,
          updatedAt: expect.any(Date),
        }
      );
      expect(result).toBe(2);
    });
  });

  describe('cleanupExpiredOrders', () => {
    it('should mark expired orders as EXPIRED', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([
          { id: 'order-1', symbol: 'AAPL' },
          { id: 'order-2', symbol: 'GOOGL' },
        ]),
        delete: jest.fn().mockReturnThis(),
        execute: jest.fn(),
      };

      mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      mockRepository.update.mockResolvedValue({ affected: 2 });

      const result = await service.cleanupExpiredOrders();

      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      expect(mockRepository.update).toHaveBeenCalled();
      expect(result).toBe(2);
    });
  });
});
