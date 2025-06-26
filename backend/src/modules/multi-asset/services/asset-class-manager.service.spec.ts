import { Test, TestingModule } from '@nestjs/testing';
import { AssetClassManagerService } from './asset-class-manager.service';
import { CryptoTradingService } from './crypto-trading.service';
import { ForexTradingService } from './forex-trading.service';
import { CommoditiesTradingService } from './commodities-trading.service';
import { AlternativeDataService } from './alternative-data.service';
import { CrossAssetAnalyticsService } from './cross-asset-analytics.service';
import { ArbitrageDetectionService } from './arbitrage-detection.service';
import {
  AssetClass,
  AssetIdentifier,
  UnifiedMarketData,
  CryptoMarketData,
  ForexTick,
  CommodityContract,
  BaseMarketData,
} from '../types/multi-asset.types';

describe('AssetClassManagerService', () => {
  let service: AssetClassManagerService;
  let mockCryptoService: jest.Mocked<CryptoTradingService>;
  let mockForexService: jest.Mocked<ForexTradingService>;
  let mockCommoditiesService: jest.Mocked<CommoditiesTradingService>;
  let mockAlternativeDataService: jest.Mocked<AlternativeDataService>;
  let mockCrossAssetAnalyticsService: jest.Mocked<CrossAssetAnalyticsService>;
  let mockArbitrageDetectionService: jest.Mocked<ArbitrageDetectionService>;

  beforeEach(async () => {
    const mockCrypto = {
      getMarketData: jest.fn(),
      getOrderBook: jest.fn(),
      generateTradingSignals: jest.fn(),
      executeTrade: jest.fn(),
      getAccountBalance: jest.fn(),
      getPositions: jest.fn(),
    };

    const mockForex = {
      getMarketData: jest.fn(),
      getCurrencyPairs: jest.fn(),
      generateTradingSignals: jest.fn(),
      executeTrade: jest.fn(),
      getAccountBalance: jest.fn(),
      getPositions: jest.fn(),
    };

    const mockCommodities = {
      getMarketData: jest.fn(),
      getCommodityContracts: jest.fn(),
      generateTradingSignals: jest.fn(),
      executeTrade: jest.fn(),
      getAccountBalance: jest.fn(),
      getPositions: jest.fn(),
    };

    const mockAlternativeData = {
      getSocialSentiment: jest.fn(),
      getNewsAnalysis: jest.fn(),
      getBlockchainMetrics: jest.fn(),
      getEconomicIndicators: jest.fn(),
      getWeatherData: jest.fn(),
      getESGData: jest.fn(),
    };

    const mockCrossAssetAnalytics = {
      calculateCorrelations: jest.fn(),
      analyzeVolatilitySpillover: jest.fn(),
      generatePortfolioOptimization: jest.fn(),
      getRiskMetrics: jest.fn(),
      getAssetAllocation: jest.fn(),
    };

    const mockArbitrageDetection = {
      findArbitrageOpportunities: jest.fn(),
      calculateSpread: jest.fn(),
      validateOpportunity: jest.fn(),
      getHistoricalArbitrage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssetClassManagerService,
        { provide: CryptoTradingService, useValue: mockCrypto },
        { provide: ForexTradingService, useValue: mockForex },
        { provide: CommoditiesTradingService, useValue: mockCommodities },
        { provide: AlternativeDataService, useValue: mockAlternativeData },
        { provide: CrossAssetAnalyticsService, useValue: mockCrossAssetAnalytics },
        { provide: ArbitrageDetectionService, useValue: mockArbitrageDetection },
      ],
    }).compile();

    service = module.get<AssetClassManagerService>(AssetClassManagerService);
    mockCryptoService = module.get(CryptoTradingService);
    mockForexService = module.get(ForexTradingService);
    mockCommoditiesService = module.get(CommoditiesTradingService);
    mockAlternativeDataService = module.get(AlternativeDataService);
    mockCrossAssetAnalyticsService = module.get(CrossAssetAnalyticsService);
    mockArbitrageDetectionService = module.get(ArbitrageDetectionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUnifiedMarketData', () => {
    it('should aggregate data from all asset classes', async () => {
      const mockCryptoData: AssetData = {
        symbol: 'BTC',
        assetClass: AssetClass.CRYPTO,
        price: 50000,
        change: 2.5,
        changePercent: 5.26,
        volume: 1000000,
        marketCap: 950000000000,
        timestamp: new Date(),
      };

      const mockForexData: AssetData = {
        symbol: 'EUR/USD',
        assetClass: AssetClass.FOREX,
        price: 1.0850,
        change: 0.0025,
        changePercent: 0.23,
        volume: 5000000,
        timestamp: new Date(),
      };

      const mockCommodityData: AssetData = {
        symbol: 'GOLD',
        assetClass: AssetClass.COMMODITIES,
        price: 2000,
        change: -15,
        changePercent: -0.74,
        volume: 100000,
        timestamp: new Date(),
      };

      mockCryptoService.getMarketData.mockResolvedValue([mockCryptoData]);
      mockForexService.getMarketData.mockResolvedValue([mockForexData]);
      mockCommoditiesService.getMarketData.mockResolvedValue([mockCommodityData]);

      const result = await service.getUnifiedMarketData();

      expect(result).toHaveLength(3);
      expect(result).toContainEqual(mockCryptoData);
      expect(result).toContainEqual(mockForexData);
      expect(result).toContainEqual(mockCommodityData);
    });

    it('should handle service failures gracefully', async () => {
      mockCryptoService.getMarketData.mockRejectedValue(new Error('Crypto API error'));
      mockForexService.getMarketData.mockResolvedValue([]);
      mockCommoditiesService.getMarketData.mockResolvedValue([]);

      const result = await service.getUnifiedMarketData();

      expect(result).toHaveLength(0);
      expect(mockCryptoService.getMarketData).toHaveBeenCalled();
      expect(mockForexService.getMarketData).toHaveBeenCalled();
      expect(mockCommoditiesService.getMarketData).toHaveBeenCalled();
    });
  });

  describe('generateUnifiedTradingSignals', () => {
    it('should generate signals from all asset classes', async () => {
      const mockCryptoSignals: TradingSignal[] = [
        {
          symbol: 'BTC',
          assetClass: AssetClass.CRYPTO,
          action: 'BUY',
          confidence: 0.85,
          price: 50000,
          timestamp: new Date(),
          indicators: { rsi: 30, macd: 0.5 },
        },
      ];

      const mockForexSignals: TradingSignal[] = [
        {
          symbol: 'EUR/USD',
          assetClass: AssetClass.FOREX,
          action: 'SELL',
          confidence: 0.75,
          price: 1.0850,
          timestamp: new Date(),
          indicators: { rsi: 70, macd: -0.3 },
        },
      ];

      mockCryptoService.generateTradingSignals.mockResolvedValue(mockCryptoSignals);
      mockForexService.generateTradingSignals.mockResolvedValue(mockForexSignals);
      mockCommoditiesService.generateTradingSignals.mockResolvedValue([]);

      const result = await service.generateUnifiedTradingSignals();

      expect(result).toHaveLength(2);
      expect(result).toContainEqual(mockCryptoSignals[0]);
      expect(result).toContainEqual(mockForexSignals[0]);
    });
  });

  describe('optimizePortfolioAllocation', () => {
    it('should generate optimized portfolio allocation', async () => {
      const mockAllocation: PortfolioAllocation = {
        allocations: [
          { assetClass: AssetClass.STOCKS, percentage: 40, symbols: ['AAPL', 'GOOGL'] },
          { assetClass: AssetClass.CRYPTO, percentage: 20, symbols: ['BTC', 'ETH'] },
          { assetClass: AssetClass.FOREX, percentage: 25, symbols: ['EUR/USD', 'GBP/USD'] },
          { assetClass: AssetClass.COMMODITIES, percentage: 15, symbols: ['GOLD', 'OIL'] },
        ],
        totalValue: 100000,
        riskScore: 0.65,
        expectedReturn: 0.12,
        sharpeRatio: 1.8,
        lastUpdated: new Date(),
      };

      mockCrossAssetAnalyticsService.generatePortfolioOptimization.mockResolvedValue(mockAllocation);

      const targetRisk = 0.7;
      const result = await service.optimizePortfolioAllocation(targetRisk);

      expect(result).toEqual(mockAllocation);
      expect(mockCrossAssetAnalyticsService.generatePortfolioOptimization).toHaveBeenCalledWith(targetRisk);
    });
  });

  describe('getCrossAssetCorrelations', () => {
    it('should return correlation matrix for multiple asset classes', async () => {
      const mockCorrelations: CrossAssetCorrelation[] = [
        {
          asset1: { symbol: 'BTC', assetClass: AssetClass.CRYPTO },
          asset2: { symbol: 'GOLD', assetClass: AssetClass.COMMODITIES },
          correlation: 0.25,
          period: '30d',
          timestamp: new Date(),
        },
        {
          asset1: { symbol: 'EUR/USD', assetClass: AssetClass.FOREX },
          asset2: { symbol: 'AAPL', assetClass: AssetClass.STOCKS },
          correlation: -0.15,
          period: '30d',
          timestamp: new Date(),
        },
      ];

      mockCrossAssetAnalyticsService.calculateCorrelations.mockResolvedValue(mockCorrelations);

      const symbols = ['BTC', 'GOLD', 'EUR/USD', 'AAPL'];
      const period = '30d';
      const result = await service.getCrossAssetCorrelations(symbols, period);

      expect(result).toEqual(mockCorrelations);
      expect(mockCrossAssetAnalyticsService.calculateCorrelations).toHaveBeenCalledWith(symbols, period);
    });
  });

  describe('getRiskMetrics', () => {
    it('should calculate comprehensive risk metrics', async () => {
      const mockRiskMetrics: RiskMetrics = {
        volatility: 0.25,
        valueAtRisk: 0.05,
        conditionalValueAtRisk: 0.08,
        sharpeRatio: 1.5,
        beta: 1.2,
        maxDrawdown: 0.15,
        skewness: -0.3,
        kurtosis: 3.2,
        period: '30d',
        timestamp: new Date(),
      };

      mockCrossAssetAnalyticsService.getRiskMetrics.mockResolvedValue(mockRiskMetrics);

      const symbols = ['BTC', 'AAPL', 'GOLD'];
      const result = await service.getRiskMetrics(symbols);

      expect(result).toEqual(mockRiskMetrics);
      expect(mockCrossAssetAnalyticsService.getRiskMetrics).toHaveBeenCalledWith(symbols);
    });
  });

  describe('getArbitrageOpportunities', () => {
    it('should find arbitrage opportunities across asset classes', async () => {
      const mockOpportunities = [
        {
          id: 'arb-1',
          asset1: { symbol: 'BTC', assetClass: AssetClass.CRYPTO, exchange: 'Binance' },
          asset2: { symbol: 'BTC', assetClass: AssetClass.CRYPTO, exchange: 'Coinbase' },
          spread: 150,
          spreadPercentage: 0.3,
          profitPotential: 145,
          risk: 'Low',
          timestamp: new Date(),
        },
      ];

      mockArbitrageDetectionService.findArbitrageOpportunities.mockResolvedValue(mockOpportunities);

      const result = await service.getArbitrageOpportunities();

      expect(result).toEqual(mockOpportunities);
      expect(mockArbitrageDetectionService.findArbitrageOpportunities).toHaveBeenCalled();
    });
  });

  describe('getAlternativeDataInsights', () => {
    it('should aggregate alternative data from multiple sources', async () => {
      const mockSentiment = {
        symbol: 'BTC',
        sentiment: 'bullish',
        score: 0.75,
        sources: ['twitter', 'reddit'],
        timestamp: new Date(),
      };

      const mockNews = {
        symbol: 'AAPL',
        sentiment: 'neutral',
        articles: 25,
        avgSentiment: 0.52,
        timestamp: new Date(),
      };

      mockAlternativeDataService.getSocialSentiment.mockResolvedValue([mockSentiment]);
      mockAlternativeDataService.getNewsAnalysis.mockResolvedValue([mockNews]);
      mockAlternativeDataService.getBlockchainMetrics.mockResolvedValue([]);
      mockAlternativeDataService.getEconomicIndicators.mockResolvedValue([]);

      const symbols = ['BTC', 'AAPL'];
      const result = await service.getAlternativeDataInsights(symbols);

      expect(result).toBeDefined();
      expect(result.socialSentiment).toContainEqual(mockSentiment);
      expect(result.newsAnalysis).toContainEqual(mockNews);
      expect(mockAlternativeDataService.getSocialSentiment).toHaveBeenCalledWith(symbols);
      expect(mockAlternativeDataService.getNewsAnalysis).toHaveBeenCalledWith(symbols);
    });
  });

  describe('getUnifiedAssetView', () => {
    it('should provide comprehensive asset data with enhanced analytics', async () => {
      const symbol = 'BTC';
      const assetClass = AssetClass.CRYPTO;

      const mockAssetData: AssetData = {
        symbol,
        assetClass,
        price: 50000,
        change: 1000,
        changePercent: 2.04,
        volume: 1000000,
        marketCap: 950000000000,
        timestamp: new Date(),
      };

      const mockRiskMetrics: RiskMetrics = {
        volatility: 0.45,
        valueAtRisk: 0.08,
        conditionalValueAtRisk: 0.12,
        sharpeRatio: 1.2,
        beta: 1.8,
        maxDrawdown: 0.25,
        skewness: -0.5,
        kurtosis: 4.1,
        period: '30d',
        timestamp: new Date(),
      };

      const mockCorrelations: CrossAssetCorrelation[] = [
        {
          asset1: { symbol: 'BTC', assetClass: AssetClass.CRYPTO },
          asset2: { symbol: 'GOLD', assetClass: AssetClass.COMMODITIES },
          correlation: 0.3,
          period: '30d',
          timestamp: new Date(),
        },
      ];

      mockCryptoService.getMarketData.mockResolvedValue([mockAssetData]);
      mockCrossAssetAnalyticsService.getRiskMetrics.mockResolvedValue(mockRiskMetrics);
      mockCrossAssetAnalyticsService.calculateCorrelations.mockResolvedValue(mockCorrelations);

      const result = await service.getUnifiedAssetView(symbol, assetClass);

      expect(result).toBeDefined();
      expect(result.symbol).toBe(symbol);
      expect(result.assetClass).toBe(assetClass);
      expect(result.marketData).toEqual(mockAssetData);
      expect(result.riskMetrics).toEqual(mockRiskMetrics);
      expect(result.correlations).toEqual(mockCorrelations);
    });

    it('should handle missing data gracefully', async () => {
      const symbol = 'INVALID';
      const assetClass = AssetClass.CRYPTO;

      mockCryptoService.getMarketData.mockResolvedValue([]);
      mockCrossAssetAnalyticsService.getRiskMetrics.mockRejectedValue(new Error('No data'));
      mockCrossAssetAnalyticsService.calculateCorrelations.mockResolvedValue([]);

      const result = await service.getUnifiedAssetView(symbol, assetClass);

      expect(result).toBeDefined();
      expect(result.symbol).toBe(symbol);
      expect(result.assetClass).toBe(assetClass);
      expect(result.marketData).toBeNull();
      expect(result.riskMetrics).toBeNull();
      expect(result.correlations).toEqual([]);
    });
  });
});
