import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MLModel, MLPrediction } from '../entities/ml.entities';
import { PatternRecognitionService } from './pattern-recognition.service';

describe('PatternRecognitionService (S28C)', () => {
  let service: PatternRecognitionService;

  const mockMLModelRepository = {
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  const mockMLPredictionRepository = {
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatternRecognitionService,
        {
          provide: getRepositoryToken(MLModel),
          useValue: mockMLModelRepository,
        },
        {
          provide: getRepositoryToken(MLPrediction),
          useValue: mockMLPredictionRepository,
        },
      ],
    }).compile();

    service = module.get<PatternRecognitionService>(PatternRecognitionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should recognize patterns with advanced ensemble', async () => {
    const symbol = 'AAPL';
    const historicalData = Array.from({ length: 200 }, (_, i) => ({
      close: 100 + Math.sin(i / 10) * 5 + Math.random(),
      open: 100 + Math.sin(i / 10) * 5 + Math.random(),
      high: 105 + Math.sin(i / 10) * 5 + Math.random(),
      low: 95 + Math.sin(i / 10) * 5 + Math.random(),
      volume: 1000000 + Math.random() * 10000,
      timestamp: Date.now() - (200 - i) * 86400000,
    }));

    const result = await service.recognizePatternsAdvanced(
      symbol,
      historicalData,
      {
        useEnsemble: true,
        includeVisualization: true,
        validatePatterns: true,
        confidenceThreshold: 0.5,
      },
    );

    expect(result).toHaveProperty('patterns');
    expect(result).toHaveProperty('ensembleScore');
    expect(result).toHaveProperty('modelAgreement');
    expect(result.patterns).toBeInstanceOf(Array);
    expect(result.ensembleScore).toBeGreaterThanOrEqual(0);
    expect(result.modelAgreement).toBeGreaterThanOrEqual(0);
  });

  it('should recognize basic patterns', async () => {
    const symbol = 'AAPL';
    const historicalData = Array.from({ length: 100 }, (_, i) => ({
      close: 100 + Math.sin(i / 10) * 5 + Math.random(),
      open: 100 + Math.sin(i / 10) * 5 + Math.random(),
      high: 105 + Math.sin(i / 10) * 5 + Math.random(),
      low: 95 + Math.sin(i / 10) * 5 + Math.random(),
      volume: 1000000 + Math.random() * 10000,
      timestamp: Date.now() - (100 - i) * 86400000,
    }));

    const result = await service.recognizePatternsAdvanced(
      symbol,
      historicalData,
      {
        useEnsemble: false,
        confidenceThreshold: 0.3,
      },
    );

    expect(result).toHaveProperty('patterns');
    expect(result).toHaveProperty('ensembleScore');
    expect(result).toHaveProperty('modelAgreement');
    expect(result.ensembleScore).toBe(0); // Should be 0 when ensemble is disabled
    expect(result.modelAgreement).toBe(0); // Should be 0 when ensemble is disabled
  });
});
