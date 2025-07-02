/**
 * Database Configuration for Stock Trading App
 * Supports multiple environments: development, production, and Cloud Run
 */

export interface DatabaseConfig {
  type: 'mysql' | 'postgres';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl?:
    | boolean
    | {
        rejectUnauthorized: boolean;
        ca?: string;
        cert?: string;
        key?: string;
      };
  socketPath?: string;
  extra?: {
    socketPath?: string;
    ssl?: any;
    connectionLimit?: number;
    acquireTimeout?: number;
    timeout?: number;
  };
}

/**
 * Get database configuration based on environment
 */
export function getDatabaseConfig(): DatabaseConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  console.log('Database config - Environment:', process.env.NODE_ENV);

  if (isDevelopment) {
    // Development environment - local database
    return {
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'stocktrading_dev',
      ssl: false,
    };
  } else if (isProduction) {
    // Production environment - Cloud SQL or production database
    const config: DatabaseConfig = {
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'rootpassword123',
      database: process.env.DB_NAME || 'stocktrading',
    };

    // Configure SSL for Cloud SQL
    if (process.env.DB_SSL === 'true') {
      config.ssl = {
        rejectUnauthorized: false, // For Cloud SQL managed certificates
      };
    }

    // Configure Unix socket for Cloud SQL (if provided)
    if (process.env.DB_SOCKET_PATH) {
      config.extra = {
        socketPath: process.env.DB_SOCKET_PATH,
        connectionLimit: 10,
        acquireTimeout: 60000,
        timeout: 60000,
      };
    } else {
      // TCP connection configuration
      config.extra = {
        connectionLimit: 10,
        acquireTimeout: 60000,
        timeout: 60000,
        ssl: config.ssl,
      };
    }

    return config;
  } else {
    // Default to development configuration
    return {
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'password',
      database: 'stocktrading_dev',
      ssl: false,
    };
  }
}

/**
 * Environment-specific database configurations
 */
export const DATABASE_CONFIGS = {
  development: {
    type: 'mysql' as const,
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'password',
    database: 'stocktrading_dev',
    ssl: false,
  },

  production: {
    type: 'mysql' as const,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'stocktrading',
    ssl: process.env.DB_SSL === 'true',
  },

  test: {
    type: 'mysql' as const,
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'password',
    database: 'stocktrading_test',
    ssl: false,
  },
};

/**
 * Cloud SQL specific configuration helpers
 */
export const CLOUD_SQL_CONFIG = {
  // Unix socket path pattern for Cloud SQL
  getSocketPath: (instanceConnectionName: string) =>
    `/cloudsql/${instanceConnectionName}`,

  // SSL configuration for Cloud SQL
  getSslConfig: () => ({
    rejectUnauthorized: false,
    // Add CA certificate if using custom SSL
    // ca: process.env.DB_SSL_CA,
    // cert: process.env.DB_SSL_CERT,
    // key: process.env.DB_SSL_KEY,
  }),

  // Connection pool settings optimized for Cloud Run
  getPoolConfig: () => ({
    connectionLimit: 5, // Conservative for Cloud Run
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
    charset: 'utf8mb4',
  }),
};

/**
 * Validate database configuration
 */
export function validateDatabaseConfig(config: DatabaseConfig): boolean {
  const required = ['host', 'port', 'username', 'database'];

  for (const field of required) {
    if (!config[field as keyof DatabaseConfig]) {
      console.error(`Missing required database configuration: ${field}`);
      return false;
    }
  }

  if (config.port < 1 || config.port > 65535) {
    console.error('Invalid database port number');
    return false;
  }

  return true;
}

/**
 * Get connection string for logging (with masked password)
 */
export function getDatabaseConnectionString(config: DatabaseConfig): string {
  const maskedPassword = config.password ? '***' : '';
  return `${config.type}://${config.username}:${maskedPassword}@${config.host}:${config.port}/${config.database}`;
}
