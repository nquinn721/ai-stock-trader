-- Database cleanup script for removing forex/crypto features
-- Run this script after backing up your database

USE stocktrading;

-- Check for any forex/crypto tables (these should not exist in our current schema)
-- This script documents the expected cleanup process

-- Show current tables to verify what exists
SHOW TABLES;

-- Expected tables after cleanup (these should remain):
-- portfolios - Portfolio management
-- positions - Stock positions  
-- trades - Trading history
-- stocks - Stock data and metadata
-- notifications - User notifications

-- If any forex/crypto tables exist, they would be dropped here:
-- DROP TABLE IF EXISTS forex_data;
-- DROP TABLE IF EXISTS crypto_data;
-- DROP TABLE IF EXISTS forex_pairs;
-- DROP TABLE IF EXISTS crypto_currencies;
-- DROP TABLE IF EXISTS multi_asset_portfolios;
-- DROP TABLE IF EXISTS currency_rates;

-- Verify the essential tables exist with correct structure
DESCRIBE portfolios;
DESCRIBE positions;
DESCRIBE trades;
DESCRIBE stocks;
DESCRIBE notifications;

-- Show record counts for verification
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

-- Cleanup complete - database should only contain stock trading essentials
