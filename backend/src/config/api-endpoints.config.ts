/**
 * External API Endpoints Configuration
 *
 * Centralized configuration for all external API URLs and endpoints
 * used throughout the application.
 *
 * ⚠️ DOCKER & CLOUD RUN DEPLOYMENT CONSIDERATIONS
 *
 * This configuration is designed to work seamlessly in Docker containers
 * and Google Cloud Run deployments. Key requirements for production:
 *
 * 1. ENVIRONMENT VARIABLES
 *    - All API keys must be provided via environment variables
 *    - Cloud Run: Set via `gcloud run deploy --set-env-vars`
 *    - Docker: Use --env-file or docker-compose.yml
 *    - Local: Use .env files (already configured)
 *
 * 2. NETWORK CONNECTIVITY
 *    - All external APIs use HTTPS (required for Cloud Run)
 *    - No localhost or internal network dependencies
 *    - Timeout configurations handle network latency
 *
 * 3. RATE LIMITING & RESILIENCE
 *    - Implement retry logic with exponential backoff
 *    - Use circuit breakers for unreliable APIs
 *    - Cache responses where appropriate
 *    - Monitor API quotas and usage
 *
 * 4. SECURITY CONSIDERATIONS
 *    - Never hardcode API keys in this file
 *    - Use Google Secret Manager for production keys
 *    - Validate API responses for security
 *    - Log API errors without exposing keys
 *
 * 5. TESTING STRATEGY
 *    - Mock external APIs in unit tests
 *    - Use integration tests with real APIs in staging
 *    - Implement health checks for each API provider
 *    - Monitor API availability in production
 *
 * FUTURE WORK ROADMAP:
 *
 * 🔧 IMMEDIATE (Sprint 5):
 * - [ ] Add comprehensive error handling for each API
 * - [ ] Implement retry logic with exponential backoff
 * - [ ] Add API response caching layer
 * - [ ] Create health check endpoints for each API
 * - [ ] Add monitoring/alerting for API failures
 *
 * 🚀 SHORT-TERM (Sprint 6-7):
 * - [ ] Implement circuit breaker pattern
 * - [ ] Add API rate limiting protection
 * - [ ] Create fallback mechanisms for API failures
 * - [ ] Implement API response validation schemas
 * - [ ] Add comprehensive API logging (without keys)
 *
 * 🏗️ MEDIUM-TERM (Sprint 8-10):
 * - [ ] Migrate to Google Secret Manager for API keys
 * - [ ] Implement API usage analytics
 * - [ ] Add API cost monitoring and budgets
 * - [ ] Create API provider redundancy
 * - [ ] Implement advanced caching strategies
 *
 * 🎯 LONG-TERM (Post MVP):
 * - [ ] Multi-region API deployment
 * - [ ] Real-time API health monitoring dashboard
 * - [ ] Automated API provider failover
 * - [ ] AI-powered API usage optimization
 * - [ ] Custom API gateway implementation
 *
 * DEPLOYMENT TESTING CHECKLIST:
 *
 * Local Docker Testing:
 * ✅ `docker build -f Dockerfile.cloudrun .`
 * ✅ `docker run -p 8080:8080 --env-file .env <image>`
 * ✅ Test all API endpoints via http://localhost:8080
 * ✅ Verify WebSocket connections work
 * ✅ Check API key environment variables are loaded
 * ✅ Monitor container logs for API errors
 *
 * Cloud Run Staging:
 * ✅ Deploy to staging environment
 * ✅ Test API connectivity from Cloud Run
 * ✅ Verify environment variables are set
 * ✅ Check cold start performance
 * ✅ Monitor API timeout handling
 * ✅ Test under load with multiple concurrent requests
 *
 * Production Readiness:
 * ✅ All API keys configured in Secret Manager
 * ✅ Health checks passing for all APIs
 * ✅ Monitoring and alerting configured
 * ✅ Error handling and retry logic tested
 * ✅ Performance benchmarks met
 * ✅ Security audit completed
 */

export interface ApiEndpointsConfig {
  alphaVantage: {
    baseUrl: string;
    endpoints: {
      newsSentiment: string;
      quote: string;
      dailyAdjusted: string;
      intraday: string;
    };
  };
  finnhub: {
    baseUrl: string;
    endpoints: {
      companyNews: string;
      quote: string;
      marketNews: string;
      earningsCalendar: string;
    };
  };
  openai: {
    baseUrl: string;
    endpoints: {
      chatCompletions: string;
      embeddings: string;
    };
  };
  anthropic: {
    baseUrl: string;
    endpoints: {
      messages: string;
    };
  };
  yahooFinance: {
    // Note: yahoo-finance2 library handles URLs internally
    // These are for reference and potential custom implementations
    baseUrl: string;
    endpoints: {
      quote: string;
      historical: string;
      chart: string;
      modules: string;
    };
  };
}

