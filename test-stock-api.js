// Quick test to check if the stocks API is working
const fetch = require("node-fetch");

async function testStockAPI() {
  try {
    console.log("Testing backend health...");
    const healthResponse = await fetch("http://localhost:8000/health");
    const healthData = await healthResponse.json();
    console.log("Health check:", healthData.status);

    console.log("\nTesting stocks API...");
    const stocksResponse = await fetch(
      "http://localhost:8000/api/stocks/with-signals/all",
      {
        timeout: 30000,
      }
    );

    if (!stocksResponse.ok) {
      console.error(
        "API Error:",
        stocksResponse.status,
        stocksResponse.statusText
      );
      return;
    }

    const stocksData = await stocksResponse.json();
    console.log(`Found ${stocksData.length} stocks`);

    if (stocksData.length > 0) {
      console.log("Sample stock:", {
        symbol: stocksData[0].symbol,
        name: stocksData[0].name,
        currentPrice: stocksData[0].currentPrice,
        changePercent: stocksData[0].changePercent,
      });
    }
  } catch (error) {
    console.error("Error testing API:", error.message);
  }
}

testStockAPI();
