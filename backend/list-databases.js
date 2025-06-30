/**
 * List available databases on production server
 */

const mysql = require('mysql2/promise');

async function listDatabases() {
  // Connect without specifying a database
  const config = {
    host: '35.238.63.253',
    port: 3306,
    user: 'stocktrader',
    password: 'secure_trading_password_2024',
    connectTimeout: 60000,
  };

  console.log('🔧 Connecting to production database server...');
  console.log(`Host: ${config.host}:${config.port}`);
  console.log(`Username: ${config.user}`);

  try {
    const connection = await mysql.createConnection(config);
    console.log('✅ Server connection successful');

    // List all databases
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('📊 Available databases:');
    databases.forEach((db) => {
      console.log(`  - ${Object.values(db)[0]}`);
    });

    await connection.end();

    return true;
  } catch (error) {
    console.error('❌ Server connection failed:');
    console.error(`Error: ${error.message}`);
    console.error(`Code: ${error.code}`);

    return false;
  }
}

listDatabases()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
