/**
 * Test Cloud Run production database connection
 */

const mysql = require('mysql2/promise');

async function testProductionDatabaseConnection() {
  // These are the exact same credentials used in Cloud Run
  const config = {
    host: '35.238.63.253',
    port: 3306,
    user: 'stocktrader',
    password: 'secure_trading_password_2024',
    database: 'stocktrading',
    connectTimeout: 60000,
  };

  console.log('🔧 Testing PRODUCTION database connection...');
  console.log(`Host: ${config.host}:${config.port}`);
  console.log(`Database: ${config.database}`);
  console.log(`Username: ${config.user}`);

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Production database connection successful');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Database query test successful:', rows[0]);
    
    // Check if tables exist
    try {
      const [tables] = await connection.execute('SHOW TABLES');
      console.log(`📊 Found ${tables.length} tables in database`);
      
      if (tables.length === 0) {
        console.log('⚠️ No tables found - database needs initialization');
      } else {
        console.log('Available tables:');
        tables.forEach(table => {
          console.log(`  - ${Object.values(table)[0]}`);
        });
      }
    } catch (tableError) {
      console.error('❌ Error checking tables:', tableError.message);
    }
    
    // Check if portfolios table exists and has data
    try {
      const [portfolios] = await connection.execute('SELECT COUNT(*) as count FROM portfolios');
      console.log(`📊 Portfolios table has ${portfolios[0].count} records`);
    } catch (portfolioError) {
      console.error('❌ Error checking portfolios table:', portfolioError.message);
    }
    
    await connection.end();
    
    return true;
  } catch (error) {
    console.error('❌ Production database connection failed:');
    console.error(`Error: ${error.message}`);
    console.error(`Code: ${error.code}`);
    console.error(`Host: ${error.address || 'unknown'}`);
    console.error(`Port: ${error.port || 'unknown'}`);
    
    return false;
  }
}

testProductionDatabaseConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test script failed:', error);
    process.exit(1);
  });
