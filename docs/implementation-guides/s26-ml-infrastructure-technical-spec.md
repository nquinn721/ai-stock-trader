# ML Infrastructure Technical Specification

## Architecture Overview

This document outlines the technical architecture for integrating machine learning capabilities into the Stock Trading App, supporting the strategy defined in S26.

## System Architecture

### Core ML Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Data Sources  │    │ Feature Engine  │    │  ML Models      │
│                 │    │                 │    │                 │
│ • Yahoo Finance │───▶│ • Technical     │───▶│ • Breakout      │
│ • News APIs     │    │ • Sentiment     │    │ • Risk Mgmt     │
│ • Market Data   │    │ • Market State  │    │ • Sentiment     │
│ • Portfolio     │    │ • Portfolio     │    │ • Portfolio Opt │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Trade Engine   │◀───│ Decision Engine │◀───│ Model Inference │
│                 │    │                 │    │                 │
│ • Order Mgmt    │    │ • Signal Fusion │    │ • Real-time     │
│ • Risk Controls │    │ • Risk Assessment│    │ • Batch Scoring │
│ • Execution     │    │ • Position Sizing│    │ • A/B Testing   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## ML Service Implementation

### 1. ML Service Module Structure

```typescript
// backend/src/modules/ml/ml.module.ts
@Module({
  imports: [
    TypeOrmModule.forFeature([MLModel, MLPrediction, MLMetric]),
    HttpModule,
  ],
  providers: [
    MLService,
    FeatureEngineeringService,
    ModelManagementService,
    MLInferenceService,
    MLMetricsService,
  ],
  controllers: [MLController],
  exports: [MLService],
})
export class MLModule {}
```

### 2. Core ML Interfaces

```typescript
// backend/src/modules/ml/interfaces/ml.interfaces.ts
export interface MLPrediction {
  id: string;
  modelName: string;
  modelVersion: string;
  input: Record<string, any>;
  output: Record<string, any>;
  confidence: number;
  timestamp: Date;
  executionTime: number;
}

export interface TechnicalFeatures {
  symbol: string;
  timestamp: Date;
  price: number;
  volume: number;
  rsi: number;
  macd: number;
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
  };
  movingAverages: {
    sma20: number;
    sma50: number;
    ema12: number;
    ema26: number;
  };
  support: number;
  resistance: number;
  volatility: number;
  momentum: number;
}

export interface BreakoutPrediction {
  symbol: string;
  probability: number;
  direction: "UP" | "DOWN";
  confidence: number;
  targetPrice: number;
  timeHorizon: number; // hours
  riskScore: number;
  features: TechnicalFeatures;
  modelVersion: string;
  timestamp: Date;
}

export interface RiskParameters {
  portfolioId: number;
  symbol: string;
  recommendedPosition: number; // percentage of portfolio
  stopLoss: number;
  takeProfit: number;
  maxDrawdown: number;
  volatilityAdjustment: number;
  correlationRisk: number;
  timestamp: Date;
}

export interface SentimentScore {
  symbol: string;
  overallSentiment: number; // -1 to 1
  newsCount: number;
  confidence: number;
  topics: {
    earnings: number;
    analyst: number;
    product: number;
    regulatory: number;
    market: number;
  };
  impactScore: number; // 0 to 1
  timeDecay: number;
  timestamp: Date;
}
```

### 3. Feature Engineering Service

```typescript
// backend/src/modules/ml/services/feature-engineering.service.ts
@Injectable()
export class FeatureEngineeringService {
  private readonly logger = new Logger(FeatureEngineeringService.name);

  constructor(
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
    private technicalAnalysisService: TechnicalAnalysisService,
    private newsService: NewsService
  ) {}

  async extractTechnicalFeatures(
    symbol: string,
    lookbackDays: number = 30
  ): Promise<TechnicalFeatures> {
    // Get historical price data
    const historicalData = await this.getHistoricalData(symbol, lookbackDays);

    // Calculate technical indicators
    const indicators = await this.technicalAnalysisService.calculateIndicators(
      historicalData
    );

    // Extract support/resistance levels
    const levels = await this.calculateSupportResistance(historicalData);

    return {
      symbol,
      timestamp: new Date(),
      price: historicalData[historicalData.length - 1].close,
      volume: historicalData[historicalData.length - 1].volume,
      rsi: indicators.rsi,
      macd: indicators.macd.histogram,
      bollingerBands: indicators.bollingerBands,
      movingAverages: indicators.movingAverages,
      support: levels.support,
      resistance: levels.resistance,
      volatility: this.calculateVolatility(historicalData),
      momentum: this.calculateMomentum(historicalData),
    };
  }

  async extractSentimentFeatures(symbol: string): Promise<SentimentScore> {
    const newsData = await this.newsService.getRecentNews(symbol, 24); // Last 24 hours

    // Process through ML sentiment model
    const sentiment = await this.processSentimentML(newsData);

    return sentiment;
  }

  async extractMarketFeatures(): Promise<MarketState> {
    // Extract broad market indicators
    return {
      vixLevel: await this.getVIX(),
      marketTrend: await this.getMarketTrend(),
      sectorRotation: await this.getSectorRotation(),
      liquidity: await this.getLiquidityIndicators(),
      timestamp: new Date(),
    };
  }

  private async processSentimentML(newsData: any[]): Promise<SentimentScore> {
    // This would call the ML model for sentiment analysis
    // For now, placeholder implementation
    return {
      symbol: "AAPL",
      overallSentiment: 0.65,
      newsCount: newsData.length,
      confidence: 0.85,
      topics: {
        earnings: 0.8,
        analyst: 0.7,
        product: 0.6,
        regulatory: 0.4,
        market: 0.75,
      },
      impactScore: 0.7,
      timeDecay: 0.9,
      timestamp: new Date(),
    };
  }
}
```

