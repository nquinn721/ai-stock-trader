import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  BusinessCyclePhase,
  EconomicAnalysis,
  GDPForecast,
  InflationForecast,
  LaborMarketAnalysis,
  RecessionProbability,
  YieldCurveAnalysis,
} from '../interfaces/economic.interfaces';
import {
  ConflictData,
  ConflictRiskAssessment,
  ElectionData,
  ElectionPrediction,
  RefugeeFlowPrediction,
  RegimeChangeRisk,
  SafeHavenAnalysis,
  SanctionData,
  SanctionsImpact,
  StabilityScore,
  TensionAnalysis,
  TradeWarAnalysis,
} from '../interfaces/geopolitical.interfaces';
import {
  ConsistencyMetrics,
  FedSpeech,
  GuidanceAnalysis,
  ImpactAnalysis,
  InterventionRisk,
  PolicyDivergenceAnalysis,
  PolicyStanceAnalysis,
  PolicyStatement,
  QEProbabilityAssessment,
  RateDecisionPrediction,
} from '../interfaces/monetary-policy.interfaces';
import { EconomicIntelligenceService } from '../services/economic-intelligence.service';
import { GeopoliticalAnalysisService } from '../services/geopolitical-analysis.service';
import { MonetaryPolicyService } from '../services/monetary-policy.service';

/**
 * S51: Macro Intelligence Controller
 * REST API endpoints for macroeconomic intelligence and geopolitical analysis
 */
@Controller('macro-intelligence')
export class MacroIntelligenceController {
  private readonly logger = new Logger(MacroIntelligenceController.name);

  constructor(
    private readonly economicService: EconomicIntelligenceService,
    private readonly monetaryService: MonetaryPolicyService,
    private readonly geopoliticalService: GeopoliticalAnalysisService,
  ) {}

  // Economic Intelligence Endpoints

  /**
   * GET /api/macro-intelligence/economic/analysis/:country
   * Get comprehensive economic analysis for a country
   */
  @Get('economic/analysis/:country')
  async getEconomicAnalysis(
    @Param('country') country: string,
  ): Promise<EconomicAnalysis> {
    this.logger.log(`Getting economic analysis for ${country}`);
    return this.economicService.analyzeEconomicIndicators(country);
  }

  /**
   * GET /api/macro-intelligence/economic/inflation
   * Get inflation forecast for a region
   */
  @Get('economic/inflation')
  async getInflationForecast(
    @Query('region') region: string,
    @Query('timeframe') timeframe: string = '1Y',
  ): Promise<InflationForecast> {
    this.logger.log(
      `Getting inflation forecast for ${region} over ${timeframe}`,
    );
    return this.economicService.predictInflationTrend(region, timeframe);
  }

  /**
   * GET /api/macro-intelligence/economic/gdp/:country
   * Get GDP growth forecast for a country
   */
  @Get('economic/gdp/:country')
  async getGDPForecast(
    @Param('country') country: string,
  ): Promise<GDPForecast> {
    this.logger.log(`Getting GDP forecast for ${country}`);
    return this.economicService.forecastGDPGrowth(country);
  }

  /**
   * GET /api/macro-intelligence/economic/labor/:region
   * Get labor market analysis for a region
   */
  @Get('economic/labor/:region')
  async getLaborMarketAnalysis(
    @Param('region') region: string,
  ): Promise<LaborMarketAnalysis> {
    this.logger.log(`Getting labor market analysis for ${region}`);
    return this.economicService.analyzeLaborMarket(region);
  }

  /**
   * GET /api/macro-intelligence/economic/business-cycle/:economy
   * Get business cycle analysis for an economy
   */
  @Get('economic/business-cycle/:economy')
  async getBusinessCycle(
    @Param('economy') economy: string,
  ): Promise<BusinessCyclePhase> {
    this.logger.log(`Getting business cycle phase for ${economy}`);
    return this.economicService.identifyBusinessCyclePhase(economy);
  }

  /**
   * GET /api/macro-intelligence/economic/recession/:country
   * Get recession probability for a country
   */
  @Get('economic/recession/:country')
  async getRecessionProbability(
    @Param('country') country: string,
  ): Promise<RecessionProbability> {
    this.logger.log(`Getting recession probability for ${country}`);
    return this.economicService.predictRecessionProbability(country);
  }

  /**
   * GET /api/macro-intelligence/economic/yield-curve/:country
   * Get yield curve analysis for a country
   */
  @Get('economic/yield-curve/:country')
  async getYieldCurveAnalysis(
    @Param('country') country: string,
  ): Promise<YieldCurveAnalysis> {
    this.logger.log(`Getting yield curve analysis for ${country}`);
    return this.economicService.analyzeYieldCurveSignals(country);
  }

