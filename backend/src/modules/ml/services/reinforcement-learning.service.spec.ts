import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// Mock TensorFlow.js before importing the service
jest.mock('@tensorflow/tfjs', () => ({
  sequential: jest.fn(() => ({
    add: jest.fn(),
    compile: jest.fn(),
    predict: jest.fn(() => ({
      argMax: jest.fn(() => ({ dataSync: jest.fn(() => [0]) })),
      data: jest.fn(() => Promise.resolve([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7])),
      dispose: jest.fn(),
    })),
    fit: jest.fn(() => Promise.resolve({ history: { loss: [0.05] } })),
    getWeights: jest.fn(() => []),
    setWeights: jest.fn(),
  })),
  layers: {
    dense: jest.fn(),
    dropout: jest.fn(),
  },
  train: {
    adam: jest.fn(),
  },
  tensor2d: jest.fn(() => ({
    dispose: jest.fn(),
    argMax: jest.fn(() => ({ dataSync: jest.fn(() => [0]) })),
    data: jest.fn(() => Promise.resolve([0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7])),
  })),
  tidy: jest.fn((fn) => fn()),
  grad: jest.fn(() => () => ({
    data: jest.fn(() => Promise.resolve(new Array(52).fill(0.1))),
  })),
}));

import { PaperTradingService } from '../../paper-trading/paper-trading.service';
import { StockService } from '../../stock/stock.service';
import { MLModel, MLPrediction } from '../entities/ml.entities';
import { ReinforcementLearningService } from '../services/reinforcement-learning.service';

describe('ReinforcementLearningService', () => {
  let service: ReinforcementLearningService;
  let mlModelRepository: Repository<MLModel>;
  let mlPredictionRepository: Repository<MLPrediction>;
  let paperTradingService: PaperTradingService;
  let stockService: StockService;

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockPaperTradingService = {
    createPortfolio: jest.fn(),
    getPortfolio: jest.fn(),
    executeOrder: jest.fn(),
  };

  const mockStockService = {
    getStock: jest.fn(),
    getStocks: jest.fn(),
    getHistoricalData: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReinforcementLearningService,
        {
          provide: getRepositoryToken(MLModel),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(MLPrediction),
          useValue: mockRepository,
        },
        {
          provide: PaperTradingService,
          useValue: mockPaperTradingService,
        },
        {
          provide: StockService,
          useValue: mockStockService,
        },
      ],
    }).compile();

    service = module.get<ReinforcementLearningService>(
      ReinforcementLearningService,
    );
    mlModelRepository = module.get<Repository<MLModel>>(
      getRepositoryToken(MLModel),
    );
    mlPredictionRepository = module.get<Repository<MLPrediction>>(
      getRepositoryToken(MLPrediction),
    );
    paperTradingService = module.get<PaperTradingService>(PaperTradingService);
    stockService = module.get<StockService>(StockService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have required dependencies', () => {
    expect(mlModelRepository).toBeDefined();
    expect(mlPredictionRepository).toBeDefined();
    expect(paperTradingService).toBeDefined();
    expect(stockService).toBeDefined();
  });

  describe('trainAgent', () => {
    it('should initiate agent training', async () => {
      const symbol = 'AAPL';
      const historicalData = [
        { close: 150, volume: 1000000, timestamp: new Date() },
        { close: 152, volume: 1100000, timestamp: new Date() },
        { close: 151, volume: 950000, timestamp: new Date() },
      ];

      const config = {
        learningRate: 0.001,
        memorySize: 10000,
        batchSize: 32,
      };

      // Mock the training process
      jest.spyOn(service as any, 'runTrainingLoop').mockResolvedValue({
        agentId: 'test-agent-1',
        totalReturns: 5.5,
        sharpeRatio: 1.2,
        maxDrawdown: 0.08,
        winRate: 0.62,
        averageReward: 0.12,
        tradesExecuted: 45,
        learningProgress: {
          episode: 1000,
          epsilon: 0.1,
          loss: 0.05,
          avgReward: 0.12,
        },
      });

      const result = await service.trainAgent(symbol, historicalData, config);

      expect(result).toBeDefined();
      expect(result.agentId).toContain('dqn_AAPL_');
      expect(result.performance).toBeDefined();
    });
  });

  describe('getActiveAgents', () => {
    it('should return list of active agents', async () => {
      const agents = await service.getActiveAgents();
      expect(Array.isArray(agents)).toBe(true);
    });
  });

  describe('deployAgent', () => {
    it('should deploy agent to portfolio', async () => {
      const agentId = 'test-agent-1';
      const portfolioId = 'portfolio-1';
      const riskLimits = {
        maxPositionSize: 0.3,
        maxDrawdown: 0.15,
      };

      // First train an agent
      const historicalData = [
        { close: 150, volume: 1000000, timestamp: new Date() },
        { close: 152, volume: 1100000, timestamp: new Date() },
      ];

      await service.trainAgent('AAPL', historicalData);

      // Mock agent exists
      jest
        .spyOn(service as any, 'agents')
        .mockReturnValue(
          new Map([[agentId, { id: agentId, config: {}, act: jest.fn() }]]),
        );

      await expect(
        service.deployAgent(agentId, portfolioId, riskLimits),
      ).resolves.not.toThrow();
    });
  });

  describe('getTradingDecision', () => {
    it('should generate trading decision from deployed agent', async () => {
      const portfolioId = 'portfolio-1';
      const marketState = {
        prices: [150, 151, 152, 151, 150],
        volumes: [1000000, 1100000, 950000, 1200000, 1050000],
        technicalIndicators: new Array(20).fill(0.5),
        portfolioState: [1.0, 0.8, 0.2, 0.05],
        riskMetrics: [1.0, 0.1, 0.05, 0.15],
        marketRegime: 0,
        timestamp: new Date(),
      };

      // Mock deployed agent
      const mockAgent = {
        predict: jest
          .fn()
          .mockResolvedValue([0.1, 0.2, 0.1, 0.0, 0.3, 0.2, 0.1]),
        selectAction: jest.fn().mockReturnValue(4), // WEAK_BUY
        explainDecision: jest.fn().mockResolvedValue(new Array(52).fill(0.1)),
      };

      const mockDeployment = {
        agentId: 'test-agent',
        agent: mockAgent,
        portfolioId,
        riskLimits: { maxPositionSize: 0.3 },
        isActive: true,
      };

      jest
        .spyOn(service as any, 'activeDeployments')
        .mockReturnValue(new Map([[portfolioId, mockDeployment]]));

      const decision = await service.getTradingDecision(
        portfolioId,
        marketState,
      );

      expect(decision).toBeDefined();
      expect(decision.action).toBe('WEAK_BUY');
      expect(decision.confidence).toBeGreaterThan(0);
      expect(decision.positionSize).toBeGreaterThan(0);
      expect(decision.reasoning).toBeDefined();
    });
  });
});
