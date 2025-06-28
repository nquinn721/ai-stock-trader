import { Injectable, Logger } from '@nestjs/common';
import {
  BusinessCyclePhase,
  EconomicAnalysis,
  EconomicIndicator,
  GDPForecast,
  InflationForecast,
  LaborMarketAnalysis,
  RecessionProbability,
} from '../interfaces/economic-intelligence.interface';

@Injectable()
export class EconomicIntelligenceService {
  private readonly logger = new Logger(EconomicIntelligenceService.name);

  /**
   * Analyze economic indicators for a specific country
   */
  async analyzeEconomicIndicators(country: string): Promise<EconomicAnalysis> {
    this.logger.log(`Analyzing economic indicators for ${country}`);

    // In Phase 1, we'll create sophisticated mock data that simulates real economic analysis
    const indicators = this.generateEconomicIndicators(country);

    return {
      country,
      region: this.getRegionForCountry(country),
      analysisDate: new Date(),
      indicators,
      gdpGrowth: {
        current: this.generateGDPGrowth(country),
        forecast: this.generateGDPForecast(country),
        trend: this.determineGDPTrend(country),
      },
      inflation: {
        current: this.generateCurrentInflation(country),
        forecast: this.generateInflationForecast(country),
        trend: this.determineInflationTrend(country),
      },
      employment: {
        unemploymentRate: this.generateUnemploymentRate(country),
        jobGrowth: this.generateJobGrowth(country),
        trend: this.determineEmploymentTrend(country),
      },
      overallAssessment: this.determineOverallAssessment(country),
      riskScore: this.calculateRiskScore(country),
      marketImpact: this.determineMarketImpact(country),
    };
  }

  /**
   * Predict inflation trends for a specific region
   */
  async predictInflationTrend(
    region: string,
    timeframe: string,
  ): Promise<InflationForecast> {
    this.logger.log(
      `Predicting inflation trend for ${region} over ${timeframe}`,
    );

    const currentInflation = this.generateCurrentInflation(region);
    const forecastInflation = this.generateInflationForecast(region);

    return {
      region,
      timeframe,
      currentInflation,
      forecastInflation,
      confidence: this.calculateInflationConfidence(region),
      factors: this.getInflationFactors(region),
      marketImpact: {
        bonds: this.determineInflationBondImpact(forecastInflation),
        stocks: this.determineInflationStockImpact(forecastInflation),
        currency: this.determineInflationCurrencyImpact(forecastInflation),
      },
      pressures: {
        wage: this.generateWagePressure(region),
        energy: this.generateEnergyPressure(region),
        housing: this.generateHousingPressure(region),
        supply: this.generateSupplyPressure(region),
      },
    };
  }

  /**
   * Forecast GDP growth for a specific country
   */
  async forecastGDPGrowth(country: string): Promise<GDPForecast> {
    this.logger.log(`Forecasting GDP growth for ${country}`);

    const currentGDP = this.generateCurrentGDP(country);
    const forecastGDP = this.generateGDPForecast(country);

    return {
      country,
      quarter: this.getCurrentQuarter(),
      currentGDP,
      forecastGDP,
      growthRate: ((forecastGDP - currentGDP) / currentGDP) * 100,
      confidence: this.calculateGDPConfidence(country),
      contributingFactors: {
        consumption: this.generateConsumptionContribution(country),
        investment: this.generateInvestmentContribution(country),
        government: this.generateGovernmentContribution(country),
        netExports: this.generateNetExportsContribution(country),
      },
      risks: this.getGDPRisks(country),
      marketImplications: this.getGDPMarketImplications(country),
    };
  }

  /**
   * Analyze labor market conditions for a region
   */
  async analyzeLaborMarket(region: string): Promise<LaborMarketAnalysis> {
    this.logger.log(`Analyzing labor market for ${region}`);

    return {
      region,
      unemployment: {
        current: this.generateUnemploymentRate(region),
        trend: this.determineEmploymentTrend(region),
        forecast: this.generateUnemploymentForecast(region),
      },
      jobGrowth: {
        monthly: this.generateMonthlyJobGrowth(region),
        annual: this.generateAnnualJobGrowth(region),
        sectors: this.generateSectorJobGrowth(region),
      },
      wages: {
        growth: this.generateWageGrowth(region),
        inflationAdjusted: this.generateRealWageGrowth(region),
        pressures: this.determineWagePressures(region),
      },
      participation: {
        rate: this.generateParticipationRate(region),
        trend: this.determineParticipationTrend(region),
      },
      marketImpact: this.determineLaborMarketImpact(region),
    };
  }

