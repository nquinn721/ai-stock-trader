import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';

export interface MarketDataPoint {
  symbol: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose?: number;
}

export interface DataSource {
  name: string;
  baseUrl: string;
  apiKey?: string;
  rateLimit: number; // requests per minute
  lastRequest: Date;
  healthy: boolean;
}

export interface IngestionMetrics {
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  averageLatency: number;
  lastUpdateTime: Date;
  errors: string[];
}

@Injectable()
export class DataIngestionService {
  private readonly logger = new Logger(DataIngestionService.name);
  private readonly dataSources: Map<string, DataSource> = new Map();
  private readonly requestQueues: Map<string, Array<() => Promise<any>>> =
    new Map();
  private readonly metrics: Map<string, IngestionMetrics> = new Map();

  constructor(
    private readonly configService: ConfigService,
    // Note: We'll need to create these entities
    // @InjectRepository(HistoricalMarketData)
    // private readonly marketDataRepository: Repository<HistoricalMarketData>,
  ) {
    this.initializeDataSources();
    this.startHealthMonitoring();
  }

  /**
   * Initialize configured data sources
   */
  private initializeDataSources(): void {
    // Yahoo Finance API
    this.dataSources.set('yahoo_finance', {
      name: 'Yahoo Finance',
      baseUrl: 'https://query1.finance.yahoo.com/v8/finance/chart',
      rateLimit: 100, // Conservative rate limit
      lastRequest: new Date(0),
      healthy: true,
    });

    // Alpha Vantage (if configured)
    const alphaVantageKey = this.configService.get<string>(
      'ALPHA_VANTAGE_API_KEY',
    );
    if (alphaVantageKey) {
      this.dataSources.set('alpha_vantage', {
        name: 'Alpha Vantage',
        baseUrl: 'https://www.alphavantage.co/query',
        apiKey: alphaVantageKey,
        rateLimit: 5, // Very strict rate limit
        lastRequest: new Date(0),
        healthy: true,
      });
    }

    // Initialize metrics for each source
    this.dataSources.forEach((source, key) => {
      this.metrics.set(key, {
        totalRecords: 0,
        successfulRecords: 0,
        failedRecords: 0,
        averageLatency: 0,
        lastUpdateTime: new Date(),
        errors: [],
      });
      this.requestQueues.set(key, []);
    });

    this.logger.log(`Initialized ${this.dataSources.size} data sources`);
  }