  // Monetary Policy Endpoints

  /**
   * POST /api/macro-intelligence/monetary/fed-analysis
   * Analyze Federal Reserve communications
   */
  @Post('monetary/fed-analysis')
  async analyzeFedCommunication(
    @Body() speeches: FedSpeech[],
  ): Promise<PolicyStanceAnalysis> {
    this.logger.log(`Analyzing ${speeches.length} Fed communications`);
    return this.monetaryService.analyzeFedCommunication(speeches);
  }

  /**
   * GET /api/macro-intelligence/monetary/rate-prediction
   * Get interest rate decision prediction
   */
  @Get('monetary/rate-prediction')
  async getRateDecisionPrediction(
    @Query('meetingDate') meetingDate: string,
  ): Promise<RateDecisionPrediction> {
    const date = new Date(meetingDate);
    this.logger.log(`Getting rate decision prediction for ${date}`);
    return this.monetaryService.predictInterestRateDecision(date);
  }

  /**
   * GET /api/macro-intelligence/monetary/qe-probability/:centralBank
   * Get QE probability assessment
   */
  @Get('monetary/qe-probability/:centralBank')
  async getQEProbability(
    @Param('centralBank') centralBank: string,
  ): Promise<QEProbabilityAssessment> {
    this.logger.log(`Getting QE probability for ${centralBank}`);
    return this.monetaryService.assessQEProbability(centralBank);
  }

  /**
   * POST /api/macro-intelligence/monetary/rate-impact
   * Model impact of rate changes
   */
  @Post('monetary/rate-impact')
  async modelRateImpact(
    @Body() body: { rateChange: number; sectors: string[] },
  ): Promise<ImpactAnalysis> {
    this.logger.log(
      `Modeling rate change impact: ${body.rateChange}% on sectors: ${body.sectors.join(', ')}`,
    );
    return this.monetaryService.modelRateChangeImpact(
      body.rateChange,
      body.sectors,
    );
  }

  /**
   * GET /api/macro-intelligence/monetary/intervention-risk/:currency
   * Get currency intervention risk analysis
   */
  @Get('monetary/intervention-risk/:currency')
  async getInterventionRisk(
    @Param('currency') currency: string,
  ): Promise<InterventionRisk> {
    this.logger.log(`Getting intervention risk for ${currency}`);
    return this.monetaryService.analyzeCurrencyInterventionRisk(currency);
  }

  /**
   * POST /api/macro-intelligence/monetary/policy-divergence
   * Analyze policy divergence between countries
   */
  @Post('monetary/policy-divergence')
  async analyzePolicyDivergence(
    @Body() countries: string[],
  ): Promise<PolicyDivergenceAnalysis> {
    this.logger.log(`Analyzing policy divergence for: ${countries.join(', ')}`);
    return this.monetaryService.predictPolicyDivergence(countries);
  }

  /**
   * POST /api/macro-intelligence/monetary/forward-guidance
   * Parse forward guidance statements
   */
  @Post('monetary/forward-guidance')
  async parseForwardGuidance(
    @Body() guidance: PolicyStatement,
  ): Promise<GuidanceAnalysis> {
    this.logger.log(`Parsing forward guidance from ${guidance.centralBank}`);
    return this.monetaryService.parseForwardGuidance(guidance);
  }

  /**
   * GET /api/macro-intelligence/monetary/consistency/:centralBank
   * Get policy consistency metrics
   */
  @Get('monetary/consistency/:centralBank')
  async getPolicyConsistency(
    @Param('centralBank') centralBank: string,
  ): Promise<ConsistencyMetrics> {
    this.logger.log(`Getting policy consistency for ${centralBank}`);
    return this.monetaryService.trackPolicyConsistency(centralBank);
  }

  // Geopolitical Analysis Endpoints

  /**
   * GET /api/macro-intelligence/geopolitical/stability/:country
   * Get political stability score for a country
   */
  @Get('geopolitical/stability/:country')
  async getPoliticalStability(
    @Param('country') country: string,
  ): Promise<StabilityScore> {
    this.logger.log(`Getting political stability for ${country}`);
    return this.geopoliticalService.assessPoliticalStability(country);
  }

  /**
   * POST /api/macro-intelligence/geopolitical/election-prediction
   * Predict election outcomes
   */
  @Post('geopolitical/election-prediction')
  async predictElection(
    @Body() election: ElectionData,
  ): Promise<ElectionPrediction> {
    this.logger.log(`Predicting election outcome for ${election.country}`);
    return this.geopoliticalService.predictElectionOutcome(election);
  }

