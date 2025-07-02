#!/usr/bin/env node

/**
 * =============================================================================
 * DATABASE SEED RUNNER
 * =============================================================================
 *
 * ⚠️ CRITICAL: Uses DATABASE connection from environment variables
 * See: docs/DATABASE-CONNECTION-POLICY.md - NEVER modify DB settings
 *
 * Simple script to populate the database with stock seed data.
 * Run this after setting up the database to initialize stock symbols.
 * =============================================================================
 */

import { DataSource } from 'typeorm';
import { stockSeedData } from '../database/seeds/stock.seed';
import { Stock } from '../entities/stock.entity';

// Database configuration (matches your main app config)
const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  username: process.env.DATABASE_USERNAME || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'stock_trading_app',
  entities: [Stock],
  synchronize: true, // Allow table creation if needed
});

async function runSeed() {
  try {
    console.log('🌱 Initializing database connection...');
    await AppDataSource.initialize();

    const stockRepository = AppDataSource.getRepository(Stock);

    console.log('🌱 Checking existing stock data...');
    const existingCount = await stockRepository.count();

    if (existingCount > 0) {
      console.log(
        `⚠️ Database already contains ${existingCount} stocks. Skipping seed.`,
      );
      console.log('💡 To re-seed, clear the stocks table first.');
    } else {
      console.log('🌱 Seeding database with stock data...');

      // Insert all seed data
      const savedStocks = await stockRepository.save(stockSeedData);

      console.log(
        `✅ Successfully seeded ${savedStocks.length} stocks into the database!`,
      );
      console.log('📊 Stock symbols are now ready for live price tracking.');
    }
  } catch (error) {
    console.error('❌ Error running seed:', error);
    process.exit(1);
  } finally {
    await AppDataSource.destroy();
    console.log('🔌 Database connection closed.');
  }
}

// Run the seed if this script is executed directly
if (require.main === module) {
  runSeed().then(() => {
    console.log('🌱 Seed operation completed.');
    process.exit(0);
  });
}

export { runSeed };
