/**
 * Database connection validation script
 * Tests database connectivity before application startup
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
  const config = {
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT || 3306,
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
  };

  console.log('🔧 Testing database connection...');
  console.log(`Host: ${config.host}:${config.port}`);
  console.log(`Database: ${config.database}`);
  console.log(`Username: ${config.user}`);

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Database connection successful');

    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Database query test successful:', rows[0]);

    // Check if tables exist
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(`📊 Found ${tables.length} tables in database`);

    await connection.end();

    return true;
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(`Error: ${error.message}`);
    console.error(`Code: ${error.code}`);
    console.error(`Host: ${error.address || 'unknown'}`);
    console.error(`Port: ${error.port || 'unknown'}`);

    return false;
  }
}

if (require.main === module) {
  testDatabaseConnection()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testDatabaseConnection };
