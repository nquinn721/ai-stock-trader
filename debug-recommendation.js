// Quick test to debug the recommendation pipeline issue
const axios = require("axios");

async function testRecommendationPipeline() {
  console.log("🧪 Testing Recommendation Pipeline...\n");

  const baseUrl = "http://localhost:8000/api";

  try {
    // 1. Test basic stock data
    console.log("1. Testing basic stock data...");
    const stockResponse = await axios.get(`${baseUrl}/stocks/AAPL`);
    console.log("✅ Stock data retrieved:", {
      symbol: stockResponse.data.symbol,
      price: stockResponse.data.currentPrice,
      volume: stockResponse.data.volume,
    });

    // 2. Test stock history
    console.log("\n2. Testing stock history...");
    const historyResponse = await axios.get(
      `${baseUrl}/stocks/AAPL/history?period=1mo`
    );
    console.log(
      `✅ History data retrieved: ${historyResponse.data.length} data points`
    );

    // 3. Test recommendation generation
    console.log("\n3. Testing recommendation generation...");
    try {
      const recommendationResponse = await axios.post(
        `${baseUrl}/recommendation-pipeline/generate`,
        {
          symbols: ["AAPL"],
          targetPortfolios: [1],
          includeRiskAnalysis: true,
        }
      );
      console.log("✅ Recommendation generated:", recommendationResponse.data);
    } catch (recError) {
      console.log("❌ Recommendation failed:", {
        status: recError.response?.status,
        statusText: recError.response?.statusText,
        data: recError.response?.data,
      });

      // Try to get more details from the error
      if (recError.response?.data) {
        console.log("Error details:", recError.response.data);
      }
    }

    // 4. Test pipeline config
    console.log("\n4. Testing pipeline configuration...");
    const configResponse = await axios.get(
      `${baseUrl}/recommendation-pipeline/config`
    );
    console.log("✅ Pipeline config:", configResponse.data);
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testRecommendationPipeline();
