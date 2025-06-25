import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { MarketScannerService, BacktestResult } from './services/market-scanner.service';
import {
  ScanCriteriaDto,
  CreateScreenerTemplateDto,
  UpdateScreenerTemplateDto,
  CreateMarketAlertDto,
  UpdateMarketAlertDto,
  ScanRequestDto,
  BacktestRequestDto,
} from './dto/scanner.dto';
import {
  ScreenerTemplate,
  MarketAlert,
  ScanMatch,
} from './entities/scanner.entity';

@Controller('market-scanner')
export class MarketScannerController {
  private readonly logger = new Logger(MarketScannerController.name);

  constructor(private readonly marketScannerService: MarketScannerService) {}

  /**
   * Real-time market scan
   */
  @Post('scan')
  async scanMarket(@Body() scanRequest: ScanRequestDto): Promise<{
    success: boolean;
    data: ScanMatch[];
    message: string;
    timestamp: Date;
  }> {
    try {
      this.logger.log('Market scan request received');
      
      // Convert DTO to entity format for service layer
      const scanCriteria = scanRequest.toEntity();
      const matches = await this.marketScannerService.scanMarket(scanCriteria);

      // Save as template if requested
      if (scanRequest.saveAsTemplate && scanRequest.templateName) {
        await this.marketScannerService.createTemplate({
          name: scanRequest.templateName,
          criteria: scanCriteria,
          isPublic: false,
        });
      }

      return {
        success: true,
        data: matches,
        message: `Found ${matches.length} matching stocks`,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('Market scan failed:', error);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Market scan failed',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Quick scan with preset template
   */
  @Get('scan/preset/:templateId')
  async scanWithPreset(@Param('templateId') templateId: number): Promise<{
    success: boolean;
    data: ScanMatch[];
    template: ScreenerTemplate;
    message: string;
  }> {
    try {
      const templates = await this.marketScannerService.getTemplates();
      const template = templates.find(t => t.id === templateId);

      if (!template) {
        throw new HttpException(
          { success: false, message: 'Template not found' },
          HttpStatus.NOT_FOUND,
        );
      }

      const matches = await this.marketScannerService.scanMarket(template.criteria);

      // Update usage count
      template.usageCount += 1;
      await this.marketScannerService.createTemplate(template);

      return {
        success: true,
        data: matches,
        template,
        message: `Scan completed with template: ${template.name}`,
      };
    } catch (error) {
      this.logger.error('Preset scan failed:', error);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Preset scan failed',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all screener templates
   */
  @Get('templates')
  async getTemplates(@Query('public') isPublic?: string): Promise<{
    success: boolean;
    data: ScreenerTemplate[];
  }> {
    try {
      const publicFilter = isPublic === 'true' ? true : isPublic === 'false' ? false : undefined;
      const templates = await this.marketScannerService.getTemplates(publicFilter);

      return {
        success: true,
        data: templates,
      };
    } catch (error) {
      this.logger.error('Failed to fetch templates:', error);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch templates',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get preset templates
   */
  @Get('templates/presets')
  async getPresetTemplates(): Promise<{
    success: boolean;
    data: ScreenerTemplate[];
  }> {
    try {
      const presets = await this.marketScannerService.getPresetTemplates();

      return {
        success: true,
        data: presets,
      };
    } catch (error) {
      this.logger.error('Failed to fetch preset templates:', error);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch preset templates',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create new screener template
   */
  @Post('templates')
  async createTemplate(@Body() templateDto: CreateScreenerTemplateDto): Promise<{
    success: boolean;
    data: ScreenerTemplate;
    message: string;
  }> {
    try {
      const template = await this.marketScannerService.createTemplate(templateDto);

      return {
        success: true,
        data: template,
        message: 'Template created successfully',
      };
    } catch (error) {
      this.logger.error('Template creation failed:', error);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Template creation failed',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Update screener template
   */
  @Put('templates/:id')
  async updateTemplate(
    @Param('id') id: number,
    @Body() updateDto: UpdateScreenerTemplateDto,
  ): Promise<{
    success: boolean;
    data: ScreenerTemplate;
    message: string;
  }> {
    try {
      const updatedTemplate = await this.marketScannerService.updateTemplate(id, updateDto);

      if (!updatedTemplate) {
        throw new HttpException(
          { success: false, message: 'Template not found' },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        data: updatedTemplate,
        message: 'Template updated successfully',
      };
    } catch (error) {
      this.logger.error('Template update failed:', error);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Template update failed',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete screener template
   */
  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: number): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const deleted = await this.marketScannerService.deleteTemplate(id);

      if (!deleted) {
        throw new HttpException(
          { success: false, message: 'Template not found' },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        message: 'Template deleted successfully',
      };
    } catch (error) {
      this.logger.error('Template deletion failed:', error);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Template deletion failed',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get user alerts
   */
  @Get('alerts/user/:userId')
  async getUserAlerts(@Param('userId') userId: number): Promise<{
    success: boolean;
    data: MarketAlert[];
  }> {
    try {
      const alerts = await this.marketScannerService.getUserAlerts(userId);

      return {
        success: true,
        data: alerts,
      };
    } catch (error) {
      this.logger.error('Failed to fetch user alerts:', error);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Failed to fetch alerts',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create new market alert
   */
  @Post('alerts')
  async createAlert(@Body() alertDto: CreateMarketAlertDto): Promise<{
    success: boolean;
    data: MarketAlert;
    message: string;
  }> {
    try {
      const alert = await this.marketScannerService.createAlert(alertDto);

      return {
        success: true,
        data: alert,
        message: 'Alert created successfully',
      };
    } catch (error) {
      this.logger.error('Alert creation failed:', error);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Alert creation failed',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Update market alert
   */
  @Put('alerts/:id')
  async updateAlert(
    @Param('id') id: number,
    @Body() updateDto: UpdateMarketAlertDto,
  ): Promise<{
    success: boolean;
    data: MarketAlert;
    message: string;
  }> {
    try {
      const updatedAlert = await this.marketScannerService.updateAlert(id, updateDto);

      if (!updatedAlert) {
        throw new HttpException(
          { success: false, message: 'Alert not found' },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        data: updatedAlert,
        message: 'Alert updated successfully',
      };
    } catch (error) {
      this.logger.error('Alert update failed:', error);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Alert update failed',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete market alert
   */
  @Delete('alerts/:id')
  async deleteAlert(@Param('id') id: number): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const deleted = await this.marketScannerService.deleteAlert(id);

      if (!deleted) {
        throw new HttpException(
          { success: false, message: 'Alert not found' },
          HttpStatus.NOT_FOUND,
        );
      }

      return {
        success: true,
        message: 'Alert deleted successfully',
      };
    } catch (error) {
      this.logger.error('Alert deletion failed:', error);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Alert deletion failed',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Backtest screener performance
   */
  @Post('backtest')
  async backtestScreener(@Body() backtestDto: BacktestRequestDto): Promise<{
    success: boolean;
    data: BacktestResult;
    message: string;
  }> {
    try {
      const scanCriteria = backtestDto.criteria.toEntity();
      const result = await this.marketScannerService.backtestScreener(
        scanCriteria,
        backtestDto.startDate,
        backtestDto.endDate,
      );

      return {
        success: true,
        data: result,
        message: 'Backtest completed successfully',
      };
    } catch (error) {
      this.logger.error('Backtest failed:', error);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Backtest failed',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Export scan results to CSV
   */
  @Post('export')
  async exportResults(@Body() scanRequest: ScanRequestDto): Promise<{
    success: boolean;
    data: string;
    message: string;
  }> {
    try {
      const scanCriteria = scanRequest.toEntity();
      const matches = await this.marketScannerService.scanMarket(scanCriteria);

      // Generate CSV content
      const headers = ['Symbol', 'Name', 'Price', 'Volume', 'Market Cap', 'Match Strength', 'Criteria Met'];
      const csvContent = [
        headers.join(','),
        ...matches.map(match => [
          match.symbol,
          `"${match.name}"`,
          match.price,
          match.volume,
          match.marketCap || '',
          match.matchStrength,
          `"${match.criteriaMet.join('; ')}"`,
        ].join(',')),
      ].join('\n');

      return {
        success: true,
        data: csvContent,
        message: `Exported ${matches.length} results`,
      };
    } catch (error) {
      this.logger.error('Export failed:', error);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Export failed',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get scanner health status
   */
  @Get('status')
  async getStatus(): Promise<{
    success: boolean;
    data: {
      isScanning: boolean;
      lastScanTime: Date | null;
      activeAlerts: number;
      availableTemplates: number;
    };
  }> {
    try {
      const templates = await this.marketScannerService.getTemplates();
      
      return {
        success: true,
        data: {
          isScanning: false, // TODO: Get actual scanning status
          lastScanTime: null, // TODO: Get actual last scan time
          activeAlerts: 0, // TODO: Get actual active alerts count
          availableTemplates: templates.length,
        },
      };
    } catch (error) {
      this.logger.error('Status check failed:', error);
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Status check failed',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
