// Test script for Auto Trading API endpoints
const axios = require("axios");

const BASE_URL = "http://localhost:8000";

async function testAutoTradingAPIs() {
  console.log("🔍 Testing Auto Trading API Endpoints...\n");

  const tests = [
    {
      name: "Strategy Builder - Get User Strategies",
      url: `${BASE_URL}/api/strategy-builder/strategies`,
      method: "GET",
      params: { userId: "test-user" },
    },
    {
      name: "Strategy Builder - Get Templates",
      url: `${BASE_URL}/api/strategy-builder/templates`,
      method: "GET",
    },
    {
      name: "Autonomous Trading - Get Running Strategies",
      url: `${BASE_URL}/api/autonomous-trading/strategies`,
      method: "GET",
    },
    {
      name: "Strategy Builder - Get Components",
      url: `${BASE_URL}/api/strategy-builder/components`,
      method: "GET",
    },
  ];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      const response = await axios({
        method: test.method,
        url: test.url,
        params: test.params,
        timeout: 5000,
      });

      console.log(`✅ ${test.name}: Status ${response.status}`);
      const preview = JSON.stringify(response.data).substring(0, 200);
      console.log(
        `   Response: ${preview}${preview.length === 200 ? "..." : ""}\n`
      );
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(
          `   Error: ${JSON.stringify(error.response.data).substring(0, 100)}\n`
        );
      } else {
        console.log(`   Network Error: ${error.message}\n`);
      }
    }
  }
}

// Test strategy creation
async function testStrategyCreation() {
  console.log("🔧 Testing Strategy Creation...\n");

  const testStrategy = {
    name: "Test Momentum Strategy",
    description: "A test strategy for validation",
    components: [
      {
        id: "rsi-1",
        type: "indicator",
        name: "RSI",
        category: "momentum",
        parameters: { period: 14 },
      },
      {
        id: "buy-condition-1",
        type: "condition",
        name: "RSI Oversold",
        category: "entry",
        parameters: { operator: "less_than", value: 30 },
      },
      {
        id: "buy-action-1",
        type: "action",
        name: "Market Buy",
        category: "entry",
        parameters: { percentage: 5 },
      },
    ],
    riskRules: [
      {
        id: "stop-loss-1",
        type: "stop_loss",
        parameters: { percentage: 5 },
      },
      {
        id: "position-size-1",
        type: "position_size",
        parameters: { maxPercentage: 10 },
      },
    ],
    symbols: ["AAPL", "MSFT"],
    timeframe: "1h",
  };

  try {
    const response = await axios.post(
      `${BASE_URL}/api/strategy-builder/strategies`,
      { userId: "test-user", ...testStrategy },
      { timeout: 10000 }
    );
    console.log(`✅ Strategy Creation: Status ${response.status}`);
    console.log(`   Created Strategy ID: ${response.data.id}\n`);
    return response.data.id;
  } catch (error) {
    console.log(`❌ Strategy Creation: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${JSON.stringify(error.response.data)}\n`);
    }
    return null;
  }
}

// Main test function
async function runTests() {
  console.log("🚀 Auto Trading System Test Suite\n");
  console.log("=".repeat(50) + "\n");

  await testAutoTradingAPIs();
  await testStrategyCreation();

  console.log("=".repeat(50));
  console.log("✨ Test suite completed!\n");
}

runTests().catch(console.error);
