const axios = require("axios");

const API_BASE_URL = "http://localhost:8000/api";

async function testAllPortfolioCreationScenarios() {
  console.log("Testing all portfolio creation scenarios...\n");

  const testCases = [
    {
      name: "PortfolioCreator scenario",
      data: {
        userId: "user-123",
        portfolioType: "DAY_TRADING_PRO",
        initialBalance: 50000,
      },
    },
    {
      name: "PortfolioList scenario",
      data: {
        userId: "user-123",
        portfolioType: "SMALL_ACCOUNT_BASIC",
        initialBalance: 100000,
      },
    },
    {
      name: "QuickTradeContent scenario",
      data: {
        userId: "user-123",
        portfolioType: "SMALL_ACCOUNT_BASIC",
        initialBalance: 10000,
      },
    },
    {
      name: "useTrade scenario",
      data: {
        userId: "user-123",
        portfolioType: "DAY_TRADING_STANDARD",
        initialBalance: 100000,
      },
    },
  ];

  for (const testCase of testCases) {
    try {
      console.log(`Testing ${testCase.name}...`);
      console.log("Data:", JSON.stringify(testCase.data, null, 2));

      const response = await axios.post(
        `${API_BASE_URL}/paper-trading/portfolios`,
        testCase.data
      );

      console.log("✅ SUCCESS - Portfolio created");
      console.log(`Portfolio ID: ${response.data.id}`);
      console.log(`Portfolio Type: ${response.data.portfolioType}`);
      console.log(`Initial Balance: $${response.data.initialCash}`);
      console.log("---");
    } catch (error) {
      console.error("❌ FAILED:", testCase.name);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Error:", error.response.data);
      } else {
        console.error("Error:", error.message);
      }
      console.log("---");
    }
  }

  console.log("🎉 All scenario tests completed");
}

testAllPortfolioCreationScenarios();
