const mysql = require('mysql2/promise');

async function addStocks() {
  try {
    // Connect to database
    const connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      port: process.env.DATABASE_PORT || 3306,
      user: process.env.DATABASE_USERNAME || 'root',
      password: process.env.DATABASE_PASSWORD || 'root',
      database: process.env.DATABASE_NAME || 'stocktrading_dev',
    });

    console.log('🔌 Connected to database');

    // Check current stock count
    const [countResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM stocks',
    );
    const currentCount = countResult[0].count;
    console.log(`📊 Current stocks in database: ${currentCount}`);

    // Check if SHOP and SQ already exist
    const [existingStocks] = await connection.execute(
      'SELECT symbol FROM stocks WHERE symbol IN (?, ?)',
      ['SHOP', 'SQ'],
    );

    const existingSymbols = existingStocks.map((row) => row.symbol);
    console.log('🔍 Existing symbols from new list:', existingSymbols);

    const newStocks = [
      { symbol: 'SHOP', name: 'Shopify Inc.', favorite: false },
      { symbol: 'SQ', name: 'Block Inc.', favorite: false },
    ];

    let addedCount = 0;

    for (const stock of newStocks) {
      if (!existingSymbols.includes(stock.symbol)) {
        await connection.execute(
          'INSERT INTO stocks (symbol, name, favorite) VALUES (?, ?, ?)',
          [stock.symbol, stock.name, stock.favorite],
        );
        console.log(`✅ Added ${stock.symbol} - ${stock.name}`);
        addedCount++;
      } else {
        console.log(`⏭️ ${stock.symbol} already exists`);
      }
    }

    // Check final count
    const [finalCountResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM stocks',
    );
    const finalCount = finalCountResult[0].count;
    console.log(`📊 Final stocks in database: ${finalCount}`);
    console.log(`🎯 Added ${addedCount} new stocks`);

    await connection.end();
    console.log('🔌 Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addStocks();
