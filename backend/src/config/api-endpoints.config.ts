/**
 * External API Endpoints Configuration
 *
 * Centralized configuration for all external API URLs and endpoints
 * used throughout the application.
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
 * @returns Object indicating which APIs are properly configured
 */
export function validateApiConfiguration(): {
  alphaVantage: boolean;
  finnhub: boolean;
  openai: boolean;
  anthropic: boolean;
} {
  return {
    alphaVantage: !!(
      process.env.ALPHA_VANTAGE_API_KEY &&
      process.env.ALPHA_VANTAGE_API_KEY !== 'YOUR_ALPHA_VANTAGE_API_KEY'
    ),
    finnhub: !!(
      process.env.FINNHUB_API_KEY &&
      process.env.FINNHUB_API_KEY !== 'YOUR_FINNHUB_API_KEY'
    ),
    openai: !!(
      process.env.OPENAI_API_KEY &&
      process.env.OPENAI_API_KEY !== 'YOUR_OPENAI_API_KEY'
    ),
    anthropic: !!(
      process.env.ANTHROPIC_API_KEY &&
      process.env.ANTHROPIC_API_KEY !== 'YOUR_ANTHROPIC_API_KEY'
    ),
  };
}
