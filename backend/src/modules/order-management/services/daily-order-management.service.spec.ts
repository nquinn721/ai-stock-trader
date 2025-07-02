/**
 * =============================================================================
 * DAILY ORDER MANAGEMENT SERVICE - UNIT TESTS
 * =============================================================================
 *
 * Comprehensive test suite for the Daily Order Management Service covering:
 * - Market open/close processing
 * - End-of-day (EOD) processing workflows
 * - Order expiration and rollover logic
 * - Daily performance reconciliation
 * - Error handling and edge cases
 * - Scheduled job execution
 * =============================================================================
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Order,
  OrderSide,
  OrderStatus,
  OrderType,
  TimeInForce,
} from '../../../entities/order.entity';
import { Portfolio } from '../../../entities/portfolio.entity';
import { Position } from '../../../entities/position.entity';
import { Trade, TradeStatus, TradeType } from '../../../entities/trade.entity';
import { MarketHoursService } from '../../../utils/market-hours.service';
import { PaperTradingService } from '../../paper-trading/paper-trading.service';
import { StockWebSocketGateway } from '../../websocket/websocket.gateway';
import { DailyOrderManagementService } from './daily-order-management.service';

describe('DailyOrderManagementService', () => {
  let service: DailyOrderManagementService;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let portfolioRepository: jest.Mocked<Repository<Portfolio>>;
  let positionRepository: jest.Mocked<Repository<Position>>;
  let tradeRepository: jest.Mocked<Repository<Trade>>;
  let marketHoursService: jest.Mocked<MarketHoursService>;
  let paperTradingService: jest.Mocked<PaperTradingService>;
  let websocketGateway: jest.Mocked<StockWebSocketGateway>;

  const mockOrder: Order = {
    id: 1,
    portfolioId: 1,
    symbol: 'AAPL',
    orderType: OrderType.MARKET,
    side: OrderSide.BUY,
    quantity: 100,
    status: OrderStatus.PENDING,
    timeInForce: TimeInForce.DAY,
    createdAt: new Date(),
    updatedAt: new Date(),
    portfolio: null,
    stock: null,
    limitPrice: null,
    stopPrice: null,
    triggerPrice: null,
    executedPrice: null,
    executedQuantity: null,
    commission: null,
    notes: null,
    expiryDate: null,
    executedAt: null,
    cancelledAt: null,
    cancellationReason: null,
    parentOrderId: null,
    parentOrder: null,
    trailAmount: null,
    trailPercent: null,
    highWaterMark: null,
    ocoGroupId: null,
    conditionalTriggers: null,
    profitTargetPrice: null,
    stopLossPrice: null,
    routingDestination: null,
    avgExecutionPrice: null,
    fillCount: 0,
    executionReports: null,
    positionId: null,
    position: null,
    expirationDate: null,
    get totalValue() {
      return 0;
    },
    get isActive() {
      return this.status === OrderStatus.PENDING;
    },
    get isPending() {
      return this.status === OrderStatus.PENDING;
    },
    get isExecuted() {
      return this.status === OrderStatus.EXECUTED;
    },
    get isCancelled() {
      return this.status === OrderStatus.CANCELLED;
    },
    get type() {
      return this.orderType;
    },
    set type(value) {
      this.orderType = value;
    },
  };

  const mockPortfolio: Partial<Portfolio> = {
    id: 1,
    name: 'Test Portfolio',
    currentCash: 10000,
    totalValue: 10000,
    totalPnL: 0,
    totalReturn: 0,
    isActive: true,
  };

  const mockTrade: Trade = {
    id: 1,
    portfolioId: 1,
    stockId: 1,
    symbol: 'AAPL',
    type: TradeType.BUY,
    quantity: 100,
    price: 150.0,
    totalValue: 15000,
    commission: 1.0,
    status: TradeStatus.EXECUTED,
    notes: null,
    portfolio: mockPortfolio as any,
    stock: null,
    executedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyOrderManagementService,
        {
          provide: getRepositoryToken(Order),
          useValue: {
            find: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Portfolio),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Position),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Trade),
          useValue: {
            find: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: MarketHoursService,
          useValue: {
            getMarketStatus: jest.fn(),
            isMarketOpen: jest.fn(),
          },
        },
        {
          provide: PaperTradingService,
          useValue: {
            updatePortfolioRealTimePerformance: jest.fn(),
          },
        },
        {
          provide: StockWebSocketGateway,
          useValue: {
            broadcastTradingSignal: jest.fn(),
            broadcastNewsUpdate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DailyOrderManagementService>(
      DailyOrderManagementService,
    );
    orderRepository = module.get(getRepositoryToken(Order));
    portfolioRepository = module.get(getRepositoryToken(Portfolio));
    positionRepository = module.get(getRepositoryToken(Position));
    tradeRepository = module.get(getRepositoryToken(Trade));
    marketHoursService = module.get(MarketHoursService);
    paperTradingService = module.get(PaperTradingService);
    websocketGateway = module.get(StockWebSocketGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Market Open Processing', () => {
    it('should process pending orders at market open', async () => {
      const pendingOrders = [
        { ...mockOrder, id: 1, status: OrderStatus.PENDING },
        { ...mockOrder, id: 2, status: OrderStatus.PENDING },
      ];

      marketHoursService.getMarketStatus.mockReturnValue({
        isOpen: true,
        status: 'open',
        nextOpen: new Date(),
        nextClose: new Date(),
      });

      orderRepository.find.mockResolvedValue(pendingOrders as any);

      await service.processMarketOpen();

      expect(orderRepository.find).toHaveBeenCalledWith({
        where: {
          status: OrderStatus.PENDING,
          timeInForce: expect.any(Object),
        },
        relations: ['portfolio', 'stock'],
      });

      expect(websocketGateway.broadcastTradingSignal).toHaveBeenCalledWith({
        type: 'market_open',
        timestamp: expect.any(Date),
        message: expect.stringContaining('orders activated'),
      });
    });

    it('should skip processing on non-trading days', async () => {
      jest.spyOn(service as any, 'isValidTradingDay').mockReturnValue(false);

      await service.processMarketOpen();

      expect(orderRepository.find).not.toHaveBeenCalled();
      expect(websocketGateway.broadcastTradingSignal).not.toHaveBeenCalled();
    });
  });

  describe('Market Close Processing', () => {
    it('should cancel DAY orders at market close', async () => {
      const dayOrders = [
        {
          ...mockOrder,
          id: 1,
          timeInForce: TimeInForce.DAY,
          status: OrderStatus.PENDING,
        },
        {
          ...mockOrder,
          id: 2,
          timeInForce: TimeInForce.DAY,
          status: OrderStatus.TRIGGERED,
        },
      ];

      jest.spyOn(service as any, 'isValidTradingDay').mockReturnValue(true);
      orderRepository.find.mockResolvedValue(dayOrders as any);
      orderRepository.save.mockResolvedValue({} as Order);

      await service.processMarketClose();

      expect(orderRepository.find).toHaveBeenCalledWith({
        where: {
          status: expect.any(Object),
          timeInForce: TimeInForce.DAY,
        },
        relations: ['portfolio'],
      });

      expect(orderRepository.save).toHaveBeenCalledTimes(2);
      expect(websocketGateway.broadcastTradingSignal).toHaveBeenCalledWith({
        type: 'market_close',
        timestamp: expect.any(Date),
        message: expect.stringContaining('DAY orders cancelled'),
      });
    });

    it('should not cancel GTC orders at market close', async () => {
      const gtcOrders = [
        {
          ...mockOrder,
          id: 1,
          timeInForce: TimeInForce.GTC,
          status: OrderStatus.PENDING,
        },
      ];

      jest.spyOn(service as any, 'isValidTradingDay').mockReturnValue(true);
      orderRepository.find.mockResolvedValue([]);

      await service.processMarketClose();

      expect(orderRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('End-of-Day Processing', () => {
    it('should complete full EOD processing workflow', async () => {
      jest.spyOn(service as any, 'isValidTradingDay').mockReturnValue(true);
      jest.spyOn(service as any, 'processExpiredOrders').mockResolvedValue(5);
      jest.spyOn(service as any, 'rolloverGTCOrders').mockResolvedValue(10);
      jest.spyOn(service as any, 'reconcilePortfolios').mockResolvedValue(3);
      jest
        .spyOn(service as any, 'generateDailyOrderSummaries')
        .mockResolvedValue([]);
      jest
        .spyOn(service as any, 'cleanupOldOrders')
        .mockResolvedValue(undefined);

      const result = await service.processEndOfDay();

      expect(result).toMatchObject({
        processedDate: expect.any(String),
        expiredOrdersHandled: 5,
        gtcOrdersRolledOver: 10,
        portfoliosReconciled: 3,
        performanceSummaries: [],
        processingTimeMs: expect.any(Number),
        errors: [],
      });

      expect(websocketGateway.broadcastTradingSignal).toHaveBeenCalledWith({
        type: 'eod_processing_complete',
        timestamp: expect.any(Date),
        data: result,
      });
    });

    it('should handle EOD processing errors gracefully', async () => {
      jest.spyOn(service as any, 'isValidTradingDay').mockReturnValue(true);
      jest
        .spyOn(service as any, 'processExpiredOrders')
        .mockRejectedValue(new Error('Test error'));

      const result = await service.processEndOfDay();

      expect(result.errors).toContain('Test error');
      expect(result.totalOrdersProcessed).toBe(0);
    });

    it('should skip EOD processing on non-trading days', async () => {
      jest.spyOn(service as any, 'isValidTradingDay').mockReturnValue(false);

      const result = await service.processEndOfDay();

      expect(result.totalOrdersProcessed).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Order Expiration Processing', () => {
    it('should expire orders past their expiry date', async () => {
      const expiredOrder = {
        ...mockOrder,
        id: 1,
        status: OrderStatus.PENDING,
        expiryDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      };

      orderRepository.find.mockResolvedValue([expiredOrder] as any);
      orderRepository.save.mockResolvedValue({} as Order);

      const result = await (service as any).processExpiredOrders();

      expect(result).toBe(1);
      expect(orderRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.EXPIRED,
          cancellationReason: 'Order expired',
        }),
      );
    });

    it('should not expire orders without expiry date', async () => {
      const orderWithoutExpiry = {
        ...mockOrder,
        id: 1,
        status: OrderStatus.PENDING,
        expiryDate: null,
      };

      orderRepository.find.mockResolvedValue([]);

      const result = await (service as any).processExpiredOrders();

      expect(result).toBe(0);
      expect(orderRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('Portfolio Reconciliation', () => {
    it('should reconcile all portfolios', async () => {
      const portfolios = [mockPortfolio, { ...mockPortfolio, id: 2 }];

      portfolioRepository.find.mockResolvedValue(portfolios as any);
      paperTradingService.updatePortfolioRealTimePerformance.mockResolvedValue(
        undefined,
      );

      const result = await (service as any).reconcilePortfolios();

      expect(result).toBe(2);
      expect(
        paperTradingService.updatePortfolioRealTimePerformance,
      ).toHaveBeenCalledTimes(2);
    });

    it('should handle portfolio reconciliation errors', async () => {
      const portfolios = [mockPortfolio];

      portfolioRepository.find.mockResolvedValue(portfolios as any);
      paperTradingService.updatePortfolioRealTimePerformance.mockRejectedValue(
        new Error('Reconciliation error'),
      );

      const result = await (service as any).reconcilePortfolios();

      expect(result).toBe(1); // Still counts as processed even with error
    });
  });

  describe('Daily Order Summaries', () => {
    it('should generate daily order summary for portfolio', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-02');
      const orders = [
        { ...mockOrder, id: 1, status: OrderStatus.EXECUTED },
        { ...mockOrder, id: 2, status: OrderStatus.CANCELLED },
      ];
      const trades = [mockTrade];

      orderRepository.find.mockResolvedValue(orders as any);
      tradeRepository.find.mockResolvedValue(trades as any);

      const summary = await (service as any).generatePortfolioDailySummary(
        1,
        startDate,
        endDate,
      );

      expect(summary).toMatchObject({
        date: '2023-01-01',
        portfolioId: 1,
        totalOrders: 2,
        executedOrders: 1,
        cancelledOrders: 1,
        expiredOrders: 0,
        totalVolume: 100,
        totalValue: 15000,
        commissions: 1,
        pnl: 0,
        successRate: 50,
      });
    });

    it('should handle empty portfolio data', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-02');

      orderRepository.find.mockResolvedValue([]);
      tradeRepository.find.mockResolvedValue([]);

      const summary = await (service as any).generatePortfolioDailySummary(
        1,
        startDate,
        endDate,
      );

      expect(summary).toMatchObject({
        totalOrders: 0,
        executedOrders: 0,
        successRate: 0,
        totalVolume: 0,
        totalValue: 0,
      });
    });
  });

  describe('Public API Methods', () => {
    it('should get today order summary', async () => {
      jest
        .spyOn(service as any, 'generatePortfolioDailySummary')
        .mockResolvedValue({
          date: '2023-01-01',
          portfolioId: 1,
          totalOrders: 5,
          executedOrders: 4,
          cancelledOrders: 1,
          expiredOrders: 0,
          totalVolume: 500,
          totalValue: 75000,
          commissions: 5,
          pnl: 1000,
          successRate: 80,
        });

      const summary = await service.getTodayOrderSummary(1);

      expect(summary.portfolioId).toBe(1);
      expect(summary.totalOrders).toBe(5);
      expect(summary.successRate).toBe(80);
    });

    it('should get order summaries for date range', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-02');

      jest
        .spyOn(service as any, 'generatePortfolioDailySummary')
        .mockResolvedValue({
          date: '2023-01-01',
          portfolioId: 1,
          totalOrders: 3,
          executedOrders: 2,
          cancelledOrders: 1,
          expiredOrders: 0,
          totalVolume: 200,
          totalValue: 30000,
          commissions: 2,
          pnl: 500,
          successRate: 66.67,
        });

      const summaries = await service.getOrderSummaries(1, startDate, endDate);

      expect(summaries).toHaveLength(2); // 2 days
      expect(summaries[0].portfolioId).toBe(1);
    });

    it('should force EOD processing', async () => {
      jest.spyOn(service, 'processEndOfDay').mockResolvedValue({
        processedDate: '2023-01-01',
        totalOrdersProcessed: 10,
        dayOrdersCancelled: 5,
        gtcOrdersRolledOver: 5,
        expiredOrdersHandled: 2,
        portfoliosReconciled: 3,
        performanceSummaries: [],
        processingTimeMs: 1000,
        errors: [],
      });

      const result = await service.forceEODProcessing();

      expect(result.totalOrdersProcessed).toBe(10);
      expect(service.processEndOfDay).toHaveBeenCalled();
    });
  });

  describe('Hourly Maintenance', () => {
    it('should perform hourly maintenance during trading hours', async () => {
      jest.spyOn(service as any, 'isValidTradingDay').mockReturnValue(true);
      jest
        .spyOn(service as any, 'checkOrderExpirations')
        .mockResolvedValue(undefined);
      jest
        .spyOn(service as any, 'updateOrderStatuses')
        .mockResolvedValue(undefined);
      jest
        .spyOn(service as any, 'validateOrderIntegrity')
        .mockResolvedValue(undefined);

      await service.hourlyOrderMaintenance();

      expect((service as any).checkOrderExpirations).toHaveBeenCalled();
      expect((service as any).updateOrderStatuses).toHaveBeenCalled();
      expect((service as any).validateOrderIntegrity).toHaveBeenCalled();
    });

    it('should skip maintenance on non-trading days', async () => {
      jest.spyOn(service as any, 'isValidTradingDay').mockReturnValue(false);
      jest
        .spyOn(service as any, 'checkOrderExpirations')
        .mockResolvedValue(undefined);

      await service.hourlyOrderMaintenance();

      expect((service as any).checkOrderExpirations).not.toHaveBeenCalled();
    });
  });
});
