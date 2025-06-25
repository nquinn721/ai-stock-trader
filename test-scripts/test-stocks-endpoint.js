const axios = require("axios");

async function testStocksEndpoint() {
  try {
    console.log("Testing basic stocks endpoint...\n");

    // Test the basic stocks endpoint first
    const response = await axios.get("http://localhost:3001/stocks");
    console.log("Basic stocks response:", response.data);

    // Wait a bit and then test the with-signals endpoint
    setTimeout(async () => {
      try {
        const signalsResponse = await axios.get(
          "http://localhost:3001/stocks/with-signals/all"
        );
        const stocks = signalsResponse.data.stocks || signalsResponse.data;

        if (!stocks || !Array.isArray(stocks)) {
          console.log("No stocks data with signals received");
          return;
        }

        console.log(`\nTotal stocks with signals: ${stocks.length}`);

        // Count signals
        const signalCounts = {
          Buy: 0,
          Sell: 0,
          Hold: 0,
          Unknown: 0,
        };

        stocks.forEach((stock) => {
          const signal = stock.signal || stock.tradingSignal || "Unknown";
          signalCounts[signal] = (signalCounts[signal] || 0) + 1;
        });

        console.log("\nSignal Distribution:");
        Object.entries(signalCounts).forEach(([signal, count]) => {
          const percentage = ((count / stocks.length) * 100).toFixed(1);
          console.log(`${signal}: ${count} (${percentage}%)`);
        });

        // Show some example stocks
        console.log("\nSample stocks with signals:");
        stocks.slice(0, 10).forEach((stock) => {
          const signal = stock.signal || stock.tradingSignal || "Unknown";
          console.log(`${stock.symbol}: ${signal} - $${stock.price}`);
        });
      } catch (error) {
        console.error("Error testing signals:", error.message);
      }
    }, 2000);
  } catch (error) {
    console.error("Error testing basic stocks:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

testStocksEndpoint();
