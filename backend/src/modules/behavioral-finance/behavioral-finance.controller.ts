import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { BehavioralFinanceService } from './behavioral-finance.service';
import { CognitiveAIService } from './cognitive-ai.service';
import { MarketPsychologyService } from './market-psychology.service';

@Controller('behavioral-finance')
export class BehavioralFinanceController {
  constructor(
    private readonly behavioralFinanceService: BehavioralFinanceService,
    private readonly cognitiveAIService: CognitiveAIService,
    private readonly marketPsychologyService: MarketPsychologyService,
  ) {}

  // Behavioral Finance Endpoints
  @Get('cognitive-biases/:symbol')
  async getCognitiveBiases(@Param('symbol') symbol: string) {
    // Mock market data for the symbol
    const mockMarketData = { symbol, prices: [], volume: [], timestamps: [] };
    return this.behavioralFinanceService.detectCognitiveBias(mockMarketData);
  }

  @Get('sentiment-cycle')
  async getSentimentCycle() {
    return this.behavioralFinanceService.analyzeMarketSentimentCycle();
  }

  @Get('fear-greed-index')
  async getFearGreedIndex() {
    return this.behavioralFinanceService.calculateFearGreedIndex();
  }

  @Get('herding-behavior/:symbol')
  async getHerdingBehavior(@Param('symbol') symbol: string) {
    return this.behavioralFinanceService.detectHerdingBehavior(symbol);
  }

  @Post('prospect-theory')
  async analyzeProspectTheory(@Body() data: { portfolio: any }) {
    return this.behavioralFinanceService.analyzeProspectTheory(data.portfolio);
  }

  @Get('loss-aversion')
  async getLossAversion(@Query('history') history?: string) {
    const tradingHistory = history ? JSON.parse(history) : [];
    return this.behavioralFinanceService.assessLossAversion(tradingHistory);
  }

  // Cognitive AI Endpoints
  @Get('emotional-state')
  async getEmotionalState(@Query('textData') textData?: string) {
    const textArray = textData
      ? JSON.parse(textData)
      : ['Market analysis data'];
    return this.cognitiveAIService.analyzeMarketEmotion(textArray);
  }

  @Get('stress-detection')
  async getStressDetection(@Query('conditions') conditions?: string) {
    const marketConditions = conditions ? JSON.parse(conditions) : {};
    return this.cognitiveAIService.detectStressIndicators(marketConditions);
  }

  @Get('psychology-profile')
  async getPsychologyProfile(@Query('behaviorData') behaviorData?: string) {
    const data = behaviorData ? JSON.parse(behaviorData) : {};
    return this.cognitiveAIService.modelInvestorPsychology(data);
  }

  @Post('behavioral-prediction')
  async getBehavioralPrediction(@Body() data: { triggers: any[] }) {
    return this.cognitiveAIService.predictBehavioralShifts(data.triggers);
  }

  @Get('cognitive-load')
  async getCognitiveLoad(
    @Query('complexityMetrics') complexityMetrics?: string,
  ) {
    const metrics = complexityMetrics ? JSON.parse(complexityMetrics) : {};
    return this.cognitiveAIService.assessCognitiveLoad(metrics);
  }

  @Get('decision-timing')
  async getDecisionTiming(@Query('cognitiveState') cognitiveState?: string) {
    const state = cognitiveState ? JSON.parse(cognitiveState) : {};
    return this.cognitiveAIService.optimizeDecisionTiming(state);
  }

  // Market Psychology Endpoints
  @Get('bubble-risk/:sector')
  async getBubbleRisk(@Param('sector') sector: string) {
    return this.marketPsychologyService.analyzeBubbleFormation(sector);
  }

  @Get('euphoria-detection')
  async getEuphoriaDetection(@Query('timeframe') timeframe: string = '1m') {
    return this.marketPsychologyService.detectEuphoricPhases(timeframe);
  }

  @Get('panic-selling/:symbol')
  async getPanicSelling(@Param('symbol') symbol: string) {
    return this.marketPsychologyService.identifyPanicSelling(symbol);
  }

  @Get('capitulation-signals')
  async getCapitulationSignals(@Query('marketData') marketData?: string) {
    const data = marketData ? JSON.parse(marketData) : {};
    return this.marketPsychologyService.analyzeCapitulation(data);
  }

  @Get('social-proof')
  async getSocialProof(@Query('socialData') socialData?: string) {
    const data = socialData ? JSON.parse(socialData) : {};
    return this.marketPsychologyService.assessSocialProof(data);
  }

  @Get('authority-bias')
  async getAuthorityBias(@Query('influencers') influencers?: string) {
    const influencerArray = influencers ? JSON.parse(influencers) : [];
    return this.marketPsychologyService.analyzeAuthorityBias(influencerArray);
  }