  /**
   * Identify current business cycle phase
   */
  async identifyBusinessCyclePhase(
    economy: string,
  ): Promise<BusinessCyclePhase> {
    this.logger.log(`Identifying business cycle phase for ${economy}`);

    const indicators = this.generateBusinessCycleIndicators(economy);
    const phase = this.determineBusinessCyclePhase(indicators);

    return {
      economy,
      phase,
      confidence: this.calculateBusinessCycleConfidence(indicators),
      duration: this.calculatePhaseDuration(economy, phase),
      indicators: {
        leading: indicators.filter((i) => i.name.includes('Leading')),
        coincident: indicators.filter((i) => i.name.includes('Coincident')),
        lagging: indicators.filter((i) => i.name.includes('Lagging')),
      },
      nextPhase: {
        predicted: this.predictNextPhase(phase),
        timeframe: this.estimatePhaseTransitionTime(phase),
        probability: this.calculateTransitionProbability(phase),
      },
    };
  }

  /**
   * Predict recession probability
   */
  async predictRecessionProbability(
    country: string,
  ): Promise<RecessionProbability> {
    this.logger.log(`Predicting recession probability for ${country}`);

    const indicators = this.generateRecessionIndicators(country);

    return {
      country,
      timeframe: '12m',
      probability: this.calculateRecessionProbabilityScore(indicators),
      indicators,
      triggers: this.identifyRecessionTriggers(country),
      severity: this.estimateRecessionSeverity(indicators),
    };
  }

  /**
   * Forecast inflation for a specific region and timeframe
   */
  async forecastInflation(
    region: string,
    timeframe: string,
  ): Promise<InflationForecast> {
    this.logger.log(`Forecasting inflation for ${region} over ${timeframe}`);
    return await this.predictInflationTrend(region, timeframe);
  }

  /**
   * Forecast GDP for a specific country
   */
  async forecastGDP(country: string, quarter?: string): Promise<GDPForecast> {
    this.logger.log(
      `Forecasting GDP for ${country}${quarter ? ` for ${quarter}` : ''}`,
    );
    return await this.forecastGDPGrowth(country);
  }

  /**
   * Analyze business cycle for a specific country
   */
  async analyzeBusinessCycle(country: string): Promise<BusinessCyclePhase> {
    this.logger.log(`Analyzing business cycle for ${country}`);
    return await this.identifyBusinessCyclePhase(country);
  }

  /**
   * Calculate recession probability for a specific country and timeframe
   */
  async calculateRecessionProbability(
    country: string,
    timeframe?: string,
  ): Promise<RecessionProbability> {
    this.logger.log(
      `Calculating recession probability for ${country}${timeframe ? ` over ${timeframe}` : ''}`,
    );
    return await this.predictRecessionProbability(country);
  }

  // Private helper methods for generating realistic economic data
  private generateEconomicIndicators(country: string): EconomicIndicator[] {
    const baseIndicators = [
      { name: 'GDP Growth Rate', importance: 'critical' as const },
      { name: 'Consumer Price Index', importance: 'critical' as const },
      { name: 'Unemployment Rate', importance: 'high' as const },
      { name: 'Consumer Confidence', importance: 'high' as const },
      { name: 'Manufacturing PMI', importance: 'high' as const },
      { name: 'Services PMI', importance: 'medium' as const },
      { name: 'Retail Sales', importance: 'medium' as const },
      { name: 'Industrial Production', importance: 'medium' as const },
    ];

    return baseIndicators.map((indicator, index) => ({
      ...indicator,
      value: this.generateIndicatorValue(indicator.name, country),
      previousValue: this.generatePreviousIndicatorValue(
        indicator.name,
        country,
      ),
      change: this.generateIndicatorChange(),
      changePercent: this.generateIndicatorChangePercent(),
      releaseDate: new Date(Date.now() - index * 7 * 24 * 60 * 60 * 1000), // Weekly releases
      nextReleaseDate: new Date(
        Date.now() + (7 - index) * 7 * 24 * 60 * 60 * 1000,
      ),
      unit: this.getIndicatorUnit(indicator.name),
      frequency: 'monthly' as const,
    }));
  }

