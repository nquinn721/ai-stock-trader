/**
 * Frontend API Configuration
 *
 * Centralized configuration for frontend API endpoints and settings
 */

export interface FrontendApiConfig {
  backend: {
    baseUrl: string;
    wsUrl: string;
    endpoints: {
      stocks: string;
      stocksWithSignals: string;
      stockHistory: string;
      tradingSignals: string;
      paperTrading: string;
      portfolios: string;
      news: string;
      health: string;
    };
  };
  http: {
    timeout: number;
    retries: number;
    retryDelay: number;
  };
  websocket: {
    reconnectInterval: number;
    maxReconnectAttempts: number;
    heartbeatInterval: number;
  };
}

/**
 * Get API base URL from environment or use default
 */
function getApiBaseUrl(): string {
  // Use environment variable if available, otherwise default to localhost
  return process.env.REACT_APP_API_URL || "http://localhost:8000";
}

/**
 * Get WebSocket URL from environment or use default
 */
function getWebSocketUrlFromEnv(): string {
  // Use environment variable if available, otherwise default to localhost
  return process.env.REACT_APP_WS_URL || "ws://localhost:8000";
}

/**
 * Frontend API configuration
 */
export const FRONTEND_API_CONFIG: FrontendApiConfig = {
  backend: {
    baseUrl: getApiBaseUrl(),
    wsUrl: getWebSocketUrlFromEnv(),
    endpoints: {
      stocks: "/stocks",
      stocksWithSignals: "/stocks/with-signals/all",
      stockHistory: "/stocks/{symbol}/history",
      tradingSignals: "/trading/signals",
      paperTrading: "/paper-trading",
      portfolios: "/paper-trading/portfolios",
      news: "/news",
      health: "/health",
    },
  },
  http: {
    timeout: 10000, // 10 seconds
    retries: 2,
    retryDelay: 1000, // 1 second
  },
  websocket: {
    reconnectInterval: 5000, // 5 seconds
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000, // 30 seconds
  },
};

/**
 * Build complete URL for a frontend API endpoint
 * @param endpoint - Endpoint key
 * @param params - URL parameters to replace (e.g., {symbol} -> AAPL)
 * @returns Complete URL string
 */
export function buildFrontendApiUrl(
  endpoint: keyof typeof FRONTEND_API_CONFIG.backend.endpoints,
  params: Record<string, string> = {}
): string {
  const baseUrl = FRONTEND_API_CONFIG.backend.baseUrl;
  let endpointPath = FRONTEND_API_CONFIG.backend.endpoints[endpoint];

  // Replace URL parameters like {symbol} with actual values
  Object.entries(params).forEach(([key, value]) => {
    endpointPath = endpointPath.replace(`{${key}}`, value);
  });

  return `${baseUrl}${endpointPath}`;
}

/**
 * Get HTTP configuration for frontend requests
 * @returns HTTP configuration object
 */
export function getFrontendHttpConfig() {
  return FRONTEND_API_CONFIG.http;
}

/**
 * Get WebSocket configuration for frontend connections
 * @returns WebSocket configuration object
 */
export function getWebSocketConfig() {
  return FRONTEND_API_CONFIG.websocket;
}

/**
 * Get complete WebSocket URL
 * @returns WebSocket URL string
 */
export function getWebSocketUrl(): string {
  return FRONTEND_API_CONFIG.backend.wsUrl;
}

/**
 * Environment-specific configurations
 */
export function getEnvironmentConfig(): Partial<FrontendApiConfig> {
  const isProduction = process.env.NODE_ENV === "production";
  const isDevelopment = process.env.NODE_ENV === "development";

  if (isProduction) {
    return {
      http: {
        timeout: 15000, // Longer timeout in production
        retries: 3,
        retryDelay: 2000,
      },
      websocket: {
        reconnectInterval: 10000, // Less aggressive reconnection
        maxReconnectAttempts: 5,
        heartbeatInterval: 60000, // 1 minute heartbeat
      },
    };
  }

  if (isDevelopment) {
    return {
      http: {
        timeout: 5000, // Faster timeout in development
        retries: 1,
        retryDelay: 500,
      },
      websocket: {
        reconnectInterval: 2000, // More aggressive reconnection for dev
        maxReconnectAttempts: 20,
        heartbeatInterval: 15000, // 15 seconds heartbeat
      },
    };
  }

  return {};
}
