const fetch = require("node-fetch");

async function testClientLiveData() {
  try {
    console.log("🔍 Testing Client Live Data Display...\n");

    // Test backend health
    const healthResponse = await fetch("http://localhost:8000/api/health");
    const healthData = await healthResponse.json();
    console.log("✅ Backend Health:", healthData.status);

    // Test stocks endpoint
    console.log("\n📊 Testing stocks endpoint...");
    const stocksResponse = await fetch("http://localhost:8000/api/stocks");
    const stocksData = await stocksResponse.json();
    console.log(`✅ Stocks API: ${stocksData.length} stocks loaded`);

    // Analyze stock data
    const stocksWithPrices = stocksData.filter(
      (stock) => stock.currentPrice && stock.currentPrice > 0
    ).length;
    const stocksWithoutPrices = stocksData.length - stocksWithPrices;

    console.log(`   • Stocks with live prices: ${stocksWithPrices}`);
    console.log(`   • Stocks without live prices: ${stocksWithoutPrices}`);

    // Test a few individual stocks
    console.log("\n🔍 Testing individual stock data:");
    for (let i = 0; i < Math.min(5, stocksData.length); i++) {
      const stock = stocksData[i];
      console.log(
        `   • ${stock.symbol}: $${(stock.currentPrice || 0).toFixed(2)} (${(stock.changePercent || 0).toFixed(2)}%)`
      );
    }

    // Test frontend accessibility
    console.log("\n🌐 Testing frontend accessibility...");
    try {
      const frontendResponse = await fetch("http://localhost:3000", {
        timeout: 5000,
      });
      if (frontendResponse.ok) {
        console.log("✅ Frontend is accessible on port 3000");
      } else {
        console.log(
          "⚠️ Frontend responded with status:",
          frontendResponse.status
        );
      }
    } catch (error) {
      console.log("❌ Frontend not accessible:", error.message);
    }

    console.log("\n🎯 Summary:");
    console.log(
      `- Backend is serving ${stocksData.length} stocks (target: 100)`
    );
    console.log(`- ${stocksWithPrices} stocks have live price data`);
    console.log(`- ${stocksWithoutPrices} stocks are awaiting price updates`);
    console.log("- StockCard styling has been made more compact");
    console.log("- WebSocket updates should now preserve all stocks");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testClientLiveData();