  private generateIndicatorValue(name: string, country: string): number {
    // Generate realistic values based on indicator type and country
    const baseValue = Math.random();
    switch (name) {
      case 'GDP Growth Rate':
        return 1.5 + baseValue * 4; // 1.5% to 5.5%
      case 'Consumer Price Index':
        return 2.0 + baseValue * 6; // 2% to 8%
      case 'Unemployment Rate':
        return 3.0 + baseValue * 7; // 3% to 10%
      case 'Consumer Confidence':
        return 80 + baseValue * 40; // 80 to 120
      case 'Manufacturing PMI':
        return 45 + baseValue * 15; // 45 to 60
      case 'Services PMI':
        return 45 + baseValue * 15; // 45 to 60
      case 'Retail Sales':
        return -2 + baseValue * 8; // -2% to 6%
      case 'Industrial Production':
        return -1 + baseValue * 6; // -1% to 5%
      default:
        return baseValue * 100;
    }
  }

  private generatePreviousIndicatorValue(
    name: string,
    country: string,
  ): number {
    const currentValue = this.generateIndicatorValue(name, country);
    const changePercent = (Math.random() - 0.5) * 0.1; // ±5% change
    return currentValue * (1 - changePercent);
  }

  private generateIndicatorChange(): number {
    return (Math.random() - 0.5) * 2; // ±1 unit change
  }

  private generateIndicatorChangePercent(): number {
    return (Math.random() - 0.5) * 10; // ±5% change
  }

  private getIndicatorUnit(name: string): string {
    switch (name) {
      case 'GDP Growth Rate':
      case 'Consumer Price Index':
      case 'Unemployment Rate':
      case 'Retail Sales':
      case 'Industrial Production':
        return '%';
      case 'Consumer Confidence':
      case 'Manufacturing PMI':
      case 'Services PMI':
        return 'index';
      default:
        return 'units';
    }
  }

  private getRegionForCountry(country: string): string {
    const regions: { [key: string]: string } = {
      US: 'North America',
      CA: 'North America',
      GB: 'Europe',
      DE: 'Europe',
      FR: 'Europe',
      JP: 'Asia',
      CN: 'Asia',
      AU: 'Asia-Pacific',
    };
    return regions[country] || 'Global';
  }

  private generateGDPGrowth(country: string): number {
    return 1.5 + Math.random() * 4; // 1.5% to 5.5%
  }

  private generateGDPForecast(country: string): number {
    const current = this.generateGDPGrowth(country);
    return current + (Math.random() - 0.5) * 1; // ±0.5% variation
  }

  private determineGDPTrend(
    country: string,
  ): 'accelerating' | 'stable' | 'decelerating' {
    const trends = ['accelerating', 'stable', 'decelerating'] as const;
    return trends[Math.floor(Math.random() * trends.length)];
  }

  private generateCurrentInflation(country: string): number {
    return 2.0 + Math.random() * 6; // 2% to 8%
  }

  private generateInflationForecast(country: string): number {
    const current = this.generateCurrentInflation(country);
    return Math.max(0, current + (Math.random() - 0.5) * 2); // ±1% variation, minimum 0%
  }

  private determineInflationTrend(
    country: string,
  ): 'rising' | 'stable' | 'falling' {
    const trends = ['rising', 'stable', 'falling'] as const;
    return trends[Math.floor(Math.random() * trends.length)];
  }

  private generateUnemploymentRate(country: string): number {
    return 3.0 + Math.random() * 7; // 3% to 10%
  }

  private generateJobGrowth(country: string): number {
    return -50000 + Math.random() * 400000; // -50K to 350K jobs
  }

  private determineEmploymentTrend(
    country: string,
  ): 'improving' | 'stable' | 'deteriorating' {
    const trends = ['improving', 'stable', 'deteriorating'] as const;
    return trends[Math.floor(Math.random() * trends.length)];
  }

  private determineOverallAssessment(
    country: string,
  ): 'bullish' | 'neutral' | 'bearish' {
    const assessments = ['bullish', 'neutral', 'bearish'] as const;
    return assessments[Math.floor(Math.random() * assessments.length)];
  }

  private calculateRiskScore(country: string): number {
    return Math.floor(Math.random() * 100); // 0-100
  }

  private determineMarketImpact(
    country: string,
  ): 'positive' | 'neutral' | 'negative' {
    const impacts = ['positive', 'neutral', 'negative'] as const;
    return impacts[Math.floor(Math.random() * impacts.length)];
  }

  private calculateInflationConfidence(region: string): number {
    return 0.6 + Math.random() * 0.4; // 60% to 100%
  }

