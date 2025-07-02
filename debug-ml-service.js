const axios = require("axios");

async function testMLService() {
  try {
    console.log("Testing ML Service Direct API...");

    // Test basic health
    console.log("\n1. Testing health endpoint...");
    try {
      const healthResponse = await axios.get(
        "http://localhost:8000/api/ml/health"
      );
      console.log("Health:", healthResponse.data);
    } catch (error) {
      console.log(
        "Health endpoint error:",
        error.response?.data || error.message
      );
    }

    // Test ensemble signals generation directly
    console.log("\n2. Testing ensemble signals generation...");
    try {
      const signalsResponse = await axios.post(
        "http://localhost:8000/api/ml/signals/ensemble",
        {
          symbol: "AAPL",
          timeframes: ["1d"],
          ensembleMethod: "voting",
          confidenceThreshold: 0.5,
        }
      );
      console.log(
        "Ensemble signals:",
        JSON.stringify(signalsResponse.data, null, 2)
      );
    } catch (error) {
      console.log(
        "Ensemble signals error:",
        error.response?.data || error.message
      );
    }

    // Test intelligent recommendation
    console.log("\n3. Testing intelligent recommendation...");
    try {
      const recResponse = await axios.post(
        "http://localhost:8000/api/ml/recommendation/intelligent",
        {
          symbol: "AAPL",
          currentPrice: 150,
          timeHorizon: "1D",
        }
      );
      console.log(
        "Intelligent recommendation:",
        JSON.stringify(recResponse.data, null, 2)
      );
    } catch (error) {
      console.log(
        "Intelligent recommendation error:",
        error.response?.data || error.message
      );
    }

    // Test stock data service
    console.log("\n4. Testing stock data availability...");
    try {
      const stockResponse = await axios.get(
        "http://localhost:8000/api/stocks/AAPL"
      );
      console.log("Stock data:", stockResponse.data);
    } catch (error) {
      console.log("Stock data error:", error.response?.data || error.message);
    }
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

testMLService();
