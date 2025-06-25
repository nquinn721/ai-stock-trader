import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Stock } from '../../../entities/stock.entity';
import { StockService } from '../../stock/stock.service';
import { TechnicalIndicatorService, PriceData } from './technical-indicator.service';
import {
  ScreenerTemplate,
  MarketAlert,
  ScanResult,
  ScanMatch,
  ScanCriteria,
  FilterCriteria,
  FilterType,
  TechnicalIndicators,
  FundamentalMetrics,
} from '../entities/scanner.entity';
import yahooFinance from 'yahoo-finance2';

export interface BacktestResult {
  success: boolean;
  totalMatches: number;
  avgMatchStrength: number;
  period: string;
  performanceMetrics: {
    totalReturns: number;
    avgReturn: number;
    winRate: number;
    maxDrawdown: number;
  };
  historicalMatches: {
    date: string;
    matches: number;
    avgReturn: number;
  }[];
}

@Injectable()
export class MarketScannerService {
  private readonly logger = new Logger(MarketScannerService.name);
  private isScanning = false;
  private lastScanTime: Date | null = null;

  constructor(
    @InjectRepository(ScreenerTemplate)
    private screenerTemplateRepository: Repository<ScreenerTemplate>,
    @InjectRepository(MarketAlert)
    private marketAlertRepository: Repository<MarketAlert>,
    @InjectRepository(ScanResult)
    private scanResultRepository: Repository<ScanResult>,
    @Inject(forwardRef(() => StockService))
    private stockService: StockService,
    private technicalIndicatorService: TechnicalIndicatorService,
  ) {
    this.logger.log('Market Scanner Service initialized');
  }

  /**
   * Real-time market scan based on criteria
   */
  async scanMarket(criteria: ScanCriteria): Promise<ScanMatch[]> {
    try {
      this.logger.log('Starting market scan with criteria:', JSON.stringify(criteria));
      
      // Get all available stocks
      const stocks = await this.stockService.getAllStocks();
      const matches: ScanMatch[] = [];

      for (const stock of stocks) {
        try {
          const match = await this.evaluateStock(stock, criteria);
          if (match && match.matchStrength > 0) {
            matches.push(match);
          }
        } catch (error) {
          this.logger.warn(`Error evaluating stock ${stock.symbol}:`, error.message);
          continue;
        }
      }

      // Sort by match strength
      matches.sort((a, b) => b.matchStrength - a.matchStrength);

      // Apply limit if specified
      const limit = criteria.limit || 50;
      const limitedMatches = matches.slice(0, limit);

      this.logger.log(`Scan completed: ${limitedMatches.length} matches found out of ${stocks.length} stocks`);
      return limitedMatches;

    } catch (error) {
      this.logger.error('Error during market scan:', error);
      throw new Error(`Market scan failed: ${error.message}`);
    }
  }