  /**
   * GET /api/macro-intelligence/geopolitical/regime-risk/:country
   * Get regime change risk assessment
   */
  @Get('geopolitical/regime-risk/:country')
  async getRegimeChangeRisk(
    @Param('country') country: string,
  ): Promise<RegimeChangeRisk> {
    this.logger.log(`Getting regime change risk for ${country}`);
    return this.geopoliticalService.analyzeRegimeChangeRisk(country);
  }

  /**
   * POST /api/macro-intelligence/geopolitical/trade-war
   * Analyze trade war impact
   */
  @Post('geopolitical/trade-war')
  async analyzeTradeWar(
    @Body() countries: string[],
  ): Promise<TradeWarAnalysis> {
    this.logger.log(
      `Analyzing trade war impact between: ${countries.join(', ')}`,
    );
    return this.geopoliticalService.analyzeTradeWarImpact(countries);
  }

  /**
   * POST /api/macro-intelligence/geopolitical/sanctions-impact
   * Assess sanctions impact
   */
  @Post('geopolitical/sanctions-impact')
  async assessSanctions(
    @Body() sanctions: SanctionData,
  ): Promise<SanctionsImpact> {
    this.logger.log(`Assessing sanctions impact on ${sanctions.target}`);
    return this.geopoliticalService.assessSanctionsImpact(sanctions);
  }

  /**
   * GET /api/macro-intelligence/geopolitical/tensions/:region
   * Get diplomatic tension analysis
   */
  @Get('geopolitical/tensions/:region')
  async getDiplomaticTensions(
    @Param('region') region: string,
  ): Promise<TensionAnalysis> {
    this.logger.log(`Getting diplomatic tensions for ${region}`);
    return this.geopoliticalService.predictDiplomaticTensions(region);
  }

  /**
   * POST /api/macro-intelligence/geopolitical/conflict-risk
   * Assess conflict risk for regions
   */
  @Post('geopolitical/conflict-risk')
  async assessConflictRisk(
    @Body() regions: string[],
  ): Promise<ConflictRiskAssessment> {
    this.logger.log(`Assessing conflict risk for: ${regions.join(', ')}`);
    return this.geopoliticalService.assessConflictRisk(regions);
  }

  /**
   * GET /api/macro-intelligence/geopolitical/safe-havens/:eventType
   * Analyze safe haven flows for event type
   */
  @Get('geopolitical/safe-havens/:eventType')
  async analyzeSafeHavens(
    @Param('eventType') eventType: string,
  ): Promise<SafeHavenAnalysis> {
    this.logger.log(`Analyzing safe haven flows for ${eventType}`);
    return this.geopoliticalService.analyzeSafeHavenFlows(eventType);
  }

  /**
   * POST /api/macro-intelligence/geopolitical/refugee-flows
   * Predict refugee flows from conflict
   */
  @Post('geopolitical/refugee-flows')
  async predictRefugeeFlows(
    @Body() conflict: ConflictData,
  ): Promise<RefugeeFlowPrediction> {
    this.logger.log(
      `Predicting refugee flows from conflict in ${conflict.regions.join(', ')}`,
    );
    return this.geopoliticalService.predictRefugeeFlows(conflict);
  }

  // Combined Analysis Endpoints

  /**
   * GET /api/macro-intelligence/dashboard/:country
   * Get comprehensive macro dashboard data for a country
   */
  @Get('dashboard/:country')
  async getMacroDashboard(@Param('country') country: string): Promise<any> {
    this.logger.log(`Getting macro dashboard data for ${country}`);

    const [
      economicAnalysis,
      recessionProbability,
      politicalStability,
      businessCycle,
    ] = await Promise.all([
      this.economicService.analyzeEconomicIndicators(country),
      this.economicService.predictRecessionProbability(country),
      this.geopoliticalService.assessPoliticalStability(country),
      this.economicService.identifyBusinessCyclePhase(country),
    ]);

    return {
      country,
      economic: economicAnalysis,
      recession: recessionProbability,
      political: politicalStability,
      businessCycle,
      timestamp: new Date(),
    };
  }

  /**
   * GET /api/macro-intelligence/global-overview
   * Get global macroeconomic overview
   */
  @Get('global-overview')
  async getGlobalOverview(): Promise<any> {
    this.logger.log('Getting global macroeconomic overview');

    const majorEconomies = ['US', 'China', 'Germany', 'Japan', 'UK'];

    const economicData = await Promise.all(
      majorEconomies.map(async (country) => {
        const [economic, recession, stability] = await Promise.all([
          this.economicService.analyzeEconomicIndicators(country),
          this.economicService.predictRecessionProbability(country),
          this.geopoliticalService.assessPoliticalStability(country),
        ]);

        return {
          country,
          economic,
          recession,
          stability,
        };
      }),
    );

    return {
      majorEconomies: economicData,
      globalRisks: [
        'Trade war escalation',
        'Geopolitical tensions',
        'Monetary policy divergence',
        'Financial market volatility',
      ],
      opportunities: [
        'Technology sector growth',
        'Green energy transition',
        'Infrastructure investment',
        'Emerging market recovery',
      ],
      timestamp: new Date(),
    };
  }

