/**
 * HTTP Client Configuration
 *
 * Centralized configuration for HTTP requests, timeouts, retries,
 * and other network-related settings.
 */

export interface HttpClientConfig {
  timeout: number;
  retries: number;
  retryDelay: number;
  maxRetryDelay: number;
  retryCondition: (error: any) => boolean;
}

export interface ApiRateLimits {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}

export interface ExternalApiConfig {
  alphaVantage: {
    http: HttpClientConfig;
    rateLimits: ApiRateLimits;
    cacheTtl: number; // Cache time-to-live in milliseconds
  };
  finnhub: {
    http: HttpClientConfig;
    rateLimits: ApiRateLimits;
    cacheTtl: number;
  };
  openai: {
    http: HttpClientConfig;
    rateLimits: ApiRateLimits;
    cacheTtl: number;
  };
  anthropic: {
    http: HttpClientConfig;
    rateLimits: ApiRateLimits;
    cacheTtl: number;
  };
  yahooFinance: {
    http: HttpClientConfig;
    rateLimits: ApiRateLimits;
    cacheTtl: number;
  };
}

/**
 * Default configuration for external APIs
 */
export const EXTERNAL_API_CONFIG: ExternalApiConfig = {
  alphaVantage: {
    http: {
      timeout: 10000, // 10 seconds
      retries: 2,
      retryDelay: 1000, // 1 second
      maxRetryDelay: 5000, // 5 seconds
      retryCondition: (error: any) => {
        return error?.response?.status >= 500 || error?.code === 'ECONNRESET';
      },
    },
    rateLimits: {
      requestsPerMinute: 5, // Alpha Vantage free tier limit
      requestsPerHour: 100,
      requestsPerDay: 500,
    },
    cacheTtl: 300000, // 5 minutes
  },
  finnhub: {
    http: {
      timeout: 8000, // 8 seconds
      retries: 2,
      retryDelay: 1000,
      maxRetryDelay: 4000,
      retryCondition: (error: any) => {
        return error?.response?.status >= 500 || error?.code === 'ECONNRESET';
      },
    },
    rateLimits: {
      requestsPerMinute: 10, // Finnhub free tier
      requestsPerHour: 300,
      requestsPerDay: 1000,
    },
    cacheTtl: 180000, // 3 minutes
  },
  openai: {
    http: {
      timeout: 30000, // 30 seconds for AI processing
      retries: 1,
      retryDelay: 2000,
      maxRetryDelay: 10000,
      retryCondition: (error: any) => {
        return (
          error?.response?.status >= 500 && error?.response?.status !== 503
        );
      },
    },
    rateLimits: {
      requestsPerMinute: 20,
      requestsPerHour: 200,
      requestsPerDay: 1000,
    },
    cacheTtl: 3600000, // 1 hour - AI responses can be cached longer
  },
  anthropic: {
    http: {
      timeout: 30000, // 30 seconds for AI processing
      retries: 1,
      retryDelay: 2000,
      maxRetryDelay: 10000,
      retryCondition: (error: any) => {
        return (
          error?.response?.status >= 500 && error?.response?.status !== 503
        );
      },
    },
    rateLimits: {
      requestsPerMinute: 15,
      requestsPerHour: 150,
      requestsPerDay: 800,
    },
    cacheTtl: 3600000, // 1 hour
  },
  yahooFinance: {
    http: {
      timeout: 15000, // 15 seconds
      retries: 3,
      retryDelay: 500,
      maxRetryDelay: 3000,
      retryCondition: (error: any) => {
        return (
          error?.response?.status >= 500 ||
          error?.code === 'ECONNRESET' ||
          error?.response?.status === 429
        ); // Rate limit
      },
    },
    rateLimits: {
      requestsPerMinute: 100, // Yahoo Finance is more generous
      requestsPerHour: 2000,
      requestsPerDay: 10000,
    },
    cacheTtl: 120000, // 2 minutes - Stock data changes frequently
  },
};

/**
 * Get HTTP configuration for a specific API provider
 * @param provider - API provider name
 * @returns HTTP client configuration
 */
export function getHttpConfig(
  provider: keyof ExternalApiConfig,
): HttpClientConfig {
  const config = EXTERNAL_API_CONFIG[provider];
  if (!config) {
    throw new Error(`Unknown API provider: ${provider}`);
  }
  return config.http;
}

/**
 * Get cache TTL for a specific API provider
 * @param provider - API provider name
 * @returns Cache TTL in milliseconds
 */
export function getCacheTtl(provider: keyof ExternalApiConfig): number {
  const config = EXTERNAL_API_CONFIG[provider];
  if (!config) {
    throw new Error(`Unknown API provider: ${provider}`);
  }
  return config.cacheTtl;
}

/**
 * Get rate limits for a specific API provider
 * @param provider - API provider name
 * @returns Rate limit configuration
 */
export function getRateLimits(
  provider: keyof ExternalApiConfig,
): ApiRateLimits {
  const config = EXTERNAL_API_CONFIG[provider];
  if (!config) {
    throw new Error(`Unknown API provider: ${provider}`);
  }
  return config.rateLimits;
}

/**
 * Environment-based configuration overrides
 * Allows customization of timeouts and limits based on environment
 */
export function getEnvironmentConfig(): Partial<ExternalApiConfig> {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isProduction) {
    // More conservative settings for production
    return {
      alphaVantage: {
        http: {
          timeout: 12000,
          retries: 3,
          retryDelay: 2000,
          maxRetryDelay: 8000,
          retryCondition: (error: any) => error?.response?.status >= 500,
        },
        rateLimits: {
          requestsPerMinute: 4, // More conservative in production
          requestsPerHour: 80,
          requestsPerDay: 400,
        },
        cacheTtl: 600000, // 10 minutes in production
      },
    };
  }

  if (isDevelopment) {
    // More aggressive settings for development
    return {
      alphaVantage: {
        http: {
          timeout: 5000, // Faster timeout in dev
          retries: 1,
          retryDelay: 500,
          maxRetryDelay: 2000,
          retryCondition: (error: any) => error?.response?.status >= 500,
        },
        rateLimits: {
          requestsPerMinute: 10, // Allow more requests in dev
          requestsPerHour: 200,
          requestsPerDay: 1000,
        },
        cacheTtl: 60000, // 1 minute in development
      },
    };
  }

  return {};
}