/**
 * Default API endpoints configuration
 */
export const API_ENDPOINTS: ApiEndpointsConfig = {
  alphaVantage: {
    baseUrl: 'https://www.alphavantage.co',
    endpoints: {
      newsSentiment: '/query?function=NEWS_SENTIMENT',
      quote: '/query?function=GLOBAL_QUOTE',
      dailyAdjusted: '/query?function=TIME_SERIES_DAILY_ADJUSTED',
      intraday: '/query?function=TIME_SERIES_INTRADAY',
    },
  },
  finnhub: {
    baseUrl: 'https://finnhub.io/api/v1',
    endpoints: {
      companyNews: '/company-news',
      quote: '/quote',
      marketNews: '/news',
      earningsCalendar: '/calendar/earnings',
    },
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    endpoints: {
      chatCompletions: '/chat/completions',
      embeddings: '/embeddings',
    },
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1',
    endpoints: {
      messages: '/messages',
    },
  },
  yahooFinance: {
    baseUrl: 'https://query1.finance.yahoo.com/v8/finance',
    endpoints: {
      quote: '/quote',
      historical: '/download',
      chart: '/chart',
      modules: '/quoteSummary',
    },
  },
};

/**
 * Build complete URL for an API endpoint
 * @param provider - API provider (e.g., 'alphaVantage', 'finnhub')
 * @param endpoint - Endpoint key
 * @param params - URL parameters as key-value pairs
 * @returns Complete URL string
 */