### 4. ML Inference Service

```typescript
// backend/src/modules/ml/services/ml-inference.service.ts
@Injectable()
export class MLInferenceService {
  private readonly logger = new Logger(MLInferenceService.name);
  private modelCache: Map<string, any> = new Map();

  constructor(
    private httpService: HttpService,
    private modelManagementService: ModelManagementService
  ) {}

  async predictBreakout(
    features: TechnicalFeatures
  ): Promise<BreakoutPrediction> {
    try {
      const modelName = "breakout-predictor";
      const model = await this.loadModel(modelName);

      // Prepare input features
      const input = this.prepareBreakoutInput(features);

      // Make prediction
      const prediction = await this.callMLModel(model, input);

      return {
        symbol: features.symbol,
        probability: prediction.probability,
        direction: prediction.direction,
        confidence: prediction.confidence,
        targetPrice: prediction.targetPrice,
        timeHorizon: prediction.timeHorizon,
        riskScore: prediction.riskScore,
        features,
        modelVersion: model.version,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Error predicting breakout for ${features.symbol}:`,
        error
      );
      throw error;
    }
  }

  async optimizeRisk(
    portfolio: Portfolio,
    symbol: string,
    marketState: MarketState
  ): Promise<RiskParameters> {
    try {
      const modelName = "risk-optimizer";
      const model = await this.loadModel(modelName);

      const input = this.prepareRiskInput(portfolio, symbol, marketState);
      const optimization = await this.callMLModel(model, input);

      return {
        portfolioId: portfolio.id,
        symbol,
        recommendedPosition: optimization.position,
        stopLoss: optimization.stopLoss,
        takeProfit: optimization.takeProfit,
        maxDrawdown: optimization.maxDrawdown,
        volatilityAdjustment: optimization.volatilityAdjustment,
        correlationRisk: optimization.correlationRisk,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error optimizing risk for ${symbol}:`, error);
      throw error;
    }
  }

  private async loadModel(modelName: string): Promise<any> {
    if (this.modelCache.has(modelName)) {
      return this.modelCache.get(modelName);
    }

    const model = await this.modelManagementService.loadModel(modelName);
    this.modelCache.set(modelName, model);
    return model;
  }

  private async callMLModel(model: any, input: any): Promise<any> {
    // This would call the actual ML model
    // Could be local TensorFlow.js, Python service, or cloud ML API
    const response = await this.httpService
      .post(`${process.env.ML_SERVICE_URL}/predict`, {
        model: model.name,
        version: model.version,
        input,
      })
      .toPromise();

    return response.data;
  }

  private prepareBreakoutInput(features: TechnicalFeatures): any {
    return {
      price: features.price,
      volume: features.volume,
      rsi: features.rsi,
      macd: features.macd,
      bb_upper: features.bollingerBands.upper,
      bb_lower: features.bollingerBands.lower,
      sma20: features.movingAverages.sma20,
      sma50: features.movingAverages.sma50,
      support: features.support,
      resistance: features.resistance,
      volatility: features.volatility,
      momentum: features.momentum,
    };
  }

  private prepareRiskInput(
    portfolio: Portfolio,
    symbol: string,
    marketState: MarketState
  ): any {
    return {
      portfolio_value: portfolio.totalValue,
      cash: portfolio.currentCash,
      positions: portfolio.positions?.length || 0,
      symbol,
      vix: marketState.vixLevel,
      market_trend: marketState.marketTrend,
      sector_rotation: marketState.sectorRotation,
    };
  }
}
```

### 5. ML Service Integration

```typescript
// backend/src/modules/ml/ml.service.ts
@Injectable()
export class MLService {
  private readonly logger = new Logger(MLService.name);

  constructor(
    private featureEngineeringService: FeatureEngineeringService,
    private mlInferenceService: MLInferenceService,
    private mlMetricsService: MLMetricsService
  ) {}

  async getBreakoutPrediction(symbol: string): Promise<BreakoutPrediction> {
    const features =
      await this.featureEngineeringService.extractTechnicalFeatures(symbol);
    const prediction = await this.mlInferenceService.predictBreakout(features);

    // Log prediction for monitoring
    await this.mlMetricsService.logPrediction("breakout", prediction);

    return prediction;
  }

  async getRiskOptimization(
    portfolioId: number,
    symbol: string
  ): Promise<RiskParameters> {
    const portfolio = await this.getPortfolio(portfolioId);
    const marketState =
      await this.featureEngineeringService.extractMarketFeatures();

    const riskParams = await this.mlInferenceService.optimizeRisk(
      portfolio,
      symbol,
      marketState
    );

    await this.mlMetricsService.logPrediction("risk-optimization", riskParams);

    return riskParams;
  }

  async getSentimentAnalysis(symbol: string): Promise<SentimentScore> {
    const sentiment =
      await this.featureEngineeringService.extractSentimentFeatures(symbol);
    await this.mlMetricsService.logPrediction("sentiment", sentiment);
    return sentiment;
  }

  async evaluateModelPerformance(
    modelName: string,
    days: number = 30
  ): Promise<ModelMetrics> {
    return this.mlMetricsService.calculateModelMetrics(modelName, days);
  }
}
```

## Database Schema Extensions

### ML-Related Tables

```sql
-- ML Models tracking
CREATE TABLE ml_models (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  version VARCHAR(20) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'breakout', 'risk', 'sentiment', etc.
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'deprecated', 'testing'
  accuracy DECIMAL(5,4),
  precision_score DECIMAL(5,4),
  recall_score DECIMAL(5,4),
  f1_score DECIMAL(5,4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deployed_at TIMESTAMP,
  metadata JSON
);

-- ML Predictions logging
CREATE TABLE ml_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id VARCHAR(50) REFERENCES ml_models(id),
  symbol VARCHAR(10),
  portfolio_id INTEGER,
  prediction_type VARCHAR(50),
  input_features JSON,
  output_prediction JSON,
  confidence DECIMAL(5,4),
  actual_outcome JSON, -- filled later for evaluation
  execution_time INTEGER, -- milliseconds
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ML Model Metrics
CREATE TABLE ml_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id VARCHAR(50) REFERENCES ml_models(id),
  metric_name VARCHAR(50),
  metric_value DECIMAL(10,6),
  calculation_date DATE,
  period_start TIMESTAMP,
  period_end TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- A/B Testing Framework
CREATE TABLE ml_ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name VARCHAR(100),
  control_model_id VARCHAR(50) REFERENCES ml_models(id),
  variant_model_id VARCHAR(50) REFERENCES ml_models(id),
  traffic_split DECIMAL(3,2), -- 0.5 = 50/50 split
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status VARCHAR(20) DEFAULT 'running',
  results JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Deployment Architecture

### ML Service Infrastructure

```yaml
# docker-compose.ml.yml
version: "3.8"

services:
  ml-service:
    build: ./ml-service
    environment:
      - MODEL_STORAGE_PATH=/models
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=${DATABASE_URL}
    volumes:
      - ml-models:/models
    ports:
      - "5000:5000"
    depends_on:
      - redis
      - postgres

  ml-training:
    build: ./ml-training
    environment:
      - DATA_PATH=/data
      - MODEL_OUTPUT_PATH=/models
    volumes:
      - ml-data:/data
      - ml-models:/models
    # Only runs for training jobs

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  model-registry:
    build: ./model-registry
    environment:
      - DATABASE_URL=${DATABASE_URL}
    ports:
      - "8080:8080"

volumes:
  ml-models:
  ml-data:
```

### Integration Points

1. **Order Management Integration**

   - ML risk parameters feed into order validation
   - Breakout predictions trigger order creation
   - Sentiment analysis influences position sizing

2. **WebSocket Integration**

   - Real-time ML predictions broadcast to clients
   - Model performance metrics streaming
   - A/B test results updates

3. **Monitoring Integration**
   - ML model performance dashboards
   - Prediction accuracy tracking
   - Feature drift detection alerts

## Next Steps

1. **Set up ML development environment**
2. **Implement feature engineering pipeline**
3. **Develop breakout prediction model (Phase 1 priority)**
4. **Create A/B testing framework**
5. **Implement monitoring and alerting**
6. **Deploy risk optimization model**
7. **Integrate with existing trading logic**

This technical specification provides the foundation for implementing the ML strategy outlined in S26, with clear interfaces, scalable architecture, and proper monitoring capabilities.
