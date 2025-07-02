#!/usr/bin/env node

const axios = require("axios");

async function testAutoTradingSessionStart() {
  console.log("🔍 Testing Auto-Trading Session Start Endpoint...\n");

  const BASE_URL = "http://localhost:8000";

  // Test 1: Check if backend is responding
  try {
    const healthCheck = await axios.get(`${BASE_URL}/health`);
    console.log("✅ Backend is accessible");
  } catch (error) {
    console.log("❌ Backend not accessible:", error.message);
    return;
  }

  // Test 2: Try to get a portfolio first to use valid portfolio_id
  let portfolioId = null;
  try {
    const portfoliosResponse = await axios.get(
      `${BASE_URL}/api/paper-trading/portfolios`
    );
    if (portfoliosResponse.data.length > 0) {
      portfolioId = portfoliosResponse.data[0].id.toString();
      console.log(`✅ Found portfolio ID: ${portfolioId}`);
    }
  } catch (error) {
    console.log("⚠️ Could not get portfolios, using test ID");
    portfolioId = "550e8400-e29b-41d4-a716-446655440000"; // Test UUID
  }

  // Test 3: Test the session start endpoint with proper data structure
  const testCases = [
    {
      name: "Valid session data",
      data: {
        portfolio_id: portfolioId,
        session_name: "Test Trading Session",
        config: {
          max_daily_trades: 10,
          max_position_size: 20,
          daily_loss_limit: 500,
          enable_risk_management: true,
          trading_hours: {
            start: "09:30",
            end: "16:00",
            timezone: "US/Eastern",
          },
          allowed_symbols: ["AAPL", "GOOGL"],
          excluded_symbols: [],
        },
      },
    },
    {
      name: "Minimal session data",
      data: {
        portfolio_id: portfolioId,
        config: {},
      },
    },
    {
      name: "Missing portfolio_id (should fail)",
      data: {
        session_name: "Test Session",
        config: {},
      },
    },
    {
      name: "Missing config (should fail)",
      data: {
        portfolio_id: portfolioId,
        session_name: "Test Session",
      },
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log("Payload:", JSON.stringify(testCase.data, null, 2));

    try {
      const response = await axios.post(
        `${BASE_URL}/api/auto-trading/sessions/start`,
        testCase.data,
        {
          headers: { "Content-Type": "application/json" },
          timeout: 10000,
        }
      );

      console.log(`✅ Success (${response.status}):`, {
        success: response.data.success,
        sessionId: response.data.data?.id,
        message: response.data.message,
      });
    } catch (error) {
      if (error.response) {
        console.log(`❌ HTTP ${error.response.status}:`, {
          success: error.response.data?.success,
          message: error.response.data?.message,
          details: error.response.data?.details,
        });
      } else {
        console.log(`❌ Request failed:`, error.message);
      }
    }
  }

  console.log("\n📋 Summary:");
  console.log("- The endpoint expects: portfolio_id (UUID), config (object)");
  console.log("- session_name is optional");
  console.log(
    "- Ensure your frontend sends data in the exact format shown above"
  );
}

testAutoTradingSessionStart().catch(console.error);
