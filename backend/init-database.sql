-- Database initialization script for Stock Trading App
-- This script ensures essential tables exist in the MySQL database

USE stocktrading;

-- Create portfolios table if it doesn't exist
CREATE TABLE IF NOT EXISTS portfolios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    portfolioType VARCHAR(50) DEFAULT 'BASIC',
    dayTradingEnabled BOOLEAN DEFAULT FALSE,
    dayTradeCount INT DEFAULT 0,
    lastDayTradeReset DATE NULL,
    initialCash DECIMAL(15,2) DEFAULT 100000,
    currentCash DECIMAL(15,2) DEFAULT 100000,
    totalValue DECIMAL(15,2) DEFAULT 0,
    totalPnL DECIMAL(15,2) DEFAULT 0,
    totalReturn DECIMAL(5,2) DEFAULT 0,
    isActive BOOLEAN DEFAULT TRUE,
    assignedStrategy VARCHAR(100) NULL,
    assignedStrategyName VARCHAR(200) NULL,
    strategyAssignedAt TIMESTAMP NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create positions table if it doesn't exist
CREATE TABLE IF NOT EXISTS positions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    portfolioId INT NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    quantity INT DEFAULT 0,
    averagePrice DECIMAL(10,2) DEFAULT 0,
    currentPrice DECIMAL(10,2) DEFAULT 0,
    totalValue DECIMAL(15,2) DEFAULT 0,
    unrealizedPnL DECIMAL(15,2) DEFAULT 0,
    percentChange DECIMAL(5,2) DEFAULT 0,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_portfolio_symbol (portfolioId, symbol),
    FOREIGN KEY (portfolioId) REFERENCES portfolios(id) ON DELETE CASCADE
);

-- Create trades table if it doesn't exist
CREATE TABLE IF NOT EXISTS trades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    portfolioId INT NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    type ENUM('buy', 'sell') NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    totalAmount DECIMAL(15,2) NOT NULL,
    fees DECIMAL(10,2) DEFAULT 0,
    status ENUM('pending', 'completed', 'cancelled', 'failed') DEFAULT 'pending',
    notes TEXT NULL,
    executedAt TIMESTAMP NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_portfolio_symbol (portfolioId, symbol),
    INDEX idx_symbol_date (symbol, createdAt),
    FOREIGN KEY (portfolioId) REFERENCES portfolios(id) ON DELETE CASCADE
);

-- Create stocks table if it doesn't exist
CREATE TABLE IF NOT EXISTS stocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NULL,
    currentPrice DECIMAL(10,2) DEFAULT 0,
    previousClose DECIMAL(10,2) DEFAULT 0,
    change DECIMAL(10,2) DEFAULT 0,
    changePercent DECIMAL(5,2) DEFAULT 0,
    volume BIGINT DEFAULT 0,
    marketCap BIGINT DEFAULT 0,
    sector VARCHAR(100) NULL,
    industry VARCHAR(100) NULL,
    favorite BOOLEAN DEFAULT FALSE,
    isActive BOOLEAN DEFAULT TRUE,
    lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_symbol (symbol),
    INDEX idx_sector (sector),
    INDEX idx_favorite (favorite),
    INDEX idx_updated (lastUpdated)
);

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId VARCHAR(100) NOT NULL,
    type ENUM('TRADE_EXECUTION', 'PRICE_ALERT', 'PORTFOLIO_UPDATE', 'RISK_WARNING', 'MARKET_NEWS', 'SYSTEM_STATUS') NOT NULL,
    priority ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    symbol VARCHAR(10) NULL,
    portfolioId INT NULL,
    status ENUM('UNREAD', 'READ', 'ARCHIVED') DEFAULT 'UNREAD',
    readAt TIMESTAMP NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_status (userId, status),
    INDEX idx_type_priority (type, priority),
    INDEX idx_created (createdAt)
);

-- Insert a default portfolio if none exist
INSERT IGNORE INTO portfolios (id, name, portfolioType, initialCash, currentCash, isActive)
VALUES (1, 'Default Portfolio', 'SMALL_ACCOUNT_BASIC', 1000, 1000, TRUE);

-- Verify tables were created
SHOW TABLES;

-- Show table counts
SELECT 
    'portfolios' as table_name, COUNT(*) as record_count FROM portfolios
UNION ALL
SELECT 
    'positions' as table_name, COUNT(*) as record_count FROM positions
UNION ALL
SELECT 
    'trades' as table_name, COUNT(*) as record_count FROM trades
UNION ALL
SELECT 
    'stocks' as table_name, COUNT(*) as record_count FROM stocks
UNION ALL
SELECT 
    'notifications' as table_name, COUNT(*) as record_count FROM notifications;
