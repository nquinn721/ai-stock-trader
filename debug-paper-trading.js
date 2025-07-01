/**
 * Debug paper trading execution to find the root cause
 */

const API_BASE_URL = "http://localhost:8000";

async function debugPaperTrading() {
  console.log("🔍 DEBUGGING Paper Trading Execution");
  console.log("=".repeat(40));

  try {
    // Test 1: Check if we can get portfolios
    console.log("1️⃣ Testing portfolio retrieval...");
    const portfoliosResponse = await fetch(
      `${API_BASE_URL}/api/paper-trading/portfolios`
    );
    const portfolios = await portfoliosResponse.json();

    console.log(`✅ Found ${portfolios.length} portfolios`);
    portfolios.forEach((p, idx) => {
      console.log(
        `   ${idx + 1}. ${p.name} (ID: ${p.id}, Cash: $${p.currentCash})`
      );
    });

    // Test 2: Check if stock exists
    console.log("\n2️⃣ Testing stock data retrieval...");
    const stockResponse = await fetch(`${API_BASE_URL}/api/stocks/AAPL`);
    const stockData = await stockResponse.json();

    console.log("✅ Stock data:");
    console.log(`   Symbol: ${stockData.symbol}`);
    console.log(`   Price: $${stockData.currentPrice}`);
    console.log(`   Name: ${stockData.name}`);

    // Test 3: Try different trade formats
    console.log("\n3️⃣ Testing different trade request formats...");

    const tradeFormats = [
      {
        name: "Original format",
        data: {
          userId: "test-user-123",
          symbol: "AAPL",
          type: "buy",
          quantity: 1,
        },
      },
      {
        name: "Without userId",
        data: {
          symbol: "AAPL",
          type: "buy",
          quantity: 1,
        },
      },
      {
        name: "With portfolioId",
        data: {
          portfolioId: portfolios[0]?.id || 1,
          symbol: "AAPL",
          type: "buy",
          quantity: 1,
        },
      },
    ];

    for (const format of tradeFormats) {
      console.log(`\n   Testing ${format.name}...`);
      console.log(`   Data: ${JSON.stringify(format.data)}`);

      try {
        const tradeResponse = await fetch(
          `${API_BASE_URL}/api/paper-trading/trade`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(format.data),
          }
        );

        console.log(`   Status: ${tradeResponse.status}`);

        if (tradeResponse.ok) {
          const result = await tradeResponse.json();
          console.log("   ✅ SUCCESS! Trade executed");
          console.log(`   Trade ID: ${result.id}`);
          return result;
        } else {
          const errorText = await tradeResponse.text();
          console.log(`   ❌ Failed: ${errorText}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    // Test 4: Check market hours status
    console.log("\n4️⃣ Testing market status...");
    const marketResponse = await fetch(`${API_BASE_URL}/api/health`);
    const marketData = await marketResponse.json();
    console.log("Market/Backend status:", marketData.status);

    console.log("\n5️⃣ Checking for backend errors...");
    console.log("The 500 error suggests an internal server error.");
    console.log("This could be due to:");
    console.log("- Database connection issues");
    console.log("- Missing required fields in the trade request");
    console.log("- Market hours validation blocking the trade");
    console.log("- Entity relationship issues");
    console.log("- TypeORM query errors");
  } catch (error) {
    console.error("❌ Debug test failed:", error.message);
  }
}

// Test market hours separately
async function testMarketHours() {
  console.log("\n⏰ TESTING Market Hours Impact");
  console.log("=".repeat(35));

  const now = new Date();
  console.log(`Current time: ${now.toISOString()}`);

  // Check if it's weekend
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    console.log("📅 It's weekend - market is closed");
    console.log("This could be causing the trade execution to fail");
  } else {
    console.log("📅 It's a weekday");

    // Check if it's US market hours (approximate)
    const hour = now.getUTCHours();
    const isMarketHours = hour >= 14 && hour <= 21; // 9:30 AM - 4 PM ET in UTC

    if (isMarketHours) {
      console.log("🕒 Within approximate US market hours");
    } else {
      console.log("🕒 Outside US market hours - this could cause issues");
    }
  }
}

// Main execution
async function runDebug() {
  await debugPaperTrading();
  await testMarketHours();

  console.log("\n🎯 NEXT STEPS:");
  console.log("1. Check backend console/logs for detailed error messages");
  console.log("2. Verify database connection is working");
  console.log("3. Consider disabling market hours validation for testing");
  console.log(
    "4. Check if all required entity relationships are properly set up"
  );
}

runDebug().catch(console.error);
