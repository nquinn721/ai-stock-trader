/**
 * Frontend Configuration Module Index
 *
 * Central export point for all frontend configuration files
 */

export * from "./api.config";

// Re-export commonly used functions and types for convenience
export {
  buildFrontendApiUrl,
  FRONTEND_API_CONFIG,
  getEnvironmentConfig,
  getFrontendHttpConfig,
  getWebSocketConfig,
  getWebSocketUrl,
  type FrontendApiConfig,
} from "./api.config";
