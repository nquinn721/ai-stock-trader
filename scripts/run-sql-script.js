const fs = require('fs');
const mysql = require('mysql2/promise');
const path = require('path');

// Path to the SQL file to execute
const sqlFilePath = path.join(__dirname, '..', 'database', 'cleanup-forex-crypto.sql');

// Check for a SQL query passed via command-line argument
const sqlQuery = process.argv.find(arg => arg.startsWith('--sql='))?.split('=')[1];

// Path to the database config file
const configPath = path.join(__dirname, '..', 'database', 'database-config.env');

/**
 * Parses a .env file and returns a configuration object.
 * @param {string} filePath
 * @returns {object}
 */
function parseEnvFile(filePath) {
  const envFileContent = fs.readFileSync(filePath, 'utf8');
  const config = {};
  envFileContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').split('#')[0].trim();
        config[key.trim()] = value;
      }
    }
  });
  return config;
}


async function executeSql() {
  let connection;
  try {
    console.log('Reading database configuration...');
    const dbConfig = parseEnvFile(configPath);

    const connectionConfig = {
      host: dbConfig.DATABASE_HOST || 'localhost',
      user: dbConfig.DATABASE_USERNAME || 'root',
      password: dbConfig.DATABASE_PASSWORD || 'password',
      database: dbConfig.DATABASE_NAME || 'stocktrading',
      port: parseInt(dbConfig.DATABASE_PORT || '3306', 10),
      multipleStatements: true, // Allow multiple SQL statements
    };

    console.log(`Connecting to database "${connectionConfig.database}" on ${connectionConfig.host}...`);
    connection = await mysql.createConnection(connectionConfig);
    console.log('Database connection successful.');

    if (sqlQuery) {
      console.log('Executing SQL query from command line...');
      const [rows] = await connection.query(sqlQuery);
      console.log('Query Result:', rows);
    } else {
      console.log(`Reading SQL file from: ${sqlFilePath}`);
      const sql = fs.readFileSync(sqlFilePath, 'utf8');
      console.log('Executing SQL script...');
      await connection.query(sql);
      console.log('✅ SQL script executed successfully.');
    }

  } catch (error) {
    console.error('❌ Error executing SQL script:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

executeSql();
