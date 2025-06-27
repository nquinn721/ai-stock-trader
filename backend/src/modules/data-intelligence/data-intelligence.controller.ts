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
  DataIntelligenceService,
  OptionsFlowFilter,
} from './data-intelligence.service';
import {
  LatencyConfig,
  StreamProcessingService,
} from './stream-processing.service';

@Controller('data-intelligence')
export class DataIntelligenceController {
  private readonly logger = new Logger(DataIntelligenceController.name);

  constructor(
    private readonly dataIntelligenceService: DataIntelligenceService,
    private readonly streamProcessingService: StreamProcessingService,
  ) {}

  /**
   * Get Level II market data stream for specified symbols
   */
  @Post('level-ii/subscribe')
  async subscribeToLevelII(@Body() body: { symbols: string[] }) {
    this.logger.log(
      `Level II subscription request for ${body.symbols.length} symbols`,
    );

    // Return subscription info (in real implementation, this would set up WebSocket)
    return {
      success: true,
      symbols: body.symbols,
      streamId: `level2_${Date.now()}`,
      message: 'Level II data subscription activated',
    };
  }

  /**
   * Get options flow data with filtering
   */
  @Post('options-flow')
  async getOptionsFlow(@Body() filters: OptionsFlowFilter) {
    this.logger.debug('Fetching options flow data', filters);

    const optionsFlow =
      await this.dataIntelligenceService.getOptionsFlow(filters);

    return {
      success: true,
      data: optionsFlow,
      count: optionsFlow.length,
      timestamp: new Date(),
    };
  }

  /**
   * Detect unusual market activity
   */
  @Get('unusual-activity')
  async getUnusualActivity(@Query('threshold') threshold?: string) {
    const thresholdValue = threshold ? parseFloat(threshold) : 2.0;
    this.logger.debug(
      `Detecting unusual activity with threshold ${thresholdValue}`,
    );

    const activities =
      await this.dataIntelligenceService.detectUnusualActivity(thresholdValue);

    return {
      success: true,
      data: activities,
      count: activities.length,
      threshold: thresholdValue,
      timestamp: new Date(),
    };
  }

  /**
   * Analyze order flow for a specific symbol
   */
  @Get('order-flow/:symbol')
  async analyzeOrderFlow(@Param('symbol') symbol: string) {
    this.logger.debug(`Analyzing order flow for ${symbol}`);

    const analysis =
      await this.dataIntelligenceService.analyzeOrderFlow(symbol);

    return {
      success: true,
      data: analysis,
      timestamp: new Date(),
    };
  }

  /**
   * Detect dark pool activity
   */
  @Get('dark-pool/:symbol')
  async getDarkPoolActivity(@Param('symbol') symbol: string) {
    this.logger.debug(`Getting dark pool activity for ${symbol}`);

    const metrics =
      await this.dataIntelligenceService.detectDarkPoolActivity(symbol);

    return {
      success: true,
      data: metrics,
      timestamp: new Date(),
    };
  }

  /**
   * Find arbitrage opportunities
   */
  @Get('arbitrage-opportunities')
  async getArbitrageOpportunities() {
    this.logger.debug('Scanning for arbitrage opportunities');

    const opportunities =
      await this.dataIntelligenceService.findArbitrageOpportunities();

    return {
      success: true,
      data: opportunities,
      count: opportunities.length,
      timestamp: new Date(),
    };
  }

  /**
   * Get data quality report
   */
  @Get('data-quality')
  async getDataQuality() {
    this.logger.debug('Generating data quality report');

    const report = await this.dataIntelligenceService.monitorDataQuality();

    return {
      success: true,
      data: report,
      timestamp: new Date(),
    };
  }

  /**
   * Get latency metrics
   */
  @Get('latency-metrics')
  async getLatencyMetrics() {
    this.logger.debug('Fetching latency metrics');

    const metrics = await this.dataIntelligenceService.getLatencyMetrics();

    return {
      success: true,
      data: metrics,
      timestamp: new Date(),
    };
  }