  private getInflationFactors(region: string): string[] {
    const factors = [
      'Energy price volatility',
      'Supply chain disruptions',
      'Labor market tightness',
      'Monetary policy stance',
      'Geopolitical tensions',
      'Consumer demand patterns',
    ];
    return factors.slice(0, 3 + Math.floor(Math.random() * 3));
  }

  private determineInflationBondImpact(
    inflation: number,
  ): 'positive' | 'negative' | 'neutral' {
    if (inflation > 4) return 'negative';
    if (inflation < 2) return 'positive';
    return 'neutral';
  }

  private determineInflationStockImpact(
    inflation: number,
  ): 'positive' | 'negative' | 'neutral' {
    if (inflation > 5) return 'negative';
    if (inflation < 3) return 'positive';
    return 'neutral';
  }

  private determineInflationCurrencyImpact(
    inflation: number,
  ): 'strengthening' | 'weakening' | 'neutral' {
    if (inflation > 4) return 'weakening';
    if (inflation < 2) return 'weakening';
    return 'strengthening';
  }

  private generateWagePressure(region: string): number {
    return Math.random() * 10; // 0-10 scale
  }

  private generateEnergyPressure(region: string): number {
    return Math.random() * 10;
  }

  private generateHousingPressure(region: string): number {
    return Math.random() * 10;
  }

  private generateSupplyPressure(region: string): number {
    return Math.random() * 10;
  }

  private generateCurrentGDP(country: string): number {
    return 20000 + Math.random() * 5000; // $20T to $25T (example for US)
  }

  private getCurrentQuarter(): string {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    return `Q${quarter} ${now.getFullYear()}`;
  }

  private calculateGDPConfidence(country: string): number {
    return 0.7 + Math.random() * 0.3; // 70% to 100%
  }

  private generateConsumptionContribution(country: string): number {
    return 60 + Math.random() * 20; // 60% to 80%
  }

  private generateInvestmentContribution(country: string): number {
    return 15 + Math.random() * 10; // 15% to 25%
  }

  private generateGovernmentContribution(country: string): number {
    return 15 + Math.random() * 10; // 15% to 25%
  }

  private generateNetExportsContribution(country: string): number {
    return -5 + Math.random() * 10; // -5% to 5%
  }

  private getGDPRisks(country: string): string[] {
    const risks = [
      'Trade tensions',
      'Geopolitical uncertainty',
      'Financial market volatility',
      'Supply chain disruptions',
      'Energy price shocks',
      'Policy uncertainty',
    ];
    return risks.slice(0, 2 + Math.floor(Math.random() * 3));
  }

  private getGDPMarketImplications(country: string): string[] {
    return [
      'Potential currency strengthening',
      'Increased equity valuations',
      'Higher bond yields',
      'Sector rotation opportunities',
    ];
  }

  private generateUnemploymentForecast(region: string): number {
    const current = this.generateUnemploymentRate(region);
    return Math.max(0, current + (Math.random() - 0.5) * 2);
  }

  private generateMonthlyJobGrowth(region: string): number {
    return -10000 + Math.random() * 50000; // -10K to 40K monthly
  }

  private generateAnnualJobGrowth(region: string): number {
    return this.generateMonthlyJobGrowth(region) * 12;
  }

  private generateSectorJobGrowth(region: string): {
    [sector: string]: number;
  } {
    return {
      Technology: Math.random() * 5,
      Healthcare: Math.random() * 4,
      Finance: Math.random() * 3,
      Manufacturing: Math.random() * 2,
      Retail: Math.random() * 1,
    };
  }

  private generateWageGrowth(region: string): number {
    return 2 + Math.random() * 4; // 2% to 6%
  }

  private generateRealWageGrowth(region: string): number {
    const nominal = this.generateWageGrowth(region);
    const inflation = this.generateCurrentInflation(region);
    return nominal - inflation;
  }

  private determineWagePressures(region: string): 'high' | 'medium' | 'low' {
    const pressures = ['high', 'medium', 'low'] as const;
    return pressures[Math.floor(Math.random() * pressures.length)];
  }

  private generateParticipationRate(region: string): number {
    return 60 + Math.random() * 10; // 60% to 70%
  }

  private determineParticipationTrend(
    region: string,
  ): 'increasing' | 'stable' | 'decreasing' {
    const trends = ['increasing', 'stable', 'decreasing'] as const;
    return trends[Math.floor(Math.random() * trends.length)];
  }

