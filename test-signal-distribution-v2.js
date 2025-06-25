const axios = require("axios");

async function testSignalDistribution() {
  try {
    console.log("Testing signal distribution...\n");

    // Test the stocks endpoint
    const response = await axios.get(
      "http://localhost:3001/stocks/with-signals/all"
    );
    const stocks = response.data.stocks || response.data;

    if (!stocks || !Array.isArray(stocks)) {
      console.log("No stocks data received or invalid format");
      console.log("Response:", response.data);
      return;
    }

    console.log(`Total stocks: ${stocks.length}`);

    // Count signals
    const signalCounts = {
      Buy: 0,
      Sell: 0,
      Hold: 0,
      Unknown: 0,
    };

    stocks.forEach((stock, index) => {
      console.log(`Stock ${index}: ${stock.symbol}`);
      console.log(
        "  Signal object:",
        JSON.stringify(stock.signal || stock.tradingSignal, null, 2)
      );

      // Handle different signal formats
      let signal = "Unknown";

      if (stock.signal) {
        if (typeof stock.signal === "string") {
          signal = stock.signal;
        } else if (typeof stock.signal === "object" && stock.signal !== null) {
          signal =
            stock.signal.signal ||
            stock.signal.type ||
            stock.signal.action ||
            "Unknown";
        }
      } else if (stock.tradingSignal) {
        if (typeof stock.tradingSignal === "string") {
          signal = stock.tradingSignal;
        } else if (
          typeof stock.tradingSignal === "object" &&
          stock.tradingSignal !== null
        ) {
          signal =
            stock.tradingSignal.signal ||
            stock.tradingSignal.type ||
            stock.tradingSignal.action ||
            "Unknown";
        }
      }

      console.log(`  Parsed signal: ${signal}`);
      signalCounts[signal] = (signalCounts[signal] || 0) + 1;
    });

    console.log("\nSignal Distribution:");
    Object.entries(signalCounts).forEach(([signal, count]) => {
      const percentage = ((count / stocks.length) * 100).toFixed(1);
      console.log(`${signal}: ${count} (${percentage}%)`);
    });

    // Show some example stocks
    console.log("\nSample stocks with signals:");
    stocks.slice(0, 5).forEach((stock) => {
      let signal = "Unknown";

      if (stock.signal) {
        if (typeof stock.signal === "string") {
          signal = stock.signal;
        } else if (typeof stock.signal === "object" && stock.signal !== null) {
          signal =
            stock.signal.signal ||
            stock.signal.type ||
            stock.signal.action ||
            "Unknown";
        }
      } else if (stock.tradingSignal) {
        if (typeof stock.tradingSignal === "string") {
          signal = stock.tradingSignal;
        } else if (
          typeof stock.tradingSignal === "object" &&
          stock.tradingSignal !== null
        ) {
          signal =
            stock.tradingSignal.signal ||
            stock.tradingSignal.type ||
            stock.tradingSignal.action ||
            "Unknown";
        }
      }

      const price = stock.price || stock.currentPrice || "N/A";
      console.log(`${stock.symbol}: ${signal} - $${price}`);
    });
  } catch (error) {
    console.error("Error testing signals:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

testSignalDistribution();