  // Combined Analytics Endpoints
  @Get('behavioral-dashboard/:symbol')
  async getBehavioralDashboard(@Param('symbol') symbol: string) {
    const mockMarketData = { symbol, prices: [], volume: [], timestamps: [] };
    const mockTextData = ['Market analysis data'];

    const [cognitiveBiases, emotionalState, bubbleRisk] = await Promise.all([
      this.behavioralFinanceService.detectCognitiveBias(mockMarketData),
      this.cognitiveAIService.analyzeMarketEmotion(mockTextData),
      this.marketPsychologyService.analyzeBubbleFormation(symbol),
    ]);

    return {
      symbol,
      timestamp: new Date().toISOString(),
      cognitiveBiases,
      emotionalState,
      bubbleRisk,
    };
  }

  @Get('psychology-insights')
  async getPsychologyInsights(@Query('symbols') symbols?: string) {
    const symbolArray = symbols ? symbols.split(',') : ['SPY', 'QQQ', 'AAPL'];

    const insights = await Promise.all(
      symbolArray.map(async (symbol) => {
        const [fearGreed, herding, stress] = await Promise.all([
          this.behavioralFinanceService.calculateFearGreedIndex(),
          this.behavioralFinanceService.detectHerdingBehavior(symbol),
          this.cognitiveAIService.detectStressIndicators({}),
        ]);

        return {
          symbol,
          fearGreed,
          herding,
          stress,
        };
      }),
    );

    return {
      timestamp: new Date().toISOString(),
      insights,
    };
  }

  @Post('behavioral-trading-signal')
  async getBehavioralTradingSignal(
    @Body()
    data: {
      symbol: string;
      riskTolerance: number;
      timeframe: string;
      includeEmotional?: boolean;
    },
  ) {
    const { symbol, riskTolerance, timeframe, includeEmotional = true } = data;
    const mockMarketData = { symbol, prices: [], volume: [], timestamps: [] };
    const mockTextData = ['Market analysis data'];

    const [
      cognitiveBiases,
      sentimentCycle,
      fearGreed,
      emotionalState,
      bubbleRisk,
    ] = await Promise.all([
      this.behavioralFinanceService.detectCognitiveBias(mockMarketData),
      this.behavioralFinanceService.analyzeMarketSentimentCycle(),
      this.behavioralFinanceService.calculateFearGreedIndex(),
      includeEmotional
        ? this.cognitiveAIService.analyzeMarketEmotion(mockTextData)
        : null,
      this.marketPsychologyService.analyzeBubbleFormation(symbol),
    ]);

    // Generate composite trading signal based on behavioral factors
    const signal = this.generateBehavioralTradingSignal({
      cognitiveBiases,
      sentimentCycle,
      fearGreed,
      emotionalState,
      bubbleRisk,
      riskTolerance,
      timeframe,
    });

    return {
      symbol,
      timestamp: new Date().toISOString(),
      signal,
      confidence: signal.confidence,
      reasoning: signal.reasoning,
      riskAssessment: signal.risk,
    };
  }

  private generateBehavioralTradingSignal(data: any) {
    // Composite behavioral trading signal logic
    let bullishFactors = 0;
    let bearishFactors = 0;
    let confidence = 0;
    const reasoning: string[] = [];

    // Analyze cognitive biases
    if (data.cognitiveBiases.overconfidence > 0.7) {
      bearishFactors += 2;
      reasoning.push(
        'High overconfidence detected - potential reversal signal',
      );
    }
    if (data.cognitiveBiases.anchoring < 0.3) {
      bullishFactors += 1;
      reasoning.push('Low anchoring bias - flexible price discovery');
    }

    // Analyze sentiment cycle
    if (data.sentimentCycle.phase === 'accumulation') {
      bullishFactors += 3;
      reasoning.push('Accumulation phase - institutional buying opportunity');
    } else if (data.sentimentCycle.phase === 'distribution') {
      bearishFactors += 3;
      reasoning.push('Distribution phase - smart money selling');
    }

    // Analyze Fear & Greed
    if (data.fearGreed.index < 20) {
      bullishFactors += 2;
      reasoning.push('Extreme fear - contrarian buying opportunity');
    } else if (data.fearGreed.index > 80) {
      bearishFactors += 2;
      reasoning.push('Extreme greed - contrarian selling opportunity');
    }

    // Analyze bubble risk
    if (data.bubbleRisk.riskLevel > 0.8) {
      bearishFactors += 4;
      reasoning.push('High bubble risk - potential crash warning');
    }

    // Calculate net signal
    const netSignal = bullishFactors - bearishFactors;
    let action: 'BUY' | 'SELL' | 'HOLD';

    if (netSignal >= 3) {
      action = 'BUY';
      confidence = Math.min(0.9, netSignal / 10 + 0.5);
    } else if (netSignal <= -3) {
      action = 'SELL';
      confidence = Math.min(0.9, Math.abs(netSignal) / 10 + 0.5);
    } else {
      action = 'HOLD';
      confidence = 0.3 + Math.abs(netSignal) * 0.1;
    }

    return {
      action,
      confidence,
      reasoning,
      risk:
        data.riskTolerance > 0.7
          ? 'HIGH'
          : data.riskTolerance > 0.4
            ? 'MEDIUM'
            : 'LOW',
      factors: {
        bullish: bullishFactors,
        bearish: bearishFactors,
        net: netSignal,
      },
    };
  }
}