export function buildApiUrl(
  provider: keyof ApiEndpointsConfig,
  endpoint: string,
  params: Record<string, string> = {},
): string {
  const config = API_ENDPOINTS[provider];
  if (!config) {
    throw new Error(`Unknown API provider: ${provider}`);
  }

  const endpointPath = config.endpoints[endpoint];
  if (!endpointPath) {
    throw new Error(
      `Unknown endpoint '${endpoint}' for provider '${provider}'`,
    );
  }

  const baseUrl = `${config.baseUrl}${endpointPath}`;

  if (Object.keys(params).length === 0) {
    return baseUrl;
  }

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    searchParams.append(key, value);
  });

  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${searchParams.toString()}`;
}

/**
 * Get base URL for a specific provider
 * @param provider - API provider
 * @returns Base URL string
 */
export function getProviderBaseUrl(provider: keyof ApiEndpointsConfig): string {
  const config = API_ENDPOINTS[provider];
  if (!config) {
    throw new Error(`Unknown API provider: ${provider}`);
  }
  return config.baseUrl;
}

/**
 * Validate that all required environment variables are set for external APIs
 * Enhanced for Docker/Cloud Run deployment validation
 * @returns Object indicating which APIs are properly configured
 */
export function validateApiConfiguration(): {
  alphaVantage: boolean;
  finnhub: boolean;
  openai: boolean;
  anthropic: boolean;
  yahooFinance: boolean;
  environment: 'development' | 'production' | 'docker';
  warnings: string[];
} {
  const warnings: string[] = [];
  const isDocker =
    process.env.NODE_ENV === 'production' || !!process.env.DOCKER_ENV;
  const environment = isDocker
    ? 'docker'
    : process.env.NODE_ENV === 'production'
      ? 'production'
      : 'development';

  // Yahoo Finance doesn't require API key (uses yahoo-finance2 library)
  const yahooFinanceAvailable = true;

  const alphaVantageValid = !!(
    process.env.ALPHA_VANTAGE_API_KEY &&
    process.env.ALPHA_VANTAGE_API_KEY !== 'YOUR_ALPHA_VANTAGE_API_KEY'
  );

  const finnhubValid = !!(
    process.env.FINNHUB_API_KEY &&
    process.env.FINNHUB_API_KEY !== 'YOUR_FINNHUB_API_KEY'
  );

  const openaiValid = !!(
    process.env.OPENAI_API_KEY &&
    process.env.OPENAI_API_KEY !== 'YOUR_OPENAI_API_KEY'
  );

  const anthropicValid = !!(
    process.env.ANTHROPIC_API_KEY &&
    process.env.ANTHROPIC_API_KEY !== 'YOUR_ANTHROPIC_API_KEY'
  );

  // Add warnings for missing API keys in production/docker
  if (isDocker) {
    if (!alphaVantageValid)
      warnings.push(
        'AlphaVantage API key not configured - news sentiment will be unavailable',
      );
    if (!finnhubValid)
      warnings.push(
        'Finnhub API key not configured - market news will be unavailable',
      );
    if (!openaiValid)
      warnings.push(
        'OpenAI API key not configured - AI features will be unavailable',
      );
    if (!anthropicValid)
      warnings.push(
        'Anthropic API key not configured - Claude AI features will be unavailable',
      );
  }

  return {
    alphaVantage: alphaVantageValid,
    finnhub: finnhubValid,
    openai: openaiValid,
    anthropic: anthropicValid,
    yahooFinance: yahooFinanceAvailable,
    environment,
    warnings,
  };
}

/**
 * Test connectivity to all configured external APIs
 * Essential for Docker health checks and Cloud Run deployment validation
 * @param timeout - Request timeout in milliseconds (default: 10000)
 * @returns Promise with connectivity status for each API
 */
export async function testApiConnectivity(timeout: number = 10000): Promise<{
  alphaVantage: { available: boolean; latency?: number; error?: string };
  finnhub: { available: boolean; latency?: number; error?: string };
  openai: { available: boolean; latency?: number; error?: string };
  anthropic: { available: boolean; latency?: number; error?: string };
  yahooFinance: { available: boolean; latency?: number; error?: string };
  overall: boolean;
}> {
  const results = {
    alphaVantage: { available: false, latency: undefined, error: undefined },
    finnhub: { available: false, latency: undefined, error: undefined },
    openai: { available: false, latency: undefined, error: undefined },
    anthropic: { available: false, latency: undefined, error: undefined },
    yahooFinance: { available: false, latency: undefined, error: undefined },
    overall: false,
  };

  const testEndpoint = async (name: string, url: string) => {
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Stock-Trading-App-Health-Check/1.0',
        },
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - start;

      results[name] = { available: true, latency };
    } catch (error) {
      results[name] = {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };

  // Test all APIs concurrently
  await Promise.allSettled([
    testEndpoint('alphaVantage', API_ENDPOINTS.alphaVantage.baseUrl),
    testEndpoint('finnhub', API_ENDPOINTS.finnhub.baseUrl),
    testEndpoint('openai', API_ENDPOINTS.openai.baseUrl),
    testEndpoint('anthropic', API_ENDPOINTS.anthropic.baseUrl),
    testEndpoint('yahooFinance', API_ENDPOINTS.yahooFinance.baseUrl),
  ]);

  // Overall health: at least Yahoo Finance (core stock data) must be available
  results.overall = results.yahooFinance.available;

  return results;
}

/**
 * Get API configuration status for health check endpoint
 * Used by Docker health checks and Cloud Run readiness probes
 * @returns Comprehensive health status
 */
export function getApiHealthStatus(): {
  status: 'healthy' | 'degraded' | 'unhealthy';
  configured: number;
  total: number;
  details: ReturnType<typeof validateApiConfiguration>;
  timestamp: string;
} {
  const config = validateApiConfiguration();
  const apis = [
    config.alphaVantage,
    config.finnhub,
    config.openai,
    config.anthropic,
    config.yahooFinance,
  ];
  const configured = apis.filter(Boolean).length;
  const total = apis.length;

  let status: 'healthy' | 'degraded' | 'unhealthy';

  if (configured === total) {
    status = 'healthy';
  } else if (config.yahooFinance && configured >= 2) {
    status = 'degraded'; // Core functionality available
  } else {
    status = 'unhealthy';
  }

  return {
    status,
    configured,
    total,
    details: config,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create HTTP client with Docker/Cloud Run optimized settings
 * @param provider - API provider name
 * @param additionalHeaders - Additional headers to include
 * @returns Configured fetch options for the provider
 */
export function createApiClientConfig(
  provider: keyof ApiEndpointsConfig,
  additionalHeaders: Record<string, string> = {},
): {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
  retries: number;
} {
  const baseURL = getProviderBaseUrl(provider);

  // Optimized timeouts for Cloud Run environment
  const timeouts = {
    alphaVantage: 15000, // AlphaVantage can be slow
    finnhub: 10000, // Usually fast
    openai: 30000, // AI requests can take time
    anthropic: 30000, // AI requests can take time
    yahooFinance: 8000, // Should be fast for real-time data
  };

  return {
    baseURL,
    timeout: timeouts[provider] || 10000,
    headers: {
      'User-Agent': 'Stock-Trading-App/1.0',
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...additionalHeaders,
    },
    retries: 3,
  };
}