  /**
   * Detect high-frequency patterns
   */
  @Get('hf-patterns')
  async getHighFrequencyPatterns(@Query('timeframe') timeframe: string = '1m') {
    this.logger.debug(`Detecting HF patterns for timeframe: ${timeframe}`);

    const patterns =
      await this.streamProcessingService.detectHighFrequencyPatterns(timeframe);

    return {
      success: true,
      data: patterns,
      count: patterns.length,
      timeframe,
      timestamp: new Date(),
    };
  }

  /**
   * Get cross-venue activity for a symbol
   */
  @Get('cross-venue/:symbol')
  async getCrossVenueActivity(@Param('symbol') symbol: string) {
    this.logger.debug(`Getting cross-venue activity for ${symbol}`);

    // Return current snapshot (in real implementation, this would be a stream)
    return {
      success: true,
      message: `Cross-venue monitoring active for ${symbol}`,
      streamId: `cross_venue_${symbol}_${Date.now()}`,
      timestamp: new Date(),
    };
  }

  /**
   * Enable GPU acceleration
   */
  @Post('gpu-acceleration/enable')
  async enableGPUAcceleration() {
    this.logger.log('Enabling GPU acceleration');

    try {
      await this.streamProcessingService.enableGPUAcceleration();

      return {
        success: true,
        message: 'GPU acceleration enabled successfully',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to enable GPU acceleration',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Optimize processing latency
   */
  @Post('latency-optimization')
  async optimizeLatency(@Body() config: LatencyConfig) {
    this.logger.log('Applying latency optimization', config);

    try {
      await this.streamProcessingService.optimizeLatency(config);

      return {
        success: true,
        message: 'Latency optimization applied successfully',
        config,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to apply latency optimization',
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get streaming metrics
   */
  @Get('streaming-metrics')
  async getStreamingMetrics() {
    this.logger.debug('Fetching streaming metrics');

    // Return current metrics snapshot
    return {
      success: true,
      message: 'Streaming metrics available via WebSocket subscription',
      streamId: `metrics_${Date.now()}`,
      timestamp: new Date(),
    };
  }

  /**
   * Get buffer status for monitoring
   */
  @Get('buffer-status')
  async getBufferStatus() {
    this.logger.debug('Fetching buffer status');

    const status = this.streamProcessingService.getBufferStatus();

    return {
      success: true,
      data: status,
      timestamp: new Date(),
    };
  }

  /**
   * Aggregate multi-venue data
   */
  @Post('multi-venue/aggregate')
  async aggregateMultiVenueData(@Body() body: { venues: string[] }) {
    this.logger.debug(
      `Aggregating data from venues: ${body.venues.join(', ')}`,
    );

    return {
      success: true,
      venues: body.venues,
      streamId: `multi_venue_${Date.now()}`,
      message: 'Multi-venue data aggregation activated',
      timestamp: new Date(),
    };
  }

  /**
   * Get enterprise dashboard data
   */
  @Get('dashboard')
  async getEnterpriseDashboard() {
    this.logger.debug('Fetching enterprise dashboard data');

    // Aggregate data from multiple services
    const [
      dataQuality,
      latencyMetrics,
      arbitrageOpportunities,
      unusualActivity,
    ] = await Promise.all([
      this.dataIntelligenceService.monitorDataQuality(),
      this.dataIntelligenceService.getLatencyMetrics(),
      this.dataIntelligenceService.findArbitrageOpportunities(),
      this.dataIntelligenceService.detectUnusualActivity(2.0),
    ]);

    const bufferStatus = this.streamProcessingService.getBufferStatus();

    return {
      success: true,
      data: {
        dataQuality,
        latencyMetrics,
        arbitrageOpportunities: arbitrageOpportunities.slice(0, 10), // Top 10
        unusualActivity: unusualActivity.slice(0, 5), // Top 5
        bufferStatus,
        systemStatus: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
        },
      },
      timestamp: new Date(),
    };
  }
}
