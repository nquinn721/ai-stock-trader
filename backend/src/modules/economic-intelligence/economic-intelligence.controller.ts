import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Query,
} from '@nestjs/common';
import { EconomicIntelligenceService } from './services/economic-intelligence.service';
import { MonetaryPolicyService } from './services/monetary-policy.service';
// import { GeopoliticalAnalysisService } from './services/geopolitical-analysis.service';
import { EconomicAnalysis } from './interfaces/economic-intelligence.interface';

@Controller('economic-intelligence')
export class EconomicIntelligenceController {
  private readonly logger = new Logger(EconomicIntelligenceController.name);

  constructor(
    private readonly economicIntelligenceService: EconomicIntelligenceService,
    private readonly monetaryPolicyService: MonetaryPolicyService,
    // private readonly geopoliticalAnalysisService: GeopoliticalAnalysisService,
  ) {}

  @Get('economic-indicators')
  async getEconomicIndicators(
    @Query('country') country: string = 'US',
  ): Promise<EconomicAnalysis> {
    try {
      this.logger.log(`Fetching economic indicators for ${country}`);
      return await this.economicIntelligenceService.analyzeEconomicIndicators(
        country,
      );
    } catch (error) {
      this.logger.error(
        `Failed to fetch economic indicators for ${country}: ${error.message}`,
      );
      throw new HttpException(
        'Failed to fetch economic indicators',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('inflation-forecast')
  async getInflationForecast(
    @Query('region') region: string = 'US',
    @Query('timeframe') timeframe: string = '12M',
  ) {
    try {
      this.logger.log(
        `Fetching inflation forecast for ${region} over ${timeframe}`,
      );
      return await this.economicIntelligenceService.forecastInflation(
        region,
        timeframe,
      );
    } catch (error) {
      this.logger.error(`Failed to fetch inflation forecast: ${error.message}`);
      throw new HttpException(
        'Failed to fetch inflation forecast',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('gdp-forecast')
  async getGDPForecast(
    @Query('country') country: string = 'US',
    @Query('quarter') quarter?: string,
  ) {
    try {
      this.logger.log(`Fetching GDP forecast for ${country}`);
      return await this.economicIntelligenceService.forecastGDP(
        country,
        quarter,
      );
    } catch (error) {
      this.logger.error(`Failed to fetch GDP forecast: ${error.message}`);
      throw new HttpException(
        'Failed to fetch GDP forecast',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('business-cycle')
  async getBusinessCycleAnalysis(@Query('country') country: string = 'US') {
    try {
      this.logger.log(`Analyzing business cycle for ${country}`);
      return await this.economicIntelligenceService.analyzeBusinessCycle(
        country,
      );
    } catch (error) {
      this.logger.error(`Failed to analyze business cycle: ${error.message}`);
      throw new HttpException(
        'Failed to analyze business cycle',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('recession-probability')
  async getRecessionProbability(
    @Query('country') country: string = 'US',
    @Query('timeframe') timeframe: string = '12M',
  ) {
    try {
      this.logger.log(`Calculating recession probability for ${country}`);
      return await this.economicIntelligenceService.calculateRecessionProbability(
        country,
        timeframe,
      );
    } catch (error) {
      this.logger.error(
        `Failed to calculate recession probability: ${error.message}`,
      );
      throw new HttpException(
        'Failed to calculate recession probability',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('monetary-policy/fed-communication')
  async getFedCommunicationAnalysis() {
    try {
      this.logger.log('Analyzing Fed communication');
      const speeches = await this.monetaryPolicyService.getRecentFedSpeeches();
      return await this.monetaryPolicyService.analyzeFedCommunication(speeches);
    } catch (error) {
      this.logger.error(
        `Failed to analyze Fed communication: ${error.message}`,
      );
      throw new HttpException(
        'Failed to analyze Fed communication',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('monetary-policy/rate-prediction')
  async getRateDecisionPrediction(@Query('meetingDate') meetingDate?: string) {
    try {
      const date = meetingDate
        ? new Date(meetingDate)
        : this.getNextFOMCMeeting();
      this.logger.log(`Predicting rate decision for ${date.toISOString()}`);
      return await this.monetaryPolicyService.predictInterestRateDecision(date);
    } catch (error) {
      this.logger.error(`Failed to predict rate decision: ${error.message}`);
      throw new HttpException(
        'Failed to predict rate decision',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('monetary-policy/qe-assessment')
  async getQEProbabilityAssessment() {
    try {
      this.logger.log('Assessing QE probability');
      return await this.monetaryPolicyService.assessQEProbability(
        'Federal Reserve',
      );
    } catch (error) {
      this.logger.error(`Failed to assess QE probability: ${error.message}`);
      throw new HttpException(
        'Failed to assess QE probability',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /*
  @Get('geopolitical/risk-assessment')
  async getGeopoliticalRiskAssessment(
    @Query('region') region?: string,
  ) {
    try {
      this.logger.log(`Assessing geopolitical risks${region ? ` for ${region}` : ''}`);
      return await this.geopoliticalAnalysisService.assessGeopoliticalRisks(region);
    } catch (error) {
      this.logger.error(`Failed to assess geopolitical risks: ${error.message}`);
      throw new HttpException(
        'Failed to assess geopolitical risks',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('geopolitical/trade-impact')
  async getTradeWarImpact() {
    try {
      this.logger.log('Analyzing trade war impact');
      return await this.geopoliticalAnalysisService.analyzeTradeWarImpactComprehensive();
    } catch (error) {
      this.logger.error(`Failed to analyze trade war impact: ${error.message}`);
      throw new HttpException(
        'Failed to analyze trade war impact',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('geopolitical/sanctions-impact')
  async getSanctionsImpact(
    @Query('country') country?: string,
  ) {
    try {
      this.logger.log(`Analyzing sanctions impact${country ? ` for ${country}` : ''}`);
      return await this.geopoliticalAnalysisService.analyzeSanctionsImpact(country);
    } catch (error) {
      this.logger.error(`Failed to analyze sanctions impact: ${error.message}`);
      throw new HttpException(
        'Failed to analyze sanctions impact',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  */

  @Post('comprehensive-analysis')
  async getComprehensiveAnalysis(
    @Body()
    params: {
      countries?: string[];
      regions?: string[];
      includeGeopolitical?: boolean;
      includeMonetaryPolicy?: boolean;
      timeframe?: string;
    },
  ) {
    try {
      this.logger.log('Generating comprehensive economic analysis');

      const {
        countries = ['US', 'EU', 'CN', 'JP'],
        regions = ['North America', 'Europe', 'Asia'],
        includeGeopolitical = true,
        includeMonetaryPolicy = true,
        timeframe = '12M',
      } = params;

      const economicAnalyses = await Promise.all(
        countries.map((country) =>
          this.economicIntelligenceService.analyzeEconomicIndicators(country),
        ),
      );

      /*
      const geopoliticalRisks = includeGeopolitical
        ? await Promise.all(
            regions.map(region =>
              this.geopoliticalAnalysisService.assessGeopoliticalRisks(region)
            )
          )
        : [];
      */
      const geopoliticalRisks = [];

      const monetaryPolicyAnalysis = includeMonetaryPolicy
        ? {
            fedCommunication: await this.getFedCommunicationAnalysis(),
            rateDecision: await this.getRateDecisionPrediction(),
            qeAssessment: await this.getQEProbabilityAssessment(),
          }
        : null;

      return {
        analysisDate: new Date(),
        timeframe,
        economicAnalyses,
        geopoliticalRisks,
        monetaryPolicyAnalysis,
        overallRiskScore: this.calculateOverallRiskScore(
          economicAnalyses,
          geopoliticalRisks,
        ),
        marketOutlook: this.generateMarketOutlook(
          economicAnalyses,
          geopoliticalRisks,
          monetaryPolicyAnalysis,
        ),
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate comprehensive analysis: ${error.message}`,
      );
      throw new HttpException(
        'Failed to generate comprehensive analysis',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private getNextFOMCMeeting(): Date {
    const now = new Date();
    const nextMeeting = new Date(now);
    nextMeeting.setMonth(nextMeeting.getMonth() + 1);
    nextMeeting.setDate(15);
    return nextMeeting;
  }

  private calculateOverallRiskScore(
    economicAnalyses: EconomicAnalysis[],
    geopoliticalRisks: any[], // GeopoliticalRiskAssessment[],
  ): number {
    const avgEconomicRisk =
      economicAnalyses.reduce((sum, analysis) => sum + analysis.riskScore, 0) /
      economicAnalyses.length;

    const avgGeopoliticalRisk =
      geopoliticalRisks.length > 0
        ? geopoliticalRisks.reduce((sum, risk) => sum + risk.overallRisk, 0) /
          geopoliticalRisks.length
        : 0;

    return Math.round((avgEconomicRisk + avgGeopoliticalRisk) / 2);
  }

  private generateMarketOutlook(
    economicAnalyses: EconomicAnalysis[],
    geopoliticalRisks: any[],
    monetaryPolicyAnalysis: any,
  ): string {
    const bullishCount = economicAnalyses.filter(
      (analysis) => analysis.overallAssessment === 'bullish',
    ).length;

    const bearishCount = economicAnalyses.filter(
      (analysis) => analysis.overallAssessment === 'bearish',
    ).length;

    if (bullishCount > bearishCount) {
      return 'Positive market outlook with supportive economic fundamentals';
    } else if (bearishCount > bullishCount) {
      return 'Cautious market outlook due to economic headwinds';
    } else {
      return 'Mixed market outlook with balanced economic indicators';
    }
  }
}