  /**
   * Ingest historical market data for a symbol
   */
  async ingestHistoricalData(
    symbol: string,
    period:
      | '1d'
      | '5d'
      | '1mo'
      | '3mo'
      | '6mo'
      | '1y'
      | '2y'
      | '5y'
      | '10y'
      | 'max' = '1y',
    interval:
      | '1m'
      | '2m'
      | '5m'
      | '15m'
      | '30m'
      | '60m'
      | '90m'
      | '1h'
      | '1d'
      | '5d'
      | '1wk'
      | '1mo'
      | '3mo' = '1d',
    source: string = 'yahoo_finance',
  ): Promise<MarketDataPoint[]> {
    const startTime = Date.now();

    try {
      this.logger.debug(
        `Ingesting historical data for ${symbol} from ${source}`,
      );

      // Rate limiting check
      await this.enforceRateLimit(source);

      const dataSource = this.dataSources.get(source);
      if (!dataSource || !dataSource.healthy) {
        throw new Error(`Data source ${source} is not available or unhealthy`);
      }

      let data: MarketDataPoint[];

      switch (source) {
        case 'yahoo_finance':
          data = await this.ingestFromYahooFinance(symbol, period, interval);
          break;
        case 'alpha_vantage':
          data = await this.ingestFromAlphaVantage(symbol, period, interval);
          break;
        default:
          throw new Error(`Unsupported data source: ${source}`);
      }

      // Update metrics
      const metrics = this.metrics.get(source);
      metrics.totalRecords += data.length;
      metrics.successfulRecords += data.length;
      metrics.averageLatency =
        (metrics.averageLatency + (Date.now() - startTime)) / 2;
      metrics.lastUpdateTime = new Date();

      // Store in database (TODO: implement when entities are ready)
      // await this.storeMarketData(data);

      this.logger.log(
        `Successfully ingested ${data.length} records for ${symbol} from ${source}`,
      );
      return data;
    } catch (error) {
      const metrics = this.metrics.get(source);
      metrics.failedRecords++;
      metrics.errors.push(`${new Date().toISOString()}: ${error.message}`);

      // Keep only last 10 errors
      if (metrics.errors.length > 10) {
        metrics.errors = metrics.errors.slice(-10);
      }

      this.logger.error(
        `Failed to ingest data for ${symbol} from ${source}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Ingest real-time market data
   */
  async ingestRealTimeData(
    symbols: string[],
    source: string = 'yahoo_finance',
  ): Promise<MarketDataPoint[]> {
    const startTime = Date.now();

    try {
      this.logger.debug(
        `Ingesting real-time data for ${symbols.length} symbols from ${source}`,
      );

      await this.enforceRateLimit(source);

      const dataSource = this.dataSources.get(source);
      if (!dataSource || !dataSource.healthy) {
        throw new Error(`Data source ${source} is not available or unhealthy`);
      }

      let data: MarketDataPoint[];

      switch (source) {
        case 'yahoo_finance':
          data = await this.getRealTimeFromYahooFinance(symbols);
          break;
        case 'alpha_vantage':
          data = await this.getRealTimeFromAlphaVantage(symbols);
          break;
        default:
          throw new Error(`Unsupported data source: ${source}`);
      }

      // Update metrics
      const metrics = this.metrics.get(source);
      metrics.totalRecords += data.length;
      metrics.successfulRecords += data.length;
      metrics.averageLatency =
        (metrics.averageLatency + (Date.now() - startTime)) / 2;
      metrics.lastUpdateTime = new Date();

      this.logger.debug(
        `Successfully ingested real-time data for ${symbols.length} symbols`,
      );
      return data;
    } catch (error) {
      const metrics = this.metrics.get(source);
      metrics.failedRecords++;
      metrics.errors.push(`${new Date().toISOString()}: ${error.message}`);

      this.logger.error(`Failed to ingest real-time data:`, error);
      throw error;
    }
  }

  /**
   * Yahoo Finance data ingestion
   */
  private async ingestFromYahooFinance(
    symbol: string,
    period: string,
    interval: string,
  ): Promise<MarketDataPoint[]> {
    const dataSource = this.dataSources.get('yahoo_finance');
    const url = `${dataSource.baseUrl}/${symbol}?period1=0&period2=9999999999&interval=${interval}&range=${period}`;

    const response: AxiosResponse = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.data?.chart?.result?.[0]) {
      throw new Error(`No data returned for symbol ${symbol}`);
    }

    const result = response.data.chart.result[0];
    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};

    return timestamps.map((timestamp: number, index: number) => ({
      symbol,
      timestamp: new Date(timestamp * 1000),
      open: quote.open?.[index] || 0,
      high: quote.high?.[index] || 0,
      low: quote.low?.[index] || 0,
      close: quote.close?.[index] || 0,
      volume: quote.volume?.[index] || 0,
      adjClose: result.indicators?.adjclose?.[0]?.adjclose?.[index],
    }));
  }

  /**
   * Alpha Vantage data ingestion
   */
  private async ingestFromAlphaVantage(
    symbol: string,
    period: string,
    interval: string,
  ): Promise<MarketDataPoint[]> {
    const dataSource = this.dataSources.get('alpha_vantage');

    // Map our interval to Alpha Vantage format
    let function_name = 'TIME_SERIES_DAILY';
    if (interval.includes('m')) {
      function_name = 'TIME_SERIES_INTRADAY';
    }

    const url = `${dataSource.baseUrl}?function=${function_name}&symbol=${symbol}&apikey=${dataSource.apiKey}&outputsize=full`;

    const response: AxiosResponse = await axios.get(url, {
      timeout: 15000,
    });

    if (response.data['Error Message']) {
      throw new Error(`Alpha Vantage error: ${response.data['Error Message']}`);
    }

    // Parse Alpha Vantage response format
    const timeSeries =
      response.data['Time Series (Daily)'] ||
      response.data['Time Series (1min)'] ||
      {};

    return Object.entries(timeSeries).map(
      ([timestamp, data]: [string, any]) => ({
        symbol,
        timestamp: new Date(timestamp),
        open: parseFloat(data['1. open']),
        high: parseFloat(data['2. high']),
        low: parseFloat(data['3. low']),
        close: parseFloat(data['4. close']),
        volume: parseInt(data['5. volume']),
      }),
    );
  }

  /**
   * Get real-time data from Yahoo Finance
   */
  private async getRealTimeFromYahooFinance(
    symbols: string[],
  ): Promise<MarketDataPoint[]> {
    const dataSource = this.dataSources.get('yahoo_finance');
    const symbolsStr = symbols.join(',');
    const url = `${dataSource.baseUrl}/${symbolsStr}?interval=1m&range=1d`;

    const response: AxiosResponse = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const results = response.data?.chart?.result || [];
    const marketData: MarketDataPoint[] = [];

    results.forEach((result: any) => {
      const symbol = result.meta?.symbol;
      if (!symbol) return;

      const timestamps = result.timestamp || [];
      const quote = result.indicators?.quote?.[0] || {};

      // Get the latest data point
      const latestIndex = timestamps.length - 1;
      if (latestIndex >= 0) {
        marketData.push({
          symbol,
          timestamp: new Date(timestamps[latestIndex] * 1000),
          open: quote.open?.[latestIndex] || 0,
          high: quote.high?.[latestIndex] || 0,
          low: quote.low?.[latestIndex] || 0,
          close: quote.close?.[latestIndex] || 0,
          volume: quote.volume?.[latestIndex] || 0,
        });
      }
    });

    return marketData;
  }

  /**
   * Get real-time data from Alpha Vantage
   */
  private async getRealTimeFromAlphaVantage(
    symbols: string[],
  ): Promise<MarketDataPoint[]> {
    // Alpha Vantage requires separate calls for each symbol
    const promises = symbols.map((symbol) =>
      this.ingestFromAlphaVantage(symbol, '1d', '1m'),
    );
    const results = await Promise.allSettled(promises);

    const marketData: MarketDataPoint[] = [];
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        // Get the latest data point
        marketData.push(result.value[result.value.length - 1]);
      }
    });

    return marketData;
  }

  /**
   * Enforce rate limiting for data sources
   */
  private async enforceRateLimit(source: string): Promise<void> {
    const dataSource = this.dataSources.get(source);
    if (!dataSource) return;

    const timeSinceLastRequest = Date.now() - dataSource.lastRequest.getTime();
    const minInterval = (60 * 1000) / dataSource.rateLimit; // milliseconds between requests

    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest;
      this.logger.debug(`Rate limiting: waiting ${waitTime}ms for ${source}`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    dataSource.lastRequest = new Date();
  }

  /**
   * Monitor data source health
   */
  private startHealthMonitoring(): void {
    setInterval(async () => {
      for (const [sourceKey, source] of this.dataSources) {
        try {
          // Simple health check - try to get data for a common symbol
          await this.ingestRealTimeData(['AAPL'], sourceKey);
          source.healthy = true;
        } catch (error) {
          source.healthy = false;
          this.logger.warn(
            `Data source ${sourceKey} health check failed:`,
            error.message,
          );
        }
      }
    }, 300000); // Check every 5 minutes
  }

  /**
   * Get ingestion metrics for monitoring
   */
  getMetrics(): Map<string, IngestionMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Get data source status
   */
  getDataSourceStatus(): Array<{
    name: string;
    healthy: boolean;
    lastRequest: Date;
  }> {
    return Array.from(this.dataSources.entries()).map(([key, source]) => ({
      name: source.name,
      healthy: source.healthy,
      lastRequest: source.lastRequest,
    }));
  }
}