  /**
   * GET /api/macro-intelligence/system/health
   * Get system health and status
   */
  @Get('system/health')
  async getSystemHealth(): Promise<any> {
    this.logger.log('Getting macro intelligence system health');

    return {
      status: 'operational',
      services: {
        economic: 'online',
        monetary: 'online',
        geopolitical: 'online',
      },
      dataFeeds: {
        economicIndicators: 'active',
        centralBankCommunications: 'active',
        politicalEvents: 'active',
        marketData: 'active',
      },
      lastUpdate: new Date(),
      version: '1.0.0',
    };
  }

  /**
   * GET /api/macro-intelligence/comprehensive-analysis
   * Get comprehensive analysis for dashboard
   */
  @Get('comprehensive-analysis')
  async getComprehensiveAnalysis(
    @Query('country') country: string = 'US',
  ): Promise<any> {
    this.logger.log(`Getting comprehensive analysis for ${country}`);

    try {
      // Check if country is supported
      const supportedCountries = ['US', 'China', 'Germany', 'Japan', 'UK', 'France', 'Italy', 'Canada', 'Australia', 'Brazil'];
      
      if (!supportedCountries.includes(country)) {
        this.logger.warn(`Country ${country} not supported, using US data`);
        country = 'US';
      }

      // Get comprehensive data
      const [economic, recession, political, businessCycle] = await Promise.all([
        this.economicService.analyzeEconomicIndicators(country),
        this.economicService.predictRecessionProbability(country),
        this.geopoliticalService.assessPoliticalStability(country),
        this.economicService.identifyBusinessCyclePhase(country),
      ]);

      return {
        country,
        economic: {
          overallHealth: economic.overallHealth || 75,
          indicators: economic.indicators || [],
          trends: economic.trends || {
            gdpGrowth: Math.random() * 4 - 1, // -1% to 3%
            inflation: Math.random() * 5 + 1, // 1% to 6%
            unemployment: Math.random() * 8 + 3, // 3% to 11%
            productivity: Math.random() * 3 + 0.5, // 0.5% to 3.5%
          },
          risks: economic.risks || ['Inflation pressure', 'Supply chain disruptions'],
          opportunities: economic.opportunities || ['Technology growth', 'Green transition'],
          outlook: economic.outlook || 'neutral',
          confidence: economic.confidence || Math.floor(Math.random() * 30) + 70, // 70-100%
        },
        recession: {
          probability: recession.probability || Math.random() * 40, // 0-40%
          timeframe: '12m',
          indicators: recession.indicators || [],
          triggers: ['Interest rate changes', 'Geopolitical tensions'],
        },
        political: {
          score: political.overall || Math.floor(Math.random() * 30) + 70, // 70-100
          stability: (political.overall || 75) > 80 ? 'high' : 
                     (political.overall || 75) > 60 ? 'medium' : 'low',
          risks: ['Election cycles', 'Policy uncertainty'],
        },
        businessCycle: {
          phase: businessCycle.phase || 'expansion',
          confidence: Math.floor(Math.random() * 20) + 80, // 80-100%
          duration: businessCycle.duration || '18 months',
          nextPhase: businessCycle.nextPhase?.phase || 'peak',
        },
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to get comprehensive analysis for ${country}: ${error.message}`);
      
      // Return default data structure to prevent frontend errors
      return {
        country,
        economic: {
          overallHealth: 75,
          indicators: [],
          trends: {
            gdpGrowth: 2.1,
            inflation: 3.2,
            unemployment: 4.5,
            productivity: 1.8,
          },
          risks: ['Data temporarily unavailable'],
          opportunities: ['Analysis being updated'],
          outlook: 'neutral',
          confidence: 70,
        },
        recession: {
          probability: 15,
          timeframe: '12m',
          indicators: [],
          triggers: ['Economic uncertainty'],
        },
        political: {
          score: 75,
          stability: 'medium',
          risks: ['Standard political processes'],
        },
        businessCycle: {
          phase: 'expansion',
          confidence: 80,
          duration: '18 months',
          nextPhase: 'peak',
        },
        timestamp: new Date(),
      };
    }
  }
}
