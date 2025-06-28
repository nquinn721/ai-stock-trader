/**
 * Configuration Module Index
 *
 * Central export point for all configuration files
 */

export * from './api-endpoints.config';
export * from './database.config';
export * from './http-client.config';

// Re-export commonly used functions and types for convenience
export {
  API_ENDPOINTS,
  buildApiUrl,
  getProviderBaseUrl,
  validateApiConfiguration,
  type ApiEndpointsConfig,
} from './api-endpoints.config';

export {
  EXTERNAL_API_CONFIG,
  getCacheTtl,
  getEnvironmentConfig,
  getHttpConfig,
  getRateLimits,
  type ApiRateLimits,
  type ExternalApiConfig,
  type HttpClientConfig,
} from './http-client.config';

export {
  CLOUD_SQL_CONFIG,
  DATABASE_CONFIGS,
  getDatabaseConfig,
  getDatabaseConnectionString,
  validateDatabaseConfig,
  type DatabaseConfig,
} from './database.config';