  private determineLaborMarketImpact(
    region: string,
  ): 'hawkish' | 'dovish' | 'neutral' {
    const impacts = ['hawkish', 'dovish', 'neutral'] as const;
    return impacts[Math.floor(Math.random() * impacts.length)];
  }

  private generateBusinessCycleIndicators(
    economy: string,
  ): EconomicIndicator[] {
    return [
      {
        name: 'Leading Economic Index',
        value: 95 + Math.random() * 10,
        previousValue: 94 + Math.random() * 10,
        change: Math.random() * 2 - 1,
        changePercent: Math.random() * 2 - 1,
        releaseDate: new Date(),
        importance: 'critical' as const,
        unit: 'index',
        frequency: 'monthly' as const,
      },
      {
        name: 'Coincident Economic Index',
        value: 97 + Math.random() * 6,
        previousValue: 96 + Math.random() * 6,
        change: Math.random() * 1 - 0.5,
        changePercent: Math.random() * 1 - 0.5,
        releaseDate: new Date(),
        importance: 'high' as const,
        unit: 'index',
        frequency: 'monthly' as const,
      },
      {
        name: 'Lagging Economic Index',
        value: 102 + Math.random() * 8,
        previousValue: 101 + Math.random() * 8,
        change: Math.random() * 1.5 - 0.75,
        changePercent: Math.random() * 1.5 - 0.75,
        releaseDate: new Date(),
        importance: 'medium' as const,
        unit: 'index',
        frequency: 'monthly' as const,
      },
    ];
  }

  private determineBusinessCyclePhase(
    indicators: EconomicIndicator[],
  ): 'expansion' | 'peak' | 'contraction' | 'trough' {
    const phases = ['expansion', 'peak', 'contraction', 'trough'] as const;
    return phases[Math.floor(Math.random() * phases.length)];
  }

  private calculateBusinessCycleConfidence(
    indicators: EconomicIndicator[],
  ): number {
    return 0.7 + Math.random() * 0.3;
  }

  private calculatePhaseDuration(
    economy: string,
    phase: 'expansion' | 'peak' | 'contraction' | 'trough',
  ): number {
    return Math.floor(Math.random() * 24) + 1; // 1-24 months
  }

  private predictNextPhase(
    current: 'expansion' | 'peak' | 'contraction' | 'trough',
  ): 'expansion' | 'peak' | 'contraction' | 'trough' {
    const transitions: {
      [key: string]: ('expansion' | 'peak' | 'contraction' | 'trough')[];
    } = {
      expansion: ['peak'],
      peak: ['contraction'],
      contraction: ['trough'],
      trough: ['expansion'],
    };
    return transitions[current][0];
  }

  private estimatePhaseTransitionTime(
    phase: 'expansion' | 'peak' | 'contraction' | 'trough',
  ): string {
    const months = Math.floor(Math.random() * 12) + 3; // 3-15 months
    return `${months} months`;
  }

  private calculateTransitionProbability(
    phase: 'expansion' | 'peak' | 'contraction' | 'trough',
  ): number {
    return 0.6 + Math.random() * 0.4; // 60% to 100%
  }

  private generateRecessionIndicators(
    country: string,
  ): RecessionProbability['indicators'] {
    return {
      yieldCurve: Math.random(),
      employment: Math.random(),
      leading: Math.random(),
      sentiment: Math.random(),
    };
  }

  private calculateRecessionProbabilityScore(
    indicators: RecessionProbability['indicators'],
  ): number {
    const weights = {
      yieldCurve: 0.3,
      employment: 0.25,
      leading: 0.25,
      sentiment: 0.2,
    };
    return Object.entries(indicators).reduce((sum, [key, value]) => {
      return sum + value * weights[key as keyof typeof weights];
    }, 0);
  }

  private identifyRecessionTriggers(country: string): string[] {
    const triggers = [
      'Inverted yield curve',
      'Rising unemployment',
      'Declining consumer confidence',
      'Credit tightening',
      'Geopolitical tensions',
      'Supply chain disruptions',
    ];
    return triggers.slice(0, 2 + Math.floor(Math.random() * 3));
  }

  private estimateRecessionSeverity(
    indicators: RecessionProbability['indicators'],
  ): 'mild' | 'moderate' | 'severe' {
    const avgScore =
      Object.values(indicators).reduce((a, b) => a + b, 0) /
      Object.keys(indicators).length;
    if (avgScore > 0.7) return 'severe';
    if (avgScore > 0.4) return 'moderate';
    return 'mild';
  }
}