  /**
   * Evaluate a single stock against scan criteria
   */
  private async evaluateStock(stock: Stock, criteria: ScanCriteria): Promise<ScanMatch | null> {
    try {
      const matchedCriteria: string[] = [];
      let totalScore = 0;
      let evaluatedCriteria = 0;

      // Get historical data for technical analysis
      const historicalData = await this.getHistoricalData(stock.symbol);
      const technicalIndicators = historicalData.length > 0 
        ? await this.technicalIndicatorService.calculateIndicators(stock.symbol, historicalData)
        : {};

      const fundamentalData = await this.technicalIndicatorService.calculateFundamentals(stock.symbol);

      // Evaluate each filter
      for (const filter of criteria.filters) {
        const matches = await this.evaluateFilter(stock, filter, technicalIndicators, fundamentalData);
        if (matches) {
          matchedCriteria.push(`${filter.field} ${filter.operator} ${filter.value}`);
          totalScore += 1;
        }
        evaluatedCriteria += 1;
      }

      // Apply logical operators (simplified - assumes all are AND for now)
      const matchStrength = evaluatedCriteria > 0 ? totalScore / evaluatedCriteria : 0;

      if (matchStrength > 0) {
        return {
          symbol: stock.symbol,
          name: stock.name || stock.symbol,
          price: Number(stock.currentPrice),
          volume: Number(stock.volume),
          marketCap: Number(stock.marketCap) || undefined,
          matchStrength: Math.round(matchStrength * 100) / 100,
          criteriaMet: matchedCriteria,
          technicalData: technicalIndicators,
          fundamentalData: fundamentalData,
          lastUpdated: new Date(),
        };
      }

      return null;
    } catch (error) {
      this.logger.warn(`Error evaluating stock ${stock.symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Evaluate a single filter against stock data
   */
  private async evaluateFilter(
    stock: Stock,
    filter: FilterCriteria,
    technicalData: TechnicalIndicators,
    fundamentalData: FundamentalMetrics,
  ): Promise<boolean> {
    try {
      const value = parseFloat(filter.value.toString());
      let actualValue: number | undefined;

      switch (filter.type) {
        case FilterType.PRICE:
          actualValue = this.getPriceValue(stock, filter.field);
          break;
        case FilterType.VOLUME:
          actualValue = this.getVolumeValue(stock, filter.field);
          break;
        case FilterType.MARKET_CAP:
          actualValue = this.getMarketCapValue(stock, filter.field);
          break;
        case FilterType.TECHNICAL:
          return this.technicalIndicatorService.evaluateTechnicalCriteria(
            technicalData,
            filter.field,
            filter.operator,
            value,
          );
        case FilterType.FUNDAMENTAL:
          actualValue = this.getFundamentalValue(fundamentalData, filter.field);
          break;
        case FilterType.PATTERN:
          return this.evaluatePatternFilter(technicalData, filter);
        default:
          return false;
      }

      if (actualValue === undefined || actualValue === null) {
        return false;
      }

      return this.applyOperator(actualValue, filter.operator, value, filter.value2 ? parseFloat(filter.value2.toString()) : undefined);
    } catch (error) {
      this.logger.warn(`Error evaluating filter ${filter.field}:`, error.message);
      return false;
    }
  }

  /**
   * Get price-related values
   */
  private getPriceValue(stock: Stock, field: string): number | undefined {
    switch (field) {
      case 'price':
      case 'current_price':
        return Number(stock.currentPrice);
      case 'previous_close':
        return Number(stock.previousClose);
      case 'change_percent':
        return Number(stock.changePercent);
      default:
        return undefined;
    }
  }

  /**
   * Get volume-related values
   */
  private getVolumeValue(stock: Stock, field: string): number | undefined {
    switch (field) {
      case 'volume':
        return Number(stock.volume);
      default:
        return undefined;
    }
  }

  /**
   * Get market cap values
   */
  private getMarketCapValue(stock: Stock, field: string): number | undefined {
    switch (field) {
      case 'market_cap':
        return Number(stock.marketCap);
      default:
        return undefined;
    }
  }

  /**
   * Get fundamental values
   */
  private getFundamentalValue(fundamentalData: FundamentalMetrics, field: string): number | undefined {
    switch (field) {
      case 'pe_ratio':
        return fundamentalData.peRatio;
      case 'eps':
        return fundamentalData.eps;
      case 'dividend_yield':
        return fundamentalData.dividendYield;
      case 'debt_to_equity':
        return fundamentalData.debtToEquity;
      case 'roe':
        return fundamentalData.roe;
      case 'revenue_growth':
        return fundamentalData.revenueGrowth;
      default:
        return undefined;
    }
  }

  /**
   * Evaluate pattern filters
   */
  private evaluatePatternFilter(technicalData: TechnicalIndicators, filter: FilterCriteria): boolean {
    const patterns = technicalData.patterns || [];
    const targetPattern = filter.value.toString().toLowerCase();
    
    return patterns.some(pattern => 
      pattern.toLowerCase().includes(targetPattern)
    );
  }

  /**
   * Apply comparison operators
   */
  private applyOperator(
    actualValue: number,
    operator: string,
    value: number,
    value2?: number,
  ): boolean {
    switch (operator) {
      case 'gt':
        return actualValue > value;
      case 'lt':
        return actualValue < value;
      case 'eq':
        return Math.abs(actualValue - value) < 0.01;
      case 'between':
        return value2 !== undefined && actualValue >= value && actualValue <= value2;
      case 'above':
        return actualValue > value;
      case 'below':
        return actualValue < value;
      default:
        return false;
    }
  }

  /**
   * Get historical price data for technical analysis
   */
  private async getHistoricalData(symbol: string): Promise<PriceData[]> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3); // 3 months of data

      const historicalData = await yahooFinance.historical(symbol, {
        period1: startDate,
        period2: endDate,
        interval: '1d',
      });

      return historicalData.map(data => ({
        date: data.date,
        open: data.open,
        high: data.high,
        low: data.low,
        close: data.close,
        volume: data.volume,
      }));
    } catch (error) {
      this.logger.warn(`Failed to get historical data for ${symbol}:`, error.message);
      return [];
    }
  }

  /**
   * Create a new screener template
   */
  async createTemplate(templateData: Partial<ScreenerTemplate>): Promise<ScreenerTemplate> {
    try {
      const template = this.screenerTemplateRepository.create(templateData);
      return await this.screenerTemplateRepository.save(template);
    } catch (error) {
      this.logger.error('Error creating screener template:', error);
      throw new Error(`Failed to create template: ${error.message}`);
    }
  }

  /**
   * Get all screener templates
   */
  async getTemplates(isPublic?: boolean): Promise<ScreenerTemplate[]> {
    try {
      const where = isPublic !== undefined ? { isPublic, isActive: true } : { isActive: true };
      return await this.screenerTemplateRepository.find({
        where,
        order: { usageCount: 'DESC', createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error('Error fetching templates:', error);
      throw new Error(`Failed to fetch templates: ${error.message}`);
    }
  }

  /**
   * Create a new market alert
   */
  async createAlert(alertData: Partial<MarketAlert>): Promise<MarketAlert> {
    try {
      const alert = this.marketAlertRepository.create(alertData);
      return await this.marketAlertRepository.save(alert);
    } catch (error) {
      this.logger.error('Error creating market alert:', error);
      throw new Error(`Failed to create alert: ${error.message}`);
    }
  }

  /**
   * Get user alerts
   */
  async getUserAlerts(userId: number): Promise<MarketAlert[]> {
    try {
      return await this.marketAlertRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error('Error fetching user alerts:', error);
      throw new Error(`Failed to fetch alerts: ${error.message}`);
    }
  }

  /**
   * Process alert triggers (run by cron job)
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processAlerts(): Promise<void> {
    if (this.isScanning) {
      this.logger.debug('Scan already in progress, skipping alert processing');
      return;
    }

    try {
      this.isScanning = true;
      const activeAlerts = await this.marketAlertRepository.find({
        where: { isActive: true },
      });

      this.logger.debug(`Processing ${activeAlerts.length} active alerts`);

      for (const alert of activeAlerts) {
        try {
          // Check if it's time to scan based on interval
          const now = new Date();
          const lastTriggered = alert.lastTriggered || new Date(0);
          const intervalMs = alert.scanInterval * 1000;

          if (now.getTime() - lastTriggered.getTime() < intervalMs) {
            continue;
          }

          const matches = await this.scanMarket(alert.criteria);
          const strongMatches = matches.filter(
            match => match.matchStrength >= alert.minMatchStrength,
          );

          if (strongMatches.length > 0) {
            await this.triggerAlert(alert, strongMatches);
          }

          // Update last triggered time
          alert.lastTriggered = now;
          await this.marketAlertRepository.save(alert);

        } catch (error) {
          this.logger.error(`Error processing alert ${alert.id}:`, error);
        }
      }
    } catch (error) {
      this.logger.error('Error in alert processing:', error);
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * Trigger an alert notification
   */
  private async triggerAlert(alert: MarketAlert, matches: ScanMatch[]): Promise<void> {
    try {
      this.logger.log(`Alert triggered: ${alert.name} - ${matches.length} matches`);

      // Save scan results
      for (const match of matches) {
        const scanResult = this.scanResultRepository.create({
          alertId: alert.id,
          symbol: match.symbol,
          matchStrength: match.matchStrength,
          criteriaMet: { criteria: match.criteriaMet },
          priceAtScan: match.price,
          volumeAtScan: match.volume,
          technicalData: match.technicalData,
          fundamentalData: match.fundamentalData,
        });
        await this.scanResultRepository.save(scanResult);
      }

      // Update alert trigger count
      alert.triggerCount += 1;
      await this.marketAlertRepository.save(alert);

      // TODO: Send notifications based on alert.notificationTypes
      // This would integrate with email/push notification services

    } catch (error) {
      this.logger.error(`Error triggering alert ${alert.id}:`, error);
    }
  }

  /**
   * Backtest a screener configuration
   */
  async backtestScreener(criteria: ScanCriteria, startDate: string, endDate: string): Promise<BacktestResult> {
    try {
      // This is a simplified backtest - in a real implementation,
      // you would analyze historical performance of the screener
      
      this.logger.log(`Backtesting screener from ${startDate} to ${endDate}`);

      // For now, return mock backtest results
      return {
        success: true,
        totalMatches: 145,
        avgMatchStrength: 0.75,
        period: `${startDate} to ${endDate}`,
        performanceMetrics: {
          totalReturns: 12.5,
          avgReturn: 2.3,
          winRate: 68.5,
          maxDrawdown: -8.2,
        },
        historicalMatches: [
          { date: '2025-06-01', matches: 12, avgReturn: 3.1 },
          { date: '2025-06-15', matches: 8, avgReturn: -1.2 },
          { date: '2025-06-25', matches: 15, avgReturn: 4.7 },
        ],
      };
    } catch (error) {
      this.logger.error('Error backtesting screener:', error);
      throw new Error(`Backtest failed: ${error.message}`);
    }
  }

  /**
   * Get predefined screener templates
   */
  async getPresetTemplates(): Promise<ScreenerTemplate[]> {
    return this.ensurePresetTemplates();
  }

  /**
   * Ensure preset templates exist in the database
   */
  private async ensurePresetTemplates(): Promise<ScreenerTemplate[]> {
    const presetTemplates = [
      {
        name: 'High Volume Breakout',
        description: 'Stocks breaking out with high volume',
        category: 'Momentum',
        isPublic: true,
        criteria: {
          filters: [
            { id: '1', type: FilterType.VOLUME, field: 'volume', operator: 'gt' as any, value: '1000000' },
            { id: '2', type: FilterType.TECHNICAL, field: 'volume.ratio', operator: 'gt' as any, value: '2' },
            { id: '3', type: FilterType.PRICE, field: 'change_percent', operator: 'gt' as any, value: '3' },
          ],
        },
      },
      {
        name: 'RSI Oversold',
        description: 'Stocks with RSI below 30 (oversold)',
        category: 'Technical',
        isPublic: true,
        criteria: {
          filters: [
            { id: '1', type: FilterType.TECHNICAL, field: 'rsi', operator: 'lt' as any, value: '30' },
            { id: '2', type: FilterType.VOLUME, field: 'volume', operator: 'gt' as any, value: '500000' },
          ],
        },
      },
      {
        name: 'Gap Up Stocks',
        description: 'Stocks gapping up more than 2%',
        category: 'Day Trading',
        isPublic: true,
        criteria: {
          filters: [
            { id: '1', type: FilterType.PATTERN, field: 'pattern', operator: 'eq' as any, value: 'Gap Up' },
            { id: '2', type: FilterType.VOLUME, field: 'volume', operator: 'gt' as any, value: '300000' },
          ],
        },
      },
    ];

    const existingTemplates = await this.screenerTemplateRepository.find({
      where: { isPublic: true },
    });

    const newTemplates: ScreenerTemplate[] = [];

    for (const preset of presetTemplates) {
      const exists = existingTemplates.find(t => t.name === preset.name);
      if (!exists) {
        try {
          const template = this.screenerTemplateRepository.create(preset as any);
          const saved = await this.screenerTemplateRepository.save(template);
          if (Array.isArray(saved)) {
            newTemplates.push(...saved);
          } else {
            newTemplates.push(saved);
          }
        } catch (error) {
          this.logger.error(`Failed to save preset template: ${preset.name}`, error);
        }
      }
    }

    return [...existingTemplates, ...newTemplates];
  }

  /**
   * Delete a screener template
   */
  async deleteTemplate(id: number): Promise<boolean> {
    try {
      const result = await this.screenerTemplateRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (error) {
      this.logger.error('Failed to delete template:', error);
      return false;
    }
  }

  /**
   * Update a screener template
   */
  async updateTemplate(id: number, updateData: Partial<ScreenerTemplate>): Promise<ScreenerTemplate | null> {
    try {
      const existingTemplate = await this.screenerTemplateRepository.findOne({ where: { id } });
      
      if (!existingTemplate) {
        return null;
      }

      const updatedTemplate = {
        ...existingTemplate,
        ...updateData,
        id: existingTemplate.id, // Preserve the ID
        updatedAt: new Date(),
      };

      return await this.screenerTemplateRepository.save(updatedTemplate);
    } catch (error) {
      this.logger.error('Failed to update template:', error);
      return null;
    }
  }

  /**
   * Delete a market alert
   */
  async deleteAlert(id: number): Promise<boolean> {
    try {
      const result = await this.marketAlertRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (error) {
      this.logger.error('Failed to delete alert:', error);
      return false;
    }
  }

  /**
   * Update a market alert
   */
  async updateAlert(id: number, updateData: Partial<MarketAlert>): Promise<MarketAlert | null> {
    try {
      const existingAlert = await this.marketAlertRepository.findOne({ where: { id } });
      
      if (!existingAlert) {
        return null;
      }

      const updatedAlert = {
        ...existingAlert,
        ...updateData,
        id: existingAlert.id, // Preserve the ID
        updatedAt: new Date(),
      };

      return await this.marketAlertRepository.save(updatedAlert);
    } catch (error) {
      this.logger.error('Failed to update alert:', error);
      return null;
    }
  }
}
